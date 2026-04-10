// services/scraper.js — Vérification automatique des liens vidéo
const axios = require('axios');
const db = require('../db/postgres');

const PROVIDERS = [
  { name: 'vidsrc.cc',  urlFn: (id,s,e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` },
  { name: 'vidsrc.to',  urlFn: (id,s,e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`  },
];

/**
 * Vérifie si un lien stream répond (HTTP 200)
 */
async function checkLink(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0 OtAkU+/1.0' },
      maxRedirects: 3,
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

/**
 * Trouve le meilleur provider disponible pour un épisode
 */
async function findBestStream(malId, season, episode, lang = 'vostfr') {
  // D'abord chercher en DB
  try {
    const cached = await db.query(
      `SELECT url, provider FROM stream_links
       WHERE mal_id=$1 AND season=$2 AND episode=$3 AND lang=$4 AND is_valid=TRUE
       ORDER BY checked_at DESC LIMIT 1`,
      [malId, season, episode, lang]
    );
    if (cached.rows.length > 0) {
      return { url: cached.rows[0].url, provider: cached.rows[0].provider, fromDB: true };
    }
  } catch (e) {
    console.warn('[Scraper] DB lookup failed:', e.message);
  }

  // Sinon tester les providers
  for (const provider of PROVIDERS) {
    const url = provider.urlFn(malId, season, episode);
    const valid = await checkLink(url);
    if (valid) {
      // Sauvegarder en DB
      try {
        await db.query(
          `INSERT INTO stream_links (mal_id, season, episode, lang, url, provider, is_valid)
           VALUES ($1,$2,$3,$4,$5,$6,TRUE)
           ON CONFLICT (mal_id, season, episode, lang)
           DO UPDATE SET url=$5, provider=$6, is_valid=TRUE, checked_at=NOW()`,
          [malId, season, episode, lang, url, provider.name]
        );
      } catch (e) {
        console.warn('[Scraper] DB save failed:', e.message);
      }
      return { url, provider: provider.name, fromDB: false };
    }
  }

  return null; // Aucun provider disponible
}

/**
 * Vérifie en masse les liens d'une saison (cron job)
 */
async function bulkCheckSeason(malId, season, totalEpisodes) {
  console.log(`[Scraper] Vérification S${season} — ${totalEpisodes} épisodes pour MAL:${malId}`);
  const results = [];
  for (let ep = 1; ep <= totalEpisodes; ep++) {
    const result = await findBestStream(malId, season, ep);
    results.push({ episode: ep, valid: !!result, provider: result?.provider });
    // Pause entre requêtes pour éviter le rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

/**
 * Marque un lien comme invalide
 */
async function invalidateLink(malId, season, episode, lang) {
  await db.query(
    `UPDATE stream_links SET is_valid=FALSE WHERE mal_id=$1 AND season=$2 AND episode=$3 AND lang=$4`,
    [malId, season, episode, lang]
  );
}

module.exports = { checkLink, findBestStream, bulkCheckSeason, invalidateLink };
