// shared/api.js — Client API OtAkU+
// Ce fichier est importé dans index.html pour remplacer
// les appels directs à Jikan/MangaDex par le serveur Node.js

const OtakuAPI = (function() {
  const BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api'; // production: même domaine

  // ── TOKEN JWT ──
  function getToken() {
    return localStorage.getItem('otaku_jwt') || null;
  }

  function setToken(token) {
    localStorage.setItem('otaku_jwt', token);
  }

  function clearToken() {
    localStorage.removeItem('otaku_jwt');
  }

  // ── FETCH DE BASE ──
  async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const res = await fetch(`${BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        clearToken();
        // Recharger la page auth si token expiré
        window.dispatchEvent(new Event('otaku:logout'));
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur API');
      return data;
    } catch (err) {
      // Fallback : si le serveur est hors ligne, utiliser Jikan directement
      console.warn('[OtakuAPI] Serveur hors ligne, fallback Jikan:', err.message);
      return null;
    }
  }

  // ── AUTH ──
  const auth = {
    async register(name, email, password) {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (data?.token) setToken(data.token);
      return data;
    },

    async login(email, password) {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data?.token) setToken(data.token);
      return data;
    },

    logout() { clearToken(); },
    isLoggedIn() { return !!getToken(); },
  };

  // ── ANIME ──
  const anime = {
    async getTop() {
      const data = await apiFetch('/anime/top');
      return data?.data || null;
    },

    async getSeasonNow() {
      const data = await apiFetch('/anime/season/now');
      return data?.data || null;
    },

    async getDetail(malId) {
      const data = await apiFetch(`/anime/${malId}`);
      return data?.data || null;
    },

    async getVideos(malId) {
      const data = await apiFetch(`/anime/${malId}/videos`);
      return data?.data || null;
    },

    async getSchedule(day) {
      const data = await apiFetch(`/anime/schedule/${day}`);
      return data?.data || null;
    },

    async search(query) {
      const data = await apiFetch(`/anime/search/${encodeURIComponent(query)}`);
      return data?.data || null;
    },
  };

  // ── PROFILS ──
  const profiles = {
    async getAll() {
      const data = await apiFetch('/profiles');
      return data?.profiles || null;
    },

    async create(name, avatar, avatarImg, color) {
      const data = await apiFetch('/profiles', {
        method: 'POST',
        body: JSON.stringify({ name, avatar, avatarImg, color }),
      });
      return data?.profile || null;
    },

    async update(profileId, updates) {
      const data = await apiFetch(`/profiles/${profileId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data?.profile || null;
    },

    async delete(profileId) {
      return apiFetch(`/profiles/${profileId}`, { method: 'DELETE' });
    },
  };

  // ── FAVORIS ──
  const favorites = {
    async getAnime(profileId) {
      const data = await apiFetch(`/favorites/anime/${profileId}`);
      return data?.favorites || null;
    },

    async addAnime(profileId, malId, title, coverUrl) {
      return apiFetch('/favorites/anime', {
        method: 'POST',
        body: JSON.stringify({ profileId, malId, title, coverUrl }),
      });
    },

    async removeAnime(profileId, malId) {
      return apiFetch(`/favorites/anime/${profileId}/${malId}`, { method: 'DELETE' });
    },

    async getManga(profileId) {
      const data = await apiFetch(`/favorites/manga/${profileId}`);
      return data?.favorites || null;
    },

    async addManga(profileId, mangadexId, title, coverUrl) {
      return apiFetch('/favorites/manga', {
        method: 'POST',
        body: JSON.stringify({ profileId, mangadexId, title, coverUrl }),
      });
    },

    async removeManga(profileId, mangadexId) {
      return apiFetch(`/favorites/manga/${profileId}/${mangadexId}`, { method: 'DELETE' });
    },
  };

  // ── HISTORIQUE ──
  const history = {
    async get(profileId) {
      const data = await apiFetch(`/favorites/history/${profileId}`);
      return data?.history || null;
    },

    async add(profileId, contentId, contentType, title, coverUrl, episode, season) {
      return apiFetch('/favorites/history', {
        method: 'POST',
        body: JSON.stringify({ profileId, contentId, contentType, title, coverUrl, episode, season }),
      });
    },
  };

  // ── STREAMS ──
  const streams = {
    async getBest(malId, season, episode, lang = 'vostfr') {
      const data = await apiFetch(`/streams/${malId}/s${season}/e${episode}?lang=${lang}`);
      return data || null;
    },

    async report(malId, season, episode, lang) {
      return apiFetch('/streams/report', {
        method: 'POST',
        body: JSON.stringify({ malId, season, episode, lang }),
      });
    },
  };

  // ── HEALTH CHECK ──
  async function isServerOnline() {
    try {
      const res = await fetch(`${BASE}/health`, { timeout: 3000 });
      return res.ok;
    } catch {
      return false;
    }
  }

  return { auth, anime, profiles, favorites, history, streams, isServerOnline, getToken, setToken };
})();

// Rendre disponible globalement
window.OtakuAPI = OtakuAPI;
