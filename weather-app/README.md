# EcuClima

EcuClima es una aplicación web de pronóstico del tiempo orientada al territorio ecuatoriano, diseñada con una interfaz moderna y un mapa interactivo.

## Características

- Búsqueda de clima por ciudad ecuatoriana.
- Exploración de las principales provincias a través de un mapa interactivo y un panel general de tarjetas.
- Visualización de datos climáticos detallados (temperatura, probabilidad de precipitación, humedad y viento).
- Interfaz moderna y responsiva con soporte para **Modo Claro / Modo Oscuro**.

## Tecnologías Utilizadas

- **Frontend:** React.js, Vite, Axios, React-Leaflet, Lucide-React.
- **Backend:** Node.js, Express, Axios.
- **Seguridad Backend:** Helmet, Cors, Express-rate-limit.
- **API Externa:** [Open-Meteo](https://open-meteo.com) (Datos meteorológicos y de geocodificación libres de API key).

## Instalación y Ejecución

Asegúrate de tener instalado [Node.js](https://nodejs.org).

1.  **Instalar y Correr el Backend:**
    ```bash
    cd backend
    npm install
    npm run dev
    ```
    El servidor correrá en `http://localhost:3001`.

2.  **Instalar y Correr el Frontend:**
    En otra ventana de la terminal:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    La web app estará disponible en `http://localhost:5173`.

---

## Mejoras Recientes de Seguridad y Buenas Prácticas

Como parte de una auditoría general de la integridad del software, las siguientes mejoras fueron implementadas:

1.  **Configuración Restrictiva de CORS (Seguridad):** Se actualizó CORS para no permitir todos los dominios por defecto. Ahora acepta las peticiones originadas desde el frontend (`http://localhost:5173`), configurable en producción mediante la variable de entorno `FRONTEND_URL`.
2.  **Variables de Entorno para Endpoint API (Buenas Prácticas):** Se reemplazó el uso *hardcodeado* de `http://localhost:3001` en el código de Axios del frontend, facilitando el despliegue al reemplazar la ruta base usando `import.meta.env.VITE_API_URL`.
3.  **Logs Adecuados de Excepciones (Buenas Prácticas):** En el archivo `weatherController.js`, ahora todos los endpoints registran la descripción técnica exacta del fallo con `console.error` en lugar de tragar y ocultar el error del desarrollador cuando falla una petición web.
4.  **Middlewares de Seguridad Activos (Seguridad):** Configuración de seguridad proactiva con `helmet` (Cabeceras de respuesta HTTP seguras) y limitación de tasa `express-rate-limit` (100 peticiones cada 15 min), protegiendo al backend de ser sobrecargado por *scrappers* o bots.
5.  **Ausencia Completa de Llaves Secretas Expuestas (Seguridad):** El proyecto hace un uso excelente de la API de *Open-Meteo* que no necesita llaves de autorización (Tokens/Keys), erradicando el punto de vulnerabilidad número uno en aplicaciones web informativas.
