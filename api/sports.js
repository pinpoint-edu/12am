// api/sports.js — Cached StreamFree + DaddyLiveHD (DLHD) API & Stealth AdShield Embed Proxy
const STREAMFREE_BASE = 'https://streamfree.top/api/v1';
const DLHD_BASE = 'https://thedaddy.li';
const cache = new Map();

const AD_HOST_PATTERN = '(?:novemberfrost|popads|popcash|propellerads|monetag|adsterra|effectivegatecpm|highperformanceformat|hilltopads|onclicka|onclickalgo|acscdn|exoclick|tsyndicate|trafficjunky|juicyads|googlesyndication|doubleclick|adnxs|taboola|outbrain|mgid|revcontent|bidvertiser|chitika|infolinks|yandex\\.ru\\/ads|mc\\.yandex|disable-devtool|adtng|adsco\\.re|pubfuture|richpush|pushground|galaksion|evadav|clickadu|admaven|shorte\\.st|ouo\\.io|linkvertise|bidgear|vdo\\.ai|2mdn\\.net|quantserve|scorecardresearch|histats|whos\\.amung\\.us|livejasmin|chaturbate|stripchat|bongacams)';
const AD_HOST_RE = new RegExp(AD_HOST_PATTERN, 'i');

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

function isSafeRemoteUrl(rawUrl) {
    try {
        const u = new URL(rawUrl);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
        const host = u.hostname.toLowerCase();
        if (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host === '::1' ||
            host === '0.0.0.0' ||
            host.endsWith('.local') ||
            host.endsWith('.internal') ||
            /^10\./.test(host) ||
            /^192\.168\./.test(host) ||
            /^169\.254\./.test(host) ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
        ) {
            return null;
        }
        return u;
    } catch (_) {
        return null;
    }
}

function buildStealthShieldScript(targetOrigin, proxyBaseUrl) {
    const safeOrigin = JSON.stringify(targetOrigin);
    const safeProxy = JSON.stringify(proxyBaseUrl);
    return `<style id="__12am_adshield_css">
ins.adsbygoogle, [id*="ad-banner"], [class*="ad-banner"], [class*="popunder"],
[id*="popunder"], [class*="ad-overlay"], [id*="ad-overlay"], [class*="adsbox"],
[data-ad-slot], iframe[src*="popads"], iframe[src*="adsterra"], iframe[src*="exoclick"],
iframe[src*="hilltopads"], iframe[src*="monetag"], iframe[src*="propellerads"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
}
</style>
<script data-adshield="1">
(function() {
    'use strict';
    var TARGET_ORIGIN = ${safeOrigin};
    var PROXY_BASE = ${safeProxy};
    var AD_RE = /${AD_HOST_PATTERN}/i;

    // 1. Zero-alarm window.open spoof: returns a harmless fake Window so anti-adblock/sandbox checks pass
    var noop = function() {};
    var fakeWin = {
        closed: false,
        focus: noop,
        blur: noop,
        close: function() { this.closed = true; },
        postMessage: noop,
        location: { href: 'about:blank', replace: noop, assign: noop },
        document: { open: noop, write: noop, writeln: noop, close: noop, body: {} }
    };
    try {
        Object.defineProperty(window, 'open', {
            configurable: true,
            writable: false,
            value: function() { return fakeWin; }
        });
    } catch (_) {
        window.open = function() { return fakeWin; };
    }

    // 2. Neutralize ad-network fetch/XHR silently (returns 200 empty response -> no alarm)
    if (window.fetch) {
        var origFetch = window.fetch.bind(window);
        window.fetch = function(input, init) {
            var url = typeof input === 'string' ? input : (input && input.url) || '';
            if (AD_RE.test(url)) {
                return Promise.resolve(new Response('', { status: 200, statusText: 'OK' }));
            }
            return origFetch(input, init);
        };
    }
    if (window.XMLHttpRequest) {
        var origOpen = XMLHttpRequest.prototype.open;
        var origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            this.__12amBlocked = typeof url === 'string' && AD_RE.test(url);
            if (this.__12amBlocked) return;
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function() {
            if (this.__12amBlocked) {
                try {
                    Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
                    Object.defineProperty(this, 'status', { value: 200, configurable: true });
                    Object.defineProperty(this, 'responseText', { value: '', configurable: true });
                } catch (_) {}
                return;
            }
            return origSend.apply(this, arguments);
        };
    }

    // 3. Block dynamically injected ad scripts & recursively shield nested player iframes
    function rewriteNestedIframe(iframe) {
        try {
            var src = iframe.getAttribute('src') || '';
            if (!src || src === 'about:blank' || src.indexOf(PROXY_BASE) === 0) return;
            if (AD_RE.test(src)) {
                iframe.remove();
                return;
            }
            if (/^https?:/i.test(src) || src.indexOf('//') === 0) {
                var abs = src.indexOf('//') === 0 ? 'https:' + src : src;
                if (abs.indexOf(TARGET_ORIGIN) !== 0 || /stream|cast|watch|player|embed/i.test(abs)) {
                    iframe.setAttribute('src', PROXY_BASE + '?action=embed&url=' + encodeURIComponent(abs) + '&ref=' + encodeURIComponent(TARGET_ORIGIN + '/'));
                }
            }
        } catch (_) {}
    }

    var origCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName, options) {
        var el = origCreateElement(tagName, options);
        var tag = String(tagName || '').toLowerCase();
        if (tag === 'script') {
            var origSetAttr = el.setAttribute.bind(el);
            el.setAttribute = function(name, val) {
                if (String(name).toLowerCase() === 'src' && AD_RE.test(String(val))) {
                    return;
                }
                return origSetAttr(name, val);
            };
            try {
                var srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
                if (srcDesc && srcDesc.set) {
                    Object.defineProperty(el, 'src', {
                        configurable: true,
                        get: function() { return srcDesc.get.call(this); },
                        set: function(v) {
                            if (AD_RE.test(String(v))) return;
                            srcDesc.set.call(this, v);
                        }
                    });
                }
            } catch (_) {}
        }
        return el;
    };

    // 4. Clickjacking & transparent overlay blocker (capture phase)
    function isPlayerControl(el) {
        if (!el || el.nodeType !== 1) return false;
        var tag = el.tagName.toLowerCase();
        if (tag === 'video' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'svg' || tag === 'path') return true;
        return !!el.closest('video, .jwplayer, .plyr, .vjs-control-bar, .clappr-player, [class*="player-control"]');
    }

    function isTransparentClickjack(el) {
        if (!el || el.nodeType !== 1 || isPlayerControl(el)) return false;
        var rect = el.getBoundingClientRect();
        if (rect.width < window.innerWidth * 0.45 || rect.height < window.innerHeight * 0.45) return false;
        var style = window.getComputedStyle(el);
        var bg = style.backgroundColor || '';
        var z = parseInt(style.zIndex, 10) || 0;
        var isTransparent = style.opacity === '0' || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
        return isTransparent && (z >= 10 || style.position === 'fixed' || style.position === 'absolute') && el.tagName !== 'VIDEO' && !el.querySelector('video');
    }

    ['click', 'mousedown', 'pointerdown', 'touchstart'].forEach(function(evtName) {
        document.addEventListener(evtName, function(e) {
            var target = e.target;
            if (!target || target.nodeType !== 1) return;
            var link = target.closest && target.closest('a');
            if (link) {
                var t = (link.getAttribute('target') || '').toLowerCase();
                var href = link.getAttribute('href') || '';
                if (t === '_blank' || t === '_top' || t === '_parent' || AD_RE.test(href) || /^https?:/i.test(href)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                }
            }
            if (isTransparentClickjack(target)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                target.style.pointerEvents = 'none';
                target.style.display = 'none';
                return false;
            }
        }, true);
    });

    // 5. MutationObserver to remove injected ad iframes, banners, and inline onclick hijacks
    function cleanNode(node) {
        if (!node || node.nodeType !== 1) return;
        var tag = node.tagName.toLowerCase();
        if (tag === 'iframe') {
            rewriteNestedIframe(node);
            return;
        }
        if (tag === 'ins' && (node.className || '').indexOf('adsby') !== -1) {
            node.remove();
            return;
        }
        if (node.hasAttribute && node.hasAttribute('onclick')) {
            var oc = node.getAttribute('onclick') || '';
            if (/window\\.open|location\\s*=|pop/i.test(oc)) {
                node.removeAttribute('onclick');
            }
        }
        if (isTransparentClickjack(node)) {
            node.style.pointerEvents = 'none';
            node.style.display = 'none';
        }
    }

    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var n = added[j];
                cleanNode(n);
                if (n.querySelectorAll) {
                    var iframes = n.querySelectorAll('iframe, ins, [onclick]');
                    for (var k = 0; k < iframes.length; k++) cleanNode(iframes[k]);
                }
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('DOMContentLoaded', function() {
        document.body && (document.body.onclick = null);
        var iframes = document.querySelectorAll('iframe');
        for (var i = 0; i < iframes.length; i++) rewriteNestedIframe(iframes[i]);
    });
})();
</script>`;
}

function sanitizeEmbedHtml(html, targetUrl, proxyBaseUrl) {
    const parsed = new URL(targetUrl);
    const baseHref = `${parsed.origin}${parsed.pathname.replace(/[^/]*$/, '')}`;
    const shieldScript = buildStealthShieldScript(parsed.origin, proxyBaseUrl);

    let out = String(html || '');

    // Strip meta refresh redirects
    out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');

    // Neutralize external ad-network script tags
    out = out.replace(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/script>/gi, (match, src) => {
        if (AD_HOST_RE.test(src)) {
            return '<!-- ad-script-blocked -->';
        }
        return match;
    });

    // Inject <base> and stealth shield right after <head> (or prepend if no <head>)
    const injection = `<base href="${baseHref}">\n${shieldScript}`;
    if (/<head[^>]*>/i.test(out)) {
        out = out.replace(/<head[^>]*>/i, (m) => `${m}\n${injection}`);
    } else {
        out = `${injection}\n${out}`;
    }
    return out;
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

    // Stealth AdShield HTML proxy for stream embeds
    if (action === 'embed') {
        const rawUrl = String(req.query.url || '').trim();
        const parsed = isSafeRemoteUrl(rawUrl);
        if (!parsed) {
            return res.status(400).send('Invalid embed URL');
        }
        const ref = String(req.query.ref || `${parsed.origin}/`).trim();
        try {
            const upstream = await fetch(parsed.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': ref
                }
            });

            const text = await upstream.text();
            const isCfChallenge = upstream.status === 403 || upstream.status === 503 ||
                /cf-mitigated|challenge-platform|Just a moment\.\.\./i.test(text);

            if (!upstream.ok || isCfChallenge) {
                res.setHeader('X-Embed-Fallback', '1');
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.status(200).send(`<!doctype html><html><body style="background:#0d0d0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><script>window.parent&&window.parent.postMessage({type:'12am-embed-fallback',url:${JSON.stringify(parsed.toString())}},'*');</script>Loading direct protected stream...</body></html>`);
            }

            const sanitized = sanitizeEmbedHtml(text, parsed.toString(), '/api/sports');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).send(sanitized);
        } catch (err) {
            res.setHeader('X-Embed-Fallback', '1');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(`<!doctype html><html><body style="background:#0d0d0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><script>window.parent&&window.parent.postMessage({type:'12am-embed-fallback',url:${JSON.stringify(parsed.toString())}},'*');</script>Reconnecting stream...</body></html>`);
        }
    }

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
