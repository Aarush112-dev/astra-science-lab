import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LabLayout } from "@/components/lab/LabLayout";
import { Panel, Readout } from "@/components/lab/Panels";
import type { Difficulty } from "@/lib/simulations/registry";
import { labHead } from "@/lib/simulations/head";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/lab/molecular-structure")({
  head: () => labHead("molecular-structure"),
  component: MolecularStructureLab,
});

interface AtomDef {
  element: "H" | "C" | "N" | "O";
  pos: [number, number, number]; // in Angstroms
}

interface BondDef {
  from: number;
  to: number;
  order: 1 | 2 | 3;
}

interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  molGeometry: string;
  electronGeometry: string;
  bondAngle: string;
  bondLength: string;
  dipoleMoment: string;
  hybridization: string;
  atoms: AtomDef[];
  bonds: BondDef[];
}

const ELEMENT_COLORS: Record<string, number> = {
  H: 0xe2e8f0, // White/Light Grey
  C: 0x334155, // Dark slate
  N: 0x3b82f6, // Blue
  O: 0xef4444, // Red
};

const ELEMENT_RADII: Record<string, number> = {
  H: 0.28,
  C: 0.44,
  N: 0.42,
  O: 0.4,
};

const MOLECULES: Record<string, MoleculeData> = {
  H2: {
    id: "H2",
    name: "Dihydrogen",
    formula: "H₂",
    molGeometry: "Linear",
    electronGeometry: "Linear",
    bondAngle: "180°",
    bondLength: "0.74 Å",
    dipoleMoment: "0.00 D (Nonpolar)",
    hybridization: "1s-1s σ bond",
    atoms: [
      { element: "H", pos: [-0.37, 0, 0] },
      { element: "H", pos: [0.37, 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },
  O2: {
    id: "O2",
    name: "Dioxygen",
    formula: "O₂",
    molGeometry: "Linear",
    electronGeometry: "Linear",
    bondAngle: "180°",
    bondLength: "1.21 Å",
    dipoleMoment: "0.00 D (Paramagnetic)",
    hybridization: "sp² (σ + π double bond)",
    atoms: [
      { element: "O", pos: [-0.605, 0, 0] },
      { element: "O", pos: [0.605, 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 2 }],
  },
  N2: {
    id: "N2",
    name: "Dinitrogen",
    formula: "N₂",
    molGeometry: "Linear",
    electronGeometry: "Linear",
    bondAngle: "180°",
    bondLength: "1.10 Å",
    dipoleMoment: "0.00 D (Nonpolar)",
    hybridization: "sp (Triple bond: 1σ + 2π)",
    atoms: [
      { element: "N", pos: [-0.55, 0, 0] },
      { element: "N", pos: [0.55, 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 3 }],
  },
  H2O: {
    id: "H2O",
    name: "Water",
    formula: "H₂O",
    molGeometry: "Bent",
    electronGeometry: "Tetrahedral (2 lone pairs)",
    bondAngle: "104.5°",
    bondLength: "0.96 Å",
    dipoleMoment: "1.85 D (Strongly Polar)",
    hybridization: "sp³",
    atoms: [
      { element: "O", pos: [0, 0, 0] },
      { element: "H", pos: [0.757, 0.586, 0] },
      { element: "H", pos: [-0.757, 0.586, 0] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },
  CO2: {
    id: "CO2",
    name: "Carbon Dioxide",
    formula: "CO₂",
    molGeometry: "Linear",
    electronGeometry: "Linear",
    bondAngle: "180°",
    bondLength: "1.16 Å",
    dipoleMoment: "0.00 D (Nonpolar, opposing dipoles)",
    hybridization: "sp",
    atoms: [
      { element: "C", pos: [0, 0, 0] },
      { element: "O", pos: [-1.16, 0, 0] },
      { element: "O", pos: [1.16, 0, 0] },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
    ],
  },
  CH4: {
    id: "CH4",
    name: "Methane",
    formula: "CH₄",
    molGeometry: "Tetrahedral",
    electronGeometry: "Tetrahedral",
    bondAngle: "109.5°",
    bondLength: "1.09 Å",
    dipoleMoment: "0.00 D (Nonpolar)",
    hybridization: "sp³",
    atoms: [
      { element: "C", pos: [0, 0, 0] },
      { element: "H", pos: [0.63, 0.63, 0.63] },
      { element: "H", pos: [-0.63, -0.63, 0.63] },
      { element: "H", pos: [-0.63, 0.63, -0.63] },
      { element: "H", pos: [0.63, -0.63, -0.63] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },
  NH3: {
    id: "NH3",
    name: "Ammonia",
    formula: "NH₃",
    molGeometry: "Trigonal Pyramidal",
    electronGeometry: "Tetrahedral (1 lone pair)",
    bondAngle: "107.8°",
    bondLength: "1.01 Å",
    dipoleMoment: "1.47 D (Polar)",
    hybridization: "sp³",
    atoms: [
      { element: "N", pos: [0, 0.15, 0] },
      { element: "H", pos: [0, -0.28, 0.94] },
      { element: "H", pos: [0.81, -0.28, -0.47] },
      { element: "H", pos: [-0.81, -0.28, -0.47] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  C2H5OH: {
    id: "C2H5OH",
    name: "Ethanol",
    formula: "C₂H₅OH",
    molGeometry: "Tetrahedral (C) & Bent (O)",
    electronGeometry: "Tetrahedral centres",
    bondAngle: "109.5° (C-C-H), 108.5° (C-O-H)",
    bondLength: "1.54 Å (C-C), 1.43 Å (C-O), 0.96 Å (O-H)",
    dipoleMoment: "1.69 D (Polar)",
    hybridization: "sp³ (C, C, O)",
    atoms: [
      { element: "C", pos: [-0.75, 0, 0] },
      { element: "C", pos: [0.75, 0, 0] },
      { element: "O", pos: [1.25, 1.2, 0] },
      { element: "H", pos: [2.2, 1.2, 0] }, // Hydroxyl H
      // Methyl H's
      { element: "H", pos: [-1.15, -0.52, 0.88] },
      { element: "H", pos: [-1.15, -0.52, -0.88] },
      { element: "H", pos: [-1.15, 1.02, 0] },
      // Methylene H's
      { element: "H", pos: [1.15, -0.52, 0.88] },
      { element: "H", pos: [1.15, -0.52, -0.88] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 }, // C-C
      { from: 1, to: 2, order: 1 }, // C-O
      { from: 2, to: 3, order: 1 }, // O-H
      { from: 0, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 1, to: 8, order: 1 },
    ],
  },
};

export function MolecularStructureLab() {
  const [diff, setDiff] = useState<Difficulty>("Beginner");
  const [molKey, setMolKey] = useState<string>("H2O");
  const [viewMode, setViewMode] = useState<"ball-and-stick" | "space-fill">("ball-and-stick");

  const mol = MOLECULES[molKey] ?? MOLECULES.H2O;
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020308);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    dirLight2.position.set(-5, -5, -3);
    scene.add(dirLight2);

    // Group for the molecule
    const molGroup = new THREE.Group();

    // Add Atoms
    const atomRadiusMult = viewMode === "space-fill" ? 2.2 : 1.0;
    mol.atoms.forEach((a) => {
      const radius = (ELEMENT_RADII[a.element] ?? 0.3) * atomRadiusMult;
      const geo = new THREE.SphereGeometry(radius, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: ELEMENT_COLORS[a.element] ?? 0xcccccc,
        roughness: 0.25,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(a.pos[0], a.pos[1], a.pos[2]);
      molGroup.add(mesh);
    });

    // Add Bonds (only if ball and stick)
    if (viewMode === "ball-and-stick") {
      mol.bonds.forEach((b) => {
        const atomA = mol.atoms[b.from];
        const atomB = mol.atoms[b.to];
        if (!atomA || !atomB) return;

        const pA = new THREE.Vector3(...atomA.pos);
        const pB = new THREE.Vector3(...atomB.pos);
        const dir = new THREE.Vector3().subVectors(pB, pA);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

        const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, len, 16);
        const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
        const bondMesh = new THREE.Mesh(bondGeo, bondMat);

        bondMesh.position.copy(mid);
        bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        molGroup.add(bondMesh);
      });
    }

    scene.add(molGroup);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      molGroup.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [molKey, viewMode, mol]);

  const context = useMemo(
    () => ({
      simulationId: "molecular-structure",
      simulationName: `Molecular Lab (${mol.formula})`,
      parameters: {
        molecule: mol.formula,
        geometry: mol.molGeometry,
        electronPairs: mol.electronGeometry,
      },
      measurements: {
        bondAngle: mol.bondAngle,
        bondLength: mol.bondLength,
        dipoleMoment: mol.dipoleMoment,
        hybridization: mol.hybridization,
        numAtoms: mol.atoms.length,
      },
      notes: [
        `VSEPR Molecular Geometry: ${mol.molGeometry}.`,
        `Hybridization: ${mol.hybridization}.`,
      ],
    }),
    [mol],
  );

  return (
    <LabLayout
      simulationId="molecular-structure"
      difficulty={diff}
      onDifficultyChange={setDiff}
      context={context}
      toolbar={
        <>
          <Button
            size="sm"
            variant="lab"
            onClick={() =>
              setViewMode(viewMode === "ball-and-stick" ? "space-fill" : "ball-and-stick")
            }
          >
            Mode: {viewMode === "ball-and-stick" ? "Ball & Stick" : "Space Filling"}
          </Button>
          <Button size="sm" variant="lab" onClick={() => controlsRef.current?.reset()}>
            <RotateCcw className="size-3" /> Reset View
          </Button>
        </>
      }
      controls={
        <Panel title="Select Molecule">
          <div className="space-y-4">
            <div>
              <Label className="label-mono mb-1.5 block">Molecule</Label>
              <Select value={molKey} onValueChange={setMolKey}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H2">H₂ (Hydrogen gas)</SelectItem>
                  <SelectItem value="O2">O₂ (Oxygen gas)</SelectItem>
                  <SelectItem value="N2">N₂ (Nitrogen gas)</SelectItem>
                  <SelectItem value="H2O">H₂O (Water)</SelectItem>
                  <SelectItem value="CO2">CO₂ (Carbon dioxide)</SelectItem>
                  <SelectItem value="CH4">CH₄ (Methane)</SelectItem>
                  <SelectItem value="NH3">NH₃ (Ammonia)</SelectItem>
                  <SelectItem value="C2H5OH">C₂H₅OH (Ethanol)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border bg-background/50 p-3 text-xs space-y-1.5">
              <div className="label-mono text-primary">Atom Color Legend</div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-slate-200 inline-block" />
                <span className="font-mono text-muted-foreground">Hydrogen (H)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-slate-700 inline-block" />
                <span className="font-mono text-muted-foreground">Carbon (C)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-blue-500 inline-block" />
                <span className="font-mono text-muted-foreground">Nitrogen (N)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500 inline-block" />
                <span className="font-mono text-muted-foreground">Oxygen (O)</span>
              </div>
            </div>
          </div>
        </Panel>
      }
      side={
        <Panel title="Structural Parameters">
          <Readout label="Molecule" value={mol.name} tone="cyan" />
          <Readout label="Molecular Geometry" value={mol.molGeometry} tone="amber" />
          <Readout label="Electron Geometry" value={mol.electronGeometry} />
          <Readout label="Characteristic Angle" value={mol.bondAngle} tone="violet" />
          <Readout label="Bond Lengths" value={mol.bondLength} />
          <Readout label="Dipole Moment" value={mol.dipoleMoment} tone="emerald" />
          <Readout label="Central Hybridization" value={mol.hybridization} />
        </Panel>
      }
      equations={[
        {
          name: "VSEPR theory",
          latex: "\\text{Steric Number} = \\text{Bonded Atoms} + \\text{Lone Pairs}",
          symbols: [
            { symbol: "\\text{SN}", meaning: "steric number determining electron geometry" },
          ],
          kind: "exact",
        },
      ]}
      assumptions={[
        "Standard ground state equilibrium geometries from microwave and X-ray diffraction",
        "Valence Shell Electron Pair Repulsion (VSEPR) model",
      ]}
      physicsNotes={[
        "Lone pairs exert stronger electrostatic repulsion than bonded pairs, compressing bond angles (e.g., 104.5° in H₂O vs ideal 109.5° tetrahedral).",
        "Dipole moments represent vector sums of individual bond dipoles based on Pauling electronegativity differences.",
      ]}
    >
      <Panel
        title={`Interactive 3D Structure: ${mol.name} (${mol.formula}) — Click & drag to rotate`}
      >
        <div
          ref={mountRef}
          className="h-[460px] w-full cursor-grab active:cursor-grabbing rounded-lg overflow-hidden"
        />
      </Panel>
    </LabLayout>
  );
}
