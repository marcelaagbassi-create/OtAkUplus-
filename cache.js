// services/cache.js — Cache Redis V2 OtAkU+
const { getCache, setCache, delCache, delPattern } = require('../db/redis');

const TTL = {
  ANIME_TOP:    parseInt(process.env.CACHE_ANIME_TTL)  || 3600,
  MANGA_LIST:   parseInt(process.env.CACHE_MANGA_TTL)  || 1800,
  SEARCH:       parseInt(process.env.CACHE_SEARCH_TTL) || 300,
  ANIME_DETAIL: 7200,
  ANIME_VIDEOS: 86400,
  STREAM_CHECK: 1800,
  SCHEDULE:     3600,
  FAVORITES:    300,
};

const CacheService = {
  getTopAnime:           ()           => getCache('anime:top'),
  setTopAnime:           (d)          => setCache('anime:top', d, TTL.ANIME_TOP),
  getSeasonNow:          ()           => getCache('anime:season:now'),
  setSeasonNow:          (d)          => setCache('anime:season:now', d, TTL.ANIME_TOP),
  getAnimeDetail:        (id)         => getCache(`anime:detail:${id}`),
  setAnimeDetail:        (id,d)       => setCache(`anime:detail:${id}`, d, TTL.ANIME_DETAIL),
  getAnimeVideos:        (id)         => getCache(`anime:videos:${id}`),
  setAnimeVideos:        (id,d)       => setCache(`anime:videos:${id}`, d, TTL.ANIME_VIDEOS),
  getSchedule:           (day)        => getCache(`anime:schedule:${day}`),
  setSchedule:           (day,d)      => setCache(`anime:schedule:${day}`, d, TTL.SCHEDULE),
  getMangaList:          (key)        => getCache(`manga:list:${key}`),
  setMangaList:          (key,d)      => setCache(`manga:list:${key}`, d, TTL.MANGA_LIST),
  getSearch:             (q)          => getCache(`search:${q.toLowerCase().trim()}`),
  setSearch:             (q,d)        => setCache(`search:${q.toLowerCase().trim()}`, d, TTL.SEARCH),
  getStream:             (m,s,e,l)    => getCache(`stream:${m}:s${s}:e${e}:${l}`),
  setStream:             (m,s,e,l,d)  => setCache(`stream:${m}:s${s}:e${e}:${l}`, d, TTL.STREAM_CHECK),
  getFavorites:          (pid,type)   => getCache(`fav:${pid}:${type}`),
  setFavorites:          (pid,type,d) => setCache(`fav:${pid}:${type}`, d, TTL.FAVORITES),
  delFavorites:          (pid,type)   => delCache(`fav:${pid}:${type}`),
  invalidateAnime:       ()           => delPattern('anime:*'),
  invalidateManga:       ()           => delPattern('manga:*'),
  invalidateSearch:      ()           => delPattern('search:*'),
};

module.exports = CacheService;
