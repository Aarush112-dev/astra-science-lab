import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLabStore, exportCSV } from "@/lib/store/lab-store";
import { SciChart } from "@/components/lab/SciChart";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fmt } from "@/lib/physics/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data Analysis Lab | ASTRA LAB" },
      {
        name: "description",
        content:
          "Plot experiment data, transform axes and fit linear, polynomial, power-law and exponential models with uncertainties.",
      },
      { property: "og:title", content: "Data Analysis Lab | ASTRA LAB" },
      {
        property: "og:description",
        content: "Fit models to your experimental data and read off the physics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataLab,
});

type Pt = { x: number; y: number };
type Transform = "none" | "log" | "ln" | "inv";
type RegressionType = "linear" | "polynomial" | "exponential" | "power";

const tf = (t: Transform, v: number) =>
  t === "log"
    ? v > 0
      ? Math.log10(v)
      : NaN
    : t === "ln"
      ? v > 0
        ? Math.log(v)
        : NaN
      : t === "inv"
        ? v !== 0
          ? 1 / v
          : NaN
        : v;

const SAMPLES = {
  arrhenius: `# Arrhenius data: T (K), k (s^-1)
300, 0.0021
320, 0.0098
340, 0.039
360, 0.135
380, 0.412
400, 1.150`,
  kepler: `# Planetary data: Semi-major axis a (AU), Period T (yr)
0.387, 0.241
0.723, 0.615
1.000, 1.000
1.524, 1.881
5.204, 11.862
9.582, 29.457`,
  stellar: `# Stellar physics: Mass (M_sun), Luminosity (L_sun)
0.5, 0.08
0.8, 0.45
1.0, 1.00
1.5, 4.80
2.0, 14.5
3.0, 78.0`,
};

function linfit(pts: Pt[]) {
  const n = pts.length;
  if (n < 2) return null;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxx = 0,
    sxy = 0,
    syy = 0;
  for (const p of pts) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
    syy += (p.y - my) ** 2;
  }
  if (sxx === 0) return null;
  const m = sxy / sxx;
  const b = my - m * mx;
  const res = pts.reduce((a, p) => a + (p.y - (m * p.x + b)) ** 2, 0);
  const r2 = syy === 0 ? 1 : Math.max(0, 1 - res / syy);
  const se = n > 2 ? Math.sqrt(res / (n - 2) / sxx) : 0;
  const seb = n > 2 ? se * Math.sqrt(pts.reduce((a, p) => a + p.x * p.x, 0) / n) : 0;
  return { m, b, r2, se, seb };
}

// Quadratic polynomial fit: y = c2*x^2 + c1*x + c0
function polyfit(pts: Pt[]) {
  const n = pts.length;
  if (n < 3) return null;
  const s0 = n;
  let s1 = 0,
    s2 = 0,
    s3 = 0,
    s4 = 0;
  let t0 = 0,
    t1 = 0,
    t2 = 0;
  for (const p of pts) {
    const x = p.x;
    const x2 = x * x;
    s1 += x;
    s2 += x2;
    s3 += x2 * x;
    s4 += x2 * x2;
    t0 += p.y;
    t1 += x * p.y;
    t2 += x2 * p.y;
  }
  // 3x3 Gaussian elimination
  const det = s4 * (s2 * s0 - s1 * s1) - s3 * (s3 * s0 - s1 * s2) + s2 * (s3 * s1 - s2 * s2);
  if (Math.abs(det) < 1e-12) return null;

  const c2 = (t2 * (s2 * s0 - s1 * s1) - s3 * (t1 * s0 - t0 * s1) + s2 * (t1 * s1 - t0 * s2)) / det;
  const c1 = (s4 * (t1 * s0 - t0 * s1) - t2 * (s3 * s0 - s1 * s2) + s2 * (s3 * t0 - t1 * s2)) / det;
  const c0 = (s4 * (s2 * t0 - s1 * t1) - s3 * (s3 * t0 - s2 * t1) + t2 * (s3 * s1 - s2 * s2)) / det;

  const my = t0 / n;
  let syy = 0;
  let res = 0;
  for (const p of pts) {
    const yPred = c2 * p.x * p.x + c1 * p.x + c0;
    res += (p.y - yPred) ** 2;
    syy += (p.y - my) ** 2;
  }
  const r2 = syy === 0 ? 1 : Math.max(0, 1 - res / syy);
  return { c2, c1, c0, r2 };
}

function DataLab() {
  const saved = useLabStore((s) => s.saved);
  const [raw, setRaw] = useState(SAMPLES.arrhenius);
  const [tx, setTx] = useState<Transform>("none");
  const [ty, setTy] = useState<Transform>("none");
  const [regType, setRegType] = useState<RegressionType>("linear");

  const pts = useMemo<Pt[]>(
    () =>
      raw
        .split("\n")
        .filter((l) => l.trim() && !l.trim().startsWith("#"))
        .map((l) => l.split(/[,\t ]+/).map(Number))
        .filter((a) => a.length >= 2 && Number.isFinite(a[0]) && Number.isFinite(a[1]))
        .map(([x, y]) => ({ x, y })),
    [raw],
  );

  const tpts = useMemo(
    () =>
      pts
        .map((p) => ({ x: tf(tx, p.x), y: tf(ty, p.y) }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    [pts, tx, ty],
  );

  // Statistics
  const stats = useMemo(() => {
    if (!tpts.length) return null;
    const n = tpts.length;
    const mx = tpts.reduce((acc, p) => acc + p.x, 0) / n;
    const my = tpts.reduce((acc, p) => acc + p.y, 0) / n;
    const varX = tpts.reduce((acc, p) => acc + (p.x - mx) ** 2, 0) / Math.max(1, n - 1);
    const varY = tpts.reduce((acc, p) => acc + (p.y - my) ** 2, 0) / Math.max(1, n - 1);
    const sx = Math.sqrt(varX);
    const sy = Math.sqrt(varY);
    return { n, mx, my, sx, sy };
  }, [tpts]);

  // Curve fitting calculation
  const { fitLine, equation, r2, outliers } = useMemo(() => {
    if (tpts.length < 2)
      return { fitLine: [], equation: "Insufficient points", r2: 0, outliers: [] };

    const xs = tpts.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const linePts: Pt[] = [];

    if (regType === "linear") {
      const fit = linfit(tpts);
      if (!fit) return { fitLine: [], equation: "Fit failed", r2: 0, outliers: [] };
      for (let i = 0; i <= 30; i++) {
        const x = minX + ((maxX - minX) * i) / 30;
        linePts.push({ x: +x.toFixed(3), y: +(fit.m * x + fit.b).toFixed(3) });
      }
      const outs = tpts.filter((p) => Math.abs(p.y - (fit.m * p.x + fit.b)) > 2.5 * fit.se);
      const sign = fit.b >= 0 ? "+" : "−";
      return {
        fitLine: linePts,
        equation: `y = ${fit.m.toFixed(4)}x ${sign} ${Math.abs(fit.b).toFixed(4)}`,
        r2: fit.r2,
        outliers: outs,
      };
    } else if (regType === "polynomial") {
      const pfit = polyfit(tpts);
      if (!pfit) return { fitLine: [], equation: "Requires ≥ 3 points", r2: 0, outliers: [] };
      for (let i = 0; i <= 30; i++) {
        const x = minX + ((maxX - minX) * i) / 30;
        linePts.push({
          x: +x.toFixed(3),
          y: +(pfit.c2 * x * x + pfit.c1 * x + pfit.c0).toFixed(3),
        });
      }
      return {
        fitLine: linePts,
        equation: `y = ${pfit.c2.toFixed(3)}x² + ${pfit.c1.toFixed(3)}x + ${pfit.c0.toFixed(3)}`,
        r2: pfit.r2,
        outliers: [],
      };
    } else if (regType === "exponential") {
      // Fit ln(y) = ln(a) + b*x
      const validExp = tpts.filter((p) => p.y > 0);
      if (validExp.length < 2)
        return { fitLine: [], equation: "Requires y > 0", r2: 0, outliers: [] };
      const expPts = validExp.map((p) => ({ x: p.x, y: Math.log(p.y) }));
      const fit = linfit(expPts);
      if (!fit) return { fitLine: [], equation: "Fit failed", r2: 0, outliers: [] };
      const aParam = Math.exp(fit.b);
      const bParam = fit.m;
      for (let i = 0; i <= 30; i++) {
        const x = minX + ((maxX - minX) * i) / 30;
        linePts.push({ x: +x.toFixed(3), y: +(aParam * Math.exp(bParam * x)).toFixed(3) });
      }
      return {
        fitLine: linePts,
        equation: `y = ${fmt(aParam)} · e^{${bParam.toFixed(3)}x}`,
        r2: fit.r2,
        outliers: [],
      };
    } else {
      // Power law: Fit ln(y) = ln(a) + b*ln(x)
      const validPower = tpts.filter((p) => p.x > 0 && p.y > 0);
      if (validPower.length < 2)
        return { fitLine: [], equation: "Requires x > 0 and y > 0", r2: 0, outliers: [] };
      const powPts = validPower.map((p) => ({ x: Math.log(p.x), y: Math.log(p.y) }));
      const fit = linfit(powPts);
      if (!fit) return { fitLine: [], equation: "Fit failed", r2: 0, outliers: [] };
      const aParam = Math.exp(fit.b);
      const bParam = fit.m;
      for (let i = 0; i <= 30; i++) {
        const x = minX + ((maxX - minX) * i) / 30;
        linePts.push({
          x: +x.toFixed(3),
          y: +(aParam * Math.pow(Math.max(1e-6, x), bParam)).toFixed(3),
        });
      }
      return {
        fitLine: linePts,
        equation: `y = ${fmt(aParam)} · x^{${bParam.toFixed(3)}}`,
        r2: fit.r2,
        outliers: [],
      };
    }
  }, [tpts, regType]);

  const loadSeries = (pts2: Pt[]) => {
    setRaw(pts2.map((p) => `${p.x}, ${p.y}`).join("\n"));
    setTx("none");
    setTy("none");
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="label-mono text-primary">Analysis bench</div>
      <h1 className="mt-1 font-display text-3xl font-semibold">Data Analysis & Regression</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Load or paste scientific measurements, apply coordinate transforms, and fit linear,
        polynomial, exponential, or power-law models with uncertainties.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="panel p-4">
            <h2 className="label-mono mb-2">Data (x, y per line)</h2>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              aria-label="Data input"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="lab"
                onClick={() => {
                  setRaw(SAMPLES.arrhenius);
                  setTx("inv");
                  setTy("ln");
                }}
              >
                Arrhenius
              </Button>
              <Button
                size="sm"
                variant="lab"
                onClick={() => {
                  setRaw(SAMPLES.kepler);
                  setTx("none");
                  setTy("none");
                  setRegType("power");
                }}
              >
                Kepler (a, T)
              </Button>
              <Button
                size="sm"
                variant="lab"
                onClick={() => {
                  setRaw(SAMPLES.stellar);
                  setTx("none");
                  setTy("none");
                  setRegType("power");
                }}
              >
                Stellar (M, L)
              </Button>
            </div>
            <div className="mt-3 border-t pt-2">
              <Button
                size="sm"
                variant="glow"
                className="w-full text-xs"
                onClick={() =>
                  exportCSV(
                    tpts.map((p) => ({ x: p.x, y: p.y })),
                    "astra-analysis.csv",
                  )
                }
              >
                Export Processed CSV
              </Button>
            </div>
          </section>

          <section className="panel space-y-3 p-4">
            <div>
              <Label className="label-mono mb-1.5 block">Regression Model</Label>
              <Select value={regType} onValueChange={(v) => setRegType(v as RegressionType)}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear (y = mx + b)</SelectItem>
                  <SelectItem value="polynomial">
                    Polynomial Quadratic (y = ax² + bx + c)
                  </SelectItem>
                  <SelectItem value="exponential">Exponential (y = a·e^{"{bx}"})</SelectItem>
                  <SelectItem value="power">Power Law (y = a·x^b)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TSel label="x-axis transform" v={tx} set={setTx} />
            <TSel label="y-axis transform" v={ty} set={setTy} />
          </section>

          <section className="panel p-4">
            <h2 className="label-mono mb-2">Saved series from Labs</h2>
            {saved.filter((s) => s.series && Object.keys(s.series).length).length === 0 && (
              <p className="text-xs text-muted-foreground">
                Save an experiment in any lab to import its live graph data here.
              </p>
            )}
            <ul className="space-y-1">
              {saved.flatMap((s) =>
                Object.entries(s.series ?? {}).map(([name, pts2]) => (
                  <li key={`${s.id}-${name}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-between font-mono text-xs"
                      onClick={() => loadSeries(pts2)}
                    >
                      <span className="truncate">
                        {s.name} · {name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{pts2.length} pts</span>
                    </Button>
                  </li>
                )),
              )}
            </ul>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 mb-4">
              <div>
                <div className="label-mono text-primary">Model Equation</div>
                <div className="font-mono text-lg font-semibold text-foreground mt-0.5">
                  {equation}
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <div className="label-mono">Coefficient of Determination</div>
                  <div className="font-mono text-lg font-semibold text-cyan">
                    R² = {r2.toFixed(4)}
                  </div>
                </div>
                {stats && (
                  <div>
                    <div className="label-mono">Data Sample Size</div>
                    <div className="font-mono text-lg font-semibold text-amber">N = {stats.n}</div>
                  </div>
                )}
              </div>
            </div>

            <SciChart
              xLabel={`x${tx !== "none" ? ` (${tx})` : ""}`}
              yLabel={`y${ty !== "none" ? ` (${ty})` : ""}`}
              height={360}
              series={[
                {
                  key: "data",
                  name: "Measurements",
                  data: tpts,
                  dots: true,
                  color: "#38bdf8",
                },
                {
                  key: "fit",
                  name: `Fit: ${regType}`,
                  data: fitLine,
                  color: "#f59e0b",
                },
              ]}
            />
          </section>

          {stats && (
            <section className="panel p-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4 font-mono text-xs">
              <div className="border rounded p-2.5 bg-background/30">
                <div className="text-[10px] uppercase text-muted-foreground">Mean X (x̄)</div>
                <div className="text-base text-foreground font-semibold mt-1">
                  {stats.mx.toFixed(3)}
                </div>
              </div>
              <div className="border rounded p-2.5 bg-background/30">
                <div className="text-[10px] uppercase text-muted-foreground">Std Dev X (σx)</div>
                <div className="text-base text-foreground font-semibold mt-1">
                  {stats.sx.toFixed(3)}
                </div>
              </div>
              <div className="border rounded p-2.5 bg-background/30">
                <div className="text-[10px] uppercase text-muted-foreground">Mean Y (ȳ)</div>
                <div className="text-base text-foreground font-semibold mt-1">
                  {stats.my.toFixed(3)}
                </div>
              </div>
              <div className="border rounded p-2.5 bg-background/30">
                <div className="text-[10px] uppercase text-muted-foreground">Std Dev Y (σy)</div>
                <div className="text-base text-foreground font-semibold mt-1">
                  {stats.sy.toFixed(3)}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function TSel({ label, v, set }: { label: string; v: Transform; set: (t: Transform) => void }) {
  return (
    <div>
      <Label className="label-mono mb-1.5 block">{label}</Label>
      <div className="grid grid-cols-4 gap-1">
        {(["none", "log", "ln", "inv"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set(t)}
            className={cn(
              "rounded border px-2 py-1 font-mono text-xs transition-colors",
              v === t
                ? "border-primary bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
