# Astra Science Lab

Build a polished, interactive web application called ASTRA LAB — AI Science Laboratory.

The website should be an advanced virtual science laboratory focused primarily on astrophysics, astronomy, physics, and chemistry. It should feel like a real scientific research environment rather than a generic educational website.

The core idea is:

“Run the experiment. Change the physics. Observe the universe.”

The user should be able to select a simulation, manipulate scientifically meaningful parameters, run experiments, collect measurements, visualize data, and ask an AI science assistant to explain what is happening.

1. OVERALL DESIGN

Create a premium, futuristic scientific interface.

Visual style:

Dark space-laboratory aesthetic

Near-black / deep navy background

Subtle stars and scientific grid patterns

White/light-grey primary text

Cyan/blue/violet scientific accents

Glassmorphism used sparingly

Thin borders

Soft glows

Smooth animations

Professional typography

Minimal clutter

Do NOT make it look like a gaming dashboard.

It should resemble a combination of:

NASA mission control

university physics laboratory

modern scientific visualization software

astronomy research software

high-end AI interface

The interface must remain highly readable and functional.

Responsive design:

Desktop-first

Tablet compatible

Mobile compatible

Use smooth transitions between pages and simulation states.

2. LANDING PAGE

Create a cinematic landing page.

Hero title:

ASTRA LAB

Subtitle:

An interactive laboratory for exploring the physics and chemistry of the universe.

Supporting text:

“Simulate stars, black holes, planetary systems, spectra, chemical reactions and more. Change the parameters. Run the experiment. Analyse the data.”

Primary buttons:

ENTER LAB

EXPLORE SIMULATIONS

Hero visual:
Create an animated scientific visualization showing a star evolving while surrounding particles, spectral lines and orbital trajectories subtly move.

Add small floating scientific labels such as:

STELLAR MASS
TEMPERATURE
LUMINOSITY
METALLICITY
ORBITAL VELOCITY

3. MAIN NAVIGATION

Create a persistent navigation bar/sidebar containing:

Home

Laboratory

Astrophysics

Chemistry

Experiments

Data

AI Scientist

Learn

Saved Experiments

The active section should be clearly highlighted.

4. LABORATORY DASHBOARD

The main laboratory page should contain simulation cards.

Categories:

ASTROPHYSICS

Stellar Evolution

Black Hole

Orbital Mechanics

Exoplanet Transit

Gravitational Waves

Spectroscopy

Galaxy Formation

Kepler's Laws

Hertzsprung–Russell Diagram

Cosmology

CHEMISTRY

Reaction Kinetics

Chemical Equilibrium

Acid–Base Titration

Gas Laws

Molecular Structure

Spectroscopy

Thermochemistry

Periodic Trends

Electrochemistry

Reaction Mechanisms

Each simulation card should contain:

Interactive preview

Difficulty

Relevant scientific field

Variables that can be manipulated

Short description

“RUN EXPERIMENT” button

5. ASTROPHYSICS SIMULATION: STELLAR EVOLUTION

Build a genuinely interactive stellar evolution simulation.

Allow the user to select:

Initial stellar mass:
0.1–100 solar masses

Metallicity:
0–0.05

Initial rotation:
0–90% of critical rotation

The simulation should visually show the star changing through stages such as:

Protostar

Main Sequence

Red Giant

Helium Burning

Planetary Nebula / Supernova

White Dwarf / Neutron Star / Black Hole

For appropriate masses, use scientifically sensible evolutionary pathways.

Display real-time values:

Mass
Radius
Core temperature
Surface temperature
Luminosity
Age
Composition
Fusion reaction
Estimated lifetime

Include an HR diagram that updates as the star evolves.

Allow the user to pause, resume, accelerate time and step through the evolution.

Add a “PHYSICS” panel explaining which physical processes are currently occurring.

6. BLACK HOLE LAB

Create an interactive black-hole simulation.

Parameters:

Black-hole mass
Spin
Distance from observer
Accretion disk temperature
Inclination

Visualize:

Event horizon

Accretion disk

Relativistic beaming

Gravitational lensing

Photon trajectories

Time dilation concept

Include controls for:

PAUSE
RESET
CHANGE MASS
CHANGE SPIN
TRACE PHOTONS

Display scientifically meaningful calculations such as:

Schwarzschild radius
Gravitational timescale
Orbital velocity
Approximate ISCO radius

Add a toggle:

NEWTONIAN VIEW
vs
RELATIVISTIC VIEW

The visualization should clearly demonstrate why Newtonian physics becomes inadequate near a black hole.

7. GRAVITATIONAL-WAVE LAB

Create a gravitational-wave simulator.

Allow the user to configure a binary system:

Mass 1
Mass 2
Initial separation
Orbital eccentricity
Distance from Earth
Inclination

Generate a simulated inspiral waveform.

Display:

Binary orbit animation

Separation vs time

Orbital frequency

Gravitational-wave strain

Frequency evolution

Spectrogram

Create a waveform graph with zoom and pan.

Include controls:

START
PAUSE
RESET
CHANGE PARAMETERS

Add a button:

DETECT SIGNAL

This should simulate noisy detector data and allow the user to see how a gravitational-wave signal emerges from noise.

Include:

Raw detector signal
Filtered signal
Matched-filter output
Signal-to-noise ratio

Make the system visually inspired by real gravitational-wave astronomy, without claiming to reproduce a professional detector pipeline exactly.

8. EXOPLANET TRANSIT LAB

Create a simulation where the user observes a star and detects an orbiting exoplanet.

Parameters:

Planet radius
Star radius
Orbital period
Orbital inclination
Planet distance
Star temperature

Animate the planet crossing the stellar disk.

Generate the corresponding light curve.

Show:

Flux
Time
Transit depth
Period
Estimated planet radius

Add an automated detection mode that attempts to recover the transit parameters from the generated data.

Give the user noisy data as an optional difficulty mode.

9. SPECTROSCOPY LAB

Create an interactive spectroscopy laboratory.

Allow users to select an object:

Hydrogen cloud

Sun-like star

Hot star

Cool star

Nebula

Exoplanet atmosphere

Generate a realistic-looking spectrum.

Allow the user to alter:

Temperature
Composition
Velocity
Pressure

Visualize absorption/emission lines.

Include common spectral lines such as:

Hydrogen
Helium
Sodium
Calcium
Oxygen

Add Doppler-shift controls.

When the user changes radial velocity, shift the spectral lines appropriately.

Show:

Rest wavelength
Observed wavelength
Radial velocity

Include an AI explanation of how astronomers use spectroscopy to determine chemical composition and velocity.

10. ORBITAL MECHANICS LAB

Create a 2D/3D orbital mechanics simulator.

Objects:

Sun
Earth
Moon
Custom planet
Custom star
Binary system

Allow manipulation of:

Mass
Initial velocity
Initial position
Orbital eccentricity
Inclination

Show:

Trajectory
Velocity vector
Acceleration vector
Orbital period
Kinetic energy
Potential energy
Total mechanical energy

Include toggles for:

Velocity vectors
Force vectors
Orbital path
Energy graphs

Add a “BREAK THE ORBIT” mode where users can increase velocity and observe the transition from bound orbit to escape trajectory.

11. CHEMISTRY LAB

Create a separate chemistry laboratory.

It should not just display molecules.

The user should be able to actually conduct virtual experiments.

Main chemistry simulations:

Reaction Kinetics

Allow changing:

Temperature
Concentration
Catalyst
Activation energy

Display:

Concentration vs time

Reaction rate

Particle collision visualization

Arrhenius relationship

Chemical Equilibrium

Example:

N₂ + 3H₂ ⇌ 2NH₃

Allow users to modify:

Temperature
Pressure
Concentration

Show the equilibrium shifting dynamically.

Explain Le Chatelier's principle through the simulation.

Acid–Base Titration

Allow selection of:

Strong acid
Strong base
Weak acid
Weak base

Provide virtual burette and flask.

Show:

pH
Volume added
Indicator colour
Titration curve

Gas Laws

Create an interactive gas container.

Variables:

Pressure
Temperature
Volume
Particle number

Allow the user to manipulate the piston and temperature.

Show particles moving faster/slower based on temperature.

Graph:

P vs V
V vs T
P vs T

Molecular Lab

Allow users to construct simple molecules.

Examples:

H₂
O₂
N₂
H₂O
CO₂
CH₄
NH₃
C₂H₅OH

Show:

3D molecular structure
Bond angles
Bond lengths
Molecular geometry
Electron-pair geometry

Use scientifically appropriate molecular geometry.

12. CHEMICAL REACTION VISUALIZER

Create a particle-level reaction simulator.

For example:

2H₂ + O₂ → 2H₂O

Display individual molecules moving and colliding.

Only allow reactions when appropriate collision conditions are met.

Show:

Temperature
Collision energy
Successful collisions
Unsuccessful collisions
Reaction rate

Add a slider for activation energy.

The user should visually understand collision theory.

13. EXPERIMENT BUILDER

Create a system where users can design their own experiments.

Interface:

VARIABLES
↓
INITIAL CONDITIONS
↓
RUN EXPERIMENT
↓
MEASUREMENTS
↓
GRAPH
↓
CONCLUSION

Allow users to select independent and dependent variables.

Automatically generate graphs.

Allow exporting experimental data as CSV.

Include:

Experiment name
Hypothesis
Variables
Method
Results
Graph
Conclusion

14. DATA ANALYSIS LAB

Create a scientific data-analysis interface.

Users should be able to:

View datasets

Plot graphs

Zoom

Select axes

Fit curves

Calculate gradients

Calculate averages

Calculate uncertainty

Compare datasets

Identify outliers

Include regression options:

Linear
Polynomial
Exponential
Power law

Display equations and R² where appropriate.

15. AI SCIENTIST

Create an AI assistant called:

ASTRA

ASTRA should behave like a scientific research assistant.

It should NOT simply answer questions.

It should understand the current simulation.

For example, if the user is running a black-hole experiment, ASTRA should know:

Current black-hole mass
Spin
Simulation time
Relevant measurements
Current graphs
Experimental conditions

The interface should include:

ASK ASTRA

Example questions:

“Why is the orbital frequency increasing?”

“What happens if I double the mass?”

“Why does the spectrum shift?”

“What does this graph tell me?”

“Which variable should I change next?”

“What physical law explains this?”

ASTRA should provide explanations at several levels:

GCSE
A-level
University
Advanced

Default to A-level/university-level scientific explanations where appropriate.

16. AI EXPERIMENT INTERPRETATION

After completing an experiment, add:

ANALYSE WITH ASTRA

ASTRA should examine the generated data and produce:

Observation
Relevant equation
Physical explanation
Possible sources of error
Suggested next experiment

Do not fabricate measurements.

Only use values actually generated by the simulation.

17. SCIENTIFIC EQUATIONS

Create an expandable equation panel.

For each simulation, show relevant equations.

Examples:

Newton's law of gravitation

F = GMm/r²

Kepler's third law

T² ∝ a³

Schwarzschild radius

rₛ = 2GM/c²

Doppler shift

Δλ/λ ≈ v/c

Stefan–Boltzmann law

L = 4πR²σT⁴

Arrhenius equation

k = Ae^(-Ea/RT)

Ideal gas law

PV = nRT

Make equations visually formatted and allow users to click an equation to see what every symbol means.

18. EXPERIMENT DIFFICULTY

Each simulation should have:

BEGINNER
INTERMEDIATE
ADVANCED
RESEARCH

Research mode should remove some guidance and give the user an open-ended scientific question.

Example:

Can you determine the mass ratio of a binary system using only its simulated gravitational-wave signal?

The system should give the user data but not immediately reveal the answer.

19. CHALLENGES

Create a section called:

SCIENTIFIC CHALLENGES

Examples:

Challenge 01 — Find the Exoplanet

Given noisy stellar brightness data, determine whether a planet is present.

Challenge 02 — Identify the Star

Use a spectrum to determine the star's temperature and composition.

Challenge 03 — Save the Orbit

Adjust initial velocity so that a spacecraft reaches a stable orbit.

Challenge 04 — Find the Black Hole

Infer black-hole mass from an orbital system.

Challenge 05 — Reaction Rate

Determine the activation energy from experimental data.

Challenge 06 — Gravitational Wave

Recover a binary merger signal from detector noise.

Give each challenge generated datasets and measurable objectives.

20. SAVED EXPERIMENTS

Allow users to save experiments.

Each saved experiment should contain:

Experiment name
Simulation
Parameters
Results
Graphs
Date
Notes

Allow:

OPEN
DUPLICATE
DELETE
EXPORT

Persist data locally using localStorage or IndexedDB.

No login should be required.

21. LEARNING MODE

Create a scientific learning section.

Organize it into:

ASTROPHYSICS

Stars

Black Holes

Galaxies

Cosmology

Gravitational Waves

Spectroscopy

Exoplanets

Orbital Mechanics

CHEMISTRY

Atomic Structure

Bonding

Thermodynamics

Kinetics

Equilibrium

Acids and Bases

Spectroscopy

Electrochemistry

Each topic should connect directly to relevant simulations.

For example:

BLACK HOLES → OPEN BLACK HOLE LAB

SPECTROSCOPY → OPEN SPECTROSCOPY LAB

REACTION KINETICS → OPEN KINETICS LAB

22. SCIENTIFIC ACCURACY

This is extremely important.

Do not make the simulations purely decorative.

Use real equations and physically meaningful relationships wherever practical.

Clearly distinguish:

Exact analytical calculations

Numerical approximations

Simplified educational models

Add a small “MODEL ASSUMPTIONS” panel to simulations.

Example:

“This simulation assumes a non-rotating spherical body and neglects atmospheric drag.”

The goal is to teach actual scientific reasoning.

23. INTERACTIVE GRAPHING

Graphs should be a major component of the application.

Use professional interactive charts.

Requirements:

Zoom

Pan

Hover values

Reset zoom

Multiple datasets

Toggle datasets

Axis labels

Units

Scientific notation

Graphs should update live when simulation parameters change.

24. UNITS

Use proper SI units.

Examples:

m
kg
s
K
Pa
J
W
mol
Hz
m/s
N

For astronomy, also allow:

Solar masses
Solar radii
AU
parsecs
light-years

Show the SI equivalent when hovering over an astronomical unit.

25. 3D VISUALIZATION

Where appropriate, use WebGL / Three.js.

Use 3D for:

Molecular structures

Orbital systems

Stellar objects

Black-hole lensing

Galaxy structures

Include:

Orbit camera
Zoom
Pan
Reset camera

Keep performance reasonable.

26. PERFORMANCE

The application must remain responsive.

Use:

Web Workers for heavy calculations

requestAnimationFrame for animations

efficient numerical calculations

lazy loading

modular simulation architecture

Do not run expensive calculations on the main UI thread unnecessarily.

27. TECHNICAL ARCHITECTURE

Use a modern web stack.

Prefer:

React
TypeScript
Vite
Tailwind CSS
Three.js / React Three Fiber
Recharts or another interactive graphing library
KaTeX or MathJax for equations

Use modular components.

Each simulation should have its own module so that additional simulations can easily be added later.

Suggested architecture:

/src
/components
/simulations
/astrophysics
stellarEvolution
blackHole
gravitationalWaves
orbitalMechanics
spectroscopy
exoplanets
/chemistry
kinetics
equilibrium
titration
gasLaws
molecules
/ai
/data
/experiments
/graphs
/utils

28. OFFLINE-FIRST FUNCTIONALITY

The core simulations should work without an internet connection.

Do not make the simulations dependent on external APIs.

AI features should have a clear separation between:

LOCAL SCIENCE ENGINE
and
OPTIONAL AI MODEL

If no AI API is available, provide a deterministic local fallback explanation system based on the current simulation state.

The simulations themselves must continue working without AI.

29. HOME DASHBOARD

The dashboard should display:

WELCOME TO ASTRA LAB

Then:

ACTIVE EXPERIMENT
RECENT EXPERIMENTS
SCIENTIFIC CHALLENGES
DISCOVER A SIMULATION
ASTRA AI

Also show a rotating “Science Fact” panel.

Examples:

“Stars spend most of their lives on the main sequence.”

“Gravitational waves stretch and compress spacetime.”

“Spectral lines can reveal the composition and velocity of distant objects.”

“Chemical equilibrium is dynamic, not static.”

30. EASTER EGGS

Add subtle scientific Easter eggs.

Examples:

Pulsar mode

Voyager-style terminal

Random scientific quotes

Hidden constants

Periodic-table interaction

LIGO-inspired detector visualization

Mini solar-system simulator

Keep them subtle and scientifically relevant.

31. ACCESSIBILITY

Include:

Keyboard navigation

Clear contrast

Reduced motion option

Tooltips

Screen-reader labels

Avoid relying solely on colour

32. FINAL QUALITY BAR

The finished application should feel like a real virtual science laboratory, not a school project.

The most important features are:

Scientific accuracy

Deep interactivity

Excellent simulations

Real-time graphs

Meaningful parameter manipulation

AI contextual explanations

Experimental workflow

Data analysis

Beautiful scientific visualization

Modular architecture for future expansion

Prioritize functionality over decorative effects.

Build the core simulations first and make them genuinely interactive before adding secondary visual effects.

The user should be able to spend significant time experimenting rather than simply clicking through pages.

When complete, the experience should communicate:

“I am actually doing science.”

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bcb0b91f-ea8c-4f45-b0c7-c16e66fa5642).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
