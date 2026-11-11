import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@/components/..." means "src/components/..." (shadcn relies on this)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The backend only accepts requests (CORS) from port 5173,
    // so fail loudly instead of silently moving to 5174.
    port: 5173,
    strictPort: true,
  },
})