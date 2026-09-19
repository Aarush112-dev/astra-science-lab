import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt } from "@/lib/physics/constants";
import { Button } from "@/components/ui/button";

export interface Series {
  key: string;
  name: string;
  data: { x: number; y: number }[];
  color?: string; // css color; defaults to chart tokens
  dashed?: boolean;
  dots?: boolean;
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/**
 * Interactive scientific chart: drag to zoom (x), reset, hover values, toggle series, log axes.
 */
export function SciChart({
  series,
  xLabel,
  yLabel,
  height = 260,
  logX = false,
  logY = false,
  xDomain,
  yDomain,
  reverseX = false,
  title,
  scatter = false,
}: {
  series: Series[];
  xLabel: string;
  yLabel: string;
  height?: number;
  logX?: boolean;
  logY?: boolean;
  xDomain?: [number, number];
  yDomain?: [number, number];
  reverseX?: boolean;
  title?: string;
  scatter?: boolean;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });

  const visible = series.filter((s) => !hidden.has(s.key));
  const domainX = useMemo<[number | string, number | string]>(() => {
    if (zoom) return zoom;
    if (xDomain) return xDomain;
    return ["auto", "auto"];
  }, [zoom, xDomain]);

  const Chart = scatter ? ScatterChart : LineChart;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {title ? <span className="label-mono">{title}</span> : <span />}
        <div className="flex items-center gap-1">
          {zoom && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setZoom(null)}>
              Reset zoom
            </Button>
          )}
          <span className="hidden text-[10px] text-muted-foreground sm:inline">drag to zoom</span>
        </div>
      </div>
      <div style={{ height }} className="select-none">
        <ResponsiveContainer width="100%" height="100%">
          <Chart
            margin={{ top: 8, right: 16, bottom: 20, left: 8 }}
            onMouseDown={(e) => e?.activeLabel != null && setDrag({ a: Number(e.activeLabel), b: null })}
            onMouseMove={(e) => drag.a != null && e?.activeLabel != null && setDrag((d) => ({ ...d, b: Number(e.activeLabel) }))}
            onMouseUp={() => {
              if (drag.a != null && drag.b != null && drag.a !== drag.b) setZoom([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)]);
              setDrag({ a: null, b: null });
            }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
            <XAxis
              dataKey="x"
              type="number"
              domain={domainX}
              reversed={reverseX}
              scale={logX ? "log" : "linear"}
              allowDataOverflow
              tickFormatter={(v) => fmt(v, 3)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              stroke="var(--border)"
              label={{ value: xLabel, position: "insideBottom", offset: -12, fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={yDomain ?? ["auto", "auto"]}
              scale={logY ? "log" : "linear"}
              allowDataOverflow
              tickFormatter={(v) => fmt(v, 2)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              stroke="var(--border)"
              width={56}
              label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 4, fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <RTooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-mono)" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v: number) => fmt(v, 4)}
              labelFormatter={(l) => `${xLabel}: ${fmt(Number(l), 4)}`}
              isAnimationActive={false}
            />
            {series.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
                onClick={(e) => {
                  const key = String((e as { dataKey?: string }).dataKey ?? e.value);
                  setHidden((h) => {
                    const n = new Set(h);
                    const k = series.find((s) => s.name === key)?.key ?? key;
                    n.has(k) ? n.delete(k) : n.add(k);
                    return n;
                  });
                }}
              />
            )}
            {visible.map((s, i) =>
              scatter ? (
                <Scatter key={s.key} name={s.name} data={s.data} fill={s.color ?? COLORS[i % COLORS.length]} isAnimationActive={false} />
              ) : (
                <Line
                  key={s.key}
                  name={s.name}
                  data={s.data}
                  dataKey="y"
                  type="monotone"
                  stroke={s.color ?? COLORS[i % COLORS.length]}
                  strokeWidth={1.6}
                  strokeDasharray={s.dashed ? "5 4" : undefined}
                  dot={s.dots ? { r: 2 } : false}
                  isAnimationActive={false}
                />
              ),
            )}
            {drag.a != null && drag.b != null && <ReferenceArea x1={drag.a} x2={drag.b} fill="var(--primary)" fillOpacity={0.12} />}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
