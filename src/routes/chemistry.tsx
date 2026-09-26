import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/lab/Catalog";

export const Route = createFileRoute("/chemistry")({
  head: () => ({
    meta: [
      { title: "Chemistry Simulations | ASTRA LAB" },
      {
        name: "description",
        content:
          "Reaction kinetics, equilibrium, titration, gas laws, molecular structure, thermochemistry and electrochemistry simulations.",
      },
      { property: "og:title", content: "Chemistry Simulations | ASTRA LAB" },
      {
        property: "og:description",
        content: "Run titrations, perturb equilibria and measure activation energies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Catalog
      field="chemistry"
      title="Chemistry"
      kicker="Deck B · Matter"
      intro="Molecules, reactions and energy. Every bench here produces real, graphable data."
    />
  ),
});
