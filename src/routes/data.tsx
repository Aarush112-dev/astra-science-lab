import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLabStore, exportCSV } from "@/lib/store/lab-store";
import { SciChart } from "@/components/lab/SciChart";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/physics/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data Analysis Lab | ASTRA LAB" },
      { name: "description", content: "Plot experiment data, transform axes and fit linear, power-law and exponential models with uncertainties." },
      { property: "og:title", content: "Data Analysis Lab | ASTRA LAB" },
      { property: "og:description", content: "Fit models to your experimental data and read off the physics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataLab,
});

type Pt = { x: number; y: number };
type Transform = "none" | "log" | "ln" | "inv";
const tf = (t: Transform, v: number) => (t === "log" ? Math.log10(v) : t === "ln" ? Math.log(v) : t === "inv" ? 1 / v : v);

const SAMPLE = `# Arrhenius data: T (K), k (s^-1)
300, 0.0021
320, 0.0098
340, 0.039
360, 0.135`;

function linfit(pts: Pt[]) {
  const n = pts.length;
  if (n < 2) return null;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of pts) { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) ** 2; }
  const m = sxy / sxx;
  const b = my - m * mx;
  const res = pts.reduce((a, p) => a + (p.y - (m * p.x + b)) ** 2, 0);
  const r2 = syy === 0 ? 1 : 1 - res / syy;
  const se = n > 2 ? Math.sqrt(res / (n - 2) / sxx) : 0;
  const seb = n > 2 ? se * Math.sqrt(pts.reduce((a, p) => a + p.x * p.x, 0) / n) : 0;
  return { m, b, r2, se, seb };
}

function DataLab() {
  const saved = useLabStore((s) => s.saved);
  const [raw, setRaw] = useState(SAMPLE);
  const [tx, setTx] = useState<Transform>("inv");
  const [ty, setTy] = useState<Transform>("ln");

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
  const tpts = useMemo(() => pts.map((p) => ({ x: tf(tx, p.x), y: tf(ty, p.y) })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)), [pts, tx, ty]);
  const fit = linfit(tpts);
  const fitLine = fit && tpts.length ? (() => {
    const xs = tpts.map((p) => p.x);
    const a = Math.min(...xs), b = Math.max(...xs);
    return Array.from({ length: 30 }, (_, i) => { const x = a + ((b - a) * i) / 29; return { x, y: fit.m * x + fit.b }; });
  })() : [];

  const loadSeries = (pts2: Pt[]) => { setRaw(pts2.map((p) => `${p.x}, ${p.y}`).join("\n")); setTx("none"); setTy("none"); };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="label-mono text-primary">Analysis bench</div>
      <h1 className="mt-1 font-display text-3xl font-semibold">Data Analysis</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Paste measurements or load a saved series, linearise with axis transforms, and fit a straight line. Gradient and intercept come with standard errors.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="panel p-4">
            <h2 className="label-mono mb-2">Data (x, y per line)</h2>
            <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={10} className="font-mono text-xs" aria-label="Data input" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="lab" onClick={() => setRaw(SAMPLE)}>Sample</Button>
              <Button size="sm" variant="lab" onClick={() => exportCSV(tpts.map((p) => ({ x: p.x, y: p.y })), "astra-data.csv")}>Export CSV</Button>
            </div>
          </section>
          <section className="panel space-y-3 p-4">
            <TSel label="x-axis transform" v={tx} set={setTx} />
            <TSel label="y-axis transform" v={ty} set={setTy} />
            <p className="text-[11px] text-muted-foreground">Tip: ln k vs 1/T is linear with gradient −Ea/R. log T vs log a gives Kepler's exponent 1.5.</p>
          </section>
          <section className="panel p-4">
            <h2 className="label-mono mb-2">Saved series</h2>
            {saved.filter((s) => s.series && Object.keys(s.series).length).length === 0 && <p className="text-xs text-muted-foreground">Save an experiment in any lab to load its graph data here.</p>}
            <ul className="space-y-1">
              {saved.flatMap((s) => Object.entries(s.series ?? {}).map(([k, v]) => (
                <li key={s.id + k}>
                  <button className="w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-accent" onClick={() => loadSeries(v)}>
                    {s.name} · <span className="text-muted-foreground">{k}</span>
                  </button>
                </li>
              )))}
            </ul>
          </section>
        </aside>
        <main className="space-y-4">
          <section className="panel p-4">
            <SciChart
              scatter
              height={380}
              xLabel={tx === "none" ? "x" : `${tx}(x)`}
              yLabel={ty === "none" ? "y" : `${ty}(y)`}
              series={[{ key: "d", name: "data", data: tpts, dots: true }, { key: "f", name: "linear fit", data: fitLine, dashed: true }]}
            />
          </section>
          {fit && (
            <section className="panel grid grid-cols-2 gap-3 p-4 font-mono text-sm md:grid-cols-4">
              <Stat l="Gradient" v={`${fmt(fit.m, 4)} ± ${fmt(fit.se, 2)}`} />
              <Stat l="Intercept" v={`${fmt(fit.b, 4)} ± ${fmt(fit.seb, 2)}`} />
              <Stat l="R²" v={fmt(fit.r2, 5)} />
              <Stat l="N points" v={String(tpts.length)} />
              {tx === "inv" && ty === "ln" && <Stat l="Ea = −m·R" v={`${fmt((-fit.m * 8.314) / 1000, 4)} kJ/mol`} />}
              {tx !== "none" && tx === ty && tx !== "inv" && <Stat l="Power-law exponent" v={fmt(fit.m, 4)} />}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return <div className="rounded-md border bg-background/40 px-3 py-2"><div className="label-mono">{l}</div><div className="mt-0.5 text-foreground">{v}</div></div>;
}

function TSel({ label, v, set }: { label: string; v: Transform; set: (t: Transform) => void }) {
  return (
    <div>
      <div className="label-mono mb-1">{label}</div>
      <div className="flex rounded-md border bg-card/60 p-0.5">
        {(["none", "log", "ln", "inv"] as Transform[]).map((t) => (
          <button key={t} onClick={() => set(t)} className={cn("flex-1 rounded-sm px-2 py-1 font-mono text-[10px] uppercase", v === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "inv" ? "1/x" : t}
          </button>
        ))}
      </div>
    </div>
  );
}
