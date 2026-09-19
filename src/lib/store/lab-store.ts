/**
 * Lightweight global store (no external deps) for:
 *  - active simulation context (read by ASTRA)
 *  - saved experiments (persisted to localStorage)
 *  - user preferences (reduced motion, explanation level)
 */
import { useSyncExternalStore } from "react";

export type ExplanationLevel = "GCSE" | "A-level" | "University" | "Advanced";

export interface SimContext {
  simulationId: string;
  simulationName: string;
  parameters: Record<string, number | string | boolean>;
  measurements: Record<string, number | string>;
  /** Short natural-language notes the simulation wants ASTRA to know (e.g. current stage). */
  notes?: string[];
  /** Series available for analysis: name -> array of {x,y} */
  series?: Record<string, { x: number; y: number }[]>;
  updatedAt: number;
}

export interface SavedExperiment {
  id: string;
  name: string;
  simulationId: string;
  simulationName: string;
  parameters: Record<string, number | string | boolean>;
  results: Record<string, number | string>;
  series?: Record<string, { x: number; y: number }[]>;
  notes: string;
  createdAt: number;
}

interface LabState {
  context: SimContext | null;
  saved: SavedExperiment[];
  level: ExplanationLevel;
  reduceMotion: boolean;
}

const KEY = "astra-lab:v1";

function load(): Pick<LabState, "saved" | "level" | "reduceMotion"> {
  if (typeof window === "undefined") return { saved: [], level: "A-level", reduceMotion: false };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { saved: [], level: "A-level", reduceMotion: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { saved: [], level: "A-level", reduceMotion: false };
}

let state: LabState = { context: null, saved: [], level: "A-level", reduceMotion: false };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  if (typeof window === "undefined") return;
  const { saved, level, reduceMotion } = state;
  window.localStorage.setItem(KEY, JSON.stringify({ saved, level, reduceMotion }));
}
function setState(patch: Partial<LabState>, save = true) {
  state = { ...state, ...patch };
  if (save) persist();
  emit();
}

export function hydrateLabStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  setState(load(), false);
}

export const labStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getState: () => state,
  setContext(ctx: Omit<SimContext, "updatedAt"> | null) {
    setState({ context: ctx ? { ...ctx, updatedAt: Date.now() } : null }, false);
  },
  saveExperiment(exp: Omit<SavedExperiment, "id" | "createdAt">) {
    const e: SavedExperiment = { ...exp, id: crypto.randomUUID(), createdAt: Date.now() };
    setState({ saved: [e, ...state.saved] });
    return e;
  },
  updateExperiment(id: string, patch: Partial<SavedExperiment>) {
    setState({ saved: state.saved.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  },
  duplicateExperiment(id: string) {
    const src = state.saved.find((s) => s.id === id);
    if (!src) return;
    setState({ saved: [{ ...src, id: crypto.randomUUID(), name: `${src.name} (copy)`, createdAt: Date.now() }, ...state.saved] });
  },
  deleteExperiment(id: string) {
    setState({ saved: state.saved.filter((s) => s.id !== id) });
  },
  setLevel(level: ExplanationLevel) {
    setState({ level });
  },
  setReduceMotion(reduceMotion: boolean) {
    setState({ reduceMotion });
    if (typeof document !== "undefined") document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  },
};

const serverSnapshot: LabState = { context: null, saved: [], level: "A-level", reduceMotion: false };

export function useLabStore<T>(selector: (s: LabState) => T): T {
  return useSyncExternalStore(
    labStore.subscribe,
    () => selector(state),
    () => selector(serverSnapshot),
  );
}

/** Helper for simulations: push context to ASTRA (throttle in caller if needed). */
export function publishContext(ctx: Omit<SimContext, "updatedAt">) {
  labStore.setContext(ctx);
}

export function exportCSV(rows: Record<string, number | string>[], filename: string) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => r[c]).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
