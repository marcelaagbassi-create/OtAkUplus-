// routes/auth.js — Inscription / Connexion OtAkU+
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/postgres');
const { authLimiter } = require('../middleware/rateLimit');

// ── INSCRIPTION ──
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Tous les champs sont requis.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe trop court (min. 6 caractères).' });

  try {
    // Vérifier si email existe déjà
    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email déjà utilisé.' });

    // Hasher le mot de passe
    const hash = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
      [name, email, hash]
    );
    const user = result.rows[0];

    // Créer le profil par défaut
    await db.query(
      `INSERT INTO profiles (user_id, name, avatar, color) VALUES ($1, $2, '🦊', '#f97316')`,
      [user.id, name]
    );

    // Générer JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: `Bienvenue ${name} 🔥`,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── CONNEXION ──
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis.' });

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email=$1 AND is_active=TRUE',
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    // Mettre à jour last_login
    await db.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: `Bon retour ${user.name} 👋`,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── VÉRIFIER TOKEN ──
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id=$1',
      [req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
