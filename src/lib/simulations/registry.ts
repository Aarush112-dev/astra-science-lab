export type Field = "astrophysics" | "chemistry";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Research";

export interface SimulationMeta {
  id: string;
  name: string;
  field: Field;
  subfield: string;
  description: string;
  difficulty: Difficulty;
  variables: string[];
  /** Route path; undefined = coming soon */
  path?: string;
  researchQuestion?: string;
}

export const SIMULATIONS: SimulationMeta[] = [
  // ASTROPHYSICS
  {
    id: "stellar-evolution",
    name: "Stellar Evolution",
    field: "astrophysics",
    subfield: "Stellar physics",
    difficulty: "Intermediate",
    variables: ["Mass", "Metallicity", "Rotation"],
    description:
      "Evolve a star from protostar to remnant and watch it track across the HR diagram.",
    path: "/lab/stellar-evolution",
    researchQuestion:
      "At what initial mass does the remnant switch from white dwarf to neutron star? Justify using the core mass you measure.",
  },
  {
    id: "black-hole",
    name: "Black Hole",
    field: "astrophysics",
    subfield: "General relativity",
    difficulty: "Advanced",
    variables: ["Mass", "Spin", "Inclination", "Disk temperature"],
    description: "Explore the event horizon, ISCO, lensing and beaming of an accreting black hole.",
    path: "/lab/black-hole",
    researchQuestion:
      "Using only the ISCO orbital frequency, estimate the black hole mass. How does spin bias your estimate?",
  },
  {
    id: "orbital-mechanics",
    name: "Orbital Mechanics",
    field: "astrophysics",
    subfield: "Classical mechanics",
    difficulty: "Beginner",
    variables: ["Mass", "Velocity", "Position", "Eccentricity"],
    description:
      "Integrate N-body gravity, plot energies and break an orbit into an escape trajectory.",
    path: "/lab/orbital-mechanics",
    researchQuestion:
      "Measure the escape speed at 1 AU from the energy graph alone, then compare with √(2GM/r).",
  },
  {
    id: "exoplanet-transit",
    name: "Exoplanet Transit",
    field: "astrophysics",
    subfield: "Exoplanets",
    difficulty: "Intermediate",
    variables: ["Planet radius", "Period", "Inclination", "Noise"],
    description:
      "Watch a planet cross its star, build the light curve and recover the planet radius.",
    path: "/lab/exoplanet-transit",
    researchQuestion:
      "From noisy photometry only, determine the planet-to-star radius ratio and its uncertainty.",
  },
  {
    id: "gravitational-waves",
    name: "Gravitational Waves",
    field: "astrophysics",
    subfield: "Relativistic astrophysics",
    difficulty: "Advanced",
    variables: ["Mass 1", "Mass 2", "Separation", "Distance"],
    description:
      "Generate an inspiral chirp and pull it out of simulated detector noise with a matched filter.",
    path: "/lab/gravitational-waves",
    researchQuestion:
      "Can you determine the chirp mass of a binary using only its simulated gravitational-wave signal?",
  },
  {
    id: "spectroscopy",
    name: "Spectroscopy",
    field: "astrophysics",
    subfield: "Radiative processes",
    difficulty: "Intermediate",
    variables: ["Temperature", "Composition", "Radial velocity"],
    description:
      "Synthesise stellar and nebular spectra, identify lines and measure Doppler shifts.",
    path: "/lab/spectroscopy",
    researchQuestion:
      "Determine the radial velocity of an unknown source from three shifted lines.",
  },
  {
    id: "galaxy-formation",
    name: "Galaxy Formation",
    field: "astrophysics",
    subfield: "Galactic dynamics",
    difficulty: "Advanced",
    variables: ["Halo mass", "Gas fraction", "Spin"],
    description: "Collapse a rotating gas cloud into a disc and follow its rotation curve.",
    path: "/lab/galaxy-formation",
  },
  {
    id: "kepler",
    name: "Kepler's Laws",
    field: "astrophysics",
    subfield: "Celestial mechanics",
    difficulty: "Beginner",
    variables: ["Semi-major axis", "Eccentricity", "Central mass"],
    description: "Verify equal areas and T² ∝ a³ with your own measured orbits.",
    path: "/lab/kepler",
  },
  {
    id: "hr-diagram",
    name: "Hertzsprung–Russell Diagram",
    field: "astrophysics",
    subfield: "Stellar populations",
    difficulty: "Beginner",
    variables: ["Temperature", "Luminosity", "Radius"],
    description: "Place stars on the HR diagram and read off radius, class and lifetime.",
    path: "/lab/hr-diagram",
  },
  {
    id: "cosmology",
    name: "Cosmology",
    field: "astrophysics",
    subfield: "Cosmology",
    difficulty: "Advanced",
    variables: ["Ωm", "ΩΛ", "H₀"],
    description:
      "Integrate the Friedmann equation and see how density parameters decide the fate of the universe.",
    path: "/lab/cosmology",
  },

  // CHEMISTRY
  {
    id: "reaction-kinetics",
    name: "Reaction Kinetics",
    field: "chemistry",
    subfield: "Physical chemistry",
    difficulty: "Intermediate",
    variables: ["Temperature", "Concentration", "Catalyst", "Ea"],
    description: "Follow concentration vs time, collision rates and the Arrhenius relationship.",
    path: "/lab/reaction-kinetics",
    researchQuestion:
      "Determine the activation energy from rate constants measured at four temperatures.",
  },
  {
    id: "chemical-equilibrium",
    name: "Chemical Equilibrium",
    field: "chemistry",
    subfield: "Physical chemistry",
    difficulty: "Intermediate",
    variables: ["Temperature", "Pressure", "Concentration"],
    description: "Perturb the Haber process and watch Le Chatelier's principle in action.",
    path: "/lab/chemical-equilibrium",
  },
  {
    id: "titration",
    name: "Acid–Base Titration",
    field: "chemistry",
    subfield: "Analytical chemistry",
    difficulty: "Beginner",
    variables: ["Acid type", "Base type", "Concentration", "Volume"],
    description: "Run a virtual burette, watch the indicator turn and map the titration curve.",
    path: "/lab/titration",
  },
  {
    id: "gas-laws",
    name: "Gas Laws",
    field: "chemistry",
    subfield: "Thermodynamics",
    difficulty: "Beginner",
    variables: ["Pressure", "Temperature", "Volume", "n"],
    description: "Push the piston, heat the gas and graph P–V, V–T and P–T relationships.",
    path: "/lab/gas-laws",
  },
  {
    id: "molecular-structure",
    name: "Molecular Structure",
    field: "chemistry",
    subfield: "Structural chemistry",
    difficulty: "Beginner",
    variables: ["Molecule", "View mode"],
    description: "Build molecules in 3D and inspect VSEPR geometry, bond angles and lengths.",
    path: "/lab/molecular-structure",
  },
  {
    id: "chem-spectroscopy",
    name: "Spectroscopy (Chemical)",
    field: "chemistry",
    subfield: "Analytical chemistry",
    difficulty: "Intermediate",
    variables: ["Element", "Excitation"],
    description: "Emission spectra of elements and flame tests, linked to electron transitions.",
    path: "/lab/spectroscopy",
  },
  {
    id: "thermochemistry",
    name: "Thermochemistry",
    field: "chemistry",
    subfield: "Thermodynamics",
    difficulty: "Intermediate",
    variables: ["ΔH", "ΔS", "Temperature"],
    description:
      "Enthalpy, entropy and Gibbs free energy — when does a reaction become spontaneous?",
    path: "/lab/thermochemistry",
  },
  {
    id: "periodic-trends",
    name: "Periodic Trends",
    field: "chemistry",
    subfield: "Atomic structure",
    difficulty: "Beginner",
    variables: ["Property", "Element"],
    description:
      "Interactive periodic table colour-mapped by radius, ionisation energy and electronegativity.",
    path: "/lab/periodic-trends",
  },
  {
    id: "electrochemistry",
    name: "Electrochemistry",
    field: "chemistry",
    subfield: "Electrochemistry",
    difficulty: "Intermediate",
    variables: ["Half cells", "Concentration", "Temperature"],
    description: "Assemble galvanic cells and compute EMF with the Nernst equation.",
    path: "/lab/electrochemistry",
  },
  {
    id: "reaction-mechanisms",
    name: "Reaction Mechanisms",
    field: "chemistry",
    subfield: "Collision theory",
    difficulty: "Intermediate",
    variables: ["Temperature", "Activation energy", "Particle count"],
    description:
      "Particle-level collision simulator: 2H₂ + O₂ → 2H₂O with collision energy tracking.",
    path: "/lab/reaction-visualizer",
  },
];

export const getSimulation = (id: string) => SIMULATIONS.find((s) => s.id === id);
