// middleware/rateLimit.js — Protection anti-abus
const rateLimit = require('express-rate-limit');

// Limite générale : 100 req / 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
});

// Limite auth stricte : 10 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion.' },
});

// Limite API externe : 30 req / min (respect Jikan)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Limite API atteinte, patiente 1 minute.' },
});

module.exports = { generalLimiter, authLimiter, apiLimiter };
