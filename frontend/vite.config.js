import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // We don't have route splitting so we increase the chunk size limit to avoid warnings in the console.
    chunkSizeWarningLimit: 800,
  },
})
