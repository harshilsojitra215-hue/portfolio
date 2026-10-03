import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour a harness-assigned port when one is provided.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
