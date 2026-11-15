// api/sports.js — Cached StreamFree + DaddyLiveHD (DLHD) API proxy for 12AM Sports
const STREAMFREE_BASE = 'https://streamfree.top/api/v1';
const DLHD_BASE = 'https://thedaddy.li';
const cache = new Map();

function getCached(key, ttlMs) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < ttlMs) {
        return entry.data;
    }
    return null;
}

function setCached(key, data) {
    cache.set(key, { ts: Date.now(), data });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const provider = String(req.query.provider || 'streamfree').toLowerCase();
    const action = String(req.query.action || 'streams').toLowerCase();
    const category = String(req.query.category || '').trim().toLowerCase();
    const key = String(req.query.key || '').trim();

    if (provider === 'dlhd') {
        const apiKey = String(req.query.apikey || process.env.DLHD_API_KEY || '').trim();
        const endpoint = action === 'channels' ? 'channels' : (action === 'info' ? 'info' : 'schedule');
        const cacheKey = `dlhd:${endpoint}:${apiKey ? 'keyed' : 'public'}`;
        const ttlMs = endpoint === 'channels' ? 5 * 60 * 1000 : 2 * 60 * 1000;

        const cached = getCached(cacheKey, ttlMs);
        if (cached) {
            res.setHeader('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}`);
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cached);
        }

        try {
            if (apiKey) {
                const url = `${DLHD_BASE}/daddyapi.php?key=${encodeURIComponent(apiKey)}&endpoint=${encodeURIComponent(endpoint)}`;
                const upstream = await fetch(url, {
                    headers: { 'Accept': 'application/json', 'User-Agent': '12AM-Sports/1.0' }
                });
                if (!upstream.ok) {
                    return res.status(upstream.status).json({ error: `DLHD upstream returned ${upstream.status}` });
                }
                const data = await upstream.json();
                setCached(cacheKey, data);
                res.setHeader('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}`);
                return res.status(200).json(data);
            }

            // Fallback public schedule endpoint if no API key is configured
            if (endpoint === 'schedule') {
                const pubRes = await fetch(`${DLHD_BASE}/schedule/schedule-generated.json`, {
                    headers: { 'Accept': 'application/json', 'User-Agent': '12AM-Sports/1.0' }
                });
                if (pubRes.ok) {
                    const pubData = await pubRes.json();
                    const wrapped = { success: true, data: pubData, source: 'public' };
                    setCached(cacheKey, wrapped);
                    res.setHeader('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}`);
                    return res.status(200).json(wrapped);
                }
            }

            return res.status(200).json({
                success: false,
                requiresKey: true,
                error: 'DLHD_API_KEY_REQUIRED',
                message: 'Set DLHD API key to load DaddyLiveHD schedule & channels.'
            });
        } catch (err) {
            return res.status(502).json({ error: 'Failed to reach DaddyLiveHD API', detail: err.message });
        }
    }

    // Default: StreamFree API
    let targetUrl = `${STREAMFREE_BASE}/streams`;
    let ttlMs = 60 * 1000;
    let cacheKey = 'streams:all';

    if (action === 'categories') {
        targetUrl = `${STREAMFREE_BASE}/categories`;
        ttlMs = 10 * 60 * 1000;
        cacheKey = 'categories';
    } else if (action === 'sources' && key) {
        targetUrl = `${STREAMFREE_BASE}/sources/${encodeURIComponent(key)}`;
        ttlMs = 30 * 1000;
        cacheKey = `sources:${key}`;
    } else if (action === 'stream' && key) {
        targetUrl = `${STREAMFREE_BASE}/streams/${encodeURIComponent(key)}`;
        ttlMs = 30 * 1000;
        cacheKey = `stream:${key}`;
    } else if (category && category !== 'all') {
        targetUrl = `${STREAMFREE_BASE}/streams?category=${encodeURIComponent(category)}`;
        cacheKey = `streams:${category}`;
    }

    const cached = getCached(cacheKey, ttlMs);
    if (cached) {
        res.setHeader('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}`);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
    }

    try {
        const upstream = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': '12AM-Sports/1.0'
            }
        });

        if (!upstream.ok) {
            return res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
        }

        const data = await upstream.json();
        setCached(cacheKey, data);
        res.setHeader('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}`);
        res.setHeader('X-Cache', 'MISS');
        return res.status(200).json(data);
    } catch (err) {
        return res.status(502).json({ error: 'Failed to reach StreamFree API', detail: err.message });
    }
}
