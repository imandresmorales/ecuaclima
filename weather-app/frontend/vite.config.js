import { Readable } from 'node:stream'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createChatHandler } from './server/chatHandler.js'

/**
 * En `npm run dev` sirve POST /api/chat con el mismo código que la función de
 * Vercel, así no hace falta instalar la CLI de Vercel. La clave se lee de
 * .env.local aquí (Node) y nunca llega al navegador.
 */
const chatDevApi = ({ apiKey, model }) => ({
  name: 'ecuaclima-chat-dev-api',
  apply: 'serve',
  configureServer(server) {
    const handleChat = createChatHandler({ apiKey, model })
    server.middlewares.use('/api/chat', async (req, res) => {
      const headers = new Headers()
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
      }
      headers.set('x-real-ip', req.socket.remoteAddress || 'local')

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
      const response = await handleChat(
        new Request(`http://${req.headers.host}${req.originalUrl}`, {
          method: req.method,
          headers,
          body: hasBody ? Readable.toWeb(req) : undefined,
          duplex: 'half',
        })
      )
      res.statusCode = response.status
      response.headers.forEach((value, name) => res.setHeader(name, value))
      res.end(await response.text())
    })
  },
})

/**
 * ¿Se muestra la burbuja del chat? Solo donde existe /api/chat: en Vercel o en
 * `npm run dev` con GEMINI_API_KEY. En GitHub Pages no hay servidor, así que no.
 * VITE_ENABLE_CHAT=true|false fuerza el valor.
 */
const isChatEnabled = ({ command, mode, env }) => {
  if (env.VITE_ENABLE_CHAT === 'true' || env.VITE_ENABLE_CHAT === 'false') return env.VITE_ENABLE_CHAT === 'true'
  if (mode === 'test') return false
  if (process.env.VERCEL) return true
  return command === 'serve' && Boolean(env.GEMINI_API_KEY)
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Lee todas las variables de .env.local, pero solo se usan aquí (Node), no en el navegador
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // En GitHub Pages el sitio vive en /<repositorio>/; en local o Vercel es "/".
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), mode !== 'test' && chatDevApi({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL })],
    define: {
      __CHAT_ENABLED__: JSON.stringify(isChatEnabled({ command, mode, env })),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      globals: true,
    },
  }
})
