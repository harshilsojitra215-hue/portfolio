import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE=1 produces one self-contained index.html for sharing as a single artifact.
// It writes to dist-single/ rather than dist/, because the two builds are not
// interchangeable: the deployed site wants the split bundle, and a single-file build landing
// in dist/ silently replaces it with a 300 kB inlined page on the next deploy.
const singleFile = process.env.SINGLEFILE === '1'

export default defineConfig({
  base: './',
  plugins: singleFile ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: singleFile ? 'dist-single' : 'dist',
    emptyOutDir: true,
    assetsInlineLimit: singleFile ? 100000000 : 4096,
  },
})
