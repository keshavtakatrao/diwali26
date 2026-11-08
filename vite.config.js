import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function localShortener() {
  return {
    name: 'local-shortener-proxy',
    configureServer(server) {
      server.middlewares.use('/api/shorten', async (request, response) => {
        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.end()
          return
        }
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        for await (const chunk of request) body += chunk

        try {
          const { url } = JSON.parse(body)
          const destination = new URL(url)
          if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('Invalid URL')

          const endpoint = new URL('https://is.gd/create.php')
          endpoint.searchParams.set('format', 'simple')
          endpoint.searchParams.set('url', destination.href)
          const shortenerResponse = await fetch(endpoint)
          const shortened = (await shortenerResponse.text()).trim()
          if (!shortenerResponse.ok || !shortened.startsWith('https://is.gd/')) {
            throw new Error('Shortener unavailable')
          }

          response.setHeader('Content-Type', 'application/json')
          response.statusCode = 200
          response.end(JSON.stringify({ url: shortened }))
        } catch {
          response.statusCode = 502
          response.end(JSON.stringify({ error: 'URL shortener unavailable' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where share links point. Set VITE_SHARE_BASE_URL to choose; otherwise Vercel builds
  // use the project's production address, and anywhere else the page's own address.
  const vercelProduction = env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : ''
  const shareBaseUrl = env.VITE_SHARE_BASE_URL || vercelProduction

  return {
    plugins: [react(), localShortener()],
    server: {
      allowedHosts: ['.vercel.run'],
    },
    define: {
      'import.meta.env.VITE_SHARE_BASE_URL': JSON.stringify(shareBaseUrl),
    },
  }
})
