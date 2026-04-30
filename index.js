// server/index.js — Serveur Principal OtAkU+ by DAVIESLAY 💥
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const cron       = require('node-cron');
const path       = require('path');

const { generalLimiter } = require('./middleware/rateLimit');
const cache              = require('./services/cache');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SÉCURITÉ & MIDDLEWARE ──
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:8080', 'file://', '*'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

// ── SERVIR LE FRONTEND (index.html) ──
app.use(express.static(path.join(__dirname, '..')));

// ── ROUTES API ──
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/profiles',  require('./routes/profiles'));
app.use('/api/anime',     require('./routes/anime'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/streams',   require('./routes/streams'));

// ── ROUTE SANTÉ ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'OtAkU+',
    version: '1.0.0',
    author: 'DAVIESLAY 💥',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── CACHE STATS (dev seulement) ──
app.get('/api/cache/clear', async (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ error: 'Non autorisé en production.' });
  await cache.invalidateAnime();
  await cache.invalidateManga();
  await cache.invalidateSearch();
  res.json({ message: 'Cache vidé ✅' });
});

// ── CRON JOBS ──

// Vider le cache anime toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Invalidation cache anime...');
  await cache.invalidateAnime();
});

// Vider le cache search toutes les 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await cache.invalidateSearch();
});

// ── GESTION 404 ──
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} introuvable.` });
});

// ── GESTION ERREURS GLOBALES ──
app.use((err, req, res, next) => {
  console.error('[Server] Erreur globale :', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

// ── DÉMARRAGE ──
app.listen(PORT, () => {
  console.log('');
  console.log('  ██████╗ ████████╗ █████╗ ██╗  ██╗██╗   ██╗ ██╗');
  console.log(' ██╔═══██╗╚══██╔══╝██╔══██╗██║ ██╔╝██║   ██║ ╚═╝');
  console.log(' ██║   ██║   ██║   ███████║█████╔╝ ██║   ██║ ██╗');
  console.log(' ██║   ██║   ██║   ██╔══██║██╔═██╗ ██║   ██║ ╚═╝');
  console.log(' ╚██████╔╝   ██║   ██║  ██║██║  ██╗╚██████╔╝ ██╗');
  console.log('  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═╝');
  console.log('');
  console.log(`  🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`  🔥 By DAVIESLAY 💥 — OtAkU+ v1.0.0`);
  console.log(`  🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

module.exports = app;
