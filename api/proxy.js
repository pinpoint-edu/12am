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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,HEAD,POST');
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

    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': parsedUrl.origin + '/',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    };

    let response = await fetch(decodedUrl, fetchOptions);

    // Fallback for glseries.net -> www.glseries.net if 404
    if (response.status === 404 && decodedUrl.includes('glseries.net') && !decodedUrl.includes('www.')) {
      const wwwUrl = decodedUrl.replace('glseries.net', 'www.glseries.net');
      response = await fetch(wwwUrl, fetchOptions);
    }

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch: ${response.statusText}`);
    }

    // Forward relevant headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const contentLength = response.headers.get('content-length');
    if (contentLength && !contentType.includes('text/html')) {
      res.setHeader('Content-Length', contentLength);
    }

    // Optimization: Cache images and static assets
    if (contentType.startsWith('image/') || contentType.includes('font') || contentType.includes('audio')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    // URL Rewriting for TGLSC and text-based content
    if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('text/css')) {
      let text = await response.text();
      
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

      res.send(text);
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
