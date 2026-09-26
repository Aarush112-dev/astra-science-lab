import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { SimulationMeta } from "@/lib/simulations/registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SimPreview } from "./SimPreview";

const DIFF_TONE: Record<string, string> = {
  Beginner: "text-emerald border-emerald/40",
  Intermediate: "text-cyan border-cyan/40",
  Advanced: "text-amber border-amber/40",
  Research: "text-violet border-violet/40",
};

export function SimCard({ sim }: { sim: SimulationMeta }) {
  return (
    <article className="panel group flex flex-col overflow-hidden transition-shadow hover:shadow-glow">
      <div className="relative h-32 overflow-hidden border-b bg-background/60">
        <SimPreview id={sim.id} />
        <span
          className={cn(
            "absolute right-2 top-2 rounded-sm border bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider backdrop-blur",
            DIFF_TONE[sim.difficulty],
          )}
        >
          {sim.difficulty}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="label-mono">
          {sim.field} · {sim.subfield}
        </div>
        <h3 className="mt-1 font-display text-base font-semibold">{sim.name}</h3>
        <p className="mt-1 flex-1 text-xs text-muted-foreground">{sim.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {sim.variables.map((v) => (
            <span
              key={v}
              className="rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[10px] text-accent-foreground/80"
            >
              {v}
            </span>
          ))}
        </div>
        <div className="mt-4">
          {sim.path ? (
            <Button asChild variant="lab" size="sm" className="w-full">
              <Link to={sim.path}>
                <Play className="size-3" /> Run experiment
              </Link>
            </Button>
          ) : (
            <Button variant="lab" size="sm" className="w-full" disabled>
              Coming soon
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
