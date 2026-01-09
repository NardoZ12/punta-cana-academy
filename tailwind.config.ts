// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aquí definimos los colores oficiales de Punta Cana Academy
        pca: {
          blue: '#0056b3', // Un azul institucional fuerte (puedes cambiar este hex)
          black: '#0f172a', // Un negro elegante (no negro puro, para que se vea moderno)
          light: '#f8fafc', // Fondo claro
        }
      },
    },
  },
  plugins: [],
};
export default config;