// api/proxy.js
// Enhanced proxy for games and assets with SSRF protection and URL rewriting

function isBlockedHost(host) {
  const h = (host || "").toLowerCase().trim();
  if (!h || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h.startsWith("[")) return true;
  return false;
}

function rewriteM3u8Proxy(manifest, baseUrl) {
  const wrap = (raw) => {
    try {
      const abs = new URL(raw.trim(), baseUrl).href;
      if (!/^https?:/i.test(abs)) return raw;
      return `/api/proxy?url=${encodeURIComponent(abs)}`;
    } catch {
      return raw;
    }
  };
  return manifest
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${wrap(u)}"`);
      }
      return wrap(trimmed);
    })
    .join("\n");
}

async function readReqBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return req.body;
    return JSON.stringify(req.body);
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,HEAD,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, ...params } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  try {
    let decodedUrl = decodeURIComponent(url);
    
    // Reconstruct query string if there were other parameters
    const queryParams = new URLSearchParams(params).toString();
    if (queryParams) {
      decodedUrl += (decodedUrl.includes('?') ? '&' : '?') + queryParams;
    }

    if (!/^https?:\/\//i.test(decodedUrl)) {
      decodedUrl = 'https://' + decodedUrl;
    }

    const parsedUrl = new URL(decodedUrl);
    if (isBlockedHost(parsedUrl.hostname)) {
      return res.status(403).json({ error: 'Host not allowed' });
    }

    // Intercept defunct Flash ad/tracker hosts (MochiAds, MochiBot, CPMStar, ArmorBot) so old SWFs don't trigger 500 errors
    if (/(?:^|\.)(?:mochiads\.com|mochibot\.com|cpmstar\.com|armorbot\.com|kongetrack\.com)$/i.test(parsedUrl.hostname)) {
      if (/\.swf(?:$|[?#])/i.test(parsedUrl.pathname)) {
        const emptySwf = Buffer.from([
          0x46, 0x57, 0x53, 0x09, 0x19, 0x00, 0x00, 0x00,
          0x78, 0x00, 0x05, 0x5f, 0x00, 0x00, 0x0f, 0xa0, 0x00,
          0x00, 0x0c, 0x01, 0x00, 0x40, 0x00, 0x00, 0x00
        ]);
        res.setHeader('Content-Type', 'application/x-shockwave-flash');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(emptySwf);
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send('{}');
    }

    const upstreamHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Referer': parsedUrl.origin + '/',
      'Accept': req.headers.accept || '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive'
    };
    if (req.headers.range) upstreamHeaders['Range'] = req.headers.range;
    if (req.headers['content-type']) upstreamHeaders['Content-Type'] = req.headers['content-type'];

    const fetchOptions = {
      method: req.method || 'GET',
      headers: upstreamHeaders
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await readReqBody(req);
      if (body !== undefined) fetchOptions.body = body;
    }

    let response = await fetch(decodedUrl, fetchOptions);

    // Fallback for glseries.net -> www.glseries.net if 404
    if (response.status === 404 && decodedUrl.includes('glseries.net') && !decodedUrl.includes('www.')) {
      const wwwUrl = decodedUrl.replace('glseries.net', 'www.glseries.net');
      response = await fetch(wwwUrl, fetchOptions);
    }

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch: ${response.statusText}`);
    }

    let buffer = Buffer.from(await response.arrayBuffer());
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (decodedUrl.toLowerCase().includes('.wasm')) {
      contentType = 'application/wasm';
    }

    // Automatic Git LFS resolution (fixes wasm magic word error: expected 00 61 73 6d, found 76 65 72 73 'vers')
    if (buffer.length < 1000 && buffer.toString('utf8').includes('git-lfs.github.com/spec/v1')) {
      let lfsUrl = null;
      const rawMatch = decodedUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/i);
      const ioMatch = decodedUrl.match(/([^/]+)\.github\.io\/([^/]+)\/(.+)/i);
      if (rawMatch) {
        lfsUrl = `https://media.githubusercontent.com/media/${rawMatch[1]}/${rawMatch[2]}/${rawMatch[3]}/${rawMatch[4]}`;
      } else if (ioMatch) {
        lfsUrl = `https://media.githubusercontent.com/media/${ioMatch[1]}/${ioMatch[2]}/master/${ioMatch[3]}`;
      }
      if (lfsUrl) {
        try {
          let lfsRes = await fetch(lfsUrl, fetchOptions);
          if (!lfsRes.ok && ioMatch) {
            lfsRes = await fetch(`https://media.githubusercontent.com/media/${ioMatch[1]}/${ioMatch[2]}/main/${ioMatch[3]}`, fetchOptions);
          }
          if (lfsRes.ok) {
            buffer = Buffer.from(await lfsRes.arrayBuffer());
            if (decodedUrl.toLowerCase().includes('.wasm')) {
              contentType = 'application/wasm';
            }
          }
        } catch(e) {}
      }
    }

    // Detect HTML payloads served as text/plain (e.g., raw.githubusercontent.com .html files)
    if (contentType.includes('text/plain')) {
      const headTrim = buffer.slice(0, 512).toString('utf8').trim().toLowerCase();
      if (
        /\.(?:html?|xhtml)(?:$|[?#])/i.test(decodedUrl) ||
        headTrim.startsWith('<!doctype html') ||
        headTrim.startsWith('<html') ||
        headTrim.startsWith('<head') ||
        headTrim.startsWith('<body') ||
        headTrim.startsWith('<base') ||
        headTrim.startsWith('<script')
      ) {
        contentType = 'text/html; charset=utf-8';
      }
    }

    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

    const finalUrl = response.url || decodedUrl;
    const isM3u8 = /\.m3u8(?:$|[?#])/i.test(finalUrl) || contentType.includes('mpegurl') || contentType.includes('m3u8');
    if (isM3u8) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      const rewritten = rewriteM3u8Proxy(buffer.toString('utf8'), finalUrl);
      return res.status(response.status).send(rewritten);
    }

    res.setHeader('Content-Type', contentType);

    // URL Rewriting for TGLSC and text-based content
    if (contentType.includes('text/html') || contentType.includes('javascript') || contentType.includes('text/css')) {
      let text = buffer.toString('utf8');
      
      if (decodedUrl.includes('glseries.net')) {
        // Replace absolute URLs
        text = text.replace(/https?:\/\/(www\.)?glseries\.net\//g, '/tglsc-proxy/');
        
        // Replace root-relative URLs
        text = text.replace(/(src|href|url)\s*=\s*["']\/(assets|js|css|img|images|lib)\//g, (match, p1, p2) => {
          return `${p1}="/tglsc-proxy/${p2}/`;
        });
        
        // Handle root-relative URLs in scripts
        text = text.replace(/["']\/(assets|js|css|img|images|lib)\//g, (match, p1) => {
          return `"/tglsc-proxy/${p1}/`;
        });
      }

      return res.status(response.status).send(text);
    } else {
      // Optimization: Cache images and static assets
      if (contentType.startsWith('image/') || contentType.includes('font') || contentType.includes('audio') || contentType.includes('wasm')) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }

      return res.status(response.status).send(buffer);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
