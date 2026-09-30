import { joyful } from "joyful";

// Separator unlikely to appear in any word (unit separator control char).
const SEP = "\u241F";

// Game-friendly categories drawn from the `joyful` word bank.
// Every word is lowercase, single-token and safe-for-work.
export const CATEGORIES = [
  { id: "animal", label: "Animals", emoji: "🐾" },
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "profession", label: "Professions", emoji: "👷" },
  { id: "sport", label: "Sports", emoji: "⚽" },
  { id: "transportation", label: "Transport", emoji: "🚗" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "city", label: "Cities", emoji: "🏙️" },
  { id: "color", label: "Colors", emoji: "🎨" },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function isValidCategory(id) {
  return id === "random" || CATEGORY_IDS.includes(id);
}

export function categoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function resolveCategory(id) {
  if (id && id !== "random" && CATEGORY_IDS.includes(id)) return id;
  return CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
}

/** Return `count` distinct random words from a category. */
export function drawWords(category, count) {
  const cat = resolveCategory(category);
  const out = joyful({
    pattern: Array(count).fill(cat),
    separator: SEP,
  }).split(SEP);
  return { category: cat, words: out };
}

/** Capitalize a single lowercase token for display. */
export function pretty(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Build a subtle hint for the "No Word" mode imposter. */
export function makeHint(word) {
  return `begins with “${word.charAt(0).toUpperCase()}” · ${word.length} letters`;
}
