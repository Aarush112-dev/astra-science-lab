import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas } from "@/components/lab/useCanvas";
import { R, fmt } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";

export const Route = createFileRoute("/lab/reaction-kinetics")({
  head: () => labHead("reaction-kinetics"),
  component: ReactionKineticsLab,
});

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "A" | "B" | "P"; // Reactant A, Reactant B, Product P
}

export function ReactionKineticsLab() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [tempK, setTempK] = useState(310); // K (280 to 450)
  const [initConcA, setInitConcA] = useState(1.0); // mol/L
  const [initConcB, setInitConcB] = useState(1.0); // mol/L
  const [eaKJ, setEaKJ] = useState(50); // kJ/mol (20 to 100)
  const [catalyst, setCatalyst] = useState(false);
  const [running, setRunning] = useState(true);
  const [simTime, setSimTime] = useState(0);

  // Effective activation energy
  const effectiveEaKJ = catalyst ? Math.max(15, eaKJ - 25) : eaKJ;
  const effectiveEaJ = effectiveEaKJ * 1000;

  // Arrhenius rate constant: k = A * exp(-Ea / (R * T))
  const preExpA = 1.5e8;
  const kRate = preExpA * Math.exp(-effectiveEaJ / (R * tempK));
  const halfLifeS = +(0.693 / Math.max(1e-6, kRate * initConcB)).toFixed(2);

  // Integrated rate law simulation series (second order A + B -> P)
  const { concSeries, arrheniusData } = useMemo(() => {
    const ptsA: { x: number; y: number }[] = [];
    const ptsP: { x: number; y: number }[] = [];
    const dt = 0.2;
    const maxT = 20;

    let cA = initConcA;
    let cB = initConcB;
    let cP = 0;

    for (let t = 0; t <= maxT; t += dt) {
      ptsA.push({ x: +t.toFixed(1), y: +cA.toFixed(3) });
      ptsP.push({ x: +t.toFixed(1), y: +cP.toFixed(3) });

      const rate = kRate * cA * cB;
      const dC = rate * dt;
      cA = Math.max(0, cA - dC);
      cB = Math.max(0, cB - dC);
      cP += dC;
    }

    // Arrhenius ln(k) vs 1/T points
    const arrhPts: { x: number; y: number }[] = [];
    for (let T = 280; T <= 420; T += 20) {
      const invT = +(1000 / T).toFixed(3); // 1000/T (K^-1)
      const kVal = preExpA * Math.exp(-effectiveEaJ / (R * T));
      arrhPts.push({ x: invT, y: +Math.log(Math.max(1e-9, kVal)).toFixed(3) });
    }

    return {
      concSeries: [
        { key: "concA", name: "[A] Reactant", data: ptsA, color: "#38bdf8" },
        { key: "concP", name: "[Product]", data: ptsP, color: "#10b981" },
      ],
      arrheniusData: arrhPts,
    };
  }, [initConcA, initConcB, kRate, effectiveEaJ]);

  // Particles state for real collision canvas
  const particlesRef = useRef<Particle[]>([]);
  const countsRef = useRef({ A: 30, B: 30, P: 0, totalCollisions: 0, productiveCollisions: 0 });

  const resetParticles = () => {
    const parts: Particle[] = [];
    const speedMult = Math.sqrt(tempK / 300);
    const countA = Math.round(initConcA * 25);
    const countB = Math.round(initConcB * 25);

    for (let i = 0; i < countA; i++) {
      const angle = Math.random() * 2 * Math.PI;
      parts.push({
        x: Math.random() * 380 + 20,
        y: Math.random() * 260 + 20,
        vx: Math.cos(angle) * (1.2 + Math.random()) * speedMult,
        vy: Math.sin(angle) * (1.2 + Math.random()) * speedMult,
        type: "A",
      });
    }
    for (let i = 0; i < countB; i++) {
      const angle = Math.random() * 2 * Math.PI;
      parts.push({
        x: Math.random() * 380 + 20,
        y: Math.random() * 260 + 20,
        vx: Math.cos(angle) * (1.2 + Math.random()) * speedMult,
        vy: Math.sin(angle) * (1.2 + Math.random()) * speedMult,
        type: "B",
      });
    }
    particlesRef.current = parts;
    countsRef.current = { A: countA, B: countB, P: 0, totalCollisions: 0, productiveCollisions: 0 };
    setSimTime(0);
  };

  useEffect(() => {
    resetParticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initConcA, initConcB, tempK, catalyst, eaKJ]);

  // Canvas visualizer with elastic & reactive particle collisions
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const parts = particlesRef.current;
    const speedScale = Math.sqrt(tempK / 300);
    const radius = 5;

    // Boundary walls
    ctx.strokeStyle = "rgba(70, 95, 140, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    if (running) {
      setSimTime((t) => t + 0.016);
      // Particle updates
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx * speedScale;
        p.y += p.vy * speedScale;

        // Bounce walls
        if (p.x < 10 + radius) {
          p.x = 10 + radius;
          p.vx *= -1;
        }
        if (p.x > w - 20 - radius) {
          p.x = w - 20 - radius;
          p.vx *= -1;
        }
        if (p.y < 10 + radius) {
          p.y = 10 + radius;
          p.vy *= -1;
        }
        if (p.y > h - 20 - radius) {
          p.y = h - 20 - radius;
          p.vy *= -1;
        }

        // Inter-particle collisions
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < radius * 2 && dist > 0) {
            countsRef.current.totalCollisions++;

            // Relative kinetic energy of collision
            const dvx = q.vx - p.vx;
            const dvy = q.vy - p.vy;
            const vRelSq = dvx * dvx + dvy * dvy;
            // Simulated collision energy scaled to kJ/mol
            const collisionEnergyKJ = vRelSq * 18;

            // Reaction criteria: A colliding with B with Energy >= Ea
            if (
              ((p.type === "A" && q.type === "B") || (p.type === "B" && q.type === "A")) &&
              collisionEnergyKJ >= effectiveEaKJ
            ) {
              p.type = "P";
              q.type = "P";
              countsRef.current.productiveCollisions++;
              countsRef.current.A = Math.max(0, countsRef.current.A - 1);
              countsRef.current.B = Math.max(0, countsRef.current.B - 1);
              countsRef.current.P += 2;

              // Flash glow at reaction site
              ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
              ctx.beginPath();
              ctx.arc((p.x + q.x) / 2, (p.y + q.y) / 2, radius * 3, 0, 2 * Math.PI);
              ctx.fill();
            }

            // Elastic momentum transfer
            const nx = dx / dist;
            const ny = dy / dist;
            const pVal = (2 * (p.vx * nx + p.vy * ny - q.vx * nx - q.vy * ny)) / 2;
            p.vx -= pVal * nx;
            p.vy -= pVal * ny;
            q.vx += pVal * nx;
            q.vy += pVal * ny;
          }
        }
      }
    }

    // Draw particles
    for (const p of parts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      if (p.type === "A") {
        ctx.fillStyle = "#38bdf8"; // Cyan
      } else if (p.type === "B") {
        ctx.fillStyle = "#f59e0b"; // Amber
      } else {
        ctx.fillStyle = "#10b981"; // Emerald product
      }
      ctx.fill();
    }

    // On-canvas statistics overlay
    ctx.fillStyle = "rgba(220, 230, 250, 0.85)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(
      `Reactant A: ${countsRef.current.A}  |  Reactant B: ${countsRef.current.B}  |  Product: ${countsRef.current.P}`,
      22,
      28,
    );
    const effColl =
      countsRef.current.totalCollisions > 0
        ? (
            (countsRef.current.productiveCollisions / countsRef.current.totalCollisions) *
            100
          ).toFixed(1)
        : "0.0";
    ctx.fillText(
      `Collision Yield: ${effColl}%  |  Mean Kinetic Speed ∝ √T = ${speedScale.toFixed(2)}×`,
      22,
      44,
    );
  });

  const context = useMemo(
    () => ({
      simulationId: "reaction-kinetics",
      simulationName: "Chemical Reaction Kinetics",
      parameters: {
        temperature_K: tempK,
        initialA_molL: initConcA,
        initialB_molL: initConcB,
        activationEnergy_kJ: effectiveEaKJ,
        catalystActive: catalyst ? 1 : 0,
      },
      measurements: {
        rateConstant_k: +kRate.toPrecision(3),
        halfLife_s: halfLifeS,
        reactionRate_init: +(kRate * initConcA * initConcB).toPrecision(3),
        effectiveEa_kJ: effectiveEaKJ,
      },
      notes: [
        catalyst
          ? `Catalyst lowered Ea from ${eaKJ} kJ/mol to ${effectiveEaKJ} kJ/mol.`
          : "Uncatalysed pathway.",
        `Arrhenius temperature factor exp(-Ea/RT) = ${Math.exp(-effectiveEaJ / (R * tempK)).toExponential(2)}.`,
      ],
      series: {
        "Concentration vs Time": concSeries[0]?.data ?? [],
      },
    }),
    [
      tempK,
      initConcA,
      initConcB,
      effectiveEaKJ,
      catalyst,
      kRate,
      halfLifeS,
      eaKJ,
      effectiveEaJ,
      concSeries,
    ],
  );

  return (
    <LabLayout
      simulationId="reaction-kinetics"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button size="sm" variant="lab" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button size="sm" variant="lab" onClick={resetParticles}>
            <RotateCcw className="size-3" />
          </Button>
          <div className="flex items-center gap-2 pl-2">
            <Switch id="catalyst-mode" checked={catalyst} onCheckedChange={setCatalyst} />
            <Label
              htmlFor="catalyst-mode"
              className="flex items-center gap-1 font-mono text-xs cursor-pointer"
            >
              <Zap className="size-3 text-amber" />
              {catalyst ? "Catalyst (Lower Ea)" : "Uncatalysed"}
            </Label>
          </div>
        </>
      }
      controls={
        <Panel title="Experimental Conditions">
          <div className="space-y-4">
            <Param
              label="Temperature"
              value={tempK}
              min={273}
              max={450}
              step={1}
              unit="K"
              onChange={setTempK}
              hint="Increases molecular velocity and fraction with E ≥ Ea."
            />
            <Param
              label="Initial Concentration [A]"
              value={initConcA}
              min={0.1}
              max={2.0}
              step={0.1}
              unit="M"
              onChange={setInitConcA}
            />
            <Param
              label="Initial Concentration [B]"
              value={initConcB}
              min={0.1}
              max={2.0}
              step={0.1}
              unit="M"
              onChange={setInitConcB}
            />
            <Param
              label="Activation Energy Ea"
              value={eaKJ}
              min={25}
              max={95}
              step={1}
              unit="kJ/mol"
              onChange={setEaKJ}
              hint="Energy barrier required for productive bonds rearrangement."
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Kinetic Measurements">
          <Readout label="Rate Constant k" value={kRate.toPrecision(3)} unit="M⁻¹s⁻¹" tone="cyan" />
          <Readout
            label="Initial Reaction Rate"
            value={(kRate * initConcA * initConcB).toPrecision(3)}
            unit="M/s"
            tone="emerald"
          />
          <Readout label="Effective Ea" value={effectiveEaKJ} unit="kJ/mol" tone="amber" />
          <Readout label="Estimated Half-life" value={halfLifeS} unit="s" />
          <Readout
            label="Boltzmann Fraction e^(-Ea/RT)"
            value={Math.exp(-effectiveEaJ / (R * tempK)).toExponential(2)}
            tone="violet"
          />
        </Panel>
      }
      equations={[
        {
          name: "Arrhenius equation",
          latex: "k = A e^{-\\frac{E_a}{RT}}",
          symbols: [
            { symbol: "k", meaning: "rate constant" },
            { symbol: "A", meaning: "pre-exponential frequency factor" },
            { symbol: "E_a", meaning: "activation energy", unit: "J/mol" },
            { symbol: "R", meaning: "molar gas constant (8.314 J/mol·K)" },
            { symbol: "T", meaning: "thermodynamic temperature", unit: "K" },
          ],
          kind: "exact",
        },
        {
          name: "Rate law (second order)",
          latex: "\\text{Rate} = k [A][B]",
          symbols: [{ symbol: "[A], [B]", meaning: "reactant concentrations", unit: "mol/L" }],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Bimolecular elementary step A + B → P",
        "Maxwell-Boltzmann velocity distribution with hard-sphere collision cross section",
        "Catalyst lowers activation barrier without affecting thermodynamics",
      ]}
      physicsNotes={[
        "Higher temperature shifts the Maxwell-Boltzmann curve rightward, exponentially increasing the fraction of collisions with E ≥ Ea.",
        "Catalysts offer an alternative transition state with lower activation energy, drastically accelerating reaction rate without being consumed.",
      ]}
    >
      <Panel title="Collision Chamber (Cyan = Reactant A, Amber = Reactant B, Green = Product)">
        <canvas
          ref={canvasRef}
          className="h-[300px] w-full"
          aria-label="Molecular collision chamber"
        />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Concentration vs Time (Integrated Kinetics)">
          <SciChart xLabel="Time (s)" yLabel="Concentration (M)" height={220} series={concSeries} />
        </Panel>

        <Panel title="Arrhenius Plot: ln(k) vs 1000/T (K⁻¹)">
          <SciChart
            xLabel="1000/T (K⁻¹)"
            yLabel="ln(k)"
            height={220}
            series={[
              {
                key: "arrh",
                name: "ln(k)",
                data: arrheniusData,
                color: "#f59e0b",
              },
            ]}
          />
        </Panel>
      </div>
    </LabLayout>
  );
}
