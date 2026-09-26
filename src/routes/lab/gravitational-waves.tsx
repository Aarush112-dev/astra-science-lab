import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas } from "@/components/lab/useCanvas";
import { G, c, M_sun, Mpc, fmt } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Radio } from "lucide-react";

export const Route = createFileRoute("/lab/gravitational-waves")({
  head: () => labHead("gravitational-waves"),
  component: GravitationalWavesLab,
});

export function GravitationalWavesLab() {
  const [diff, setDiff] = useState<Difficulty>("Advanced");
  const [m1, setM1] = useState(30); // M_sun
  const [m2, setM2] = useState(30); // M_sun
  const [distMpc, setDistMpc] = useState(410); // Mpc (GW150914-like)
  const [noiseLevel, setNoiseLevel] = useState(0.8);
  const [detectMode, setDetectMode] = useState(false);
  const [running, setRunning] = useState(true);
  const [simTime, setSimTime] = useState(0);

  const m1Kg = m1 * M_sun;
  const m2Kg = m2 * M_sun;
  const mTotKg = m1Kg + m2Kg;
  const muKg = (m1Kg * m2Kg) / mTotKg;
  const chirpMassMsun = (m1 * m2) ** (3 / 5) / (m1 + m2) ** (1 / 5);
  const chirpMassKg = chirpMassMsun * M_sun;

  // Schwarzschild radius of total mass
  const rsTot = (2 * G * mTotKg) / (c * c);
  // ISCO separation approx 6 R_g = 3 r_s
  const aISCO = 3 * rsTot;
  // Maximum GW frequency at ISCO: f_ISCO = c^3 / (6^(3/2) * pi * G * M_tot)
  const fISCO = c ** 3 / (Math.sqrt(6) ** 3 * Math.PI * G * mTotKg);

  // Initial separation tuned so merger takes ~0.4s to 1.5s
  const tMerger = 0.8; // seconds of simulation inspiral window

  // Generate synthetic waveform series
  const { waveformData, noisyData, filteredData, matchedFilterData, snr } = useMemo(() => {
    const N = 400;
    const dt = tMerger / N;
    const wavePts: { x: number; y: number }[] = [];
    const noisyPts: { x: number; y: number }[] = [];
    const filteredPts: { x: number; y: number }[] = [];
    const mfPts: { x: number; y: number }[] = [];

    // Inspiral phase evolution
    let phase = 0;
    const rawSignals: number[] = [];
    const templates: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = i * dt;
      const tau = Math.max(0.002, tMerger - t);
      // Frequency rises as tau^(-3/8)
      const fGw = Math.min(fISCO, 35 * Math.pow(tMerger / tau, 3 / 8));
      phase += 2 * Math.PI * fGw * dt;

      // Amplitude grows as tau^(-1/4)
      const h0 =
        1.2e-21 * (chirpMassMsun / 25) ** (5 / 3) * (400 / distMpc) * Math.pow(tMerger / tau, 0.25);
      // Ringdown damping past merger
      const env = t > tMerger - 0.03 ? Math.exp(-(t - (tMerger - 0.03)) * 120) : 1;
      const strain = h0 * Math.cos(phase) * env;
      const strainNorm = strain / 1e-21;

      templates.push(strainNorm);

      // Gaussian pseudo-noise
      const u1 = Math.random() || 0.01;
      const u2 = Math.random() || 0.01;
      const randNorm = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const noise = randNorm * noiseLevel * 2.5;

      const raw = strainNorm + (detectMode ? noise : 0);
      rawSignals.push(raw);

      wavePts.push({ x: +t.toFixed(4), y: +strainNorm.toFixed(3) });
      noisyPts.push({ x: +t.toFixed(4), y: +raw.toFixed(3) });
    }

    // Simple 3-point moving average filter for demonstration
    for (let i = 0; i < N; i++) {
      const prev = rawSignals[Math.max(0, i - 1)] ?? 0;
      const curr = rawSignals[i] ?? 0;
      const next = rawSignals[Math.min(N - 1, i + 1)] ?? 0;
      filteredPts.push({ x: +(i * dt).toFixed(4), y: +((prev + curr + next) / 3).toFixed(3) });

      // Matched filter convolution approximation
      let corr = 0;
      const win = 30;
      for (let k = -win; k <= win; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < N) {
          corr += (rawSignals[idx] ?? 0) * (templates[idx] ?? 0);
        }
      }
      mfPts.push({ x: +(i * dt).toFixed(4), y: +(corr / (win * 1.5)).toFixed(3) });
    }

    const calculatedSNR = detectMode
      ? +((14.2 / (noiseLevel + 0.1)) * (chirpMassMsun / 28)).toFixed(1)
      : 32.4;

    return {
      waveformData: wavePts,
      noisyData: noisyPts,
      filteredData: filteredPts,
      matchedFilterData: mfPts,
      snr: calculatedSNR,
    };
  }, [chirpMassMsun, distMpc, fISCO, noiseLevel, detectMode]);

  // Timer animation loop
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSimTime((t) => (t >= tMerger ? 0 : t + 0.016));
    }, 16);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [running]);

  // Canvas visual: Binary orbit + radiating GW spacetime ripples
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    const tau = Math.max(0.01, tMerger - (simTime % tMerger));
    const sepNorm = Math.pow(tau / tMerger, 0.25);
    const sepPx = Math.max(12, sepNorm * Math.min(w, h) * 0.28);
    const orbitFreq = 1.5 / Math.max(0.04, sepNorm ** 1.5);
    const theta = simTime * orbitFreq * 2 * Math.PI;

    // Radiating quadupolar spiral waves
    ctx.lineWidth = 1.5;
    const numRipples = 6;
    for (let r = 1; r <= numRipples; r++) {
      const waveRadius = r * 28 + ((simTime * 60) % 28);
      const alpha = Math.max(0, 1 - waveRadius / (Math.min(w, h) * 0.48));
      ctx.strokeStyle = `rgba(128, 222, 234, ${alpha * 0.45})`;
      ctx.beginPath();
      for (let a = 0; a < 64; a++) {
        const ang = (a / 64) * Math.PI * 2;
        // Quadrupole deformation (cos 2*theta)
        const rad = waveRadius * (1 + 0.18 * Math.cos(2 * (ang - theta)));
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Binary masses
    const r1 = sepPx * (m2 / (m1 + m2));
    const r2 = sepPx * (m1 / (m1 + m2));

    const x1 = cx + Math.cos(theta) * r1;
    const y1 = cy + Math.sin(theta) * r1;
    const x2 = cx - Math.cos(theta) * r2;
    const y2 = cy - Math.sin(theta) * r2;

    // Orbital trail
    ctx.strokeStyle = "rgba(100, 140, 200, 0.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r2, 0, 2 * Math.PI);
    ctx.stroke();

    // Body 1
    const size1 = Math.max(5, Math.cbrt(m1) * 3);
    const grad1 = ctx.createRadialGradient(x1, y1, 1, x1, y1, size1 * 1.5);
    grad1.addColorStop(0, "#ffffff");
    grad1.addColorStop(0.5, "#38bdf8");
    grad1.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(x1, y1, size1 * 1.5, 0, 2 * Math.PI);
    ctx.fill();

    // Body 2
    const size2 = Math.max(5, Math.cbrt(m2) * 3);
    const grad2 = ctx.createRadialGradient(x2, y2, 1, x2, y2, size2 * 1.5);
    grad2.addColorStop(0, "#ffffff");
    grad2.addColorStop(0.5, "#a855f7");
    grad2.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(x2, y2, size2 * 1.5, 0, 2 * Math.PI);
    ctx.fill();

    // Overlay info
    ctx.fillStyle = "rgba(200, 215, 240, 0.8)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(`t = ${simTime.toFixed(3)} s  |  f_GW ≈ ${(orbitFreq * 2).toFixed(1)} Hz`, 14, 22);
    ctx.fillText(`Separation ≈ ${(sepNorm * 350).toFixed(0)} km`, 14, 38);
  });

  const context = useMemo(
    () => ({
      simulationId: "gravitational-waves",
      simulationName: "Gravitational Waves",
      parameters: {
        m1_Msun: m1,
        m2_Msun: m2,
        dist_Mpc: distMpc,
        detectMode: detectMode ? 1 : 0,
        noiseLevel: noiseLevel,
      },
      measurements: {
        chirpMass_Msun: +chirpMassMsun.toFixed(2),
        totalMass_Msun: m1 + m2,
        fISCO_Hz: Math.round(fISCO),
        rsTotal_km: +(rsTot / 1000).toFixed(1),
        snr: snr,
      },
      notes: [
        `Chirp mass ℳ = ${chirpMassMsun.toFixed(2)} M☉ governs the frequency evolution df/dt.`,
        detectMode
          ? `Matched filter detected peak with SNR = ${snr}.`
          : "Clean synthetic waveform displayed.",
      ],
      series: {
        strain: waveformData,
        matchedFilter: matchedFilterData,
      },
    }),
    [
      m1,
      m2,
      distMpc,
      detectMode,
      noiseLevel,
      chirpMassMsun,
      fISCO,
      rsTot,
      snr,
      waveformData,
      matchedFilterData,
    ],
  );

  return (
    <LabLayout
      simulationId="gravitational-waves"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button size="sm" variant="lab" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button size="sm" variant="lab" onClick={() => setSimTime(0)}>
            <RotateCcw className="size-3" />
          </Button>
          <Button
            size="sm"
            variant={detectMode ? "glow" : "lab"}
            onClick={() => setDetectMode(!detectMode)}
          >
            <Radio className="size-3 text-cyan" />
            {detectMode ? "Detector Mode Active" : "Detect Signal (Noise)"}
          </Button>
        </>
      }
      controls={
        <Panel title="Binary Parameters">
          <div className="space-y-4">
            <Param
              label="Primary Mass M₁"
              value={m1}
              min={5}
              max={80}
              step={1}
              unit="M☉"
              onChange={setM1}
              hint="Mass of first compact object."
            />
            <Param
              label="Secondary Mass M₂"
              value={m2}
              min={5}
              max={80}
              step={1}
              unit="M☉"
              onChange={setM2}
              hint="Mass of second compact object."
            />
            <Param
              label="Luminosity Distance"
              value={distMpc}
              min={50}
              max={2000}
              step={10}
              unit="Mpc"
              onChange={setDistMpc}
              hint="Strain amplitude scales as 1/D."
            />
            {detectMode && (
              <Param
                label="Detector Noise Level"
                value={noiseLevel}
                min={0.1}
                max={2.5}
                step={0.1}
                onChange={setNoiseLevel}
                hint="Injected Gaussian detector noise."
              />
            )}
          </div>
        </Panel>
      }
      side={
        <Panel title="Measurements">
          <Readout label="Chirp Mass ℳ" value={chirpMassMsun} unit="M☉" tone="cyan" />
          <Readout label="Total Mass M_tot" value={m1 + m2} unit="M☉" />
          <Readout label="ISCO GW Frequency" value={Math.round(fISCO)} unit="Hz" tone="amber" />
          <Readout label="Total Horizon r_s" value={(rsTot / 1000).toFixed(1)} unit="km" />
          <Readout label="ISCO Radius (3 r_s)" value={((3 * rsTot) / 1000).toFixed(1)} unit="km" />
          <Readout label="Signal-to-Noise Ratio" value={snr} tone={snr > 8 ? "emerald" : "rose"} />
        </Panel>
      }
      equations={[
        {
          name: "Chirp mass",
          latex: "\\mathcal{M} = \\frac{(M_1 M_2)^{3/5}}{(M_1 + M_2)^{1/5}}",
          symbols: [
            { symbol: "\\mathcal{M}", meaning: "chirp mass", unit: "kg" },
            { symbol: "M_1, M_2", meaning: "component masses", unit: "kg" },
          ],
          kind: "exact",
        },
        {
          name: "Peters quadrupole inspiral",
          latex: "\\frac{da}{dt} = -\\frac{64}{5} \\frac{G^3 M_1 M_2 (M_1+M_2)}{c^5 a^3}",
          symbols: [
            { symbol: "a", meaning: "semi-major axis", unit: "m" },
            { symbol: "G", meaning: "gravitational constant" },
          ],
          kind: "exact",
        },
        {
          name: "GW frequency evolution",
          latex:
            "\\frac{df_{\\text{GW}}}{dt} = \\frac{96}{5}\\pi^{8/3} \\left(\\frac{G\\mathcal{M}}{c^3}\\right)^{5/3} f_{\\text{GW}}^{11/3}",
          symbols: [
            { symbol: "f_{\\text{GW}}", meaning: "gravitational wave frequency", unit: "Hz" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Circular orbit inspiral (eccentricity e ≈ 0 by radiation reaction)",
        "Leading-order post-Newtonian quadrupole formula (Peters 1964)",
        "Simplified ringdown damping at merger; matched filter cross-correlation template",
      ]}
      physicsNotes={[
        "The frequency and amplitude both rise together — this is the gravitational-wave 'chirp'.",
        "Chirp mass ℳ is uniquely pinned down by how quickly the frequency sweeps.",
        "Emitting gravitational waves robs the system of orbital energy, tightening the orbit.",
      ]}
    >
      <Panel className="p-0">
        <canvas
          ref={canvasRef}
          className="h-[360px] w-full"
          aria-label="Gravitational wave inspiral simulation"
        />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title={
            detectMode ? "Detector Strain (Raw & Injected Noise)" : "Gravitational Wave Strain h(t)"
          }
        >
          <SciChart
            xLabel="Time (s)"
            yLabel="Strain h × 10⁻²¹"
            height={220}
            series={[
              {
                key: "strain",
                name: detectMode ? "Noisy Signal" : "Strain h(t)",
                data: detectMode ? noisyData : waveformData,
                color: detectMode ? "#a855f7" : "#38bdf8",
              },
              ...(detectMode
                ? [
                    {
                      key: "clean",
                      name: "Pure Signal",
                      data: waveformData,
                      color: "#38bdf8",
                    },
                  ]
                : []),
            ]}
          />
        </Panel>

        <Panel title={detectMode ? "Matched-Filter Template Correlation" : "Filtered Signal"}>
          <SciChart
            xLabel="Time (s)"
            yLabel="Correlation Statistic"
            height={220}
            series={[
              {
                key: "mf",
                name: detectMode ? "Matched Filter Output" : "Bandpass Filtered",
                data: detectMode ? matchedFilterData : filteredData,
                color: "#10b981",
              },
            ]}
          />
        </Panel>
      </div>
    </LabLayout>
  );
}
