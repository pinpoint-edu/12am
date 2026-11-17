let streamRouter = null;

// Virtual-route sandbox: set to your deployed Google Apps Script Web App URL (see apps-script/Code.gs)
const BACKEND_PIPELINE = "https://script.google.com/macros/s/AKfycbzzdqqtMyOe918m4QYYLQckHA8gm4Fu5fkpZxI_-EUpla5JUmRsbOc8IQzMKTNDuXBSoQ/exec";
const VIRTUAL_ROUTE = "/virtual-route/";

function toVirtual(ref, base) {
    try {
        const abs = new URL(ref, base).href;
        if (!/^https?:/i.test(abs)) return ref;
        return VIRTUAL_ROUTE + encodeURIComponent(abs);
    } catch (e) { return ref; }
}

// clientId -> target base URL for documents served through the virtual route
const clientBases = new Map();
const PASSTHROUGH_HOSTS = ["unpkg.com", "cdn.jsdelivr.net"]; // Ruffle (Flash emulator) assets
const BLOCK_HOSTS = ["fuseplatform.net", "btloader.com", "doubleclick.net", "googlesyndication.com",
    "googletagmanager.com", "google-analytics.com", "adnxs.com", "amazon-adsystem.com", "pubmatic.com",
    "rubiconproject.com", "snigelweb.com", "adngin.com", "amazon-adsystem.com", "adsafeprotected.com", "moatads.com", "scorecardresearch.com", "quantserve.com", "permutive.com", "cloudflareinsights.com", "criteo.com", "openx.net", "adsrvr.org", "ezoic.net", "taboola.com", "outbrain.com"];
const RUFFLE_INJECT = '<script>window.RufflePlayer=window.RufflePlayer||{};window.RufflePlayer.config={publicPath:"https://unpkg.com/@ruffle-rs/ruffle/",warnOnUnsupportedContent:false};<\/script>' +
    '<script src="https://unpkg.com/@ruffle-rs/ruffle"><\/script>';

function hostMatches(host, list) {
    return list.some(h => host === h || host.endsWith("." + h));
}

function baseFromUrl(u) {
    const i = u.indexOf(VIRTUAL_ROUTE);
    if (i < 0) return null;
    try { return decodeURIComponent(u.slice(i + VIRTUAL_ROUTE.length).split("#")[0]); } catch (e) { return null; }
}

function rewriteHTML(html, base) {
    html = html.replace(/(\s(?:src|href|action|poster)\s*=\s*)(["'])(.*?)\2/gi, (m, a, q, v) => {
        if (/^(#|data:|javascript:|blob:|mailto:)/i.test(v.trim())) return m;
        return a + q + toVirtual(v.trim(), base) + q;
    });
    return html.replace(/url\(\s*(["']?)(?!data:|#)(.*?)\1\s*\)/gi, (m, q, v) => "url(" + q + toVirtual(v, base) + q + ")");
}

const NULL_BODY = [101, 204, 205, 304];
function mk(body, status, headers) {
    if (NULL_BODY.includes(status)) body = null;
    if (status < 200 || status > 599) status = 502;
    return new Response(body, { status, headers });
}

async function handleVirtualRoute(requestUrl, base) {
    const idx = requestUrl.indexOf(VIRTUAL_ROUTE);
    let rest = requestUrl.slice(idx + VIRTUAL_ROUTE.length).split("#")[0];
    let actualTarget;
    try {
        if (/^https?(:|%3A)/i.test(rest)) actualTarget = decodeURIComponent(rest);
        else if (base) actualTarget = new URL(decodeURIComponent(rest), base).href; // relative path built by page JS/HTML
        else actualTarget = "";
    } catch (e) { actualTarget = ""; }
    if (!/^https?:\/\//i.test(actualTarget)) {
        return new Response("Invalid target", { status: 400 });
    }
    if (BACKEND_PIPELINE.startsWith("YOUR_")) {
        return new Response("Backend not configured: set BACKEND_PIPELINE in sw.js", { status: 500 });
    }
    try {
        const res = await fetch(BACKEND_PIPELINE + "?b64=1&url=" + encodeURIComponent(actualTarget));
        const data = await res.json();
        const bin = Uint8Array.from(atob(data.body), c => c.charCodeAt(0));
        const type = data.contentType || "application/octet-stream";
        if (/text\/html/i.test(type)) {
            let html = rewriteHTML(new TextDecoder().decode(bin), actualTarget);
            html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + RUFFLE_INJECT) : RUFFLE_INJECT + html;
            return mk(html, data.status, { "Content-Type": "text/html; charset=utf-8" });
        }
        if (/text\/css/i.test(type)) {
            const css = rewriteHTML(new TextDecoder().decode(bin), actualTarget);
            return mk(css, data.status, { "Content-Type": "text/css; charset=utf-8" });
        }
        return mk(bin, data.status, { "Content-Type": type });
    } catch (err) {
        return new Response("Gateway Error: " + err, { status: 502 });
    }
}
// Ultraviolet / BareMux SharedWorker disabled - proxy traffic routed via unblocker gateway

let textbookHTML = "";

const LOCAL_PATHS = [
    "/",
    "/index.html",
    "/web.html",
    "/db.js",
    "/sw.js",
    "/favicon.ico",
    "/games.json"
];

function isLocalResource(pathname) {
    if (LOCAL_PATHS.includes(pathname)) return true;
    if (pathname.startsWith("/favicons/") ||
        pathname.startsWith("/images/") ||
        pathname.startsWith("/styles/") ||
        pathname.startsWith("/scripts/") ||
        pathname.startsWith("/textbooks/")) {
        return true;
    }
    return false;
}

self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
    if (event.data && (event.data.type === "LOAD_TEXTBOOK" || event.data.type === "LOAD_GAME")) {
        textbookHTML = event.data.html;
    }
});

function fixContentType(response, pathname) {
    const ext = pathname.split('.').pop().toLowerCase().split('?')[0];
    const mimeMap = {
        'wasm': 'application/wasm',
        'js': 'application/javascript; charset=utf-8',
        'mjs': 'application/javascript; charset=utf-8',
        'json': 'application/json; charset=utf-8',
        'swf': 'application/x-shockwave-flash',
        'html': 'text/html; charset=utf-8',
        'htm': 'text/html; charset=utf-8',
        'css': 'text/css; charset=utf-8',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'webm': 'video/webm',
        'mp3': 'audio/mpeg',
        'ogg': 'audio/ogg',
        'wav': 'audio/wav',
        'woff2': 'font/woff2',
        'woff': 'font/woff',
        'ttf': 'font/ttf'
    };

    const targetMime = mimeMap[ext];
    if (!targetMime) return response;

    const currentMime = response.headers.get('content-type') || '';
    if (currentMime.toLowerCase().includes(targetMime.split(';')[0])) {
        return response;
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('content-type', targetMime);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

self.addEventListener("fetch", (event) => {
    try {
        if (streamRouter && streamRouter.route(event)) {
            event.respondWith(streamRouter.fetch(event));
            return;
        }
    } catch (err) {}

    if (event.request.method !== "GET") return;

    const reqUrl = new URL(event.request.url);
    if (reqUrl.pathname.startsWith(VIRTUAL_ROUTE)) {
        if (event.resultingClientId) {
            const b = baseFromUrl(event.request.url);
            if (b && /^https?:/i.test(b)) clientBases.set(event.resultingClientId, b);
        }
        const vbase = (event.clientId && clientBases.get(event.clientId)) || baseFromUrl(event.request.referrer || "");
        event.respondWith(handleVirtualRoute(event.request.url, vbase));
        return;
    }

    // Subresource requests (incl. JS-built URLs) coming from a sandboxed frame
    const frameBase = (event.clientId && clientBases.get(event.clientId)) || baseFromUrl(event.request.referrer || "");
    if (frameBase && event.request.mode !== "navigate") {
        if (hostMatches(reqUrl.hostname, PASSTHROUGH_HOSTS)) return;
        if (hostMatches(reqUrl.hostname, BLOCK_HOSTS)) {
            event.respondWith(new Response(null, { status: 204 }));
            return;
        }
        let abs;
        try {
            abs = reqUrl.origin === self.location.origin
                ? new URL(reqUrl.pathname + reqUrl.search, frameBase).href
                : reqUrl.href;
        } catch (e) { return; }
        event.respondWith(handleVirtualRoute(VIRTUAL_ROUTE + encodeURIComponent(abs)));
        return;
    }

    const rawUrl = event.request.url;
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
        return;
    }

    const url = new URL(rawUrl);

    if (url.pathname === "/virtual-game" || url.pathname.endsWith("/virtual-game") ||
        url.pathname === "/virtual-textbook" || url.pathname.endsWith("/virtual-textbook")) {
        event.respondWith(
            new Response(textbookHTML, {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            })
        );
        return;
    }

    if (isLocalResource(url.pathname)) {
        event.respondWith((async () => {
            try {
                const cache = await caches.open("pinpoint-game-cache");
                const pathname = url.pathname;
                const pathWithoutSlash = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
                const pathWithSlash = pathname.endsWith("/") ? pathname : pathname + "/";
                const pathIndexHtml = pathWithSlash + "index.html";
                const pathNoIndexHtml = pathname.endsWith("/index.html") ? pathname.replace(/\/index\.html$/, "/") : pathname;

                const candidates = [
                    event.request,
                    pathname,
                    rawUrl,
                    url.origin + pathname,
                    pathWithSlash,
                    pathWithoutSlash,
                    pathIndexHtml,
                    pathNoIndexHtml,
                    pathNoIndexHtml.replace(/\/$/, ""),
                    pathname.replace(/^\/+/, ""),
                    decodeURIComponent(pathname),
                    encodeURI(pathname),
                    url.origin + pathWithSlash,
                    url.origin + pathWithoutSlash
                ];

                for (const candidate of candidates) {
                    const match = await cache.match(candidate, { ignoreSearch: true });
                    if (match) {
                        return fixContentType(match, pathname);
                    }
                }
            } catch (cacheErr) {}

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);
                const response = await fetch(event.request, { signal: controller.signal });
                clearTimeout(timeoutId);
                return response;
            } catch (networkErr) {
                try {
                    const cache = await caches.open("pinpoint-game-cache");
                    const fallbackMatch = await cache.match(event.request, { ignoreSearch: true });
                    if (fallbackMatch) return fixContentType(fallbackMatch, url.pathname);
                } catch(e) {}

                return new Response("Offline resource unavailable", {
                    status: 503,
                    statusText: "Offline",
                    headers: { "Content-Type": "text/plain; charset=utf-8" }
                });
            }
        })());
        return;
    }
});
