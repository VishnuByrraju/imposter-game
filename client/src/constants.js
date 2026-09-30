// Mirrors the server's category list (server/src/words.js) for display.
export const CATEGORIES = [
  { id: "random", label: "Surprise", emoji: "🎲" },
  { id: "animal", label: "Animals", emoji: "🐾" },
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "profession", label: "Jobs", emoji: "👷" },
  { id: "sport", label: "Sports", emoji: "⚽" },
  { id: "transportation", label: "Transport", emoji: "🚗" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "city", label: "Cities", emoji: "🏙️" },
  { id: "color", label: "Colors", emoji: "🎨" },
];

export function categoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export const MODES = {
  different: {
    id: "different",
    label: "Different Word",
    desc: "Imposters get a similar but different word",
    emoji: "🔀",
  },
  noword: {
    id: "noword",
    label: "No Word",
    desc: "Imposters only get the category and a hint",
    emoji: "🚫",
  },
};
