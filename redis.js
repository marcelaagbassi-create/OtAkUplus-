// db/redis.js 鈥� Redis OtAkU+
// Supporte REDIS_URL (Railway/Render) et config manuelle
const { createClient } = require('redis');

const client = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        reconnectStrategy: (r) => r > 10 ? new Error('Redis: abandon') : Math.min(r * 100, 3000),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

client.on('error',       (err) => console.error('[Redis] 鉂�', err.message));
client.on('connect',     ()    => console.log('[Redis] 鉁� Connect茅'));
client.on('reconnecting',()    => console.log('[Redis] 馃攧 Reconnexion...'));

client.connect().catch((e) => console.warn('[Redis] Non disponible:', e.message));

async function getCache(key) {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

async function setCache(key, value, ttl = 3600) {
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (e) { console.warn('[Redis] setCache:', e.message); }
}

async function delCache(key) {
  try { await client.del(key); } catch {}
}

async function delPattern(pattern) {
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(keys);
  } catch {}
}

module.exports = { client, getCache, setCache, delCache, delPattern };
