// routes/anime.js — Catalogue anime avec cache Redis
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cache');
const { apiLimiter } = require('../middleware/rateLimit');

const JIKAN = process.env.JIKAN_BASE || 'https://api.jikan.moe/v4';

// Helper fetch Jikan avec retry
async function jikanFetch(endpoint, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await axios.get(`${JIKAN}${endpoint}`, { timeout: 8000 });
      return res.data;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

// GET top anime
router.get('/top', apiLimiter, async (req, res) => {
  try {
    const cached = await cache.getTopAnime();
    if (cached) return res.json({ data: cached, fromCache: true });

    const data = await jikanFetch('/top/anime?limit=24&type=tv');
    await cache.setTopAnime(data.data);
    res.json({ data: data.data, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer le top anime.' });
  }
});

// GET saison actuelle
router.get('/season/now', apiLimiter, async (req, res) => {
  try {
    const cached = await cache.getSeasonNow();
    if (cached) return res.json({ data: cached, fromCache: true });

    const data = await jikanFetch('/seasons/now?limit=24');
    await cache.setSeasonNow(data.data);
    res.json({ data: data.data, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer la saison.' });
  }
});

// GET détail d'un anime
router.get('/:malId', apiLimiter, async (req, res) => {
  const { malId } = req.params;
  try {
    const cached = await cache.getAnimeDetail(malId);
    if (cached) return res.json({ data: cached, fromCache: true });

    const data = await jikanFetch(`/anime/${malId}`);
    await cache.setAnimeDetail(malId, data.data);
    res.json({ data: data.data, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Anime introuvable.' });
  }
});

// GET vidéos/trailers d'un anime
router.get('/:malId/videos', apiLimiter, async (req, res) => {
  const { malId } = req.params;
  try {
    const cacheKey = `anime:videos:${malId}`;
    const { getCache, setCache } = require('../db/redis');
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ data: cached, fromCache: true });

    const data = await jikanFetch(`/anime/${malId}/videos`);
    await setCache(cacheKey, data.data, 86400); // 24h
    res.json({ data: data.data, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Vidéos introuvables.' });
  }
});

// GET planning hebdomadaire
router.get('/schedule/:day', apiLimiter, async (req, res) => {
  const { day } = req.params;
  const validDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  if (!validDays.includes(day))
    return res.status(400).json({ error: 'Jour invalide.' });

  try {
    const cached = await cache.getSchedule(day);
    if (cached) return res.json({ data: cached, fromCache: true });

    const data = await jikanFetch(`/schedules?filter=${day}&limit=10`);
    await cache.setSchedule(day, data.data);
    res.json({ data: data.data, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Planning indisponible.' });
  }
});

// GET recherche anime
router.get('/search/:query', apiLimiter, async (req, res) => {
  const q = req.params.query;
  if (!q || q.length < 2)
    return res.status(400).json({ error: 'Requête trop courte.' });

  try {
    const cached = await cache.getSearch(q);
    if (cached) return res.json({ data: cached, fromCache: true });

    const data = await jikanFetch(`/anime?q=${encodeURIComponent(q)}&limit=10&type=tv`);
    await cache.setSearch(q, data.data);
    res.json({ data: data.data, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Recherche échouée.' });
  }
});

module.exports = router;
