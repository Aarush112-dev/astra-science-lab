import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { Button } from "@/components/ui/button";
import { useCanvas, useTicker, cssVar } from "@/components/lab/useCanvas";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";

export const Route = createFileRoute("/lab/orbital-mechanics")({
  head: () => labHead("orbital-mechanics"),
  component: Orbital,
});

// Units: AU, years, solar masses -> G = 4π²
const GU = 4 * Math.PI ** 2;
const KMS = 4.74047; // 1 AU/yr in km/s

function Orbital() {
  const [diff, setDiff] = useState<Difficulty>("Beginner");
  const [M, setM] = useState(1);
  const [r0, setR0] = useState(1);
  const [v0, setV0] = useState(29.78);
  const [moon, setMoon] = useState(false);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const sim = useRef({
    x: 1,
    y: 0,
    vx: 0,
    vy: 29.78 / KMS,
    t: 0,
    trail: [] as [number, number][],
    E: [] as { x: number; y: number }[],
    K: [] as { x: number; y: number }[],
    U: [] as { x: number; y: number }[],
    mx: 1.2,
    my: 0,
    mvx: 0,
    mvy: 0,
  });
  useTicker(300);

  const reset = (r = r0, v = v0, m = M) => {
    const vu = v / KMS;
    const s = sim.current;
    Object.assign(s, {
      x: r,
      y: 0,
      vx: 0,
      vy: vu,
      t: 0,
      trail: [],
      E: [],
      K: [],
      U: [],
      mx: r * 1.6,
      my: 0,
      mvx: 0,
      mvy: Math.sqrt((GU * m) / (r * 1.6)),
    });
  };

  const ref = useCanvas((ctx, w, h, dt) => {
    const s = sim.current;
    const sub = 200;
    const h_ = (dt * speed * 0.5) / sub;
    for (let i = 0; i < sub && dt > 0; i++) {
      const acc = (x: number, y: number, withMoon: boolean) => {
        const r = Math.hypot(x, y);
        let ax = (-GU * M * x) / r ** 3,
          ay = (-GU * M * y) / r ** 3;
        if (withMoon && moon) {
          const dx = x - s.mx,
            dy = y - s.my,
            d = Math.max(0.02, Math.hypot(dx, dy));
          ax += (-GU * 0.001 * dx) / d ** 3;
          ay += (-GU * 0.001 * dy) / d ** 3;
        }
        return [ax, ay];
      };
      // velocity Verlet (symplectic)
      let [ax, ay] = acc(s.x, s.y, true);
      s.vx += 0.5 * h_ * ax;
      s.vy += 0.5 * h_ * ay;
      s.x += h_ * s.vx;
      s.y += h_ * s.vy;
      [ax, ay] = acc(s.x, s.y, true);
      s.vx += 0.5 * h_ * ax;
      s.vy += 0.5 * h_ * ay;
      if (moon) {
        let [bx, by] = acc(s.mx, s.my, false);
        s.mvx += 0.5 * h_ * bx;
        s.mvy += 0.5 * h_ * by;
        s.mx += h_ * s.mvx;
        s.my += h_ * s.mvy;
        [bx, by] = acc(s.mx, s.my, false);
        s.mvx += 0.5 * h_ * bx;
        s.mvy += 0.5 * h_ * by;
      }
      s.t += h_;
    }
    if (dt > 0) {
      s.trail.push([s.x, s.y]);
      if (s.trail.length > 1500) s.trail.shift();
      const r = Math.hypot(s.x, s.y);
      const K = 0.5 * (s.vx ** 2 + s.vy ** 2),
        U = (-GU * M) / r;
      if (s.E.length === 0 || s.t - s.E[s.E.length - 1].x > 0.01) {
        s.E.push({ x: s.t, y: K + U });
        s.K.push({ x: s.t, y: K });
        s.U.push({ x: s.t, y: U });
        if (s.E.length > 400) {
          s.E.shift();
          s.K.shift();
          s.U.shift();
        }
      }
    }
    const scale = Math.min(w, h) / (2 * Math.max(3, r0 * 2.4));
    ctx.fillStyle = cssVar("--background", "#05070d");
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120,160,255,0.07)";
    for (let g = -10; g <= 10; g++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + g * scale, 0);
      ctx.lineTo(w / 2 + g * scale, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, h / 2 + g * scale);
      ctx.lineTo(w, h / 2 + g * scale);
      ctx.stroke();
    }
    const cx = w / 2,
      cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * Math.cbrt(M));
    grad.addColorStop(0, "#fff6d0");
    grad.addColorStop(0.4, "#ffc24a");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18 * Math.cbrt(M), 0, 7);
    ctx.fill();
    ctx.strokeStyle = cssVar("--cyan", "#5ce1ff");
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    s.trail.forEach(([x, y], i) =>
      i ? ctx.lineTo(cx + x * scale, cy - y * scale) : ctx.moveTo(cx + x * scale, cy - y * scale),
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssVar("--cyan", "#5ce1ff");
    ctx.beginPath();
    ctx.arc(cx + s.x * scale, cy - s.y * scale, 5, 0, 7);
    ctx.fill();
    // velocity vector
    ctx.strokeStyle = cssVar("--amber", "#ffb547");
    ctx.beginPath();
    ctx.moveTo(cx + s.x * scale, cy - s.y * scale);
    ctx.lineTo(cx + (s.x + s.vx * 0.08) * scale, cy - (s.y + s.vy * 0.08) * scale);
    ctx.stroke();
    if (moon) {
      ctx.fillStyle = cssVar("--violet", "#a78bfa");
      ctx.beginPath();
      ctx.arc(cx + s.mx * scale, cy - s.my * scale, 6, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(200,210,230,0.6)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(`t = ${s.t.toFixed(2)} yr`, 12, 20);
    ctx.fillText(`1 grid = 1 AU`, 12, 36);
  }, running);

  const s = sim.current;
  const r = Math.hypot(s.x, s.y);
  const v = Math.hypot(s.vx, s.vy);
  const E = 0.5 * v * v - (GU * M) / r;
  const Lz = s.x * s.vy - s.y * s.vx;
  const a = E < 0 ? (-GU * M) / (2 * E) : Infinity;
  const ecc = Math.sqrt(Math.max(0, 1 + (2 * E * Lz * Lz) / (GU * M) ** 2));
  const vesc = Math.sqrt((2 * GU * M) / r0) * KMS;
  const vcirc = Math.sqrt((GU * M) / r0) * KMS;
  const T = E < 0 ? Math.sqrt(a ** 3 / M) : NaN;
  const state =
    E >= 0
      ? "Escape trajectory (unbound)"
      : ecc < 0.05
        ? "Near-circular bound orbit"
        : "Elliptical bound orbit";

  const eccStr = ecc.toFixed(3);
  const context = useMemo(
    () => ({
      simulationId: "orbital-mechanics",
      simulationName: "Orbital Mechanics",
      parameters: { centralMass_Msun: M, r0_AU: r0, v0_kms: +v0.toFixed(2), perturber: moon },
      measurements: {
        eccentricity: +ecc.toFixed(4),
        totalEnergy: +E.toFixed(3),
        period_yr: +T.toFixed(3),
        escapeSpeed_kms: +vesc.toFixed(2),
        circularSpeed_kms: +vcirc.toFixed(2),
      },
      notes: [state],
      series: { totalEnergy: s.E.slice(), kinetic: s.K.slice() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [M, r0, v0, moon, eccStr, state],
  );

  return (
    <LabLayout
      simulationId="orbital-mechanics"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button size="sm" variant="lab" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button size="sm" variant="lab" onClick={() => reset()}>
            <RotateCcw className="size-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              const breakSpeed = +(vesc * 1.25).toFixed(2);
              setV0(breakSpeed);
              reset(r0, breakSpeed);
            }}
          >
            Break the Orbit (v &gt; v_esc)
          </Button>
        </>
      }
      controls={
        <Panel title="Initial conditions">
          <div className="space-y-4">
            <Param
              label="Central mass"
              value={M}
              min={0.2}
              max={5}
              step={0.05}
              unit="M☉"
              onChange={(x) => {
                setM(x);
                reset(r0, v0, x);
              }}
              hint="Mass of the star in solar masses."
            />
            <Param
              label="Start radius"
              value={r0}
              min={0.3}
              max={3}
              step={0.05}
              unit="AU"
              onChange={(x) => {
                setR0(x);
                reset(x, v0);
              }}
            />
            <Param
              label="Tangential speed"
              value={v0}
              min={5}
              max={70}
              step={0.1}
              unit="km/s"
              onChange={(x) => {
                setV0(x);
                reset(r0, x);
              }}
              hint="Earth moves at 29.78 km/s at 1 AU."
            />
            <Param
              label="Time warp"
              value={speed}
              min={0.2}
              max={5}
              step={0.1}
              unit="×"
              onChange={setSpeed}
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={moon}
                onChange={(e) => {
                  setMoon(e.target.checked);
                  reset();
                }}
              />{" "}
              Add Jupiter-like perturber
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="lab"
                onClick={() => {
                  setV0(+vcirc.toFixed(2));
                  reset(r0, vcirc);
                }}
              >
                Circular v
              </Button>
              <Button
                size="sm"
                variant="lab"
                onClick={() => {
                  const x = vesc * 1.001;
                  setV0(+x.toFixed(2));
                  reset(r0, x);
                }}
              >
                Escape v
              </Button>
            </div>
          </div>
        </Panel>
      }
      side={
        <Panel title="Live measurements">
          <Readout label="State" value={state} tone={E >= 0 ? "rose" : "emerald"} />
          <Readout label="Distance r" value={r} unit="AU" />
          <Readout label="Speed v" value={v * KMS} unit="km/s" />
          <Readout label="Eccentricity e" value={ecc} tone="cyan" />
          <Readout label="Semi-major axis a" value={Number.isFinite(a) ? a : "∞"} unit="AU" />
          <Readout label="Period T" value={Number.isFinite(T) ? T : "—"} unit="yr" />
          <Readout label="Specific energy" value={E} unit="AU²/yr²" tone="amber" />
          <Readout label="Ang. momentum" value={Lz} unit="AU²/yr" />
          <Readout label="v_circ at r₀" value={vcirc} unit="km/s" />
          <Readout label="v_esc at r₀" value={vesc} unit="km/s" tone="violet" />
        </Panel>
      }
      equations={[
        {
          name: "Newtonian gravity",
          latex: "\\vec a = -\\frac{GM}{r^3}\\vec r",
          symbols: [
            { symbol: "G", meaning: "gravitational constant" },
            { symbol: "M", meaning: "central mass", unit: "kg" },
          ],
          kind: "exact",
        },
        {
          name: "Vis-viva",
          latex: "v^2 = GM\\left(\\frac{2}{r} - \\frac{1}{a}\\right)",
          symbols: [{ symbol: "a", meaning: "semi-major axis", unit: "m" }],
          kind: "exact",
        },
        {
          name: "Escape speed",
          latex: "v_{esc} = \\sqrt{2GM/r}",
          symbols: [{ symbol: "r", meaning: "distance", unit: "m" }],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Point masses; star fixed at origin",
        "Velocity-Verlet (symplectic) integrator conserves energy well",
        "No relativistic precession or drag",
        "Perturber orbits the star but is not pulled by the test body",
      ]}
      physicsNotes={[
        state,
        E < 0
          ? "Total energy is negative, so the body is gravitationally bound."
          : "Total energy ≥ 0 — the body will never return.",
        `Kinetic and potential energy trade off; their sum stays constant (${moon ? "except for perturbations" : "to integrator precision"}).`,
      ]}
    >
      <Panel className="overflow-hidden p-0">
        <canvas ref={ref} className="h-[420px] w-full" aria-label="Orbit visualization" />
      </Panel>
      <Panel title="Energy vs time">
        <SciChart
          xLabel="t (yr)"
          yLabel="E (AU²/yr²)"
          height={220}
          series={[
            { key: "E", name: "Total", data: s.E.slice() },
            { key: "K", name: "Kinetic", data: s.K.slice() },
            { key: "U", name: "Potential", data: s.U.slice() },
          ]}
        />
      </Panel>
    </LabLayout>
  );
}
