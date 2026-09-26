import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { Button } from "@/components/ui/button";
import { useCanvas, cssVar, tempToColor } from "@/components/lab/useCanvas";
import { msLifetime, remnant, stellarState } from "@/lib/physics/stellar";
import { astro } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";

export const Route = createFileRoute("/lab/stellar-evolution")({ head: () => labHead("stellar-evolution"), component: Stellar });

function Stellar() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [M, setM] = useState(1);
  const [Z, setZ] = useState(0.02);
  const [rot, setRot] = useState(2);
  const [f, setF] = useState(0.2);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setF((x) => (x >= 1 ? (setPlaying(false), 1) : Math.min(1, x + 0.004))), 40);
    return () => clearInterval(id);
  }, [playing]);

  const st = stellarState(M, f, Z);
  const life = msLifetime(M) / 0.76;
  const rem = remnant(M, Z);
  const track = useMemo(() => Array.from({ length: 240 }, (_, i) => { const s = stellarState(M, i / 239, Z); return { x: Math.max(2000, s.T), y: Math.max(1e-4, s.L) }; }).filter((p) => p.y > 0), [M, Z]);

  const ref = useCanvas((ctx, w, h, _dt, t) => {
    ctx.fillStyle = cssVar("--background", "#05070d"); ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const rpx = Math.max(3, Math.min(h * 0.42, 30 * Math.pow(st.R, 0.35)));
    if (st.stage === "Black hole") {
      ctx.fillStyle = "#000"; ctx.strokeStyle = cssVar("--violet", "#a78bfa"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
    } else {
      const col = tempToColor(Math.min(40000, st.T));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rpx * 1.8);
      g.addColorStop(0, "#fff"); g.addColorStop(0.35, col); g.addColorStop(0.6, col.replace("rgb", "rgba").replace(")", ",0.3)")); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rpx * 1.8, 0, 7); ctx.fill();
      if (st.stage === "Planetary nebula") {
        for (let k = 0; k < 3; k++) { ctx.strokeStyle = `rgba(92,225,255,${0.3 - k * 0.08})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 60 + k * 30 + (t * 10) % 20, 0, 7); ctx.stroke(); }
        ctx.lineWidth = 1;
      }
      if (st.stage.startsWith("Core collapse")) { ctx.strokeStyle = "rgba(255,200,120,0.5)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, (t * 80) % (h / 2), 0, 7); ctx.stroke(); ctx.lineWidth = 1; }
      // rotation marker
      const ang = t * rot * 0.3;
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.ellipse(cx, cy, rpx, rpx * 0.25, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.arc(cx + rpx * Math.cos(ang), cy + rpx * 0.25 * Math.sin(ang), 2, 0, 7); ctx.fill();
    }
    ctx.fillStyle = "rgba(200,210,230,0.7)"; ctx.font = "12px JetBrains Mono"; ctx.fillText(st.stage.toUpperCase(), 12, 22);
    ctx.fillText(`age ≈ ${astro.years(life * f).display}`, 12, 40);
  });

  const context = useMemo(() => ({
    simulationId: "stellar-evolution", simulationName: "Stellar Evolution",
    parameters: { mass_Msun: M, metallicity_Z: Z, rotation_kms: rot, lifeFraction: +f.toFixed(3) },
    measurements: { stage: st.stage, luminosity_Lsun: +st.L.toPrecision(3), temperature_K: Math.round(st.T), radius_Rsun: +st.R.toPrecision(3), coreMass_Msun: +st.coreMass.toFixed(3), remnant: rem.type, msLifetime_yr: +msLifetime(M).toPrecision(3) },
    notes: [`Currently a ${st.stage}.`, `Will end as a ${rem.type} of ≈${rem.mass.toFixed(2)} M☉.`],
    series: { hrTrack: track },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [M, Z, rot, f.toFixed(2)]);

  return (
    <LabLayout simulationId="stellar-evolution" difficulty={diff} onDifficultyChange={setDiff} context={context}
      toolbar={<>
        <Button size="sm" variant="lab" onClick={() => { if (f >= 1) setF(0); setPlaying(!playing); }}>{playing ? <Pause className="size-3" /> : <Play className="size-3" />}</Button>
        <Button size="sm" variant="lab" onClick={() => { setF(0); setPlaying(false); }}><RotateCcw className="size-3" /></Button>
      </>}
      controls={<Panel title="Star"><div className="space-y-4">
        <Param label="Initial mass" value={M} min={0.1} max={60} log unit="M☉" onChange={setM} hint="Mass decides almost everything: lifetime, colour and fate." />
        <Param label="Metallicity Z" value={Z} min={0.0001} max={0.04} step={0.0005} onChange={setZ} format={(v) => v.toFixed(4)} />
        <Param label="Rotation" value={rot} min={0} max={300} step={1} unit="km/s" onChange={setRot} />
        <Param label="Life elapsed" value={f} min={0} max={1} step={0.001} onChange={setF} format={(v) => `${(v * 100).toFixed(1)}%`} />
      </div></Panel>}
      side={<Panel title="Stellar properties">
        <Readout label="Stage" value={st.stage} tone="cyan" />
        <Readout label="Luminosity" value={st.L} unit="L☉" si={astro.solarLum(st.L).si} />
        <Readout label="Surface T" value={Math.round(st.T)} unit="K" tone="amber" />
        <Readout label="Radius" value={st.R} unit="R☉" si={astro.solarRadius(st.R).si} />
        <Readout label="Core mass" value={st.coreMass} unit="M☉" />
        <Readout label="MS lifetime" value={astro.years(msLifetime(M)).display} />
        <Readout label="Fate" value={`${rem.type} (${rem.mass.toFixed(2)} M☉)`} tone="violet" />
      </Panel>}
      equations={[
        { name: "Mass–luminosity", latex: "L \\propto M^{3.5}", symbols: [{ symbol: "L", meaning: "luminosity", unit: "L☉" }, { symbol: "M", meaning: "mass", unit: "M☉" }], kind: "approximation" },
        { name: "MS lifetime", latex: "t_{MS} \\approx 10^{10}\\,\\text{yr}\\,(M/M_\\odot)^{-2.5}", symbols: [{ symbol: "t", meaning: "lifetime", unit: "yr" }], kind: "approximation" },
        { name: "Stefan–Boltzmann", latex: "L = 4\\pi R^2\\sigma T^4", symbols: [{ symbol: "σ", meaning: "Stefan–Boltzmann constant" }], kind: "exact" },
      ]}
      assumptions={["Piecewise scaling-relation track, not a full stellar-structure code", "Single, non-interacting star", "Remnant thresholds: 8 M☉ (NS) and 20 M☉ (BH), mildly metallicity-dependent", "Rotation affects visuals only"]}
      physicsNotes={[`At ${M.toFixed(2)} M☉ the main sequence lasts ${astro.years(msLifetime(M)).display}.`, M >= 8 ? "Massive enough to fuse up to iron and collapse." : "Will shed its envelope and leave a white dwarf.", "Watch the star move right (cooler) and up (brighter) as it becomes a giant."]}
    >
      <Panel className="p-0"><canvas ref={ref} className="h-[340px] w-full" aria-label="Star visualization" /></Panel>
      <Panel title="Hertzsprung–Russell track">
        <SciChart logX logY reverseX xLabel="T_eff (K)" yLabel="L (L☉)" height={280}
          series={[{ key: "t", name: "evolutionary track", data: track }, { key: "n", name: "now", data: st.L > 0 ? [{ x: Math.max(2000, st.T), y: Math.max(1e-4, st.L) }] : [], dots: true }]} />
      </Panel>
    </LabLayout>
  );
}
