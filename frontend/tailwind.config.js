/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: "#0A0D12",
          surface: "#11161D",
          raised: "#171D26",
          border: "rgba(255,255,255,0.07)",
          borderStrong: "rgba(255,255,255,0.14)",
        },
        ink: {
          DEFAULT: "#E6EBF2",
          muted: "#8B98AA",
          faint: "#5C6878",
        },
        amber: {
          glow: "#F2A93B",
          dim: "#A8762A",
        },
        foundry: "#4CC9F0",
        workiq: "#3DDC97",
        fabric: "#B58CFF",
        risk: {
          high: "#FB6B6B",
          medium: "#F2A93B",
          low: "#3DDC97",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(242,169,59,0.25), 0 0 24px rgba(242,169,59,0.12)",
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
}
