import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  safelist: [
    // Member avatar colors (dynamic from Supabase)
    "bg-purple-600", "bg-emerald-600", "bg-blue-600", "bg-orange-600",
    "bg-cyan-600", "bg-yellow-600", "bg-red-600", "bg-indigo-600",
    "bg-teal-600", "bg-violet-600", "bg-sky-600", "bg-amber-600",
    "bg-rose-600",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
