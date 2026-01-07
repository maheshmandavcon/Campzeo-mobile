/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  presets: [require("nativewind/preset")], // Required for NativeWind
  theme: {
    extend: {
      fontSize: {
        '5xl': 48,
        '6xl': 60,
        '7xl': 72,
        '8xl': 90,
        '9xl': 108,
      },
    },
  },
  plugins: [],
};
