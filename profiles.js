// routes/profiles.js â€” Gestion multi-profils OtAkU+
const express = require('express');
const router = express.Router();
const db = require('../db/postgres');
const auth = require('../middleware/auth');

// GET tous les profils d'un compte
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM profiles WHERE user_id=$1 ORDER BY created_at',
      [req.user.userId]
    );
    res.json({ profiles: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST crÃ©er un profil
router.post('/', auth, async (req, res) => {
  const { name, avatar, avatarImg, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis.' });

  try {
    // Max 4 profils par compte
    const count = await db.query(
      'SELECT COUNT(*) FROM profiles WHERE user_id=$1', [req.user.userId]
    );
    if (parseInt(count.rows[0].count) >= 4)
      return res.status(400).json({ error: 'Maximum 4 profils par compte.' });

    const result = await db.query(
      `INSERT INTO profiles (user_id, name, avatar, avatar_img, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, name, avatar || 'ðŸ¦Š', avatarImg || null, color || '#f97316']
    );
    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT modifier un profil
router.put('/:profileId', auth, async (req, res) => {
  const { name, avatar, avatarImg, color } = req.body;
  try {
    const result = await db.query(
      `UPDATE profiles SET name=COALESCE($1,name), avatar=COALESCE($2,avatar),
       avatar_img=COALESCE($3,avatar_img), color=COALESCE($4,color)
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, avatar, avatarImg, color, req.params.profileId, req.user.userId]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Profil introuvable.' });
    res.json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE supprimer un profil
router.delete('/:profileId', auth, async (req, res) => {
  try {
    // Ne pas supprimer si c'est le dernier profil
    const count = await db.query(
      'SELECT COUNT(*) FROM profiles WHERE user_id=$1', [req.user.userId]
    );
    if (parseInt(count.rows[0].count) <= 1)
      return res.status(400).json({ error: 'Impossible de supprimer le dernier profil.' });

    await db.query(
      'DELETE FROM profiles WHERE id=$1 AND user_id=$2',
      [req.params.profileId, req.user.userId]
    );
    res.json({ message: 'Profil supprimÃ©.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
