import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas } from "@/components/lab/useCanvas";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/lab/reaction-visualizer")({
  head: () => labHead("reaction-mechanisms"),
  component: ReactionVisualizerLab,
});

interface MoleculeParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "H2" | "O2" | "H2O";
}

export function ReactionVisualizerLab() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [tempK, setTempK] = useState(380); // K (250 to 800)
  const [eaThreshold, setEaThreshold] = useState(45); // Relative threshold energy (10 to 100)
  const [initialH2Count, setInitialH2Count] = useState(24);
  const [initialO2Count, setInitialO2Count] = useState(12);
  const [running, setRunning] = useState(true);

  const particlesRef = useRef<MoleculeParticle[]>([]);
  const statsRef = useRef({
    successful: 0,
    unsuccessful: 0,
    lastEnergy: 0,
    h2: initialH2Count,
    o2: initialO2Count,
    h2o: 0,
  });

  const [statsDisplay, setStatsDisplay] = useState({
    successful: 0,
    unsuccessful: 0,
    h2: initialH2Count,
    o2: initialO2Count,
    h2o: 0,
  });

  const resetChamber = () => {
    const parts: MoleculeParticle[] = [];
    const speed = Math.sqrt(tempK / 300) * 1.6;
    let idCounter = 0;

    for (let i = 0; i < initialH2Count; i++) {
      const ang = Math.random() * 2 * Math.PI;
      parts.push({
        id: idCounter++,
        x: 30 + Math.random() * 340,
        y: 30 + Math.random() * 220,
        vx: Math.cos(ang) * speed * 1.4, // H2 is lighter, moves faster
        vy: Math.sin(ang) * speed * 1.4,
        type: "H2",
      });
    }

    for (let i = 0; i < initialO2Count; i++) {
      const ang = Math.random() * 2 * Math.PI;
      parts.push({
        id: idCounter++,
        x: 30 + Math.random() * 340,
        y: 30 + Math.random() * 220,
        vx: Math.cos(ang) * speed * 0.7, // O2 is heavier
        vy: Math.sin(ang) * speed * 0.7,
        type: "O2",
      });
    }

    particlesRef.current = parts;
    statsRef.current = {
      successful: 0,
      unsuccessful: 0,
      lastEnergy: 0,
      h2: initialH2Count,
      o2: initialO2Count,
      h2o: 0,
    };
    setStatsDisplay({
      successful: 0,
      unsuccessful: 0,
      h2: initialH2Count,
      o2: initialO2Count,
      h2o: 0,
    });
  };

  useEffect(() => {
    resetChamber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialH2Count, initialO2Count, tempK]);

  // Canvas visualizer simulating 2H2 + O2 -> 2H2O
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const parts = particlesRef.current;
    const speedScale = Math.sqrt(tempK / 300);

    // Chamber border
    ctx.strokeStyle = "rgba(70, 95, 140, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    if (running) {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx * speedScale * 0.7;
        p.y += p.vy * speedScale * 0.7;

        if (p.x < 20) {
          p.x = 20;
          p.vx *= -1;
        }
        if (p.x > w - 20) {
          p.x = w - 20;
          p.vx *= -1;
        }
        if (p.y < 20) {
          p.y = 20;
          p.vy *= -1;
        }
        if (p.y > h - 20) {
          p.y = h - 20;
          p.vy *= -1;
        }

        // Pairwise collisions
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const dist = Math.hypot(dx, dy);
          const rCombined = p.type === "O2" || q.type === "O2" ? 14 : 10;

          if (dist < rCombined && dist > 0) {
            // Collision relative kinetic energy
            const vRelSq = (p.vx - q.vx) ** 2 + (p.vy - q.vy) ** 2;
            const collEnergy = vRelSq * 12;
            statsRef.current.lastEnergy = +collEnergy.toFixed(1);

            // Reaction between H2 and O2
            const isReactivePair =
              (p.type === "H2" && q.type === "O2") || (p.type === "O2" && q.type === "H2");

            if (isReactivePair && collEnergy >= eaThreshold) {
              // Successful productive collision: form H2O!
              statsRef.current.successful++;
              p.type = "H2O";
              q.type = "H2O";
              statsRef.current.h2o += 2;
              if (p.type === "H2") statsRef.current.h2--;
              else statsRef.current.o2--;

              // Flash combustion burst
              ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
              ctx.beginPath();
              ctx.arc((p.x + q.x) / 2, (p.y + q.y) / 2, 22, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              // Elastic bounce / unsuccessful collision
              statsRef.current.unsuccessful++;
            }

            // Normal momentum exchange
            const nx = dx / dist;
            const ny = dy / dist;
            const pImpulse = (2 * (p.vx * nx + p.vy * ny - q.vx * nx - q.vy * ny)) / 2;
            p.vx -= pImpulse * nx;
            p.vy -= pImpulse * ny;
            q.vx += pImpulse * nx;
            q.vy += pImpulse * ny;
          }
        }
      }

      setStatsDisplay({ ...statsRef.current });
    }

    // Render molecules
    for (const p of parts) {
      if (p.type === "H2") {
        // Two small white spheres
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x - 3, p.y, 4, 0, 2 * Math.PI);
        ctx.arc(p.x + 3, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      } else if (p.type === "O2") {
        // Two larger red spheres
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y, 6, 0, 2 * Math.PI);
        ctx.arc(p.x + 5, p.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // H2O: Red oxygen with two white hydrogens
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y - 4, 3.5, 0, 2 * Math.PI);
        ctx.arc(p.x + 5, p.y - 4, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Legend
    ctx.fillStyle = "rgba(220, 230, 250, 0.9)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText("2H₂ (White) + O₂ (Red) → 2H₂O (Red & White)", 20, 26);
  });

  const totalColl = statsDisplay.successful + statsDisplay.unsuccessful;
  const yieldPct = totalColl > 0 ? ((statsDisplay.successful / totalColl) * 100).toFixed(1) : "0.0";

  const context = useMemo(
    () => ({
      simulationId: "reaction-mechanisms",
      simulationName: "Chemical Reaction Visualizer (2H₂ + O₂ → 2H₂O)",
      parameters: {
        temperature_K: tempK,
        activationEnergyThreshold: eaThreshold,
        initialH2: initialH2Count,
        initialO2: initialO2Count,
      },
      measurements: {
        successfulCollisions: statsDisplay.successful,
        unsuccessfulCollisions: statsDisplay.unsuccessful,
        collisionYield_pct: yieldPct,
        currentH2O_formed: statsDisplay.h2o,
      },
      notes: [
        `Collision yield: ${yieldPct}% with threshold Ea = ${eaThreshold}.`,
        tempK > 450
          ? "Thermal energy accelerates molecules, increasing collision frequency and productive yield."
          : "Lower temperatures reduce kinetic collision energy below activation barrier.",
      ],
    }),
    [tempK, eaThreshold, initialH2Count, initialO2Count, statsDisplay, yieldPct],
  );

  return (
    <LabLayout
      simulationId="reaction-mechanisms"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button size="sm" variant="lab" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button size="sm" variant="lab" onClick={resetChamber}>
            <RotateCcw className="size-3" /> Reset Molecules
          </Button>
        </>
      }
      controls={
        <Panel title="Collision Theory Settings">
          <div className="space-y-4">
            <Param
              label="Temperature"
              value={tempK}
              min={250}
              max={800}
              step={10}
              unit="K"
              onChange={setTempK}
              hint="Mean kinetic speed scales with √T."
            />
            <Param
              label="Activation Energy Barrier (Ea)"
              value={eaThreshold}
              min={15}
              max={85}
              step={1}
              onChange={setEaThreshold}
              hint="Minimum relative kinetic collision energy needed to break H-H and O=O bonds."
            />
            <Param
              label="Initial H₂ Count"
              value={initialH2Count}
              min={10}
              max={40}
              step={2}
              onChange={setInitialH2Count}
            />
            <Param
              label="Initial O₂ Count"
              value={initialO2Count}
              min={5}
              max={25}
              step={1}
              onChange={setInitialO2Count}
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Collision Yield Statistics">
          <Readout label="Productive (E ≥ Ea)" value={statsDisplay.successful} tone="emerald" />
          <Readout label="Elastic (E < Ea)" value={statsDisplay.unsuccessful} tone="rose" />
          <Readout label="Collision Success Yield" value={`${yieldPct} %`} tone="cyan" />
          <Readout label="Water Molecules Formed" value={statsDisplay.h2o} tone="violet" />
          <Readout label="H₂ Molecules Remaining" value={Math.max(0, statsDisplay.h2)} />
          <Readout label="O₂ Molecules Remaining" value={Math.max(0, statsDisplay.o2)} />
        </Panel>
      }
      equations={[
        {
          name: "Collision theory rate",
          latex: "Z_{AB} = n_A n_B \\sigma_{AB} \\sqrt{\\frac{8 k_B T}{\\pi \\mu}}",
          symbols: [
            { symbol: "Z_{AB}", meaning: "collision frequency density" },
            { symbol: "\\sigma_{AB}", meaning: "collision cross-section" },
            { symbol: "\\mu", meaning: "reduced mass", unit: "kg" },
          ],
          kind: "exact",
        },
        {
          name: "Reaction stoichiometry",
          latex:
            "2\\text{H}_2 + \\text{O}_2 \\longrightarrow 2\\text{H}_2\\text{O} \\quad (\\Delta H = -483.6\\,\\text{kJ/mol})",
          symbols: [],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Two-dimensional hard-sphere collision kinematics",
        "Activation energy barrier applied to relative collision kinetic energy",
        "Immediate conversion into H2O without intermediate radical chain buildup",
      ]}
      physicsNotes={[
        "For a reaction to occur, colliding molecules must possess both sufficient kinetic energy (E ≥ Ea) and favorable steric orientation.",
        "Raising the temperature shifts the Maxwell-Boltzmann energy distribution so that a vastly higher fraction of collisions exceed the threshold barrier.",
      ]}
    >
      <Panel title="Particle Collision Visualizer: 2H₂ + O₂ → 2H₂O">
        <canvas
          ref={canvasRef}
          className="h-[360px] w-full"
          aria-label="Microscopic collision visualizer"
        />
      </Panel>
    </LabLayout>
  );
}
