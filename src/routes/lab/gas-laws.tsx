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
import { Play, Pause, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/lab/gas-laws")({
  head: () => labHead("gas-laws"),
  component: GasLawsLab,
});

interface GasMolecule {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function GasLawsLab() {
  const [diff, setDiff] = useState<Difficulty>("Beginner");
  const [tempK, setTempK] = useState(300); // K (100 to 600)
  const [volumeL, setVolumeL] = useState(22.4); // L (10 to 50)
  const [molesN, setMolesN] = useState(1.0); // mol (0.5 to 3.0)
  const [gasMolarMassG, setGasMolarMassG] = useState(28); // N2 = 28 g/mol
  const [running, setRunning] = useState(true);

  // Ideal Gas Law: P = n R T / V
  // R = 0.082057 L·atm/(mol·K)
  const R_atm = 0.082057;
  const pressureAtm = +((molesN * R_atm * tempK) / volumeL).toFixed(2);
  const pressureKPa = +(pressureAtm * 101.325).toFixed(1);

  // Root mean square molecular speed: v_rms = sqrt(3 R T / M_molar)
  // M_molar in kg/mol (28e-3)
  const vRms = Math.sqrt((3 * 8.314 * tempK) / (gasMolarMassG * 1e-3));

  // Particles simulation in piston cylinder
  const particlesRef = useRef<GasMolecule[]>([]);
  const resetParticles = () => {
    const count = Math.round(molesN * 35);
    const parts: GasMolecule[] = [];
    const speed = Math.sqrt(tempK / 300) * 2.2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      parts.push({
        x: 40 + Math.random() * 180,
        y: 40 + Math.random() * 140,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
    particlesRef.current = parts;
  };

  useEffect(() => {
    resetParticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [molesN]);

  // Canvas visual: Gas Cylinder with movable piston
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const padLeft = 40;
    const cylTop = 40;
    const cylH = h - 80;
    const maxCylW = w - 100;
    // Volume controls piston X position
    const pistonX = padLeft + (volumeL / 50) * maxCylW;

    // Cylinder chamber walls
    ctx.strokeStyle = "rgba(100, 130, 180, 0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pistonX + 30, cylTop);
    ctx.lineTo(padLeft, cylTop);
    ctx.lineTo(padLeft, cylTop + cylH);
    ctx.lineTo(pistonX + 30, cylTop + cylH);
    ctx.stroke();

    // Gas background thermal glow
    const tGlow = Math.min(0.35, Math.max(0.04, (tempK - 100) / 700));
    ctx.fillStyle = `rgba(244, 63, 94, ${tGlow})`;
    ctx.fillRect(padLeft + 2, cylTop + 2, pistonX - padLeft - 2, cylH - 4);

    // Movable piston head & rod
    ctx.fillStyle = "#475569";
    ctx.fillRect(pistonX - 8, cylTop, 16, cylH);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(pistonX + 8, cylTop + cylH / 2 - 8, w - pistonX - 10, 16);

    // Animate gas molecules
    const parts = particlesRef.current;
    const speedScale = Math.sqrt(tempK / 300);

    if (running) {
      for (const p of parts) {
        p.x += p.vx * speedScale * 0.7;
        p.y += p.vy * speedScale * 0.7;

        // Collision with left wall
        if (p.x < padLeft + 6) {
          p.x = padLeft + 6;
          p.vx *= -1;
        }
        // Collision with piston head
        if (p.x > pistonX - 14) {
          p.x = pistonX - 14;
          p.vx *= -1;
        }
        // Collision with top wall
        if (p.y < cylTop + 6) {
          p.y = cylTop + 6;
          p.vy *= -1;
        }
        // Collision with bottom wall
        if (p.y > cylTop + cylH - 6) {
          p.y = cylTop + cylH - 6;
          p.vy *= -1;
        }
      }
    }

    // Draw molecules
    for (const p of parts) {
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Overlay readout
    ctx.fillStyle = "rgba(220, 230, 250, 0.9)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(`Piston Volume = ${volumeL.toFixed(1)} L`, padLeft + 10, cylTop - 12);
    ctx.fillText(
      `Pressure = ${pressureAtm} atm (${pressureKPa} kPa)`,
      padLeft + 10,
      cylTop + cylH + 24,
    );
  });

  // Isotherm curve (P vs V at constant T)
  const pVsVIsotherm = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let v = 10; v <= 50; v += 1) {
      const p = (molesN * R_atm * tempK) / v;
      pts.push({ x: v, y: +p.toFixed(2) });
    }
    return pts;
  }, [molesN, tempK]);

  // Isobar curve (V vs T at constant P)
  const vVsTIsobar = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let t = 100; t <= 600; t += 20) {
      const v = (molesN * R_atm * t) / Math.max(0.1, pressureAtm);
      pts.push({ x: t, y: +v.toFixed(2) });
    }
    return pts;
  }, [molesN, pressureAtm]);

  const context = useMemo(
    () => ({
      simulationId: "gas-laws",
      simulationName: "Ideal Gas Laws & Kinetic Theory",
      parameters: {
        pressure_atm: pressureAtm,
        volume_L: volumeL,
        temperature_K: tempK,
        moles_n: molesN,
      },
      measurements: {
        pressure_kPa: pressureKPa,
        pressure_atm: pressureAtm,
        vRms_ms: Math.round(vRms),
        kineticEnergyPerMole_J: Math.round(1.5 * 8.314 * tempK),
      },
      notes: [
        `Ideal gas state: PV = ${(pressureAtm * volumeL).toFixed(2)} atm·L (nRT = ${(molesN * R_atm * tempK).toFixed(2)} atm·L).`,
        `Root-mean-square molecular speed v_rms = ${Math.round(vRms)} m/s.`,
      ],
      series: {
        "P vs V Isotherm": pVsVIsotherm,
      },
    }),
    [pressureAtm, volumeL, tempK, molesN, pressureKPa, vRms, pVsVIsotherm],
  );

  return (
    <LabLayout
      simulationId="gas-laws"
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
        </>
      }
      controls={
        <Panel title="Gas Chamber Controls">
          <div className="space-y-4">
            <Param
              label="Chamber Volume V (Piston Position)"
              value={volumeL}
              min={10}
              max={50}
              step={0.5}
              unit="L"
              onChange={setVolumeL}
              hint="Compress or expand the piston (Boyle's law: P ∝ 1/V)."
            />

            <Param
              label="Thermodynamic Temperature T"
              value={tempK}
              min={100}
              max={600}
              step={5}
              unit="K"
              onChange={setTempK}
              hint="Controls mean molecular kinetic energy <Ek> = 3/2 kT."
            />

            <Param
              label="Gas Quantity n"
              value={molesN}
              min={0.5}
              max={3.0}
              step={0.1}
              unit="mol"
              onChange={setMolesN}
              hint="Number of gas particles colliding with piston walls."
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Thermodynamic Readouts">
          <Readout label="Chamber Pressure P" value={pressureAtm} unit="atm" tone="cyan" />
          <Readout label="Pressure (SI)" value={pressureKPa} unit="kPa" tone="amber" />
          <Readout
            label="RMS Molecular Speed v_rms"
            value={Math.round(vRms)}
            unit="m/s"
            tone="violet"
          />
          <Readout
            label="Molar Kinetic Energy"
            value={Math.round(1.5 * 8.314 * tempK)}
            unit="J/mol"
          />
          <Readout
            label="PV / nRT Ratio"
            value={((pressureAtm * volumeL) / (molesN * R_atm * tempK)).toFixed(3)}
          />
        </Panel>
      }
      equations={[
        {
          name: "Ideal gas law",
          latex: "PV = nRT",
          symbols: [
            { symbol: "P", meaning: "pressure", unit: "Pa / atm" },
            { symbol: "V", meaning: "volume", unit: "m³ / L" },
            { symbol: "n", meaning: "amount of substance", unit: "mol" },
            { symbol: "R", meaning: "universal gas constant" },
            { symbol: "T", meaning: "absolute temperature", unit: "K" },
          ],
          kind: "exact",
        },
        {
          name: "Root-mean-square speed",
          latex: "v_{\\text{rms}} = \\sqrt{\\frac{3RT}{M_{\\text{molar}}}}",
          symbols: [{ symbol: "M_{\\text{molar}}", meaning: "molar mass", unit: "kg/mol" }],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Point-like particles with zero intermolecular potential (negligible van der Waals a and b)",
        "Perfect elastic collisions with container walls and piston",
      ]}
      physicsNotes={[
        "Boyle's Law: At constant temperature, pressure is inversely proportional to volume.",
        "Charles's Law: At constant pressure, volume scales linearly with thermodynamic temperature.",
        "Pressure represents the cumulative rate of momentum transferred by particle collisions against unit area of wall per second.",
      ]}
    >
      <Panel title="Piston Chamber (Drag Volume slider to compress/expand)">
        <canvas
          ref={canvasRef}
          className="h-[280px] w-full"
          aria-label="Interactive gas piston container"
        />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="P–V Isotherm (Boyle's Law at constant T)">
          <SciChart
            xLabel="Volume (L)"
            yLabel="Pressure (atm)"
            height={220}
            series={[
              {
                key: "isotherm",
                name: `Isotherm ${tempK} K`,
                data: pVsVIsotherm,
                color: "#38bdf8",
              },
              {
                key: "cur",
                name: "Current State",
                data: [{ x: volumeL, y: pressureAtm }],
                dots: true,
                color: "#f59e0b",
              },
            ]}
          />
        </Panel>

        <Panel title="V–T Isobar (Charles's Law at constant P)">
          <SciChart
            xLabel="Temperature (K)"
            yLabel="Volume (L)"
            height={220}
            series={[
              {
                key: "isobar",
                name: `Isobar ${pressureAtm} atm`,
                data: vVsTIsobar,
                color: "#10b981",
              },
              {
                key: "curV",
                name: "Current State",
                data: [{ x: tempK, y: volumeL }],
                dots: true,
                color: "#a855f7",
              },
            ]}
          />
        </Panel>
      </div>
    </LabLayout>
  );
}
