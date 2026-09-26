import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { labStore, useLabStore, type SimContext } from "@/lib/store/lab-store";
import { getSimulation, type Difficulty } from "@/lib/simulations/registry";
import { EquationPanel, type EquationDef } from "./Equation";
import { Assumptions } from "./Panels";
import { AstraPanel } from "@/components/astra/AstraPanel";
import { cn } from "@/lib/utils";

const DIFFS: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Research"];

/**
 * Standard 3-column simulation layout:
 *  [controls] [visualization + graphs] [readouts / physics / equations / ASTRA]
 * Simulations publish their context via `context` so ASTRA and Save work automatically.
 */
export function LabLayout({
  simulationId,
  controls,
  children,
  side,
  equations,
  assumptions,
  context,
  physicsNotes,
  difficulty,
  onDifficultyChange,
  toolbar,
}: {
  simulationId: string;
  controls: ReactNode;
  children: ReactNode;
  side?: ReactNode;
  equations: EquationDef[];
  assumptions: string[];
  context: Omit<SimContext, "updatedAt">;
  physicsNotes?: string[];
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  toolbar?: ReactNode;
}) {
  const meta = getSimulation(simulationId);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [astraOpen, setAstraOpen] = useState(false);

  // Publish context for ASTRA (throttled)
  useEffect(() => {
    const t = setTimeout(() => labStore.setContext(context), 150);
    return () => clearTimeout(t);
  }, [context]);
  useEffect(() => () => labStore.setContext(null), []);

  const research = difficulty === "Research";

  const save = () => {
    labStore.saveExperiment({
      name: name || `${meta?.name} — ${new Date().toLocaleString()}`,
      simulationId,
      simulationName: meta?.name ?? simulationId,
      parameters: context.parameters,
      results: context.measurements,
      series: context.series,
      notes,
    });
    toast.success("Experiment saved");
    setSaveOpen(false);
    setName("");
    setNotes("");
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background/80 px-4 py-2.5 backdrop-blur-md md:px-6">
        <Link
          to="/laboratory"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back to laboratory"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <div className="label-mono">
            {meta?.field} · {meta?.subfield}
          </div>
          <h1 className="truncate text-base font-semibold leading-tight">{meta?.name}</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Difficulty"
            className="flex rounded-md border bg-card/60 p-0.5"
          >
            {DIFFS.map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={difficulty === d}
                onClick={() => onDifficultyChange(d)}
                className={cn(
                  "rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                  difficulty === d
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {toolbar}
          <Button size="sm" variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="size-3.5" /> Save
          </Button>
          <Button size="sm" variant="glow" className="xl:hidden" onClick={() => setAstraOpen(true)}>
            <Sparkles className="size-3.5" /> ASTRA
          </Button>
        </div>
      </header>

      {research && meta?.researchQuestion && (
        <div className="border-b border-violet/30 bg-violet/10 px-4 py-2 text-xs md:px-6">
          <span className="label-mono text-violet">Research question</span>
          <p className="mt-0.5 text-foreground">{meta.researchQuestion}</p>
        </div>
      )}

      <div className="grid flex-1 gap-4 p-4 md:p-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
        <aside className="space-y-4 lg:sticky lg:top-16 lg:self-start" aria-label="Controls">
          {controls}
          {!research && <Assumptions items={assumptions} />}
        </aside>
        <main className="min-w-0 space-y-4">{children}</main>
        <aside
          className="space-y-4 xl:sticky xl:top-16 xl:self-start xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
          aria-label="Analysis"
        >
          {side}
          {physicsNotes && !research && (
            <section className="panel p-4">
              <h3 className="label-mono mb-2">Physics · now</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {physicsNotes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <EquationPanel equations={equations} />
          {research && <Assumptions items={assumptions} />}
          <div className="hidden xl:block">
            <AstraPanel compact />
          </div>
        </aside>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save experiment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Experiment name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Notes, hypothesis, observations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="rounded-md border bg-background/40 p-3 font-mono text-[11px] text-muted-foreground">
              {Object.entries(context.parameters)
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k}>
                    {k}: {String(v)}
                  </div>
                ))}
            </div>
            <Button onClick={save} className="w-full">
              Save to local storage
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={astraOpen} onOpenChange={setAstraOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>ASTRA</DialogTitle>
          </DialogHeader>
          <AstraPanel compact />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function useDifficulty(initial: Difficulty = "Intermediate") {
  return useState<Difficulty>(initial);
}

export function useContextSelector() {
  return useLabStore((s) => s.context);
}
