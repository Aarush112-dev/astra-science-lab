import { useState, useEffect, useRef } from "react";
import { Terminal, Radio, Sparkles, Orbit, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmt } from "@/lib/physics/constants";

export function EasterEggsModal() {
  const [open, setOpen] = useState(false);
  const [pulsarActive, setPulsarActive] = useState(false);
  const [pulsarSound, setPulsarSound] = useState(false);
  const [voyagerTime, setVoyagerTime] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string>("H");
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Pulsar audio-visual metronome
  useEffect(() => {
    if (!pulsarActive) return;
    const interval = setInterval(() => {
      if (pulsarSound) {
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            )();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === "suspended") ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.03);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.03);
        } catch {
          // audio context blocked by browser policy until interaction
        }
      }
    }, 100); // 10 Hz pulses

    return () => clearInterval(interval);
  }, [pulsarActive, pulsarSound]);

  // Voyager telemetry ticker
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setVoyagerTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  // Voyager 1 telemetry constants
  const v1DistKm = 24350000000 + voyagerTime * 17; // ~17 km/s
  const v1DistAU = +(v1DistKm / 149597870.7).toFixed(3);
  const lightHours = +((v1DistKm * 1000) / (299792458 * 3600)).toFixed(2);

  const ELEMENTS = [
    { s: "H", n: 1, name: "Hydrogen", mass: "1.008", conf: "1s¹", chi: "2.20" },
    { s: "He", n: 2, name: "Helium", mass: "4.003", conf: "1s²", chi: "—" },
    { s: "Li", n: 3, name: "Lithium", mass: "6.94", conf: "[He] 2s¹", chi: "0.98" },
    { s: "C", n: 6, name: "Carbon", mass: "12.011", conf: "[He] 2s² 2p²", chi: "2.55" },
    { s: "N", n: 7, name: "Nitrogen", mass: "14.007", conf: "[He] 2s² 2p³", chi: "3.04" },
    { s: "O", n: 8, name: "Oxygen", mass: "15.999", conf: "[He] 2s² 2p⁴", chi: "3.44" },
    { s: "Ne", n: 10, name: "Neon", mass: "20.180", conf: "[He] 2s² 2p⁶", chi: "—" },
    { s: "Na", n: 11, name: "Sodium", mass: "22.990", conf: "[Ne] 3s¹", chi: "0.93" },
    { s: "Fe", n: 26, name: "Iron", mass: "55.845", conf: "[Ar] 3d⁶ 4s²", chi: "1.83" },
    { s: "Au", n: 79, name: "Gold", mass: "196.97", conf: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", chi: "2.54" },
    { s: "U", n: 92, name: "Uranium", mass: "238.03", conf: "[Rn] 5f³ 6d¹ 7s²", chi: "1.38" },
  ];

  const currentEl = ELEMENTS.find((e) => e.s === selectedElement) ?? ELEMENTS[0]!;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/80 hover:text-primary transition-colors py-1 px-2 rounded border border-border/40 hover:border-primary/40 bg-card/40"
          title="Open scientific easter eggs console"
        >
          <Sparkles className="size-3 text-cyan animate-pulse" />
          <span>Scientific Relics</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border font-sans">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Terminal className="size-4 text-cyan" />
            <span>ASTRA Deep Space Relics & Easter Eggs</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="voyager" className="mt-2">
          <TabsList className="bg-background/80 border w-full justify-start font-mono text-xs">
            <TabsTrigger value="voyager" className="gap-1.5">
              <Radio className="size-3 text-cyan" /> Voyager Terminal
            </TabsTrigger>
            <TabsTrigger value="pulsar" className="gap-1.5">
              <Sparkles className="size-3 text-amber" /> Pulsar B0531+21
            </TabsTrigger>
            <TabsTrigger value="constants" className="gap-1.5">
              <Orbit className="size-3 text-violet" /> Physical Constants
            </TabsTrigger>
            <TabsTrigger value="elements" className="gap-1.5">
              Atomic Matrix
            </TabsTrigger>
          </TabsList>

          {/* VOYAGER TERMINAL */}
          <TabsContent value="voyager" className="space-y-3 mt-4">
            <div className="rounded-md border bg-black/80 p-4 font-mono text-xs text-emerald-400 space-y-2 border-emerald-900/40">
              <div className="flex justify-between border-b border-emerald-950 pb-1 text-[11px] text-emerald-600">
                <span>VOYAGER-1 // INTERSTELLAR MISSION STATUS</span>
                <span>STATUS: OPERATIONAL</span>
              </div>
              <p>
                &gt; CURRENT HELIOCENTRIC DISTANCE: {fmt(v1DistKm)} km ({v1DistAU} AU)
              </p>
              <p>&gt; ONE-WAY LIGHT TRAVEL TIME: {lightHours} hours</p>
              <p>&gt; HYPERBOLIC EXCESS VELOCITY: 16.999 km/s relative to Sun</p>
              <p>&gt; PRIMARY CARRIER: 8420.432 MHz (Deep Space Network Goldstone DSS-14)</p>
              <p>&gt; PAYLOAD: Golden Record Phonograph (115 analog images, sounds of Earth)</p>
              <div className="pt-2 text-[10px] text-emerald-500/80">
                “To the makers of music — all worlds, all times.”
              </div>
            </div>
          </TabsContent>

          {/* PULSAR BEACON */}
          <TabsContent value="pulsar" className="space-y-4 mt-4">
            <div className="panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold">Crab Pulsar (PSR B0531+21)</h4>
                  <p className="text-xs text-muted-foreground">
                    Young neutron star spinning at 30.2 revolutions per second.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={pulsarActive ? "glow" : "lab"}
                    onClick={() => setPulsarActive(!pulsarActive)}
                  >
                    {pulsarActive ? "Stop Beacon" : "Engage Pulsar"}
                  </Button>
                  {pulsarActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPulsarSound(!pulsarSound)}
                      aria-label="Toggle sound"
                    >
                      {pulsarSound ? (
                        <Volume2 className="size-4 text-cyan" />
                      ) : (
                        <VolumeX className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {pulsarActive && (
                <div className="flex items-center justify-center p-8 bg-black rounded border border-border/40">
                  <div className="relative flex items-center justify-center">
                    <div className="size-16 rounded-full bg-cyan/20 animate-ping absolute" />
                    <div className="size-8 rounded-full bg-cyan animate-pulse flex items-center justify-center text-[10px] font-mono font-bold text-background">
                      30 Hz
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* FUNDAMENTAL CONSTANTS */}
          <TabsContent value="constants" className="mt-4">
            <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs">
              <div className="panel p-3 border">
                <div className="label-mono text-primary">Fine-Structure Constant (α)</div>
                <div className="text-sm font-semibold mt-1">1 / 137.035999084</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Coupling constant for electromagnetic interaction.
                </p>
              </div>
              <div className="panel p-3 border">
                <div className="label-mono text-cyan">Planck Length (ℓ_P)</div>
                <div className="text-sm font-semibold mt-1">1.616255 × 10⁻³⁵ m</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Fundamental quantum gravity length scale √(ℏG/c³).
                </p>
              </div>
              <div className="panel p-3 border">
                <div className="label-mono text-amber">CMB Temperature (T_CMB)</div>
                <div className="text-sm font-semibold mt-1">2.72548 ± 0.00057 K</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Thermal relic radiation from cosmic recombination at z ≈ 1100.
                </p>
              </div>
              <div className="panel p-3 border">
                <div className="label-mono text-violet">Chandrasekhar Mass Limit</div>
                <div className="text-sm font-semibold mt-1">1.396 M☉ (≈ 2.76 × 10³⁰ kg)</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Maximum mass supported by electron degeneracy pressure.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ATOMIC MATRIX */}
          <TabsContent value="elements" className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {ELEMENTS.map((el) => (
                <button
                  key={el.s}
                  onClick={() => setSelectedElement(el.s)}
                  className={`size-10 rounded border font-mono text-xs flex flex-col items-center justify-center transition-colors ${
                    selectedElement === el.s
                      ? "border-primary bg-primary/20 text-primary font-bold"
                      : "border-border/60 hover:bg-muted"
                  }`}
                >
                  <span className="text-[9px] text-muted-foreground">{el.n}</span>
                  <span>{el.s}</span>
                </button>
              ))}
            </div>

            <div className="panel p-4 font-mono text-xs space-y-1">
              <div className="text-sm font-display font-semibold text-foreground">
                {currentEl.name} ({currentEl.s}) — Atomic Number {currentEl.n}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 text-muted-foreground">
                <div>
                  Standard Atomic Weight: <span className="text-cyan">{currentEl.mass} u</span>
                </div>
                <div>
                  Pauling Electronegativity: <span className="text-amber">{currentEl.chi}</span>
                </div>
                <div>
                  Electron Configuration: <span className="text-violet">{currentEl.conf}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
