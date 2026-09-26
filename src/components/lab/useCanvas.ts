import { useCallback, useEffect, useRef, useState } from "react";

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
  t: number,
) => void;

/**
 * Runs a DPR-aware requestAnimationFrame loop on a canvas.
 * The latest `draw` is always used (stored in a ref), so callers can close over fresh state.
 */
export function useCanvas(draw: DrawFn, running = true) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const runRef = useRef(running);
  runRef.current = running;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const step = runRef.current ? dt : 0;
      t += step;
      drawRef.current(ctx, w, h, step, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return ref;
}

/** Read a CSS custom property colour (e.g. "--cyan") for canvas drawing. */
export function cssVar(name: string, fallback = "#8cf") {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Throttled periodic tick to re-render readouts from refs without re-rendering every frame. */
export function useTicker(ms = 250) {
  const [, force] = useStateTick();
  useEffect(() => {
    const id = setInterval(force, ms);
    return () => clearInterval(id);
  }, [ms, force]);
}

function useStateTick() {
  const [n, setN] = useState(0);
  const f = useCallback(() => setN((x) => x + 1), []);
  return [n, f] as const;
}

/** Blackbody temperature -> approximate sRGB css colour */
export function tempToColor(T: number): string {
  const t = T / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

/** Wavelength (nm) -> css colour */
export function wavelengthToColor(l: number, alpha = 1): string {
  let r = 0,
    g = 0,
    b = 0;
  if (l >= 380 && l < 440) {
    r = -(l - 440) / 60;
    b = 1;
  } else if (l < 490) {
    g = (l - 440) / 50;
    b = 1;
  } else if (l < 510) {
    g = 1;
    b = -(l - 510) / 20;
  } else if (l < 580) {
    r = (l - 510) / 70;
    g = 1;
  } else if (l < 645) {
    r = 1;
    g = -(l - 645) / 65;
  } else if (l <= 780) {
    r = 1;
  }
  let f = 1;
  if (l < 420) f = 0.3 + (0.7 * (l - 380)) / 40;
  else if (l > 700) f = 0.3 + (0.7 * (780 - l)) / 80;
  if (l < 380 || l > 780) f = 0;
  return `rgba(${Math.round(255 * r * f)},${Math.round(255 * g * f)},${Math.round(255 * b * f)},${alpha})`;
}
