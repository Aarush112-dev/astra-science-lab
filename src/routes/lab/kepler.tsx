import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { Button } from "@/components/ui/button";
import { useCanvas, cssVar } from "@/components/lab/useCanvas";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";

export const Route = createFileRoute("/lab/kepler")({
  head: () => labHead("kepler"),
  component: Kepler,
});

function solveE(M: number, e: number) {
  let E = M;
  for (let i = 0; i < 30; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

function Kepler() {
  const [diff, setDiff] = useState<Difficulty>("Beginner");
  const [a, setA] = useState(1.5);
  const [e, setE] = useState(0.5);
  const [Ms, setMs] = useState(1);
  const [runs, setRuns] = useState<{ a: number; T: number }[]>([]);
  const T = Math.sqrt(a ** 3 / Ms);
  const phase = useRef(0);

  const ref = useCanvas((ctx, w, h, dt) => {
    phase.current = (phase.current + dt / (T * 1.2)) % 1;
    ctx.fillStyle = cssVar("--background", "#05070d");
    ctx.fillRect(0, 0, w, h);
    const sc = Math.min(w, h) / (2 * a * (1 + e) * 1.15);
    const b = a * Math.sqrt(1 - e * e),
      c = a * e;
    const cx = w / 2 + c * sc,
      cy = h / 2; // focus at centre-ish
    const fx = w / 2,
      fy = h / 2;
    // 12 equal-time sectors
    for (let k = 0; k < 12; k++) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      for (let j = 0; j <= 20; j++) {
        const Mm = ((k + j / 20) / 12) * 2 * Math.PI;
        const E = solveE(Mm, e);
        ctx.lineTo(cx - a * Math.cos(E) * sc + 0, cy - b * Math.sin(E) * sc);
      }
      ctx.closePath();
      ctx.fillStyle = k % 2 ? "rgba(92,225,255,0.10)" : "rgba(167,139,250,0.10)";
      ctx.fill();
    }
    ctx.strokeStyle = cssVar("--cyan", "#5ce1ff");
    ctx.beginPath();
    ctx.ellipse(cx, cy, a * sc, b * sc, 0, 0, 7);
    ctx.stroke();
    ctx.fillStyle = "#ffcc55";
    ctx.beginPath();
    ctx.arc(fx, fy, 10, 0, 7);
    ctx.fill();
    const E = solveE(phase.current * 2 * Math.PI, e);
    const px = cx - a * Math.cos(E) * sc,
      py = cy - b * Math.sin(E) * sc;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.fillStyle = cssVar("--cyan", "#5ce1ff");
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(200,210,230,0.6)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText("Shaded sectors: equal time intervals → equal areas", 12, 20);
  });

  const peri = a * (1 - e),
    apo = a * (1 + e);
  const vr = Math.sqrt((1 + e) / (1 - e));
  const series = runs.map((r) => ({ x: r.a ** 3, y: r.T ** 2 }));
  const context = useMemo(
    () => ({
      simulationId: "kepler",
      simulationName: "Kepler's Laws",
      parameters: { a_AU: a, e, centralMass_Msun: Ms },
      measurements: {
        period_yr: +T.toFixed(4),
        perihelion_AU: +peri.toFixed(3),
        aphelion_AU: +apo.toFixed(3),
        speedRatio_peri_apo: +vr.toFixed(3),
        recordedRuns: runs.length,
      },
      series: { "T² vs a³": series },
    }),
    [a, e, Ms, runs, T, peri, apo, vr, series],
  );

  return (
    <LabLayout
      simulationId="kepler"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      controls={
        <Panel title="Orbit">
          <div className="space-y-4">
            <Param
              label="Semi-major axis a"
              value={a}
              min={0.3}
              max={10}
              step={0.05}
              unit="AU"
              onChange={setA}
            />
            <Param
              label="Eccentricity e"
              value={e}
              min={0}
              max={0.95}
              step={0.01}
              onChange={setE}
            />
            <Param
              label="Star mass"
              value={Ms}
              min={0.2}
              max={4}
              step={0.05}
              unit="M☉"
              onChange={setMs}
            />
            <Button
              size="sm"
              variant="glow"
              className="w-full"
              onClick={() => setRuns((r) => [...r, { a, T }])}
            >
              Record measurement
            </Button>
            <Button size="sm" variant="lab" className="w-full" onClick={() => setRuns([])}>
              Clear data
            </Button>
          </div>
        </Panel>
      }
      side={
        <Panel title="Measurements">
          <Readout label="Period T" value={T} unit="yr" tone="cyan" />
          <Readout label="Perihelion" value={peri} unit="AU" />
          <Readout label="Aphelion" value={apo} unit="AU" />
          <Readout label="v_peri / v_apo" value={vr} tone="amber" />
          <Readout label="T² / a³" value={(T * T) / a ** 3} unit="yr²/AU³" tone="violet" />
        </Panel>
      }
      equations={[
        {
          name: "Kepler III",
          latex: "T^2 = \\frac{4\\pi^2}{G M}a^3",
          symbols: [
            { symbol: "T", meaning: "period", unit: "s" },
            { symbol: "a", meaning: "semi-major axis", unit: "m" },
          ],
          kind: "exact",
        },
        {
          name: "Kepler's equation",
          latex: "M = E - e\\sin E",
          symbols: [
            { symbol: "M", meaning: "mean anomaly" },
            { symbol: "E", meaning: "eccentric anomaly" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={["Planet mass ≪ star mass", "Two-body problem, no perturbations"]}
      physicsNotes={[
        "The planet moves fastest at perihelion — equal areas in equal times.",
        "Record orbits at several a values: T² vs a³ should be a straight line of gradient 1/M.",
      ]}
    >
      <Panel className="p-0">
        <canvas ref={ref} className="h-[400px] w-full" aria-label="Kepler orbit" />
      </Panel>
      <Panel title="T² vs a³ (your recorded runs)">
        <SciChart
          scatter
          xLabel="a³ (AU³)"
          yLabel="T² (yr²)"
          height={240}
          series={[{ key: "r", name: "measured", data: series, dots: true }]}
        />
      </Panel>
    </LabLayout>
  );
}
