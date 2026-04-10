// db/postgres.js — Connexion PostgreSQL OtAkU+
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'otakuplus',
  user:     process.env.PG_USER     || 'otaku_user',
  password: process.env.PG_PASSWORD || '',
  max: 20,                  // max connexions simultanées
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Connexion perdue :', err.message);
});

// Test de connexion au démarrage
pool.connect((err, client, release) => {
  if (err) {
    console.error('[PostgreSQL] ❌ Impossible de se connecter :', err.message);
  } else {
    console.log('[PostgreSQL] ✅ Connecté avec succès');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
