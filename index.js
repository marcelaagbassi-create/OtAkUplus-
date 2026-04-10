// server/index.js 鈥� Serveur Principal OtAkU+ by DAVIESLAY 馃挜
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

// 鈹€鈹€ S脡CURIT脡 & MIDDLEWARE 鈹€鈹€
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:8080', 'file://', '*'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

// 鈹€鈹€ SERVIR LE FRONTEND (index.html) 鈹€鈹€
app.use(express.static(path.join(__dirname, '..')));

// 鈹€鈹€ ROUTES API 鈹€鈹€
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/profiles',  require('./routes/profiles'));
app.use('/api/anime',     require('./routes/anime'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/streams',   require('./routes/streams'));

// 鈹€鈹€ ROUTE SANT脡 鈹€鈹€
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'OtAkU+',
    version: '1.0.0',
    author: 'DAVIESLAY 馃挜',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// 鈹€鈹€ CACHE STATS (dev seulement) 鈹€鈹€
app.get('/api/cache/clear', async (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ error: 'Non autoris茅 en production.' });
  await cache.invalidateAnime();
  await cache.invalidateManga();
  await cache.invalidateSearch();
  res.json({ message: 'Cache vid茅 鉁�' });
});

// 鈹€鈹€ CRON JOBS 鈹€鈹€

// Vider le cache anime toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Invalidation cache anime...');
  await cache.invalidateAnime();
});

// Vider le cache search toutes les 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await cache.invalidateSearch();
});

// 鈹€鈹€ GESTION 404 鈹€鈹€
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} introuvable.` });
});

// 鈹€鈹€ GESTION ERREURS GLOBALES 鈹€鈹€
app.use((err, req, res, next) => {
  console.error('[Server] Erreur globale :', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

// 鈹€鈹€ D脡MARRAGE 鈹€鈹€
app.listen(PORT, () => {
  console.log('');
  console.log('  鈻堚枅鈻堚枅鈻堚枅鈺� 鈻堚枅鈻堚枅鈻堚枅鈻堚枅鈺� 鈻堚枅鈻堚枅鈻堚晽 鈻堚枅鈺�  鈻堚枅鈺椻枅鈻堚晽   鈻堚枅鈺� 鈻堚枅鈺�');
  console.log(' 鈻堚枅鈺斺晲鈺愨晲鈻堚枅鈺椻暁鈺愨晲鈻堚枅鈺斺晲鈺愨暆鈻堚枅鈺斺晲鈺愨枅鈻堚晽鈻堚枅鈺� 鈻堚枅鈺斺暆鈻堚枅鈺�   鈻堚枅鈺� 鈺氣晲鈺�');
  console.log(' 鈻堚枅鈺�   鈻堚枅鈺�   鈻堚枅鈺�   鈻堚枅鈻堚枅鈻堚枅鈻堚晳鈻堚枅鈻堚枅鈻堚晹鈺� 鈻堚枅鈺�   鈻堚枅鈺� 鈻堚枅鈺�');
  console.log(' 鈻堚枅鈺�   鈻堚枅鈺�   鈻堚枅鈺�   鈻堚枅鈺斺晲鈺愨枅鈻堚晳鈻堚枅鈺斺晲鈻堚枅鈺� 鈻堚枅鈺�   鈻堚枅鈺� 鈺氣晲鈺�');
  console.log(' 鈺氣枅鈻堚枅鈻堚枅鈻堚晹鈺�   鈻堚枅鈺�   鈻堚枅鈺�  鈻堚枅鈺戔枅鈻堚晳  鈻堚枅鈺椻暁鈻堚枅鈻堚枅鈻堚枅鈺斺暆 鈻堚枅鈺�');
  console.log('  鈺氣晲鈺愨晲鈺愨晲鈺�    鈺氣晲鈺�   鈺氣晲鈺�  鈺氣晲鈺濃暁鈺愨暆  鈺氣晲鈺� 鈺氣晲鈺愨晲鈺愨晲鈺�  鈺氣晲鈺�');
  console.log('');
  console.log(`  馃殌 Serveur d茅marr茅 sur http://localhost:${PORT}`);
  console.log(`  馃敟 By DAVIESLAY 馃挜 鈥� OtAkU+ v1.0.0`);
  console.log(`  馃實 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

module.exports = app;
