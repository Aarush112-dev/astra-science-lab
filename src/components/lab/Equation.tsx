import { useMemo, useState } from "react";
import katex from "katex";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EquationDef {
  name: string;
  latex: string;
  symbols: { symbol: string; meaning: string; unit?: string }[];
  /** exact | approximation | model */
  kind?: "exact" | "approximation" | "model";
}

export function Tex({ tex, block = false, className }: { tex: string; block?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: block, throwOnError: false });
    } catch {
      return tex;
    }
  }, [tex, block]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function EquationPanel({ equations, defaultOpen = false }: { equations: EquationDef[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState<number | null>(null);
  return (
    <section className="panel overflow-hidden" aria-label="Equations">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent/40"
        aria-expanded={open}
      >
        <span className="label-mono">Equations · {equations.length}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="divide-y divide-border border-t">
          {equations.map((eq, i) => (
            <li key={eq.name}>
              <button
                type="button"
                onClick={() => setActive(active === i ? null : i)}
                className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-accent/30"
                aria-expanded={active === i}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{eq.name}</span>
                  {eq.kind && <KindBadge kind={eq.kind} />}
                </div>
                <Tex tex={eq.latex} className="text-foreground" />
              </button>
              {active === i && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 bg-background/40 px-4 py-3 text-xs">
                  {eq.symbols.map((s) => (
                    <div key={s.symbol} className="contents">
                      <dt className="font-mono text-primary">
                        <Tex tex={s.symbol} />
                      </dt>
                      <dd className="text-muted-foreground">
                        {s.meaning}
                        {s.unit && <span className="ml-1 font-mono text-foreground/70">[{s.unit}]</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function KindBadge({ kind }: { kind: "exact" | "approximation" | "model" }) {
  const styles = {
    exact: "border-emerald/40 text-emerald",
    approximation: "border-amber/40 text-amber",
    model: "border-violet/40 text-violet",
  }[kind];
  const label = { exact: "Exact", approximation: "Approximation", model: "Simplified model" }[kind];
  return <span className={cn("rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", styles)}>{label}</span>;
}
