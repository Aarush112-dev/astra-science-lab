import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { Pause, Play, RotateCcw, Zap, Sparkles, Orbit, Compass, Layers } from "lucide-react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { Button } from "@/components/ui/button";
import { useCanvas, cssVar, tempToColor } from "@/components/lab/useCanvas";
import { msLifetime, remnant, stellarState, mainSequence } from "@/lib/physics/stellar";
import { astro, fmt } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import { LifeCycleMap } from "@/components/lab/LifeCycleMap";

export const Route = createFileRoute("/lab/stellar-evolution")({
  head: () => labHead("stellar-evolution"),
  component: Stellar,
});

interface EjectaParticle {
  angle: number;
  speed: number;
  noiseSeed: number;
  element: "Ni" | "Fe" | "Si" | "O" | "H";
  baseRadius: number;
}

// Generate deterministic pseudo-random seeds for supernova ejecta filaments
function createEjectaLibrary(count: number): EjectaParticle[] {
  const elements: ("Ni" | "Fe" | "Si" | "O" | "H")[] = ["Ni", "Fe", "Si", "O", "H"];
  const list: EjectaParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI + Math.sin(i * 12.3) * 0.18;
    const speed = 0.45 + 0.95 * Math.abs(Math.sin(i * 77.3));
    list.push({
      angle,
      speed,
      noiseSeed: i * 37.1,
      element: elements[i % elements.length] ?? "Fe",
      baseRadius: 2.0 + (i % 5),
    });
  }
  return list;
}

const EJECTA_CACHE = createEjectaLibrary(340);

// Convective granules for Main Sequence & Giants
const GRANULES_CACHE = Array.from({ length: 48 }, (_, i) => ({
  x: Math.cos((i / 48) * 2 * Math.PI) * (0.2 + 0.7 * Math.sin(i * 3.7)),
  y: Math.sin((i / 48) * 2 * Math.PI) * (0.2 + 0.7 * Math.cos(i * 5.1)),
  scale: 0.15 + 0.25 * Math.sin(i * 19.3),
  phase: i * 1.4,
}));

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function Stellar() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [M, setM] = useState(15); // Default to 15 M_sun massive star for showcase
  const [Z, setZ] = useState(0.02);
  const [rot, setRot] = useState(60);
  const [f, setF] = useState(0.2);
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [showDiagram, setShowDiagram] = useState(true);

  // Animated smooth timeline reference to ensure 60fps butter-smooth rendering
  const animFRef = useRef(f);

  // High-frequency 60fps playback timer
  useEffect(() => {
    if (!playing) return;
    const intervalMs = 16;
    const step = 0.001 * playSpeed;
    const id = setInterval(() => {
      setF((x) => {
        if (x >= 1) {
          setPlaying(false);
          return 1;
        }
        return Math.min(1, x + step);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [playing, playSpeed]);

  const st = stellarState(M, f, Z);
  const ms = mainSequence(M);
  const life = msLifetime(M) / 0.76;
  const rem = remnant(M, Z);

  const track = useMemo(
    () =>
      Array.from({ length: 240 }, (_, i) => {
        const s = stellarState(M, i / 239, Z);
        return { x: Math.max(1000, s.T), y: Math.max(1e-6, s.L) };
      }).filter((p) => p.y > 0),
    [M, Z],
  );

  const isSupernova = st.stageCode === "supernova";
  const isPlanetaryNebula = st.stageCode === "planetary_nebula";
  const isCloud = st.stageCode === "cloud";
  const isProtostar = st.stageCode === "protostar";
  const isBrownDwarf = st.stageCode === "brown_dwarf";
  const isNeutronStar = st.stageCode === "neutron_star";
  const isBlackHole = st.stageCode === "black_hole";
  const isWhiteDwarf = st.stageCode === "white_dwarf" || st.stageCode === "black_dwarf";

  // Canvas visualizer with astronomical physics rendering & continuous blending
  const ref = useCanvas((ctx, w, h, dt, t) => {
    ctx.fillStyle = cssVar("--background", "#020308");
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxDim = Math.min(w, h);

    // 1. Smoothly interpolate animation timeline progress animF
    const lerpRate = Math.min(1, Math.max(0.04, dt * 10));
    animFRef.current += (f - animFRef.current) * lerpRate;
    const curF = animFRef.current;

    // Evaluate live smooth state at curF
    const curState = stellarState(M, curF, Z);
    const isMassive = M >= 8.0;
    const isVeryMassive = M >= 20.0;
    const isFailedStar = M < 0.08;

    // 2. Continuous Blend Weights across all evolutionary phases
    // A. Bok Globule / Molecular Cloud (0.0 to 0.04)
    const cloudWeight = 1 - smoothstep(0.012, 0.045, curF);

    // B. Protostar with Accretion Disk & Jets (0.015 to 0.075)
    const protostarWeight = smoothstep(0.015, 0.032, curF) * (1 - smoothstep(0.048, 0.075, curF));

    // C. Main Stellar Photosphere & Atmosphere
    // Starts condensing as protostar settles, stays active through Main Sequence & Giants
    let starBodyWeight = smoothstep(0.02, 0.042, curF);
    if (isMassive) {
      // In a supernova, the supergiant surface explodes outward into the shock
      starBodyWeight *= 1 - smoothstep(0.875, 0.915, curF);
    } else if (!isFailedStar) {
      // In a planetary nebula, the envelope lifts off smoothly
      starBodyWeight *= 1 - smoothstep(0.87, 0.93, curF);
    }

    // D. Giant Convective Cell Swelling (0.74 to 0.88)
    const giantWeight = smoothstep(0.74, 0.81, curF) * (1 - smoothstep(0.875, 0.905, curF));

    // E. Supernova Explosion & Dispersal (0.875 to 0.995)
    // Rises at core collapse, stays peaked, then expands and fades smoothly into the ISM
    const supernovaWeight = isMassive
      ? smoothstep(0.875, 0.895, curF) * (1 - smoothstep(0.935, 0.995, curF))
      : 0;

    // Pre-supernova core contraction pulsation (0.86 to 0.88)
    const preSupernovaTremor = isMassive
      ? smoothstep(0.86, 0.878, curF) * (1 - smoothstep(0.878, 0.885, curF))
      : 0;

    // F. Planetary Nebula Envelope Ejection (0.87 to 0.99)
    const pnWeight =
      !isMassive && !isFailedStar
        ? smoothstep(0.87, 0.9, curF) * (1 - smoothstep(0.935, 0.99, curF))
        : 0;

    // G. Compact Remnant Dominance (0.90 to 1.0)
    const remnantWeight = !isFailedStar ? smoothstep(0.91, 0.96, curF) : 0;

    // H. Brown Dwarf failed star cooling
    const brownDwarfWeight = isFailedStar ? smoothstep(0.08, 0.18, curF) : 0;

    // Background cosmic dust field & distant stars
    for (let s = 0; s < 120; s++) {
      const sx = (s * 137.5) % w;
      const sy = (s * 283.1) % h;
      const bri = 0.2 + 0.6 * Math.sin(s + t * 0.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${bri * 0.6})`;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // =========================================================================
    // LAYER 1: MOLECULAR CLOUD & BOK GLOBULE (Fade In/Out with cloudWeight)
    // =========================================================================
    if (cloudWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = cloudWeight;

      const cloudRadius = maxDim * 0.44;
      for (let c = 0; c < 7; c++) {
        const ang = (c / 7) * 2 * Math.PI + t * 0.05;
        const rad = cloudRadius * (0.4 + 0.5 * Math.sin(c * 17));
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        const gCloud = ctx.createRadialGradient(px, py, 10, px, py, cloudRadius * 0.55);
        gCloud.addColorStop(0, "rgba(99, 102, 241, 0.25)");
        gCloud.addColorStop(0.4, "rgba(56, 189, 248, 0.15)");
        gCloud.addColorStop(0.7, "rgba(168, 85, 247, 0.08)");
        gCloud.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gCloud;
        ctx.beginPath();
        ctx.arc(px, py, cloudRadius * 0.55, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Bok Globule gravitational contraction
      const globuleProgress = clamp01(curF / 0.035);
      const globuleR = Math.max(12, maxDim * 0.16 * (1 - globuleProgress * 0.55));
      const gGlob = ctx.createRadialGradient(cx, cy, 2, cx, cy, globuleR * 1.8);
      gGlob.addColorStop(0, "rgba(10, 10, 15, 0.98)");
      gGlob.addColorStop(0.6, "rgba(30, 25, 45, 0.85)");
      gGlob.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gGlob;
      ctx.beginPath();
      ctx.arc(cx, cy, globuleR * 1.8, 0, 2 * Math.PI);
      ctx.fill();

      // Gravitational infall streamers
      ctx.strokeStyle = "rgba(255, 220, 160, 0.35)";
      ctx.lineWidth = 1;
      for (let k = 0; k < 8; k++) {
        const theta = (k / 8) * 2 * Math.PI + t * 0.1;
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(theta) * cloudRadius * 0.7,
          cy + Math.sin(theta) * cloudRadius * 0.7,
        );
        ctx.quadraticCurveTo(
          cx + Math.cos(theta + 0.4) * cloudRadius * 0.3,
          cy + Math.sin(theta + 0.4) * cloudRadius * 0.3,
          cx,
          cy,
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // =========================================================================
    // LAYER 2: PROTOSTAR ACCRETION DISK & JETS (Fade In/Out with protostarWeight)
    // =========================================================================
    if (protostarWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = protostarWeight;

      const protoR = maxDim * 0.07;
      const jetLen = maxDim * 0.45;

      // Bipolar Herbig-Haro relativistic jets
      ctx.save();
      ctx.translate(cx, cy);

      const jetGrad = ctx.createLinearGradient(0, -jetLen, 0, jetLen);
      jetGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
      jetGrad.addColorStop(0.2, "rgba(56, 189, 248, 0.85)");
      jetGrad.addColorStop(0.5, "#ffffff");
      jetGrad.addColorStop(0.8, "rgba(56, 189, 248, 0.85)");
      jetGrad.addColorStop(1, "rgba(239, 68, 68, 0)");

      ctx.strokeStyle = jetGrad;
      ctx.lineWidth = 4 + Math.sin(t * 8) * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -jetLen);
      ctx.lineTo(0, jetLen);
      ctx.stroke();

      // Bipolar shock knots
      for (let k = 1; k <= 3; k++) {
        const ky = (jetLen * k) / 3.2;
        const knotR = 8 + k * 4;
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.8 - k * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -ky, knotR, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, ky, knotR, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
      }
      ctx.restore();

      // Keplerian Accretion Disk
      const diskRx = maxDim * 0.38;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.2);

      // Back half
      for (let r = diskRx; r >= protoR * 1.4; r -= 4) {
        const norm = (r - protoR * 1.4) / diskRx;
        ctx.strokeStyle = `rgba(217, 119, 6, ${0.4 * (1 - norm)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.28, 0, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }

      // Front half
      for (let r = diskRx; r >= protoR * 1.4; r -= 4) {
        const norm = (r - protoR * 1.4) / diskRx;
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.65 * (1 - norm)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.28, 0, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();
    }

    // =========================================================================
    // LAYER 3: STELLAR PHOTOSPHERE & CONVECTIVE MANTLE (Smooth radius & color morph)
    // =========================================================================
    if (starBodyWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = starBodyWeight;

      // Base radius calculation with smooth growth
      const isGiantPhase = curF >= 0.74 && curF < 0.88;
      let targetRpx = Math.max(
        10,
        Math.min(
          maxDim * 0.42,
          isGiantPhase
            ? 44 * Math.pow(Math.max(1, curState.R), 0.31)
            : 28 * Math.pow(Math.max(0.1, curState.R), 0.38),
        ),
      );

      // Pre-supernova implosion shivering tremor
      if (preSupernovaTremor > 0) {
        const pulse = Math.sin(t * 24) * preSupernovaTremor * 6;
        targetRpx = Math.max(10, targetRpx * (1 - preSupernovaTremor * 0.3) + pulse);
      }

      const baseCol = tempToColor(Math.min(45000, Math.max(1800, curState.T)));

      // 3.1 Corona & Chromosphere Glow
      const coronaGrad = ctx.createRadialGradient(cx, cy, targetRpx * 0.3, cx, cy, targetRpx * 2.3);
      coronaGrad.addColorStop(0, "#ffffff");
      coronaGrad.addColorStop(0.35, baseCol);
      coronaGrad.addColorStop(0.7, baseCol.replace("rgb", "rgba").replace(")", ",0.3)"));
      coronaGrad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, targetRpx * 2.3, 0, 2 * Math.PI);
      ctx.fill();

      // Magnetic Prominence Flares
      for (let p = 0; p < 4; p++) {
        const pAng = (p / 4) * 2 * Math.PI + t * 0.08;
        ctx.strokeStyle = baseCol.replace("rgb", "rgba").replace(")", ",0.65)");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(pAng) * targetRpx * 0.95,
          cy + Math.sin(pAng) * targetRpx * 0.95,
          targetRpx * 0.28,
          0,
          Math.PI,
        );
        ctx.stroke();
      }

      // 3.2 Photosphere with Physical Limb Darkening
      const limbGrad = ctx.createRadialGradient(
        cx - targetRpx * 0.15,
        cy - targetRpx * 0.15,
        targetRpx * 0.05,
        cx,
        cy,
        targetRpx,
      );
      limbGrad.addColorStop(0, "#ffffff");
      limbGrad.addColorStop(0.4, baseCol);
      limbGrad.addColorStop(0.85, baseCol.replace("rgb", "rgba").replace(")", ",0.8)"));
      limbGrad.addColorStop(1, "rgba(0, 0, 0, 0.95)");

      ctx.fillStyle = limbGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, targetRpx, 0, 2 * Math.PI);
      ctx.fill();

      // 3.3 Convective Granules (smoothly morphing from fine MS cells to giant supergranules)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, targetRpx * 0.96, 0, 2 * Math.PI);
      ctx.clip();

      const granCount = isGiantPhase ? 14 : 32;
      const granSize = targetRpx * (isGiantPhase ? 0.32 : 0.13);

      for (let g = 0; g < granCount; g++) {
        const item = GRANULES_CACHE[g % GRANULES_CACHE.length]!;
        const gx = cx + item.x * targetRpx * 0.78;
        const gy = cy + item.y * targetRpx * 0.78;
        const pulse = Math.sin(t * 1.2 + item.phase);
        ctx.fillStyle = isGiantPhase
          ? `rgba(220, 38, 38, ${0.25 + 0.15 * pulse})`
          : `rgba(255, 255, 255, ${0.12 + 0.08 * pulse})`;
        ctx.beginPath();
        ctx.arc(gx, gy, granSize * (0.8 + 0.2 * pulse), 0, 2 * Math.PI);
        ctx.fill();
      }

      // Rotation equator
      if (rot > 0) {
        const ang = t * (rot / 25);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, targetRpx, targetRpx * 0.22, 0, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(
          cx + targetRpx * Math.cos(ang),
          cy + targetRpx * 0.22 * Math.sin(ang),
          2.5,
          0,
          2 * Math.PI,
        );
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    }

    // =========================================================================
    // LAYER 4: BROWN DWARF (Failed Star Path M < 0.08 M_sun)
    // =========================================================================
    if (brownDwarfWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = brownDwarfWeight;

      const bdR = maxDim * 0.12;
      const gIR = ctx.createRadialGradient(cx, cy, bdR * 0.5, cx, cy, bdR * 2.2);
      gIR.addColorStop(0, "rgba(180, 83, 9, 0.6)");
      gIR.addColorStop(0.5, "rgba(120, 53, 15, 0.25)");
      gIR.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gIR;
      ctx.beginPath();
      ctx.arc(cx, cy, bdR * 2.2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(cx, cy, bdR, 0, 2 * Math.PI);
      ctx.fill();

      // Atmospheric methane bands
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, bdR, 0, 2 * Math.PI);
      ctx.clip();
      for (let b = -4; b <= 4; b++) {
        const bandY = cy + (b * bdR) / 5;
        ctx.fillStyle = b % 2 === 0 ? "rgba(146, 64, 14, 0.45)" : "rgba(88, 28, 135, 0.35)";
        ctx.fillRect(cx - bdR, bandY, bdR * 2, bdR / 5);
      }
      ctx.restore();

      ctx.restore();
    }

    // =========================================================================
    // LAYER 5: PLANETARY NEBULA (Smooth expansion and thinning, M < 8 M_sun)
    // =========================================================================
    if (pnWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = pnWeight;

      // Expansion factor calculated continuously from f
      const pnT = clamp01((curF - 0.87) / 0.11);
      const pnR = maxDim * (0.12 + pnT * 0.38);

      // Outer Crimson H-alpha / [N II] shell
      const gradHa = ctx.createRadialGradient(cx, cy, pnR * 0.35, cx, cy, pnR);
      gradHa.addColorStop(0, "rgba(244, 63, 94, 0)");
      gradHa.addColorStop(0.65, "rgba(244, 63, 94, 0.5)");
      gradHa.addColorStop(1, "rgba(244, 63, 94, 0)");
      ctx.fillStyle = gradHa;
      ctx.beginPath();
      ctx.arc(cx, cy, pnR, 0, 2 * Math.PI);
      ctx.fill();

      // Inner turquoise [O III] ring
      ctx.strokeStyle = "rgba(45, 212, 191, 0.75)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(cx, cy, pnR * 0.62, pnR * 0.45, 0.35, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.restore();
    }

    // =========================================================================
    // LAYER 6: CORE-COLLAPSE SUPERNOVA (Massive Stars M >= 8 M_sun)
    // Seamless ballistic expansion & dispersal into ISM (no abrupt disappearing!)
    // =========================================================================
    if (supernovaWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = supernovaWeight;

      // Continuous time parameter for the explosion blast
      const snT = clamp01((curF - 0.88) / 0.11);

      // 6.1 Multi-shockwave supersonic spherical fronts
      const shockRadius = maxDim * (0.05 + snT * 0.52);
      const shockAlpha = Math.max(0.1, 1 - snT * 0.65);

      for (let s = 0; s < 4; s++) {
        const sRad = shockRadius * (1 - s * 0.07);
        ctx.strokeStyle = `rgba(255, 235, 190, ${shockAlpha * (0.9 - s * 0.2)})`;
        ctx.lineWidth = Math.max(1.5, 5 - s);
        ctx.beginPath();
        for (let a = 0; a < 64; a++) {
          const ang = (a / 64) * 2 * Math.PI;
          const pert =
            Math.sin(ang * 9 + t * 5) * (4 + snT * 10) + Math.cos(ang * 17 - t * 3) * (2 + snT * 6);
          const r = sRad + pert;
          const px = cx + Math.cos(ang) * r;
          const py = cy + Math.sin(ang) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 6.2 Expanding Nucleosynthetic Filaments
      const curDist = shockRadius * 0.94;
      for (let i = 0; i < EJECTA_CACHE.length; i++) {
        const ej = EJECTA_CACHE[i]!;
        const rPos = curDist * ej.speed * (0.35 + 0.65 * snT);
        const theta = ej.angle + Math.sin(t * 2 + ej.noiseSeed) * 0.06;
        const px = cx + Math.cos(theta) * rPos;
        const py = cy + Math.sin(theta) * rPos;

        let col = "rgba(245, 158, 11, 0.9)"; // 56-Ni
        if (ej.element === "Fe") col = "rgba(239, 68, 68, 0.85)";
        else if (ej.element === "Si") col = "rgba(168, 85, 247, 0.8)";
        else if (ej.element === "O") col = "rgba(16, 185, 129, 0.8)";
        else if (ej.element === "H") col = "rgba(56, 189, 248, 0.75)";

        const pSize = Math.max(1.5, ej.baseRadius * (1 + snT * 2.2));
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, 2 * Math.PI);
        ctx.fill();

        // Connecting gas tendrils
        if (i % 3 === 0 && snT > 0.08) {
          ctx.strokeStyle = col
            .replace("0.85", "0.2")
            .replace("0.9", "0.22")
            .replace("0.8", "0.18");
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx + Math.cos(theta) * (rPos * 0.65), cy + Math.sin(theta) * (rPos * 0.65));
          ctx.stroke();
        }
      }

      // 6.3 Relativistic GRB Bipolar Jets (for Hypernova M >= 20)
      if (isVeryMassive) {
        const jetLen = maxDim * 0.54 * Math.min(1, snT * 2.0);
        const jetGrad = ctx.createLinearGradient(cx, cy - jetLen, cx, cy + jetLen);
        jetGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        jetGrad.addColorStop(0.3, "rgba(168, 85, 247, 0.8)");
        jetGrad.addColorStop(0.5, "#ffffff");
        jetGrad.addColorStop(0.7, "rgba(168, 85, 247, 0.8)");
        jetGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.strokeStyle = jetGrad;
        ctx.lineWidth = 7 + Math.sin(t * 14) * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - jetLen);
        ctx.lineTo(cx, cy + jetLen);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        for (let d = 1; d <= 4; d++) {
          const dy = (jetLen * d) / 4.5;
          ctx.beginPath();
          ctx.arc(cx, cy - dy, 3.5, 0, 2 * Math.PI);
          ctx.arc(cx, cy + dy, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // 6.4 Nuclear Rebound Thermal Flash
      const flashAlpha = Math.max(0, 1 - snT * 1.8);
      if (flashAlpha > 0.01) {
        const coreR = Math.max(8, maxDim * 0.14 * (1 - snT * 0.65));
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.8);
        coreGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        coreGrad.addColorStop(0.25, `rgba(255, 240, 190, ${flashAlpha * 0.95})`);
        coreGrad.addColorStop(0.6, `rgba(245, 158, 11, ${flashAlpha * 0.6})`);
        coreGrad.addColorStop(1, "rgba(239, 68, 68, 0)");

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 2.8, 0, 2 * Math.PI);
        ctx.fill();

        // Diffraction flare spikes
        const flareLen = coreR * (3.5 + Math.sin(t * 9) * 0.6);
        ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha * 0.7})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - flareLen, cy);
        ctx.lineTo(cx + flareLen, cy);
        ctx.moveTo(cx, cy - flareLen);
        ctx.lineTo(cx, cy + flareLen);
        ctx.stroke();
      }

      ctx.restore();
    }

    // =========================================================================
    // LAYER 7: COMPACT REMNANTS (Neutron Star / Black Hole / White Dwarf)
    // Smoothly emerges from core as ejecta disperses (remnantWeight)
    // =========================================================================
    if (remnantWeight > 0.01) {
      ctx.save();
      ctx.globalAlpha = remnantWeight;

      // 7.1 NEUTRON STAR / PULSAR
      if (rem.type === "Neutron star") {
        const beamAngle = t * (rot > 0 ? rot * 0.12 : 3.5);
        const beamLen = maxDim * 0.48;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(beamAngle);

        const beamGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, beamLen);
        beamGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        beamGrad.addColorStop(0.25, "rgba(56, 189, 248, 0.65)");
        beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-24, -beamLen);
        ctx.lineTo(24, -beamLen);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-24, beamLen);
        ctx.lineTo(24, beamLen);
        ctx.closePath();
        ctx.fill();

        // Magnetic loops
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 45, 80, 0, 0, 2 * Math.PI);
        ctx.ellipse(0, 0, 90, 130, 0, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();

        // Ultra-dense core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, 6.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 7.2 BLACK HOLE
      else if (rem.type === "Black hole") {
        const bhR = 18;
        // Gravitational lensing photon sphere & Einstein halo
        const haloGrad = ctx.createRadialGradient(cx, cy, bhR * 0.9, cx, cy, bhR * 3.2);
        haloGrad.addColorStop(0, "rgba(255, 220, 150, 0.95)");
        haloGrad.addColorStop(0.25, "rgba(168, 85, 247, 0.45)");
        haloGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, bhR * 3.2, 0, 2 * Math.PI);
        ctx.fill();

        // Warped Accretion Disk with relativistic Doppler beaming
        const diskW = bhR * 4.5;
        const diskH = diskW * 0.25;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.3);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, diskW, diskH, 0, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();

        // Event Horizon
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(cx, cy, bhR, 0, 2 * Math.PI);
        ctx.fill();

        // Photon ring (1.5 r_s)
        ctx.strokeStyle = "rgba(255, 240, 200, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, bhR * 1.35, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // 7.3 WHITE DWARF -> BLACK DWARF
      else if (rem.type === "White dwarf") {
        const isBlackDwarf = curF > 0.985;
        const wdR = 6;
        if (!isBlackDwarf) {
          const wdGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
          wdGrad.addColorStop(0, "#ffffff");
          wdGrad.addColorStop(0.3, "rgba(186, 230, 253, 0.85)");
          wdGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.fillStyle = wdGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(cx, cy, wdR, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(cx, cy, wdR, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Telemetry HUD overlay
    ctx.fillStyle = "rgba(220, 230, 250, 0.95)";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(curState.stage.toUpperCase(), 14, 24);
    ctx.fillStyle = "rgba(160, 185, 220, 0.8)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(
      `Age: ${astro.years(life * curF).display} (${(curF * 100).toFixed(1)}% of total life)`,
      14,
      42,
    );
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`Nuclear: ${curState.fusionProcess}`, 14, 60);

    if (supernovaWeight > 0.1) {
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("CORE COLLAPSE DETONATION // EXPANDING NUCLEOSYNTHESIS", 14, 78);
    }
  });

  const fStr = f.toFixed(2);
  const context = useMemo(
    () => ({
      simulationId: "stellar-evolution",
      simulationName: "Stellar Evolution",
      parameters: {
        mass_Msun: M,
        metallicity_Z: Z,
        rotation_kms: rot,
        lifeFraction: +f.toFixed(3),
      },
      measurements: {
        stage: st.stage,
        spectralClass: st.spectralClass,
        luminosity_Lsun: +st.L.toPrecision(3),
        temperature_K: Math.round(st.T),
        radius_Rsun: +st.R.toPrecision(3),
        coreMass_Msun: +st.coreMass.toFixed(3),
        remnant: rem.type,
        msLifetime_yr: +msLifetime(M).toPrecision(3),
        centralDensity_gcc: st.centralDensity_gcc,
      },
      notes: [
        `Stage: ${st.stage}.`,
        `Active fusion: ${st.fusionProcess}.`,
        `Final fate: ${rem.type} (${rem.mass.toFixed(2)} M☉).`,
      ],
      series: { hrTrack: track },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [M, Z, rot, fStr, st.stage, st.fusionProcess, rem.type, rem.mass],
  );

  return (
    <LabLayout
      simulationId="stellar-evolution"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button
            size="sm"
            variant="lab"
            onClick={() => {
              if (f >= 1) setF(0);
              setPlaying(!playing);
            }}
          >
            {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button
            size="sm"
            variant="lab"
            onClick={() => {
              setF(0);
              setPlaying(false);
            }}
          >
            <RotateCcw className="size-3" /> Reset
          </Button>

          {/* Quick Supernova Button */}
          <Button
            size="sm"
            variant={isSupernova ? "destructive" : "glow"}
            onClick={() => {
              if (M < 8) setM(15);
              setF(0.885);
              setPlaying(true);
            }}
          >
            <Zap className="size-3 text-amber" />
            Trigger Supernova (f = 88.5%)
          </Button>

          <Button
            size="sm"
            variant={showDiagram ? "glow" : "lab"}
            onClick={() => setShowDiagram(!showDiagram)}
          >
            <Layers className="size-3 text-cyan" />
            Life Cycle Map
          </Button>

          {/* Playback speed selector */}
          <div className="flex rounded-md border bg-card/60 p-0.5 ml-auto">
            {([0.5, 1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaySpeed(spd)}
                className={`rounded-sm px-2 py-0.5 font-mono text-[10px] ${
                  playSpeed === spd
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </>
      }
      controls={
        <Panel title="Stellar Parameters">
          <div className="space-y-4">
            <Param
              label="Initial mass"
              value={M}
              min={0.05}
              max={60}
              log
              unit="M☉"
              onChange={setM}
              hint="<0.08 M☉: Brown dwarf; 0.08-8 M☉: White dwarf; 8-20 M☉: Supernova/Neutron star; >20 M☉: Hypernova/Black hole."
            />
            <Param
              label="Metallicity Z"
              value={Z}
              min={0.0001}
              max={0.04}
              step={0.0005}
              onChange={setZ}
              format={(v) => v.toFixed(4)}
              hint="Mass fraction of elements heavier than helium (Solar Z ≈ 0.02)."
            />
            <Param
              label="Equatorial rotation"
              value={rot}
              min={0}
              max={300}
              step={5}
              unit="km/s"
              onChange={setRot}
            />
            <Param
              label="Evolution timeline (f)"
              value={f}
              min={0}
              max={1}
              step={0.001}
              onChange={setF}
              format={(v) => `${(v * 100).toFixed(1)}%`}
              hint="0-2%: Cloud, 2-6%: Protostar, 6-78%: Main sequence, 78-88%: Giant, 88-94%: Supernova/PN, 94%+: Remnant."
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Astrophysical Measurements">
          <Readout
            label="Evolutionary Stage"
            value={st.stage}
            tone={isSupernova ? "rose" : "cyan"}
          />
          <Readout label="Spectral Class" value={st.spectralClass} tone="amber" />
          <Readout label="Current Luminosity" value={st.L} unit="L☉" si={astro.solarLum(st.L).si} />
          <Readout label="Effective Surface Temp" value={Math.round(st.T)} unit="K" tone="amber" />
          <Readout
            label="Photospheric Radius"
            value={st.R}
            unit="R☉"
            si={astro.solarRadius(st.R).si}
          />
          <Readout label="Degenerate Core Mass" value={st.coreMass} unit="M☉" />
          <Readout label="MS Lifetime" value={astro.years(msLifetime(M)).display} />
          <Readout
            label="Final Remnant Fate"
            value={`${rem.type} (${rem.mass.toFixed(2)} M☉)`}
            tone="violet"
          />
        </Panel>
      }
      equations={[
        {
          name: "Mass–luminosity relation (MS)",
          latex: "L \\propto M^{3.5}",
          symbols: [
            { symbol: "L", meaning: "luminosity", unit: "L☉" },
            { symbol: "M", meaning: "initial mass", unit: "M☉" },
          ],
          kind: "approximation",
        },
        {
          name: "Stellar lifetime",
          latex: "\\tau_{\\text{MS}} \\propto \\frac{M}{L} \\propto M^{-2.5}",
          symbols: [
            { symbol: "\\tau_{\\text{MS}}", meaning: "main sequence duration", unit: "yr" },
          ],
          kind: "approximation",
        },
        {
          name: "Chandrasekhar mass limit",
          latex: "M_{\\text{Ch}} \\approx 1.44\\,M_\\odot",
          symbols: [
            {
              symbol: "M_{\\text{Ch}}",
              meaning: "maximum white dwarf mass supported by electron degeneracy",
            },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Piecewise polynomial track calibrated to MIST & Geneva stellar evolution models",
        "Chandrasekhar threshold M_Ch = 1.44 M☉ determines WD vs. core collapse boundary",
        "Tolman–Oppenheimer–Volkoff limit (≈ 2.2 M☉) sets Neutron Star vs. Black Hole horizon formation",
      ]}
      physicsNotes={[
        "Low Mass (M < 8 M☉): Burns H via p-p chain, expands to Red Giant, undergoes helium core flash, and expels a Planetary Nebula leaving a degenerate Carbon-Oxygen White Dwarf that cools into a Black Dwarf.",
        "High Mass (8 ≤ M < 20 M☉): Burns through H, He, C, Ne, O, and Si in concentric onion shells up to ⁵⁶Fe. When the iron core exceeds M_Ch, endothermic photodisintegration triggers core collapse into a Type II Supernova, leaving a Neutron Star / Pulsar.",
        "Very High Mass (M ≥ 20 M☉): Undergoes extreme mass loss and core collapse into a Stellar-Mass Black Hole, often accompanied by ultra-relativistic Hypernova Gamma-Ray Burst (GRB) jets.",
      ]}
    >
      <Panel className="p-0">
        <canvas
          ref={ref}
          className="h-[430px] w-full"
          aria-label="Stellar evolution and supernova animation"
        />
      </Panel>

      {/* LIFE CYCLE OF A STAR INTERACTIVE SCHEMATIC WITH DETAILED SCIENTIFIC DROPOUT BOXES */}
      {showDiagram && (
        <Panel title="Life Cycle of a Star — Evolutionary Pathways & Dropout Guides">
          <LifeCycleMap
            currentStageCode={st.stageCode}
            currentMass={M}
            onSelectStage={(newMass, newF) => {
              if (newMass !== M) setM(newMass);
              setF(newF);
              setPlaying(true);
            }}
          />
        </Panel>
      )}

      <Panel title="Hertzsprung–Russell Diagram Track (log L vs log T_eff)">
        <SciChart
          xLabel="Surface Temperature (K)"
          yLabel="Luminosity (L☉)"
          xReversed
          xLog
          yLog
          height={220}
          series={[
            { key: "t", name: "Evolutionary track", data: track, color: "#a855f7" },
            {
              key: "c",
              name: "Current position",
              data: [{ x: Math.max(1000, st.T), y: Math.max(1e-6, st.L) }],
              dots: true,
              color: isSupernova ? "#f43f5e" : "#38bdf8",
            },
          ]}
        />
      </Panel>
    </LabLayout>
  );
}
