import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        ink: {
          900: "#0B0C10",
          800: "#12141A",
          700: "#191C24",
          600: "#232734",
          500: "#2D3344",
          400: "#3A4259",
          300: "#4B5574",
          200: "#6E7AA0",
          100: "#A5B1D6"
        },
        haze: {
          50: "#F4F6FB",
          100: "#E8EDF7",
          200: "#D7E0F2",
          300: "#C4D0EA",
          400: "#AAB9E0",
          500: "#8FA2D4"
        },
        mint: {
          400: "#59E0B0",
          500: "#35C89A",
          600: "#1FA27A"
        },
        ember: {
          400: "#F3A86B",
          500: "#EC7B44",
          600: "#D85A2A"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(89, 224, 176, 0.2), 0 8px 24px rgba(11, 12, 16, 0.45)",
        panel: "0 12px 32px rgba(11, 12, 16, 0.4)"
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at top, rgba(89, 224, 176, 0.18), transparent 60%)",
        "grid-lines": "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
