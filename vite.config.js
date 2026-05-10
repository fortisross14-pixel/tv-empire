import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: replace 'tv-empire' with your repo name.
// Local dev (npm run dev) ignores `base`; only matters for `npm run build`.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/tv-empire/' : '/',
})
