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
  build: {
    rolldownOptions: {
      output: {
        // React and the UI kit in their own files: they stay cached in the browser
        // when only our code changes. Charts stay with the (lazy) Reports page.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            { name: 'ui', test: /node_modules[\\/](radix-ui|@radix-ui|lucide-react|sonner)[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    // The backend only accepts requests (CORS) from port 5173,
    // so fail loudly instead of silently moving to 5174.
    port: 5173,
    strictPort: true,
  }, // the built app (npm run preview) uses the same port, so it works with the backend too
  preview: {
    port: 5173,
    strictPort: true,
  },
})
