import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Param, Readout } from "@/components/lab/Panels";
import { SciChart } from "@/components/lab/SciChart";
import { useCanvas } from "@/components/lab/useCanvas";
import { c, fmt } from "@/lib/physics/constants";
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

export const Route = createFileRoute("/lab/spectroscopy")({
  head: () => labHead("spectroscopy"),
  component: SpectroscopyLab,
});

type CelestialObject =
  "sun-like" | "hot-star" | "cool-star" | "hydrogen-cloud" | "nebula" | "exoplanet-atmosphere";

interface SpectralLine {
  id: string;
  name: string;
  element: string;
  restWavelengthNm: number;
  type: "absorption" | "emission";
  baseDepth: number; // 0 to 1
  width: number;
}

const LINE_LIBRARY: SpectralLine[] = [
  {
    id: "ca_k",
    name: "Ca II K",
    element: "Calcium",
    restWavelengthNm: 393.4,
    type: "absorption",
    baseDepth: 0.85,
    width: 2.2,
  },
  {
    id: "ca_h",
    name: "Ca II H",
    element: "Calcium",
    restWavelengthNm: 396.8,
    type: "absorption",
    baseDepth: 0.8,
    width: 2.0,
  },
  {
    id: "h_delta",
    name: "Hδ (Balmer)",
    element: "Hydrogen",
    restWavelengthNm: 410.2,
    type: "absorption",
    baseDepth: 0.6,
    width: 1.6,
  },
  {
    id: "h_gamma",
    name: "Hγ (Balmer)",
    element: "Hydrogen",
    restWavelengthNm: 434.0,
    type: "absorption",
    baseDepth: 0.7,
    width: 1.8,
  },
  {
    id: "h_beta",
    name: "Hβ (Balmer)",
    element: "Hydrogen",
    restWavelengthNm: 486.1,
    type: "absorption",
    baseDepth: 0.8,
    width: 2.0,
  },
  {
    id: "o3_1",
    name: "[O III] 495.9",
    element: "Oxygen",
    restWavelengthNm: 495.9,
    type: "emission",
    baseDepth: 0.75,
    width: 1.4,
  },
  {
    id: "o3_2",
    name: "[O III] 500.7",
    element: "Oxygen",
    restWavelengthNm: 500.7,
    type: "emission",
    baseDepth: 0.9,
    width: 1.5,
  },
  {
    id: "mg_b",
    name: "Mg I b",
    element: "Magnesium",
    restWavelengthNm: 517.5,
    type: "absorption",
    baseDepth: 0.65,
    width: 1.6,
  },
  {
    id: "he_587",
    name: "He I 587.6",
    element: "Helium",
    restWavelengthNm: 587.6,
    type: "absorption",
    baseDepth: 0.7,
    width: 1.5,
  },
  {
    id: "na_d2",
    name: "Na I D₂",
    element: "Sodium",
    restWavelengthNm: 589.0,
    type: "absorption",
    baseDepth: 0.85,
    width: 1.5,
  },
  {
    id: "na_d1",
    name: "Na I D₁",
    element: "Sodium",
    restWavelengthNm: 589.6,
    type: "absorption",
    baseDepth: 0.8,
    width: 1.5,
  },
  {
    id: "o1_630",
    name: "[O I] 630.0",
    element: "Oxygen",
    restWavelengthNm: 630.0,
    type: "emission",
    baseDepth: 0.6,
    width: 1.4,
  },
  {
    id: "h_alpha",
    name: "Hα (Balmer)",
    element: "Hydrogen",
    restWavelengthNm: 656.3,
    type: "absorption",
    baseDepth: 0.92,
    width: 2.5,
  },
  {
    id: "he_667",
    name: "He I 667.8",
    element: "Helium",
    restWavelengthNm: 667.8,
    type: "absorption",
    baseDepth: 0.5,
    width: 1.4,
  },
  {
    id: "k1",
    name: "K I 766.5",
    element: "Potassium",
    restWavelengthNm: 766.5,
    type: "absorption",
    baseDepth: 0.55,
    width: 1.8,
  },
];

function wavelengthToRGB(nm: number): [number, number, number] {
  let r = 0,
    g = 0,
    b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380);
    b = 1.0;
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440);
    b = 1.0;
  } else if (nm >= 490 && nm < 510) {
    g = 1.0;
    b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1.0;
  } else if (nm >= 580 && nm < 645) {
    r = 1.0;
    g = -(nm - 645) / (645 - 580);
  } else if (nm >= 645 && nm <= 780) {
    r = 1.0;
  }
  let factor = 1.0;
  if (nm >= 380 && nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / (420 - 380);
  else if (nm > 700 && nm <= 780) factor = 0.3 + (0.7 * (780 - nm)) / (780 - 700);
  return [Math.round(r * factor * 255), Math.round(g * factor * 255), Math.round(b * factor * 255)];
}

export function SpectroscopyLab() {
  const [diff, setDiff] = useState<Difficulty>("Intermediate");
  const [target, setTarget] = useState<CelestialObject>("sun-like");
  const [temp, setTemp] = useState(5778); // K
  const [vRadKms, setVRadKms] = useState(0); // km/s (-500 to +500)
  const [pressure, setPressure] = useState(1.0); // dex pressure broadening

  // Preset parameters on object selection
  const handleObjectChange = (val: CelestialObject) => {
    setTarget(val);
    if (val === "sun-like") {
      setTemp(5778);
      setPressure(1.0);
      setVRadKms(12);
    } else if (val === "hot-star") {
      setTemp(18000);
      setPressure(0.8);
      setVRadKms(-45);
    } else if (val === "cool-star") {
      setTemp(3200);
      setPressure(1.5);
      setVRadKms(85);
    } else if (val === "hydrogen-cloud") {
      setTemp(6000);
      setPressure(0.2);
      setVRadKms(0);
    } else if (val === "nebula") {
      setTemp(10000);
      setPressure(0.1);
      setVRadKms(-110);
    } else if (val === "exoplanet-atmosphere") {
      setTemp(1400);
      setPressure(0.9);
      setVRadKms(30);
    }
  };

  // Doppler factor: lambda_obs = lambda_rest * (1 + v_r / c)
  const dopplerFactor = 1 + (vRadKms * 1000) / c;

  // Active lines based on object selection and temperature
  const activeLines = useMemo(() => {
    return LINE_LIBRARY.map((line) => {
      let active = true;
      let depthMult = 1.0;
      let isEmission = line.type === "emission";

      if (target === "sun-like") {
        if (line.id.startsWith("o3")) active = false;
        if (line.element === "Helium") depthMult = 0.2;
        if (line.element === "Calcium" || line.element === "Sodium") depthMult = 1.2;
      } else if (target === "hot-star") {
        if (line.element === "Helium" || line.element === "Hydrogen") depthMult = 1.5;
        if (line.element === "Calcium" || line.element === "Sodium") depthMult = 0.15;
        if (line.id.startsWith("o3")) active = false;
      } else if (target === "cool-star") {
        if (line.element === "Calcium" || line.element === "Sodium" || line.id === "k1")
          depthMult = 1.4;
        if (line.element === "Helium") active = false;
        if (line.id.startsWith("o3")) active = false;
        if (line.element === "Hydrogen") depthMult = 0.3;
      } else if (target === "hydrogen-cloud") {
        if (line.element !== "Hydrogen") active = false;
      } else if (target === "nebula") {
        isEmission = true;
        if (line.element === "Calcium" || line.element === "Sodium" || line.id === "k1")
          active = false;
      } else if (target === "exoplanet-atmosphere") {
        if (line.element === "Sodium" || line.id === "k1") depthMult = 1.5;
        else active = false;
      }

      const obsWavelength = line.restWavelengthNm * dopplerFactor;
      const broadenedWidth = line.width * pressure;

      return {
        ...line,
        active,
        isEmission,
        depth: line.baseDepth * depthMult,
        obsWavelength,
        broadenedWidth,
      };
    }).filter((l) => l.active);
  }, [target, dopplerFactor, pressure]);

  // Generate continuum + line spectrum graph
  const spectrumGraphData = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const minW = 380;
    const maxW = 760;
    const step = 0.8;

    // Planck continuum function (normalized)
    const planck = (wNm: number) => {
      const lamM = wNm * 1e-9;
      // Wien peak approx for relative normalization
      const peakM = 2.898e-3 / temp;
      const x = peakM / lamM;
      return Math.max(0.05, Math.pow(x, 5) / (Math.exp(Math.min(25, 4.965 * x)) - 1));
    };

    // Find peak continuum for normalization
    let maxCont = 0.0001;
    for (let w = minW; w <= maxW; w += 10) {
      const val = planck(w);
      if (val > maxCont) maxCont = val;
    }

    for (let w = minW; w <= maxW; w += step) {
      let flux = target === "nebula" || target === "hydrogen-cloud" ? 0.04 : planck(w) / maxCont;

      for (const line of activeLines) {
        const dw = w - line.obsWavelength;
        // Gaussian line profile
        const prof = Math.exp(-(dw * dw) / (2 * line.broadenedWidth * line.broadenedWidth));
        if (line.isEmission) {
          flux += line.depth * prof * 0.9;
        } else {
          flux *= Math.max(0.04, 1 - line.depth * prof);
        }
      }

      pts.push({ x: +w.toFixed(1), y: +flux.toFixed(3) });
    }
    return pts;
  }, [temp, target, activeLines]);

  // Canvas visualizer for photographic spectrum strip
  const canvasRef = useCanvas((ctx, w, h) => {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, w, h);

    const minW = 380;
    const maxW = 760;
    const padX = 20;
    const stripWidth = w - padX * 2;
    const stripY = 35;
    const stripH = 90;

    // Draw reference rest spectrum strip on top
    for (let x = 0; x < stripWidth; x++) {
      const lam = minW + (x / stripWidth) * (maxW - minW);
      const [r, g, b] = wavelengthToRGB(lam);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(padX + x, stripY, 1.2, stripH);
    }

    // Overlay absorption or emission lines
    for (const line of activeLines) {
      const lineX = padX + ((line.obsWavelength - minW) / (maxW - minW)) * stripWidth;
      const restX = padX + ((line.restWavelengthNm - minW) / (maxW - minW)) * stripWidth;

      if (lineX >= padX && lineX <= padX + stripWidth) {
        const lw = Math.max(2, line.broadenedWidth * 3);
        if (line.isEmission) {
          const [r, g, b] = wavelengthToRGB(line.obsWavelength);
          ctx.fillStyle = `rgba(${r + 40},${g + 40},${b + 40}, 0.95)`;
          ctx.fillRect(lineX - lw / 2, stripY - 4, lw, stripH + 8);
        } else {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.96, line.depth + 0.15)})`;
          ctx.fillRect(lineX - lw / 2, stripY, lw, stripH);
        }

        // Rest position indicator tick below strip
        ctx.strokeStyle = "rgba(180, 200, 240, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(restX, stripY + stripH + 4);
        ctx.lineTo(restX, stripY + stripH + 12);
        ctx.stroke();

        // Line connecting rest tick to observed position
        if (Math.abs(lineX - restX) > 1.5) {
          ctx.strokeStyle = vRadKms > 0 ? "rgba(239, 68, 68, 0.65)" : "rgba(59, 130, 246, 0.65)";
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(restX, stripY + stripH + 12);
          ctx.lineTo(lineX, stripY + stripH + 20);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label line name
        ctx.fillStyle = "rgba(220, 230, 250, 0.85)";
        ctx.font = "9px JetBrains Mono";
        ctx.fillText(line.name, lineX - 14, stripY + stripH + 32);
      }
    }

    // Calibration markers
    ctx.fillStyle = "rgba(160, 180, 210, 0.6)";
    ctx.font = "10px JetBrains Mono";
    ctx.fillText("380 nm (UV)", padX, 22);
    ctx.fillText("550 nm (Visual)", w / 2 - 40, 22);
    ctx.fillText("760 nm (Near IR)", w - padX - 85, 22);
  });

  const hAlphaLine = activeLines.find((l) => l.id === "h_alpha");
  const deltaLambdaHAlpha = hAlphaLine ? +(hAlphaLine.obsWavelength - 656.3).toFixed(3) : 0;

  const context = useMemo(
    () => ({
      simulationId: "spectroscopy",
      simulationName: "Spectroscopy Laboratory",
      parameters: {
        target: target,
        temperature_K: temp,
        radialVelocity_kms: vRadKms,
        pressure_broadening: pressure,
      },
      measurements: {
        dopplerShift_kms: vRadKms,
        doppler_fraction_v_c: +(vRadKms / (c / 1000)).toExponential(3),
        hAlpha_obs_nm: hAlphaLine ? +hAlphaLine.obsWavelength.toFixed(3) : 656.3,
        deltaLambda_nm: deltaLambdaHAlpha,
        activeLinesCount: activeLines.length,
      },
      notes: [
        `Doppler shift Δλ/λ = ${(vRadKms / (c / 1000)).toExponential(2)}.`,
        vRadKms > 0
          ? "Lines shifted red (receding source)."
          : vRadKms < 0
            ? "Lines shifted blue (approaching source)."
            : "Zero radial velocity.",
      ],
      series: {
        spectrum: spectrumGraphData,
      },
    }),
    [
      target,
      temp,
      vRadKms,
      pressure,
      hAlphaLine,
      deltaLambdaHAlpha,
      activeLines.length,
      spectrumGraphData,
    ],
  );

  return (
    <LabLayout
      simulationId="spectroscopy"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      controls={
        <Panel title="Spectral Source & Environment">
          <div className="space-y-4">
            <div>
              <Label className="label-mono mb-1.5 block">Astronomical Object</Label>
              <Select
                value={target}
                onValueChange={(v) => handleObjectChange(v as CelestialObject)}
              >
                <SelectTrigger className="w-full font-mono text-xs">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sun-like">Sun-like Star (G2V)</SelectItem>
                  <SelectItem value="hot-star">Hot Star (O/B Type)</SelectItem>
                  <SelectItem value="cool-star">Cool Star (M Dwarf)</SelectItem>
                  <SelectItem value="hydrogen-cloud">Interstellar Hydrogen Cloud</SelectItem>
                  <SelectItem value="nebula">Emission Nebula ([O III] & Hα)</SelectItem>
                  <SelectItem value="exoplanet-atmosphere">
                    Exoplanet Atmosphere (Sodium D)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Param
              label="Effective Temperature"
              value={temp}
              min={1000}
              max={30000}
              step={100}
              unit="K"
              onChange={setTemp}
              hint="Controls continuum shape via Planck function."
            />

            <Param
              label="Radial Velocity (Doppler)"
              value={vRadKms}
              min={-500}
              max={500}
              step={5}
              unit="km/s"
              onChange={setVRadKms}
              hint="Negative = Blueshift, Positive = Redshift."
            />

            <Param
              label="Atmospheric Pressure Broadening"
              value={pressure}
              min={0.2}
              max={3.0}
              step={0.1}
              unit="×"
              onChange={setPressure}
              hint="High pressure collisions broaden spectral absorption wings."
            />
          </div>
        </Panel>
      }
      side={
        <Panel title="Spectral Measurements">
          <Readout label="Target Type" value={target} tone="cyan" />
          <Readout
            label="Radial Velocity v_r"
            value={`${vRadKms > 0 ? "+" : ""}${vRadKms}`}
            unit="km/s"
            tone={vRadKms > 0 ? "rose" : vRadKms < 0 ? "cyan" : "amber"}
          />
          <Readout label="Doppler Factor 1+v/c" value={dopplerFactor.toFixed(5)} />
          <Readout label="Hα Rest Wavelength" value="656.300" unit="nm" />
          <Readout
            label="Hα Observed Wavelength"
            value={hAlphaLine ? hAlphaLine.obsWavelength.toFixed(3) : "—"}
            unit="nm"
            tone="violet"
          />
          <Readout
            label="Hα Shift Δλ"
            value={deltaLambdaHAlpha > 0 ? `+${deltaLambdaHAlpha}` : `${deltaLambdaHAlpha}`}
            unit="nm"
          />
          <Readout label="Visible Spectral Lines" value={activeLines.length} />
        </Panel>
      }
      equations={[
        {
          name: "Doppler shift (v ≪ c)",
          latex: "\\frac{\\Delta \\lambda}{\\lambda_0} = \\frac{v_r}{c}",
          symbols: [
            { symbol: "\\Delta\\lambda", meaning: "wavelength shift", unit: "m" },
            { symbol: "\\lambda_0", meaning: "rest wavelength", unit: "m" },
            { symbol: "v_r", meaning: "radial velocity", unit: "m/s" },
          ],
          kind: "approximation",
        },
        {
          name: "Wien's displacement law",
          latex: "\\lambda_{\\text{max}} T = 2.898 \\times 10^{-3}\\,\\text{m}\\cdot\\text{K}",
          symbols: [
            { symbol: "\\lambda_{\\text{max}}", meaning: "peak continuum wavelength", unit: "m" },
            { symbol: "T", meaning: "surface temperature", unit: "K" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Non-relativistic Doppler approximation for speeds v ≪ c",
        "Planck blackbody background continuum with Voigt/Gaussian line profiles",
        "LTE (Local Thermodynamic Equilibrium) line formation model",
      ]}
      physicsNotes={[
        "Absorption lines arise when cooler atmospheric gases absorb specific photons from the hotter continuum below.",
        "Emission lines occur when rarefied gas atoms de-excite directly into our line of sight.",
        "Every single spectral line shifts by the exact same proportional fraction Δλ / λ_0.",
      ]}
    >
      <Panel title="Photographic Spectrum & Line Shift Indicator">
        <canvas
          ref={canvasRef}
          className="h-[220px] w-full"
          aria-label="Optical spectrum visualizer"
        />
      </Panel>

      <Panel title="Normalized Flux vs Wavelength λ (nm)">
        <SciChart
          xLabel="Wavelength (nm)"
          yLabel="Normalized Flux"
          height={260}
          series={[
            {
              key: "spec",
              name: "Observed Flux",
              data: spectrumGraphData,
              color: "#38bdf8",
            },
          ]}
        />
      </Panel>
    </LabLayout>
  );
}
