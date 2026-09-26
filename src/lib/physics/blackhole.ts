import { G, c, M_sun } from "@/lib/physics/constants";

export const k_B = 1.380649e-23; // J/K
export const hbar = 1.054571817e-34; // J s

export interface BlackHolePreset {
  id: string;
  name: string;
  description: string;
  massMsun: number;
  spin: number;
  distanceLightYears: string;
  constellation: string;
  discoveryYear: number;
  type: "stellar" | "supermassive" | "intermediate" | "primordial";
}

export const BLACK_HOLE_PRESETS: BlackHolePreset[] = [
  {
    id: "sgr-a",
    name: "Sagittarius A*",
    description:
      "The supermassive black hole anchoring the center of our Milky Way galaxy, imaged by the Event Horizon Telescope in 2022.",
    massMsun: 4.15e6,
    spin: 0.9,
    distanceLightYears: "26,673 ly",
    constellation: "Sagittarius",
    discoveryYear: 1974,
    type: "supermassive",
  },
  {
    id: "m87",
    name: "M87* (Pōwehi)",
    description:
      "Supermassive behemoth in the Virgo Cluster; the very first black hole ever directly imaged via radio interferometry in 2019.",
    massMsun: 6.5e9,
    spin: 0.94,
    distanceLightYears: "53.5 million ly",
    constellation: "Virgo",
    discoveryYear: 1918,
    type: "supermassive",
  },
  {
    id: "cygnus-x1",
    name: "Cygnus X-1",
    description:
      "The first widely accepted stellar-mass black hole, discovered in 1964 as a ferocious X-ray binary pulling matter from a blue supergiant companion.",
    massMsun: 21.2,
    spin: 0.97,
    distanceLightYears: "7,200 ly",
    constellation: "Cygnus",
    discoveryYear: 1964,
    type: "stellar",
  },
  {
    id: "gw150914",
    name: "GW150914 Remnant",
    description:
      "The historic remnant forged in humanity's first direct detection of gravitational waves by LIGO/Virgo in September 2015.",
    massMsun: 62.0,
    spin: 0.68,
    distanceLightYears: "1.4 billion ly",
    constellation: "Southern Sky",
    discoveryYear: 2015,
    type: "stellar",
  },
  {
    id: "primordial",
    name: "Primordial Black Hole",
    description:
      "Hypothetical asteroid-mass black hole formed in the ultra-dense early universe fractions of a second after the Big Bang, radiating via Hawking radiation.",
    massMsun: 5.0e-19, // ~10^12 kg
    spin: 0.0,
    distanceLightYears: "Hypothetical",
    constellation: "Intergalactic",
    discoveryYear: 1971,
    type: "primordial",
  },
];

/**
 * Exact ISCO radius in units of GM/c² for prograde (+) or retrograde (-) dimensionless spin a*.
 * Ref: Bardeen, Press, & Teukolsky (1972) ApJ 178, 347.
 */
export function calculateISCO(a: number): number {
  const aClamped = Math.max(-0.998, Math.min(0.998, a));
  const z1 =
    1 + Math.cbrt(1 - aClamped * aClamped) * (Math.cbrt(1 + aClamped) + Math.cbrt(1 - aClamped));
  const z2 = Math.sqrt(3 * aClamped * aClamped + z1 * z1);
  return 3 + z2 - Math.sign(aClamped || 1) * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
}

/**
 * Photon sphere radius in units of GM/c² for prograde/retrograde spin.
 */
export function calculatePhotonSphere(a: number): { rPrograde: number; rRetrograde: number } {
  const aClamped = Math.max(-0.998, Math.min(0.998, a));
  const rPro = 2 * (1 + Math.cos((2 / 3) * Math.acos(-Math.abs(aClamped))));
  const rRetro = 2 * (1 + Math.cos((2 / 3) * Math.acos(Math.abs(aClamped))));
  return { rPrograde: rPro, rRetrograde: rRetro };
}

/**
 * Computes complete general relativistic and thermodynamic properties of a black hole.
 */
export function computeBlackHoleProperties(massMsun: number, spin: number) {
  const M_kg = massMsun * M_sun;
  const aClamped = Math.max(-0.998, Math.min(0.998, spin));

  // Gravitational radius rg = GM/c^2
  const rg_m = (G * M_kg) / (c * c);
  // Schwarzschild radius rs = 2rg
  const rs_m = 2 * rg_m;

  // Outer Event Horizon r+ = rg * (1 + sqrt(1 - a^2))
  const rH_m = rg_m * (1 + Math.sqrt(Math.max(0, 1 - aClamped * aClamped)));
  // Inner Cauchy Horizon r- = rg * (1 - sqrt(1 - a^2))
  const rCauchy_m = rg_m * (1 - Math.sqrt(Math.max(0, 1 - aClamped * aClamped)));

  // Ergosphere equatorial boundary r_erg(pi/2) = 2rg = rs
  const rErgEquator_m = rs_m;

  // ISCO radius
  const isco_rg = calculateISCO(aClamped);
  const isco_m = isco_rg * rg_m;

  // Accretion efficiency: eta = 1 - E_ISCO / mc^2
  const efficiency = 1 - Math.sqrt(Math.max(0, 1 - 2 / (3 * isco_rg)));

  // Photon sphere (Schwarzschild = 3rg = 1.5rs)
  const photonSphere_rg = 3.0;
  const photonSphere_m = photonSphere_rg * rg_m;

  // Critical impact parameter for photon capture: b_crit = 3*sqrt(3)*rg ≈ 5.196 rg
  const bCrit_rg = 3 * Math.sqrt(3);
  const shadowDiameter_m = 2 * bCrit_rg * rg_m;

  // Gravitational timescale tau_g = GM/c^3
  const tauG_s = rg_m / c;

  // ISCO Keplerian orbital frequency f_ISCO = (1 / 2pi) * sqrt(GM / r_ISCO^3) / (1 + a*(rg/r_ISCO)^(3/2))
  const fISCO_Hz = c / (2 * Math.PI * rg_m) / (Math.pow(isco_rg, 1.5) + aClamped);

  // Orbital velocity at ISCO as fraction of c
  const vIscoFrac = Math.sqrt(1 / (2 * isco_rg));

  // Hawking Radiation Thermodynamics
  // T_H = hbar * c^3 / (8pi * G * M * k_B)
  const hawkingTemp_K = (hbar * c * c * c) / (8 * Math.PI * G * M_kg * k_B);

  // Evaporation timescale t_evap = 5120 * pi * G^2 * M^3 / (hbar * c^4)
  const tEvap_s = (5120 * Math.PI * G * G * Math.pow(M_kg, 3)) / (hbar * Math.pow(c, 4));
  const tEvap_yr = tEvap_s / (365.25 * 86400);

  // Hawking Luminosity: P = hbar * c^6 / (15360 * pi * G^2 * M^2)
  const hawkingLuminosity_W = (hbar * Math.pow(c, 6)) / (15360 * Math.PI * G * G * M_kg * M_kg);

  // Bekenstein-Hawking Entropy S = k_B * c^3 * Area / (4 * G * hbar)
  const horizonArea_m2 = 4 * Math.PI * (rH_m * rH_m + Math.pow(aClamped * rg_m, 2));
  const entropy_kB = (c * c * c * horizonArea_m2) / (4 * G * hbar);

  return {
    massKg: M_kg,
    rg_m,
    rs_m,
    rH_m,
    rCauchy_m,
    rErgEquator_m,
    isco_rg,
    isco_m,
    efficiency,
    photonSphere_rg,
    photonSphere_m,
    bCrit_rg,
    shadowDiameter_m,
    tauG_s,
    fISCO_Hz,
    vIscoFrac,
    hawkingTemp_K,
    tEvap_yr,
    hawkingLuminosity_W,
    entropy_kB,
  };
}

/**
 * Free-fall radial trajectory of an infalling probe dropped from rest at r0.
 * Computes coordinate time t, proper time tau, gravitational redshift z, and tidal forces.
 */
export function calculateInfallTrajectory(
  massMsun: number,
  r0_rg: number,
  rCurrent_rg: number,
  humanHeightM = 1.8,
) {
  const M_kg = massMsun * M_sun;
  const rg_m = (G * M_kg) / (c * c);
  const rs_m = 2 * rg_m;

  const r0_m = r0_rg * rg_m;
  const r_m = Math.max(rs_m * 1.0001, rCurrent_rg * rg_m);

  // Proper time tau elapsed from r0 to r
  // tau = (r0 / c) * sqrt(r0 / rs) * [ 0.5 * arccos(2*r/r0 - 1) + sqrt(r/r0 - (r/r0)^2) ]
  const x = Math.max(0, Math.min(1, r_m / r0_m));
  const tau_s =
    (r0_m / c) *
    Math.sqrt(r0_m / rs_m) *
    (0.5 * Math.acos(2 * x - 1) + Math.sqrt(Math.max(0, x - x * x)));

  // Total proper time to reach the singularity r = 0:
  const tauSingularity_s = (Math.PI / 2) * (Math.pow(r0_m, 1.5) / (c * Math.sqrt(rs_m)));

  // Coordinate time t for distant observer:
  // Integrates to infinity as r -> rs!
  // Approximation for r approaching rs:
  const u = r_m / rs_m;
  const u0 = r0_m / rs_m;
  const tDistant_s =
    (rs_m / c) *
    (2 * Math.sqrt(u0) * (Math.sqrt(u0) - Math.sqrt(u)) +
      Math.log(Math.abs((Math.sqrt(u) + 1) / (Math.sqrt(u) - 1 + 1e-6))));

  // Gravitational redshift of probe signals received by distant observer:
  // factoring gravitational time dilation + Doppler infall velocity:
  // 1 + z = (1 / (1 - rs/r)) * sqrt(1 - rs/r0)
  const onePlusZ =
    (1 / Math.max(0.0001, 1 - rs_m / r_m)) * Math.sqrt(Math.max(0.001, 1 - rs_m / r0_m));
  const redshift_z = onePlusZ - 1;

  // Tidal acceleration (spaghettification):
  // Delta a_radial = 2 * G * M * Delta r / r^3
  const tidalAccel_m_s2 = (2 * G * M_kg * humanHeightM) / Math.pow(r_m, 3);
  const tidal_g = tidalAccel_m_s2 / 9.80665;

  // Dilation factor dt/dtau: how many seconds tick on Earth per 1 second on the probe
  const dt_dtau = Math.sqrt(Math.max(0.001, 1 - rs_m / r0_m)) / Math.max(0.0001, 1 - rs_m / r_m);

  // Received wavelength assuming 450nm (blue) rest-frame emission
  const emittedNm = 450;
  const receivedNm = emittedNm * onePlusZ;

  let spectralBand = "Visible Blue (450 nm)";
  if (redshift_z > 30) spectralBand = "Extinguished into Radio Silence";
  else if (redshift_z > 8) spectralBand = `Mid-Infrared (${(receivedNm / 1000).toFixed(1)} µm)`;
  else if (redshift_z > 2) spectralBand = `Near-Infrared (${Math.round(receivedNm)} nm)`;
  else if (redshift_z > 0.6) spectralBand = `Deep Crimson (${Math.round(receivedNm)} nm)`;
  else if (redshift_z > 0.3) spectralBand = `Amber (${Math.round(receivedNm)} nm)`;
  else if (redshift_z > 0.1) spectralBand = `Green (${Math.round(receivedNm)} nm)`;

  return {
    tau_s,
    tauSingularity_s,
    tDistant_s,
    redshift_z,
    dt_dtau,
    emittedNm,
    receivedNm,
    spectralBand,
    tidal_g,
    isLethalTidal: tidal_g > 15, // > 15g is fatal to human anatomy
  };
}

/**
 * Photon trajectory bending via General Relativistic null geodesic:
 * d^2 u / dphi^2 + u = 3/2 * rs * u^2 where u = 1/r.
 */
export function tracePhotonGeodesic(
  impactParameter_rg: number,
  steps = 220,
): { x: number; y: number; fate: "escape" | "captured" | "orbit" } {
  // Dimensionless units where rg = 1, rs = 2
  const b = impactParameter_rg;
  const bCrit = 3 * Math.sqrt(3); // ≈ 5.196

  // Initial conditions at distant emitter (x = -40, y = b)
  let x = -40;
  let y = b;
  let vx = 1.0;
  let vy = 0.0;
  const dt = 0.35;

  let fate: "escape" | "captured" | "orbit" = "escape";

  for (let s = 0; s < steps; s++) {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);

    if (r < 2.01) {
      fate = "captured";
      break;
    }

    if (Math.abs(b - bCrit) < 0.05 && Math.abs(r - 3.0) < 0.3) {
      fate = "orbit";
    }

    // Relativistic acceleration toward origin: a = -3 * (GM/c^2) * (L^2 / r^5)
    // In GR, light experiences an effective potential with an extra 1/r^3 term
    const force = 2.0 / (r2 * r) + (3.0 * b * b) / (r2 * r2 * r);
    vx -= force * x * dt;
    vy -= force * y * dt;

    // Renormalize velocity to maintain speed of light |v| = 1
    const vMag = Math.hypot(vx, vy);
    vx /= vMag;
    vy /= vMag;

    x += vx * dt;
    y += vy * dt;

    if (x > 40 || Math.abs(y) > 40) {
      if (fate !== "orbit") fate = "escape";
      break;
    }
  }

  return { x, y, fate };
}
