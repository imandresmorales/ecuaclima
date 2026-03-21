const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(helmet()); // Seguridad
app.use(cors()); // Permitir Cross-Origin

// Limitar el número de peticiones
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite por IP
  message: 'Demasiadas peticiones desde esta IP. Intenta de nuevo más tarde.',
});
app.use(limiter);

// Rutas
app.use('/api/weather', weatherRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal en el servidor!');
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de clima corriendo en el puerto ${PORT}`);
  });
}

module.exports = app; // Para pruebas
