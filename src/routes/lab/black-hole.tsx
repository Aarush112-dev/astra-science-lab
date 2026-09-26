import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas, tempToColor } from "@/components/lab/useCanvas";
import { G, c, M_sun, schwarzschildRadius } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";

export const Route = createFileRoute("/lab/black-hole")({ head: () => labHead("black-hole"), component: BlackHole });

/** ISCO radius in units of GM/c² for dimensionless spin a (prograde) — Bardeen et al. 1972 */
function iscoRg(a: number) {
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  return 3 + z2 - Math.sign(a) * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
}

function BlackHole() {
  const [diff, setDiff] = useState<Difficulty>("Advanced");
  const [M, setM] = useState(10);
  const [spin, setSpin] = useState(0.5);
  const [inc, setInc] = useState(75);
  const [Td, setTd] = useState(8000);

  const rs = schwarzschildRadius(M * M_sun);
  const rg = rs / 2;
  const risco = iscoRg(spin) * rg;
  const rH = rg * (1 + Math.sqrt(1 - spin * spin));
  const fISCO = Math.sqrt((G * M * M_sun) / risco ** 3) / (2 * Math.PI);
  const eff = 1 - Math.sqrt(1 - 2 / (3 * iscoRg(spin)));

  const ref = useCanvas((ctx, w, h, _dt, t) => {
    ctx.fillStyle = "#020308"; ctx.fillRect(0, 0, w, h);
    // background stars (lensed radially)
    const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.08;
    for (let i = 0; i < 220; i++) {
      const a = (i * 2.399) % (2 * Math.PI), d0 = ((i * 97) % 400) + 10;
      const d = d0 + (R0 * R0 * 4) / d0; // point-lens image displacement
      ctx.fillStyle = `rgba(255,255,255,${0.2 + ((i * 13) % 7) / 10})`;
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.2, 1.2);
    }
    const cosi = Math.cos((inc * Math.PI) / 180);
    const rin = R0 * (iscoRg(spin) / 2) * 0.9, rout = R0 * 7;
    const drawDisk = (back: boolean) => {
      for (let r = rout; r >= rin; r -= 2) {
        const Tr = Td * Math.pow(rin / r, 0.75);
        for (let k = 0; k < 64; k++) {
          const ph = (k / 64) * Math.PI * 2 + t * 0.6 * Math.pow(rin / r, 1.5);
          const s = Math.sin(ph);
          if (back ? s > 0 : s <= 0) continue;
          const vx = Math.cos(ph + Math.PI / 2) * 0.5 * Math.sqrt(rin / r);
          const beam = Math.pow(1 + vx * Math.sin((inc * Math.PI) / 180), 3);
          ctx.fillStyle = tempToColor(Math.min(30000, Tr * (1 + vx * 0.3))).replace("rgb", "rgba").replace(")", `,${Math.min(1, 0.15 * beam)})`);
          ctx.fillRect(cx + Math.cos(ph) * r, cy + s * r * cosi - (back ? (R0 * 1.2 * (1 - cosi)) * (rin / r) : 0), 3, 3);
        }
      }
    };
    drawDisk(true);
    // photon ring
    ctx.strokeStyle = "rgba(255,210,150,0.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R0 * 1.3, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(cx, cy, R0 * (rH / rs), 0, 7); ctx.fill();
    drawDisk(false);
    ctx.fillStyle = "rgba(200,210,230,0.7)"; ctx.font = "11px JetBrains Mono";
    ctx.fillText(`i = ${inc}°  a* = ${spin.toFixed(2)}`, 12, 20);
  });

  const iscoCurve = useMemo(() => Array.from({ length: 60 }, (_, i) => { const a = -0.99 + (i / 59) * 1.98; return { x: a, y: iscoRg(a) }; }), []);
  const context = useMemo(() => ({
    simulationId: "black-hole", simulationName: "Black Hole",
    parameters: { mass_Msun: M, spin: spin, inclination_deg: inc, diskTemp_K: Td },
    measurements: { schwarzschildRadius_km: +(rs / 1000).toFixed(3), horizon_km: +(rH / 1000).toFixed(3), isco_km: +(risco / 1000).toFixed(3), iscoFrequency_Hz: +fISCO.toPrecision(4), radiativeEfficiency: +eff.toFixed(4) },
    series: { "ISCO vs spin": iscoCurve },
  }), [M, spin, inc, Td, rs, rH, risco, fISCO, eff, iscoCurve]);

  return (
    <LabLayout simulationId="black-hole" difficulty={diff} onDifficultyChange={setDiff} context={context}
      controls={<Panel title="Black hole"><div className="space-y-4">
        <Param label="Mass" value={M} min={3} max={1e10} log unit="M☉" onChange={setM} hint="Stellar (~10) to supermassive (~10⁹)." />
        <Param label="Spin a*" value={spin} min={-0.99} max={0.998} step={0.001} onChange={setSpin} hint="Negative = retrograde disk." />
        <Param label="Viewing inclination" value={inc} min={0} max={89} step={1} unit="°" onChange={setInc} />
        <Param label="Inner disk temperature" value={Td} min={2000} max={30000} step={100} unit="K" onChange={setTd} />
      </div></Panel>}
      side={<Panel title="Measurements">
        <Readout label="Schwarzschild r_s" value={rs / 1000} unit="km" tone="cyan" />
        <Readout label="Event horizon r₊" value={rH / 1000} unit="km" />
        <Readout label="ISCO" value={risco / 1000} unit="km" tone="amber" />
        <Readout label="ISCO (GM/c²)" value={iscoRg(spin)} />
        <Readout label="f_ISCO" value={fISCO} unit="Hz" tone="violet" />
        <Readout label="Radiative efficiency η" value={`${(eff * 100).toFixed(1)} %`} />
        <Readout label="Photon sphere (a=0)" value={(1.5 * rs) / 1000} unit="km" />
      </Panel>}
      equations={[
        { name: "Schwarzschild radius", latex: "r_s = \\frac{2GM}{c^2}", symbols: [{ symbol: "M", meaning: "mass", unit: "kg" }, { symbol: "c", meaning: "speed of light" }], kind: "exact" },
        { name: "Kerr horizon", latex: "r_+ = \\frac{GM}{c^2}\\left(1+\\sqrt{1-a_*^2}\\right)", symbols: [{ symbol: "a_*", meaning: "dimensionless spin" }], kind: "exact" },
        { name: "Orbital frequency", latex: "f = \\frac{1}{2\\pi}\\sqrt{\\frac{GM}{r^3}}", symbols: [{ symbol: "r", meaning: "orbital radius", unit: "m" }], kind: "approximation" },
      ]}
      assumptions={["Kerr ISCO from Bardeen–Press–Teukolsky formula", "Thin Shakura–Sunyaev disk, T ∝ r^(-3/4)", "Lensing and beaming are illustrative, not ray-traced", `c = ${c.toExponential(3)} m/s`]}
      physicsNotes={[`Spin ${spin > 0 ? "shrinks" : "grows"} the ISCO, so the disk can reach ${eff > 0.1 ? "very " : ""}deep into the potential well.`, "The approaching side of the disk is brighter — relativistic beaming.", "Frequency scales as 1/M: supermassive holes orbit slowly."]}
    >
      <Panel className="p-0"><canvas ref={ref} className="h-[420px] w-full" aria-label="Black hole render" /></Panel>
      <Panel title="ISCO radius vs spin">
        <SciChart xLabel="spin a*" yLabel="r_ISCO (GM/c²)" height={220} series={[{ key: "i", name: "ISCO", data: iscoCurve }, { key: "n", name: "current", data: [{ x: spin, y: iscoRg(spin) }], dots: true }]} />
      </Panel>
    </LabLayout>
  );
}
