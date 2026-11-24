# EcuaClima ⛅

[![CI](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml)

Full stack web app to check the **current weather in cities and provinces of Ecuador**, with city search, a province view, an interactive map and an **AI assistant** that answers questions in natural language using real data.

**[👉 Live demo](https://ecuaclima.vercel.app)** (try the chat bubble in the bottom-right corner) · 🇪🇸 [Leer en español](#-en-español)

## Features

- **AI weather assistant:** a chat bubble where you can ask *"Which city is the hottest right now?"* or *"Do I need an umbrella in Cuenca tomorrow?"*. The AI queries Open-Meteo through tools (*tool calling*) and every answer shows the **data used**, so the figures can be checked. See [AI assistant](#ai-assistant).
- **City search with autocomplete** for Ecuadorian cities (debounced, stale responses ignored).
- **Province view:** all 24 provinces with the weather of their main cantons.
- **Interactive map** built with Leaflet, with one marker per province.
- **Weather details:** temperature, feels-like, humidity, wind, pressure and a description of the condition (WMO codes).
- **English and Spanish (EN / ES):** English by default; the switch changes the whole app (views, map, cards, errors, page title and number format) and the choice is remembered between visits.
- **Light / dark mode**, also remembered.
- **Accessibility:** keyboard navigation, ARIA roles and status messages for screen readers.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Axios, React-Leaflet, Lucide React |
| Backend | Node.js, Express 5, Axios |
| AI | Google Gemini (REST API, free tier) with function calling, in a Vercel Function |
| Security | Helmet, restricted CORS, express-rate-limit, input validation, CSP |
| Testing | Vitest + Testing Library (frontend and chat), Jest + Supertest (backend) |
| CI/CD | GitHub Actions (CI) and Vercel (deployment) |
| Data | [Open-Meteo](https://open-meteo.com/) (free, no API key) |

## Architecture

```text
Browser (React)
   │
   ├── With VITE_API_URL ────► Express backend ──► Open-Meteo
   │                           (validation, CORS, rate limit)
   │
   ├── Without VITE_API_URL ─► Open-Meteo directly
   │                           (used by the live demo for search, provinces and map)
   │
   └── Chat ──► POST /api/chat (Vercel Function) ──► Gemini
                (the API key lives only here)     └──► Open-Meteo (tools)
```

The live demo is hosted on **Vercel**: the static site calls Open-Meteo directly from the browser (it needs no key), and the chat goes through a Vercel Function, the only place that knows the Gemini key. The Express backend is optional: it is the same data access as a classic REST API, for running with `VITE_API_URL`.

## AI assistant

### How it works

```text
1. Question: "Do I need an umbrella in Cuenca tomorrow?"
2. Call 1: Gemini gets the question, the rules and the list of tools,
           and asks for get_forecast("Cuenca", 2) → the server finds the coordinates
                                                    and queries Open-Meteo
3. Call 2: Gemini gets the data and answers     → the server checks the figures
4. The chat shows the answer + "Data used"
```

A **tool** is a server function that the AI can request by name. The AI **never calls the internet by itself**: it only says what it needs, and the server runs it and sends the data back.

| Tool | What the AI uses it for |
| --- | --- |
| `get_current_weather(city)` | Current weather in a city |
| `get_forecast(city, days)` | 1–7 day forecast (rain, highs and lows) |
| `get_provinces_weather(region?)` | Current weather in the 24 province capitals in **a single** request, sorted from hottest to coldest; can filter by region |

**Where do the coordinates come from?** First from the 75 cities the app already has (`src/data/ecuadorData.js`), so the AI and the app show exactly the same figures. Other places (e.g. Montañita) are looked up in Open-Meteo's free geocoding service, restricted to Ecuador.

### Design decisions

- **The AI does not invent figures.** The rules require it to use tool data only, and the server **checks** it: if the answer contains figures (°C, %, mm, km/h) that are not in the data, the chat shows a warning. While comparing models, one answered "15 °C in Quito" without calling any tool, and this check caught it.
- **Ask the AI only for what needs intelligence.** Understanding the question and writing the answer is the AI's job; finding coordinates and fetching data is the code's job. That's why tools take the city **name**: a question takes 2 Gemini calls instead of 3 (about 1,500 tokens instead of 3,500), and the AI cannot get coordinates wrong.
- **What doesn't need AI stays without AI.** Search, provinces and map don't use AI: they are faster, exact and free. The AI is only for open-ended questions that combine several steps.
- **Tools designed for the model.** `get_provinces_weather` exists so that "which city is the hottest?" is **one** call instead of 24.
- **The loop always ends.** At most 5 model calls and 10 tool calls per question; on the last call the model is not allowed to request more tools, so it answers with what it has.
- **Pinned model version** (`gemini-3.5-flash-lite`), chosen after comparing several: it answers in 2–3 s and stayed faithful to the data. It can be changed with `GEMINI_MODEL`.
- **No AI SDK:** the Gemini client is a few lines with `fetch`, so there are fewer dependencies to audit.
- **Observability:** each question logs the model, latency, model calls, tools used, tokens and whether the figures were verified. The user's text and IP are not logged.

### Chat security

- **The API key never reaches the browser.** It lives in a server environment variable (`GEMINI_API_KEY`, without the `VITE_` prefix) and is sent to Google in a header, not in the URL. An automated test and a check of the build confirm it.
- **Everything received is validated:** JSON only, up to 16 KB, questions up to 500 characters, history up to 10 messages with allowed roles only.
- **Same-site requests only** (`Origin` header) and a **per-IP limit** (15 questions every 10 minutes).
- **Errors without internal details:** the browser only gets a code (`RATE_LIMITED`, `AI_BUSY`, …); details stay in the server log.
- **Timeouts** on every external call and a total time budget per question, with one retry if Google is overloaded.
- **Resistant to malicious instructions:** the rules say to ignore requests to change them, and the tools only read public weather data (there is nothing the AI can modify).
- **No risk of charges:** the key is on the free tier, with no credit card. If someone abuses it, at worst the daily quota runs out and the chat answers "usage limit reached".
- **Security headers on Vercel** (`vercel.json`): Content-Security-Policy, `X-Frame-Options`, `nosniff`, `Referrer-Policy`.
- AI answers are rendered **as text**, never as HTML.

### Deploy on Vercel

1. On [vercel.com](https://vercel.com), **Add New → Project** and import this repository.
2. Set **Root Directory** to `weather-app/frontend`. Vercel detects Vite automatically.
3. Under **Environment Variables**, add `GEMINI_API_KEY` with your key from [Google AI Studio](https://aistudio.google.com/apikey).
4. **Deploy.** The `api/chat.js` function is deployed automatically and the chat appears on the site.

After that, every push to `main` deploys to production automatically, and every pull request gets its own preview deployment. Previews are protected by Vercel Authentication, so only the team can use the chat there (and spend the AI quota).

## Security and best practices

- **Input validation:** coordinates must be numbers inside Ecuador (Galápagos included), text is trimmed to 100 characters and the language parameter only accepts `en` or `es`.
- **No string-built URLs:** Open-Meteo requests use Axios `params`, which encodes every value.
- **Restricted CORS** to the origins set in `FRONTEND_URL`.
- **Rate limiting:** 100 requests per IP every 15 minutes.
- **Errors without internal details:** clients get generic JSON messages; details are only logged on the server.
- **Timeouts** on every external call.
- **No secrets in the code:** Open-Meteo needs no API key and `.env` files are git-ignored.
- **Translations rendered as text**, never as HTML, with a test that checks both languages have the same keys.
- **CI** runs lint, tests, build and `npm audit` on every pull request, and **Dependabot** keeps dependencies up to date.

## Project structure

```text
.
├── .github/workflows/      # CI: lint, tests, build and npm audit
└── weather-app/
    ├── backend/
    │   ├── controllers/    # Endpoint logic
    │   ├── routes/         # API routes
    │   ├── services/       # Open-Meteo client
    │   ├── utils/          # Parameter validation
    │   ├── tests/          # Jest + Supertest (Open-Meteo mocked)
    │   ├── config.js       # Settings from environment variables
    │   └── server.js       # Express app and security middleware
    └── frontend/
        ├── api/
        │   └── chat.js     # Vercel Function: POST /api/chat
        ├── server/         # Server-only code (never sent to the browser)
        │   ├── chatHandler.js   # Endpoint security: validation, per-IP limit, errors
        │   ├── agent.js         # Conversation with Gemini and figure checks
        │   ├── weatherTools.js  # The 3 tools (query Open-Meteo)
        │   └── chat.test.js     # Tests with Gemini and Open-Meteo mocked
        ├── vercel.json     # Function duration and security headers
        └── src/
            ├── api/        # Data access (backend, Open-Meteo and chat)
            ├── components/ # UI components (including ChatWidget)
            ├── data/       # Provinces and cantons of Ecuador
            ├── i18n/       # EN/ES translations and language context
            ├── utils/      # Weather codes and accessibility helpers
            └── tests/      # Vitest + Testing Library
```

## Run locally

Requirements: [Node.js](https://nodejs.org) 22 or later.

**Backend**

```bash
cd weather-app/backend
cp .env.example .env
npm install
npm run dev        # http://localhost:3001
```

**Frontend** (in another terminal)

```bash
cd weather-app/frontend
npm install
echo "VITE_API_URL=http://localhost:3001" > .env.local   # optional: use your own backend
npm run dev        # http://localhost:5173
```

Without `VITE_API_URL`, the frontend calls Open-Meteo directly and you don't need to run the backend.

**AI assistant locally:** copy `weather-app/frontend/.env.example` to `.env.local` and set your key in `GEMINI_API_KEY`. With `npm run dev`, Vite serves `/api/chat` with the same code as the Vercel Function and the chat bubble appears. No Vercel CLI needed. `.env.local` is git-ignored.

## Backend API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/weather/search?query=Quito&lang=en` | Search cities in Ecuador (`lang`: `en` or `es`) |
| GET | `/api/weather/coords?lat=-2.19&lon=-79.88&name=Guayaquil` | Current weather by coordinates |
| GET | `/api/weather?city=Cuenca` | Current weather for the first matching city |
| GET | `/health` | Server status |

## Tests

```bash
cd weather-app/backend && npm test
cd weather-app/frontend && npm run lint && npm test
```

## Credits

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Map © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

## Author

**Andrés Morales** · [LinkedIn](https://www.linkedin.com/in/imandresmorales/) · [GitHub](https://github.com/imandresmorales)

---

## 🇪🇸 En español

Aplicación web full stack para consultar el **clima actual de ciudades y provincias de Ecuador**, con buscador, vista por provincias, mapa interactivo y un **asistente con IA**. **[Ver demo en vivo](https://ecuaclima.vercel.app)** (prueba la burbuja del chat, abajo a la derecha).

- **Asistente del clima con IA:** una burbuja de chat donde puedes preguntar *"¿Qué ciudad está más caliente ahora?"* o *"¿Tengo que llevar paraguas mañana a Cuenca?"*. La IA (Google Gemini) pide datos a Open-Meteo mediante herramientas (*tool calling*), y cada respuesta muestra los **datos usados** para comprobar las cifras. Si la respuesta tiene cifras que no están en los datos, el chat avisa. La clave de la IA solo vive en el servidor (función de Vercel).
- **Buscador con autocompletado** de ciudades ecuatorianas.
- **Vista por provincias:** las 24 provincias con el clima de sus principales cantones.
- **Mapa interactivo** con un marcador por provincia.
- **Inglés y español (EN / ES):** la app se abre en inglés y el selector cambia el idioma de toda la aplicación; la elección se recuerda entre visitas.
- **Modo claro / oscuro** y **accesibilidad** con teclado y lectores de pantalla.
- **Seguridad:** validación de entradas, CORS restringido, rate limit, errores sin detalles internos y sin secretos en el código.
- **Calidad:** pruebas automatizadas en frontend y backend, CI con GitHub Actions y despliegue automático en Vercel (producción desde `main` y una vista previa por cada pull request).

Para ejecutarlo en local sigue los pasos de [Run locally](#run-locally): instala las dependencias con `npm install` y arranca con `npm run dev` en `weather-app/frontend` (y, si quieres usar el backend propio, también en `weather-app/backend`). Para el asistente, copia `.env.example` como `.env.local` en `weather-app/frontend` y pon tu clave de Gemini en `GEMINI_API_KEY`.
