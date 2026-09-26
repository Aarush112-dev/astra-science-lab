import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { Button } from "@/components/ui/button";
import { useCanvas } from "@/components/lab/useCanvas";
import { R_jup, R_sun } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";

export const Route = createFileRoute("/lab/exoplanet-transit")({ head: () => labHead("exoplanet-transit"), component: Transit });

// deterministic PRNG so SSR and client agree
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function gauss(r: () => number) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }

/** Overlap fraction of planet disk (radius p, centre distance z, stellar radius 1) with limb darkening u */
function flux(z: number, p: number, u: number) {
  if (z >= 1 + p) return 1;
  // numeric: sample planet disk
  let blocked = 0, n = 0;
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const x = (i / 6) * p, y = (j / 6) * p;
    if (x * x + y * y > p * p) continue;
    const r = Math.hypot(z + x, y);
    n++;
    if (r < 1) blocked += 1 - u * (1 - Math.sqrt(1 - r * r));
  }
  const area = Math.PI * p * p;
  return 1 - (blocked / n) * area / (Math.PI * (1 - u / 3));
}

function Transit() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [Rp, setRp] = useState(1);
  const [P, setP] = useState(3.5);
  const [b, setB] = useState(0.3);
  const [noise, setNoise] = useState(500);
  const [ld, setLd] = useState(0.5);
  const [detect, setDetect] = useState<null | { depth: number; period: number; snr: number }>(null);

  const p = (Rp * R_jup) / R_sun;
  const aR = 8.8 * Math.cbrt((P / 3.5) ** 2); // a/R* for sun-like star
  const dur = (P * 24 / Math.PI) * Math.asin(Math.sqrt(Math.max(0, (1 + p) ** 2 - b * b)) / aR);
  const days = 12;

  const data = useMemo(() => {
    const r = rng(42 + Math.round(noise));
    const pts: { x: number; y: number }[] = [], model: { x: number; y: number }[] = [];
    for (let i = 0; i < 900; i++) {
      const t = (i / 900) * days;
      const ph = ((t / P + 0.5) % 1) - 0.5;
      const xs = ph * 2 * Math.PI * aR;
      const z = Math.hypot(xs, b);
      const f = Math.abs(ph) < 0.25 ? flux(z, p, ld) : 1;
      model.push({ x: t, y: f });
      pts.push({ x: t, y: f + (gauss(r) * noise) / 1e6 });
    }
    return { pts, model };
  }, [P, p, b, noise, ld, aR]);

  const runBLS = () => {
    let best = { period: 0, depth: 0, snr: 0 };
    for (let Pt = 1; Pt <= 8; Pt += 0.01) {
      let inS = 0, inN = 0, outS = 0, outN = 0;
      const w = Math.max(0.01, (dur / 24 / Pt) / 2);
      for (const q of data.pts) {
        const ph = ((q.x / Pt + 0.5) % 1) - 0.5;
        if (Math.abs(ph) < w) { inS += q.y; inN++; } else { outS += q.y; outN++; }
      }
      if (inN < 3) continue;
      const d = outS / outN - inS / inN;
      const snr = (d / (noise / 1e6 + 1e-9)) * Math.sqrt(inN);
      if (snr > best.snr) best = { period: Pt, depth: d * 1e6, snr };
    }
    setDetect(best);
  };

  const ref = useCanvas((ctx, w, h, _dt, t) => {
    ctx.fillStyle = "#03050b"; ctx.fillRect(0, 0, w, h);
    const R = h * 0.35, cx = w / 2, cy = h / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, "#fff7dd"); g.addColorStop(1 - ld * 0.3, "#ffcf6a"); g.addColorStop(1, `rgba(220,120,40,${1 - ld * 0.6})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    const ph = ((t * 0.08) % 1) - 0.5;
    const x = cx + ph * 2 * R * 2.2, y = cy + b * R;
    ctx.fillStyle = "#0a0d18"; ctx.beginPath(); ctx.arc(x, y, Math.max(2, p * R), 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
  });

  const depth = (1 - Math.min(...data.model.map((q) => q.y))) * 1e6;
  const context = useMemo(() => ({
    simulationId: "exoplanet-transit", simulationName: "Exoplanet Transit",
    parameters: { planetRadius_Rjup: Rp, period_d: P, impactParameter: b, noise_ppm: noise, limbDarkening_u: ld },
    measurements: { trueDepth_ppm: Math.round(depth), radiusRatio: +p.toFixed(4), duration_h: +dur.toFixed(2), ...(detect ? { detectedPeriod_d: +detect.period.toFixed(3), detectedDepth_ppm: Math.round(detect.depth), detectionSNR: +detect.snr.toFixed(1) } : {}) },
    series: { lightCurve: data.pts.filter((_, i) => i % 3 === 0) },
  }), [Rp, P, b, noise, ld, depth, p, dur, detect, data]);

  return (
    <LabLayout simulationId="exoplanet-transit" difficulty={diff} onDifficultyChange={setDiff} context={context}
      controls={<Panel title="System"><div className="space-y-4">
        <Param label="Planet radius" value={Rp} min={0.05} max={2} step={0.01} unit="R_J" onChange={(v) => { setRp(v); setDetect(null); }} hint="Earth ≈ 0.09 R_J" />
        <Param label="Orbital period" value={P} min={1} max={8} step={0.05} unit="d" onChange={(v) => { setP(v); setDetect(null); }} />
        <Param label="Impact parameter b" value={b} min={0} max={1.2} step={0.01} onChange={setB} />
        <Param label="Photometric noise" value={noise} min={0} max={5000} step={10} unit="ppm" onChange={setNoise} />
        <Param label="Limb darkening u" value={ld} min={0} max={1} step={0.01} onChange={setLd} />
        <Button variant="glow" size="sm" className="w-full" onClick={runBLS}>Run automated detection</Button>
      </div></Panel>}
      side={<Panel title="Measurements">
        <Readout label="Rp / R*" value={p} tone="cyan" />
        <Readout label="True depth" value={Math.round(depth)} unit="ppm" />
        <Readout label="Duration" value={dur} unit="h" />
        {detect ? <>
          <Readout label="BLS period" value={detect.period} unit="d" tone="emerald" />
          <Readout label="BLS depth" value={Math.round(detect.depth)} unit="ppm" tone="emerald" />
          <Readout label="Recovered Rp/R*" value={Math.sqrt(Math.max(0, detect.depth) / 1e6)} tone="amber" />
          <Readout label="SNR" value={detect.snr} tone={detect.snr > 7 ? "emerald" : "rose"} />
          <Readout label="Verdict" value={detect.snr > 7 ? "Planet detected" : "No significant signal"} tone={detect.snr > 7 ? "emerald" : "rose"} />
        </> : <p className="pt-2 text-xs text-muted-foreground">Run detection to search the light curve.</p>}
      </Panel>}
      equations={[{ name: "Transit depth", latex: "\\delta \\approx \\left(\\frac{R_p}{R_*}\\right)^2", symbols: [{ symbol: "R_p", meaning: "planet radius" }, { symbol: "R_*", meaning: "stellar radius" }], kind: "approximation" }, { name: "Linear limb darkening", latex: "I(\\mu) = I_0[1-u(1-\\mu)]", symbols: [{ symbol: "μ", meaning: "cos of emergent angle" }], kind: "model" }]}
      assumptions={["Sun-like host star, circular orbit", "Gaussian white noise; deterministic seed", "Box Least Squares search over 1–8 d"]}
      physicsNotes={[b > 1 + p ? "Impact parameter too large — the planet misses the stellar disk!" : "The dip depth tracks (Rp/R*)².", "Limb darkening rounds the bottom of the transit."]}
    >
      <Panel className="p-0"><canvas ref={ref} className="h-[260px] w-full" aria-label="Transit view" /></Panel>
      <Panel title="Light curve">
        <SciChart scatter xLabel="time (d)" yLabel="relative flux" height={300} series={[{ key: "d", name: "photometry", data: data.pts.filter((_, i) => i % 2 === 0), dots: true }, { key: "m", name: "model", data: data.model }]} />
      </Panel>
    </LabLayout>
  );
}
