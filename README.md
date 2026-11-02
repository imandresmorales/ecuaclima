# EcuaClima ⛅

[![CI](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml)
[![Deploy](https://github.com/imandresmorales/ecuaclima/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/deploy-pages.yml)

Aplicación web full stack para consultar el **clima actual de ciudades y provincias de Ecuador**, con buscador, vista por provincias y mapa interactivo.

**[👉 Ver demo en vivo](https://imandresmorales.github.io/ecuaclima/)**

## Características

- **Buscador con autocompletado** de ciudades ecuatorianas (debounce y descarte de respuestas antiguas).
- **Vista por provincias:** las 24 provincias con el clima de sus principales cantones.
- **Mapa interactivo** con Leaflet y marcadores por provincia.
- **Detalle del clima:** temperatura, sensación térmica, humedad, viento, presión y descripción de la condición (códigos WMO).
- **Modo claro / oscuro**, recordado entre visitas.
- **Accesibilidad:** navegación con teclado, roles ARIA y mensajes de estado para lectores de pantalla.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | React 19, Vite, Axios, React-Leaflet, Lucide React |
| Backend | Node.js, Express 5, Axios |
| Seguridad | Helmet, CORS restringido, express-rate-limit, validación de entradas |
| Pruebas | Vitest + Testing Library (frontend), Jest + Supertest (backend) |
| CI/CD | GitHub Actions y GitHub Pages |
| Datos | [Open-Meteo](https://open-meteo.com/) (gratuita y sin API key) |

## Arquitectura

```text
Navegador (React)
   │
   ├── Con VITE_API_URL ──► Backend Express ──► Open-Meteo
   │                        (validación, CORS, rate limit)
   │
   └── Sin VITE_API_URL ──► Open-Meteo directamente
                            (modo de hosting estático, usado en GitHub Pages)
```

El frontend puede trabajar con el backend propio o, en hosting estático, consultar Open-Meteo directamente. La demo pública usa este segundo modo porque GitHub Pages solo sirve archivos estáticos.

## Seguridad y buenas prácticas

- **Validación de entradas:** las coordenadas deben ser números dentro de Ecuador (incluye Galápagos) y los textos se recortan a 100 caracteres.
- **Sin parámetros concatenados en URLs:** las consultas a Open-Meteo se construyen con `params` de Axios, que codifica cada valor.
- **CORS restringido** a los orígenes definidos en `FRONTEND_URL`.
- **Rate limit** de 100 peticiones cada 15 minutos por IP.
- **Errores sin detalles internos:** el cliente recibe mensajes genéricos en JSON; el detalle solo se registra en el servidor.
- **Timeouts** en todas las llamadas externas.
- **Sin secretos en el código:** Open-Meteo no requiere API key y los archivos `.env` están excluidos de git.
- **CI** con lint, pruebas, build y `npm audit` en cada Pull Request, y **Dependabot** para mantener las dependencias al día.

## Estructura

```text
.
├── .github/workflows/      # CI y despliegue a GitHub Pages
└── weather-app/
    ├── backend/
    │   ├── controllers/    # Lógica de cada endpoint
    │   ├── routes/         # Rutas de la API
    │   ├── services/       # Cliente de Open-Meteo
    │   ├── utils/          # Validación de parámetros
    │   ├── tests/          # Pruebas con Jest + Supertest (Open-Meteo simulado)
    │   ├── config.js       # Configuración desde variables de entorno
    │   └── server.js       # App Express y middlewares de seguridad
    └── frontend/
        └── src/
            ├── api/        # Acceso a datos (backend u Open-Meteo)
            ├── components/ # Componentes de la interfaz
            ├── data/       # Provincias y cantones de Ecuador
            ├── utils/      # Códigos del clima y accesibilidad
            └── tests/      # Pruebas con Vitest + Testing Library
```

## Ejecutar en local

Requisitos: [Node.js](https://nodejs.org) 22 o superior.

**Backend**

```bash
cd weather-app/backend
cp .env.example .env
npm install
npm run dev        # http://localhost:3001
```

**Frontend** (en otra terminal)

```bash
cd weather-app/frontend
npm install
echo "VITE_API_URL=http://localhost:3001" > .env.local   # opcional: usar el backend propio
npm run dev        # http://localhost:5173
```

Si no defines `VITE_API_URL`, el frontend consulta Open-Meteo directamente y no necesitas levantar el backend.

## API del backend

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/weather/search?query=Quito` | Busca ciudades de Ecuador |
| GET | `/api/weather/coords?lat=-2.19&lon=-79.88&name=Guayaquil` | Clima actual por coordenadas |
| GET | `/api/weather?city=Cuenca` | Clima actual de la primera ciudad que coincide |
| GET | `/health` | Estado del servidor |

## Pruebas

```bash
cd weather-app/backend && npm test
cd weather-app/frontend && npm run lint && npm test
```

## Créditos

Datos meteorológicos de [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Mapa © [colaboradores de OpenStreetMap](https://www.openstreetmap.org/copyright).

## Autor

**Andrés Morales** · [LinkedIn](https://www.linkedin.com/in/imandresmorales/) · [GitHub](https://github.com/imandresmorales)
