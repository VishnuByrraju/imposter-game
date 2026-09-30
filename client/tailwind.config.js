/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        bg: "#0a0a0c",
        panel: {
          DEFAULT: "#141417",
          2: "#1b1b1f",
          3: "#232329",
        },
        line: "#2b2b33",
        ink: {
          DEFAULT: "#f3f0e8",
          dim: "#9a9aa4",
          faint: "#63636d",
        },
        danger: "#ff4d4d",
        safe: "#38d996",
        gold: "#e8b64c",
      },
      boxShadow: {
        hard: "4px 4px 0 0 rgba(0,0,0,0.55)",
        "hard-sm": "2px 2px 0 0 rgba(0,0,0,0.5)",
      },
      keyframes: {
        stampIn: {
          "0%": { transform: "scale(1.6) rotate(-12deg)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        stampIn: "stampIn 0.45s cubic-bezier(0.22,1,0.36,1) both",
        blink: "blink 1.4s steps(1) infinite",
      },
    },
  },
  plugins: [],
};
