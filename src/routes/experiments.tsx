import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Trophy, ArrowRight, FlaskConical, Play, Download, CheckCircle2 } from "lucide-react";
import { CHALLENGES } from "@/lib/challenges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SciChart } from "@/components/lab/SciChart";
import { exportCSV } from "@/lib/store/lab-store";
import { fmt } from "@/lib/physics/constants";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Experiment Builder & Challenges | ASTRA LAB" },
      {
        name: "description",
        content:
          "Design hypothesis-driven scientific experiments with automated graphing and solve guided research challenges.",
      },
      { property: "og:title", content: "Experiment Builder & Challenges | ASTRA LAB" },
      {
        property: "og:description",
        content: "Hypothesis, variables, measurements, automated graphing and challenges.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExperimentsPage,
});

interface DataPoint {
  x: number;
  y: number;
}

const PRESET_VARIABLES = [
  { id: "temp", name: "Temperature T (K)", range: [280, 450], unit: "K", dep: "k_rate" },
  { id: "mass", name: "Stellar Mass M (M☉)", range: [0.5, 20], unit: "M☉", dep: "luminosity" },
  { id: "dist", name: "Orbital Radius a (AU)", range: [0.4, 10], unit: "AU", dep: "period" },
  {
    id: "radius",
    name: "Exoplanet Radius R (R_Jup)",
    range: [0.2, 2.5],
    unit: "R_Jup",
    dep: "transit_depth",
  },
  { id: "pressure", name: "Volume V (L)", range: [10, 50], unit: "L", dep: "gas_pressure" },
];

function ExperimentsPage() {
  const [tab, setTab] = useState("builder");

  // Experiment Builder State
  const [expName, setExpName] = useState("Kinetics & Thermal Activation");
  const [hypothesis, setHypothesis] = useState(
    "Reaction rate constant k increases exponentially with temperature according to the Arrhenius relation.",
  );
  const [method, setMethod] = useState(
    "Vary temperature in steps of 15 K while maintaining constant reactant concentrations [A]=[B]=1.0 M.",
  );
  const [indepVar, setIndepVar] = useState("temp");
  const [depVar, setDepVar] = useState("k_rate");
  const [rangeStart, setRangeStart] = useState(280);
  const [rangeEnd, setRangeEnd] = useState(420);
  const [steps, setSteps] = useState(10);
  const [noiseAdded, setNoiseAdded] = useState(true);

  // Generated experimental results
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<DataPoint[]>([]);
  const [conclusion, setConclusion] = useState("");

  const handleRunExperiment = () => {
    const pts: DataPoint[] = [];
    const stepSize = (rangeEnd - rangeStart) / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const xVal = +(rangeStart + i * stepSize).toFixed(2);
      let yVal = 0;

      if (indepVar === "temp") {
        // Arrhenius: k = A * exp(-Ea / RT)
        const Ea = 52000;
        const R = 8.314;
        const k = 1.2e8 * Math.exp(-Ea / (R * xVal));
        yVal = k;
      } else if (indepVar === "mass") {
        // Mass-luminosity relation: L ~ M^3.5
        yVal = Math.pow(xVal, 3.5);
      } else if (indepVar === "dist") {
        // Kepler III: T = a^(1.5)
        yVal = Math.pow(xVal, 1.5);
      } else if (indepVar === "radius") {
        // Transit depth ~ (R_p / R_*)^2
        yVal = Math.pow(xVal / 10, 2) * 10000; // in ppm
      } else {
        // Boyle's law: P = nRT / V
        yVal = (1.0 * 0.08206 * 300) / xVal;
      }

      if (noiseAdded) {
        const rand = (Math.random() - 0.5) * 0.06;
        yVal *= 1 + rand;
      }

      pts.push({ x: xVal, y: +yVal.toFixed(4) });
    }

    setResults(pts);
    setHasRun(true);

    if (indepVar === "temp") {
      setConclusion(
        `Results support the hypothesis: reaction rate constant accelerated from ${fmt(pts[0]?.y ?? 0)} to ${fmt(pts[pts.length - 1]?.y ?? 0)} across the ${rangeStart} K - ${rangeEnd} K range, exhibiting classic exponential temperature dependence.`,
      );
    } else if (indepVar === "mass") {
      setConclusion(
        `Measured data confirms a steep power-law scaling of luminosity with mass (L ∝ M^3.5), demonstrating that stellar core fusion intensity scales rapidly with gravitational confining pressure.`,
      );
    } else if (indepVar === "dist") {
      setConclusion(
        `Empirical data verified Kepler's Third Law (T ∝ a^1.5). Orbital period scaled harmonically with semi-major axis.`,
      );
    } else {
      setConclusion(
        `Experimental measurements collected across ${steps} data points. Correlation demonstrates clear physical relationship.`,
      );
    }
  };

  const handleExportCSV = () => {
    const csvRecords = results.map((r, idx) => ({
      Trial: idx + 1,
      [indepVar]: r.x,
      [depVar]: r.y,
    }));
    exportCSV(csvRecords, `${expName.toLowerCase().replace(/\s+/g, "_")}.csv`);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="label-mono text-primary">Scientific Methodology</div>
      <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">
        Experiments & Challenges
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Design rigorous controlled experiments, establish hypotheses, collect measurements, generate
        data plots, and solve open-ended research challenges.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="bg-card border">
          <TabsTrigger value="builder" className="font-mono text-xs">
            <FlaskConical className="mr-1.5 size-3.5 text-cyan" /> Experiment Builder
          </TabsTrigger>
          <TabsTrigger value="challenges" className="font-mono text-xs">
            <Trophy className="mr-1.5 size-3.5 text-amber" /> Scientific Challenges
          </TabsTrigger>
        </TabsList>

        {/* EXPERIMENT BUILDER TAB */}
        <TabsContent value="builder" className="mt-6 space-y-6">
          <div className="panel p-6 space-y-6">
            <div className="border-b pb-4">
              <h2 className="font-display text-xl font-semibold">
                1. Experiment Specification & Hypothesis
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Define the research question, scientific rationale, and formal hypothesis.
              </p>
              <div className="grid gap-4 mt-4 md:grid-cols-2">
                <div>
                  <Label className="label-mono mb-1.5 block">Experiment Name</Label>
                  <Input value={expName} onChange={(e) => setExpName(e.target.value)} />
                </div>
                <div>
                  <Label className="label-mono mb-1.5 block">Scientific Hypothesis</Label>
                  <Input value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <Label className="label-mono mb-1.5 block">Experimental Method / Protocol</Label>
                <Textarea value={method} onChange={(e) => setMethod(e.target.value)} rows={2} />
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="font-display text-xl font-semibold">
                2. Variables & Initial Conditions
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select independent and dependent variables to test the physical relationship.
              </p>
              <div className="grid gap-4 mt-4 md:grid-cols-3">
                <div>
                  <Label className="label-mono mb-1.5 block">Independent Variable (X)</Label>
                  <Select
                    value={indepVar}
                    onValueChange={(val) => {
                      setIndepVar(val);
                      const p = PRESET_VARIABLES.find((v) => v.id === val);
                      if (p) {
                        setRangeStart(p.range[0]);
                        setRangeEnd(p.range[1]);
                        setDepVar(p.dep);
                      }
                    }}
                  >
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_VARIABLES.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="label-mono mb-1.5 block">Dependent Measurement (Y)</Label>
                  <Input
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <Label className="label-mono mb-1.5 block">Data Points (Steps)</Label>
                  <Input
                    type="number"
                    value={steps}
                    min={4}
                    max={50}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 mt-4 md:grid-cols-2">
                <div>
                  <Label className="label-mono mb-1.5 block">Range Start</Label>
                  <Input
                    type="number"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value))}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="label-mono mb-1.5 block">Range End</Label>
                  <Input
                    type="number"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <Button
                size="lg"
                variant="glow"
                onClick={handleRunExperiment}
                className="w-full md:w-auto"
              >
                <Play className="size-4 mr-2" /> Run Experiment & Collect Data
              </Button>
            </div>
          </div>

          {/* RESULTS & GRAPH SECTION */}
          {hasRun && (
            <div className="panel p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald">
                    <CheckCircle2 className="size-4" />
                    <span className="label-mono">Experiment Complete</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold mt-1">
                    3. Measurements & Automatically Generated Graph
                  </h3>
                </div>
                <Button size="sm" variant="lab" onClick={handleExportCSV}>
                  <Download className="size-3.5 mr-1.5" /> Export Data (CSV)
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="panel p-4 bg-background/50">
                  <SciChart
                    xLabel={indepVar}
                    yLabel={depVar}
                    height={300}
                    series={[
                      {
                        key: "exp_data",
                        name: `${depVar} vs ${indepVar}`,
                        data: results,
                        color: "#38bdf8",
                        dots: true,
                      },
                    ]}
                  />
                </div>

                <div className="panel p-4 space-y-3 bg-background/50 max-h-[340px] overflow-auto font-mono text-xs">
                  <div className="label-mono mb-2">Raw Collected Data</div>
                  <div className="grid grid-cols-2 text-muted-foreground border-b pb-1">
                    <span>{indepVar}</span>
                    <span>{depVar}</span>
                  </div>
                  {results.map((r, i) => (
                    <div key={i} className="grid grid-cols-2 border-b border-border/40 py-1">
                      <span>{r.x}</span>
                      <span className="text-cyan">{fmt(r.y)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border bg-background/40 p-4">
                <div className="label-mono text-primary mb-1">
                  4. Scientific Conclusion & Evaluation
                </div>
                <p className="text-sm leading-relaxed text-foreground">{conclusion}</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* CHALLENGES TAB */}
        <TabsContent value="challenges" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {CHALLENGES.map((c) => (
              <article key={c.id} className="panel flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber" />
                  <span className="label-mono">{c.code}</span>
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold">{c.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.brief}</p>
                <div className="mt-4 rounded-md border bg-background/40 p-3 text-xs">
                  <div className="label-mono mb-1">Objective</div>
                  {c.objective}
                </div>
                <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                  Report: {c.answerLabel}
                </div>
                <Button asChild variant="glow" size="sm" className="mt-4 self-start">
                  <Link to={c.path}>
                    Begin Challenge <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
