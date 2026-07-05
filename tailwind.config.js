/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#102027",
        "muted-ink": "#61717A",
        canvas: "#F7F9FB",
        surface: "#FFFFFF",
        "surface-strong": "#F1F5F7",
        "surface-tinted": "#EAF3F2",
        primary: "#087F6A",
        "primary-dark": "#075E52",
        "accent-blue": "#3157D5",
        terracotta: "#B76345",
        marigold: "#D49A2A",
        due: "#B84352",
        border: "#E1E8EC",
        "success-wash": "#E7F5F0",
        "blue-wash": "#EAF0FF",
        "due-wash": "#FAEAED",
        "warm-wash": "#FBF0DD",
      },
      borderRadius: {
        ccSm: 6,
        ccMd: 10,
        ccLg: 16,
      },
      spacing: {
        ccXs: 4,
        ccSm: 8,
        ccMd: 12,
        ccLg: 16,
        ccXl: 22,
        ccXxl: 28,
      },
      fontSize: {
        ccTitle: 24,
        ccHeading: 18,
        ccBody: 15,
        ccSmall: 13,
        ccMicro: 12,
      },
    },
  },
  plugins: [],
};
