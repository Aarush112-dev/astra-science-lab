import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/lab/Catalog";

export const Route = createFileRoute("/astrophysics")({
  head: () => ({
    meta: [
      { title: "Astrophysics Simulations | ASTRA LAB" },
      { name: "description", content: "Stellar evolution, black holes, orbits, exoplanet transits, gravitational waves, spectroscopy and cosmology simulations." },
      { property: "og:title", content: "Astrophysics Simulations | ASTRA LAB" },
      { property: "og:description", content: "Evolve stars, bend light around black holes and detect gravitational waves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Catalog field="astrophysics" title="Astrophysics" kicker="Deck A · The universe" intro="From the orbit of a single planet to the expansion of the cosmos. Change the physics and watch the consequences." />,
});
