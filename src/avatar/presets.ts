export type HairStyle = "short" | "long" | "buzz" | "bun";
export type TopStyle = "shirt" | "hoodie" | "blazer";

export interface Look {
  id: string;
  name: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topStyle: TopStyle;
  accent: string;
}

export const LOOKS: Look[] = [
  {
    id: "look-1",
    name: "Moss",
    skin: "#e8b48c",
    hair: "#5a4a3a",
    hairStyle: "short",
    top: "#3b7a57",
    topStyle: "shirt",
    accent: "#2f5d44",
  },
  {
    id: "look-2",
    name: "Lagoon",
    skin: "#c98860",
    hair: "#222b3a",
    hairStyle: "long",
    top: "#2e6f8e",
    topStyle: "hoodie",
    accent: "#20536c",
  },
  {
    id: "look-3",
    name: "Sunset",
    skin: "#a66f4f",
    hair: "#7a2c2c",
    hairStyle: "bun",
    top: "#c25b5b",
    topStyle: "blazer",
    accent: "#8f4141",
  },
  {
    id: "look-4",
    name: "Dusk",
    skin: "#6b4f42",
    hair: "#0f0f14",
    hairStyle: "buzz",
    top: "#4b3b6b",
    topStyle: "shirt",
    accent: "#372b50",
  },
  {
    id: "look-5",
    name: "Amber",
    skin: "#e0b088",
    hair: "#8a6b3f",
    hairStyle: "short",
    top: "#b07a2e",
    topStyle: "hoodie",
    accent: "#7d5720",
  },
  {
    id: "look-6",
    name: "Cloud",
    skin: "#d9b08c",
    hair: "#2b2b33",
    hairStyle: "bun",
    top: "#6b7a99",
    topStyle: "blazer",
    accent: "#4e5a73",
  },
];

export function getLook(id: string): Look {
  return LOOKS.find((l) => l.id === id) ?? LOOKS[0];
}