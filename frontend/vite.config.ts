import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rootEnv = loadEnv(mode, process.cwd() + '/..', '')
  const cartoApiKey = env.CARTO_API_KEY || rootEnv.CARTO_API_KEY || process.env.CARTO_API_KEY || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/trace': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.CARTO_API_KEY': JSON.stringify(cartoApiKey),
    },
    envPrefix: ['VITE_', 'CARTO_'],
  }
})
