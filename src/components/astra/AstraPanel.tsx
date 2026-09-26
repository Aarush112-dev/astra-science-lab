import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAstra, analyseExperiment } from "@/lib/astra/engine";
import { labStore, useLabStore, type ExplanationLevel } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";

const LEVELS: ExplanationLevel[] = ["GCSE", "A-level", "University", "Advanced"];
const SUGGESTIONS = [
  "What is happening right now?",
  "What happens if I double the mass?",
  "What does this graph tell me?",
  "Which variable should I change next?",
  "What physical law explains this?",
];

interface Msg {
  role: "user" | "astra";
  text: string;
  analysis?: ReturnType<typeof analyseExperiment>;
}

export function AstraPanel({ compact = false }: { compact?: boolean }) {
  const ctx = useLabStore((s) => s.context);
  const level = useLabStore((s) => s.level);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "astra",
      text: "I am ASTRA, your research assistant. I read the live state of whichever lab you have open. Ask me about the physics, the graphs, or what to try next.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = (q: string) => {
    if (!q.trim()) return;
    const reply = askAstra(q, ctx, level);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "astra", text: reply.text }]);
    setInput("");
  };
  const analyse = () => {
    const a = analyseExperiment(ctx, level);
    setMsgs((m) => [
      ...m,
      { role: "user", text: "Analyse this experiment." },
      {
        role: "astra",
        text: a
          ? "Analysis of the current experiment:"
          : "Open a lab first — I only analyse data the simulation has actually generated.",
        analysis: a,
      },
    ]);
  };

  return (
    <section
      className={cn(
        "panel flex flex-col",
        compact ? "h-[520px]" : "h-[calc(100vh-8rem)] min-h-[520px]",
      )}
      aria-label="ASTRA AI Scientist"
    >
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        <Sparkles className="size-4 text-primary" />
        <span className="font-display text-sm font-semibold tracking-wide">ASTRA</span>
        <span className="label-mono ml-1">local science engine</span>
        <div
          className="ml-auto flex rounded-md border p-0.5"
          role="radiogroup"
          aria-label="Explanation level"
        >
          {LEVELS.map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={level === l}
              onClick={() => labStore.setLevel(l)}
              className={cn(
                "rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase",
                level === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {ctx ? (
        <div className="border-b bg-primary/5 px-4 py-2 text-[11px]">
          <span className="label-mono text-primary">context</span>{" "}
          <span className="text-muted-foreground">
            {ctx.simulationName} ·{" "}
            {Object.entries(ctx.parameters)
              .slice(0, 3)
              .map(([k, v]) => `${k}=${typeof v === "number" ? Number(v.toPrecision(3)) : v}`)
              .join(" · ")}
          </span>
        </div>
      ) : (
        <div className="border-b px-4 py-2 text-[11px] text-muted-foreground">
          No active simulation.
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" role="log" aria-live="polite">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[92%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[13px] leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-primary/15 text-foreground"
                : "bg-background/50 text-foreground/90",
            )}
          >
            {m.text}
            {m.analysis && <Analysis a={m.analysis} />}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-1 border-t px-3 pt-2">
        {SUGGESTIONS.slice(0, compact ? 3 : 5).map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
          >
            {s}
          </button>
        ))}
        <button
          onClick={analyse}
          className="rounded-full border border-violet/40 px-2 py-0.5 text-[10px] text-violet hover:bg-violet/10"
        >
          <FlaskConical className="mr-1 inline size-3" />
          Analyse with ASTRA
        </button>
      </div>
      <form
        className="flex gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          aria-label="Ask ASTRA"
          placeholder="Ask ASTRA…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-8 text-xs"
        />
        <Button type="submit" size="sm" variant="glow" aria-label="Send">
          <Send className="size-3.5" />
        </Button>
      </form>
    </section>
  );
}

function Analysis({ a }: { a: NonNullable<ReturnType<typeof analyseExperiment>> }) {
  const Block = ({ t, items }: { t: string; items: string[] }) => (
    <div className="mt-2">
      <div className="label-mono text-primary">{t}</div>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <div>
      <Block t="Observation" items={a.observation} />
      <Block t="Relevant equations" items={a.equation} />
      <div className="mt-2">
        <div className="label-mono text-primary">Physical explanation</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{a.explanation}</p>
      </div>
      <Block t="Possible sources of error" items={a.errors} />
      <div className="mt-2">
        <div className="label-mono text-primary">Suggested next experiment</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{a.next}</p>
      </div>
    </div>
  );
}
