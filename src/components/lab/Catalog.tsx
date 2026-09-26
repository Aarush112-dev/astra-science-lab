import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SIMULATIONS, type Difficulty, type Field } from "@/lib/simulations/registry";
import { SimCard } from "./SimCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DIFFS: (Difficulty | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];

export function Catalog({
  field,
  title,
  kicker,
  intro,
}: {
  field?: Field;
  title: string;
  kicker: string;
  intro: string;
}) {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<Difficulty | "All">("All");
  const [f, setF] = useState<Field | "all">(field ?? "all");
  const list = useMemo(
    () =>
      SIMULATIONS.filter(
        (s) =>
          (f === "all" || s.field === f) &&
          (diff === "All" || s.difficulty === diff) &&
          (q === "" ||
            `${s.name} ${s.subfield} ${s.description} ${s.variables.join(" ")}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [q, diff, f],
  );
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="label-mono text-primary">{kicker}</div>
      <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search simulations, variables…"
            className="pl-8"
            aria-label="Search simulations"
          />
        </div>
        {!field && (
          <div className="flex rounded-md border bg-card/60 p-0.5">
            {(["all", "astrophysics", "chemistry"] as const).map((x) => (
              <button
                key={x}
                onClick={() => setF(x)}
                className={cn(
                  "rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
                  f === x
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        <div className="flex rounded-md border bg-card/60 p-0.5">
          {DIFFS.map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={cn(
                "rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
                diff === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {list.length} experiments
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((s) => (
          <SimCard key={s.id} sim={s} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No experiments match those filters.
        </p>
      )}
    </div>
  );
}
