# EcuaClima ⛅

[![CI](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/ci.yml)
[![Deploy](https://github.com/imandresmorales/ecuaclima/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/imandresmorales/ecuaclima/actions/workflows/deploy-pages.yml)

Aplicación web full stack para consultar el **clima actual de ciudades y provincias de Ecuador**, con buscador, vista por provincias, mapa interactivo y un **asistente con IA** que responde preguntas en lenguaje natural usando datos reales.

**[👉 Ver demo en vivo](https://imandresmorales.github.io/ecuaclima/)**

## Características

- **Asistente del clima con IA:** una burbuja de chat donde puedes preguntar *"¿Qué ciudad está más caliente ahora?"* o *"¿Tengo que llevar paraguas mañana a Cuenca?"*. La IA consulta Open-Meteo con herramientas (*tool calling*) y cada respuesta muestra los **datos usados** para que se puedan comprobar. Ver [Asistente con IA](#asistente-con-ia).
- **Buscador con autocompletado** de ciudades ecuatorianas (debounce y descarte de respuestas antiguas).
- **Vista por provincias:** las 24 provincias con el clima de sus principales cantones.
- **Mapa interactivo** con Leaflet y marcadores por provincia.
- **Detalle del clima:** temperatura, sensación térmica, humedad, viento, presión y descripción de la condición (códigos WMO).
- **Español e inglés (ES / EN):** el idioma cambia en toda la app (vistas, mapa, tarjetas, errores, título de la página y formato de números) y se recuerda entre visitas. Si es la primera visita, se usa el idioma del navegador.
- **Modo claro / oscuro**, recordado entre visitas.
- **Accesibilidad:** navegación con teclado, roles ARIA y mensajes de estado para lectores de pantalla.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | React 19, Vite, Axios, React-Leaflet, Lucide React |
| Backend | Node.js, Express 5, Axios |
| IA | Google Gemini (API REST, plan gratuito) con *function calling*, en una función de Vercel |
| Seguridad | Helmet, CORS restringido, express-rate-limit, validación de entradas, CSP |
| Pruebas | Vitest + Testing Library (frontend y chat), Jest + Supertest (backend) |
| CI/CD | GitHub Actions, GitHub Pages y Vercel |
| Datos | [Open-Meteo](https://open-meteo.com/) (gratuita y sin API key) |

## Arquitectura

```text
Navegador (React)
   │
   ├── Con VITE_API_URL ──► Backend Express ──► Open-Meteo
   │                        (validación, CORS, rate limit)
   │
   ├── Sin VITE_API_URL ──► Open-Meteo directamente
   │                        (modo de hosting estático, usado en GitHub Pages)
   │
   └── Chat ──► POST /api/chat (función de Vercel) ──► Gemini
                (la clave vive solo aquí)        └──► Open-Meteo (herramientas)
```

El frontend puede trabajar con el backend propio o, en hosting estático, consultar Open-Meteo directamente. La demo de GitHub Pages usa este segundo modo y **no muestra el chat**, porque GitHub Pages no puede ejecutar código de servidor ni guardar la clave. El chat funciona en Vercel y en local.

## Asistente con IA

### Cómo funciona

```text
1. Pregunta: "¿Llevo paraguas mañana a Cuenca?"
2. Consulta 1: Gemini recibe la pregunta, las reglas y la lista de herramientas,
               y pide get_forecast("Cuenca", 2)  → el servidor busca las coordenadas
                                                   y consulta Open-Meteo
3. Consulta 2: Gemini recibe los datos y responde → el servidor verifica las cifras
4. El chat muestra la respuesta + "Datos usados"
```

Una **herramienta** es una función del servidor que la IA puede pedir por su nombre. La IA **no llama a internet por su cuenta**: solo dice qué necesita, y el servidor lo ejecuta y le devuelve los datos.

| Herramienta | Para qué la usa la IA |
| --- | --- |
| `get_current_weather(ciudad)` | Clima actual de una ciudad |
| `get_forecast(ciudad, días)` | Pronóstico de 1 a 7 días (lluvia, máximas y mínimas) |
| `get_provinces_weather(región?)` | Clima actual de las 24 capitales de provincia en **una sola** petición, ordenadas de más caliente a más fría; filtrable por región |

**¿De dónde salen las coordenadas?** Primero de las 75 ciudades que ya tiene la app (`src/data/ecuadorData.js`), para que la IA y la app den exactamente las mismas cifras. Las demás ciudades (por ejemplo, Montañita) se buscan en el buscador gratuito de Open-Meteo, solo dentro de Ecuador.

### Decisiones de diseño

- **La IA no inventa cifras.** Las reglas le exigen usar solo datos de las herramientas, y el servidor lo **comprueba**: si la respuesta tiene cifras (°C, %, mm, km/h) que no aparecen en los datos consultados, el chat muestra un aviso. Al comparar modelos, uno de ellos respondió "15 °C en Quito" sin consultar nada, y esta comprobación lo detectó.
- **Lo que no necesita IA sigue sin IA.** El buscador, las provincias y el mapa no usan IA: son más rápidos, exactos y gratuitos. La IA solo se usa en preguntas abiertas que combinan varios pasos.
- **A la IA solo se le pide lo que necesita inteligencia.** Entender la pregunta y redactar la respuesta es trabajo de la IA; buscar coordenadas y consultar datos es trabajo del código. Por eso las herramientas reciben el **nombre** de la ciudad: así una pregunta usa 2 consultas a Gemini en lugar de 3 (unos 1.500 tokens en lugar de 3.500), y la IA no puede equivocarse con coordenadas.
- **Herramientas pensadas para el modelo.** `get_provinces_weather` existe para que "¿qué ciudad está más caliente?" sea **una** llamada y no 24.
- **El bucle siempre termina.** Máximo 5 vueltas con el modelo y 10 herramientas por pregunta; en la última vuelta se le prohíbe pedir más herramientas para que responda con lo que tiene.
- **Modelo con versión fija** (`gemini-3.5-flash-lite`), elegido tras comparar varios: responde en 2-3 s y fue fiel a los datos. Se cambia con `GEMINI_MODEL`.
- **Sin SDK de IA:** el cliente de Gemini son unas pocas líneas con `fetch`, así hay menos dependencias que auditar.
- **Observabilidad:** cada pregunta registra en el servidor el modelo, la latencia, las vueltas, las herramientas usadas, los tokens y si las cifras se verificaron. No se registra el texto del usuario ni su IP.

### Seguridad del chat

- **La clave nunca llega al navegador.** Vive en una variable de entorno del servidor (`GEMINI_API_KEY`, sin el prefijo `VITE_`) y se envía a Google en una cabecera, no en la URL. Una prueba automática y una revisión del build lo comprueban.
- **Validación de todo lo que llega:** solo JSON, máximo 16 KB, pregunta de hasta 500 caracteres, historial de hasta 10 mensajes con roles permitidos.
- **Solo peticiones del mismo sitio** (cabecera `Origin`) y **límite por IP** (15 preguntas cada 10 minutos).
- **Errores sin detalles internos:** el navegador recibe solo un código (`RATE_LIMITED`, `AI_BUSY`, …) y el detalle queda en el log del servidor.
- **Timeouts** en todas las llamadas externas y un presupuesto total por pregunta, con un reintento si Google está saturado.
- **Resistencia a instrucciones maliciosas:** las reglas indican ignorar pedidos de cambiarlas, y las herramientas solo leen datos públicos del clima (no hay nada que la IA pueda modificar).
- **Sin riesgo de cobros:** la clave es del plan gratuito, sin tarjeta. Si alguien abusa, como mucho se agota la cuota del día y el chat responde "límite de uso alcanzado".
- **Cabeceras de seguridad en Vercel** (`vercel.json`): Content-Security-Policy, `X-Frame-Options`, `nosniff`, `Referrer-Policy`.
- Las respuestas de la IA se muestran **como texto**, nunca como HTML.

### Publicar en Vercel

1. En [vercel.com](https://vercel.com), **Add New → Project** e importa este repositorio.
2. En **Root Directory** elige `weather-app/frontend`. Vercel detecta Vite solo.
3. En **Environment Variables** agrega `GEMINI_API_KEY` con tu clave de [Google AI Studio](https://aistudio.google.com/apikey).
4. **Deploy.** La función `api/chat.js` se publica sola y el chat aparece en el sitio.

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
        ├── api/
        │   └── chat.js     # Función de Vercel: POST /api/chat
        ├── server/         # Código que solo corre en el servidor (nunca llega al navegador)
        │   ├── chatHandler.js   # Seguridad del endpoint: validación, límite por IP, errores
        │   ├── agent.js         # Conversación con Gemini y verificación de cifras
        │   ├── weatherTools.js  # Las 3 herramientas (consultan Open-Meteo)
        │   └── chat.test.js     # Pruebas con Gemini y Open-Meteo simulados
        ├── vercel.json     # Duración de la función y cabeceras de seguridad
        └── src/
            ├── api/        # Acceso a datos (backend, Open-Meteo y chat)
            ├── components/ # Componentes de la interfaz (incluye ChatWidget)
            ├── data/       # Provincias y cantones de Ecuador
            ├── i18n/       # Traducciones ES/EN y contexto de idioma
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

**Asistente con IA en local:** copia `weather-app/frontend/.env.example` como `.env.local` y pon tu clave en `GEMINI_API_KEY`. Al ejecutar `npm run dev`, Vite sirve `/api/chat` con el mismo código que la función de Vercel y aparece la burbuja del chat. No hace falta instalar la CLI de Vercel. El archivo `.env.local` está excluido de git.

## API del backend

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/weather/search?query=Quito&lang=es` | Busca ciudades de Ecuador (`lang`: `es` o `en`) |
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
