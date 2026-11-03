# EcuaClima ⛅

[![CI](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml)
[![Deploy](https://github.com/imandresmorales/ecuaclima/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/deploy-pages.yml)

Full stack web app to check the **current weather in cities and provinces of Ecuador**, with city search, a province view and an interactive map.

**[👉 Live demo](https://imandresmorales.github.io/ecuaclima/)** · 🇪🇸 [Leer en español](#-en-español)

## Features

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
| Security | Helmet, restricted CORS, express-rate-limit, input validation |
| Testing | Vitest + Testing Library (frontend), Jest + Supertest (backend) |
| CI/CD | GitHub Actions and GitHub Pages |
| Data | [Open-Meteo](https://open-meteo.com/) (free, no API key) |

## Architecture

```text
Browser (React)
   │
   ├── With VITE_API_URL ────► Express backend ──► Open-Meteo
   │                           (validation, CORS, rate limit)
   │
   └── Without VITE_API_URL ─► Open-Meteo directly
                               (static hosting mode, used on GitHub Pages)
```

The frontend can work with its own backend or, on static hosting, call Open-Meteo directly. The public demo uses the second mode because GitHub Pages only serves static files.

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
├── .github/workflows/      # CI and GitHub Pages deployment
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
        └── src/
            ├── api/        # Data access (backend or Open-Meteo)
            ├── components/ # UI components
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

Aplicación web full stack para consultar el **clima actual de ciudades y provincias de Ecuador**, con buscador, vista por provincias y mapa interactivo. **[Ver demo en vivo](https://imandresmorales.github.io/ecuaclima/)**.

- **Buscador con autocompletado** de ciudades ecuatorianas.
- **Vista por provincias:** las 24 provincias con el clima de sus principales cantones.
- **Mapa interactivo** con un marcador por provincia.
- **Inglés y español (EN / ES):** la app se abre en inglés y el selector cambia el idioma de toda la aplicación; la elección se recuerda entre visitas.
- **Modo claro / oscuro** y **accesibilidad** con teclado y lectores de pantalla.
- **Seguridad:** validación de entradas, CORS restringido, rate limit, errores sin detalles internos y sin secretos en el código.
- **Calidad:** pruebas automatizadas en frontend y backend, CI con GitHub Actions y despliegue automático en GitHub Pages.

Para ejecutarlo en local sigue los pasos de [Run locally](#run-locally): instala las dependencias con `npm install` y arranca con `npm run dev` en `weather-app/frontend` (y, si quieres usar el backend propio, también en `weather-app/backend`).
