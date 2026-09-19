import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/physics/constants";
import { Info } from "lucide-react";

export function Panel({ title, children, className, action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <header className="flex items-center justify-between border-b px-4 py-2.5">
          <h3 className="label-mono">{title}</h3>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Scientific parameter slider with mono readout */
export function Param({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  format,
  hint,
  log = false,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: (v: number) => string;
  hint?: string;
  log?: boolean;
  disabled?: boolean;
}) {
  const toSlider = (v: number) => (log ? Math.log10(v) : v);
  const fromSlider = (s: number) => (log ? 10 ** s : s);
  const smin = toSlider(min);
  const smax = toSlider(max);
  const sstep = log ? (smax - smin) / 200 : (step ?? (max - min) / 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {label}
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label={`About ${label}`} className="text-muted-foreground/60 hover:text-primary">
                  <Info className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-56 text-xs">{hint}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="font-mono text-foreground">
          {format ? format(value) : fmt(value)}
          {unit && <span className="ml-1 text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <Slider
        aria-label={label}
        value={[toSlider(value)]}
        min={smin}
        max={smax}
        step={sstep}
        disabled={disabled}
        onValueChange={([s]) => onChange(fromSlider(s))}
      />
    </div>
  );
}

/** Readout row for live measurements. `si` shows on hover. */
export function Readout({ label, value, unit, si, tone }: { label: string; value: string | number; unit?: string; si?: string; tone?: "cyan" | "violet" | "amber" | "emerald" | "rose" }) {
  const v = typeof value === "number" ? fmt(value) : value;
  const toneClass = tone ? { cyan: "text-cyan", violet: "text-violet", amber: "text-amber", emerald: "text-emerald", rose: "text-rose" }[tone] : "text-foreground";
  const body = (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono tabular-nums", toneClass)}>
        {v}
        {unit && <span className="ml-1 text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
  if (!si) return body;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{body}</div>
      </TooltipTrigger>
      <TooltipContent className="font-mono text-xs">SI: {si}</TooltipContent>
    </Tooltip>
  );
}

export function Assumptions({ items }: { items: string[] }) {
  return (
    <Panel title="Model assumptions">
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {items.map((a) => (
          <li key={a} className="flex gap-2">
            <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-amber" />
            {a}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function StatGrid({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-md border bg-background/40 px-3 py-2">
          <div className="label-mono">{it.label}</div>
          <div className="mt-0.5 font-mono text-sm text-foreground">{it.value}</div>
          {it.sub && <div className="text-[10px] text-muted-foreground">{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}
