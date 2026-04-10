// routes/favorites.js — Favoris & Historique OtAkU+
const express = require('express');
const router = express.Router();
const db = require('../db/postgres');
const auth = require('../middleware/auth');

// ── FAVORIS ANIME ──

// GET favoris anime d'un profil
router.get('/anime/:profileId', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM favorites_anime WHERE profile_id=$1 ORDER BY added_at DESC',
      [req.params.profileId]
    );
    res.json({ favorites: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST ajouter favori anime
router.post('/anime', auth, async (req, res) => {
  const { profileId, malId, title, coverUrl } = req.body;
  if (!profileId || !malId) return res.status(400).json({ error: 'Données manquantes.' });

  try {
    const result = await db.query(
      `INSERT INTO favorites_anime (profile_id, mal_id, title, cover_url)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (profile_id, mal_id) DO NOTHING RETURNING *`,
      [profileId, malId, title, coverUrl]
    );
    res.status(201).json({ favorite: result.rows[0], message: '❤️ Ajouté aux favoris !' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE retirer favori anime
router.delete('/anime/:profileId/:malId', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favorites_anime WHERE profile_id=$1 AND mal_id=$2',
      [req.params.profileId, req.params.malId]
    );
    res.json({ message: 'Retiré des favoris.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── FAVORIS MANGA ──

router.get('/manga/:profileId', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM favorites_manga WHERE profile_id=$1 ORDER BY added_at DESC',
      [req.params.profileId]
    );
    res.json({ favorites: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/manga', auth, async (req, res) => {
  const { profileId, mangadexId, title, coverUrl } = req.body;
  if (!profileId || !mangadexId) return res.status(400).json({ error: 'Données manquantes.' });

  try {
    const result = await db.query(
      `INSERT INTO favorites_manga (profile_id, mangadex_id, title, cover_url)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (profile_id, mangadex_id) DO NOTHING RETURNING *`,
      [profileId, mangadexId, title, coverUrl]
    );
    res.status(201).json({ favorite: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/manga/:profileId/:mangadexId', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favorites_manga WHERE profile_id=$1 AND mangadex_id=$2',
      [req.params.profileId, req.params.mangadexId]
    );
    res.json({ message: 'Retiré des favoris.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── HISTORIQUE ──

router.get('/history/:profileId', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM history WHERE profile_id=$1
       ORDER BY watched_at DESC LIMIT 50`,
      [req.params.profileId]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/history', auth, async (req, res) => {
  const { profileId, contentId, contentType, title, coverUrl, episode, season, chapter } = req.body;
  try {
    await db.query(
      `INSERT INTO history (profile_id, content_id, content_type, title, cover_url, episode, season, chapter, watched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (profile_id, content_id, content_type)
       DO UPDATE SET episode=$6, season=$7, chapter=$8, watched_at=NOW()`,
      [profileId, contentId, contentType, title, coverUrl, episode||1, season||1, chapter||null]
    );
    res.json({ message: 'Historique mis à jour.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
