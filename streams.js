// routes/streams.js — Liens vidéo vérifiés OtAkU+
const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const scraper = require('../services/scraper');
const { apiLimiter } = require('../middleware/rateLimit');

// GET meilleur stream pour un épisode
router.get('/:malId/s:season/e:episode', apiLimiter, async (req, res) => {
  const { malId, season, episode } = req.params;
  const lang = req.query.lang || 'vostfr';

  // Cache Redis d'abord
  const cached = await cache.getStream(malId, season, episode, lang);
  if (cached) return res.json({ ...cached, fromCache: true });

  // Trouver le meilleur provider
  const result = await scraper.findBestStream(
    parseInt(malId), parseInt(season), parseInt(episode), lang
  );

  if (!result) {
    return res.status(404).json({ error: 'Aucun stream disponible.' });
  }

  await cache.setStream(malId, season, episode, lang, result);
  res.json({ ...result, fromCache: false });
});

// POST signaler un lien cassé
router.post('/report', async (req, res) => {
  const { malId, season, episode, lang } = req.body;
  try {
    await scraper.invalidateLink(malId, season, episode, lang || 'vostfr');
    res.json({ message: 'Lien signalé, merci !' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur.' });
  }
});

module.exports = router;
