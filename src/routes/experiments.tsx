import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, ArrowRight } from "lucide-react";
import { CHALLENGES } from "@/lib/challenges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Research Challenges | ASTRA LAB" },
      { name: "description", content: "Guided research challenges: find exoplanets, identify stars, weigh black holes and measure activation energies." },
      { property: "og:title", content: "Research Challenges | ASTRA LAB" },
      { property: "og:description", content: "Solve real scientific problems with simulated data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Experiments,
});

function Experiments() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="label-mono text-primary">Mission board</div>
      <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">Research Challenges</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Each challenge is an open-ended problem. You get the instrument, not the answer. Switch the simulation to <span className="font-mono text-violet">Research</span> difficulty to hide the guidance.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
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
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">Report: {c.answerLabel}</div>
            <Button asChild variant="glow" size="sm" className="mt-4 self-start">
              <Link to={c.path}>
                Begin <ArrowRight className="size-3" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
