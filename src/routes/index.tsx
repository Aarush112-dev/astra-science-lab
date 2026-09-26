import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Trophy, FlaskConical, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/home/HeroVisual";
import { SIMULATIONS } from "@/lib/simulations/registry";
import { useLabStore } from "@/lib/store/lab-store";
import { CHALLENGES } from "@/lib/challenges";
import { SimCard } from "@/components/lab/SimCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTRA LAB — AI Science Laboratory" },
      {
        name: "description",
        content:
          "Simulate stars, black holes, planetary systems, spectra and chemical reactions. Change the parameters. Run the experiment. Analyse the data.",
      },
      { property: "og:title", content: "ASTRA LAB — AI Science Laboratory" },
      {
        property: "og:description",
        content: "Run the experiment. Change the physics. Observe the universe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FACTS = [
  "Stars spend most of their lives on the main sequence.",
  "Gravitational waves stretch and compress spacetime.",
  "Spectral lines can reveal the composition and velocity of distant objects.",
  "Chemical equilibrium is dynamic, not static.",
  "The Schwarzschild radius of the Sun would be just under 3 km.",
  "A transit of an Earth-sized planet dims a Sun-like star by only 0.008%.",
  "Raising temperature by 10 K roughly doubles the rate of many reactions.",
];

function Index() {
  const saved = useLabStore((s) => s.saved);
  const ctx = useLabStore((s) => s.context);
  const [fact, setFact] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFact((f) => (f + 1) % FACTS.length), 7000);
    return () => clearInterval(id);
  }, []);
  const discover = SIMULATIONS.filter((s) => s.path)[fact % 6];

  return (
    <div className="starfield">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-20 lg:grid-cols-2 lg:pt-24">
          <div className="animate-fade-up">
            <p className="label-mono mb-4 text-primary">
              Virtual science laboratory · Astrophysics · Chemistry
            </p>
            <h1 className="text-glow font-display text-6xl font-bold tracking-[0.18em] sm:text-7xl">
              ASTRA LAB
            </h1>
            <p className="mt-5 max-w-lg text-lg text-foreground/90">
              An interactive laboratory for exploring the physics and chemistry of the universe.
            </p>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              Simulate stars, black holes, planetary systems, spectra, chemical reactions and more.
              Change the parameters. Run the experiment. Analyse the data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/laboratory">
                  Enter Lab <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/astrophysics">Explore Simulations</Link>
              </Button>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
              Run the experiment · Change the physics · Observe the universe
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-wide">
              WELCOME TO ASTRA LAB
            </h2>
            <p className="text-sm text-muted-foreground">
              Your research console. Everything runs locally in the browser.
            </p>
          </div>
          <div className="panel max-w-md px-4 py-3 text-sm" aria-live="polite">
            <span className="label-mono text-amber">Science fact</span>
            <p key={fact} className="mt-1 animate-fade-up text-foreground/90">
              {FACTS[fact]}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Active experiment" icon={FlaskConical}>
            {ctx ? (
              <>
                <p className="text-sm">{ctx.simulationName}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {Object.entries(ctx.parameters)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}=${typeof v === "number" ? Number(v.toPrecision(3)) : v}`)
                    .join(" · ")}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No experiment running. Enter the lab to begin.
              </p>
            )}
          </Card>
          <Card title="Recent experiments" icon={Bookmark}>
            {saved.length ? (
              <ul className="space-y-1 text-sm">
                {saved.slice(0, 3).map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Saved experiments appear here.</p>
            )}
            <Link to="/saved" className="mt-2 inline-block text-xs text-primary hover:underline">
              All saved →
            </Link>
          </Card>
          <Card title="Scientific challenges" icon={Trophy}>
            <ul className="space-y-1 text-sm">
              {CHALLENGES.slice(0, 3).map((c) => (
                <li key={c.id} className="truncate">
                  <span className="font-mono text-[10px] text-violet">{c.code}</span> {c.title}
                </li>
              ))}
            </ul>
            <Link
              to="/experiments"
              hash="challenges"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Open challenges →
            </Link>
          </Card>
          <Card title="ASTRA AI" icon={Sparkles}>
            <p className="text-sm text-muted-foreground">
              A context-aware research assistant that reads your live simulation state.
            </p>
            <Link to="/astra" className="mt-2 inline-block text-xs text-primary hover:underline">
              Ask ASTRA →
            </Link>
          </Card>
        </div>

        <div>
          <h3 className="label-mono mb-3">Discover a simulation</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              discover,
              ...SIMULATIONS.filter((s) => s.path && s.id !== discover.id).slice(0, 2),
            ].map((s) => (
              <SimCard key={s.id} sim={s} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof FlaskConical;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-3.5 text-primary" />
        <span className="label-mono">{title}</span>
      </div>
      {children}
    </div>
  );
}
