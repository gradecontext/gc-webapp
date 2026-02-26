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
        accent: {
          50: "#EEFCF8",
          100: "#D5F7EE",
          200: "#AEF0DE",
          300: "#7AE4CA",
          400: "#36C9B8",
          500: "#30B5A6",
          600: "#2BA193",
          700: "#1E7D72",
          800: "#1A635B",
          900: "#174F49"
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
        glow: "0 0 0 1px rgba(43, 161, 147, 0.25), 0 8px 24px rgba(11, 12, 16, 0.35)",
        "glow-accent": "0 0 60px -15px hsl(173 58% 45% / 0.4)",
        panel: "0 12px 32px rgba(11, 12, 16, 0.08)"
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, hsl(173 58% 40%) 0%, hsl(173 58% 50%) 100%)",
        "radial-glow": "radial-gradient(circle at top, rgba(43, 161, 147, 0.18), transparent 60%)",
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
