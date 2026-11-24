/**
 * Función de Vercel: POST /api/chat.
 *
 * Vercel publica cada archivo de la carpeta api/ como una función de servidor.
 * GEMINI_API_KEY se configura en el panel de Vercel y solo existe en el servidor.
 * El manejador se crea una vez para que el límite por IP dure entre peticiones.
 */
import { createChatHandler } from '../server/chatHandler.js';

const handleChat = createChatHandler({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL,
});

export function POST(request) {
  return handleChat(request);
}
