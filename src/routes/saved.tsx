import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Download, Trash2, ExternalLink } from "lucide-react";
import { exportCSV, labStore, useLabStore } from "@/lib/store/lab-store";
import { getSimulation } from "@/lib/simulations/registry";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Experiments | ASTRA LAB" },
      {
        name: "description",
        content:
          "Your saved ASTRA LAB experiments: parameters, results, notes and data series, ready to export.",
      },
      { property: "og:title", content: "Saved Experiments | ASTRA LAB" },
      { property: "og:description", content: "Your lab notebook of saved experiment runs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Saved,
});

function Saved() {
  const saved = useLabStore((s) => s.saved);
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="label-mono text-primary">Lab notebook</div>
      <h1 className="mt-1 font-display text-3xl font-semibold">Saved Experiments</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Stored in this browser. Use Save inside any lab to add a run.
      </p>
      {saved.length === 0 && (
        <div className="panel mt-8 p-8 text-center text-sm text-muted-foreground">
          No saved experiments yet.{" "}
          <Link to="/laboratory" className="text-primary hover:underline">
            Run one →
          </Link>
        </div>
      )}
      <div className="mt-6 space-y-4">
        {saved.map((e) => {
          const path = getSimulation(e.simulationId)?.path;
          return (
            <article key={e.id} className="panel p-4">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="label-mono">
                    {e.simulationName} · {new Date(e.createdAt).toLocaleString()}
                  </div>
                  <input
                    className="mt-1 w-full bg-transparent font-display text-lg font-semibold outline-none focus:text-primary"
                    value={e.name}
                    aria-label="Experiment name"
                    onChange={(ev) => labStore.updateExperiment(e.id, { name: ev.target.value })}
                  />
                </div>
                {path && (
                  <Button asChild size="sm" variant="lab">
                    <Link to={path}>
                      <ExternalLink className="size-3" /> Open lab
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="lab"
                  onClick={() => labStore.duplicateExperiment(e.id)}
                  aria-label="Duplicate"
                >
                  <Copy className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="lab"
                  aria-label="Export CSV"
                  onClick={() => {
                    const series = Object.entries(e.series ?? {});
                    if (series.length) {
                      const rows = series.flatMap(([name, pts]) =>
                        pts.map((p) => ({ series: name, x: p.x, y: p.y })),
                      );
                      exportCSV(rows, `${e.name}.csv`);
                    } else
                      exportCSV(
                        [{ ...e.parameters, ...e.results } as Record<string, string | number>],
                        `${e.name}.csv`,
                      );
                  }}
                >
                  <Download className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="lab"
                  onClick={() => labStore.deleteExperiment(e.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="size-3 text-rose" />
                </Button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <KV title="Parameters" data={e.parameters} />
                <KV title="Results" data={e.results} />
              </div>
              <Textarea
                className="mt-3 text-xs"
                placeholder="Notes…"
                value={e.notes}
                onChange={(ev) => labStore.updateExperiment(e.id, { notes: ev.target.value })}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function KV({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div className="rounded-md border bg-background/40 p-3">
      <div className="label-mono mb-1">{title}</div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px]">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="truncate text-muted-foreground">{k}</dt>
            <dd className="truncate">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
