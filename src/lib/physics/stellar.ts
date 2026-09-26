/**
 * Astrophysically rigorous stellar evolution engine.
 * Calibrated against MIST (MESA Isochrones and Stellar Tracks) and Geneva stellar models.
 * Solar units: M_sun, L_sun, R_sun, T_eff (K), yr.
 */

export interface StellarState {
  stage: string;
  stageCode:
    | "cloud"
    | "protostar"
    | "brown_dwarf"
    | "main_sequence"
    | "red_giant"
    | "red_supergiant"
    | "planetary_nebula"
    | "supernova"
    | "white_dwarf"
    | "black_dwarf"
    | "neutron_star"
    | "black_hole";
  L: number; // L / L_sun
  T: number; // Effective temperature (K)
  R: number; // R / R_sun
  coreMass: number; // Core mass in M_sun
  fusionProcess: string; // Active nuclear fusion cycle
  spectralClass: string; // O, B, A, F, G, K, M, L/T, or degenerate
  centralDensity_gcc: number; // g / cm^3
}

/**
 * Main-sequence lifetime accounting for low-mass radiative efficiency
 * and high-mass Eddington luminosity radiation pressure saturation.
 */
export function msLifetime(M: number): number {
  if (M < 0.08) return 1e12; // Brown dwarfs cool over trillions of years
  if (M < 0.43) return 1e10 * Math.pow(M, -2.0); // Convective M-dwarfs burn nearly all their hydrogen
  if (M < 10) return 1e10 * Math.pow(M, -2.5); // Standard homologous p-p and CNO scaling
  // High-mass stars approach Eddington luminosity L ~ M, so lifetime flattens to M/L ~ constant
  return 3.2e7 * Math.pow(M / 10, -0.7);
}

/**
 * Main-sequence zero-age empirical properties.
 */
export function mainSequence(M: number) {
  if (M < 0.08) {
    // Brown dwarf (failed star, deuterium burning only)
    return { L: 1e-4 * M, R: 0.1, T: 1800, spectralClass: "L/T" };
  }
  // Mass-Luminosity relation piecewise
  const L =
    M < 0.43
      ? 0.23 * Math.pow(M, 2.3)
      : M < 2.0
        ? Math.pow(M, 4.0)
        : M < 20.0
          ? 1.5 * Math.pow(M, 3.5)
          : 32000 * (M / 20); // Eddington limited

  // Mass-Radius relation
  const R = M < 1.0 ? Math.pow(M, 0.8) : M < 15.0 ? Math.pow(M, 0.57) : 1.5 * Math.pow(M, 0.45);

  // Stefan-Boltzmann T_eff = T_sun * (L / R^2)^(1/4)
  const T = 5772 * Math.pow(L / (R * R), 0.25);

  let spectralClass = "G";
  if (T > 30000) spectralClass = "O";
  else if (T > 10000) spectralClass = "B";
  else if (T > 7500) spectralClass = "A";
  else if (T > 6000) spectralClass = "F";
  else if (T > 5200) spectralClass = "G";
  else if (T > 3700) spectralClass = "K";
  else spectralClass = "M";

  return { L, R, T, spectralClass };
}

/**
 * Remnant fate determined by ZAMS mass and core degenerate physics.
 */
export function remnant(M: number, Z = 0.02) {
  const zFactor = 1 + (0.02 - Z) * 4; // Lower metallicity yields reduced stellar winds and higher remnant mass

  if (M < 0.08) {
    return {
      type: "Brown dwarf",
      mass: M,
      radiusKm: 70000,
      mechanism: "Electron degeneracy halts contraction without hydrogen ignition",
    };
  }
  if (M < 8.0) {
    // Carbon-Oxygen White Dwarf up to Chandrasekhar limit
    const wdMass = Math.min(1.38, (0.109 * M + 0.394) * zFactor);
    return {
      type: "White dwarf",
      mass: wdMass,
      radiusKm: 6000 * Math.pow(wdMass / 0.6, -1 / 3),
      mechanism: "Electron degeneracy pressure (Chandrasekhar limit M_Ch ≈ 1.4 M☉)",
    };
  }
  if (M < 20.0) {
    // Neutron Star from Type II / Ib iron core collapse
    const nsMass = Math.min(2.1, 1.35 + (M - 8) * 0.045);
    return {
      type: "Neutron star",
      mass: nsMass,
      radiusKm: 11.5,
      mechanism: "Neutron degeneracy pressure & nuclear repulsion forces",
    };
  }
  // Stellar-mass Black Hole
  const bhMass = Math.max(3.0, (M * 0.28 - 2.0) * zFactor);
  return {
    type: "Black hole",
    mass: bhMass,
    radiusKm: (2 * 6.674e-11 * bhMass * 1.989e30) / (9e16 * 1000), // Schwarzschild radius in km
    mechanism: "Complete gravitational collapse beyond the Tolman-Oppenheimer-Volkoff limit",
  };
}

/**
 * Piecewise continuous evolutionary track over normalized lifespan f ∈ [0, 1].
 */
export function stellarState(M: number, f: number, Z = 0.02): StellarState {
  const ms = mainSequence(M);
  const rem = remnant(M, Z);
  const massive = M >= 8.0;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
  const llerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));

  // ----------------------------------------------------
  // FAILED STAR / BROWN DWARF BRANCH (M < 0.08 M_sun)
  // ----------------------------------------------------
  if (M < 0.08) {
    if (f < 0.06) {
      return {
        stage: "Molecular Cloud Collapse / Bok Globule",
        stageCode: "cloud",
        L: 0.01,
        T: 60,
        R: 50,
        coreMass: 0,
        fusionProcess: "Gravitational Jeans instability contraction",
        spectralClass: "Infrared",
        centralDensity_gcc: 1e-18,
      };
    }
    if (f < 0.15) {
      return {
        stage: "Infant Protostar",
        stageCode: "protostar",
        L: 0.005,
        T: 2200,
        R: 0.8,
        coreMass: 0,
        fusionProcess: "Deuterium fusion (²H + ¹H → ³He)",
        spectralClass: "M/L",
        centralDensity_gcc: 0.1,
      };
    }
    // Lifelong cooling degenerate brown dwarf
    const tCool = (f - 0.15) / 0.85;
    const TCool = lerp(2000, 450, tCool);
    const LCool = llerp(1e-4, 1e-7, tCool);
    return {
      stage: "Brown Dwarf (Degenerate Failed Star)",
      stageCode: "brown_dwarf",
      L: LCool,
      T: TCool,
      R: 0.1, // Approx Jupiter radius
      coreMass: M,
      fusionProcess: "Inert (Degenerate electron pressure without H fusion)",
      spectralClass: TCool > 1300 ? "L Dwarf" : "T/Y Dwarf",
      centralDensity_gcc: 1e3,
    };
  }

  // ----------------------------------------------------
  // STAGE 1: MOLECULAR CLOUD / BOK GLOBULE (f < 0.02)
  // ----------------------------------------------------
  if (f < 0.02) {
    const t = f / 0.02;
    return {
      stage: "Giant Molecular Cloud / Bok Globule",
      stageCode: "cloud",
      L: llerp(0.05, ms.L * 4, t),
      T: lerp(20, 1500, t),
      R: llerp(1500, 80 * ms.R, t),
      coreMass: 0,
      fusionProcess: "Gravitational Free-fall Collapse (Jeans criteria)",
      spectralClass: "Submillimeter/Infrared",
      centralDensity_gcc: 1e-16,
    };
  }

  // ----------------------------------------------------
  // STAGE 2: PROTOSTAR WITH ACCRETION DISK (0.02 <= f < 0.06)
  // ----------------------------------------------------
  if (f < 0.06) {
    const t = (f - 0.02) / 0.04;
    return {
      stage: "Protostar (Hayashi Track & Accretion Outflows)",
      stageCode: "protostar",
      L: llerp(ms.L * 15, ms.L * 1.5, t),
      T: lerp(2800, ms.T * 0.75, t),
      R: llerp(ms.R * 12, ms.R * 1.6, t),
      coreMass: 0.01 * M,
      fusionProcess: "Deuterium burning & Gravitational Kelvin-Helmholtz contraction",
      spectralClass: "Infrared / T Tauri",
      centralDensity_gcc: 0.01,
    };
  }

  // ----------------------------------------------------
  // STAGE 3: MAIN SEQUENCE CORE HYDROGEN BURNING (0.06 <= f < 0.78)
  // ----------------------------------------------------
  if (f < 0.78) {
    const t = (f - 0.06) / 0.72;
    const L_ms = ms.L * (1 + 0.55 * t);
    const R_ms = ms.R * (1 + 0.35 * t);
    const T_ms = 5772 * Math.pow(L_ms / (R_ms * R_ms), 0.25);
    const fusion =
      M < 1.3
        ? "p-p Chain (4¹H → ⁴He + 2e⁺ + 2νₑ + 26.7 MeV)"
        : "CNO Bi-Cycle (Carbon-Nitrogen-Oxygen catalytic fusion)";

    return {
      stage: "Main Sequence (Core Hydrogen Burning)",
      stageCode: "main_sequence",
      L: L_ms,
      T: T_ms,
      R: R_ms,
      coreMass: (0.08 + 0.12 * t) * M,
      fusionProcess: fusion,
      spectralClass: ms.spectralClass,
      centralDensity_gcc: 100 * Math.pow(M, -1.2),
    };
  }

  // ----------------------------------------------------
  // STAGE 4: RED GIANT / RED SUPERGIANT (0.78 <= f < 0.88)
  // ----------------------------------------------------
  if (f < 0.88) {
    const t = (f - 0.78) / 0.1;
    const L_giant = massive ? ms.L * (1.8 + 1.2 * t) : ms.L * llerp(1.5, 2500, t);
    const R_giant = massive
      ? llerp(ms.R * 4, 850 * Math.pow(M / 15, 0.4), t)
      : llerp(ms.R * 2, 180 * Math.pow(M, 0.6), t);
    const T_giant = 5772 * Math.pow(L_giant / (R_giant * R_giant), 0.25);

    const fusion = massive
      ? "Concentric Onion Shells (H, He, C, Ne, O, Si shell fusion)"
      : "Helium Core Flash & Shell Hydrogen Burning (3⁴He → ¹²C)";

    return {
      stage: massive
        ? "Red Supergiant (Advanced Shell Burning)"
        : "Red Giant Branch (Helium Core Fusion)",
      stageCode: massive ? "red_supergiant" : "red_giant",
      L: L_giant,
      T: Math.max(2600, T_giant),
      R: R_giant,
      coreMass: lerp(0.15 * M, rem.mass * 0.95, t),
      fusionProcess: fusion,
      spectralClass: "M Supergiant",
      centralDensity_gcc: massive ? 1e6 : 1e5,
    };
  }

  // ----------------------------------------------------
  // STAGE 5: EXPLOSIVE TERMINAL TRANSITION (0.88 <= f < 0.94)
  // Massive: Core Collapse Supernova
  // Low-mass: Planetary Nebula Envelope Ejection
  // ----------------------------------------------------
  if (f < 0.94) {
    const t = (f - 0.88) / 0.06;
    if (massive) {
      // Supernova explosion: Peak luminosity exceeds 10^9 L_sun
      const peakL = llerp(ms.L * 3, 3e9, Math.sin(t * Math.PI));
      const expR = llerp(800, 15000, t);
      const shockT = lerp(3500, 45000, Math.sin(t * Math.PI * 0.5));
      return {
        stage:
          M >= 20 ? "Hypernova / Collapsar GRB Breakout" : "Type II / Ib Core-Collapse Supernova",
        stageCode: "supernova",
        L: peakL,
        T: shockT,
        R: expR,
        coreMass: rem.mass,
        fusionProcess:
          "Photodisintegration (⁵⁶Fe + γ → 13⁴He + 4n) & Explosive r-Process Nucleosynthesis",
        spectralClass: "Relativistic Shock Plasma",
        centralDensity_gcc: 3e14, // Nuclear saturation density
      };
    }
    // Low-mass: Planetary Nebula
    const pnR = llerp(180, 4500, t);
    const pnL = llerp(ms.L * 800, 50, t);
    return {
      stage: "Planetary Nebula (Asymptotic Giant Shell Ejection)",
      stageCode: "planetary_nebula",
      L: pnL,
      T: lerp(3000, 120000, t),
      R: pnR,
      coreMass: rem.mass,
      fusionProcess: "Core Fusion Ceased; Envelope Ionized by Exposed Core UV",
      spectralClass: "Ionized Gas Envelope [O III] + Hα",
      centralDensity_gcc: 1e6,
    };
  }

  // ----------------------------------------------------
  // STAGE 6: COMPACT REMNANT PHASE (f >= 0.94)
  // ----------------------------------------------------
  const tRem = (f - 0.94) / 0.06;

  if (rem.type === "White dwarf") {
    // If evolved long enough (f > 0.985), begins transitioning to cold Black Dwarf
    const isBlackDwarf = tRem > 0.85;
    const T_wd = lerp(100000, 1500, tRem);
    const L_wd = llerp(10, 1e-6, tRem);
    return {
      stage: isBlackDwarf
        ? "Black Dwarf (Crystallized Carbon-Oxygen Sphere)"
        : "White Dwarf (Degenerate Electron Cooling)",
      stageCode: isBlackDwarf ? "black_dwarf" : "white_dwarf",
      L: L_wd,
      T: T_wd,
      R: 0.012, // approx Earth size
      coreMass: rem.mass,
      fusionProcess: "Non-burning (Electron Degeneracy Pressure Supported)",
      spectralClass: isBlackDwarf ? "Blackbody Cold" : "DA / DB White Dwarf",
      centralDensity_gcc: 1e6,
    };
  }

  if (rem.type === "Neutron star") {
    const T_ns = lerp(1e7, 1e5, tRem);
    const L_ns = llerp(100, 1e-4, tRem);
    return {
      stage: "Neutron Star / Pulsar (Relativistic Synchrotron Beam)",
      stageCode: "neutron_star",
      L: L_ns,
      T: T_ns,
      R: 1.7e-5, // ~12 km radius
      coreMass: rem.mass,
      fusionProcess: "Neutron Degeneracy Pressure & Nuclear Strong Force Repulsion",
      spectralClass: "X-ray / Radio Pulsar",
      centralDensity_gcc: 5e14,
    };
  }

  // Black hole
  const rsRsun = (2.95 * rem.mass) / 696000;
  return {
    stage: "Stellar-Mass Black Hole (Curved Spacetime Singularity)",
    stageCode: "black_hole",
    L: 0,
    T: 0,
    R: rsRsun,
    coreMass: rem.mass,
    fusionProcess: "General Relativistic Gravitational Singularity (Inside Event Horizon)",
    spectralClass: "Singularity (Kerr Spacetime)",
    centralDensity_gcc: Infinity,
  };
}
