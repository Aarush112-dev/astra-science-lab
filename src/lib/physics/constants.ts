/** Physical constants (SI, CODATA 2018) */
export const G = 6.6743e-11; // m^3 kg^-1 s^-2
export const c = 2.99792458e8; // m/s
export const h = 6.62607015e-34; // J s
export const k_B = 1.380649e-23; // J/K
export const sigma_SB = 5.670374419e-8; // W m^-2 K^-4
export const R_gas = 8.314462618; // J mol^-1 K^-1
export const R = R_gas;
export const N_A = 6.02214076e23;
export const F = 96485.33212; // C/mol
export const e_charge = 1.602176634e-19;
export const m_p = 1.67262192369e-27;

export const M_sun = 1.98847e30; // kg
export const R_sun = 6.957e8; // m
export const L_sun = 3.828e26; // W
export const T_sun = 5772; // K
export const M_earth = 5.9722e24;
export const R_earth = 6.371e6;
export const M_jup = 1.898e27;
export const R_jup = 7.1492e7;
export const AU = 1.495978707e11; // m
export const pc = 3.08567758149137e16; // m
export const ly = 9.4607304725808e15; // m
export const yr = 3.15576e7; // s
export const Mpc = pc * 1e6;

/** Schwarzschild radius (m) for mass in kg */
export const schwarzschildRadius = (M: number) => (2 * G * M) / (c * c);

/** Format a number with scientific notation when needed */
export function fmt(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const ax = Math.abs(x);
  if (ax >= 1e5 || ax < 1e-3) {
    const exp = Math.floor(Math.log10(ax));
    const mant = x / 10 ** exp;
    return `${mant.toFixed(digits - 1)}×10${superscript(exp)}`;
  }
  return Number(x.toPrecision(digits)).toString();
}

function superscript(n: number) {
  const map: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return String(n)
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

/** Astronomical unit helpers: returns [display, SI hover] */
export const astro = {
  solarMass: (M: number) => ({ display: `${fmt(M)} M☉`, si: `${fmt(M * M_sun)} kg` }),
  solarRadius: (R: number) => ({ display: `${fmt(R)} R☉`, si: `${fmt(R * R_sun)} m` }),
  solarLum: (L: number) => ({ display: `${fmt(L)} L☉`, si: `${fmt(L * L_sun)} W` }),
  au: (a: number) => ({ display: `${fmt(a)} AU`, si: `${fmt(a * AU)} m` }),
  parsec: (d: number) => ({ display: `${fmt(d)} pc`, si: `${fmt(d * pc)} m` }),
  lightYear: (d: number) => ({ display: `${fmt(d)} ly`, si: `${fmt(d * ly)} m` }),
  megaparsec: (d: number) => ({ display: `${fmt(d)} Mpc`, si: `${fmt(d * Mpc)} m` }),
  years: (t: number) => ({
    display: t >= 1e9 ? `${fmt(t / 1e9)} Gyr` : t >= 1e6 ? `${fmt(t / 1e6)} Myr` : `${fmt(t)} yr`,
    si: `${fmt(t * yr)} s`,
  }),
};
