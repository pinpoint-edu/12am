// Parallel Range-request accumulation into an in-memory Blob URL.
// Usage: const {url, blob} = await fetchToBlobUrl(src, {onProgress}); video.src = url;
// Note: direct fetch requires the host to allow CORS and Range requests.
async function fetchToBlobUrl(src, opts = {}) {
    const chunkSize = opts.chunkSize || 4 * 1024 * 1024;
    const concurrency = opts.concurrency || 4;
    const head = await fetch(src, { headers: { Range: 'bytes=0-0' } });
    const cr = head.headers.get('Content-Range');
    const type = head.headers.get('Content-Type') || 'application/octet-stream';
    if (!cr) { // no range support: single fetch
        const blob = await (await fetch(src)).blob();
        return { url: URL.createObjectURL(blob), blob };
    }
    const total = parseInt(cr.split('/')[1], 10);
    const count = Math.ceil(total / chunkSize);
    const parts = new Array(count);
    let next = 0, done = 0;
    async function worker() {
        while (next < count) {
            const i = next++;
            const start = i * chunkSize, end = Math.min(start + chunkSize, total) - 1;
            const r = await fetch(src, { headers: { Range: `bytes=${start}-${end}` } });
            if (r.status !== 206 && r.status !== 200) throw new Error('Range fetch failed: ' + r.status);
            parts[i] = await r.arrayBuffer();
            done++;
            if (opts.onProgress) opts.onProgress(done / count);
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, count) }, worker));
    const blob = new Blob(parts, { type });
    return { url: URL.createObjectURL(blob), blob };
}
