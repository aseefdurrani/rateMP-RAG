/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
      },
      colors: {
        customPrimary: "#2a9d8f",
        customPrimaryLight: "#fefae0",
        customBg: "#edf6f9",
        customAI: "#2b2d42",
        darkerPrimary: "#25897d",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
