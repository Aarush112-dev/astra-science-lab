import { createFileRoute, Link } from "@tanstack/react-router";
import { AstraPanel } from "@/components/astra/AstraPanel";
import { useLabStore } from "@/lib/store/lab-store";

export const Route = createFileRoute("/astra")({
  head: () => ({
    meta: [
      { title: "ASTRA — AI Scientist | ASTRA LAB" },
      {
        name: "description",
        content:
          "Ask ASTRA, the lab's research assistant, about physics, chemistry, graphs and what to try next in your experiment.",
      },
      { property: "og:title", content: "ASTRA — AI Scientist | ASTRA LAB" },
      {
        property: "og:description",
        content: "A research assistant that reads your live experiment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AstraPage,
});

function AstraPage() {
  const saved = useLabStore((s) => s.saved);
  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:p-8 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="label-mono text-primary">Research assistant</div>
        <h1 className="mb-4 mt-1 font-display text-3xl font-semibold">ASTRA</h1>
        <AstraPanel />
      </div>
      <aside className="space-y-4 lg:pt-20">
        <section className="panel p-4 text-sm">
          <h2 className="label-mono mb-2">How ASTRA works</h2>
          <p className="text-muted-foreground">
            ASTRA reads the live parameters and measurements of whichever lab is open. For the
            richest answers, open a simulation and use the ASTRA button inside it.
          </p>
          <Link
            to="/laboratory"
            className="mt-3 inline-block font-mono text-xs text-primary hover:underline"
          >
            Open a lab →
          </Link>
        </section>
        <section className="panel p-4 text-sm">
          <h2 className="label-mono mb-2">Your saved runs</h2>
          {saved.length === 0 ? (
            <p className="text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {saved.slice(0, 6).map((s) => (
                <li key={s.id} className="truncate">
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
