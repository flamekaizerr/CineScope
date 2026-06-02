import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function createProxyUrl(baseUrl, path, queryParams = {}) {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) {
    throw new Error('Missing or invalid "path" query parameter')
  }
  const url = new URL(`${baseUrl}${path}`)
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url
}

function createApiProxyPlugin(env) {
  const tmdbKey = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY
  const traktKey = env.TRAKT_CLIENT_ID || env.VITE_TRAKT_CLIENT_ID
  const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY

  return {
    name: 'cinescope-local-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tmdb', async (req, res) => {
        if (!tmdbKey) return sendJson(res, 500, { error: 'TMDB API key not configured' })
        try {
          const incoming = new URL(req.url || '/', 'http://localhost')
          const path = incoming.searchParams.get('path')
          incoming.searchParams.delete('path')
          const url = createProxyUrl('https://api.themoviedb.org/3', path, Object.fromEntries(incoming.searchParams))
          url.searchParams.set('api_key', tmdbKey)
          url.searchParams.set('language', url.searchParams.get('language') || 'en-US')
          const response = await fetch(url)
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await response.text())
        } catch (error) {
          sendJson(res, 500, { error: error.message || 'Failed to fetch from TMDB' })
        }
      })

      server.middlewares.use('/api/trakt', async (req, res) => {
        if (!traktKey) return sendJson(res, 500, { error: 'Trakt Client ID not configured' })
        try {
          const incoming = new URL(req.url || '/', 'http://localhost')
          const path = incoming.searchParams.get('path')
          incoming.searchParams.delete('path')
          const url = createProxyUrl('https://api.trakt.tv', path, Object.fromEntries(incoming.searchParams))
          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'trakt-api-version': '2',
              'trakt-api-key': traktKey,
            },
          })
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await response.text())
        } catch (error) {
          sendJson(res, 500, { error: error.message || 'Failed to fetch from Trakt' })
        }
      })

      server.middlewares.use('/api/gemini', async (req, res) => {
        if (!geminiKey) return sendJson(res, 500, { error: 'Gemini API key not configured' })
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
        try {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', async () => {
            const payload = body ? JSON.parse(body) : {}
            const model = payload.model || 'gemini-2.0-flash'
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: payload.contents || [],
                generationConfig: payload.generationConfig || {
                  temperature: 0.8,
                  maxOutputTokens: 2048,
                },
              }),
            })
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(await response.text())
          })
        } catch (error) {
          sendJson(res, 500, { error: error.message || 'Failed to fetch from Gemini' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), createApiProxyPlugin(env)],
  }
})
