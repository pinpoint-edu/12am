// api/music-api.js
// 12AM Music API Proxy & Resolver

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParts = pathname.split('/').filter(Boolean);
  const endpointFromPath = pathParts[pathParts.length - 1];
  const { q, query, term, id, title, artist, endpoint: endpointFromQuery, url: targetUrl } = req.query;
  const endpoint = endpointFromQuery || endpointFromPath;

  try {
    // 1. Suggestions
    if (endpoint === 'suggestions') {
      const searchQuery = q || query || term || '';
      if (!searchQuery) return res.status(200).json({ suggestions: [] });

      try {
        const resp = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(searchQuery)}`);
        if (resp.ok) {
          const data = await resp.json();
          const items = Array.isArray(data[1]) ? data[1] : [];
          return res.status(200).json({
            suggestions: items.map(s => ({
              name: String(s),
              type: 'Search'
            }))
          });
        }
      } catch (e) {}

      return res.status(200).json({ suggestions: [] });
    }

    // 2. Search
    if (endpoint === 'search') {
      const searchQuery = q || query || term || '';
      if (!searchQuery) return res.status(400).json({ error: 'Missing query' });

      let tracks = [];

      // 1. Try iTunes API
      try {
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=30`);
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (itunesData && Array.isArray(itunesData.results)) {
            tracks = itunesData.results.map(item => {
              const highResArtwork = (item.artworkUrl100 || '').replace('100x100bb', '500x500bb');
              return {
                id: `itunes-${item.trackId}`,
                title: item.trackName || item.collectionName || 'Unknown Title',
                artist_name: item.artistName || 'Unknown Artist',
                artwork_url: highResArtwork || item.artworkUrl100,
                duration: (item.trackTimeMillis || 0),
                preview_url: item.previewUrl,
                audio_url: item.previewUrl,
                downloadUrl: item.previewUrl ? [{ quality: '256kbps', link: item.previewUrl }] : [],
                source: 'iTunes'
              };
            });
          }
        }
      } catch (e) {}

      // 2. Try Upstream Music API fallback if tracks empty
      if (tracks.length === 0) {
        try {
          const upRes = await fetch(`https://yolkaudio.broshan.com.np/api/music-api?endpoint=search&q=${encodeURIComponent(searchQuery)}`);
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData && upData.tracks) return res.status(200).json(upData);
          }
        } catch (e) {}
      }

      return res.status(200).json({
        tracks,
        albums: [],
        artists: [],
        playlists: []
      });
    }

    // 3. Lyrics
    if (endpoint === 'lyrics') {
      const songTitle = title || id || '';
      const songArtist = artist || '';

      if (songArtist && songTitle) {
        try {
          const lyrRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(songArtist)}/${encodeURIComponent(songTitle)}`);
          if (lyrRes.ok) {
            const data = await lyrRes.json();
            if (data && data.lyrics) {
              return res.status(200).json({ lyrics: data.lyrics, source: 'LyricsOVH' });
            }
          }
        } catch (e) {}
      }

      return res.status(404).json({ error: 'Lyrics not found' });
    }

    // 4. Stream & Download proxying
    if (endpoint === 'stream' || endpoint === 'download') {
      if (targetUrl) {
        const streamRes = await fetch(decodeURIComponent(targetUrl), {
          headers: {
            'Range': req.headers.range || 'bytes=0-'
          }
        });
        res.status(streamRes.status);
        streamRes.headers.forEach((v, k) => res.setHeader(k, v));
        const buf = await streamRes.arrayBuffer();
        return res.send(Buffer.from(buf));
      }
      return res.status(400).json({ error: 'Missing stream target' });
    }

    // 5. Image proxy
    if (endpoint === 'proxy-image' && targetUrl) {
      try {
        const imgRes = await fetch(decodeURIComponent(targetUrl));
        if (imgRes.ok) {
          const ct = imgRes.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', ct);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const buf = await imgRes.arrayBuffer();
          return res.send(Buffer.from(buf));
        }
      } catch (e) {}
      return res.status(404).end();
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Music API Error', message: err.message });
  }
}
