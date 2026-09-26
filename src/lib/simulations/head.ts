import { getSimulation } from "./registry";

/** Standard per-simulation head() metadata built from the registry. */
export function labHead(id: string) {
  const s = getSimulation(id);
  const title = `${s?.name ?? "Simulation"} Simulator | ASTRA LAB`;
  const description = s?.description ?? "Interactive science simulation.";
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
