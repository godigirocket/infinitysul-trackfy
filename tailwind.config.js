/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        "bg-2":     "var(--bg-2)",
        surface:    "var(--surface)",
        "surface-2":"var(--surface-2)",
        "surface-3":"var(--surface-3)",
        text:       "var(--text)",
        muted:      "var(--text-2)",
        "muted-2":  "var(--text-3)",
        border:     "var(--border)",
        accent:     "#7c3aed",
        "accent-2": "#6d28d9",
        success:    "#22c55e",
        danger:     "#ef4444",
        warning:    "#f59e0b",
      },
      borderRadius: {
        sm:  "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md:  "var(--radius-md)",
        lg:  "var(--radius-lg)",
        xl:  "var(--radius-xl)",
        "2xl": "24px",
        "3xl": "32px",
      },
      fontFamily: {
        sans: ["Manrope", "var(--font-inter)", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs:    ["11px", { lineHeight: "16px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["14px", { lineHeight: "22px" }],
        lg:    ["16px", { lineHeight: "24px" }],
        xl:    ["18px", { lineHeight: "28px" }],
        "2xl": ["22px", { lineHeight: "32px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
        "5xl": ["48px", { lineHeight: "56px" }],
        "6xl": ["64px", { lineHeight: "72px" }],
      },
      boxShadow: {
        "glow-accent": "0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1)",
        "glow-success": "0 0 20px rgba(34,197,94,0.2)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
        "modal": "0 24px 80px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #7c3aed, #6d28d9)",
        "gradient-success": "linear-gradient(135deg, #22c55e, #16a34a)",
        "gradient-mesh": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(34,197,94,0.05), transparent)",
        "gradient-card": "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))",
        "gradient-hero": "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(124,58,237,0.2), transparent 60%)",
      },
      animation: {
        "shimmer": "shimmer 1.5s infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "counter": "counter 1s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(124,58,237,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(124,58,237,0.5), 0 0 50px rgba(124,58,237,0.15)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
