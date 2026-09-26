import { useEffect, useRef } from "react";
import { useLabStore } from "@/lib/store/lab-store";

const LABELS = ["STELLAR MASS", "TEMPERATURE", "LUMINOSITY", "METALLICITY", "ORBITAL VELOCITY"];

/** Canvas hero: a star evolving in colour/size with orbiting bodies, particles and a drifting spectrum. */
export function HeroVisual() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useLabStore((s) => s.reduceMotion);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles = Array.from({ length: 140 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.25 + Math.random() * 0.7,
      s: 0.002 + Math.random() * 0.004,
      z: Math.random(),
    }));

    const draw = () => {
      const W = canvas.width,
        H = canvas.height,
        cx = W * 0.5,
        cy = H * 0.5;
      const R0 = Math.min(W, H) * 0.11;
      ctx.clearRect(0, 0, W, H);

      // Evolution phase 0..1 (protostar -> MS -> giant -> collapse)
      const phase = (Math.sin(t * 0.00025) + 1) / 2;
      const radius = R0 * (0.7 + 1.6 * Math.pow(phase, 3));
      const temp = 3200 + 26000 * Math.pow(1 - phase, 1.5); // K-ish for colour
      const col =
        temp > 15000
          ? [170, 200, 255]
          : temp > 8000
            ? [220, 230, 255]
            : temp > 5500
              ? [255, 240, 200]
              : [255, 160, 90];

      // orbits
      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 1; i <= 3; i++) {
        const a = R0 * (2.2 + i * 0.9),
          b = a * 0.35;
        ctx.beginPath();
        ctx.ellipse(0, 0, a, b, -0.35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120,200,255,${0.08 + 0.03 * i})`;
        ctx.lineWidth = dpr;
        ctx.stroke();
        const ang = t * (0.0009 / Math.sqrt(i)) + i;
        const px = a * Math.cos(ang),
          py = b * Math.sin(ang);
        const rx = px * Math.cos(-0.35) - py * Math.sin(-0.35),
          ry = px * Math.sin(-0.35) + py * Math.cos(-0.35);
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = i === 2 ? "rgba(190,150,255,0.9)" : "rgba(160,220,255,0.9)";
        ctx.fill();
      }
      // particles
      for (const p of particles) {
        p.a += p.s;
        const rr = R0 * (1.4 + p.r * 2.5);
        const x = Math.cos(p.a) * rr,
          y = Math.sin(p.a) * rr * 0.5;
        ctx.globalAlpha = 0.2 + 0.5 * p.z;
        ctx.fillStyle = "rgb(150,210,255)";
        ctx.fillRect(x, y, dpr, dpr);
      }
      ctx.globalAlpha = 1;

      // star glow
      const g = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 2.4);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.95)`);
      g.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},0.35)`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // spectrum strip
      const sy = H - 26 * dpr,
        sw = W * 0.5,
        sx = cx - sw / 2;
      const grad = ctx.createLinearGradient(sx, 0, sx + sw, 0);
      grad.addColorStop(0, "rgba(120,80,255,0.6)");
      grad.addColorStop(0.5, "rgba(80,255,180,0.5)");
      grad.addColorStop(1, "rgba(255,80,60,0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, sw, 6 * dpr);
      const shift = Math.sin(t * 0.0006) * 10 * dpr;
      for (const f of [0.18, 0.31, 0.44, 0.62, 0.77]) {
        ctx.fillStyle = "rgba(10,12,25,0.95)";
        ctx.fillRect(sx + sw * f + shift, sy - 2 * dpr, 1.5 * dpr, 10 * dpr);
      }

      t += reduce ? 0 : 16;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce]);

  return (
    <div className="relative aspect-[4/3] w-full max-w-xl">
      <canvas
        ref={ref}
        className="size-full"
        aria-label="Animated star evolution visualisation"
        role="img"
      />
      {LABELS.map((l, i) => (
        <span
          key={l}
          className="label-mono absolute animate-drift rounded-sm border border-border/60 bg-background/60 px-1.5 py-0.5 text-[9px] text-primary/80 backdrop-blur-sm"
          style={{
            left: `${[8, 70, 78, 12, 45][i]}%`,
            top: `${[18, 12, 70, 72, 4][i]}%`,
            animationDelay: `${i * 1.7}s`,
          }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}
