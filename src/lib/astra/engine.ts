/**
 * LOCAL SCIENCE ENGINE — deterministic, offline explanation system.
 * Reads the current simulation context and produces explanations without any AI API.
 * An optional AI model can be layered on top later (see astra.functions.ts placeholder).
 */
import type { ExplanationLevel, SimContext } from "@/lib/store/lab-store";
import { fmt } from "@/lib/physics/constants";

export interface AstraReply {
  text: string;
  source: "local-engine";
}

type Rule = { match: RegExp; answer: (ctx: SimContext | null, level: ExplanationLevel) => string };

const lvl = (level: ExplanationLevel, gcse: string, alevel: string, uni: string, adv?: string) =>
  level === "GCSE"
    ? gcse
    : level === "A-level"
      ? alevel
      : level === "University"
        ? uni
        : (adv ?? uni);

function ctxSummary(ctx: SimContext | null) {
  if (!ctx) return "No simulation is running. Open a lab and I will read its live state.";
  const p = Object.entries(ctx.parameters)
    .slice(0, 6)
    .map(([k, v]) => `${k} = ${typeof v === "number" ? fmt(v) : v}`)
    .join(", ");
  const m = Object.entries(ctx.measurements)
    .slice(0, 6)
    .map(([k, v]) => `${k} = ${typeof v === "number" ? fmt(v) : v}`)
    .join(", ");
  return `Current experiment: ${ctx.simulationName}.\nParameters: ${p}.\nMeasurements: ${m}.${ctx.notes?.length ? `\nState: ${ctx.notes.join("; ")}.` : ""}`;
}

const SIM_KNOWLEDGE: Record<
  string,
  {
    laws: string[];
    nextVariable: string;
    doubleMass: (l: ExplanationLevel) => string;
    graph: string;
  }
> = {
  "stellar-evolution": {
    laws: [
      "Hydrostatic equilibrium (pressure balances gravity)",
      "Stefan–Boltzmann law L = 4πR²σT⁴",
      "Mass–luminosity relation L ∝ M^3.5 on the main sequence",
      "Chandrasekhar limit ≈ 1.4 M☉",
    ],
    nextVariable:
      "Try changing initial mass across 8 M☉ — the remnant switches from white dwarf to neutron star. Then vary metallicity and watch the main-sequence temperature shift.",
    doubleMass: (l) =>
      lvl(
        l,
        "A heavier star burns its fuel much faster, so it lives a shorter life and ends more violently.",
        "Doubling the mass raises luminosity by roughly 2^3.5 ≈ 11×, but only doubles the fuel, so lifetime falls by ~5.7× (τ ∝ M/L ∝ M^-2.5).",
        "Core temperature rises (T_c ∝ M/R), CNO-cycle burning dominates above ~1.3 M☉ with its steep T^17 dependence, giving a convective core and a lifetime τ ≈ 10¹⁰ (M/M☉)^-2.5 yr.",
      ),
    graph:
      "The HR diagram plots luminosity against surface temperature (reversed axis). The star's track shows where it spends its time: the long main-sequence stay, the rapid climb up the giant branch, and the final drop toward the white-dwarf cooling sequence.",
  },
  "black-hole": {
    laws: [
      "Schwarzschild metric (non-rotating) / Kerr metric (rotating)",
      "r_s = 2GM/c²",
      "ISCO at 6GM/c² for a = 0, down to GM/c² for prograde maximal spin",
      "Gravitational time dilation dτ = dt√(1 − r_s/r)",
    ],
    nextVariable:
      "Increase spin toward 0.99 and watch the ISCO move inward — the disk gets hotter and the beaming stronger. Then toggle to Newtonian view to see where it fails.",
    doubleMass: (l) =>
      lvl(
        l,
        "Doubling the mass doubles the size of the event horizon.",
        "The Schwarzschild radius scales linearly: r_s = 2GM/c², so it doubles. The ISCO doubles too, and the tidal forces at the horizon actually weaken.",
        "All length scales ∝ M, timescales ∝ M (GM/c³), while the innermost-disk temperature falls as T ∝ M^-1/4 for a fixed Eddington ratio — supermassive black holes have cooler disks.",
      ),
    graph:
      "The photon trajectories show light bending: rays passing within ~2.6 r_s are captured; those slightly outside circle near the photon sphere at 1.5 r_s before escaping. That is why the shadow appears larger than the horizon.",
  },
  "gravitational-waves": {
    laws: [
      "Quadrupole formula for GW emission",
      "Peters (1964) inspiral: da/dt ∝ −M₁M₂(M₁+M₂)/a³",
      "Chirp mass ℳ = (M₁M₂)^(3/5)/(M₁+M₂)^(1/5)",
      "f_GW = 2 f_orbital",
    ],
    nextVariable:
      "Change the mass ratio at fixed chirp mass — the waveform is nearly unchanged. That shows why chirp mass is the best-measured parameter.",
    doubleMass: (l) =>
      lvl(
        l,
        "Heavier objects merge faster and make a louder, lower-pitched signal.",
        "Doubling both masses doubles the chirp mass; the strain amplitude grows as ℳ^(5/3) and the time to merger shrinks as ℳ^(-5/3).",
        "The frequency at ISCO scales as 1/M_total, so the chirp cuts off at half the frequency. The phase evolution df/dt ∝ ℳ^(5/3) f^(11/3) is what the matched filter locks onto.",
      ),
    graph:
      "Orbital frequency increases because emitting gravitational waves removes orbital energy; the binary shrinks, and by Kepler's third law a tighter orbit means a faster orbit. The strain grows as 1/a — hence the characteristic 'chirp'.",
  },
  "exoplanet-transit": {
    laws: [
      "Transit depth δ ≈ (R_p/R_*)²",
      "Kepler's third law for orbital radius",
      "Transit duration T ≈ (P/π)(R_*/a) for central transits",
    ],
    nextVariable:
      "Enable noise and lower the planet radius until you can no longer see the dip by eye — then run detection and compare to the signal-to-noise.",
    doubleMass: (l) =>
      lvl(
        l,
        "Mass barely matters here — transits measure the planet's size, not mass.",
        "Doubling the planet radius quadruples the transit depth (δ ∝ R_p²); the planet's mass has no effect on the light curve.",
        "Mass only enters via radial-velocity follow-up. Combining δ with the RV semi-amplitude K gives the bulk density.",
      ),
    graph:
      "The flat portions are the out-of-transit flux (normalised to 1). The depth of the dip gives (R_p/R_*)², and the duration constrains a/R_* and inclination.",
  },
  spectroscopy: {
    laws: [
      "Doppler shift Δλ/λ ≈ v/c (non-relativistic)",
      "Wien's law λ_max T = 2.898×10⁻³ m·K",
      "Boltzmann & Saha equations for line strengths",
      "Rydberg formula 1/λ = R(1/n₁² − 1/n₂²)",
    ],
    nextVariable:
      "Increase radial velocity to +300 km/s and note all lines move by the same fraction Δλ/λ, not the same Δλ.",
    doubleMass: (l) =>
      lvl(
        l,
        "A hotter star has a bluer peak and different dark lines.",
        "Doubling temperature moves the Planck peak to half the wavelength (Wien) and changes which ions dominate — hydrogen Balmer lines peak near 10,000 K.",
        "Line strength follows the Boltzmann population of the lower level × Saha ionisation fraction; the Balmer maximum at A0 arises because n=2 population rises with T while H I fraction falls.",
      ),
    graph:
      "Dips are absorption lines: cooler gas in the stellar atmosphere absorbs at specific wavelengths. Peaks are emission lines from hot, diffuse gas. Line positions identify elements; their shift gives radial velocity.",
  },
  "orbital-mechanics": {
    laws: [
      "Newton's law of gravitation F = GMm/r²",
      "Vis-viva equation v² = GM(2/r − 1/a)",
      "Conservation of energy and angular momentum",
      "Kepler's laws",
    ],
    nextVariable:
      "Raise the initial speed until total energy crosses zero — the orbit opens from an ellipse into a parabola, then a hyperbola.",
    doubleMass: (l) =>
      lvl(
        l,
        "A heavier central body pulls harder, so orbits are faster and tighter.",
        "Doubling the central mass doubles GM; circular speed rises by √2 and the period falls by √2 (T² ∝ a³/M).",
        "The orbiting body's own mass cancels in the equation of motion (equivalence principle) unless it is comparable to the primary, when you must use the reduced mass and barycentre.",
      ),
    graph:
      "Kinetic and potential energy trade back and forth, but their sum stays constant — a numerical check on the integrator. Negative total energy means a bound orbit; zero or positive means escape.",
  },
  "reaction-kinetics": {
    laws: [
      "Rate law: rate = k[A]^m[B]^n",
      "Arrhenius equation k = A·e^(−Ea/RT)",
      "Collision theory",
      "Integrated rate laws",
    ],
    nextVariable:
      "Record k at four temperatures and plot ln k against 1/T — the gradient gives −Ea/R.",
    doubleMass: (l) =>
      lvl(
        l,
        "More particles means more collisions, so the reaction goes faster.",
        "Doubling concentration doubles the rate for a first-order reactant and quadruples it for second order — the exponent in the rate law tells you the order.",
        "The collision frequency scales with the product of concentrations; the fraction with E ≥ Ea is the Boltzmann factor e^(−Ea/RT), which the catalyst raises by lowering Ea.",
      ),
    graph:
      "The concentration falls exponentially for first-order kinetics; the half-life is constant. A straight ln[A] vs t plot confirms first order.",
  },
  "chemical-equilibrium": {
    laws: [
      "Kc = [NH₃]²/([N₂][H₂]³)",
      "Le Chatelier's principle",
      "van 't Hoff equation d ln K/dT = ΔH/RT²",
      "ΔG° = −RT ln K",
    ],
    nextVariable:
      "Raise the pressure: with 4 mol of gas becoming 2, the equilibrium shifts right. Then raise temperature and watch it shift back (exothermic).",
    doubleMass: (l) =>
      lvl(
        l,
        "Adding more of a reactant pushes the reaction forward to use it up.",
        "Adding N₂ raises Q below K, so the forward reaction proceeds until Q = K again; K itself is unchanged.",
        "Only temperature changes K (van 't Hoff). Pressure and concentration change Q and thus the position, not the constant.",
      ),
    graph:
      "Concentrations rise and fall until the forward and reverse rates are equal — the plateau is dynamic equilibrium, not zero reaction.",
  },
  titration: {
    laws: [
      "pH = −log₁₀[H⁺]",
      "Henderson–Hasselbalch pH = pKa + log([A⁻]/[HA])",
      "Kw = 1.0×10⁻¹⁴ at 298 K",
    ],
    nextVariable:
      "Switch to a weak acid: the equivalence point moves above pH 7 and a buffer region appears at half-equivalence, where pH = pKa.",
    doubleMass: (l) =>
      lvl(
        l,
        "A stronger solution needs more base to neutralise it.",
        "Doubling the acid concentration doubles the volume of base at equivalence (n = cV).",
        "The buffer region's position (pKa) is unchanged; only its width in volume scales.",
      ),
    graph:
      "The steep vertical section marks equivalence. Its midpoint pH tells you the acid/base strength: 7 for strong–strong, >7 for weak acid–strong base.",
  },
  "gas-laws": {
    laws: [
      "Ideal gas law PV = nRT",
      "Kinetic theory: ⟨½mv²⟩ = (3/2)k_BT",
      "Boyle, Charles, Gay-Lussac",
    ],
    nextVariable:
      "Hold T fixed and drag the piston to trace the P–V isotherm; then hold V and heat the gas.",
    doubleMass: (l) =>
      lvl(
        l,
        "Doubling the number of particles doubles the pressure if the box stays the same size and temperature.",
        "P ∝ n at fixed V and T; doubling n doubles collisions with the wall per second.",
        "Heavier molecules at the same T move slower (v_rms ∝ 1/√m) but carry more momentum per hit — the pressure depends on n and T only for an ideal gas.",
      ),
    graph:
      "P vs V at constant T is a hyperbola (Boyle). V vs T and P vs T are straight lines through absolute zero.",
  },
};

const RULES: Rule[] = [
  {
    match: /what.*(happening|going on)|explain (this|the sim)|status|summar/i,
    answer: (ctx) => ctxSummary(ctx),
  },
  {
    match: /double|twice|2x/i,
    answer: (ctx, level) =>
      (ctx && SIM_KNOWLEDGE[ctx.simulationId]?.doubleMass(level)) ??
      "Doubling a parameter usually reveals a scaling law. Open a lab and I'll reason from its equations.",
  },
  {
    match: /frequency.*(increas|rising|go up)|chirp/i,
    answer: (ctx) =>
      SIM_KNOWLEDGE["gravitational-waves"].graph +
      (ctx?.measurements
        ? `\n\nRight now: ${Object.entries(ctx.measurements)
            .slice(0, 3)
            .map(([k, v]) => `${k} = ${typeof v === "number" ? fmt(v) : v}`)
            .join(", ")}.`
        : ""),
  },
  {
    match: /shift|doppler|redshift|blueshift/i,
    answer: (_ctx, level) =>
      lvl(
        level,
        "When a source moves away, its light waves are stretched to longer (redder) wavelengths; moving toward us, they are squashed (bluer).",
        "The observed wavelength is λ_obs = λ_rest(1 + v/c) for v ≪ c. A +300 km/s recession shifts Hα (656.3 nm) by 0.66 nm to the red.",
        "For v comparable to c use the relativistic form 1+z = √((1+β)/(1−β)). Every line shifts by the same fractional amount Δλ/λ, which is how you separate Doppler shift from an unknown line identification.",
      ),
  },
  {
    match: /graph|plot|chart|curve|tell me/i,
    answer: (ctx) =>
      (ctx && SIM_KNOWLEDGE[ctx.simulationId]?.graph) ??
      "Read a graph by asking: what are the axes and units, is the relationship linear, power-law or exponential, and where does it change behaviour?",
  },
  {
    match: /which variable|what should i (change|try)|next/i,
    answer: (ctx) =>
      (ctx && SIM_KNOWLEDGE[ctx.simulationId]?.nextVariable) ??
      "Change one variable at a time, keep the others fixed, and record the measurement each time — that is a controlled experiment.",
  },
  {
    match: /law|equation|principle|why/i,
    answer: (ctx, level) => {
      const k = ctx && SIM_KNOWLEDGE[ctx.simulationId];
      if (!k) return "Open a simulation and I will list the governing physical laws.";
      return `${lvl(level, "The key ideas here are:", "The governing relationships are:", "This model is governed by:")}\n• ${k.laws.join("\n• ")}\n\nOpen the Equations panel to inspect each symbol.`;
    },
  },
  {
    match: /error|uncertain|wrong|accurate/i,
    answer: () =>
      "Sources of error in a simulation are different from a real lab: numerical integration step size, model simplifications (see MODEL ASSUMPTIONS), and any injected noise. In real measurements add instrument resolution, calibration and systematic effects.",
  },
];

export function askAstra(
  question: string,
  ctx: SimContext | null,
  level: ExplanationLevel,
): AstraReply {
  const rule = RULES.find((r) => r.match.test(question));
  const text = rule
    ? rule.answer(ctx, level)
    : `${ctxSummary(ctx)}\n\nI can explain the physics of the current experiment, scaling laws ("what if I double…"), what a graph shows, or which variable to change next.`;
  return { text, source: "local-engine" };
}

/** Structured post-experiment analysis using only values in the context. */
export function analyseExperiment(ctx: SimContext | null, level: ExplanationLevel) {
  if (!ctx) return null;
  const k = SIM_KNOWLEDGE[ctx.simulationId];
  const meas = Object.entries(ctx.measurements).map(
    ([key, v]) => `${key}: ${typeof v === "number" ? fmt(v) : v}`,
  );
  const seriesInfo = ctx.series
    ? Object.entries(ctx.series).map(([name, pts]) => {
        if (!pts.length) return `${name}: no data`;
        const ys = pts.map((p) => p.y);
        const min = Math.min(...ys),
          max = Math.max(...ys);
        const trend =
          pts.length > 2
            ? pts[pts.length - 1].y > pts[0].y
              ? "rising"
              : pts[pts.length - 1].y < pts[0].y
                ? "falling"
                : "flat"
            : "—";
        return `${name}: ${pts.length} points, range ${fmt(min)} → ${fmt(max)}, overall ${trend}`;
      })
    : [];
  return {
    observation: [...meas, ...seriesInfo],
    equation: k?.laws ?? [],
    explanation: k ? k.doubleMass(level) : "No model-specific explanation available.",
    errors: [
      "Finite integration step (numerical approximation)",
      "Simplified educational model — see MODEL ASSUMPTIONS",
      ...(ctx.parameters.noise ? ["Injected Gaussian noise in the synthetic data"] : []),
    ],
    next: k?.nextVariable ?? "Vary one parameter and repeat.",
  };
}
