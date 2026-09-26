/** Simplified stellar-evolution model (scaling relations). Solar units. */
export interface StellarState {
  stage: string;
  L: number;
  T: number;
  R: number;
  coreMass: number;
}

export const msLifetime = (M: number) => 1e10 * Math.pow(M, -2.5); // yr

export function mainSequence(M: number) {
  const L = M < 0.43 ? 0.23 * M ** 2.3 : M < 2 ? M ** 4 : M < 55 ? 1.4 * M ** 3.5 : 32000 * M;
  const R = M < 1 ? M ** 0.8 : M ** 0.57;
  const T = 5772 * Math.pow(L / (R * R), 0.25);
  return { L, R, T };
}

export function remnant(M: number, Z = 0.02) {
  const zf = 1 + (0.02 - Z) * 5; // lower metallicity -> slightly heavier cores
  if (M < 8) return { type: "White dwarf", mass: Math.min(1.38, (0.109 * M + 0.394) * zf) };
  if (M < 20) return { type: "Neutron star", mass: 1.4 + (M - 8) * 0.02 };
  return { type: "Black hole", mass: Math.max(3, M * 0.25 * zf) };
}

/** Evolve along a piecewise track. f in [0,1] covers whole life. */
export function stellarState(M: number, f: number, Z = 0.02): StellarState {
  const ms = mainSequence(M);
  const rem = remnant(M, Z);
  const massive = M >= 8;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
  const llerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
  if (f < 0.04) {
    const t = f / 0.04;
    return { stage: "Protostar", L: llerp(ms.L * 10, ms.L, t), T: lerp(3000, ms.T, t), R: llerp(ms.R * 8, ms.R, t), coreMass: 0 };
  }
  if (f < 0.8) {
    const t = (f - 0.04) / 0.76;
    return { stage: "Main sequence", L: ms.L * (1 + 0.8 * t), T: ms.T * (1 - 0.05 * t), R: ms.R * (1 + 0.5 * t), coreMass: 0.1 * M * t };
  }
  if (f < 0.88) {
    const t = (f - 0.8) / 0.08;
    const Lg = massive ? ms.L * 1.5 : ms.L * 2 * (1 + 300 * t * t);
    const Rg = massive ? llerp(ms.R, 800 * Math.sqrt(M / 15), t) : llerp(ms.R * 1.5, 100 * M ** 0.7, t);
    const Tg = 5772 * Math.pow(Lg / (Rg * Rg), 0.25);
    return { stage: massive ? "Red supergiant" : "Red giant", L: Lg, T: Tg, R: Rg, coreMass: lerp(0.1 * M, rem.mass * 0.9, t) };
  }
  if (f < 0.94) {
    const t = (f - 0.88) / 0.06;
    if (massive) return { stage: "Core collapse / supernova", L: llerp(ms.L * 2, 1e9, t), T: lerp(4000, 20000, t), R: llerp(800, 5000, t), coreMass: rem.mass };
    const R = llerp(100 * M ** 0.7, 0.3, t), L = llerp(ms.L * 600, ms.L * 1000, t);
    return { stage: "Planetary nebula", L, T: 5772 * Math.pow(L / (R * R), 0.25), R, coreMass: rem.mass };
  }
  const t = (f - 0.94) / 0.06;
  if (rem.type === "White dwarf") return { stage: "White dwarf", L: llerp(10, 1e-3, t), T: lerp(80000, 6000, t), R: 0.012, coreMass: rem.mass };
  if (rem.type === "Neutron star") return { stage: "Neutron star", L: llerp(1, 1e-4, t), T: 1e6, R: 1.7e-5, coreMass: rem.mass };
  return { stage: "Black hole", L: 0, T: 0, R: (2.95 * rem.mass) / 696000, coreMass: rem.mass };
}
