import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas } from "@/components/lab/useCanvas";
import { R, fmt } from "@/lib/physics/constants";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/lab/chemical-equilibrium")({
  head: () => labHead("chemical-equilibrium"),
  component: ChemicalEquilibriumLab,
});

// Haber-Bosch reaction: N2(g) + 3H2(g) <=> 2NH3(g)
// Delta H° = -92.4 kJ/mol (exothermic)
const DELTA_H = -92400; // J/mol

export function ChemicalEquilibriumLab() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [tempK, setTempK] = useState(650); // K (400 to 900)
  const [pressureBar, setPressureBar] = useState(150); // bar (10 to 300)
  const [initN2, setInitN2] = useState(1.0); // M
  const [initH2, setInitH2] = useState(3.0); // M
  const [initNH3, setInitNH3] = useState(0.2); // M
  const [running, setRunning] = useState(true);

  // Standard Kc at 298K ~ 6.0e5
  // van 't Hoff: ln(Kc(T) / Kc(298)) = (Delta H / R) * (1/298 - 1/T)
  const Kc = useMemo(() => {
    const lnKc = Math.log(6.0e5) + (DELTA_H / R) * (1 / 298 - 1 / tempK);
    return Math.max(1e-5, Math.min(1e7, Math.exp(lnKc)));
  }, [tempK]);

  // Current concentrations state tracking time evolution
  const [concN2, setConcN2] = useState(initN2);
  const [concH2, setConcH2] = useState(initH2);
  const [concNH3, setConcNH3] = useState(initNH3);
  const [history, setHistory] = useState<{ t: number; n2: number; h2: number; nh3: number }[]>([]);

  const resetAll = () => {
    setConcN2(initN2);
    setConcH2(initH2);
    setConcNH3(initNH3);
    setHistory([{ t: 0, n2: initN2, h2: initH2, nh3: initNH3 }]);
  };

  useEffect(() => {
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initN2, initH2, initNH3]);

  // Simulation step
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setConcN2((n2) => {
        setConcH2((h2) => {
          setConcNH3((nh3) => {
            // Reaction quotient Qc = [NH3]^2 / ([N2] * [H2]^3)
            const denom = Math.max(1e-6, n2 * h2 ** 3);
            const Qc = nh3 ** 2 / denom;

            // Pressure effect: higher pressure accelerates forward reaction (4 moles -> 2 moles)
            const pMult = (pressureBar / 100) ** 0.5;
            const kFwd = 0.08 * pMult;
            const kRev = kFwd / Math.max(1e-5, Kc);

            const rateFwd = kFwd * n2 * Math.min(10, h2 ** 1.5);
            const rateRev = kRev * nh3 ** 1.2;

            const netRate = (rateFwd - rateRev) * 0.12;

            const nextN2 = Math.max(0.01, n2 - netRate);
            const nextH2 = Math.max(0.01, h2 - 3 * netRate);
            const nextNH3 = Math.max(0.01, nh3 + 2 * netRate);

            setHistory((prev) => {
              const lastT = prev[prev.length - 1]?.t ?? 0;
              const next = [
                ...prev.slice(-60),
                {
                  t: +(lastT + 0.5).toFixed(1),
                  n2: +nextN2.toFixed(3),
                  h2: +nextH2.toFixed(3),
                  nh3: +nextNH3.toFixed(3),
                },
              ];
              return next;
            });

            return nextNH3;
          });
          return h2;
        });
        return n2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [running, pressureBar, Kc]);

  const denom = Math.max(1e-6, concN2 * concH2 ** 3);
  const currentQc = concNH3 ** 2 / denom;
  const equilibriumState =
    Math.abs(Math.log10(currentQc / Kc)) < 0.1
      ? "At Dynamic Equilibrium (Q = K)"
      : currentQc < Kc
        ? "Shifting Forward (Q < K → forming NH₃)"
        : "Shifting Reverse (Q > K → dissociating NH₃)";

  // Canvas visualizer: reactor flask with floating N2 (blue pair), H2 (small white pair), NH3 (yellow tri-hub)
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const rw = Math.min(w * 0.8, 380);
    const rh = 180;

    // Reactor Chamber
    ctx.strokeStyle = "rgba(70, 95, 150, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);

    // Thermal glow background
    const tGlow = Math.min(0.35, Math.max(0.05, (tempK - 400) / 1000));
    ctx.fillStyle = `rgba(239, 68, 68, ${tGlow})`;
    ctx.fillRect(cx - rw / 2 + 2, cy - rh / 2 + 2, rw - 4, rh - 4);

    // Molecules visual density
    const numN2 = Math.min(25, Math.round(concN2 * 8));
    const numH2 = Math.min(35, Math.round(concH2 * 8));
    const numNH3 = Math.min(30, Math.round(concNH3 * 8));

    // Draw N2 pairs (blue)
    ctx.fillStyle = "#38bdf8";
    for (let i = 0; i < numN2; i++) {
      const px = cx - rw / 2 + 20 + ((i * 53 + Date.now() * 0.02) % (rw - 40));
      const py = cy - rh / 2 + 20 + ((i * 37) % (rh - 40));
      ctx.beginPath();
      ctx.arc(px - 3, py, 4, 0, 2 * Math.PI);
      ctx.arc(px + 3, py, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw H2 pairs (white/cyan tiny)
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < numH2; i++) {
      const px = cx - rw / 2 + 15 + ((i * 41 + Date.now() * 0.035) % (rw - 30));
      const py = cy - rh / 2 + 15 + ((i * 61) % (rh - 30));
      ctx.beginPath();
      ctx.arc(px - 2, py, 2.5, 0, 2 * Math.PI);
      ctx.arc(px + 2, py, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw NH3 molecules (amber)
    ctx.fillStyle = "#f59e0b";
    for (let i = 0; i < numNH3; i++) {
      const px = cx - rw / 2 + 25 + ((i * 67 + Date.now() * 0.015) % (rw - 50));
      const py = cy - rh / 2 + 25 + ((i * 47) % (rh - 50));
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.arc(px - 4, py + 4, 2.5, 0, 2 * Math.PI);
      ctx.arc(px + 4, py + 4, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Overlay legend
    ctx.fillStyle = "rgba(220, 230, 250, 0.9)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(`N₂ + 3H₂ ⇌ 2NH₃  (ΔH° = −92.4 kJ/mol)`, 18, 22);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`[N₂] = ${concN2.toFixed(2)} M`, 18, 40);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`[H₂] = ${concH2.toFixed(2)} M`, 130, 40);
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(`[NH₃] = ${concNH3.toFixed(2)} M`, 240, 40);
  });

  const chartSeries = useMemo(() => {
    return [
      {
        key: "n2",
        name: "[N₂]",
        data: history.map((h) => ({ x: h.t, y: h.n2 })),
        color: "#38bdf8",
      },
      {
        key: "h2",
        name: "[H₂]",
        data: history.map((h) => ({ x: h.t, y: h.h2 })),
        color: "#e2e8f0",
      },
      {
        key: "nh3",
        name: "[NH₃]",
        data: history.map((h) => ({ x: h.t, y: h.nh3 })),
        color: "#f59e0b",
      },
    ];
  }, [history]);

  const context = useMemo(
    () => ({
      simulationId: "chemical-equilibrium",
      simulationName: "Chemical Equilibrium (Haber-Bosch)",
      parameters: {
        temperature_K: tempK,
        pressure_bar: pressureBar,
        n2_initial: initN2,
        h2_initial: initH2,
        nh3_initial: initNH3,
      },
      measurements: {
        equilibriumConstant_Kc: +Kc.toExponential(3),
        reactionQuotient_Qc: +currentQc.toExponential(3),
        currentN2_M: +concN2.toFixed(3),
        currentH2_M: +concH2.toFixed(3),
        currentNH3_M: +concNH3.toFixed(3),
      },
      notes: [
        `State: ${equilibriumState}.`,
        tempK > 600
          ? "High temperature suppresses NH3 yield because forward reaction is exothermic."
          : "Lower temperature favours higher equilibrium Kc.",
        pressureBar > 150
          ? "High pressure shifts equilibrium toward fewer moles of gas (NH3)."
          : "Low pressure favours dissociation into reactants.",
      ],
      series: {
        "[NH3] vs Time": chartSeries[2]?.data ?? [],
      },
    }),
    [
      tempK,
      pressureBar,
      initN2,
      initH2,
      initNH3,
      Kc,
      currentQc,
      concN2,
      concH2,
      concNH3,
      equilibriumState,
      chartSeries,
    ],
  );

  return (
    <LabLayout
      simulationId="chemical-equilibrium"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button size="sm" variant="lab" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button size="sm" variant="lab" onClick={resetAll}>
            <RotateCcw className="size-3" />
          </Button>
        </>
      }
      controls={
        <Panel title="Reactor Controls">
          <div className="space-y-4">
            <Param
              label="Reactor Temperature"
              value={tempK}
              min={400}
              max={900}
              step={10}
              unit="K"
              onChange={setTempK}
              hint="Exothermic forward reaction: heat pushes equilibrium left."
            />
            <Param
              label="Chamber Pressure"
              value={pressureBar}
              min={10}
              max={300}
              step={5}
              unit="bar"
              onChange={setPressureBar}
              hint="4 mol gas (N₂ + 3H₂) → 2 mol gas (2NH₃): pressure pushes right."
            />
            <Param
              label="Inject [N₂] Reactant"
              value={initN2}
              min={0.2}
              max={4.0}
              step={0.2}
              unit="M"
              onChange={setInitN2}
            />
            <Param
              label="Inject [H₂] Reactant"
              value={initH2}
              min={0.5}
              max={8.0}
              step={0.5}
              unit="M"
              onChange={setInitH2}
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Equilibrium Status">
          <Readout label="Equilibrium Constant Kc" value={Kc.toExponential(3)} tone="cyan" />
          <Readout label="Reaction Quotient Qc" value={currentQc.toExponential(3)} tone="amber" />
          <Readout label="Equilibrium Shift" value={equilibriumState} tone="violet" />
          <Readout label="Current [NH₃]" value={concNH3.toFixed(2)} unit="M" tone="emerald" />
          <Readout
            label="Mole Fraction NH₃"
            value={((concNH3 / (concN2 + concH2 + concNH3)) * 100).toFixed(1)}
            unit="%"
          />
        </Panel>
      }
      equations={[
        {
          name: "Equilibrium constant",
          latex: "K_c = \\frac{[\\text{NH}_3]^2}{[\\text{N}_2][\\text{H}_2]^3}",
          symbols: [
            { symbol: "K_c", meaning: "concentration equilibrium constant" },
            { symbol: "[\\text{X}]", meaning: "molar concentration of species X", unit: "mol/L" },
          ],
          kind: "exact",
        },
        {
          name: "van 't Hoff equation",
          latex: "\\frac{d \\ln K_c}{dT} = \\frac{\\Delta H^\\circ}{RT^2}",
          symbols: [
            { symbol: "\\Delta H^\\circ", meaning: "standard enthalpy of reaction (-92.4 kJ/mol)" },
            { symbol: "T", meaning: "temperature", unit: "K" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Ideal gas behaviour at elevated pressures",
        "Constant reactor volume; dynamic mass action kinetics",
        "Single-phase homogeneous gas equilibrium without condensation",
      ]}
      physicsNotes={[
        "Le Chatelier's Principle: When a system at equilibrium is subjected to change in temperature, pressure, or concentration, the system shifts to counteract the imposed change.",
        "Industrial Haber-Bosch compromises between high yield (favoured at low T) and viable reaction rate (requires high T with iron catalyst).",
      ]}
    >
      <Panel title="Continuous Flow Equilibrium Reactor">
        <canvas
          ref={canvasRef}
          className="h-[240px] w-full"
          aria-label="Equilibrium reactor chamber"
        />
      </Panel>

      <Panel title="Dynamic Concentrations vs Time (s)">
        <SciChart xLabel="Time (s)" yLabel="Concentration (M)" height={230} series={chartSeries} />
      </Panel>
    </LabLayout>
  );
}
