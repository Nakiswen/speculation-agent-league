import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ethereal Glass 设计 token
        "sal-bg-from": "#080A0F",
        "sal-bg-to": "#12161F",
        "sal-cyan": "#00F0FF",
        "sal-violet": "#7000FF",
      },
      borderRadius: {
        // 玻璃态卡片圆角
        "glass": "1.5rem", // rounded-3xl equivalent
      },
      backdropBlur: {
        // 玻璃态模糊值
        "glass": "40px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
