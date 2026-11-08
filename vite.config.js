import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where share links point. Set VITE_SHARE_BASE_URL to choose; otherwise Vercel builds
  // use the project's production address, and anywhere else the page's own address.
  const vercelProduction = env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : ''
  const shareBaseUrl = env.VITE_SHARE_BASE_URL || vercelProduction

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['.vercel.run'],
    },
    define: {
      'import.meta.env.VITE_SHARE_BASE_URL': JSON.stringify(shareBaseUrl),
    },
  }
})
