const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

if (config.trustProxy > 0) {
  app.set('trust proxy', config.trustProxy);
}

// Cabeceras HTTP seguras
app.use(helmet());

// Solo se aceptan peticiones de los orígenes configurados en FRONTEND_URL
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ['GET'],
  })
);

// Límite de peticiones por IP
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones desde esta IP. Intenta de nuevo más tarde.' },
  })
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/weather', weatherRoutes);

// Rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

// Manejo de errores global: nunca se envían detalles internos al cliente
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  // Fallo al consultar Open-Meteo (timeout, caída o respuesta inválida)
  if (err.isAxiosError) {
    console.error('Error al consultar Open-Meteo:', err.message);
    return res.status(502).json({ error: 'El servicio meteorológico no está disponible. Intenta de nuevo.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Servidor de clima corriendo en el puerto ${config.port}`);
  });
}

module.exports = app; // Exportado para las pruebas
