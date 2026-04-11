// db/postgres.js — PostgreSQL OtAkU+
// Supporte DATABASE_URL (Railway/Render) et variables séparées
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // requis sur Railway/Render
    })
  : new Pool({
      host:     process.env.PG_HOST     || 'localhost',
      port:     parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DATABASE || 'otakuplus',
      user:     process.env.PG_USER     || 'otaku_user',
      password: process.env.PG_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

pool.on('error', (err) => {
  console.error('[PostgreSQL] Erreur :', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('[PostgreSQL] ❌', err.message);
  } else {
    console.log('[PostgreSQL] ✅ Connecté');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
