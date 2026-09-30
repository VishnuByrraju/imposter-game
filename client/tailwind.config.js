/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#080711",
          800: "#0e0b1e",
          700: "#161232",
          600: "#211a47",
        },
        neon: {
          purple: "#a855f7",
          pink: "#ec4899",
          cyan: "#22d3ee",
          lime: "#a3e635",
          amber: "#fbbf24",
        },
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        pulseGlow: "pulseGlow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
