import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works on any host or sub-path (GitHub Pages, Vercel, Netlify).
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5183, strictPort: true },
})
