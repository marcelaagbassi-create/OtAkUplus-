// db/redis.js 鈥� Cache Redis OtAkU+
const { createClient } = require('redis');

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Redis: trop de tentatives');
      return Math.min(retries * 100, 3000);
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => console.error('[Redis] 鉂� Erreur :', err.message));
client.on('connect', () => console.log('[Redis] 鉁� Connect茅'));
client.on('reconnecting', () => console.log('[Redis] 馃攧 Reconnexion...'));

// Connexion automatique
client.connect().catch(console.error);

// 鈹€鈹€ HELPERS 鈹€鈹€

/**
 * R茅cup猫re une valeur du cache
 * @returns {any|null} donn茅es pars茅es ou null si absent
 */
async function getCache(key) {
  try {
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.warn('[Redis] getCache erreur :', e.message);
    return null;
  }
}

/**
 * Stocke une valeur en cache avec TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttl  secondes
 */
async function setCache(key, value, ttl = 3600) {
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (e) {
    console.warn('[Redis] setCache erreur :', e.message);
  }
}

/**
 * Supprime une cl茅 du cache
 */
async function delCache(key) {
  try {
    await client.del(key);
  } catch (e) {
    console.warn('[Redis] delCache erreur :', e.message);
  }
}

/**
 * Supprime toutes les cl茅s correspondant 脿 un pattern
 * Ex: delPattern('anime:*')
 */
async function delPattern(pattern) {
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(keys);
  } catch (e) {
    console.warn('[Redis] delPattern erreur :', e.message);
  }
}

module.exports = { client, getCache, setCache, delCache, delPattern };
