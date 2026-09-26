import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas } from "@/components/lab/useCanvas";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus } from "lucide-react";

export const Route = createFileRoute("/lab/titration")({
  head: () => labHead("titration"),
  component: TitrationLab,
});

type AcidType = "strong-acid" | "weak-acid";
type BaseType = "strong-base" | "weak-base";
type Indicator = "phenolphthalein" | "methyl-orange" | "bromothymol-blue";

export function TitrationLab() {
  const [diff, setDiff] = useState<Difficulty>("Beginner");
  const [acidType, setAcidType] = useState<AcidType>("strong-acid");
  const [baseType, setBaseType] = useState<BaseType>("strong-base");
  const [indicator, setIndicator] = useState<Indicator>("phenolphthalein");

  const [volAcidMl, setVolAcidMl] = useState(25.0); // mL in analyte flask
  const [concAcid, setConcAcid] = useState(0.1); // M
  const [concBase, setConcBase] = useState(0.1); // M (titrant in burette)
  const [volBaseAddedMl, setVolBaseAddedMl] = useState(0.0); // mL added

  // Equivalence volume: V_eq = (C_acid * V_acid) / C_base
  const vEquivMl = +((concAcid * volAcidMl) / concBase).toFixed(2);

  // Weak acid pKa
  const pKa = 4.76; // Acetic acid
  const Ka = 10 ** -pKa;
  // Weak base pKb
  const pKb = 4.75; // Ammonia
  const Kb = 10 ** -pKb;

  // Calculate pH at any added volume of base
  const calculatePH = (vAdded: number) => {
    const totalVol = (volAcidMl + vAdded) / 1000; // Liters
    const molesAcidInitial = concAcid * (volAcidMl / 1000);
    const molesBaseAdded = concBase * (vAdded / 1000);

    if (acidType === "strong-acid" && baseType === "strong-base") {
      if (vAdded < vEquivMl) {
        // Excess H+
        const molesH = molesAcidInitial - molesBaseAdded;
        const concH = molesH / totalVol;
        return Math.max(0.5, Math.min(6.9, -Math.log10(concH)));
      } else if (Math.abs(vAdded - vEquivMl) < 0.01) {
        return 7.0; // Equivalence point
      } else {
        // Excess OH-
        const molesOH = molesBaseAdded - molesAcidInitial;
        const concOH = molesOH / totalVol;
        const pOH = -Math.log10(concOH);
        return Math.max(7.1, Math.min(13.8, 14 - pOH));
      }
    } else if (acidType === "weak-acid" && baseType === "strong-base") {
      if (vAdded === 0) {
        // Pure weak acid: [H+] = sqrt(Ka * C)
        const concH = Math.sqrt(Ka * concAcid);
        return -Math.log10(concH);
      } else if (vAdded < vEquivMl) {
        // Buffer region: Henderson-Hasselbalch
        const molesAminus = molesBaseAdded;
        const molesHA = molesAcidInitial - molesBaseAdded;
        return pKa + Math.log10(molesAminus / Math.max(1e-7, molesHA));
      } else if (Math.abs(vAdded - vEquivMl) < 0.01) {
        // Equivalence point: basic salt hydrolysis
        const concSalt = molesAcidInitial / totalVol;
        const concOH = Math.sqrt((1e-14 / Ka) * concSalt);
        return 14 + Math.log10(concOH);
      } else {
        // Excess strong base dominates
        const molesOH = molesBaseAdded - molesAcidInitial;
        const concOH = molesOH / totalVol;
        return 14 - -Math.log10(concOH);
      }
    } else {
      // Strong acid + weak base
      if (vAdded < vEquivMl) {
        const molesH = molesAcidInitial - molesBaseAdded;
        return -Math.log10(molesH / totalVol);
      } else if (Math.abs(vAdded - vEquivMl) < 0.01) {
        const concSalt = molesAcidInitial / totalVol;
        const concH = Math.sqrt((1e-14 / Kb) * concSalt);
        return -Math.log10(concH);
      } else {
        const molesB = molesBaseAdded - molesAcidInitial;
        const molesBH = molesAcidInitial;
        const pOH = pKb + Math.log10(molesBH / Math.max(1e-7, molesB));
        return 14 - pOH;
      }
    }
  };

  const currentPH = +calculatePH(volBaseAddedMl).toFixed(2);

  // Indicator color
  const indicatorColor = useMemo(() => {
    if (indicator === "phenolphthalein") {
      if (currentPH < 8.2) return "rgba(255, 255, 255, 0.08)"; // Colorless
      if (currentPH > 10.0) return "rgba(244, 63, 94, 0.85)"; // Vivid Magenta/Pink
      const frac = (currentPH - 8.2) / 1.8;
      return `rgba(244, 63, 94, ${0.15 + frac * 0.7})`;
    } else if (indicator === "methyl-orange") {
      if (currentPH < 3.1) return "rgba(239, 68, 68, 0.85)"; // Red
      if (currentPH > 4.4) return "rgba(234, 179, 8, 0.85)"; // Yellow
      return "rgba(249, 115, 22, 0.85)"; // Orange transition
    } else {
      // Bromothymol blue
      if (currentPH < 6.0) return "rgba(234, 179, 8, 0.85)"; // Yellow
      if (currentPH > 7.6) return "rgba(59, 130, 246, 0.85)"; // Blue
      return "rgba(34, 197, 94, 0.85)"; // Green transition
    }
  }, [indicator, currentPH]);

  // Complete titration curve
  const titrationCurve = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const maxV = Math.max(50, vEquivMl * 2);
    for (let v = 0; v <= maxV; v += 0.5) {
      pts.push({ x: v, y: +calculatePH(v).toFixed(2) });
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acidType, baseType, volAcidMl, concAcid, concBase, vEquivMl]);

  // Canvas visual: Burette with dripping liquid + Erlenmeyer Flask showing solution color
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;

    // Burette stand
    ctx.fillStyle = "#334155";
    ctx.fillRect(cx - 80, 15, 6, h - 30);
    ctx.fillRect(cx - 100, h - 20, 100, 8);
    // Clamp
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cx - 80, 70, 76, 6);

    // Burette glass tube
    const bW = 20;
    const bH = 140;
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(cx - bW / 2, 20, bW, bH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - bW / 2, 20, bW, bH);

    // Burette liquid level (starts full 50mL, goes down)
    const liquidFrac = Math.max(0, 1 - volBaseAddedMl / 50);
    const liquidH = bH * liquidFrac;
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.fillRect(cx - bW / 2 + 1, 20 + (bH - liquidH), bW - 2, liquidH);

    // Stopcock & Tip
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cx - 4, 160, 8, 8);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(cx - 10, 162, 20, 4);

    // Droplet if dripping
    if (volBaseAddedMl > 0) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
      ctx.beginPath();
      ctx.arc(cx, 174, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Erlenmeyer Flask
    const fTopY = 185;
    const fBotY = h - 25;
    const fNeckW = 24;
    const fBaseW = 90;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - fNeckW / 2, fTopY);
    ctx.lineTo(cx - fNeckW / 2, fTopY + 20);
    ctx.lineTo(cx - fBaseW / 2, fBotY);
    ctx.lineTo(cx + fBaseW / 2, fBotY);
    ctx.lineTo(cx + fNeckW / 2, fTopY + 20);
    ctx.lineTo(cx + fNeckW / 2, fTopY);
    ctx.closePath();

    // Flask glass border
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Liquid in flask
    ctx.clip();
    const currentVolTotal = volAcidMl + volBaseAddedMl;
    const flaskLiquidH = Math.min(fBotY - fTopY - 10, 25 + currentVolTotal * 0.9);
    ctx.fillStyle = indicatorColor;
    ctx.fillRect(cx - fBaseW / 2 - 10, fBotY - flaskLiquidH, fBaseW + 20, flaskLiquidH);

    ctx.restore();

    // Info overlay
    ctx.fillStyle = "rgba(220, 230, 250, 0.9)";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(`Titrant Added: ${volBaseAddedMl.toFixed(1)} mL`, 16, 26);
    ctx.fillText(`Equivalence: ${vEquivMl.toFixed(1)} mL`, 16, 42);
    ctx.fillText(`Current pH: ${currentPH.toFixed(2)}`, 16, 58);
  });

  const context = useMemo(
    () => ({
      simulationId: "titration",
      simulationName: "Acid-Base Titration",
      parameters: {
        acidType: acidType,
        baseType: baseType,
        indicator: indicator,
        acidConcentration_M: concAcid,
        acidVolume_mL: volAcidMl,
        baseConcentration_M: concBase,
        volumeBaseAdded_mL: volBaseAddedMl,
      },
      measurements: {
        currentPH: currentPH,
        equivalenceVolume_mL: vEquivMl,
        volumeAdded_mL: volBaseAddedMl,
        bufferRegionActive:
          acidType === "weak-acid" && volBaseAddedMl > 1 && volBaseAddedMl < vEquivMl ? 1 : 0,
      },
      notes: [
        `Equivalence reached at ${vEquivMl} mL of titrant base.`,
        acidType === "weak-acid"
          ? `Half-equivalence at ${(vEquivMl / 2).toFixed(1)} mL (pH = pKa = ${pKa}).`
          : "Strong acid-strong base equivalence is at neutral pH 7.0.",
      ],
      series: {
        titrationCurve: titrationCurve,
      },
    }),
    [
      acidType,
      baseType,
      indicator,
      concAcid,
      volAcidMl,
      concBase,
      volBaseAddedMl,
      currentPH,
      vEquivMl,
      titrationCurve,
    ],
  );

  return (
    <LabLayout
      simulationId="titration"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button
            size="sm"
            variant="lab"
            onClick={() => setVolBaseAddedMl((v) => Math.min(60, +(v + 0.5).toFixed(1)))}
          >
            <Plus className="size-3" /> Add 0.5 mL
          </Button>
          <Button
            size="sm"
            variant="lab"
            onClick={() => setVolBaseAddedMl((v) => Math.min(60, +(v + 2.0).toFixed(1)))}
          >
            <Plus className="size-3" /> Add 2.0 mL
          </Button>
          <Button size="sm" variant="lab" onClick={() => setVolBaseAddedMl(0)}>
            <RotateCcw className="size-3" /> Reset Burette
          </Button>
        </>
      }
      controls={
        <Panel title="Titration Setup">
          <div className="space-y-4">
            <div>
              <Label className="label-mono mb-1.5 block">Analyte Acid</Label>
              <Select value={acidType} onValueChange={(v) => setAcidType(v as AcidType)}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong-acid">Strong Acid (HCl, 0.1 M)</SelectItem>
                  <SelectItem value="weak-acid">Weak Acid (CH₃COOH, pKa 4.76)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="label-mono mb-1.5 block">Titrant Base</Label>
              <Select value={baseType} onValueChange={(v) => setBaseType(v as BaseType)}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong-base">Strong Base (NaOH, 0.1 M)</SelectItem>
                  <SelectItem value="weak-base">Weak Base (NH₃, 0.1 M)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="label-mono mb-1.5 block">pH Indicator</Label>
              <Select value={indicator} onValueChange={(v) => setIndicator(v as Indicator)}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phenolphthalein">Phenolphthalein (8.2 - 10.0)</SelectItem>
                  <SelectItem value="methyl-orange">Methyl Orange (3.1 - 4.4)</SelectItem>
                  <SelectItem value="bromothymol-blue">Bromothymol Blue (6.0 - 7.6)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Param
              label="Volume Added from Burette"
              value={volBaseAddedMl}
              min={0}
              max={50}
              step={0.2}
              unit="mL"
              onChange={setVolBaseAddedMl}
              hint="Dispense titrant into analyte flask."
            />

            <Param
              label="Analyte Initial Volume"
              value={volAcidMl}
              min={10}
              max={50}
              step={5}
              unit="mL"
              onChange={setVolAcidMl}
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Titration Readouts">
          <Readout label="Measured pH" value={currentPH} tone={currentPH > 7 ? "violet" : "rose"} />
          <Readout label="Equivalence Point V_eq" value={vEquivMl} unit="mL" tone="cyan" />
          <Readout label="Titrant Added" value={volBaseAddedMl} unit="mL" />
          <Readout
            label="Indicator State"
            value={
              currentPH >= 8.2 && indicator === "phenolphthalein"
                ? "End Point Reached"
                : "Sub-equivalence"
            }
            tone="amber"
          />
          <Readout
            label="Half-Equivalence pH (pKa)"
            value={acidType === "weak-acid" ? pKa : "N/A"}
          />
        </Panel>
      }
      equations={[
        {
          name: "pH definition",
          latex: "\\text{pH} = -\\log_{10}[\\text{H}^+]",
          symbols: [
            {
              symbol: "[\\text{H}^+]",
              meaning: "hydronium ion activity / concentration",
              unit: "mol/L",
            },
          ],
          kind: "exact",
        },
        {
          name: "Henderson–Hasselbalch equation",
          latex: "\\text{pH} = pK_a + \\log_{10}\\left(\\frac{[\\text{A}^-]}{[\\text{HA}]}\\right)",
          symbols: [
            { symbol: "pK_a", meaning: "acid dissociation constant exponent" },
            { symbol: "[\\text{A}^-]", meaning: "conjugate base concentration" },
            { symbol: "[\\text{HA}]", meaning: "undissociated weak acid concentration" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Activity coefficients approximately equal to unity at 0.1 M ionic strength",
        "Water autoionisation Kw = 1.0 × 10^-14 at 25 °C",
        "Neglect dilution effects on indicator equilibrium",
      ]}
      physicsNotes={[
        "The equivalence point is the stoichiometric point where moles of base equal moles of acid.",
        "Weak acid titrations show a buffered plateau around pH = pKa where adding base barely shifts pH.",
        "Strong acid + strong base yields a neutral equivalence point at pH = 7.00.",
      ]}
    >
      <Panel title="Virtual Burette & Erlenmeyer Titration Flask">
        <canvas
          ref={canvasRef}
          className="h-[280px] w-full"
          aria-label="Burette and titration flask animation"
        />
      </Panel>

      <Panel title="Titration Curve: pH vs Volume of Base Added (mL)">
        <SciChart
          xLabel="Volume of Titrant Base Added (mL)"
          yLabel="pH"
          height={240}
          series={[
            {
              key: "curve",
              name: "Titration Curve",
              data: titrationCurve,
              color: "#38bdf8",
            },
            {
              key: "current",
              name: "Current Point",
              data: [{ x: volBaseAddedMl, y: currentPH }],
              dots: true,
              color: "#f43f5e",
            },
          ]}
        />
      </Panel>
    </LabLayout>
  );
}
