import type { Level } from "./types";

export const LEVEL_ORDER: Record<Level, number> = {
  elementary: 0,
  intermediate: 1,
  advanced: 2,
};

export const LEVEL_META: Record<
  Level,
  { en: string; zh: string; fr: string; emoji: string }
> = {
  elementary: { en: "Elementary", zh: "初级", fr: "Débutant", emoji: "🌱" },
  intermediate: { en: "Intermediate", zh: "中级", fr: "Intermédiaire", emoji: "🌿" },
  advanced: { en: "Advanced", zh: "高级", fr: "Avancé", emoji: "🌳" },
};
