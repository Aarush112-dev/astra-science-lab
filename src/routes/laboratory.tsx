import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/lab/Catalog";

export const Route = createFileRoute("/laboratory")({
  head: () => ({
    meta: [
      { title: "Laboratory — All Simulations | ASTRA LAB" },
      {
        name: "description",
        content:
          "Browse every astrophysics and chemistry simulation in ASTRA LAB and pick an experiment to run.",
      },
      { property: "og:title", content: "Laboratory — All Simulations | ASTRA LAB" },
      {
        property: "og:description",
        content: "Every experiment in one place: stars, orbits, spectra, reactions and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Catalog
      title="The Laboratory"
      kicker="All instruments"
      intro="Every simulation in ASTRA LAB. Each one is a working numerical model — change the inputs, measure the outputs, save your data."
    />
  ),
});
