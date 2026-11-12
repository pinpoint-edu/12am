/**
 * 12AM Floating Sidebar Navigation
 * Fully compatible with file:/// and http(s):// protocols
 */

(function() {
    if (window.__12am_nav_loaded) return;
    window.__12am_nav_loaded = true;

    // Top section: primary daily tabs (AI, Proxy, Music, Movies, Games, Dashboard)
    const TOP_NAV_PAGES = [
        { id: "dashboard", name: "Dashboard", icon: "fa-solid fa-house-user", url: "dashboard.html" },
        { id: "ai", name: "AI Chat", icon: "fa-solid fa-robot", url: "ai.html" },
        { id: "proxy", name: "Web Proxy", icon: "fa-solid fa-globe", url: "proxy.html" },
        { id: "music", name: "12 Music", icon: "fa-solid fa-music", url: "music.html" },
        { id: "movies", name: "Movies", icon: "fa-solid fa-film", url: "movies.html" },
        { id: "games", name: "Games", icon: "fa-solid fa-gamepad", url: "games.html" }
    ];

    // Bottom section: utilities & communications
    const BOTTOM_NAV_PAGES = [
        { id: "messenger", name: "Messenger", icon: "fa-solid fa-comments", url: "messenger.html" },
        { id: "soundboard", name: "Soundboard", icon: "fa-solid fa-volume-high", url: "soundboard.html" },
        { id: "notes", name: "Notes", icon: "fa-solid fa-note-sticky", url: "notes.html" },
        { id: "dictionary", name: "Dictionary", icon: "fa-solid fa-book-bookmark", url: "dictionary.html" },
        { id: "settings", name: "Settings", icon: "fa-solid fa-gear", url: "settings.html" }
    ];

    const ALL_NAV_PAGES = [...TOP_NAV_PAGES, ...BOTTOM_NAV_PAGES];
    const lightThemeNames = ['Light', 'Lavender', 'Rose Gold', 'Mint', 'Pink', 'Birthday'];

    function getActivePageId() {
        const path = (window.location.pathname || '').toLowerCase();
        const href = (window.location.href || '').toLowerCase();

        // Extract base page filename without directory and extension
        const cleanName = path.split('/').filter(Boolean).pop() || '';
        const base = cleanName.replace(/\.html$/, '');

        // Direct matching against ALL_NAV_PAGES
        for (const p of ALL_NAV_PAGES) {
            if (base === p.id) return p.id;
        }

        // Substring and alternate matching (works on Vercel clean URLs e.g. /games, /movies)
        if (base === 'games' || base.includes('game') || href.includes('games')) return 'games';
        if (base === 'movies' || base.includes('movie') || href.includes('movies')) return 'movies';
        if (base === 'music' || base.includes('music') || href.includes('music') || href.includes('yolk')) return 'music';
        if (base === 'messenger' || base.includes('messenger') || href.includes('messenger')) return 'messenger';
        if (base === 'soundboard' || base.includes('sound') || href.includes('soundboard')) return 'soundboard';
        if (base === 'notes' || base.includes('note') || href.includes('notes')) return 'notes';
        if (base === 'dictionary' || base.includes('dict') || href.includes('dictionary')) return 'dictionary';
        if (base === 'ai' || base.includes('ai') || href.includes('/ai')) return 'ai';
        if (base === 'proxy' || base.includes('proxy') || base.includes('web') || href.includes('proxy')) return 'proxy';
        if (base === 'settings' || base.includes('setting') || href.includes('settings')) return 'settings';
        if (base === 'dashboard' || base.includes('dash') || href.includes('dashboard')) return 'dashboard';

        return '';
    }

    // Local Page Visit & Duration Tracker
    try {
        const active = getActivePageId();
        if (active) {
            const visits = JSON.parse(localStorage.getItem('12am_page_visits') || '{}');
            visits[active] = (visits[active] || 0) + 1;
            localStorage.setItem('12am_page_visits', JSON.stringify(visits));
        }

        if (!window.__12am_timer_started) {
            window.__12am_timer_started = true;
            setInterval(() => {
                try {
                    let totalSec = parseInt(localStorage.getItem('12am_total_time_seconds') || '0', 10);
                    if (isNaN(totalSec) || totalSec < 0) totalSec = 0;
                    totalSec += 2;
                    localStorage.setItem('12am_total_time_seconds', String(totalSec));
                } catch(e) {}
            }, 2000);
        }
    } catch(e) {}

    function getLogoSrc(theme) {
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';
        const t = theme || (typeof window.getCurrentTheme === 'function' ? window.getCurrentTheme() : null);
        const isLight = t && lightThemeNames.includes(t.name);
        return isLight ? `${prefix}images/logo-black.png` : `${prefix}images/logo-white.png`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.open12AMAuth = function() {
        const cluster = document.getElementById('sidebarAuthCluster');
        if (cluster) {
            cluster.classList.remove('open');
            cluster.classList.add('closed');
        }
        if (window.TwelveAMAuth && typeof window.TwelveAMAuth.showAuthModal === 'function') {
            window.TwelveAMAuth.showAuthModal();
        } else {
            const s = document.createElement('script');
            s.src = 'device-auth.js';
            s.onload = () => {
                if (window.TwelveAMAuth) window.TwelveAMAuth.showAuthModal();
            };
            document.head.appendChild(s);
        }
    };

    window.logOut12AM = function() {
        if (window.TwelveAMAuth && typeof window.TwelveAMAuth.logout === 'function') {
            window.TwelveAMAuth.logout();
        } else {
            try {
                localStorage.removeItem('12am_user');
                localStorage.setItem('12am_logged_out', 'true');
            } catch(e) {}
            window.location.reload();
        }
    };

    function ensureIconFonts() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
            l.crossOrigin = 'anonymous';
            document.head.appendChild(l);
        }
        if (!document.querySelector('link[href*="Material+Symbols+Sharp"]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
            document.head.appendChild(l);
        }
    }
    ensureIconFonts();

    function renderNavAvatar(user, size = 30, fontSize = '12px', radius = '10px') {
        if (typeof window.render12AMAvatar === 'function') {
            return window.render12AMAvatar(user, size, fontSize, radius);
        }
        if (!user) {
            return `<div style="width:${size}px; height:${size}px; border-radius:${radius}; background:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize};"><i class="fa-solid fa-user" style="font-size:12px;"></i></div>`;
        }
        const type = user.avatar_type || user.pfpType || (user.mibiConfig ? 'mibi' : (user.avatar_url || user.avatar || user.pfp || localStorage.getItem('12am_profile_picture') ? 'image' : 'letter'));
        const imgUrl = user.avatar_url || user.avatar || user.pfp || user.photoURL || localStorage.getItem('12am_profile_picture');

        if (type === 'mibi' && user.mibiConfig) {
            const m = user.mibiConfig;
            const bg = escapeHtml(m.bgColor || '#3B82F6');
            const scale = (m.size || 100) / 100;
            const rot = m.rotation || 0;
            const ox = m.offsetX || 0;
            const oy = m.offsetY || 0;
            const eyes = m.eyes ? `<img src="mibi-avatars/eyes/${escapeHtml(m.eyes)}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; z-index:20;">` : '';
            const mouths = m.mouths ? `<img src="mibi-avatars/mouths/${escapeHtml(m.mouths)}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; z-index:20;">` : '';
            const hats = m.hats ? `<img src="mibi-avatars/hats/${escapeHtml(m.hats)}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; z-index:30;">` : '';
            return `<div style="width:${size}px; height:${size}px; border-radius:${radius}; background:${bg}; position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.18); flex-shrink:0;">
                <div style="position:absolute; inset:0; transform:translate(${ox}%, ${oy}%) rotate(${rot}deg) scale(${scale}); transform-origin:center; pointer-events:none;">
                    <img src="mibi-avatars/head.png" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; z-index:10;">
                    ${eyes}
                    ${mouths}
                    ${hats}
                </div>
            </div>`;
        }

        if (type === 'image' && imgUrl) {
            const fallbackInitial = escapeHtml(((user.firstName || user.nickname || 'U')[0] || 'U').toUpperCase());
            return `<img src="${escapeHtml(imgUrl)}" alt="Avatar" style="width:${size}px; height:${size}px; border-radius:${radius}; object-fit:cover; display:block; border:1px solid rgba(255,255,255,0.15);" onerror="this.outerHTML='<div style=\\'width:${size}px; height:${size}px; border-radius:${radius}; background:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize};\\'>${fallbackInitial}</div>'">`;
        }

        const rawLetters = user.avatar_letter || user.pfp_letter_char || user.letterAvatarText || (user.firstName || user.nickname || 'U')[0] || 'U';
        const letters = escapeHtml(String(rawLetters).slice(0, 3).toUpperCase());
        const bg = escapeHtml(user.avatar_bg || user.pfpLetterBg || user.pfp_letter_bg || '#000000');
        const color = escapeHtml(user.avatar_color || '#ffffff');

        return `<div style="width:${size}px; height:${size}px; border-radius:${radius}; background:${bg}; color:${color}; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize}; text-transform:uppercase; letter-spacing:0.5px; user-select:none; flex-shrink:0;">${letters}</div>`;
    }

    function renderAuthControlsHtml() {
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';
        let currentUser = null;
        try {
            if (window.TwelveAMAuth && typeof window.TwelveAMAuth.getCurrentUser === 'function') {
                currentUser = window.TwelveAMAuth.getCurrentUser();
            } else {
                currentUser = JSON.parse(localStorage.getItem('12am_user') || 'null');
            }
        } catch(e) {
            currentUser = null;
        }

        const isSignedIn = !!(currentUser && (currentUser.nickname || currentUser.firstName));
        const handle = isSignedIn ? (currentUser.nickname || 'user') : '';
        const userTooltip = isSignedIn ? `@${handle}` : 'Account';
        const avatarHtml = renderNavAvatar(currentUser, 28, '11px', '9px');

        let clusterButtonsHtml = '';
        if (isSignedIn) {
            clusterButtonsHtml = `
                <a href="${prefix}settings.html" class="cluster-btn" aria-label="Settings">
                    <i class="fa-solid fa-gear"></i>
                    <span class="cluster-tooltip-top">Settings</span>
                </a>
                <button type="button" onclick="window.open12AMAuth()" class="cluster-btn" aria-label="Switch Account">
                    <i class="fa-solid fa-user-gear"></i>
                    <span class="cluster-tooltip-top">Switch Account</span>
                </button>
                <a href="${prefix}legal.html" class="cluster-btn" aria-label="Terms &amp; Policies">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span class="cluster-tooltip-top">Legal</span>
                </a>
                <button type="button" onclick="window.logOut12AM()" class="cluster-btn cluster-btn-logout" aria-label="Log Out">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span class="cluster-tooltip-top">Log Out</span>
                </button>
            `;
        } else {
            clusterButtonsHtml = `
                <button type="button" onclick="window.open12AMAuth()" class="cluster-btn cluster-btn-primary" aria-label="Authenticate">
                    <i class="fa-solid fa-lock"></i>
                    <span class="cluster-tooltip-top">Authenticate</span>
                </button>
                <a href="${prefix}settings.html" class="cluster-btn" aria-label="Settings">
                    <i class="fa-solid fa-gear"></i>
                    <span class="cluster-tooltip-top">Settings</span>
                </a>
                <a href="${prefix}legal.html" class="cluster-btn" aria-label="Terms &amp; Policies">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span class="cluster-tooltip-top">Legal</span>
                </a>
            `;
        }

        return `
            <div class="sidebar-auth-wrapper" id="sidebarAuthWrapper">
                <button type="button" class="sidebar-btn sidebar-auth-toggle" id="sidebarAuthToggle" aria-label="${escapeHtml(userTooltip)}">
                    ${avatarHtml}
                    <span class="sidebar-tooltip" id="sidebarAuthTooltip">${escapeHtml(userTooltip)}</span>
                </button>
                <div class="sidebar-auth-cluster closed" id="sidebarAuthCluster">
                    ${clusterButtonsHtml}
                </div>
            </div>
        `;
    }

    function setupAuthClusterListeners() {
        const toggleBtn = document.getElementById('sidebarAuthToggle');
        const cluster = document.getElementById('sidebarAuthCluster');
        if (!toggleBtn || !cluster) return;

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = cluster.classList.contains('open');
            if (isOpen) {
                cluster.classList.remove('open');
                cluster.classList.add('closed');
                toggleBtn.classList.remove('active');
            } else {
                cluster.classList.remove('closed');
                cluster.classList.add('open');
                toggleBtn.classList.add('active');
            }
        };

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!cluster.contains(e.target) && !toggleBtn.contains(e.target)) {
                if (cluster.classList.contains('open')) {
                    cluster.classList.remove('open');
                    cluster.classList.add('closed');
                    toggleBtn.classList.remove('active');
                }
            }
        });
    }

    window.__updateNavbarUser = function() {
        const wrapper = document.getElementById('sidebarAuthWrapper');
        if (wrapper && wrapper.parentElement) {
            const temp = document.createElement('div');
            temp.innerHTML = renderAuthControlsHtml();
            const newChild = temp.firstElementChild;
            if (newChild) {
                wrapper.replaceWith(newChild);
                setupAuthClusterListeners();
            }
        }
    };

    function renderPageButton(p, activeId, prefix) {
        const isActive = p.id === activeId;
        return `
            <a href="${prefix}${p.url}" class="sidebar-btn nav-tab ${isActive ? 'active' : ''}" data-page="${p.id}" aria-label="${escapeHtml(p.name)}">
                <i class="${p.icon}"></i>
                <span class="sidebar-tooltip">${escapeHtml(p.name)}</span>
            </a>
        `;
    }

    function createFloatingSidebar() {
        let container = document.getElementById('floating-sidebar');
        if (!container) {
            const existingNav = document.getElementById('navbar-container');
            if (existingNav) {
                existingNav.id = 'floating-sidebar';
                existingNav.className = 'floating-sidebar';
                container = existingNav;
            } else {
                container = document.createElement('nav');
                container.id = 'floating-sidebar';
                container.className = 'floating-sidebar';
                document.body.prepend(container);
            }
        }

        const activeId = getActivePageId();
        const logoSrc = getLogoSrc();
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';

        // 1. Logo button (Top Left Logo clicking goes to index.html)
        const logoBtnHtml = `
            <a href="${prefix}index.html" class="sidebar-btn sidebar-logo-btn" aria-label="12AM Home">
                <img src="${logoSrc}" alt="12AM Logo" class="sidebar-logo-img navbar-logo" id="sidebar-logo">
                <span class="sidebar-tooltip">12AM Home</span>
            </a>
        `;

        // 2. Top section: AI, Proxy, Music, Movies, Games, Dashboard
        const topButtonsHtml = TOP_NAV_PAGES.map(p => renderPageButton(p, activeId, prefix)).join('');

        // 3. Bottom section: Messenger, Soundboard, Notes, Dictionary, Settings
        const bottomButtonsHtml = BOTTOM_NAV_PAGES.map(p => renderPageButton(p, activeId, prefix)).join('');

        // 4. Auth expandable cluster button
        const authControlsHtml = renderAuthControlsHtml();

        container.innerHTML = `
            <div class="sidebar-section sidebar-section-top">
                ${logoBtnHtml}
                ${topButtonsHtml}
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section sidebar-section-bottom">
                ${bottomButtonsHtml}
                ${authControlsHtml}
            </div>
        `;

        setupPanicKey();
        setupAuthClusterListeners();
    }

    function setupPanicKey() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            const panicKey = localStorage.getItem('12am_panic_key') || ']';
            if (e.key === panicKey) {
                const destination = localStorage.getItem('12am_panic_url') || 'https://classroom.google.com';
                window.location.replace(destination);
            }
        });
    }

    // Expose theme logo update callback (v6 drop-shadow tinting)
    window.__updateNavbarLogo = function(theme) {
        const logos = document.querySelectorAll('.navbar-logo, #navbar-logo, #sidebar-logo');
        const t = theme || (typeof window.getCurrentTheme === 'function' ? window.getCurrentTheme() : null);
        if (!t) return;
        const isLight = lightThemeNames.includes(t.name);
        const noFilterThemes = ['Dark', 'Light', 'Christmas'];
        const isNoFilter = noFilterThemes.includes(t.name);
        const tintColor = t['accent-primary'] || t['tab-active-text'] || '#ffffff';
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';

        logos.forEach(logo => {
            if (!logo) return;
            if (isNoFilter) {
                logo.src = `${prefix}${isLight ? 'images/logo-black.png' : 'images/logo-white.png'}`;
                logo.style.filter = '';
                logo.style.transform = '';
            } else {
                logo.src = `${prefix}images/logo-white.png`;
                logo.style.filter = `drop-shadow(100px 0 0 ${tintColor})`;
                logo.style.transform = 'translateX(-100px)';
            }
        });
    };

    // Listen for theme changes to tint logo
    window.addEventListener('12am:theme-changed', (e) => {
        if (e && e.detail) {
            window.__updateNavbarLogo(e.detail);
        }
    });

    const initNav = () => {
        createFloatingSidebar();
        try {
            window.__updateNavbarLogo();
        } catch(e) {}
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
})();
