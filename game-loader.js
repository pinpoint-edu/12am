/**
 * 12AM Game Loader & Storage Engine
 * Extracted and optimized from Trashbin (pinpoint-mini)
 */

// --- Multi-CDN Mirror Fallbacks ---
const CDN_MIRRORS = [
  'https://cdn.jsdelivr.net',
  'https://fastly.jsdelivr.net',
  'https://gcore.jsdelivr.net',
  'https://testingcf.jsdelivr.net'
];
let activeMirror = CDN_MIRRORS[0];

// --- IndexedDB Storage for Offline Games ---
const GAME_DB_NAMES = ['12AMGamesDB', 'TrashbinGamesDB'];
const GAME_STORE_NAME = 'games';
let dbInstance = null;

const PinpointGameStorage = {
  activeDownloads: new Map(),

  async getDB() {
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
      // Use 12AMGamesDB as primary
      const req = indexedDB.open(GAME_DB_NAMES[0], 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(GAME_STORE_NAME)) {
          const store = db.createObjectStore(GAME_STORE_NAME, { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
      };
      req.onsuccess = (e) => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getGame(id) {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(GAME_STORE_NAME, 'readonly');
        const store = tx.objectStore(GAME_STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async getAllGames() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(GAME_STORE_NAME, 'readonly');
        const store = tx.objectStore(GAME_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  },

  async saveGame(id, title, fileUrl, content, manifestData = null) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GAME_STORE_NAME, 'readwrite');
      const store = tx.objectStore(GAME_STORE_NAME);
      const record = {
        id,
        title,
        fileUrl,
        content,
        manifestData,
        downloadedAt: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteGame(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GAME_STORE_NAME, 'readwrite');
      const store = tx.objectStore(GAME_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  isDownloading(id) {
    return this.activeDownloads.has(id);
  },

  cancelDownload(id) {
    const ctrl = this.activeDownloads.get(id);
    if (ctrl) {
      ctrl.abort();
      this.activeDownloads.delete(id);
    }
  },

  async startDownload(id, title, fileUrl, onProgress) {
    if (this.isDownloading(id)) return;
    const ctrl = new AbortController();
    this.activeDownloads.set(id, ctrl);

    try {
      if (onProgress) onProgress(20);
      const { html } = await fetchGameHtml(fileUrl);
      if (onProgress) onProgress(75);
      await this.saveGame(id, title, fileUrl, html);
      if (onProgress) onProgress(100);
      return true;
    } catch (err) {
      console.error('Download error for game:', title, err);
      throw err;
    } finally {
      this.activeDownloads.delete(id);
    }
  }
};

var STRONGDOG_GN_UNITY_MAP = window.STRONGDOG_GN_UNITY_MAP = window.STRONGDOG_GN_UNITY_MAP || {
  'geometry dash lite': 27,
  'a dance of fire and ice': 59,
  'solar smash': 118,
  'snow rider 3d': 119,
  'ultrakill': 196,
  'jelly drift': 543,
  'yandere simulator': 554,
  'slime rancher': 591,
  'slime ranchers': 591,
  'cell machine': 730
};

function normalizeLoaderUrl(url) {
  if (!url) return '';
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch (e) {}
  const unityMatch = decoded.match(/pinpoint-edu\.github\.io\/strongdog[56]\/html\/([^/]+)\//i);
  if (unityMatch) {
    const gnId = STRONGDOG_GN_UNITY_MAP[unityMatch[1].trim().toLowerCase()];
    if (gnId) {
      return `https://raw.githubusercontent.com/freebuisness/html/main/${gnId}-fix2.html`;
    }
  }
  if (/pinpoint-edu\.github\.io\/(?:strongdog[0-9]*|GAMES)\/html\/[^/]+\/index\.html$/i.test(url)) {
    return url.replace(/\/index\.html$/i, '/game/index.html');
  }
  if (/pinpoint-edu\.github\.io\/(?:strongdog[0-9]*|GAMES)\/swf\/[^/]+\/base\.html$/i.test(url)) {
    return url.replace(/\/base\.html$/i, '/game/base.html');
  }
  return url;
}

// Utility function to get consistent game ID from file path
function getGameId(fileUrl) {
  if (!fileUrl) return '';
  return fileUrl.split('?')[0].split('#')[0].replace(/^https?:\/\/[^/]+\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Known local files shipped inside /textbooks/ (avoids spurious 404 local fetches for remote-only games)
const LOCAL_TEXTBOOK_FILES = new Set([
  'textbooks/soundboard.html',
  'textbooks/awesome-tanks.html',
  'textbooks/happy-wheels.html',
  'textbooks/happy-wheels.swf',
  'textbooks/retro-bowl.html',
  'textbooks/superhot.html',
  'textbooks/tetris.html'
]);

// Fetch Game HTML with CDNs & fallbacks
async function fetchGameHtml(file) {
  file = normalizeLoaderUrl(file);
  const cleanFile = file.split(/[?#]/)[0];
  const hostOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
    ? window.location.origin
    : '';

  // Absolute URLs
  if (/^https?:\/\//i.test(cleanFile)) {
    const urlsToTry = [];
    const seen = new Set();
    const addCandidate = (u) => {
      if (u && !seen.has(u)) {
        seen.add(u);
        urlsToTry.push(u);
      }
    };

    if (file.includes('pinpoint-edu.github.io/')) {
      // Try raw.githubusercontent.com FIRST (CORS-enabled, avoids GitHub Pages 404/redirect CORS errors)
      const mPages = file.match(/^https?:\/\/pinpoint-edu\.github\.io\/([^/]+)\/(.*)$/i);
      if (mPages) {
        const [, repo, rest] = mPages;
        if (/^strongdog/i.test(repo)) {
          addCandidate(`https://raw.githubusercontent.com/pinpoint-edu/${repo}/master/${rest}`);
          addCandidate(`https://raw.githubusercontent.com/pinpoint-edu/${repo}/main/${rest}`);
        } else {
          addCandidate(`https://raw.githubusercontent.com/pinpoint-edu/${repo}/main/${rest}`);
          addCandidate(`https://raw.githubusercontent.com/pinpoint-edu/${repo}/master/${rest}`);
        }
      }
      addCandidate(file);
    } else if (file.includes('jsdelivr.net')) {
      if (file.includes('jsdelivr.net/gh/')) {
        const mBranch = file.match(/https?:\/\/[^/]*\.jsdelivr\.net\/gh\/([^/@]+)\/([^/@]+)(?:@([^/]+))?\/(.*)$/i);
        if (mBranch) {
          const [, owner, repo, branch, rest] = mBranch;
          const isLargePinpoint = /^pinpoint-edu$/i.test(owner) && /^(assets|pinpoint-mini)$/i.test(repo);
          if (!isLargePinpoint) {
            addCandidate(file.replace(/https?:\/\/[^/]*\.jsdelivr\.net\//i, activeMirror + '/'));
            addCandidate(file);
          }
          if (branch) addCandidate(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest}`);
          addCandidate(`https://raw.githubusercontent.com/${owner}/${repo}/main/${rest}`);
          addCandidate(`https://raw.githubusercontent.com/${owner}/${repo}/master/${rest}`);
        } else {
          addCandidate(file.replace(/https?:\/\/[^/]*\.jsdelivr\.net\//i, activeMirror + '/'));
          addCandidate(file);
        }
      } else {
        addCandidate(file.replace(/https?:\/\/[^/]*\.jsdelivr\.net\//i, activeMirror + '/'));
        addCandidate(file);
      }
    } else {
      addCandidate(file);
    }

    for (const tryUrl of urlsToTry) {
      try {
        const res = await fetch(tryUrl);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('Package size exceeded') && !text.includes('limit of 20 MB') && !text.includes('404: Not Found')) {
            return { html: text, resolvedUrl: tryUrl };
          }
        }
      } catch (e) {}
    }

    // Try via our local proxy on school Chromebooks (keeping real upstream URL as resolvedUrl for <base href>)
    for (const tryUrl of urlsToTry) {
      try {
        const proxyRes = await fetch(`${hostOrigin}/api/proxy?url=${encodeURIComponent(tryUrl)}`);
        if (proxyRes.ok) {
          const text = await proxyRes.text();
          if (!text.includes('404: Not Found') && text.length > 50) {
            return { html: text, resolvedUrl: tryUrl };
          }
        }
      } catch (e) {}
    }

    throw new Error('Could not fetch game from ' + file);
  }

  const cleanPath = cleanFile.replace(/^\/+/, '');
  let fetchCandidates = [cleanPath];
  if (cleanPath.endsWith('/')) {
    fetchCandidates = [cleanPath + 'index.html'];
  } else if (!cleanPath.includes('.')) {
    fetchCandidates = [cleanPath + '.html', cleanPath + '/index.html', cleanPath];
  }

  for (const fetchFile of fetchCandidates) {
    // 1. Try local fetch only if not a remote-only textbooks/ path (avoids spurious 404s)
    const isTextbooksPath = /^textbooks\//i.test(fetchFile);
    const shouldTryLocal = !isTextbooksPath || LOCAL_TEXTBOOK_FILES.has(fetchFile.toLowerCase());
    if (shouldTryLocal) {
      try {
        const localRes = await fetch(fetchFile);
        if (localRes.ok) {
          const text = await localRes.text();
          if (!text.includes('Package size exceeded') && !text.includes('limit of 20 MB') && !text.includes('404: Not Found') && !text.trim().startsWith('{"status": 4')) {
            let localResolved = fetchFile;
            try {
              localResolved = new URL(fetchFile, window.location.href).href;
            } catch (e) {}
            return { html: text, resolvedUrl: localResolved };
          }
        }
      } catch (e) {}
    }

    // 2. Try raw.githubusercontent.com & cdn.statically.io FIRST for pinpoint-edu repos (avoids jsDelivr 20MB 403s), then CDN_MIRRORS
    const mirrors = [activeMirror, ...CDN_MIRRORS.filter(m => m !== activeMirror)];
    const isMiniRepo = fetchFile.startsWith('yolk/') || fetchFile.startsWith('movies/') || fetchFile === 'ai.html' || fetchFile === 'web.html' || fetchFile.startsWith('pages/') || fetchFile.includes('Soundboard.html') || fetchFile.includes('happy-wheels') || fetchFile.includes('superhot') || fetchFile.includes('tetrominoes') || fetchFile.includes('tetris') || fetchFile.includes('retro-bowl');
    const primaryRepo = isMiniRepo ? 'pinpoint-edu/pinpoint-mini@main/' : 'pinpoint-edu/assets@main/';
    const fallbackRepo = isMiniRepo ? 'pinpoint-edu/assets@main/' : 'pinpoint-edu/pinpoint-mini@main/';

    const urlsToTry = [
      'https://raw.githubusercontent.com/' + primaryRepo.replace(/@[^/]+\//, '/main/') + fetchFile,
      'https://cdn.statically.io/gh/' + primaryRepo + fetchFile,
      'https://raw.githubusercontent.com/' + fallbackRepo.replace(/@[^/]+\//, '/main/') + fetchFile,
      'https://cdn.statically.io/gh/' + fallbackRepo + fetchFile,
      ...mirrors.map(m => m + '/gh/' + primaryRepo + fetchFile),
      ...mirrors.map(m => m + '/gh/' + fallbackRepo + fetchFile)
    ];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const text = await res.text();
        if (text.includes('Package size exceeded') || text.includes('limit of 20 MB') || text.includes('404: Not Found') || text.trim().startsWith('{"status": 4')) {
          continue;
        }
        for (const m of CDN_MIRRORS) {
          if (url.startsWith(m)) {
            activeMirror = m;
            break;
          }
        }
        return { html: text, resolvedUrl: url };
      } catch (e) {
        continue;
      }
    }

    // 3. Fallback to our internal serverless proxy for school Chromebooks (preserve upstream resolvedUrl)
    const proxyFallbacks = [
      'https://raw.githubusercontent.com/' + primaryRepo.replace(/@[^/]+\//, '/main/') + fetchFile,
      'https://raw.githubusercontent.com/' + fallbackRepo.replace(/@[^/]+\//, '/main/') + fetchFile
    ];
    for (const upstreamUrl of proxyFallbacks) {
      try {
        const pRes = await fetch(`${hostOrigin}/api/proxy?url=${encodeURIComponent(upstreamUrl)}`);
        if (pRes.ok) {
          const text = await pRes.text();
          if (!text.includes('404: Not Found') && text.length > 50) {
            return { html: text, resolvedUrl: upstreamUrl };
          }
        }
      } catch (e) {}
    }
  }

  throw new Error('Could not fetch game from any CDN mirror.');
}

function normalizeGitBaseUrl(url) {
  if (!url) return url;
  // Keep GitHub Pages base for StrongdogXP repos
  const mStrongdog = url.match(/^https?:\/\/raw\.githubusercontent\.com\/pinpoint-edu\/(strongdog[^/]*)\/(?:main|master)\/(.*)$/i);
  if (mStrongdog) {
    return `https://pinpoint-edu.github.io/${mStrongdog[1]}/${mStrongdog[2]}`;
  }
  // pinpoint-edu/assets and pinpoint-mini exceed jsDelivr's 20MB limit (403); use cdn.statically.io for proper MIME types
  const mPinpointLarge = url.match(/^https?:\/\/raw\.githubusercontent\.com\/pinpoint-edu\/(assets|pinpoint-mini)\/([^/]+)\/(.*)$/i);
  if (mPinpointLarge) {
    return `https://cdn.statically.io/gh/pinpoint-edu/${mPinpointLarge[1]}@${mPinpointLarge[2]}/${mPinpointLarge[3]}`;
  }
  if (url.includes('raw.githubusercontent.com/')) {
    return url
      .replace(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/i, `${activeMirror}/gh/$1/$2@$3/$4`);
  }
  return url;
}

// Prepare HTML with base tags, script shims, canvas styling
function prepareGameHtml(html, fileUrl) {
  const cleanUrl = fileUrl.split(/[?#]/)[0];
  const hostOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
    ? window.location.origin
    : '';
  const ruffleScriptSrc = hostOrigin
    ? (hostOrigin + '/textbooks/ruffle/ruffle.js')
    : 'https://raw.githubusercontent.com/pinpoint-edu/12am/main/textbooks/ruffle/ruffle.js';
  let base = cleanUrl.replace(/[^/]*$/, '');
  if (!base.endsWith('/')) base += '/';
  base = normalizeGitBaseUrl(base);

  let repoBase = base;
  const mRepo = base.match(/^(https?:\/\/[^/]+\/(?:gh\/[^/]+\/[^/@]+@[^/]+\/|[^/]+\/[^/]+\/[^/]+\/))/i);
  if (mRepo) repoBase = mRepo[1];

  // Strip Google Gadget / Module XML wrappers if present (only for XML files, avoiding JS string mutilation)
  const trimmedHtml = html.trim();
  if (trimmedHtml.startsWith('<?xml') || trimmedHtml.startsWith('<Module') || trimmedHtml.startsWith('<module') || /^\s*<!--[\s\S]*?-->\s*<[Mm]odule/i.test(html)) {
    const cdataMatch = html.match(/(?:<!(?:--)?\[CDATA\[|<!--\[CDATA\[)([\s\S]*?)(?:\]\](?:-->)?|\]\]&gt;|\]\]>)/i);
    if (cdataMatch && cdataMatch[1] && cdataMatch[1].trim().length > 20) {
      html = cdataMatch[1].trim();
    } else {
      html = html.replace(/<\/?(?:module|moduleprefs|content)\b[^>]*>/gi, '');
    }
  }

  // Safely strip StrongDog top-frame redirect script and fake sitelock <head> separately (never spanning <!DOCTYPE html>)
  html = html.replace(/<script\b[^>]*>\s*if\s*\(\s*window\.top\s*===\s*window\.self\s*\)[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<head\b[^>]*>\s*<title>\s*Your Website Title\s*<\/title>[\s\S]*?<\/head>/gi, '');

  // Strip dead blob scripts, Poki/IMA SDKs, GameLoader helpers & wrappers
  html = html.replace(/<script[^>]*src=["']blob:https?:[^"']*["'][^>]*>\s*<\/script>/gi, '');
  html = html.replace(/<script[^>]*src=["'][^"']*(?:all\.js|settings\/js\/index\.js|\/vs\/gameloader-helper\.js|poki-sdk|imasdk\.googleapis\.com)[^"']*["'][^>]*>\s*<\/script>/gi, '');

  // Rewrite Ruffle scripts to self-hosted /textbooks/ruffle/ruffle.js (avoids broken 404 chunks on GitHub Pages)
  html = html.replace(/<script[^>]*src=["'](?:[^"']*\/)?ruffle\/ruffle\.js(?:[?#][^"']*)?["'][^>]*>\s*<\/script>/gi, `<script src="${ruffleScriptSrc}"><\/script>`);

  // Fix Awesome Tanks and similar bundled game missing asset errors
  html = html.replace(
    /return\s+blobUrlss\[trimmed\]\s*\|\|\s*original;/g,
    `if (trimmed === 'keyboard_moving.png') return blobUrlss['touch_moving.png'] || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
     if (trimmed === 'keyboard_shooting.png') return blobUrlss['touch_shooting.png'] || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
     return blobUrlss[trimmed] || (trimmed.endsWith('.png') ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' : original);`
  );

  // Base Origin Neutralization for Flash/Ruffle
  html = html.replace(/let\s+baseOrigin\s*=\s*[^;]+;/g, 'let baseOrigin = ' + JSON.stringify(repoBase.replace(/\/+$/, '')) + ';');
  html = html.replace(/var\s+baseOrigin\s*=\s*[^;]+;/g, 'var baseOrigin = ' + JSON.stringify(repoBase.replace(/\/+$/, '')) + ';');

  // Extract existing <base href="..."> (before stripping duplicates) and preserve normalized base URL
  const mBase = html.match(/<base\b[^>]*\bhref\s*=\s*(['"])(.*?)\1[^>]*>/i);
  if (mBase) {
    const existingHref = mBase[2];
    if (existingHref.startsWith('/') && !existingHref.startsWith('//')) {
      base = repoBase + existingHref.replace(/^\/+/, '');
    } else {
      try {
        base = new URL(existingHref, base).href;
      } catch (e) {
        if (/^https?:\/\//i.test(existingHref)) base = existingHref;
      }
    }
    base = normalizeGitBaseUrl(base);
    if (!base.endsWith('/') && !/\.[a-z0-9]+$/i.test(base)) base += '/';
  }
  html = html.replace(/<base\b[^>]*>/gi, '');

  // Rewrite root-relative HTML attributes (src="/...", href="/...") to repoBase so CDN paths (/gh/owner/repo@main/) aren't stripped
  html = html.replace(/(\b(?:src|href|data)\s*=\s*)(["'])\/(?!\/|api\/|textbooks\/ruffle\/)([^"']*)\2/gi, `$1$2${repoBase}$3$2`);

  // Resolve relative Flash <embed src> / <object data> URLs to absolute base URLs so Ruffle never logs "relative URL without a base"
  html = html.replace(/(<(?:embed|object)\b[^>]*\b(?:src|data)\s*=\s*)(["'])([^"']+)\2/gi, (m, pre, q, val) => {
    if (/^(?:https?:|data:|blob:|\/\/|#)/i.test(val)) return m;
    try {
      return pre + q + new URL(val, base).href + q;
    } catch (e) {
      return m;
    }
  });

  const baseTag = `<base href="${base}">`;
  const needsJquery = !/jquery(?:\.min|\.slim(?:\.min)?)?\.js/i.test(html) &&
    (/\bjQuery\b/.test(html) || /\$\s*\(/.test(html) || /\$\s*\.\s*(?:ajax|get|getJSON|post|ready|each|extend|isFunction)/i.test(html));
  const jqueryTag = needsJquery ? '<script src="https://code.jquery.com/jquery-3.7.1.min.js"><\/script>' : '';

  const headMatch = html.match(/<head\b[^>]*>/i);
  const firstScriptIdx = html.search(/<script\b/i);
  if (headMatch && (firstScriptIdx === -1 || headMatch.index < firstScriptIdx)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}${jqueryTag}`);
  } else {
    html = `${baseTag}${jqueryTag}` + html;
  }

  // Inject frame styling & window.top sandboxing & ServiceWorker / YaGames / PokiSDK / Ruffle / Flash Ad / wasm / LFS shims
  const frameStyle = '<style>html,body{height:100%;margin:0;padding:0;overflow:hidden;background:#000;}.webgl-content,#gameContainer,#canvas{width:100%;height:100%;}</style>';
  const innerScriptBody = [
    'var HOST_ORIGIN = ' + JSON.stringify(hostOrigin) + ';',
    'var _gameBaseHref = ' + JSON.stringify(base) + ';',
    'var _proxyBase = (HOST_ORIGIN || "") + "/api/proxy?url=";',
    'var _ruffleSrc = ' + JSON.stringify(ruffleScriptSrc) + ';',
    'var _rufflePublicPath = HOST_ORIGIN ? (HOST_ORIGIN + "/textbooks/ruffle/") : "https://raw.githubusercontent.com/pinpoint-edu/12am/main/textbooks/ruffle/";',
    'try {',
    '  window.RufflePlayer = window.RufflePlayer || {};',
    '  window.RufflePlayer.config = Object.assign({ publicPath: _rufflePublicPath, base: _gameBaseHref, autoplay: "on", unmuteOverlay: "visible" }, window.RufflePlayer.config || {});',
    '} catch(e){}',
    'try {',
    '  if (!document.xURL) {',
    '    Object.defineProperty(document, "xURL", {',
    '      get: function() { return (window.location && window.location.href && window.location.href !== "about:blank") ? window.location.href : _gameBaseHref; },',
    '      configurable: true',
    '    });',
    '  }',
    '} catch(e){}',
    'try { Object.defineProperty(window, "top", { get: function() { return window; } }); } catch(e){}',
    'try {',
    '  var _origPostMessage = window.postMessage;',
    '  window.postMessage = function(msg, targetOrigin, transfer) {',
    '    if (targetOrigin === "" || !targetOrigin) targetOrigin = "*";',
    '    return _origPostMessage.call(this, msg, targetOrigin, transfer);',
    '  };',
    '} catch(e){}',
    'try { window.open = function() { return null; }; } catch(e){}',
    'window.ytgame = window.ytgame || {',
    '  game: { firstFrameReady: function(){}, gameReady: function(){}, pause: function(){}, resume: function(){} },',
    '  engagement: { sendScore: function(){} }',
    '};',
    'try {',
    '  var _pokiNoop = function(){};',
    '  var _pokiVoid = function(){ return Promise.resolve(); };',
    '  var _pokiTrue = function(){ return Promise.resolve(true); };',
    '  window.PokiSDK = window.PokiSDK || {',
    '    init: _pokiVoid,',
    '    initWithVideoHB: _pokiVoid,',
    '    setDebug: _pokiNoop,',
    '    measure: _pokiNoop,',
    '    gameLoadingStart: _pokiNoop,',
    '    gameLoadingFinished: _pokiNoop,',
    '    gameLoadingProgress: _pokiNoop,',
    '    gameplayStart: _pokiNoop,',
    '    gameplayStop: _pokiNoop,',
    '    roundStart: _pokiNoop,',
    '    roundEnd: _pokiNoop,',
    '    happyTime: _pokiNoop,',
    '    commercialBreak: _pokiVoid,',
    '    rewardedBreak: _pokiTrue,',
    '    displayAd: function(el, size, cb){ if (typeof cb === "function") cb(true); },',
    '    destroyAd: _pokiNoop,',
    '    customEvent: _pokiNoop,',
    '    shareableURL: function(){ return Promise.resolve(""); },',
    '    getURLParam: function(){ return ""; },',
    '    setPlayerAge: _pokiNoop,',
    '    togglePlayerAdvertisingConsent: _pokiNoop,',
    '    isAdBlocked: function(){ return false; },',
    '    enableEventTracking: _pokiNoop,',
    '    playtestSetCanvas: _pokiNoop,',
    '    getIsoLanguage: function(){ return "en"; },',
    '    logError: _pokiNoop',
    '  };',
    '} catch(e){}',
    '(function() {',
    '  if (window.__12amScriptHooked) return;',
    '  window.__12amScriptHooked = true;',
    '  try {',
    '    var _blockedScriptRe = /poki-sdk|imasdk\\.googleapis\\.com|\\/vs\\/gameloader-helper\\.js/i;',
    '    var _rewriteScriptUrl = function(u) {',
    '      if (typeof u === "string" && _blockedScriptRe.test(u)) return "data:text/javascript,";',
    '      if (typeof u === "string" && /(?:^|\\/)ruffle\\/ruffle\\.js(?:$|[?#])/i.test(u)) return _ruffleSrc;',
    '      return u;',
    '    };',
    '    var _nativeCreateEl = (window.Document && Document.prototype.createElement) || document.createElement;',
    '    document.createElement = function(tag) {',
    '      var el = _nativeCreateEl.apply(this, arguments);',
    '      if (typeof tag === "string" && tag.toLowerCase() === "script") {',
    '        var _origSetAttr = el.setAttribute;',
    '        el.setAttribute = function(k, v) {',
    '          if (typeof k === "string" && k.toLowerCase() === "src") v = _rewriteScriptUrl(v);',
    '          return _origSetAttr.call(this, k, v);',
    '        };',
    '      }',
    '      return el;',
    '    };',
    '    var _sDesc = window.HTMLScriptElement && Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");',
    '    if (_sDesc && _sDesc.set) {',
    '      Object.defineProperty(HTMLScriptElement.prototype, "src", {',
    '        get: _sDesc.get,',
    '        set: function(v) { return _sDesc.set.call(this, _rewriteScriptUrl(v)); },',
    '        configurable: true',
    '      });',
    '    }',
    '  } catch(e){}',
    '})();',
    'try {',
    '  if (window.navigator && window.navigator.serviceWorker) {',
    '    window.navigator.serviceWorker.register = function() {',
    '      return Promise.resolve({ active: null, installing: null, waiting: null, scope: "", addEventListener: function(){}, removeEventListener: function(){} });',
    '    };',
    '  }',
    '} catch(e){}',
    'try {',
    '  window.YaGames = window.YaGames || {',
    '    init: function() {',
    '      return Promise.resolve({',
    '        adv: { showFullscreenAdv: function(o){ if (o && o.callbacks && o.callbacks.onClose) o.callbacks.onClose(true); }, showRewardedVideo: function(o){ if (o && o.callbacks && o.callbacks.onRewarded) o.callbacks.onRewarded(); if (o && o.callbacks && o.callbacks.onClose) o.callbacks.onClose(true); } },',
    '        auth: { getPlayer: function(){ return Promise.resolve({ getName: function(){ return "Player"; }, getPhoto: function(){ return ""; }, getUniqueID: function(){ return "12am-player"; } }); } },',
    '        features: { LoadingAPI: { ready: function(){} } }',
    '      });',
    '    }',
    '  };',
    '} catch(e){}',
    'try {',
    '  var _isUnityTelemetryUrl = function(abs) {',
    '    return /(?:stats\\.unity3d\\.com|cloud\\.unity3d\\.com|events\\.mz\\.unity3d\\.com|\\bunity3d\\.com\\/v1\\/events|cloud\\.umami\\.is|gamemonetize\\.com)/i.test(abs);',
    '  };',
    '  var _resolveGameUrl = function(u) {',
    '    if (typeof u === "string" && u.charAt(0) === "/" && u.charAt(1) !== "/" && u.indexOf("/api/") !== 0 && u.indexOf("/textbooks/ruffle/") !== 0) {',
    '      return rb + u.replace(/^\\/+/, "");',
    '    }',
    '    return new URL(u, document.baseURI || window.location.href).href;',
    '  };',
    '  var _isDeadFlashAdUrl = function(abs) {',
    '    return /(?:^|[.\\/])(?:mochiads\\.com|mochibot\\.com|cpmstar\\.com|armorbot\\.com|kongetrack\\.com)(?:[\\/:?#]|$)/i.test(abs);',
    '  };',
    '  var _emptySwfBytes = new Uint8Array([0x46,0x57,0x53,0x09,0x19,0x00,0x00,0x00,0x78,0x00,0x05,0x5f,0x00,0x00,0x0f,0xa0,0x00,0x00,0x0c,0x01,0x00,0x40,0x00,0x00,0x00]);',
    '  var _emptySwfDataUri = "data:application/x-shockwave-flash;base64,RldTCRkAAAB4AAVfAAAPoAAADAEAQAAAAA==";',
    '  var _needsDirectProxy = function(abs) {',
    '    if (HOST_ORIGIN && abs.indexOf(HOST_ORIGIN) === 0) return false;',
    '    // cdn.statically.io and raw.githubusercontent.com have CORS (*) and no 4.5MB Vercel proxy limit',
    '    if (abs.indexOf("cdn.statically.io/") !== -1 || abs.indexOf("raw.githubusercontent.com/") !== -1) return false;',
    '    return abs.indexOf("pinpoint-edu.github.io") !== -1 || abs.indexOf("glseries.net") !== -1 || abs.indexOf("cdn.jsdelivr.net/gh/pinpoint-edu") !== -1;',
    '  };',
    '  var _origFetch = window.fetch;',
    '  if (_origFetch) {',
    '    window.fetch = function(input, init) {',
    '      var url = typeof input === "string" ? input : (input && input.url ? input.url : "");',
    '      if (url && typeof url === "string") {',
    '        try {',
    '          var abs = _resolveGameUrl(url);',
    '          if (_isDeadFlashAdUrl(abs)) {',
    '            if (/\\.swf(?:$|[?#])/i.test(abs)) {',
    '              return Promise.resolve(new Response(_emptySwfBytes.slice(), { status: 200, headers: { "Content-Type": "application/x-shockwave-flash" } }));',
    '            }',
    '            return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));',
    '          }',
    '          if (_isUnityTelemetryUrl(abs)) {',
    '            return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));',
    '          }',
    '          if (/^https?:/i.test(abs) && abs.indexOf("/api/proxy?url=") === -1 && abs.indexOf("/api/web?") === -1) {',
    '            if (_needsDirectProxy(abs)) {',
    '              return _origFetch.call(this, _proxyBase + encodeURIComponent(abs), init);',
    '            }',
    '            return _origFetch.call(this, typeof input === "string" ? abs : input, init).then(function(res) {',
    '              if (res.status === 403 || res.status === 404) {',
    '                return _origFetch.call(window, _proxyBase + encodeURIComponent(abs), init);',
    '              }',
    '              var cl = parseInt((res.headers && res.headers.get("content-length")) || "0", 10);',
    '              if (cl > 0 && cl < 512) {',
    '                return res.clone().text().then(function(txt) {',
    '                  if (txt.indexOf("version https://git-lfs.github.com/spec/v1") === 0) {',
    '                    return _origFetch.call(window, _proxyBase + encodeURIComponent(abs), init);',
    '                  }',
    '                  return res;',
    '                });',
    '              }',
    '              return res;',
    '            }).catch(function() {',
    '              return _origFetch.call(window, _proxyBase + encodeURIComponent(abs), init);',
    '            });',
    '          }',
    '        } catch(e) {}',
    '      }',
    '      return _origFetch.apply(this, arguments);',
    '    };',
    '  }',
    '} catch(e){}',
    'try {',
    '  var _origXHROpen = XMLHttpRequest.prototype.open;',
    '  var _origXHRSend = XMLHttpRequest.prototype.send;',
    '  var _xhrRespUrlDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseURL");',
    '  if (_xhrRespUrlDesc && _xhrRespUrlDesc.get && _xhrRespUrlDesc.configurable) {',
    '    Object.defineProperty(XMLHttpRequest.prototype, "responseURL", {',
    '      configurable: true,',
    '      get: function() {',
    '        var nativeUrl = "";',
    '        try { nativeUrl = _xhrRespUrlDesc.get.call(this); } catch(e) {}',
    '        return nativeUrl || this._tbAbsUrl || "";',
    '      }',
    '    });',
    '  }',
    '  XMLHttpRequest.prototype.open = function(method, url) {',
    '    var rest = Array.prototype.slice.call(arguments, 2);',
    '    this._tbFakeJson = false;',
    '    try {',
    '      var abs = _resolveGameUrl(url);',
    '      this._tbAbsUrl = abs;',
    '      if (_isDeadFlashAdUrl(abs)) {',
    '        this._tbFakeJson = true;',
    '        var fakeFlashUri = /\\.swf(?:$|[?#])/i.test(abs) ? _emptySwfDataUri : "data:application/json,%7B%7D";',
    '        return _origXHROpen.apply(this, ["GET", fakeFlashUri].concat(rest));',
    '      }',
    '      if (_isUnityTelemetryUrl(abs)) {',
    '        this._tbFakeJson = true;',
    '        return _origXHROpen.apply(this, ["GET", "data:application/json,%7B%7D"].concat(rest));',
    '      }',
    '      if (/^https?:/i.test(abs) && abs.indexOf("/api/proxy?url=") === -1 && abs.indexOf("/api/web?") === -1 && _needsDirectProxy(abs)) {',
    '        return _origXHROpen.apply(this, [method, _proxyBase + encodeURIComponent(abs)].concat(rest));',
    '      }',
    '      if (typeof url === "string" && url !== abs && /^https?:/i.test(abs)) {',
    '        return _origXHROpen.apply(this, [method, abs].concat(rest));',
    '      }',
    '    } catch(e) {}',
    '    return _origXHROpen.apply(this, arguments);',
    '  };',
    '  XMLHttpRequest.prototype.send = function() {',
    '    if (this._tbFakeJson) {',
    '      return _origXHRSend.call(this, null);',
    '    }',
    '    return _origXHRSend.apply(this, arguments);',
    '  };',
    '} catch(e){}',
    'try {',
    '  var _shimEl = document.currentScript || document.getElementById("__STRONGDOG_SHIM__");',
    '  var _shimCode = _shimEl ? _shimEl.textContent : "";',
    '  if (_shimCode && !window.__12amDocWriteWrapped) {',
    '    window.__12amDocWriteWrapped = true;',
    '    var _shimTagHtml = "<script id=\\"__STRONGDOG_SHIM__\\">" + _shimCode.replace(/<\\/(script)/gi, "<\\\\/$1") + "<\\/" + "script>";',
    '    var _baseTagHtml = "<base href=\\"" + _gameBaseHref + "\\">";',
    '    var _injectShimOnWrite = function(str) {',
    '      if (typeof str !== "string") return str;',
    '      str = str.replace(/<script([^>]*)src=["\'](?:[^"\']*\\/)?ruffle\\/ruffle\\.js(?:[?#][^"\']*)?["\']([^>]*)>\\s*<\\/script>/gi, "<script src=\\"" + _ruffleSrc + "\\"><\\/" + "script>");',
    '      if (str.indexOf("__STRONGDOG_SHIM__") !== -1) return str;',
    '      if (!/<html|<head|<body/i.test(str)) return str;',
    '      var prefix = (/<base\\b/i.test(str) ? "" : _baseTagHtml) + _shimTagHtml;',
    '      if (/<head\\b[^>]*>/i.test(str)) return str.replace(/<head\\b[^>]*>/i, function(m) { return m + prefix; });',
    '      if (/<html\\b[^>]*>/i.test(str)) return str.replace(/<html\\b[^>]*>/i, function(m) { return m + prefix; });',
    '      return prefix + str;',
    '    };',
    '    var _origDocWrite = document.write;',
    '    var _origDocWriteln = document.writeln;',
    '    document.write = function() {',
    '      var args = Array.prototype.slice.call(arguments);',
    '      if (args.length === 1 && typeof args[0] === "string") args[0] = _injectShimOnWrite(args[0]);',
    '      else if (args.length > 1) args = [_injectShimOnWrite(args.join(""))];',
    '      return _origDocWrite.apply(this, args);',
    '    };',
    '    document.writeln = function() {',
    '      var args = Array.prototype.slice.call(arguments);',
    '      if (args.length === 1 && typeof args[0] === "string") args[0] = _injectShimOnWrite(args[0]);',
    '      else if (args.length > 1) args = [_injectShimOnWrite(args.join(""))];',
    '      return _origDocWriteln.apply(this, args);',
    '    };',
    '  }',
    '} catch(e){}',
    'try {',
    '  if (window.WebGL2RenderingContext && WebGL2RenderingContext.prototype && WebGL2RenderingContext.prototype.getInternalformatParameter) {',
    '    var _origGetInternalformat = WebGL2RenderingContext.prototype.getInternalformatParameter;',
    '    WebGL2RenderingContext.prototype.getInternalformatParameter = function(target, internalformat, pname) {',
    '      var fmt = Number(internalformat);',
    '      if (fmt === 0x1902 || fmt === 0x1906 || fmt === 0x1907 || fmt === 0x1908 || fmt === 0x1909 || fmt === 0x190A || fmt === 0x84F9 || (fmt >= 0x83F0 && fmt <= 0x93DC)) {',
    '        return new Int32Array(0);',
    '      }',
    '      return _origGetInternalformat.apply(this, arguments);',
    '    };',
    '  }',
    '} catch(e){}',
    '(function() {',
    '  var px = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";',
    '  try {',
    '    var origImg = window.Image;',
    '    if (origImg && origImg.prototype) {',
    '      var desc = Object.getOwnPropertyDescriptor(origImg.prototype, "src");',
    '      if (desc && desc.set) {',
    '        Object.defineProperty(origImg.prototype, "src", {',
    '          set: function(val) {',
    '            if (typeof val === "string" && (val.indexOf("keyboard_moving") !== -1 || val.indexOf("keyboard_shooting") !== -1)) {',
    '              val = px;',
    '            }',
    '            return desc.set.call(this, val);',
    '          },',
    '          get: desc.get,',
    '          configurable: true',
    '        });',
    '      }',
    '    }',
    '  } catch(e){}',
    '})();',
    '(function() {',
    '  if (window.__12amGameAudioDuckInstalled) return;',
    '  window.__12amGameAudioDuckInstalled = true;',
    '  var _ducked = false;',
    '  var _duckFactor = 1.0;',
    '  var _ctxs = [];',
    '  var _mediaEls = [];',
    '  var _volDesc = window.HTMLMediaElement ? Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume") : null;',
    '  function trackMedia(el) {',
    '    if (!el || el.id === "12am-bg-audio-player") return;',
    '    if (_mediaEls.indexOf(el) === -1) _mediaEls.push(el);',
    '  }',
    '  function applyMedia(el) {',
    '    if (!el || el.id === "12am-bg-audio-player" || !_volDesc || !_volDesc.set || !_volDesc.get) return;',
    '    trackMedia(el);',
    '    if (typeof el._tbNominalVol !== "number") {',
    '      try { el._tbNominalVol = _volDesc.get.call(el); } catch(e) { el._tbNominalVol = 1; }',
    '    }',
    '    try { _volDesc.set.call(el, Math.max(0, Math.min(1, el._tbNominalVol * _duckFactor))); } catch(e) {}',
    '  }',
    '  function applyCtx(ctx) {',
    '    if (!ctx || !ctx.__12amMasterGain) return;',
    '    try {',
    '      var g = ctx.__12amMasterGain.gain;',
    '      if (typeof g.setTargetAtTime === "function") {',
    '        try { g.cancelScheduledValues(ctx.currentTime || 0); } catch(e) {}',
    '        g.setTargetAtTime(_duckFactor, ctx.currentTime || 0, 0.04);',
    '      } else {',
    '        g.value = _duckFactor;',
    '      }',
    '    } catch(e) { try { ctx.__12amMasterGain.gain.value = _duckFactor; } catch(e2) {} }',
    '  }',
    '  function setDuck(ducked, factor) {',
    '    _ducked = Boolean(ducked);',
    '    _duckFactor = _ducked ? (typeof factor === "number" && factor >= 0 && factor <= 1 ? factor : 0.18) : 1.0;',
    '    for (var i = 0; i < _ctxs.length; i++) applyCtx(_ctxs[i]);',
    '    try {',
    '      var domMedia = document.querySelectorAll("audio,video");',
    '      for (var j = 0; j < domMedia.length; j++) trackMedia(domMedia[j]);',
    '    } catch(e) {}',
    '    for (var k = 0; k < _mediaEls.length; k++) applyMedia(_mediaEls[k]);',
    '  }',
    '  window.__set12amGameAudioDuck = setDuck;',
    '  try {',
    '    if (window.AudioNode && AudioNode.prototype && AudioNode.prototype.connect) {',
    '      var _origConnect = AudioNode.prototype.connect;',
    '      AudioNode.prototype.connect = function(target) {',
    '        try {',
    '          var ctx = (target && target.context) || this.context;',
    '          if (ctx && target === ctx.destination && this !== ctx.__12amMasterGain) {',
    '            if (!ctx.__12amMasterGain) {',
    '              var gain = typeof ctx.createGain === "function" ? ctx.createGain() : (typeof ctx.createGainNode === "function" ? ctx.createGainNode() : null);',
    '              if (gain) {',
    '                ctx.__12amMasterGain = gain;',
    '                gain.gain.value = _duckFactor;',
    '                if (_ctxs.indexOf(ctx) === -1) _ctxs.push(ctx);',
    '                _origConnect.call(gain, ctx.destination);',
    '              }',
    '            }',
    '            if (ctx.__12amMasterGain) {',
    '              var args = Array.prototype.slice.call(arguments);',
    '              args[0] = ctx.__12amMasterGain;',
    '              return _origConnect.apply(this, args);',
    '            }',
    '          }',
    '        } catch(e) {}',
    '        return _origConnect.apply(this, arguments);',
    '      };',
    '    }',
    '  } catch(e) {}',
    '  try {',
    '    if (_volDesc && _volDesc.configurable && _volDesc.get && _volDesc.set) {',
    '      Object.defineProperty(HTMLMediaElement.prototype, "volume", {',
    '        configurable: true,',
    '        get: function() { return typeof this._tbNominalVol === "number" ? this._tbNominalVol : _volDesc.get.call(this); },',
    '        set: function(v) {',
    '          if (this.id === "12am-bg-audio-player") return _volDesc.set.call(this, v);',
    '          var nv = Math.max(0, Math.min(1, Number(v) || 0));',
    '          this._tbNominalVol = nv;',
    '          trackMedia(this);',
    '          return _volDesc.set.call(this, Math.max(0, Math.min(1, nv * _duckFactor)));',
    '        }',
    '      });',
    '    }',
    '    if (window.HTMLMediaElement && HTMLMediaElement.prototype && HTMLMediaElement.prototype.play) {',
    '      var _origMediaPlay = HTMLMediaElement.prototype.play;',
    '      HTMLMediaElement.prototype.play = function() {',
    '        applyMedia(this);',
    '        return _origMediaPlay.apply(this, arguments);',
    '      };',
    '    }',
    '  } catch(e) {}',
    '  window.addEventListener("message", function(e) {',
    '    if (e && e.data && e.data.type === "12AM_GAME_AUDIO_DUCK") {',
    '      setDuck(e.data.ducked, e.data.factor);',
    '    }',
    '  });',
    '  try {',
    '    if (window.parent && window.parent !== window && window.parent.__12amMusicDuckingActive) {',
    '      setDuck(true, 0.18);',
    '    }',
    '  } catch(e) {}',
    '})();'
  ].join('\n');

  const shimScript = `<script id="__STRONGDOG_SHIM__">${innerScriptBody}<\/script>`;
  return frameStyle + shimScript + html;
}

// Write prepared HTML into player iframe
function writeGameIntoFrame(iframe, rawHtml, fileUrl) {
  const cleanUrl = fileUrl.split(/[?#]/)[0];
  const hotlinkQuery = fileUrl.substring(cleanUrl.length);
  const preparedHtml = prepareGameHtml(rawHtml, fileUrl);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(preparedHtml);
    doc.close();
  } catch (e) {
    iframe.srcdoc = preparedHtml;
  }

  try {
    const win = iframe.contentWindow;
    if (win) {
      win.__initialQuery = hotlinkQuery;
      win.__HOTLINK_URL__ = fileUrl;
      try { win.history.replaceState(null, '', cleanUrl + hotlinkQuery); } catch (e) {}
      if (hotlinkQuery.includes('#')) {
        try { win.location.hash = hotlinkQuery.substring(hotlinkQuery.indexOf('#')); } catch (e) {}
      }
      setTimeout(() => {
        try {
          win.postMessage({ type: '12AM_HOTLINK', query: hotlinkQuery, url: fileUrl }, '*');
          win.postMessage({ type: 'TRASHBIN_HOTLINK', query: hotlinkQuery, url: fileUrl }, '*');
          const isMusicPlaying = Boolean(window.__12amMusicDuckingActive);
          win.postMessage({ type: '12AM_GAME_AUDIO_DUCK', ducked: isMusicPlaying, factor: isMusicPlaying ? 0.18 : 1.0 }, '*');
        } catch (e) {}
      }, 100);
      win.focus();
    }
  } catch (e) {}
}

// Global active playing state
let currentPlayingFile = '';
let currentPlayingTitle = '';

// Play Game in the In-Page Player
async function playGame(encodedFile, encodedTitle) {
  const file = normalizeLoaderUrl(decodeURIComponent(encodedFile));
  const title = decodeURIComponent(encodedTitle);
  const id = getGameId(file);

  currentPlayingFile = file;
  currentPlayingTitle = title;

  const playerView = document.getElementById('player-view');
  const playerTitle = document.getElementById('currentPlayerTitle');
  const iframe = document.getElementById('gameIframe');

  if (playerTitle) playerTitle.textContent = title;
  if (playerView) {
    playerView.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  updatePlayerControlsUI(id);

  // 1. Direct local file:// navigation fallback
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    iframe.removeAttribute('srcdoc');
    iframe.src = file;
    return;
  }

  // 2. Direct external iframe navigation
  if (file.startsWith('http') && file.includes('scratch.mit.edu')) {
    iframe.removeAttribute('srcdoc');
    iframe.src = file;
    return;
  }

  // 3. Check IndexedDB Offline Cache
  try {
    const cached = await PinpointGameStorage.getGame(id);
    if (cached && cached.content && cached.content.length > 50) {
      writeGameIntoFrame(iframe, cached.content, file);
      return;
    }
  } catch (e) {}

  // 4. Show Loading Spinner
  iframe.removeAttribute('src');
  iframe.srcdoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #000; color: #fff; font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .spinner { width: 38px; height: 38px; border: 3px solid rgba(255,255,255,0.15); border-top: 3px solid #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <div style="font-size: 14px; color: #a1a1aa; letter-spacing: 0.5px;">Loading ${title}...</div>
    </body>
    </html>
  `;

  // 5. Fetch and inject
  try {
    const { html, resolvedUrl } = await fetchGameHtml(file);
    const fileQuery = (file.match(/[?#].*$/) || [''])[0];
    const fullResolved = resolvedUrl + (fileQuery && !resolvedUrl.includes('?') && !resolvedUrl.includes('#') ? fileQuery : '');
    writeGameIntoFrame(iframe, html, fullResolved);
  } catch (err) {
    if (file.startsWith('http')) {
      iframe.removeAttribute('srcdoc');
      iframe.src = file;
      return;
    }
    console.error('Play game error:', err);
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #000; color: #ef4444; font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <h3 style="margin-bottom: 8px;">Failed to Load Game</h3>
        <p style="color: #888; font-size: 14px; max-width: 400px;">${err.message}</p>
        <button onclick="location.reload()" style="margin-top: 14px; padding: 8px 16px; background: #27272a; border: 1px solid #3f3f46; color: #fff; border-radius: 8px; cursor: pointer;">Retry</button>
      </body>
      </html>
    `;
  }
}

function closePlayer() {
  const playerView = document.getElementById('player-view');
  const iframe = document.getElementById('gameIframe');
  if (playerView) playerView.style.display = 'none';
  if (iframe) {
    iframe.srcdoc = '';
    iframe.removeAttribute('src');
  }
  document.body.style.overflow = '';
  currentPlayingFile = '';
  currentPlayingTitle = '';
}

function reloadCurrentGame() {
  if (currentPlayingFile && currentPlayingTitle) {
    playGame(encodeURIComponent(currentPlayingFile), encodeURIComponent(currentPlayingTitle));
  }
}

function togglePlayerFullscreen() {
  const playerView = document.getElementById('player-view');
  if (!playerView) return;
  if (!document.fullscreenElement) {
    playerView.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

let isStretchedRes = false;
function toggleStretchedResolution() {
  const iframe = document.getElementById('gameIframe');
  const btn = document.getElementById('stretchBtn');
  if (!iframe) return;
  isStretchedRes = !isStretchedRes;
  if (isStretchedRes) {
    iframe.style.transform = 'scaleX(1.33)';
    if (btn) btn.style.color = 'var(--accent-color)';
  } else {
    iframe.style.transform = 'none';
    if (btn) btn.style.color = '';
  }
}

async function updatePlayerControlsUI(id) {
  const dlBtn = document.getElementById('playerDownloadBtn');
  if (!dlBtn) return;
  try {
    const cached = await PinpointGameStorage.getGame(id);
    if (cached) {
      dlBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Offline Ready</span>';
      dlBtn.title = 'Saved in browser offline storage';
    } else {
      dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Download</span>';
      dlBtn.title = 'Download for offline play';
    }
  } catch (e) {}
}

async function toggleOfflineDownloadCurrent() {
  if (!currentPlayingFile) return;
  const id = getGameId(currentPlayingFile);
  const dlBtn = document.getElementById('playerDownloadBtn');
  const isDownloaded = await PinpointGameStorage.getGame(id);

  if (isDownloaded) {
    await PinpointGameStorage.deleteGame(id);
    if (dlBtn) dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Download</span>';
  } else {
    if (dlBtn) dlBtn.innerHTML = '<i class="fa-solid fa-sync fa-spin"></i> <span>Downloading...</span>';
    try {
      await PinpointGameStorage.startDownload(id, currentPlayingTitle, currentPlayingFile);
      if (dlBtn) dlBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Offline Ready</span>';
    } catch (err) {
      alert('Failed to download: ' + err.message);
      if (dlBtn) dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Download</span>';
    }
  }
}

// Expose globals
window.playGame = playGame;
window.closePlayer = closePlayer;
window.reloadCurrentGame = reloadCurrentGame;
window.togglePlayerFullscreen = togglePlayerFullscreen;
window.toggleStretchedResolution = toggleStretchedResolution;
window.toggleOfflineDownloadCurrent = toggleOfflineDownloadCurrent;
window.PinpointGameStorage = PinpointGameStorage;
window.getGameId = getGameId;
