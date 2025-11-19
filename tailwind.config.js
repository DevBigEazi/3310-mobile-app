/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./modals/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    fontSize: {
      xs: ["12px", "120%"],
      sm: ["14px", "120%"],
      base: ["16px", "120%"],
      lg: ["20px", "120%"],
      xl: ["24px", "120%"],
      "2xl": ["28px", "120%"],
      "3xl": ["32", "120%"],
      "4xl": ["40px", "120%"],
      "5xl": ["48px", "120%"],
    },
    extend: {
      fontFamily: {
        p_regular_400: ["Poppins-Regular", "sans-serif"],
        arcade: ["PressStart2P-Regular", "monospace"], // Game title, scores
        pixel_regular: ["PixelifySans-Regular", "monospace"], // Game UI, leaderboard
        pixel_medium: ["PixelifySans-Medium", "monospace"], // Game UI, leaderboard
        pixel_semibold: ["PixelifySans-SemiBold", "monospace"], // Game UI, leaderboard
        pixel_bold: ["PixelifySans-Bold", "monospace"], // Game UI, leaderboard
        terminal: ["VT323-Regular", "monospace"],
      },
      colors: {
        primary: "#0A0E27", // Deep black background
        secondary: "#00FFFF", // Cyan snake (neon glow)
        accent: "#00FF00", // Lime green (score numbers)
        warning: "#FFFF00", // Yellow (alerts, bonuses)
        destructive: "#FF0000", // Red (errors, game over)

        white: "#FFFFFF",
        grey: {
          DEFAULT: "#808080",
          100: "#C0C0C0",
          200: "#404040",
        },

        score: "#00FF00", // Leaderboard scores
        qualified: "#00FFFF", // "Qualified" badge
        reward: "#FFD700", // Gold for rewards
      },
    },
  },
  plugins: [],
};
