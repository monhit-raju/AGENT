/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blueprint: {
          bg: "#0A1930",
          panel: "#10233F",
          panel2: "#152B4D",
          line: "#2A466E",
          cyan: "#63C7FF",
          cyanDim: "#3E7FA8",
          amber: "#F2B33D",
          coral: "#FF6B6B",
          ink: "#EAF2FF",
          muted: "#7C93B3",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(99,199,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,199,255,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};