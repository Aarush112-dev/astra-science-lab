import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { tempToColor } from "@/components/lab/useCanvas";
import { msLifetime } from "@/lib/physics/stellar";
import { astro } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";

export const Route = createFileRoute("/lab/hr-diagram")({
  head: () => labHead("hr-diagram"),
  component: HR,
});

const REF = [
  { n: "Sun", T: 5772, L: 1 },
  { n: "Sirius A", T: 9940, L: 25.4 },
  { n: "Betelgeuse", T: 3600, L: 1.26e5 },
  { n: "Rigel", T: 12100, L: 1.2e5 },
  { n: "Proxima Cen", T: 3042, L: 0.0017 },
  { n: "Sirius B", T: 25200, L: 0.056 },
  { n: "Vega", T: 9600, L: 40 },
  { n: "Arcturus", T: 4290, L: 170 },
  { n: "Aldebaran", T: 3900, L: 440 },
  { n: "Spica", T: 22400, L: 20500 },
  { n: "Barnard's Star", T: 3130, L: 0.0035 },
  { n: "Procyon B", T: 7740, L: 0.00049 },
];

function spectralClass(T: number) {
  return T > 30000
    ? "O"
    : T > 10000
      ? "B"
      : T > 7500
        ? "A"
        : T > 6000
          ? "F"
          : T > 5200
            ? "G"
            : T > 3700
              ? "K"
              : "M";
}

function region(T: number, L: number) {
  const Lms = Math.pow(T / 5772, 7); // rough MS
  if (L > Lms * 30) return L > 1e4 ? "Supergiant" : "Giant";
  if (L < Lms / 50) return "White dwarf";
  return "Main sequence";
}

function HR() {
  const [diff, setDiff] = useState<Difficulty>("Beginner");
  const [T, setT] = useState(5772);
  const [L, setL] = useState(1);
  const R = Math.sqrt(L) / (T / 5772) ** 2;
  const reg = region(T, L);
  const Mms = reg === "Main sequence" ? Math.pow(L, 1 / 3.5) : NaN;
  const ms = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const m = 10 ** (-1 + (i / 59) * 2.2);
        const Lm = m < 0.43 ? 0.23 * m ** 2.3 : m ** 3.5;
        const Rm = m < 1 ? m ** 0.8 : m ** 0.57;
        return { x: 5772 * (Lm / Rm ** 2) ** 0.25, y: Lm };
      }),
    [],
  );
  const radiusLines = [0.01, 1, 100].map((r) => ({
    key: `R${r}`,
    name: `R = ${r} R☉`,
    dashed: true,
    data: [2500, 5000, 10000, 20000, 40000].map((t) => ({ x: t, y: r * r * (t / 5772) ** 4 })),
  }));
  const context = useMemo(
    () => ({
      simulationId: "hr-diagram",
      simulationName: "Hertzsprung–Russell Diagram",
      parameters: { T_K: Math.round(T), L_Lsun: +L.toPrecision(3) },
      measurements: {
        radius_Rsun: +R.toPrecision(3),
        spectralClass: spectralClass(T),
        region: reg,
        ...(Number.isFinite(Mms)
          ? { mass_Msun: +Mms.toFixed(2), lifetime_yr: +msLifetime(Mms).toPrecision(3) }
          : {}),
      },
    }),
    [T, L, R, reg, Mms],
  );

  return (
    <LabLayout
      simulationId="hr-diagram"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      controls={
        <Panel title="Place a star">
          <div className="space-y-4">
            <Param
              label="Surface temperature"
              value={T}
              min={2500}
              max={40000}
              log
              unit="K"
              onChange={setT}
              format={(v) => Math.round(v).toString()}
            />
            <Param
              label="Luminosity"
              value={L}
              min={1e-4}
              max={1e6}
              log
              unit="L☉"
              onChange={setL}
            />
            <div className="flex items-center gap-3">
              <span
                className="size-10 rounded-full"
                style={{ background: tempToColor(T), boxShadow: `0 0 24px ${tempToColor(T)}` }}
              />
              <span className="text-xs text-muted-foreground">Apparent colour</span>
            </div>
            <div className="label-mono">Load reference star</div>
            <div className="flex flex-wrap gap-1">
              {REF.map((s) => (
                <button
                  key={s.n}
                  onClick={() => {
                    setT(s.T);
                    setL(s.L);
                  }}
                  className="rounded-sm border px-1.5 py-0.5 text-[10px] hover:border-primary"
                >
                  {s.n}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      }
      side={
        <Panel title="Derived">
          <Readout label="Radius" value={R} unit="R☉" si={astro.solarRadius(R).si} tone="cyan" />
          <Readout label="Spectral class" value={spectralClass(T)} tone="amber" />
          <Readout label="Region" value={reg} tone="violet" />
          <Readout label="Peak λ (Wien)" value={(2.898e-3 / T) * 1e9} unit="nm" />
          {Number.isFinite(Mms) && (
            <>
              <Readout label="Mass (MS)" value={Mms} unit="M☉" />
              <Readout label="MS lifetime" value={astro.years(msLifetime(Mms)).display} />
            </>
          )}
        </Panel>
      }
      equations={[
        {
          name: "Radius from L and T",
          latex:
            "\\frac{R}{R_\\odot} = \\sqrt{\\frac{L}{L_\\odot}}\\left(\\frac{T_\\odot}{T}\\right)^2",
          symbols: [{ symbol: "R", meaning: "radius" }],
          kind: "exact",
        },
        {
          name: "Wien",
          latex: "\\lambda_{max} = b/T",
          symbols: [{ symbol: "b", meaning: "2.898×10⁻³ m K" }],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Stars radiate as blackbodies",
        "Mass and lifetime inferred only for main-sequence stars",
      ]}
      physicsNotes={[
        `This star is ${R > 10 ? "much larger" : R < 0.1 ? "much smaller" : "comparable in size"} compared with the Sun.`,
        "Diagonal dashed lines are constant radius.",
      ]}
    >
      <Panel title="HR diagram">
        <SciChart
          logX
          logY
          reverseX
          height={460}
          xLabel="T_eff (K)"
          yLabel="L (L☉)"
          xDomain={[2500, 40000]}
          yDomain={[1e-4, 1e6]}
          series={[
            { key: "ms", name: "main sequence", data: ms },
            ...radiusLines,
            {
              key: "ref",
              name: "reference stars",
              data: REF.map((s) => ({ x: s.T, y: s.L })),
              dots: true,
            },
            { key: "you", name: "your star", data: [{ x: T, y: L }], dots: true },
          ]}
        />
      </Panel>
    </LabLayout>
  );
}
