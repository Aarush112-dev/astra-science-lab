import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Atom, Flame, Eye, Thermometer, ShieldCheck } from "lucide-react";
import { Tex } from "@/components/lab/Equation";

export interface LifeCycleMapProps {
  currentStageCode: string;
  currentMass: number;
  onSelectStage: (mass: number, f: number) => void;
}

interface StageDetail {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  branch: string;
  jumpMass: number;
  jumpF: number;
  isActive: boolean;
  colorClass: string;
  summary: string;
  physicsMechanism: string;
  equations: { name: string; latex: string }[];
  thermodynamics: { label: string; value: string }[];
  observationalSignatures: string;
  astronomicalExamples: string;
}

export function LifeCycleMap({ currentStageCode, currentMass, onSelectStage }: LifeCycleMapProps) {
  const isCloud = currentStageCode === "cloud";
  const isProtostar = currentStageCode === "protostar";
  const isBrownDwarf = currentStageCode === "brown_dwarf";
  const isMS = currentStageCode === "main_sequence";
  const isRedGiant = currentStageCode === "red_giant";
  const isRedSupergiant = currentStageCode === "red_supergiant";
  const isPlanetaryNebula = currentStageCode === "planetary_nebula";
  const isSupernova = currentStageCode === "supernova";
  const isWhiteDwarf = currentStageCode === "white_dwarf";
  const isBlackDwarf = currentStageCode === "black_dwarf";
  const isNeutronStar = currentStageCode === "neutron_star";
  const isBlackHole = currentStageCode === "black_hole";

  const STAGES: StageDetail[] = [
    // 1. NEBULA & BOK GLOBULE
    {
      id: "cloud",
      badge: "☁️",
      title: "Molecular Cloud & Bok Globule",
      subtitle: "Jeans Gravitational Instability & Infall",
      branch: "1. Birth / Infall",
      jumpMass: currentMass,
      jumpF: 0.005,
      isActive: isCloud,
      colorClass: "border-primary text-primary",
      summary:
        "Cold, dense interstellar clouds of molecular hydrogen (H₂) and microscopic silicate/graphite dust grains undergo gravitational collapse once self-gravity overcomes thermal gas pressure.",
      physicsMechanism:
        "When cloud mass exceeds the Jeans Mass (M > M_J), thermal kinetic energy is insufficient to support the cloud against gravitational self-attraction. Submillimeter rotational transitions of CO molecules efficiently radiate away thermal energy, keeping the collapse isothermal in its initial stages.",
      equations: [
        {
          name: "Jeans Mass Criterion",
          latex:
            "M_{\\text{J}} = \\left(\\frac{5 k_B T}{G \\mu m_H}\\right)^{3/2} \\left(\\frac{3}{4\\pi \\rho_0}\\right)^{1/2}",
        },
        {
          name: "Free-Fall Timescale",
          latex:
            "t_{\\text{ff}} = \\sqrt{\\frac{3\\pi}{32 G \\rho_0}} \\approx 10^5 - 10^6\\,\\text{yr}",
        },
      ],
      thermodynamics: [
        { label: "Kinetic Temperature", value: "10 – 30 K" },
        { label: "Number Density (n)", value: "10³ – 10⁶ cm⁻³" },
        { label: "Extinction (A_V)", value: "> 10 – 25 mag" },
      ],
      observationalSignatures:
        "Deep optical absorption silhouettes against background starfields (e.g. Barnard 68), thermal submillimeter dust continuum emission (ALMA), and CO J=1-0 rotational line mapping.",
      astronomicalExamples: "Barnard 68, Taurus Molecular Cloud, Eagle Nebula (M16 Pillars).",
    },

    // 2. PROTOSTAR & ACCRETION DISK
    {
      id: "protostar",
      badge: "✨",
      title: "Protostar & Circumstellar Disk",
      subtitle: "Hayashi Track & Bipolar Outflows",
      branch: "1. Birth / Infall",
      jumpMass: currentMass,
      jumpF: 0.035,
      isActive: isProtostar,
      colorClass: "border-primary text-primary",
      summary:
        "A central hydrostatically stabilized core forms, fueled by ongoing infall from a Keplerian accretion disk and launching relativistic magnetocentrifugal Herbig-Haro jets.",
      physicsMechanism:
        "The collapsing core radiates Kelvin-Helmholtz gravitational potential energy, contracting vertically down the fully convective Hayashi track. Specific angular momentum conservation flattens infalling gas into a circumstellar disk. Early deuterium fusion ignites at T_core ≈ 10⁶ K.",
      equations: [
        {
          name: "Kelvin–Helmholtz Timescale",
          latex: "t_{\\text{KH}} = \\frac{G M^2}{R L} \\approx 10^7\\,\\text{yr}",
        },
        {
          name: "Deuterium Priming Reaction",
          latex: "^2\\text{H} + ^1\\text{H} \\to \\,^3\\text{He} + \\gamma + 5.49\\,\\text{MeV}",
        },
      ],
      thermodynamics: [
        { label: "Core Temperature", value: "10⁵ – 3×10⁶ K" },
        { label: "Infall Velocity", value: "10 – 50 km/s" },
        { label: "Bipolar Jet Speed", value: "100 – 400 km/s" },
      ],
      observationalSignatures:
        "Excess infrared and submillimeter flux from warm circumstellar dust (Class 0/I/II YSOs), P-Cygni spectral line profiles, and collimated Herbig-Haro bow shocks.",
      astronomicalExamples: "HH 211, T Tauri, HL Tauri protoplanetary disk.",
    },

    // 3. BROWN DWARF
    {
      id: "brown_dwarf",
      badge: "🟤",
      title: "Brown Dwarf (Failed Star)",
      subtitle: "Substellar Electron Degeneracy (M < 0.08 M☉)",
      branch: "2. Main Sequence",
      jumpMass: 0.05,
      jumpF: 0.35,
      isActive: isBrownDwarf,
      colorClass: "border-amber text-amber",
      summary:
        "Substellar objects with mass insufficient to achieve core temperatures required for sustained hydrogen fusion (M < 0.075 - 0.08 M☉). They cool indefinitely as degenerate spheres.",
      physicsMechanism:
        "Before the central core can reach the hydrogen ignition threshold (T ≈ 3×10⁶ K), quantum electron degeneracy pressure halts gravitational contraction. The object briefly burns primordial deuterium (and lithium if M > 0.06 M☉) before spending eternity cooling.",
      equations: [
        {
          name: "Non-Relativistic Degeneracy Pressure",
          latex: "P_e = \\frac{(3\\pi^2)^{2/3} \\hbar^2}{5 m_e} n_e^{5/3} \\propto \\rho^{5/3}",
        },
        {
          name: "Minimum Hydrogen Burning Mass",
          latex:
            "M_{\\text{min, MS}} \\approx 0.075 - 0.08\\,M_\\odot \\approx 75 - 80\\,M_{\\text{Jup}}",
        },
      ],
      thermodynamics: [
        { label: "Core Temperature", value: "< 3×10⁶ K" },
        { label: "Surface Temperature", value: "2500 K down to 250 K (Y dwarf)" },
        { label: "Central Density", value: "10² – 10³ g/cm³" },
      ],
      observationalSignatures:
        "Extremely low infrared luminosities, spectral classes L, T, and Y showing strong methane (CH₄), water (H₂O), and ammonia (NH₃) atmospheric absorption, with liquid iron and silicate clouds.",
      astronomicalExamples: "Gliese 229 B, Luhman 16 AB, WISE 0855-0714.",
    },

    // 4. MAIN SEQUENCE
    {
      id: "main_sequence",
      badge: "⭐",
      title: "Main Sequence (Core Hydrogen Fusion)",
      subtitle: "Hydrostatic Balance: p-p Chain & CNO Cycle",
      branch: "2. Main Sequence",
      jumpMass: currentMass < 0.08 ? 1.0 : currentMass,
      jumpF: 0.35,
      isActive: isMS,
      colorClass: "border-cyan text-cyan",
      summary:
        "The longest and most stable phase of stellar life, defined by hydrogen fusion in the core where gravitational collapse is strictly balanced by outward thermal and radiation pressure.",
      physicsMechanism:
        "Stars operate in exact hydrostatic and thermal equilibrium. For stars with M ≲ 1.3 M☉, the p-p chain dominates; for massive stars (M > 1.3 M☉), the catalytic CNO cycle dominates due to its extreme temperature dependence (ε_CNO ∝ T¹⁷).",
      equations: [
        {
          name: "Hydrostatic Equilibrium",
          latex: "\\frac{dP}{dr} = -\\frac{G M(r) \\rho(r)}{r^2}",
        },
        {
          name: "Net Hydrogen Fusion Energy",
          latex: "4\\,^1\\text{H} \\to \\,^4\\text{He} + 2e^+ + 2\\nu_e + 26.73\\,\\text{MeV}",
        },
      ],
      thermodynamics: [
        { label: "Core Temperature", value: "1.5×10⁷ K (Sun) to 4×10⁷ K (O-stars)" },
        { label: "Central Density", value: "100 g/cm³ (Sun) down to 5 g/cm³ (O-star)" },
        { label: "MS Lifetime", value: "10 Gyr (Sun) to 3 Myr (60 M☉)" },
      ],
      observationalSignatures:
        "Stable optical blackbody spectra with absorption lines classified along the Morgan-Keenan system (O, B, A, F, G, K, M) and tight locus on the Hertzsprung-Russell diagram.",
      astronomicalExamples: "The Sun (G2V), Sirius A (A1V), Vega (A0V), Rigel Kentaurus (G2V).",
    },

    // 5. RED GIANT
    {
      id: "red_giant",
      badge: "🔴",
      title: "Red Giant (Low/Medium Mass Progenitor)",
      subtitle: "Degenerate Helium Core & Core Flash (M < 8 M☉)",
      branch: "3. Post-MS Expansion",
      jumpMass: 1.5,
      jumpF: 0.82,
      isActive: isRedGiant,
      colorClass: "border-amber text-amber",
      summary:
        "Following core hydrogen exhaustion, the inert helium core contracts while hydrogen shell burning inflates the outer convective envelope by a factor of 100 to 300.",
      physicsMechanism:
        "According to the mirror principle, core contraction forces outer envelope expansion. In stars with M < 2 M☉, the electron-degenerate helium core ignites the triple-alpha reaction in an explosive thermal runaway (Helium Core Flash) before expanding onto the Horizontal Branch.",
      equations: [
        {
          name: "Triple-Alpha Fusion",
          latex: "3\\,^4\\text{He} \\to \\,^{12}\\text{C} + \\gamma + 7.27\\,\\text{MeV}",
        },
        {
          name: "Schönberg–Chandrasekhar Core Mass Limit",
          latex:
            "\\frac{M_{\\text{core}}}{M} \\approx 0.37 \\left(\\frac{\\mu_{\\text{env}}}{\\mu_{\\text{core}}}\\right)^2 \\approx 0.10",
        },
      ],
      thermodynamics: [
        { label: "Core Flash Temp", value: "≈ 10⁸ K" },
        { label: "Envelope Radius", value: "50 – 250 R☉" },
        { label: "Surface Temperature", value: "3000 – 4500 K" },
      ],
      observationalSignatures:
        "Deep red/orange coloration, low surface gravity (log g ≈ 1 - 2), prominent molecular absorption bands (TiO, CO), and giant stellar convective supergranulation.",
      astronomicalExamples: "Aldebaran (Alpha Tauri), Arcturus (Alpha Boötis), Pollux.",
    },

    // 6. RED SUPERGIANT
    {
      id: "red_supergiant",
      badge: "🔴",
      title: "Red Supergiant (High Mass Progenitor)",
      subtitle: "Concentric Onion-Skin Shell Fusion (M ≥ 8 M☉)",
      branch: "3. Post-MS Expansion",
      jumpMass: 18,
      jumpF: 0.84,
      isActive: isRedSupergiant,
      colorClass: "border-amber text-amber",
      summary:
        "Massive stars evolve into enormous supergiants, sequentially burning carbon, neon, oxygen, and silicon in concentric onion shells surrounding an inert iron core.",
      physicsMechanism:
        "Advanced burning stages proceed without electron degeneracy, burning at astronomical temperatures and accelerated timescales. Silicon burning completes in just ~1 day, leaving an iron core supported only by relativistic electron degeneracy pressure.",
      equations: [
        {
          name: "Carbon & Oxygen Shell Reactions",
          latex:
            "^{12}\\text{C} + ^{12}\\text{C} \\to \\,^{20}\\text{Ne} + \\alpha, \\quad ^{16}\\text{O} + ^{16}\\text{O} \\to \\,^{28}\\text{Si} + \\alpha",
        },
        {
          name: "Iron Endothermic Disintegration",
          latex: "^{56}\\text{Fe} + \\gamma \\to 13\\,^4\\text{He} + 4n - 124.4\\,\\text{MeV}",
        },
      ],
      thermodynamics: [
        { label: "Silicon Core Temp", value: "3.5×10⁹ K" },
        { label: "Silicon Burn Time", value: "≈ 1 day" },
        { label: "Photospheric Radius", value: "500 – 1500 R☉" },
      ],
      observationalSignatures:
        "Enormous optical diameters measurable by interferometry, high mass-loss superwinds (10⁻⁴ M☉/yr), and episodic dust-shrouded dimming events.",
      astronomicalExamples:
        "Betelgeuse (Alpha Orionis), Antares (Alpha Scorpii), VY Canis Majoris.",
    },

    // 7. PLANETARY NEBULA
    {
      id: "planetary_nebula",
      badge: "💨",
      title: "Planetary Nebula Shell",
      subtitle: "Thermal Pulse Envelope Ejection (M < 8 M☉)",
      branch: "3. Post-MS Expansion",
      jumpMass: 2.0,
      jumpF: 0.9,
      isActive: isPlanetaryNebula,
      colorClass: "border-emerald text-emerald",
      summary:
        "Pulsational thermal instabilities on the Asymptotic Giant Branch gently blow away the star's outer envelope, which is then photoionized by the exposed hot white dwarf nucleus.",
      physicsMechanism:
        "Radiation pressure on condensed dust grains drives steady superwinds (v ≈ 20-30 km/s). The emerging degenerate core (T_eff > 30,000 K) emits intense ionizing UV photons, creating distinct [O III] teal and H-alpha crimson emission shells.",
      equations: [
        {
          name: "Radiation Pressure on Dust",
          latex:
            "F_{\\text{rad}} = \\frac{L_* \\kappa_{\\text{dust}}}{4\\pi r^2 c} > g_{\\text{grav}}",
        },
        {
          name: "Forbidden Line Emission",
          latex:
            "[\\text{O III}]\\ \\lambda 500.7\\,\\text{nm}, \\quad [\\text{N II}]\\ \\lambda 658.4\\,\\text{nm}, \\quad \\text{H}\\alpha\\ \\lambda 656.3\\,\\text{nm}",
        },
      ],
      thermodynamics: [
        { label: "Nebula Expansion Speed", value: "20 – 40 km/s" },
        { label: "Central Star Temp", value: "50,000 – 150,000 K" },
        { label: "Nebula Lifespan", value: "≈ 20,000 – 50,000 yr" },
      ],
      observationalSignatures:
        "Brilliant emission-line spectra dominated by [O III] green/cyan and Hα/N II red rings, expanding bubbles, and complex bipolar or elliptical morphologies.",
      astronomicalExamples: "Ring Nebula (M57), Helix Nebula (NGC 7293), Cat's Eye Nebula.",
    },

    // 8. SUPERNOVA
    {
      id: "supernova",
      badge: "💥",
      title: "Type II / Ib / Ic Supernova",
      subtitle: "Core Collapse & Neutrino-Driven Rebound (M ≥ 8 M☉)",
      branch: "3. Post-MS Expansion",
      jumpMass: 15,
      jumpF: 0.89,
      isActive: isSupernova,
      colorClass: "border-rose text-rose",
      summary:
        "The catastrophic gravitational collapse of an iron core exceeding the Chandrasekhar limit, triggering a supersonic shockwave that detonates the star and ejects freshly synthesized heavy elements.",
      physicsMechanism:
        "Electron capture (p + e⁻ → n + ν_e) and photodisintegration trigger free-fall collapse of the iron core in 20 milliseconds. The core rebounds at nuclear saturation density (ρ ≈ 2.7×10¹⁴ g/cm³), launching an explosive shockwave revived by intense neutrino heating (10⁵⁸ neutrinos).",
      equations: [
        {
          name: "Electron Capture & Neutronization",
          latex:
            "p + e^- \\to n + \\nu_e \\quad (\\Delta E \\approx 10^{46}\\,\\text{J carried by neutrinos})",
        },
        {
          name: "Radioactive Decay Light Curve",
          latex:
            "^{56}\\text{Ni} \\xrightarrow{t_{1/2}=6.1\\,\\text{d}} \\,^{56}\\text{Co} \\xrightarrow{t_{1/2}=77.3\\,\\text{d}} \\,^{56}\\text{Fe}",
        },
      ],
      thermodynamics: [
        { label: "Peak Luminosity", value: "10⁹ – 10¹⁰ L☉" },
        { label: "Shock Velocity", value: "10,000 – 30,000 km/s (0.1 c)" },
        { label: "Neutrino Energy Share", value: "99% of total 10⁴⁶ J" },
      ],
      observationalSignatures:
        "Sudden optical surge outshining an entire galaxy, P-Cygni broad absorption profiles, persistent radioactive light-curve tails, and historical radio/X-ray expanding remnants.",
      astronomicalExamples: "SN 1987A (LMC), Crab Supernova (SN 1054), Cas A, Tycho's SN.",
    },

    // 9. WHITE DWARF & BLACK DWARF
    {
      id: "white_dwarf",
      badge: "⚪",
      title: "White Dwarf & Black Dwarf",
      subtitle: "Degenerate Electron Cooling & Crystallization",
      branch: "4. Final Remnant",
      jumpMass: 1.0,
      jumpF: 0.96,
      isActive: isWhiteDwarf || isBlackDwarf,
      colorClass: "border-violet text-violet",
      summary:
        "The ultra-dense, Earth-sized degenerate core left behind by stars with M < 8 M☉. Over hundreds of billions of years, it radiates its stored heat and crystallizes into an inert Black Dwarf.",
      physicsMechanism:
        "Supported against gravity exclusively by electron degeneracy pressure. Because degeneracy pressure is independent of temperature, the white dwarf cannot contract further and cools according to Mestel's cooling theory, eventually forming a carbon-oxygen crystalline lattice (cosmic diamond).",
      equations: [
        {
          name: "Chandrasekhar Upper Mass Limit",
          latex:
            "M_{\\text{Ch}} = \\frac{\\omega_3^0 \\sqrt{3\\pi}}{2} \\left(\\frac{\\hbar c}{G}\\right)^{3/2} \\left(\\frac{Y_e}{m_u}\\right)^2 \\approx 1.44\\,M_\\odot",
        },
        {
          name: "Mestel's Cooling Law",
          latex:
            "L \\propto t^{-7/2}, \\quad \\tau_{\\text{cool, black dwarf}} > 10^{15}\\,\\text{yr}",
        },
      ],
      thermodynamics: [
        { label: "Mean Density (ρ)", value: "≈ 10⁶ g/cm³ (1 ton / cm³)" },
        { label: "Radius Scale", value: "≈ 0.01 R☉ (Earth size)" },
        { label: "Surface Gravity", value: "≈ 10⁸ cm/s² (100,000 g)" },
      ],
      observationalSignatures:
        "Intense gravitational redshift of spectral lines, extreme Stark pressure broadening of hydrogen Balmer lines (DA white dwarfs), and high proper motion.",
      astronomicalExamples: "Sirius B, Procyon B, Van Maanen's Star.",
    },

    // 10. NEUTRON STAR & PULSAR
    {
      id: "neutron_star",
      badge: "⚡",
      title: "Neutron Star / Pulsar",
      subtitle: "Neutron Degeneracy & Relativistic Beams (8 ≤ M < 20 M☉)",
      branch: "4. Final Remnant",
      jumpMass: 14,
      jumpF: 0.96,
      isActive: isNeutronStar,
      colorClass: "border-cyan text-cyan",
      summary:
        "An extreme compact remnant with the mass of 1.4 to 2.1 Suns packed into a city-sized sphere of 11.5 km, spinning hundreds of times per second and radiating synchrotron lighthouse beams.",
      physicsMechanism:
        "Supported by neutron degeneracy pressure and short-range nuclear repulsion. Conservation of magnetic flux during collapse amplifies magnetic fields to 10⁸ - 10¹⁵ Gauss. Induced electric fields accelerate electron-positron pairs to emit beamed synchrotron radiation.",
      equations: [
        {
          name: "Tolman–Oppenheimer–Volkoff Equation",
          latex:
            "\\frac{dP}{dr} = -\\frac{G M \\rho}{r^2} \\left(1 + \\frac{P}{\\rho c^2}\\right) \\left(1 + \\frac{4\\pi r^3 P}{M c^2}\\right) \\left(1 - \\frac{2 G M}{r c^2}\\right)^{-1}",
        },
        {
          name: "Dipole Radiation Spin-Down Rate",
          latex:
            "\\dot{E} = \\frac{2 B_p^2 R^6 \\Omega^4}{3 c^3}, \\quad B_p \\approx 3.2\\times 10^{19} \\sqrt{P \\dot{P}}\\,\\text{G}",
        },
      ],
      thermodynamics: [
        { label: "Core Density", value: "≈ 5×10¹⁴ g/cm³ (> nuclear density)" },
        { label: "Radius", value: "≈ 11.5 km" },
        { label: "Magnetic Field", value: "10⁸ – 10¹⁵ G (Magnetars)" },
      ],
      observationalSignatures:
        "Extremely precise radio/gamma-ray pulses, pulsar wind nebulae (e.g. Crab Nebula heart), X-ray thermal hotspots, and gravitational wave signals during binary neutron star inspirals (GW170817).",
      astronomicalExamples: "Crab Pulsar (PSR B0531+21), Vela Pulsar, SGR 1806-20 (Magnetar).",
    },

    // 11. STELLAR BLACK HOLE
    {
      id: "black_hole",
      badge: "🕳️",
      title: "Stellar-Mass Black Hole",
      subtitle: "Gravitational Singularity & Kerr Metric (M ≥ 20 M☉)",
      branch: "4. Final Remnant",
      jumpMass: 30,
      jumpF: 0.96,
      isActive: isBlackHole,
      colorClass: "border-violet text-violet",
      summary:
        "When a collapsing star's core exceeds the Tolman-Oppenheimer-Volkoff limit (≈ 2.2 M☉), no force can halt gravity. The core collapses into an infinitesimal singularity enclosed by an Event Horizon.",
      physicsMechanism:
        "Described by the Kerr solution of Einstein's General Relativity. The escape velocity at the event horizon equals the speed of light c. Surrounding space exhibits frame-dragging (the Lense-Thirring effect), creating an ergosphere from which energy can be extracted via the Penrose process.",
      equations: [
        {
          name: "Schwarzschild Radius",
          latex:
            "r_s = \\frac{2 G M}{c^2} \\approx 2.95 \\left(\\frac{M}{M_\\odot}\\right)\\,\\text{km}",
        },
        {
          name: "Innermost Stable Circular Orbit (ISCO)",
          latex:
            "r_{\\text{ISCO}} = 3\\,r_s \\quad (\\text{Schwarzschild}), \\quad r_{\\text{ISCO}} = 0.5\\,r_s \\quad (\\text{Extremal Kerr } a^* = 1)",
        },
      ],
      thermodynamics: [
        { label: "Hawking Temperature", value: "≈ 6×10⁻⁸ (M☉/M) K" },
        { label: "Event Horizon Radius", value: "≈ 30 km (10 M☉) to 90 km (30 M☉)" },
        { label: "Surface Gravity", value: "Undefined (infinite redshift at r_s)" },
      ],
      observationalSignatures:
        "High-energy X-ray binary accretion disks with relativistic iron Kα emission lines, quasi-periodic oscillations (QPOs), relativistic jets, and gravitational wave chirps (e.g. GW150914).",
      astronomicalExamples: "Cygnus X-1, V404 Cygni, GRO J1655-40, GW150914 remnant.",
    },
  ];

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-cyan" />
          <span className="font-display font-semibold text-foreground text-sm">
            Astrophysical Life Cycle Schematic
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Click any stage dropout box for equations, thermodynamic parameters, and direct lab
          teleport.
        </div>
      </div>

      <Accordion type="multiple" className="w-full space-y-2">
        {STAGES.map((stg) => {
          return (
            <AccordionItem
              key={stg.id}
              value={stg.id}
              className={`rounded-lg border bg-card/60 px-3 transition-colors ${
                stg.isActive
                  ? "border-primary/80 bg-primary/10 shadow-sm shadow-primary/20"
                  : "border-border/60 hover:bg-card/90"
              }`}
            >
              <AccordionTrigger className="hover:no-underline py-2.5">
                <div className="flex flex-1 items-center justify-between pr-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-base">{stg.badge}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">{stg.title}</span>
                        {stg.isActive && (
                          <span className="rounded bg-primary/25 px-1.5 py-0.2 text-[10px] font-bold text-primary animate-pulse">
                            ACTIVE STAGE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{stg.subtitle}</div>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] text-muted-foreground/75 font-mono">
                    {stg.branch}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2 pb-4 space-y-3 font-sans border-t border-border/40 mt-1">
                {/* Summary */}
                <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                  {stg.summary}
                </p>

                {/* Physics Mechanism */}
                <div className="rounded-md border bg-background/60 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary">
                    <Atom className="size-3 text-cyan" />
                    <span>Astrophysical Governing Mechanism</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {stg.physicsMechanism}
                  </p>
                </div>

                {/* Governing Equations */}
                {stg.equations.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {stg.equations.map((eq, i) => (
                      <div key={i} className="rounded-md border bg-card p-2.5 space-y-1 font-mono">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {eq.name}
                        </span>
                        <Tex
                          tex={eq.latex}
                          block
                          className="text-xs text-foreground py-0.5 overflow-x-auto block"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Thermodynamic Parameters & Signatures */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border bg-background/60 p-2.5 space-y-1 font-mono text-xs">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber">
                      <Thermometer className="size-3 text-amber" />
                      <span>Physical Parameters</span>
                    </div>
                    {stg.thermodynamics.map((th, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between border-b border-border/30 py-0.5 text-[11px]"
                      >
                        <span className="text-muted-foreground">{th.label}:</span>
                        <span className="text-foreground font-semibold">{th.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border bg-background/60 p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-violet">
                      <Eye className="size-3 text-violet" />
                      <span>Observational Signatures</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {stg.observationalSignatures}
                    </p>
                    <div className="text-[10px] text-muted-foreground/80 font-mono">
                      <span className="font-semibold text-foreground/80">
                        Key Prototypical Examples:{" "}
                      </span>
                      {stg.astronomicalExamples}
                    </div>
                  </div>
                </div>

                {/* Jump to Stage Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Telemetry: f = {(stg.jumpF * 100).toFixed(1)}% · Target Progenitor:{" "}
                    {stg.jumpMass} M☉
                  </span>
                  <Button
                    size="sm"
                    variant={stg.isActive ? "default" : "glow"}
                    className="gap-1.5 font-mono text-xs"
                    onClick={() => onSelectStage(stg.jumpMass, stg.jumpF)}
                  >
                    <span>Simulate This Stage</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
