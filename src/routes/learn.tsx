import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Tex } from "@/components/lab/Equation";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Concepts & Equations | ASTRA LAB" },
      {
        name: "description",
        content:
          "Key astrophysics and chemistry concepts and equations, each linked to the simulation where you can test it.",
      },
      { property: "og:title", content: "Learn — Concepts & Equations | ASTRA LAB" },
      {
        property: "og:description",
        content: "The physics behind every experiment, linked to a lab to try it in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Learn,
});

const TOPICS = [
  {
    t: "Newtonian gravity",
    f: "astrophysics",
    tex: "F = \\frac{GMm}{r^2}",
    d: "Every mass attracts every other. Orbits are the balance of this pull and inertia.",
    path: "/lab/orbital-mechanics",
  },
  {
    t: "Kepler's third law",
    f: "astrophysics",
    tex: "T^2 = \\frac{4\\pi^2}{GM}a^3",
    d: "Period squared scales with semi-major axis cubed — independent of the planet's mass.",
    path: "/lab/kepler",
  },
  {
    t: "Stefan–Boltzmann law",
    f: "astrophysics",
    tex: "L = 4\\pi R^2 \\sigma T^4",
    d: "A star's luminosity follows from its size and surface temperature.",
    path: "/lab/hr-diagram",
  },
  {
    t: "Wien's law",
    f: "astrophysics",
    tex: "\\lambda_{max} T = 2.898\\times10^{-3}\\,\\text{m K}",
    d: "Hotter bodies peak at shorter wavelengths — why hot stars look blue.",
    path: "/lab/spectroscopy",
  },
  {
    t: "Doppler shift",
    f: "astrophysics",
    tex: "\\frac{\\Delta\\lambda}{\\lambda_0} = \\frac{v_r}{c}",
    d: "Motion along the line of sight shifts spectral lines.",
    path: "/lab/spectroscopy",
  },
  {
    t: "Schwarzschild radius",
    f: "astrophysics",
    tex: "r_s = \\frac{2GM}{c^2}",
    d: "The radius inside which nothing, not even light, escapes.",
    path: "/lab/black-hole",
  },
  {
    t: "Transit depth",
    f: "astrophysics",
    tex: "\\delta = (R_p/R_*)^2",
    d: "The fractional dip in starlight as a planet crosses its star.",
    path: "/lab/exoplanet-transit",
  },
  {
    t: "Chirp mass",
    f: "astrophysics",
    tex: "\\mathcal{M} = \\frac{(m_1m_2)^{3/5}}{(m_1+m_2)^{1/5}}",
    d: "The mass combination that controls how fast a binary's GW frequency sweeps up.",
    path: "/lab/gravitational-waves",
  },
  {
    t: "Friedmann equation",
    f: "astrophysics",
    tex: "H^2 = H_0^2\\left(\\Omega_m a^{-3} + \\Omega_\\Lambda + \\Omega_k a^{-2}\\right)",
    d: "How matter, dark energy and curvature govern cosmic expansion.",
    path: "/lab/cosmology",
  },
  {
    t: "Arrhenius equation",
    f: "chemistry",
    tex: "k = A e^{-E_a/RT}",
    d: "Rate constants rise exponentially with temperature.",
    path: "/lab/reaction-kinetics",
  },
  {
    t: "Ideal gas law",
    f: "chemistry",
    tex: "PV = nRT",
    d: "Pressure, volume and temperature of a dilute gas are linked.",
    path: "/lab/gas-laws",
  },
  {
    t: "Gibbs free energy",
    f: "chemistry",
    tex: "\\Delta G = \\Delta H - T\\Delta S",
    d: "A reaction is spontaneous when ΔG < 0.",
    path: "/lab/thermochemistry",
  },
  {
    t: "Nernst equation",
    f: "chemistry",
    tex: "E = E^\\circ - \\frac{RT}{nF}\\ln Q",
    d: "Cell voltage depends on concentrations.",
    path: "/lab/electrochemistry",
  },
  {
    t: "Henderson–Hasselbalch",
    f: "chemistry",
    tex: "\\text{pH} = \\text{p}K_a + \\log\\frac{[A^-]}{[HA]}",
    d: "The buffer region of a weak-acid titration.",
    path: "/lab/titration",
  },
  {
    t: "Equilibrium constant",
    f: "chemistry",
    tex: "K_c = \\frac{[NH_3]^2}{[N_2][H_2]^3}",
    d: "At equilibrium forward and reverse rates are equal — the mixture keeps reacting.",
    path: "/lab/chemical-equilibrium",
  },
  {
    t: "Rydberg formula",
    f: "chemistry",
    tex: "\\frac{1}{\\lambda} = R_H\\left(\\frac{1}{n_1^2}-\\frac{1}{n_2^2}\\right)",
    d: "Hydrogen's emission lines come from electron transitions.",
    path: "/lab/spectroscopy",
  },
];

function Learn() {
  const [q, setQ] = useState("");
  const list = TOPICS.filter((x) => `${x.t} ${x.d}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="label-mono text-primary">Reference shelf</div>
      <h1 className="mt-1 font-display text-3xl font-semibold">Learn</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The core laws behind every bench. Each card links to the experiment where you can test it
        yourself.
      </p>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search concepts…"
        className="mt-6 max-w-xs"
        aria-label="Search concepts"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((x) => (
          <article key={x.t} className="panel flex flex-col p-5">
            <div className="label-mono">{x.f}</div>
            <h2 className="mt-1 font-display text-lg font-semibold">{x.t}</h2>
            <div className="my-3 overflow-x-auto rounded-md border bg-background/40 px-3 py-3 text-center">
              <Tex tex={x.tex} block />
            </div>
            <p className="flex-1 text-sm text-muted-foreground">{x.d}</p>
            <Link to={x.path} className="mt-3 font-mono text-xs text-primary hover:underline">
              Test it in the lab →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
