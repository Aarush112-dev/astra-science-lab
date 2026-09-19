export interface Challenge {
  id: string;
  code: string;
  title: string;
  brief: string;
  objective: string;
  simulationId: string;
  path: string;
  /** Hidden truth used to generate the dataset & check the answer */
  answerLabel: string;
}

export const CHALLENGES: Challenge[] = [
  { id: "exoplanet", code: "Challenge 01", title: "Find the Exoplanet", brief: "Given noisy stellar brightness data, determine whether a planet is present.", objective: "Enable noise mode, run automated detection, and report the recovered transit depth and period.", simulationId: "exoplanet-transit", path: "/lab/exoplanet-transit", answerLabel: "Transit depth (ppm)" },
  { id: "star", code: "Challenge 02", title: "Identify the Star", brief: "Use a spectrum to determine the star's temperature and composition.", objective: "From the continuum peak and line strengths, estimate T and identify at least three elements.", simulationId: "spectroscopy", path: "/lab/spectroscopy", answerLabel: "Temperature (K)" },
  { id: "orbit", code: "Challenge 03", title: "Save the Orbit", brief: "Adjust initial velocity so that a spacecraft reaches a stable orbit.", objective: "Find the speed that gives eccentricity < 0.05 at 1 AU; measure total energy.", simulationId: "orbital-mechanics", path: "/lab/orbital-mechanics", answerLabel: "Circular speed (km/s)" },
  { id: "blackhole", code: "Challenge 04", title: "Find the Black Hole", brief: "Infer black-hole mass from an orbital system.", objective: "Use the ISCO orbital frequency readout to back out the mass from f = c³/(2π·6^1.5·GM).", simulationId: "black-hole", path: "/lab/black-hole", answerLabel: "Mass (M☉)" },
  { id: "kinetics", code: "Challenge 05", title: "Reaction Rate", brief: "Determine the activation energy from experimental data.", objective: "Measure k at four temperatures, plot ln k vs 1/T in the Data lab, and read Ea from the gradient.", simulationId: "reaction-kinetics", path: "/lab/reaction-kinetics", answerLabel: "Ea (kJ/mol)" },
  { id: "gw", code: "Challenge 06", title: "Gravitational Wave", brief: "Recover a binary merger signal from detector noise.", objective: "Press DETECT SIGNAL, then adjust the template masses until the matched-filter SNR is maximised.", simulationId: "gravitational-waves", path: "/lab/gravitational-waves", answerLabel: "Chirp mass (M☉)" },
];
