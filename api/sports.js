// api/sports.js — Cached StreamFree API proxy for 12AM Sports
const UPSTREAM_BASE = 'https://streamfree.top/api/v1';
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

    const action = String(req.query.action || 'streams').toLowerCase();
    const category = String(req.query.category || '').trim().toLowerCase();
    const key = String(req.query.key || '').trim();

    let targetUrl = `${UPSTREAM_BASE}/streams`;
    let ttlMs = 60 * 1000;
    let cacheKey = 'streams:all';

    if (action === 'categories') {
        targetUrl = `${UPSTREAM_BASE}/categories`;
        ttlMs = 10 * 60 * 1000;
        cacheKey = 'categories';
    } else if (action === 'sources' && key) {
        targetUrl = `${UPSTREAM_BASE}/sources/${encodeURIComponent(key)}`;
        ttlMs = 30 * 1000;
        cacheKey = `sources:${key}`;
    } else if (action === 'stream' && key) {
        targetUrl = `${UPSTREAM_BASE}/streams/${encodeURIComponent(key)}`;
        ttlMs = 30 * 1000;
        cacheKey = `stream:${key}`;
    } else if (category && category !== 'all') {
        targetUrl = `${UPSTREAM_BASE}/streams?category=${encodeURIComponent(category)}`;
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
