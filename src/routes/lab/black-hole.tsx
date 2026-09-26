import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas, tempToColor } from "@/components/lab/useCanvas";
import { G, c, M_sun } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Compass,
  Rocket,
  Atom,
  Sparkles,
  Zap,
  HelpCircle,
  Thermometer,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { Tex } from "@/components/lab/Equation";
import {
  BLACK_HOLE_PRESETS,
  computeBlackHoleProperties,
  calculateISCO,
  calculateInfallTrajectory,
} from "@/lib/physics/blackhole";

export const Route = createFileRoute("/lab/black-hole")({
  head: () => labHead("black-hole"),
  component: BlackHole,
});

type SimMode = "lensing" | "infall" | "geodesic" | "thermodynamics";

function formatMassCompact(mass: number): string {
  if (mass >= 1e9) return `${(mass / 1e9).toFixed(1)}B M☉`;
  if (mass >= 1e6) return `${(mass / 1e6).toFixed(2)}M M☉`;
  if (mass >= 1e3) return `${(mass / 1e3).toFixed(0)}k M☉`;
  if (mass < 1e-4) return `${mass.toExponential(1)} M☉`;
  return `${mass.toFixed(1)} M☉`;
}

function BlackHole() {
  const [diff, setDiff] = useState<Difficulty>("Advanced");

  // Core Physical State
  const [M, setM] = useState(10); // Solar masses
  const [spin, setSpin] = useState(0.7); // Dimensionless Kerr spin a*
  const [inc, setInc] = useState(75); // Inclination in degrees
  const [Td, setTd] = useState(12000); // Inner disk temperature in K
  const [observerDistRg, setObserverDistRg] = useState(25); // In units of rg = GM/c^2
  const [viewMode, setViewMode] = useState<"relativistic" | "newtonian">("relativistic");
  const [showErgosphere, setShowErgosphere] = useState(true);
  const [running, setRunning] = useState(true);

  // Active Exploration Mode
  const [simMode, setSimMode] = useState<SimMode>("lensing");

  // Infall Experiment State
  const [infallR0, setInfallR0] = useState(18); // Starting drop radius in rg
  const [infallProgress, setInfallProgress] = useState(0.0); // 0 = start at r0, 1 = event horizon
  const [infallPlaying, setInfallPlaying] = useState(false);

  // Geodesic Impact Parameter
  const [impactB, setImpactB] = useState(5.5); // in rg (b_crit ≈ 5.196)

  // Compute analytical properties
  const bh = useMemo(() => computeBlackHoleProperties(M, spin), [M, spin]);

  // Current Infalling Probe status
  const currentProbeR_rg = infallR0 - infallProgress * (infallR0 - (bh.rH_m / bh.rg_m) * 1.002);
  const probeData = useMemo(
    () => calculateInfallTrajectory(M, infallR0, currentProbeR_rg),
    [M, infallR0, currentProbeR_rg],
  );

  // High-frequency animation ticker for Infalling Probe
  useEffect(() => {
    if (!infallPlaying) return;
    const interval = setInterval(() => {
      setInfallProgress((p) => {
        if (p >= 0.999) {
          setInfallPlaying(false);
          return 0.999;
        }
        // Free fall accelerates as r approaches the horizon
        const speed = 0.003 + 0.015 * Math.pow(p, 2);
        return Math.min(0.999, p + speed);
      });
    }, 25);
    return () => clearInterval(interval);
  }, [infallPlaying]);

  // Preset selector handler
  const loadPreset = (presetId: string) => {
    const p = BLACK_HOLE_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setM(p.massMsun);
    setSpin(p.spin);
    if (p.type === "supermassive") {
      setTd(6000);
      setInc(75);
    } else if (p.type === "primordial") {
      setTd(30000);
    } else {
      setTd(15000);
    }
    setInfallProgress(0);
    setInfallPlaying(false);
  };

  // Canvas visualizer with multi-mode rendering
  const ref = useCanvas((ctx, w, h, _dt, t) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const minDim = Math.min(w, h);
    const R0 = minDim * 0.08 * (25 / observerDistRg);

    // Dimensionless scale: 1 rg = R0 pixels
    const pxPerRg = R0;
    const rsPx = 2 * pxPerRg;
    const rHPx = (bh.rH_m / bh.rg_m) * pxPerRg;
    const rPhotonPx = 3 * pxPerRg;
    const iscoPx = bh.isco_rg * pxPerRg;

    // Background starfield with Einstein deflection
    for (let i = 0; i < 200; i++) {
      const a = (i * 2.399) % (2 * Math.PI);
      const d0 = ((i * 101) % (minDim * 0.7)) + 12;
      // Relativistic Einstein angle deflection
      const d = viewMode === "relativistic" ? d0 + (R0 * R0 * 3.8) / (d0 + 5) : d0;
      const alpha = 0.2 + ((i * 17) % 7) / 10;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.2, 1.2);
    }

    const animT = running ? t : 0;

    // =========================================================================
    // MODE 1: LENSED ACCRETION DISK (INTERSTELLAR / EHT VIEW)
    // =========================================================================
    if (simMode === "lensing") {
      const cosi = Math.cos((inc * Math.PI) / 180);
      const sini = Math.sin((inc * Math.PI) / 180);
      const rinPx = viewMode === "relativistic" ? iscoPx : pxPerRg * 1.5;
      const routPx = pxPerRg * 8.5;

      // 1.1 Ergosphere Frame-Dragging Region (Kerr only)
      if (showErgosphere && spin > 0.05 && viewMode === "relativistic") {
        ctx.save();
        ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
        ctx.strokeStyle = "rgba(192, 132, 252, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Oblate shape of static limit: r_static(theta) = rg * (1 + sqrt(1 - a^2 cos^2 theta))
        ctx.ellipse(
          cx,
          cy,
          2 * pxPerRg,
          (1 + Math.sqrt(1 - spin * spin)) * pxPerRg,
          0,
          0,
          2 * Math.PI,
        );
        ctx.fill();
        ctx.stroke();

        // Frame-dragging rotation swirl arrows
        ctx.strokeStyle = "rgba(192, 132, 252, 0.5)";
        ctx.lineWidth = 1;
        for (let a = 0; a < 4; a++) {
          const ang = (a / 4) * 2 * Math.PI + animT * 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.8 * pxPerRg, ang, ang + 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 1.2 Accretion Disk Rendering with Relativistic Doppler Beaming
      const drawAccretionDisk = (drawBackHalf: boolean) => {
        const stepR = 3;
        for (let r = routPx; r >= rinPx; r -= stepR) {
          const rFrac = rinPx / r;
          const localTemp = Td * Math.pow(rFrac, 0.75);

          for (let k = 0; k < 72; k++) {
            const phi = (k / 72) * Math.PI * 2 + animT * 0.9 * Math.pow(rFrac, 1.5);
            const sinPhi = Math.sin(phi);

            // Separate back and front portions
            if (drawBackHalf ? sinPhi > 0 : sinPhi <= 0) continue;

            // Orbital line-of-sight velocity for Doppler factor
            const vOrbital = Math.sqrt(rinPx / (2 * r));
            const vLOS = -Math.cos(phi) * sini * vOrbital; // Negative = approaching us

            // Relativistic Doppler beaming factor: D = 1 / [gamma * (1 - vLOS)]
            const gamma = 1 / Math.sqrt(Math.max(0.01, 1 - vOrbital * vOrbital));
            const dopplerFactor = viewMode === "relativistic" ? 1 / (gamma * (1 - vLOS)) : 1.0;
            const beamingIntensity = Math.pow(dopplerFactor, 3.5);

            // Gravitational redshift factor
            const gravRedshift =
              viewMode === "relativistic" ? Math.sqrt(Math.max(0.05, 1 - (2 * pxPerRg) / r)) : 1.0;

            const effectiveTemp = localTemp * dopplerFactor * gravRedshift;
            const col = tempToColor(Math.min(45000, Math.max(1500, effectiveTemp)));

            // Secondary gravitational lensing: back of the disk bends over the top and bottom of the event horizon
            let yOffset = sinPhi * r * cosi;
            if (drawBackHalf && viewMode === "relativistic") {
              const lensDistortion = pxPerRg * 1.5 * (1 - cosi) * Math.pow(rFrac, 0.85);
              yOffset -= lensDistortion;
            }

            ctx.fillStyle = col
              .replace("rgb", "rgba")
              .replace(")", `,${Math.min(1, 0.18 * beamingIntensity)})`);

            ctx.fillRect(cx + Math.cos(phi) * r, cy + yOffset, 3.2, 3.2);
          }
        }
      };

      // Draw back of disk first (so horizon covers it)
      drawAccretionDisk(true);

      // 1.3 Gravitational Lensing Halo (Secondary Image looping over top/bottom)
      if (viewMode === "relativistic") {
        ctx.save();
        // Upper lensed arc
        ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(cx, cy - rHPx * 0.35, rHPx * 1.6, rHPx * 1.25, 0, Math.PI, 2 * Math.PI);
        ctx.stroke();

        // Lower lensed arc
        ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy + rHPx * 0.35, rHPx * 1.5, rHPx * 1.15, 0, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // 1.4 Photon Ring (Unstable circular photon orbits at 1.5 rs)
      if (viewMode === "relativistic") {
        ctx.strokeStyle = "rgba(255, 235, 180, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rPhotonPx * 0.98, 0, 2 * Math.PI);
        ctx.stroke();

        // Diffuse photon sphere glow
        const gPhot = ctx.createRadialGradient(cx, cy, rHPx, cx, cy, rPhotonPx * 1.2);
        gPhot.addColorStop(0, "rgba(255, 230, 150, 0)");
        gPhot.addColorStop(0.7, "rgba(255, 200, 100, 0.3)");
        gPhot.addColorStop(1, "rgba(255, 200, 100, 0)");
        ctx.fillStyle = gPhot;
        ctx.beginPath();
        ctx.arc(cx, cy, rPhotonPx * 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 1.5 The Black Hole Event Horizon Shadow (Complete Dark Silhouette)
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cx, cy, viewMode === "relativistic" ? rHPx : 4, 0, 2 * Math.PI);
      ctx.fill();

      if (viewMode === "relativistic") {
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw front of disk (passes in front of the horizon)
      drawAccretionDisk(false);
    }

    // =========================================================================
    // MODE 2: INFALLING PROBE & CLOCK DROP EXPERIMENT
    // =========================================================================
    else if (simMode === "infall") {
      // 2.1 Static Metric Grid & Circles
      // Event Horizon
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cx, cy, rHPx, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Photon Sphere
      ctx.strokeStyle = "rgba(255, 210, 120, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, rPhotonPx, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // ISCO boundary
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, iscoPx, 0, 2 * Math.PI);
      ctx.stroke();

      // Drop Radius r0
      const r0Px = infallR0 * pxPerRg;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r0Px, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2.2 Infalling Probe Position
      const curProbeRPx = currentProbeR_rg * pxPerRg;
      const probeAngle = -Math.PI / 4; // 45-degree trajectory
      const probeX = cx + Math.cos(probeAngle) * curProbeRPx;
      const probeY = cy + Math.sin(probeAngle) * curProbeRPx;

      // Trajectory line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(probeAngle) * r0Px, cy + Math.sin(probeAngle) * r0Px);
      ctx.lineTo(probeX, probeY);
      ctx.stroke();

      // Probe color shifted by Gravitational Redshift (1 + z)
      const zFactor = probeData.redshift_z;
      let beaconColor = "#38bdf8"; // Blue at infinity
      if (zFactor > 0.15) beaconColor = "#34d399"; // Green
      if (zFactor > 0.45) beaconColor = "#fbbf24"; // Amber
      if (zFactor > 1.2) beaconColor = "#f43f5e"; // Crimson
      if (zFactor > 6.0) beaconColor = "#9333ea"; // Near-IR
      if (zFactor > 25.0) beaconColor = "#334155"; // Extinguished / radio blackout

      // Spaghettification stretching effect on the probe shape
      const stretchFactor = Math.min(8, 1 + probeData.tidal_g / 60);
      ctx.save();
      ctx.translate(probeX, probeY);
      ctx.rotate(probeAngle);

      // Redshifted beacon glow
      const gProbe = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
      gProbe.addColorStop(0, beaconColor);
      gProbe.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gProbe;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Elongated body representing tidal stretching
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 5 * stretchFactor, 3.5 / Math.sqrt(stretchFactor), 0, 0, 2 * Math.PI);
      ctx.fill();

      // Tidal force vector arrows (tensile stretch outward along radial vector, compressive squeeze inward laterally)
      if (probeData.tidal_g > 2) {
        ctx.strokeStyle = probeData.isLethalTidal ? "#f43f5e" : "#34d399";
        ctx.lineWidth = 1.5;
        // Radial stretch arrows
        ctx.beginPath();
        ctx.moveTo(6 * stretchFactor, 0);
        ctx.lineTo(6 * stretchFactor + 12, 0);
        ctx.moveTo(-6 * stretchFactor, 0);
        ctx.lineTo(-6 * stretchFactor - 12, 0);
        ctx.stroke();

        // Lateral squeeze arrows
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, 4);
        ctx.moveTo(0, -10);
        ctx.lineTo(0, -4);
        ctx.stroke();
      }
      ctx.restore();

      // Radiated communication pulses traveling to outside observer with wavelength stretching
      const pulseCount = 5;
      for (let p = 0; p < pulseCount; p++) {
        const pulseProgress = (animT * 0.7 + p / pulseCount) % 1;
        // Wavelength increases as pulse climbs up gravitational potential well
        const pulseR = curProbeRPx + Math.pow(pulseProgress, 0.85) * (r0Px * 1.35 - curProbeRPx);
        const waveZ = probeData.redshift_z * (1 - pulseProgress);
        let waveCol = beaconColor;
        if (waveZ < 0.2) waveCol = "#38bdf8";
        else if (waveZ < 0.6) waveCol = "#fbbf24";
        else if (waveZ < 2.0) waveCol = "#f43f5e";

        ctx.strokeStyle = waveCol;
        ctx.lineWidth = Math.max(1, 2.5 * (1 - pulseProgress));
        ctx.globalAlpha = Math.max(0, (1 - pulseProgress) * 0.75);
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, probeAngle - 0.28, probeAngle + 0.28);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Labels on canvas
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "11px JetBrains Mono";
      ctx.fillText(
        `Event Horizon (r = ${bh.rH_m > 0 ? (bh.rH_m / 1000).toFixed(1) : 0} km)`,
        cx - 80,
        cy + rHPx + 18,
      );
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`Photon Sphere (3 rg)`, cx + rPhotonPx + 6, cy - 6);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`ISCO (${bh.isco_rg.toFixed(2)} rg)`, cx + iscoPx + 6, cy + 12);

      // =======================================================================
      // IMPLICIT HUD 1: THE DUAL TIME EXPERIMENT (FROZEN STAR PARADOX)
      // =======================================================================
      const hudW = Math.min(260, w * 0.42);
      const hudX = w - hudW - 14;
      const hudY = 14;

      ctx.save();
      ctx.fillStyle = "rgba(10, 15, 29, 0.88)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudW, 90, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 10px JetBrains Mono";
      ctx.fillText("⏱️ DUAL CLOCKS (FROZEN STAR PARADOX)", hudX + 10, hudY + 16);

      // Earth Clock
      const isFrozen = currentProbeR_rg <= 2.05 || probeData.redshift_z > 50;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "11px JetBrains Mono";
      ctx.fillText("Distant Earth (t):", hudX + 10, hudY + 34);
      ctx.fillStyle = isFrozen ? "#f43f5e" : "#38bdf8";
      ctx.font = "bold 11px JetBrains Mono";
      ctx.fillText(
        isFrozen ? "FROZEN! (t → ∞)" : `${(probeData.tDistant_s * 1000).toFixed(1)} ms`,
        hudX + 130,
        hudY + 34,
      );

      // Probe Clock
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "11px JetBrains Mono";
      ctx.fillText("Probe Wristwatch (τ):", hudX + 10, hudY + 52);
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 11px JetBrains Mono";
      ctx.fillText(`${(probeData.tau_s * 1000).toFixed(1)} ms (Finite)`, hudX + 130, hudY + 52);

      // Dynamic Intuition Subtitle
      ctx.fillStyle = "rgba(160, 185, 220, 0.85)";
      ctx.font = "9px JetBrains Mono";
      ctx.fillText(
        isFrozen
          ? "👉 Earth sees probe freeze; probe crosses smoothly!"
          : `👉 1s on probe = ${probeData.dt_dtau.toFixed(1)}s on Earth`,
        hudX + 10,
        hudY + 76,
      );
      ctx.restore();

      // =======================================================================
      // IMPLICIT HUD 2: GRAVITATIONAL REDSHIFT SPECTRUM
      // =======================================================================
      const specX = 14;
      const specY = 56;
      const specW = Math.min(270, w * 0.44);

      ctx.save();
      ctx.fillStyle = "rgba(10, 15, 29, 0.88)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(specX, specY, specW, 68, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 10px JetBrains Mono";
      ctx.fillText("🌈 GRAVITATIONAL REDSHIFT (1 + z)", specX + 10, specY + 16);

      // Spectrum color bar
      const barX = specX + 10;
      const barY = specY + 24;
      const barW = specW - 20;
      const barH = 10;

      const gradSpec = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      gradSpec.addColorStop(0, "#38bdf8"); // Blue (450nm)
      gradSpec.addColorStop(0.25, "#34d399"); // Green
      gradSpec.addColorStop(0.45, "#fbbf24"); // Amber
      gradSpec.addColorStop(0.65, "#f43f5e"); // Crimson
      gradSpec.addColorStop(0.85, "#7e22ce"); // Near-IR
      gradSpec.addColorStop(1, "#0f172a"); // Radio blackout

      ctx.fillStyle = gradSpec;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(barX, barY, barW, barH);

      // Current position indicator marker
      const specNorm = Math.min(1, Math.log10(1 + probeData.redshift_z) / 1.6);
      const markerX = barX + specNorm * barW;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(markerX - 4, barY + barH + 6);
      ctx.lineTo(markerX + 4, barY + barH + 6);
      ctx.lineTo(markerX, barY + barH);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "9px JetBrains Mono";
      ctx.fillText(`Received: ${probeData.spectralBand}`, specX + 10, specY + 54);
      ctx.restore();

      // =======================================================================
      // IMPLICIT HUD 3: SPAGHETTIFICATION & 1/M² LAW
      // =======================================================================
      const botW = Math.min(320, w * 0.55);
      const botX = 14;
      const botY = h - 68;

      ctx.save();
      ctx.fillStyle = "rgba(10, 15, 29, 0.88)";
      ctx.strokeStyle = probeData.isLethalTidal
        ? "rgba(244, 63, 94, 0.5)"
        : "rgba(52, 211, 153, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(botX, botY, botW, 56, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = probeData.isLethalTidal ? "#f43f5e" : "#34d399";
      ctx.font = "bold 10px JetBrains Mono";
      ctx.fillText(
        probeData.isLethalTidal
          ? `⚠️ SPAGHETTIFICATION: ${probeData.tidal_g > 1e6 ? "> 10⁶ g" : `${probeData.tidal_g.toFixed(0)} g`} (FATAL)`
          : `🛡️ SPAGHETTIFICATION: ${probeData.tidal_g.toFixed(2)} g (SURVIVABLE)`,
        botX + 10,
        botY + 16,
      );

      ctx.fillStyle = "rgba(160, 185, 220, 0.85)";
      ctx.font = "9px JetBrains Mono";
      ctx.fillText(
        M >= 1e6
          ? "👉 1/M² Law: Giant horizon keeps tidal gravity gentle (< 15g)!"
          : "👉 1/M² Law: Tiny stellar horizon creates lethal tidal stress!",
        botX + 10,
        botY + 32,
      );

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Tensile stretch along radial / lateral squeeze", botX + 10, botY + 46);
      ctx.restore();
    }

    // =========================================================================
    // MODE 3: PHOTON GEODESIC DEFLECTION
    // =========================================================================
    else if (simMode === "geodesic") {
      // Event Horizon & Photon Sphere
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cx, cy, rHPx, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 210, 120, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rPhotonPx, 0, 2 * Math.PI);
      ctx.stroke();

      // Impact parameter guideline
      const bCritPx = bh.bCrit_rg * pxPerRg;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-w, cy - bCritPx);
      ctx.lineTo(w, cy - bCritPx);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ray family: trace multiple rays centered around user impact parameter
      const offsets = [-2.5, -1.2, 0, 1.2, 2.5];
      offsets.forEach((off) => {
        const curB = impactB + off * 0.35;
        const isSelected = off === 0;

        let rx = -w * 0.48;
        let ry = -curB * pxPerRg;
        let rvx = 1.0;
        let rvy = 0.0;
        const dtRay = 0.4;

        ctx.strokeStyle =
          curB < bh.bCrit_rg
            ? isSelected
              ? "#ef4444"
              : "rgba(239, 68, 68, 0.4)"
            : Math.abs(curB - bh.bCrit_rg) < 0.2
              ? isSelected
                ? "#fbbf24"
                : "rgba(251, 191, 36, 0.4)"
              : isSelected
                ? "#38bdf8"
                : "rgba(56, 189, 248, 0.4)";

        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + rx, cy + ry);

        let captured = false;
        for (let s = 0; s < 180; s++) {
          const dist2 = rx * rx + ry * ry;
          const dist = Math.sqrt(dist2);

          if (dist < rHPx * 1.02) {
            captured = true;
            break;
          }

          // General Relativistic Effective Potential Force
          // a = -3 * (GM/c^2) * (L^2 / r^5)
          const bend =
            (pxPerRg * 2.5) / (dist2 * dist + 1e-4) +
            (3 * Math.pow(curB * pxPerRg, 2)) / (dist2 * dist2 * dist + 1e-4);
          rvx -= bend * rx * dtRay;
          rvy -= bend * ry * dtRay;

          const vMag = Math.hypot(rvx, rvy);
          rvx /= vMag;
          rvy /= vMag;

          rx += rvx * 8;
          ry += rvy * 8;

          ctx.lineTo(cx + rx, cy + ry);
          if (rx > w * 0.5 || Math.abs(ry) > h * 0.6) break;
        }
        ctx.stroke();

        if (isSelected) {
          ctx.fillStyle = captured ? "#ef4444" : "#38bdf8";
          ctx.font = "11px JetBrains Mono";
          ctx.fillText(
            `Impact b = ${curB.toFixed(2)} rg (${captured ? "CAPTURED INTO HORIZON" : "LENS DEFLECTED"})`,
            14,
            h - 18,
          );
        }
      });
    }

    // =========================================================================
    // MODE 4: THERMODYNAMICS & HAWKING RADIATION
    // =========================================================================
    else if (simMode === "thermodynamics") {
      // Event Horizon
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cx, cy, rHPx, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Virtual particle-antiparticle pairs spontaneous creation
      for (let p = 0; p < 18; p++) {
        const ang = (p / 18) * 2 * Math.PI + animT * 0.4;
        const rSpawn = rHPx * (1 + 0.15 * Math.sin(p * 7 + animT * 2));
        const px = cx + Math.cos(ang) * rSpawn;
        const py = cy + Math.sin(ang) * rSpawn;

        // Escaping Hawking radiation photon / positive energy particle
        const escDist = 20 + 40 * ((animT * 2 + p) % 1);
        const escX = px + Math.cos(ang) * escDist;
        const escY = py + Math.sin(ang) * escDist;

        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(escX, escY, 2, 0, 2 * Math.PI);
        ctx.fill();

        // Infalling negative energy partner particle falling into horizon
        const fallX = px - Math.cos(ang) * 8 * ((animT * 2 + p) % 1);
        const fallY = py - Math.sin(ang) * 8 * ((animT * 2 + p) % 1);

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(fallX, fallY, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "12px JetBrains Mono";
      ctx.fillText(
        `Hawking Temp T_H = ${bh.hawkingTemp_K.toExponential(3)} K`,
        cx - 110,
        cy - rHPx - 24,
      );
      ctx.fillStyle = "rgba(160, 185, 220, 0.85)";
      ctx.font = "11px JetBrains Mono";
      ctx.fillText(
        `Thermal Power = ${bh.hawkingLuminosity_W.toExponential(3)} W`,
        cx - 90,
        cy - rHPx - 8,
      );
    }

    // Top HUD Telemetry
    ctx.fillStyle = "rgba(220, 230, 250, 0.95)";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(
      `M = ${M.toExponential(2)} M☉  |  SPIN a* = ${spin.toFixed(3)}  |  r_s = ${(bh.rs_m / 1000).toFixed(1)} km`,
      14,
      24,
    );
    ctx.fillStyle = "rgba(160, 185, 220, 0.8)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(`MODE: ${simMode.toUpperCase()}  |  FRAME: ${viewMode.toUpperCase()}`, 14, 42);
  });

  // Chart data for Probe Infall: Coordinate Time vs Proper Time
  const timeComparisonCurve = useMemo(() => {
    const pts: { x: number; t_distant: number; tau_proper: number }[] = [];
    const rStart = 20;
    for (let i = 0; i < 80; i++) {
      const rVal = rStart - (i / 79) * (rStart - 2.005);
      const res = calculateInfallTrajectory(M, rStart, rVal);
      pts.push({
        x: +rVal.toFixed(2),
        t_distant: Math.min(100, res.tDistant_s * 1e4),
        tau_proper: res.tau_s * 1e4,
      });
    }
    return pts;
  }, [M]);

  // Chart data for Tidal Force Spaghettification vs Radius
  const tidalCurve = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let rVal = 2.05; rVal <= 20; rVal += 0.25) {
      const res = calculateInfallTrajectory(M, 20, rVal);
      pts.push({ x: +rVal.toFixed(2), y: Math.min(1e5, res.tidal_g) });
    }
    return pts;
  }, [M]);

  const context = useMemo(
    () => ({
      simulationId: "black-hole",
      simulationName: "Black Hole (General Relativity)",
      parameters: {
        mass_Msun: M,
        spin: spin,
        inclination_deg: inc,
        diskTemp_K: Td,
        viewMode: viewMode,
        distance_rg: observerDistRg,
        mode: simMode,
      },
      measurements: {
        schwarzschildRadius_km: +(bh.rs_m / 1000).toFixed(3),
        horizon_km: +(bh.rH_m / 1000).toFixed(3),
        isco_km: +(bh.isco_m / 1000).toFixed(3),
        iscoFrequency_Hz: +bh.fISCO_Hz.toPrecision(4),
        gravitationalTimescale_s: +bh.tauG_s.toExponential(3),
        orbitalVelocity_ISCO_c: +bh.vIscoFrac.toFixed(3),
        hawkingTemperature_K: +bh.hawkingTemp_K.toExponential(3),
        evaporationTime_yr: +bh.tEvap_yr.toExponential(3),
        infallRedshift_z: +probeData.redshift_z.toFixed(2),
        infallTidal_g: +probeData.tidal_g.toFixed(1),
      },
      notes: [
        `Mode: ${simMode}.`,
        viewMode === "relativistic"
          ? "General relativistic Kerr metric active with gravitational lensing, ISCO plunge boundary, and frame dragging."
          : "Newtonian point mass approximation.",
      ],
      series: {
        timeDilation: timeComparisonCurve.map((p) => ({ x: p.x, y: p.t_distant })),
        tidalForce: tidalCurve,
      },
    }),
    [
      M,
      spin,
      inc,
      Td,
      viewMode,
      observerDistRg,
      simMode,
      bh,
      probeData,
      timeComparisonCurve,
      tidalCurve,
    ],
  );

  return (
    <LabLayout
      simulationId="black-hole"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button size="sm" variant="lab" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button
            size="sm"
            variant="lab"
            onClick={() => {
              setM(10);
              setSpin(0.7);
              setInc(75);
              setObserverDistRg(25);
              setInfallProgress(0);
              setInfallPlaying(false);
            }}
          >
            <RotateCcw className="size-3" /> Reset
          </Button>

          {/* Mode Switcher */}
          <div className="flex rounded-md border bg-card/60 p-0.5">
            {(
              [
                { id: "lensing", label: "Lensed Disk", icon: Eye },
                { id: "infall", label: "Probe Infall", icon: Rocket },
                { id: "geodesic", label: "Photon Rays", icon: Compass },
                { id: "thermodynamics", label: "Hawking", icon: Atom },
              ] as const
            ).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSimMode(m.id)}
                  className={`flex items-center gap-1 rounded-sm px-2.5 py-1 font-mono text-xs transition-colors ${
                    simMode === m.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Relativistic vs Newtonian Switch */}
          <div className="flex items-center gap-2 pl-2 ml-auto">
            <Switch
              id="rel-mode"
              checked={viewMode === "relativistic"}
              onCheckedChange={(checked) => setViewMode(checked ? "relativistic" : "newtonian")}
            />
            <Label
              htmlFor="rel-mode"
              className="font-mono text-xs cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="size-3 text-cyan" />
              {viewMode === "relativistic" ? "Einstein GR" : "Newtonian"}
            </Label>
          </div>
        </>
      }
      controls={
        <div className="space-y-4">
          {/* Preset Selector */}
          <Panel title="Famous Black Hole Presets">
            <div className="space-y-1.5">
              {BLACK_HOLE_PRESETS.map((p) => {
                const isSelected =
                  Math.abs(M - p.massMsun) / Math.max(1e-19, p.massMsun) < 0.05 &&
                  Math.abs(spin - p.spin) < 0.02;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadPreset(p.id)}
                    className={`w-full rounded-md border p-2 text-left transition-colors flex items-center justify-between gap-2 overflow-hidden ${
                      isSelected
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-card/80 text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold truncate text-foreground">
                          {p.name}
                        </span>
                        <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 text-[9px] font-mono font-medium text-muted-foreground uppercase">
                          {p.type === "supermassive"
                            ? "SMBH"
                            : p.type === "primordial"
                              ? "PBH"
                              : "Stellar"}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                        {formatMassCompact(p.massMsun)} · a*={p.spin.toFixed(2)} ·{" "}
                        {p.distanceLightYears}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Controls tailored to current mode */}
          <Panel title="Spacetime & Geometry Parameters">
            <div className="space-y-4">
              <Param
                label="Black Hole Mass"
                value={M}
                min={1e-19}
                max={1e10}
                log
                unit="M☉"
                onChange={setM}
                hint="Stellar (3-100), Supermassive (10⁶-10¹⁰), or Primordial (<10⁻¹⁵)."
              />
              <Param
                label="Kerr Spin Parameter a*"
                value={spin}
                min={-0.998}
                max={0.998}
                step={0.002}
                onChange={setSpin}
                hint="0 = Schwarzschild; +0.998 = Extremal Kerr (prograde disk); -0.998 = Retrograde."
              />

              {simMode === "lensing" && (
                <>
                  <Param
                    label="Disk Inclination"
                    value={inc}
                    min={0}
                    max={89}
                    step={1}
                    unit="°"
                    onChange={setInc}
                    hint="0° = face-on; 75° = iconic Interstellar edge view; 89° = pure grazing edge."
                  />
                  <Param
                    label="Inner Disk Temperature"
                    value={Td}
                    min={2000}
                    max={40000}
                    step={250}
                    unit="K"
                    onChange={setTd}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <Label htmlFor="erg-toggle" className="font-mono text-xs text-muted-foreground">
                      Show Kerr Ergosphere Frame-Dragging:
                    </Label>
                    <Switch
                      id="erg-toggle"
                      checked={showErgosphere}
                      onCheckedChange={setShowErgosphere}
                    />
                  </div>
                </>
              )}

              {simMode === "infall" && (
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">
                      Infalling Probe Drop Experiment
                    </span>
                    <Button
                      size="sm"
                      variant={infallPlaying ? "destructive" : "glow"}
                      onClick={() => setInfallPlaying(!infallPlaying)}
                      className="font-mono text-xs h-7"
                    >
                      {infallPlaying ? "Hold Plunge" : "Release Probe"}
                    </Button>
                  </div>

                  {/* Quick Compare 1/M^2 Law Buttons */}
                  <div className="rounded-md border bg-background/50 p-2 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                      <span>⚡ 1/M² Tidal Stress Demonstration:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        variant={M < 100 ? "destructive" : "outline"}
                        className="text-[10px] h-7 px-1.5 truncate"
                        onClick={() => {
                          setM(10);
                          setInfallProgress(0.9);
                        }}
                      >
                        10 M☉ Stellar (Fatal)
                      </Button>
                      <Button
                        size="sm"
                        variant={M >= 1e6 ? "default" : "outline"}
                        className="text-[10px] h-7 px-1.5 truncate"
                        onClick={() => {
                          setM(4.15e6);
                          setInfallProgress(0.9);
                        }}
                      >
                        4.15M M☉ Sgr A* (Safe)
                      </Button>
                    </div>
                    <div className="text-[10px] text-muted-foreground/90 font-sans">
                      {M >= 1e6
                        ? "✅ Supermassive: At r = r_s, tidal forces scale as 1/M²! With a massive horizon, tidal forces are gentle (< 0.1g)."
                        : "⚠️ Stellar-Mass: With a tiny 30 km horizon, tidal stress exceeds 100,000g, fatally spaghettifying any human body."}
                    </div>
                  </div>

                  <Param
                    label="Drop Radius r0"
                    value={infallR0}
                    min={4}
                    max={30}
                    step={1}
                    unit="rg"
                    onChange={setInfallR0}
                  />
                  <Param
                    label="Infall Progress (r0 → r+)"
                    value={infallProgress}
                    min={0}
                    max={0.999}
                    step={0.001}
                    onChange={(val) => {
                      setInfallProgress(val);
                      setInfallPlaying(false);
                    }}
                    format={(v) => `${(v * 100).toFixed(1)}%`}
                    hint="Drag to scrub the plunge toward the Event Horizon."
                  />
                </div>
              )}

              {simMode === "geodesic" && (
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Param
                    label="Photon Impact Parameter (b)"
                    value={impactB}
                    min={2.0}
                    max={12.0}
                    step={0.05}
                    unit="rg"
                    onChange={setImpactB}
                    hint="Critical capture boundary is b_crit = 3√3 rg ≈ 5.196 rg."
                  />
                </div>
              )}
            </div>
          </Panel>
        </div>
      }
      side={
        <div className="space-y-4">
          <Panel title="Relativistic Horizons & Metrics">
            <Readout
              label="Schwarzschild Radius (r_s)"
              value={bh.rs_m / 1000}
              unit="km"
              tone="cyan"
            />
            <Readout
              label="Outer Event Horizon (r+)"
              value={bh.rH_m / 1000}
              unit="km"
              tone="violet"
            />
            <Readout
              label="Photon Sphere (1.5 r_s)"
              value={bh.photonSphere_m / 1000}
              unit="km"
              tone="amber"
            />
            <Readout label="ISCO Orbit (r_ISCO)" value={bh.isco_m / 1000} unit="km" tone="rose" />
            <Readout label="ISCO in units of GM/c²" value={bh.isco_rg.toFixed(2)} unit="rg" />
            <Readout
              label="Orbital Velocity at ISCO"
              value={`${(bh.vIscoFrac * 100).toFixed(1)} % c`}
            />
            <Readout
              label="Accretion Efficiency (η)"
              value={`${(bh.efficiency * 100).toFixed(1)} %`}
              tone="emerald"
            />
          </Panel>

          {simMode === "infall" && (
            <Panel title="Infalling Observer Telemetry">
              <Readout
                label="Current Probe Distance"
                value={currentProbeR_rg.toFixed(2)}
                unit="rg"
                tone="cyan"
              />
              <Readout
                label="Distant Earth Time (t)"
                value={
                  currentProbeR_rg <= 2.05 || probeData.redshift_z > 50
                    ? "Frozen (t → ∞)"
                    : `${(probeData.tDistant_s * 1000).toFixed(1)} ms`
                }
                tone={currentProbeR_rg <= 2.05 ? "rose" : "cyan"}
              />
              <Readout
                label="Probe Wristwatch (τ)"
                value={`${(probeData.tau_s * 1000).toFixed(1)} ms (Smooth)`}
                tone="emerald"
              />
              <Readout
                label="Time Dilation (dt/dτ)"
                value={
                  probeData.dt_dtau > 100
                    ? "> 100× slower"
                    : `${probeData.dt_dtau.toFixed(1)}× slower`
                }
                tone="amber"
              />
              <Readout
                label="Received Signal Wavelength"
                value={probeData.spectralBand}
                tone={probeData.redshift_z > 2 ? "rose" : "amber"}
              />
              <Readout
                label="Radial Tidal Acceleration"
                value={probeData.tidal_g > 1e6 ? "> 10⁶ g" : `${probeData.tidal_g.toFixed(1)} g`}
                tone={probeData.isLethalTidal ? "rose" : "emerald"}
              />
              <Readout
                label="Human Spaghettification"
                value={probeData.isLethalTidal ? "FATAL (Torn apart)" : "Safe (< 15g)"}
                tone={probeData.isLethalTidal ? "rose" : "emerald"}
              />
            </Panel>
          )}

          {simMode === "thermodynamics" && (
            <Panel title="Hawking Thermodynamics">
              <Readout
                label="Hawking Temp (T_H)"
                value={bh.hawkingTemp_K.toExponential(2)}
                unit="K"
                tone="amber"
              />
              <Readout
                label="Thermal Radiation Power"
                value={bh.hawkingLuminosity_W.toExponential(2)}
                unit="W"
              />
              <Readout
                label="Total Evaporation Time"
                value={bh.tEvap_yr.toExponential(2)}
                unit="yr"
                tone="violet"
              />
              <Readout
                label="Bekenstein Entropy"
                value={bh.entropy_kB.toExponential(2)}
                unit="k_B"
              />
            </Panel>
          )}
        </div>
      }
      equations={[
        {
          name: "Schwarzschild radius",
          latex:
            "r_s = \\frac{2GM}{c^2} \\approx 2.95\\left(\\frac{M}{M_\\odot}\\right)\\,\\text{km}",
          symbols: [
            { symbol: "M", meaning: "black hole mass", unit: "kg" },
            { symbol: "c", meaning: "speed of light", unit: "m/s" },
          ],
          kind: "exact",
        },
        {
          name: "Kerr event horizon",
          latex: "r_+ = \\frac{GM}{c^2}\\left(1 + \\sqrt{1 - a_*^2}\\right)",
          symbols: [
            { symbol: "a_*", meaning: "dimensionless angular momentum parameter (-1 to +1)" },
          ],
          kind: "exact",
        },
        {
          name: "Photon sphere & shadow diameter",
          latex:
            "r_{\\text{ph}} = 3\\,\\frac{GM}{c^2} = 1.5\\,r_s, \\quad b_{\\text{crit}} = 3\\sqrt{3}\\,\\frac{GM}{c^2} \\approx 5.196\\,r_g",
          symbols: [
            { symbol: "b_{\\text{crit}}", meaning: "critical impact parameter for capture" },
          ],
          kind: "exact",
        },
        {
          name: "Hawking temperature",
          latex:
            "T_H = \\frac{\\hbar c^3}{8\\pi G M k_B} \\approx 6.17 \\times 10^{-8} \\left(\\frac{M_\\odot}{M}\\right)\\,\\text{K}",
          symbols: [
            { symbol: "T_H", meaning: "blackbody Hawking radiation temperature", unit: "K" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Vacuum solution of Einstein's field equations outside the event horizon (Kerr & Schwarzschild metrics)",
        "Ray-marched null geodesic deflection with exact Bardeen-Petterson ISCO boundary",
        "Radial test particle geodesic equations for infalling clock time dilation and spaghettification",
      ]}
      physicsNotes={[
        "Why nothing ever crosses in coordinate time: To a distant telescope, signals from an infalling probe are redshifted to infinite wavelength and delayed to t → ∞. However, in the probe's own proper frame (τ), it crosses the event horizon in a finite handful of milliseconds!",
        "Tidal forces & Spaghettification: Tidal stress scales inversely with M². For a 10 M☉ black hole, tidal forces kill an astronaut hundreds of kilometers outside the horizon. But for a 10⁹ M☉ supermassive black hole, tidal forces at the horizon are gentler than Earth's gravity!",
        "Relativistic Doppler Beaming: Gas orbiting the black hole near the speed of light beams its radiation forward along its direction of motion. This is why the left side of the accretion disk appears so much brighter than the receding right side in real EHT images.",
      ]}
    >
      <Panel className="p-0">
        <canvas
          ref={ref}
          className="h-[430px] w-full"
          aria-label="Interactive black hole simulation canvas"
        />
      </Panel>

      {/* EDUCATIONAL ANATOMY & PHENOMENA DROPOUT ACCORDIONS */}
      <Panel title="The Physics of Black Holes — Interactive Learning Modules">
        <Accordion type="multiple" className="w-full space-y-2 font-mono text-xs">
          {/* Module 1: Anatomy */}
          <AccordionItem value="anatomy" className="rounded-lg border bg-card/60 px-3">
            <AccordionTrigger className="hover:no-underline py-2.5">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span className="font-semibold text-xs text-foreground">
                  1. The Anatomy of a Black Hole: From Singularity to Ergosphere
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3 font-sans text-xs text-muted-foreground border-t border-border/40 mt-1">
              <p>
                A black hole is not a solid sphere, but a region of curved spacetime bounded by
                mathematical thresholds:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="border rounded p-2.5 bg-background/50 space-y-1">
                  <div className="font-mono font-semibold text-primary text-[11px]">
                    The Event Horizon (r+)
                  </div>
                  <p>
                    The one-way causal boundary of spacetime. Once matter or light slips beneath
                    this radius, the escape velocity equals the speed of light (c). Inside, the
                    radial spatial coordinate r becomes timelike: moving inward toward the center is
                    as inevitable as moving forward in time.
                  </p>
                </div>
                <div className="border rounded p-2.5 bg-background/50 space-y-1">
                  <div className="font-mono font-semibold text-amber text-[11px]">
                    The Photon Sphere (r = 1.5 r_s)
                  </div>
                  <p>
                    A spherical boundary at 3 rg where gravity is so intense that photons can travel
                    in closed, unstable circular orbits. Light grazing this threshold is delayed and
                    bent into multiple complete loops, creating the blinding, razor-thin ring of
                    light seen surrounding the shadow.
                  </p>
                </div>
                <div className="border rounded p-2.5 bg-background/50 space-y-1">
                  <div className="font-mono font-semibold text-rose text-[11px]">
                    The ISCO (Innermost Stable Orbit)
                  </div>
                  <p>
                    In Newtonian gravity, circular orbits can exist at any radius. In General
                    Relativity, circular orbits inside the ISCO are unstable: gas loses circular
                    balance and plunges directly into the horizon without radiating further,
                    creating a steep drop in disk brightness.
                  </p>
                </div>
                <div className="border rounded p-2.5 bg-background/50 space-y-1">
                  <div className="font-mono font-semibold text-violet text-[11px]">
                    The Ergosphere &amp; Frame Dragging
                  </div>
                  <p>
                    For spinning Kerr black holes (a* &gt; 0), the dragging of inertial frames
                    (Lense-Thirring effect) forces spacetime itself to rotate faster than light
                    relative to distant stars. In the ergosphere, no object can stand still—even
                    with infinite rocket thrust!
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Module 2: Time Dilation & The Infalling Observer Paradox */}
          <AccordionItem value="dilation" className="rounded-lg border bg-card/60 px-3">
            <AccordionTrigger className="hover:no-underline py-2.5">
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-cyan" />
                <span className="font-semibold text-xs text-foreground">
                  2. Gravitational Time Dilation &amp; The Frozen Star Paradox
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3 font-sans text-xs text-muted-foreground border-t border-border/40 mt-1">
              <p>
                One of the most mind-bending predictions of General Relativity is the difference
                between <span className="text-foreground font-semibold">Coordinate Time (t)</span>{" "}
                observed by a distant astronomer and{" "}
                <span className="text-foreground font-semibold">Proper Time (τ)</span> experienced
                by an infalling probe:
              </p>
              <div className="rounded border p-3 bg-background/60 font-mono text-[11px] space-y-2">
                <div className="text-cyan font-semibold">
                  What the Outside Observer Sees (t → ∞):
                </div>
                <p className="font-sans">
                  As the probe nears the event horizon, gravitational redshift stretches the
                  frequency of its radio signals exponentially. To the outside observer, the probe's
                  clock appears to tick slower and slower, freezing in motion at r = r_s. However,
                  because each photon is redshifted to longer wavelengths and lower energies, the
                  probe quickly fades into utter radio blackness within milliseconds.
                </p>
                <div className="text-violet font-semibold pt-1">
                  What the Falling Infalling Astronaut Experiences (Finite τ):
                </div>
                <p className="font-sans">
                  In their own frame, the astronaut feels no barrier or wall at the horizon! They
                  cross r = r_s in a completely finite, smooth proper time (τ ≈ fractions of a
                  second for stellar black holes), looking outward at the universe behind them
                  before plunging inexorably into the central singularity.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Module 3: Spaghettification & Tidal Forces */}
          <AccordionItem value="spaghetti" className="rounded-lg border bg-card/60 px-3">
            <AccordionTrigger className="hover:no-underline py-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose" />
                <span className="font-semibold text-xs text-foreground">
                  3. Spaghettification: Why Supermassive Black Holes Are Safe to Cross
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3 font-sans text-xs text-muted-foreground border-t border-border/40 mt-1">
              <p>
                Tidal forces arise from the gradient of gravity: the difference in gravitational
                pull between your feet and your head. The differential tidal acceleration on a body
                of height Δr is:
              </p>
              <div className="rounded border bg-card p-2 font-mono text-center">
                <Tex
                  latex="\Delta a_{\text{tidal}} = \frac{2 G M}{r^3} \Delta r \quad \implies \quad \text{At horizon } r_s = \frac{2GM}{c^2}: \quad \Delta a(r_s) \propto \frac{1}{M^2}"
                  block
                />
              </div>
              <p>
                Notice the crucial consequence:{" "}
                <span className="text-foreground font-semibold">
                  tidal forces at the horizon scale inversely with mass squared (1/M²)!
                </span>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="text-rose font-semibold">Stellar-Mass Black Hole (10 M☉):</span>{" "}
                  The horizon radius is tiny (30 km). Tidal forces at r_s exceed 100,000 g! You
                  would be stretched into a string of atoms miles outside the horizon.
                </li>
                <li>
                  <span className="text-emerald font-semibold">
                    Supermassive Black Hole (M87*, 6.5×10⁹ M☉):
                  </span>{" "}
                  The horizon radius is enormous (19 billion km, larger than Pluto's orbit). Tidal
                  forces at r_s are a gentle 10⁻⁴ g! An astronaut could cross the horizon of M87*
                  completely unharmed and alive.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Module 4: Penrose Process & Hawking Radiation */}
          <AccordionItem value="hawking" className="rounded-lg border bg-card/60 px-3">
            <AccordionTrigger className="hover:no-underline py-2.5">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber" />
                <span className="font-semibold text-xs text-foreground">
                  4. The Penrose Process &amp; Hawking Quantum Evaporation
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3 font-sans text-xs text-muted-foreground border-t border-border/40 mt-1">
              <p>
                Black holes are not purely destructive sinks—they can act as the most efficient
                energy generators and quantum radiators in the cosmos:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="border rounded p-2.5 bg-background/50 space-y-1">
                  <div className="font-mono font-semibold text-amber text-[11px]">
                    The Penrose Process (Rotational Power)
                  </div>
                  <p>
                    In the ergosphere, negative-energy particle trajectories exist relative to
                    infinity. By dropping matter into the ergosphere and having it split into two
                    pieces—one plunging into the horizon on a negative energy orbit, and the other
                    escaping to infinity—the escaping piece can emerge with up to 129% of its
                    original rest mass-energy, extracting rotational energy from the black hole!
                  </p>
                </div>
                <div className="border rounded p-2.5 bg-background/50 space-y-1">
                  <div className="font-mono font-semibold text-cyan text-[11px]">
                    Hawking Radiation &amp; Evaporation
                  </div>
                  <p>
                    In 1974, Stephen Hawking combined Quantum Field Theory with General Relativity,
                    showing that quantum vacuum fluctuations near the horizon create virtual
                    particle-antiparticle pairs. If one particle falls in while the other escapes,
                    the black hole loses mass, radiating like a thermal blackbody with temperature
                    T_H ∝ 1/M.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Panel>

      {/* COMPARATIVE GR SCIENTIFIC CHARTS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Gravitational Time Dilation: Distant Time (t) vs Proper Time (τ)">
          <SciChart
            xLabel="Radial Distance (GM/c²)"
            yLabel="Time Units"
            xReversed
            height={200}
            series={[
              {
                key: "td",
                name: "Coordinate Time t (Distant Observer)",
                data: timeComparisonCurve.map((p) => ({ x: p.x, y: p.t_distant })),
                color: "#ef4444",
              },
              {
                key: "tau",
                name: "Proper Time τ (Falling Astronaut)",
                data: timeComparisonCurve.map((p) => ({ x: p.x, y: p.tau_proper })),
                color: "#38bdf8",
              },
            ]}
          />
        </Panel>

        <Panel title="Tidal Force Acceleration (Earth g-forces) vs Distance (rg)">
          <SciChart
            xLabel="Radial Distance (rg)"
            yLabel="Tidal Force (g)"
            xReversed
            yLog
            height={200}
            series={[
              {
                key: "tf",
                name: "Tidal Stress (g)",
                data: tidalCurve,
                color: "#f59e0b",
              },
            ]}
          />
        </Panel>
      </div>
    </LabLayout>
  );
}
