const backoff = require('exponential-backoff');

// Configuración por defecto del backoff
const defaultConfig = {
  numOfAttempts: 3,
  startingDelay: 1000,
  maxDelay: 10000,
  timeMultiple: 2,
  maxTime: 30000
};

// Middleware para manejar reintentos con backoff exponencial
const withBackoff = (handler, config = {}) => {
  const backoffConfig = { ...defaultConfig, ...config };
  
  return async (req, res, next) => {
    try {
      await backoff.backOff(
        async () => {
          await handler(req, res, next);
        },
        {
          numOfAttempts: backoffConfig.numOfAttempts,
          startingDelay: backoffConfig.startingDelay,
          maxDelay: backoffConfig.maxDelay,
          timeMultiple: backoffConfig.timeMultiple,
          maxTime: backoffConfig.maxTime,
          retry: (e, attemptNumber) => {
            console.log(`Intento ${attemptNumber} fallido:`, e.message);
            return true; // Continuar reintentando
          }
        }
      );
    } catch (error) {
      console.error('Error después de todos los reintentos:', error);
      next(error);
    }
  };
};

// Middleware para manejar errores de red
const handleNetworkError = (err, req, res, next) => {
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: 'Error de conexión',
      message: 'No se pudo conectar al servidor. Por favor, intente nuevamente.',
      retryAfter: 5 // segundos
    });
  }
  next(err);
};

module.exports = {
  withBackoff,
  handleNetworkError
}; 
