/**
 * 12AM Floating Squircle Sidebar Navigation & Injected Minimal Footer
 * Fully compatible with file:/// and http(s):// protocols
 */

(function() {
    if (window.__12am_nav_loaded) return;
    window.__12am_nav_loaded = true;

    // Apply Dock Position early
    function applyDockPosition() {
        try {
            const pos = localStorage.getItem('12am_dock_position') || 'left';
            if (pos === 'right') {
                if (document.body) document.body.classList.add('dock-right');
                if (document.documentElement) document.documentElement.classList.add('dock-right');
            } else {
                if (document.body) document.body.classList.remove('dock-right');
                if (document.documentElement) document.documentElement.classList.remove('dock-right');
            }
        } catch(e) {}
    }
    applyDockPosition();

    window.__updateDockPosition = function(newPos) {
        if (newPos) {
            try { localStorage.setItem('12am_dock_position', newPos); } catch(e) {}
        }
        applyDockPosition();
        const secondDock = document.getElementById('settings-floating-dock');
        const mainSidebar = document.getElementById('floating-sidebar');
        if (secondDock && mainSidebar) {
            const rect = mainSidebar.getBoundingClientRect();
            secondDock.style.top = rect.top + 'px';
        }
    };

    // Primary dock pages in requested order: Dashboard, Soundboard, Games, Music, Movies, Proxy, AI
    const MAIN_NAV_PAGES = [
        { id: "dashboard", name: "Dashboard", icon: "fa-solid fa-house-user", url: "dashboard.html" },
        { id: "soundboard", name: "Soundboard", icon: "fa-solid fa-volume-high", url: "soundboard.html" },
        { id: "games", name: "Games", icon: "fa-solid fa-gamepad", url: "games.html" },
        { id: "music", name: "Music", icon: "fa-solid fa-music", url: "music.html" },
        { id: "movies", name: "Media", icon: "fa-solid fa-film", url: "movies.html" },
        { id: "proxy", name: "Web", icon: "fa-solid fa-globe", url: "proxy.html" },
        { id: "ai", name: "AI", icon: "fa-solid fa-robot", url: "ai.html" }
    ];

    // More popup menu pages: Notes, Dictionary, Messenger, Sports
    const MORE_NAV_PAGES = [
        { id: "sports", name: "Sports", icon: "fa-solid fa-trophy", url: "sports.html" },
        { id: "notes", name: "Notes", icon: "fa-solid fa-note-sticky", url: "notes.html" },
        { id: "dictionary", name: "Dictionary", icon: "fa-solid fa-book-bookmark", url: "dictionary.html" },
        { id: "messenger", name: "Messenger", icon: "fa-solid fa-comments", url: "messenger.html" }
    ];

    const ALL_NAV_PAGES = [...MAIN_NAV_PAGES, ...MORE_NAV_PAGES];

    const lightThemeNames = ['Light'];

    function isSimplifiedPage() {
        const path = (window.location.pathname || '').toLowerCase();
        const cleanName = path.split('/').filter(Boolean).pop() || '';
        const base = cleanName.replace(/\.html$/, '');
        return base === 'index' || base === 'legal' || base === '' || path.endsWith('/index.html') || path.endsWith('/legal.html') || path === '/';
    }

    function getActivePageId() {
        const path = (window.location.pathname || '').toLowerCase();
        const href = (window.location.href || '').toLowerCase();
        const cleanName = path.split('/').filter(Boolean).pop() || '';
        const base = cleanName.replace(/\.html$/, '');

        if (base === 'index' || path.endsWith('/index.html') || path === '/' || base === '') return 'home';
        if (base === 'legal' || path.endsWith('/legal.html')) return 'legal';

        for (const p of ALL_NAV_PAGES) {
            if (base === p.id) return p.id;
        }

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
        if (active && active !== 'home' && active !== 'legal') {
            const visits = JSON.parse(localStorage.getItem('12am_page_visits') || '{}');
            visits[active] = (visits[active] || 0) + 1;
            localStorage.setItem('12am_page_visits', JSON.stringify(visits));

            let recents = JSON.parse(localStorage.getItem('12am_recent_pages_history') || '[]');
            recents = recents.filter(item => (typeof item === 'object' ? item.id : item) !== active);
            recents.unshift({ id: active, time: Date.now() });
            localStorage.setItem('12am_recent_pages_history', JSON.stringify(recents.slice(0, 10)));
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
        const menu = document.getElementById('auth-menu-container');
        if (menu) {
            menu.classList.remove('open');
            menu.classList.add('closed');
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

    function renderNavAvatar(user, size = 32, fontSize = '13px', radius = '12px') {
        if (typeof window.render12AMAvatar === 'function') {
            return window.render12AMAvatar(user, size, fontSize, radius);
        }
        if (!user) {
            return `<div style="width:${size}px; height:${size}px; border-radius:${radius}; background:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize};"><i class="fa-solid fa-user" style="font-size:14px;"></i></div>`;
        }
        const type = user.avatar_type || user.pfpType || (user.mibiConfig ? 'mibi' : (user.avatar_url || user.avatar || user.pfp || localStorage.getItem('12am_profile_picture') ? 'image' : 'letter'));
        const imgUrl = user.avatar_url || user.avatar || user.pfp || user.photoURL || localStorage.getItem('12am_profile_picture');

        if (type === 'mibi' && user.mibiConfig) {
            const m = user.mibiConfig;
            const bg = m.bgColor === 'theme' ? 'var(--accent-primary, var(--accent-color, #3B82F6))' : escapeHtml(m.bgColor || '#3B82F6');
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

        if ((type === 'image' || type === 'custom') && imgUrl) {
            const fallbackInitial = escapeHtml(((user.firstName || user.nickname || 'U')[0] || 'U').toUpperCase());
            return `<img src="${escapeHtml(imgUrl)}" alt="Avatar" style="width:${size}px; height:${size}px; border-radius:${radius}; object-fit:cover; display:block; border:1px solid rgba(255,255,255,0.15);" onerror="this.outerHTML='<div style=\\'width:${size}px; height:${size}px; border-radius:${radius}; background:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize};\\'>${fallbackInitial}</div>'">`;
        }

        const rawLetters = user.avatar_letter || user.pfp_letter_char || user.letterAvatarText || (user.firstName || user.nickname || 'U')[0] || 'U';
        const letters = escapeHtml(String(rawLetters).slice(0, 3));
        const rawBg = user.avatar_bg || user.pfpLetterBg || user.pfp_letter_bg || '#000000';
        const bg = rawBg === 'theme' ? 'var(--accent-primary, var(--accent-color, #000000))' : escapeHtml(rawBg);
        const color = escapeHtml(user.avatar_color || '#ffffff');

        return `<div style="width:${size}px; height:${size}px; border-radius:${radius}; background:${bg}; color:${color}; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize}; letter-spacing:0.5px; user-select:none; flex-shrink:0;">${letters}</div>`;
    }

    function renderAuthSectionHtml(prefix, activeId) {
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

        if (isSignedIn) {
            // LOGGED IN: Single squircle avatar button with dropdown menu + collapse button
            const displayName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : currentUser.nickname;
            const handle = currentUser.nickname || 'user';
            const avatarHtml = renderNavAvatar(currentUser, 38, '13px', '12px');
            const menuAvatarHtml = renderNavAvatar(currentUser, 42, '16px', '14px');

            const isCollapsed = localStorage.getItem('12am_sidebar_collapsed') === 'true';

            return `
                <div class="sidebar-auth-wrapper" id="sidebarAuthWrapper">
                    <button type="button" class="sidebar-btn sidebar-avatar-btn auth-toggle-btn" id="sidebarAuthToggle" aria-label="Account Menu">
                        ${avatarHtml}
                    </button>
                    <div id="auth-menu-container" class="auth-menu-container closed">
                        <div class="auth-menu-header" style="display: flex; align-items: center; gap: 12px; padding: 6px 4px 10px;">
                            <div style="flex-shrink: 0;">${menuAvatarHtml}</div>
                            <div style="min-width: 0; flex: 1;">
                                <p class="auth-menu-displayname" style="margin: 0; font-size: 0.95rem; font-weight: 500; color: var(--text-main, #ffffff); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(displayName)}</p>
                                <p class="auth-menu-handle" style="margin: 2px 0 0; font-size: 0.78rem; color: var(--accent-color, #ff8800);">@${escapeHtml(handle)}</p>
                            </div>
                        </div>
                        <div class="auth-menu-divider"></div>
                        <a href="${prefix}settings.html" class="auth-menu-link">
                            <i class="fa-solid fa-gear"></i>
                            <span>Settings</span>
                        </a>
                        <a href="${prefix}legal.html" class="auth-menu-link">
                            <i class="fa-solid fa-shield-halved"></i>
                            <span>Terms &amp; Policies</span>
                        </a>
                        <button type="button" id="authCollapseDocksBtn" class="auth-menu-button auth-menu-collapse">
                            <i class="fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}"></i>
                            <span>${isCollapsed ? 'Uncollapse Deck' : 'Collapse Docks'}</span>
                        </button>
                        <button type="button" onclick="window.logOut12AM()" class="auth-menu-button auth-menu-logout">
                            <i class="fa-solid fa-right-from-bracket"></i>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // LOGGED OUT: No settings button, clean single Authenticate squircle button matching dock style
            return `
                <button type="button" onclick="window.open12AMAuth()" class="sidebar-btn nav-tab" id="sidebarAuthBtn" aria-label="Authenticate">
                    <i class="fa-solid fa-arrow-right-to-bracket"></i>
                    <span class="sidebar-tooltip">Authenticate</span>
                </button>
            `;
        }
    }

    function setupAuthMenuListeners() {
        const toggleBtn = document.getElementById('sidebarAuthToggle');
        const menu = document.getElementById('auth-menu-container');
        const collapseBtn = document.getElementById('authCollapseDocksBtn');

        let authMenuHoverTimer = null;
        const closeMenuIfHoverAway = () => {
            clearTimeout(authMenuHoverTimer);
            authMenuHoverTimer = setTimeout(() => {
                const isHoveringMenu = menu && menu.matches(':hover');
                const isHoveringToggle = toggleBtn && toggleBtn.matches(':hover');
                if (!isHoveringMenu && !isHoveringToggle && menu && menu.classList.contains('open')) {
                    menu.classList.remove('open');
                    menu.classList.add('closed');
                    if (toggleBtn) toggleBtn.classList.remove('active');
                }
            }, 250);
        };

        if (menu) {
            menu.addEventListener('mouseleave', () => {
                closeMenuIfHoverAway();
            });
            menu.addEventListener('mouseenter', () => {
                clearTimeout(authMenuHoverTimer);
            });
        }

        if (toggleBtn && menu) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                const moreMenu = document.getElementById('more-menu-container');
                const moreToggle = document.getElementById('sidebarMoreToggle');
                if (moreMenu && moreMenu.classList.contains('open')) {
                    moreMenu.classList.remove('open');
                    moreMenu.classList.add('closed');
                    if (moreToggle) moreToggle.classList.remove('active');
                }
                const musicMenu = document.getElementById('music-mini-menu-container');
                const musicToggle = document.getElementById('sidebarMusicToggle');
                if (musicMenu && musicMenu.classList.contains('open')) {
                    musicMenu.classList.remove('open');
                    musicMenu.classList.add('closed');
                    if (musicToggle) musicToggle.classList.remove('active');
                }
                const isOpen = menu.classList.contains('open');
                if (isOpen) {
                    menu.classList.remove('open');
                    menu.classList.add('closed');
                    toggleBtn.classList.remove('active');
                } else {
                    menu.classList.remove('closed');
                    menu.classList.add('open');
                    toggleBtn.classList.add('active');
                }
            };

            toggleBtn.addEventListener('mouseleave', () => {
                closeMenuIfHoverAway();
            });
            toggleBtn.addEventListener('mouseenter', () => {
                clearTimeout(authMenuHoverTimer);
                const moreMenu = document.getElementById('more-menu-container');
                const moreToggle = document.getElementById('sidebarMoreToggle');
                if (moreMenu && moreMenu.classList.contains('open')) {
                    moreMenu.classList.remove('open');
                    moreMenu.classList.add('closed');
                    if (moreToggle) moreToggle.classList.remove('active');
                }
                const musicMenu = document.getElementById('music-mini-menu-container');
                const musicToggle = document.getElementById('sidebarMusicToggle');
                if (musicMenu && musicMenu.classList.contains('open')) {
                    musicMenu.classList.remove('open');
                    musicMenu.classList.add('closed');
                    if (musicToggle) musicToggle.classList.remove('active');
                }
                menu.classList.remove('closed');
                menu.classList.add('open');
                toggleBtn.classList.add('active');
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                    if (menu.classList.contains('open')) {
                        menu.classList.remove('open');
                        menu.classList.add('closed');
                        toggleBtn.classList.remove('active');
                    }
                }
            });
        }

        if (collapseBtn) {
            collapseBtn.onclick = (e) => {
                e.stopPropagation();
                if (menu) {
                    menu.classList.remove('open');
                    menu.classList.add('closed');
                }
                if (toggleBtn) toggleBtn.classList.remove('active');
                
                // Toggle collapsed state
                const isCurrentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
                if (isCurrentlyCollapsed) {
                    document.body.classList.remove('sidebar-collapsed', 'sidebar-peek-open');
                    localStorage.removeItem('12am_sidebar_collapsed');
                    collapseBtn.innerHTML = '<i class="fa-solid fa-angles-left"></i><span>Collapse Docks</span>';
                } else {
                    document.body.classList.add('sidebar-collapsed');
                    document.body.classList.remove('sidebar-peek-open');
                    localStorage.setItem('12am_sidebar_collapsed', 'true');
                    collapseBtn.innerHTML = '<i class="fa-solid fa-angles-right"></i><span>Uncollapse Deck</span>';
                }
            };
        }
    }

    function renderPageButton(p, activeId, prefix) {
        const isActive = p.id === activeId;
        return `
            <a href="${prefix}${p.url}" class="sidebar-btn nav-tab ${isActive ? 'active' : ''}" data-page="${p.id}" aria-label="${escapeHtml(p.name)}">
                <i class="${p.icon}"></i>
                <span class="sidebar-tooltip">${escapeHtml(p.name)}</span>
            </a>
        `;
    }

    function renderMoreSectionHtml(prefix, activeId) {
        const isMoreActive = activeId === 'notes' || activeId === 'dictionary' || activeId === 'messenger';
        return `
            <div class="sidebar-more-wrapper" id="sidebarMoreWrapper">
                <button type="button" class="sidebar-btn nav-tab ${isMoreActive ? 'active' : ''}" id="sidebarMoreToggle" aria-label="More Apps">
                    <i class="fa-solid fa-ellipsis"></i>
                </button>
                <div id="more-menu-container" class="more-menu-container closed">
                    <a href="${prefix}notes.html" class="more-menu-icon-btn ${activeId === 'notes' ? 'active' : ''}" aria-label="Notes">
                        <i class="fa-solid fa-note-sticky"></i>
                        <span class="more-menu-tooltip">Notes</span>
                    </a>
                    <a href="${prefix}dictionary.html" class="more-menu-icon-btn ${activeId === 'dictionary' ? 'active' : ''}" aria-label="Dictionary">
                        <i class="fa-solid fa-book-bookmark"></i>
                        <span class="more-menu-tooltip">Dictionary</span>
                    </a>
                    <a href="${prefix}messenger.html" class="more-menu-icon-btn ${activeId === 'messenger' ? 'active' : ''}" aria-label="Messenger">
                        <i class="fa-solid fa-comments"></i>
                        <span class="more-menu-tooltip">Messenger</span>
                    </a>
                </div>
            </div>
        `;
    }

    function setupMoreMenuListeners() {
        const moreToggle = document.getElementById('sidebarMoreToggle');
        const moreMenu = document.getElementById('more-menu-container');
        const authToggle = document.getElementById('sidebarAuthToggle');
        const authMenu = document.getElementById('auth-menu-container');

        let moreHoverTimer = null;
        const closeMoreIfHoverAway = () => {
            clearTimeout(moreHoverTimer);
            moreHoverTimer = setTimeout(() => {
                const isHoveringMenu = moreMenu && moreMenu.matches(':hover');
                const isHoveringToggle = moreToggle && moreToggle.matches(':hover');
                if (!isHoveringMenu && !isHoveringToggle && moreMenu && moreMenu.classList.contains('open')) {
                    moreMenu.classList.remove('open');
                    moreMenu.classList.add('closed');
                    if (moreToggle) moreToggle.classList.remove('active');
                }
            }, 250);
        };

        if (moreMenu) {
            moreMenu.addEventListener('mouseleave', closeMoreIfHoverAway);
            moreMenu.addEventListener('mouseenter', () => clearTimeout(moreHoverTimer));
        }

        if (moreToggle && moreMenu) {
            moreToggle.onclick = (e) => {
                e.stopPropagation();
                if (authMenu && authMenu.classList.contains('open')) {
                    authMenu.classList.remove('open');
                    authMenu.classList.add('closed');
                    if (authToggle) authToggle.classList.remove('active');
                }
                const musicMenu = document.getElementById('music-mini-menu-container');
                const musicToggle = document.getElementById('sidebarMusicToggle');
                if (musicMenu && musicMenu.classList.contains('open')) {
                    musicMenu.classList.remove('open');
                    musicMenu.classList.add('closed');
                    if (musicToggle) musicToggle.classList.remove('active');
                }
                const isOpen = moreMenu.classList.contains('open');
                if (isOpen) {
                    moreMenu.classList.remove('open');
                    moreMenu.classList.add('closed');
                    moreToggle.classList.remove('active');
                } else {
                    moreMenu.classList.remove('closed');
                    moreMenu.classList.add('open');
                    moreToggle.classList.add('active');
                }
            };

            moreToggle.addEventListener('mouseleave', closeMoreIfHoverAway);
            moreToggle.addEventListener('mouseenter', () => {
                clearTimeout(moreHoverTimer);
                if (authMenu && authMenu.classList.contains('open')) {
                    authMenu.classList.remove('open');
                    authMenu.classList.add('closed');
                    if (authToggle) authToggle.classList.remove('active');
                }
                const musicMenu = document.getElementById('music-mini-menu-container');
                const musicToggle = document.getElementById('sidebarMusicToggle');
                if (musicMenu && musicMenu.classList.contains('open')) {
                    musicMenu.classList.remove('open');
                    musicMenu.classList.add('closed');
                    if (musicToggle) musicToggle.classList.remove('active');
                }
                moreMenu.classList.remove('closed');
                moreMenu.classList.add('open');
                moreToggle.classList.add('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (moreMenu && moreToggle && !moreMenu.contains(e.target) && !moreToggle.contains(e.target)) {
                if (moreMenu.classList.contains('open')) {
                    moreMenu.classList.remove('open');
                    moreMenu.classList.add('closed');
                    moreToggle.classList.remove('active');
                }
            }
        });
    }

    // Secondary Floating Dock for Settings Page
    function setupSettingsSecondaryDock() {
        const cleanName = (window.location.pathname || '').split('/').filter(Boolean).pop() || '';
        const base = cleanName.replace(/\.html$/, '');

        let secondDock = document.getElementById('settings-floating-dock');

        if (base !== 'settings') {
            if (secondDock) secondDock.remove();
            return;
        }

        if (!secondDock) {
            secondDock = document.createElement('nav');
            secondDock.id = 'settings-floating-dock';
            secondDock.className = 'floating-sidebar settings-floating-dock';
            document.body.appendChild(secondDock);
        }

        const tabs = [
            { id: 'general', name: 'General', icon: 'fa-solid fa-sliders' },
            { id: 'privacy', name: 'Privacy & Security', icon: 'fa-solid fa-shield-halved' },
            { id: 'personalization', name: 'Personalization', icon: 'fa-solid fa-palette' },
            { id: 'data', name: 'Data Management', icon: 'fa-solid fa-database' }
        ];

        let activeTab = 'general';
        const currentActiveBtn = document.querySelector('#settings-sidebar .settings-tab.active');
        if (currentActiveBtn && currentActiveBtn.dataset && currentActiveBtn.dataset.tab) {
            activeTab = currentActiveBtn.dataset.tab;
        }

        const tabsHtml = tabs.map(t => `
            <button type="button" class="sidebar-btn nav-tab settings-dock-btn ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}" aria-label="${t.name}">
                <i class="${t.icon}"></i>
                <span class="sidebar-tooltip">${t.name}</span>
            </button>
        `).join('');

        secondDock.innerHTML = `
            <div class="sidebar-section sidebar-section-top">
                <div class="sidebar-btn sidebar-page-badge" aria-label="Settings" title="Settings">
                    <i class="fa-solid fa-gear" style="color: var(--accent-color); font-size: 20px;"></i>
                    <span class="sidebar-tooltip">Settings</span>
                </div>
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section sidebar-section-tabs">
                ${tabsHtml}
            </div>
        `;

        // Wire tabs
        secondDock.querySelectorAll('.settings-dock-btn').forEach(btn => {
            btn.onclick = () => {
                const tabId = btn.dataset.tab;
                secondDock.querySelectorAll('.settings-dock-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (typeof window.switchSettingsTab === 'function') {
                    window.switchSettingsTab(tabId);
                } else {
                    const pageTab = document.getElementById(`tab-${tabId}`);
                    if (pageTab) pageTab.click();
                }
            };
        });

        // Hide legacy in-page tab bar
        const legacySidebar = document.getElementById('settings-sidebar');
        if (legacySidebar) {
            legacySidebar.style.display = 'none';
        }

        // Align top of sub-dock with the top of main sidebar
        function alignSubDocks() {
            const mainSidebar = document.getElementById('floating-sidebar');
            const subDock = document.getElementById('settings-floating-dock');
            if (mainSidebar && subDock) {
                const rect = mainSidebar.getBoundingClientRect();
                subDock.style.top = rect.top + 'px';
            }
        }
        alignSubDocks();
        window.addEventListener('resize', alignSubDocks);
        setTimeout(alignSubDocks, 50);
        setTimeout(alignSubDocks, 250);
    }

    // Left Edge Sensor & Hover Peek Logic for Collapsed Docks
    function setupEdgeSensorAndPeek() {
        let edgeSensor = document.getElementById('sidebar-edge-sensor');
        if (!edgeSensor) {
            edgeSensor = document.createElement('div');
            edgeSensor.id = 'sidebar-edge-sensor';
            edgeSensor.className = 'sidebar-edge-sensor';
            document.body.appendChild(edgeSensor);
        }

        let collapseTimer = null;

        function scheduleSidebarClose() {
            clearTimeout(collapseTimer);
            collapseTimer = setTimeout(() => {
                document.body.classList.remove('sidebar-peek-open');
            }, 450); // 450ms smooth delay so cursor can move between docks easily
        }

        function cancelSidebarClose() {
            clearTimeout(collapseTimer);
            if (document.body.classList.contains('sidebar-collapsed')) {
                document.body.classList.add('sidebar-peek-open');
            }
        }

        edgeSensor.onmouseenter = cancelSidebarClose;
        edgeSensor.onmouseleave = scheduleSidebarClose;

        const mainDock = document.getElementById('floating-sidebar');
        if (mainDock) {
            mainDock.onmouseenter = cancelSidebarClose;
            mainDock.onmouseleave = scheduleSidebarClose;
        }

        const secondDock = document.getElementById('settings-floating-dock');
        if (secondDock) {
            secondDock.onmouseenter = cancelSidebarClose;
            secondDock.onmouseleave = scheduleSidebarClose;
        }
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

        // Check if user is logged in
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
        // Simplified dock (Home & Legal only) ONLY applies if user is logged out on landing/legal pages.
        // If user is logged in, ALWAYS show all app page redirects!
        const simplified = !isSignedIn && isSimplifiedPage();

        let topSectionHtml = '';

        if (simplified) {
            // Simplified Dock on index.html and legal.html when logged out: ONLY Home and Legal redirects
            const isHome = activeId === 'home';
            const isLegal = activeId === 'legal';

            topSectionHtml = `
                <a href="${prefix}index.html" class="sidebar-btn sidebar-logo-btn ${isHome ? 'active' : ''}" aria-label="12AM Home">
                    <div class="sidebar-logo-inner">
                        <img src="${logoSrc}" alt="12AM Logo" class="sidebar-logo-img navbar-logo" id="sidebar-logo">
                    </div>
                    <span class="sidebar-tooltip">Home</span>
                </a>
                <a href="${prefix}legal.html" class="sidebar-btn nav-tab ${isLegal ? 'active' : ''}" aria-label="Terms &amp; Policies">
                    <i class="fa-solid fa-scale-balanced"></i>
                    <span class="sidebar-tooltip">Terms &amp; Policies</span>
                </a>
            `;
        } else {
            // Full Dock: Home logo + sorted apps (Dashboard, Soundboard, Games, Music, Media, Web, AI) + More button
            const logoBtnHtml = `
                <a href="${prefix}index.html" class="sidebar-btn sidebar-logo-btn ${activeId === 'home' ? 'active' : ''}" aria-label="12AM Home">
                    <div class="sidebar-logo-inner">
                        <img src="${logoSrc}" alt="12AM Logo" class="sidebar-logo-img navbar-logo" id="sidebar-logo">
                    </div>
                    <span class="sidebar-tooltip">Home</span>
                </a>
            `;
            const appButtonsHtml = MAIN_NAV_PAGES.map(p => renderPageButton(p, activeId, prefix)).join('');
            const moreBtnHtml = renderMoreSectionHtml(prefix, activeId);
            topSectionHtml = `${logoBtnHtml}${appButtonsHtml}${moreBtnHtml}`;
        }

        // Cross-App Music Mini-Player, Persistent Background Audio & Background Cache Helpers
        const MUSIC_STATE_KEY = '12am_music_playback_state';
        const MUSIC_IDB_NAME = 'yolk_offline_storage';
        const MUSIC_IDB_STORE = 'tracks';
        const MUSIC_CACHE_STORAGE = '12am-music-cache-v1';

        function readSavedMusicState() {
            try {
                const raw = localStorage.getItem(MUSIC_STATE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        }

        function writeSavedMusicState(stateObj) {
            if (!stateObj) return;
            try {
                localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify(stateObj));
            } catch (e) {}
            window.dispatchEvent(new CustomEvent('12am:music-state-updated', { detail: stateObj }));
        }

        function resolveDockTrackUid(track) {
            if (!track) return '';
            if (track.uid) return String(track.uid);
            return String(track.youtube_id || track.videoId || track.id || '');
        }

        function resolveDockCoverUrl(track) {
            if (!track) return '';
            const raw = track.artwork_url || track.image || '';
            if (raw) {
                return String(raw).replace('100x100bb', '300x300bb').replace('50x50bb', '300x300bb');
            }
            const ytId = track.youtube_id || track.videoId || (track.id && String(track.id).startsWith('ytm-') ? String(track.id).slice(4) : '');
            if (ytId) return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
            return '';
        }

        function getSupportedBgAudioFormat() {
            try {
                const dummy = document.createElement('audio');
                const canMp4 = !!(dummy.canPlayType && dummy.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, ''));
                const canWebm = !!(dummy.canPlayType && dummy.canPlayType('audio/webm; codecs="opus"').replace(/no/, ''));
                if (!canMp4 && canWebm) return 'webm';
                if (canMp4) return 'mp4';
                return canWebm ? 'webm' : 'auto';
            } catch (_) {
                return 'auto';
            }
        }

        function openMusicOfflineDB() {
            return new Promise((resolve, reject) => {
                if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
                const req = indexedDB.open(MUSIC_IDB_NAME, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(MUSIC_IDB_STORE)) {
                        db.createObjectStore(MUSIC_IDB_STORE, { keyPath: 'uid' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }

        async function getCachedTrackFromIDB(uid) {
            if (!uid) return null;
            try {
                const db = await openMusicOfflineDB();
                return await new Promise((resolve) => {
                    const tx = db.transaction(MUSIC_IDB_STORE, 'readonly');
                    const store = tx.objectStore(MUSIC_IDB_STORE);
                    const req = store.get(uid);
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => resolve(null);
                });
            } catch (_) {
                return null;
            }
        }

        async function saveTrackBlobToIDB(track, ytId, audioBlob, artworkBlob) {
            if (!track || !audioBlob) return false;
            try {
                const db = await openMusicOfflineDB();
                const uid = resolveDockTrackUid(track) || ytId;
                if (!uid) return false;
                const record = {
                    uid,
                    id: track.id || (ytId ? `ytm-${ytId}` : uid),
                    youtube_id: ytId || track.youtube_id || track.videoId || '',
                    videoId: ytId || track.videoId || track.youtube_id || '',
                    title: track.title || 'Unknown Title',
                    artist_name: track.artist_name || 'Unknown Artist',
                    album_name: track.album_name || '',
                    artwork_url: track.artwork_url || '',
                    duration: track.duration || 0,
                    audioBlob,
                    artworkBlob: artworkBlob || null,
                    lyrics: null,
                    downloadedAt: Date.now(),
                    size: audioBlob.size || 0
                };
                return await new Promise((resolve) => {
                    const tx = db.transaction(MUSIC_IDB_STORE, 'readwrite');
                    tx.objectStore(MUSIC_IDB_STORE).put(record);
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => resolve(false);
                });
            } catch (_) {
                return false;
            }
        }

        async function resolveYoutubeIdForTrack(track) {
            if (!track) return '';
            const direct = track.youtube_id || track.videoId || '';
            if (direct && /^[a-zA-Z0-9_-]{11}$/.test(String(direct))) return String(direct);
            if (track.id && String(track.id).startsWith('ytm-')) {
                const stripped = String(track.id).slice(4);
                if (/^[a-zA-Z0-9_-]{11}$/.test(stripped)) return stripped;
            }
            const q = `${track.title || ''} ${track.artist_name || ''}`.trim();
            if (!q) return '';
            try {
                const res = await fetch(`${prefix}api/music-api?endpoint=youtube-search&q=${encodeURIComponent(q)}`);
                if (!res.ok) return '';
                const data = await res.json();
                const found = data?.videoId || data?.results?.[0]?.videoId || '';
                if (found) {
                    track.youtube_id = found;
                    track.videoId = found;
                }
                return found;
            } catch (_) {
                return '';
            }
        }

        const GAME_DUCK_FACTOR = 0.18;
        window.__sync12amGameAudioDucking = function(isMusicPlaying) {
            const ducked = Boolean(isMusicPlaying);
            window.__12amMusicDuckingActive = ducked;
            const factor = ducked ? GAME_DUCK_FACTOR : 1.0;
            const payload = { type: '12AM_GAME_AUDIO_DUCK', ducked, factor };
            try {
                const frames = document.querySelectorAll('iframe');
                frames.forEach((frame) => {
                    try {
                        if (frame && frame.contentWindow) {
                            if (typeof frame.contentWindow.__set12amGameAudioDuck === 'function') {
                                frame.contentWindow.__set12amGameAudioDuck(ducked, factor);
                            }
                            frame.contentWindow.postMessage(payload, '*');
                        }
                    } catch (_) {}
                });
            } catch (_) {}
        };
        try {
            const initialMusicState = readSavedMusicState();
            window.__sync12amGameAudioDucking(Boolean(initialMusicState && initialMusicState.isPlaying));
        } catch (_) {}

        function launchMusicAppWithTransition(targetUrl, isFastRedirect) {
            window.__12amHandingOffToMusic = true;
            try {
                const existing = document.getElementById('twelveam-music-launch-overlay');
                if (existing) existing.remove();

                const state = readSavedMusicState();
                const coverUrl = resolveDockCoverUrl(state?.track);
                const activeTheme = typeof window.getCurrentTheme === 'function' ? window.getCurrentTheme() : null;
                const isLight = Boolean(activeTheme && (activeTheme.name === 'Light' || activeTheme.name === 'Paper' || (typeof window.getLuminance === 'function' && window.getLuminance(activeTheme['bg-primary']) > 0.65)));
                const logoTint = isLight ? '#000000' : (activeTheme && activeTheme.name === 'AMOLED' ? '#ffffff' : ((activeTheme && activeTheme['accent-primary']) || '#f59e0b'));
                const logoUrl = `${prefix}images/logo-white.png`;
                const overlay = document.createElement('div');
                overlay.id = 'twelveam-music-launch-overlay';
                overlay.innerHTML = `
                    <div class="twelveam-music-launch-disc">
                        ${coverUrl
                            ? `<img src="${escapeHtml(coverUrl)}" alt="" onerror="this.style.display='none';">`
                            : `<i class="fa-solid fa-music" style="font-size:48px; color: var(--accent-color, #ffffff);"></i>`}
                    </div>
                    <div class="twelveam-music-launch-eq" aria-hidden="true">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
                        <div style="width:40px; height:40px; background-color:${logoTint}; -webkit-mask-image:url('${logoUrl}'); mask-image:url('${logoUrl}'); -webkit-mask-size:contain; mask-size:contain; -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat; -webkit-mask-position:center; mask-position:center;"></div>
                        <span style="font-family:'Geist',sans-serif; font-size:2rem; font-weight:500; letter-spacing:-0.025em; color:var(--text-main, #ffffff);">music</span>
                    </div>
                `;
                document.body.appendChild(overlay);
                overlay.offsetHeight; // force reflow for transition
                overlay.classList.add('is-visible');

                try {
                    sessionStorage.setItem('12am_music_entry_transition', String(Date.now()));
                    if (state && state.isPlaying) {
                        sessionStorage.setItem('12am_music_autoplay_handoff', '1');
                    } else {
                        sessionStorage.removeItem('12am_music_autoplay_handoff');
                    }
                    if (isFastRedirect) {
                        sessionStorage.setItem('12am_music_fast_redirect', '1');
                    } else {
                        sessionStorage.removeItem('12am_music_fast_redirect');
                    }
                } catch (_) {}

                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 260);
            } catch (_) {
                window.location.href = targetUrl;
            }
        }

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                const existing = document.getElementById('twelveam-music-launch-overlay');
                if (existing) existing.remove();
            }
        });

        function renderMusicMiniPlayerHtml() {
            const state = readSavedMusicState();
            const track = state?.track || null;
            const hasTrack = Boolean(track && (track.title || track.id || track.youtube_id));
            const isPlaying = Boolean(state?.isPlaying);
            const cover = resolveDockCoverUrl(track);
            const title = track?.title || 'Nothing Playing';
            const artist = track?.artist_name || '12AM Music';

            return `
                <div class="sidebar-music-wrapper ${hasTrack ? '' : 'is-empty'} ${isPlaying ? 'is-playing' : ''}" id="sidebarMusicWrapper">
                    <button type="button" class="sidebar-btn sidebar-music-cover-btn" id="sidebarMusicToggle" aria-label="Open Now Playing">
                        <div class="sidebar-music-cover-frame">
                            <img id="sidebarMusicCoverImg" class="sidebar-music-cover-img" src="${escapeHtml(cover)}" alt="Album Cover" style="display:${cover ? 'block' : 'none'};" onerror="if(!this.dataset.proxied && this.src && !this.src.includes('proxy-image')){this.dataset.proxied='1';this.src='${prefix}api/music-api?endpoint=proxy-image&url='+encodeURIComponent(this.src);return;}this.style.display='none'; var fb=this.nextElementSibling; if(fb) fb.style.display='inline-flex';">
                            <i id="sidebarMusicFallbackIcon" class="fa-solid fa-music" style="font-size:15px; color:#ffffff; display:${cover ? 'none' : 'inline-flex'}; align-items:center; justify-content:center;"></i>
                            <span class="sidebar-music-cover-hover-overlay" aria-hidden="true">
                                <svg viewBox="0 0 38 38" width="38" height="38" style="display:block;width:100%;height:100%;">
                                    <defs>
                                        <mask id="dock-cover-redirect-cutout">
                                            <rect width="38" height="38" fill="#ffffff"/>
                                            <g transform="translate(7, 7) scale(1)">
                                                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="#000000"/>
                                            </g>
                                        </mask>
                                    </defs>
                                    <rect width="38" height="38" fill="rgba(0, 0, 0, 0.72)" mask="url(#dock-cover-redirect-cutout)"/>
                                </svg>
                            </span>
                        </div>
                        <span class="sidebar-music-playing-dot" aria-hidden="true"></span>
                    </button>
                    <div class="music-mini-menu-container closed" id="music-mini-menu-container" role="dialog" aria-label="Music Player Controls">
                        <div class="music-mini-controls-row">
                            <button type="button" class="music-mini-ctrl-btn music-mini-close-btn" id="dockMusicCloseBtn" title="Close Song" aria-label="Close Song">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                            <button type="button" class="music-mini-ctrl-btn" id="dockMusicPrevBtn" title="Previous Song" aria-label="Previous Song">
                                <i class="fa-solid fa-backward-step"></i>
                            </button>
                            <button type="button" class="music-mini-ctrl-btn music-mini-play-btn" id="dockMusicPlayPauseBtn" title="Play / Pause" aria-label="Play or Pause">
                                <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}" id="dockMusicPlayPauseIcon"></i>
                            </button>
                            <button type="button" class="music-mini-ctrl-btn" id="dockMusicNextBtn" title="Next Song" aria-label="Next Song">
                                <i class="fa-solid fa-forward-step"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function refreshDockMusicWidgetUI() {
            const wrapper = document.getElementById('sidebarMusicWrapper');
            if (!wrapper) return;
            const state = readSavedMusicState();
            const track = state?.track || null;
            const hasTrack = Boolean(track && (track.title || track.id || track.youtube_id));
            wrapper.classList.toggle('is-empty', !hasTrack);
            if (!hasTrack) {
                wrapper.classList.remove('is-playing');
                const menuEl = document.getElementById('music-mini-menu-container');
                const toggleBtn = document.getElementById('sidebarMusicToggle');
                if (menuEl) {
                    menuEl.classList.remove('open');
                    menuEl.classList.add('closed');
                }
                if (toggleBtn) toggleBtn.classList.remove('active');
                return;
            }

            const isMusicPage = activeId === 'music';
            const bgAudio = document.getElementById('12am-bg-audio-player');
            const livePlaying = isMusicPage
                ? Boolean(state?.isPlaying)
                : Boolean(bgAudio ? (!bgAudio.paused && !bgAudio.ended) : state?.isPlaying);

            wrapper.classList.toggle('is-playing', livePlaying);

            const cover = resolveDockCoverUrl(track);
            const coverImg = document.getElementById('sidebarMusicCoverImg');
            const fallbackIcon = document.getElementById('sidebarMusicFallbackIcon');
            if (coverImg) {
                if (cover) {
                    if (coverImg.getAttribute('src') !== cover) coverImg.src = cover;
                    coverImg.style.display = 'block';
                    if (fallbackIcon) fallbackIcon.style.display = 'none';
                } else {
                    coverImg.style.display = 'none';
                    if (fallbackIcon) fallbackIcon.style.display = 'inline-flex';
                }
            }

            const title = track.title || 'Unknown Title';
            const artist = track.artist_name || '12AM Music';
            const tooltip = document.getElementById('sidebarMusicTooltip');
            const playIcon = document.getElementById('dockMusicPlayPauseIcon');

            if (tooltip) tooltip.textContent = `${title} — ${artist}`;
            if (playIcon) {
                playIcon.className = `fa-solid ${livePlaying ? 'fa-pause' : 'fa-play'}`;
            }
        }
        window.__refreshDockMusicWidget = refreshDockMusicWidgetUI;

        function initDockAndBackgroundMusic() {
            const toggleBtn = document.getElementById('sidebarMusicToggle');
            const menuEl = document.getElementById('music-mini-menu-container');
            const closeBtn = document.getElementById('dockMusicCloseBtn');
            const prevBtn = document.getElementById('dockMusicPrevBtn');
            const playBtn = document.getElementById('dockMusicPlayPauseBtn');
            const nextBtn = document.getElementById('dockMusicNextBtn');

            const closeMusicMenu = () => {
                if (menuEl) {
                    menuEl.classList.remove('open');
                    menuEl.classList.add('closed');
                }
                if (toggleBtn) toggleBtn.classList.remove('active');
            };

            const closeMusicFromDock = () => {
                window.__12amMusicClosed = true;
                closeMusicMenu();
                if (activeId === 'music' && window.__twelveAmMusicController && typeof window.__twelveAmMusicController.close === 'function') {
                    window.__twelveAmMusicController.close();
                }
                if (typeof window.__closeBgMusicPlayer === 'function') {
                    window.__closeBgMusicPlayer();
                } else {
                    const bgEl = document.getElementById('12am-bg-audio-player');
                    if (bgEl) {
                        try {
                            bgEl.pause();
                            bgEl.removeAttribute('src');
                            bgEl.load();
                        } catch (_) {}
                    }
                }
                try { localStorage.removeItem(MUSIC_STATE_KEY); } catch (_) {}
                try { sessionStorage.removeItem('12am_music_fast_redirect'); } catch (_) {}
                try { sessionStorage.removeItem('12am_music_autoplay_handoff'); } catch (_) {}
                window.__12amBgCachedStatus = '';
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(false);
                }
                window.dispatchEvent(new CustomEvent('12am:music-state-updated', { detail: null }));
                refreshDockMusicWidgetUI();
            };
            window.__close12amDockMusic = closeMusicFromDock;

            let musicHoverTimer = null;
            const closeMusicIfHoverAway = () => {
                clearTimeout(musicHoverTimer);
                musicHoverTimer = setTimeout(() => {
                    const isHoveringMenu = menuEl && menuEl.matches(':hover');
                    const isHoveringToggle = toggleBtn && toggleBtn.matches(':hover');
                    if (!isHoveringMenu && !isHoveringToggle && menuEl && menuEl.classList.contains('open')) {
                        closeMusicMenu();
                    }
                }, 250);
            };

            if (menuEl) {
                menuEl.addEventListener('mouseleave', closeMusicIfHoverAway);
                menuEl.addEventListener('mouseenter', () => clearTimeout(musicHoverTimer));
            }

            if (toggleBtn && menuEl) {
                const openMusicMenu = () => {
                    clearTimeout(musicHoverTimer);
                    const authMenu = document.getElementById('auth-menu-container');
                    const authToggleEl = document.getElementById('sidebarAuthToggle');
                    const moreMenu = document.getElementById('more-menu-container');
                    const moreToggleEl = document.getElementById('sidebarMoreToggle');
                    if (authMenu) { authMenu.classList.remove('open'); authMenu.classList.add('closed'); }
                    if (authToggleEl) authToggleEl.classList.remove('active');
                    if (moreMenu) { moreMenu.classList.remove('open'); moreMenu.classList.add('closed'); }
                    if (moreToggleEl) moreToggleEl.classList.remove('active');
                    refreshDockMusicWidgetUI();
                    menuEl.classList.remove('closed');
                    menuEl.classList.add('open');
                    toggleBtn.classList.add('active');
                };

                const openMusicNowPlayingFromDock = (e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    closeMusicMenu();
                    if (activeId === 'music' && window.__twelveAmMusicController) {
                        window.__twelveAmMusicController.openNowPlaying();
                        return;
                    }
                    window.__12amHandingOffToMusic = true;
                    const bgEl = document.getElementById('12am-bg-audio-player');
                    const savedState = readSavedMusicState();
                    const wasBgPlaying = Boolean((bgEl && !bgEl.paused && !bgEl.ended) || (savedState && savedState.isPlaying));
                    try {
                        if (wasBgPlaying) sessionStorage.setItem('12am_music_autoplay_handoff', '1');
                        else sessionStorage.removeItem('12am_music_autoplay_handoff');
                    } catch (_) {}
                    if (window.__saveBgAudioState) window.__saveBgAudioState(wasBgPlaying);
                    if (bgEl && !bgEl.paused) { try { bgEl.pause(); } catch (_) {} }
                    launchMusicAppWithTransition(`${prefix}music.html#now-playing`, true);
                };
                window.__open12amNowPlayingFromDock = openMusicNowPlayingFromDock;
                toggleBtn.onclick = openMusicNowPlayingFromDock;
                toggleBtn.addEventListener('mouseenter', openMusicMenu);
                toggleBtn.addEventListener('mouseleave', closeMusicIfHoverAway);
            }

            const authToggle = document.getElementById('sidebarAuthToggle');
            const moreToggle = document.getElementById('sidebarMoreToggle');
            if (authToggle) authToggle.addEventListener('click', closeMusicMenu);
            if (moreToggle) moreToggle.addEventListener('click', closeMusicMenu);

            if (!window.__12amMusicDocListenersBound) {
                window.__12amMusicDocListenersBound = true;
                document.addEventListener('mousemove', (e) => {
                    const menu = document.getElementById('music-mini-menu-container');
                    const toggle = document.getElementById('sidebarMusicToggle');
                    if (!menu || !toggle || !menu.classList.contains('open')) return;
                    const menuRect = menu.getBoundingClientRect();
                    const toggleRect = toggle.getBoundingClientRect();
                    const distToRect = (r) => {
                        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
                        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
                        return Math.hypot(dx, dy);
                    };
                    if (Math.min(distToRect(menuRect), distToRect(toggleRect)) > 85) {
                        menu.classList.remove('open');
                        menu.classList.add('closed');
                        toggle.classList.remove('active');
                    }
                }, { passive: true });

                document.addEventListener('click', (e) => {
                    const wrap = document.getElementById('sidebarMusicWrapper');
                    const menu = document.getElementById('music-mini-menu-container');
                    const toggle = document.getElementById('sidebarMusicToggle');
                    if (menu && wrap && !wrap.contains(e.target)) {
                        menu.classList.remove('open');
                        menu.classList.add('closed');
                        if (toggle) toggle.classList.remove('active');
                    }
                });

                document.addEventListener('click', (e) => {
                    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    const link = e.target.closest('a[href]');
                    if (!link) return;
                    const href = link.getAttribute('href') || '';
                    const isMusicLink = link.dataset.page === 'music' || /(?:^|\/)music\.html(?:[?#]|$)/i.test(href);
                    if (!isMusicLink || link.target === '_blank') return;
                    if (activeId === 'music') return;
                    e.preventDefault();
                    window.__12amHandingOffToMusic = true;
                    const bgEl = document.getElementById('12am-bg-audio-player');
                    const savedState = readSavedMusicState();
                    const wasBgPlaying = Boolean((bgEl && !bgEl.paused && !bgEl.ended) || (savedState && savedState.isPlaying));
                    try {
                        if (wasBgPlaying) sessionStorage.setItem('12am_music_autoplay_handoff', '1');
                        else sessionStorage.removeItem('12am_music_autoplay_handoff');
                    } catch (_) {}
                    if (window.__saveBgAudioState) window.__saveBgAudioState(wasBgPlaying);
                    if (bgEl && !bgEl.paused) { try { bgEl.pause(); } catch (_) {} }
                    launchMusicAppWithTransition(link.href || `${prefix}music.html`, false);
                }, true);

                window.addEventListener('12am:music-state-updated', (e) => {
                    if (e && e.detail && e.detail.track) {
                        window.__12amMusicClosed = false;
                    }
                    refreshDockMusicWidgetUI();
                });
                window.addEventListener('storage', (e) => {
                    if (e.key === MUSIC_STATE_KEY) {
                        if (e.newValue) window.__12amMusicClosed = false;
                        refreshDockMusicWidgetUI();
                    }
                });
            }

            if (activeId === 'music') {
                try {
                    if (document.body) document.body.classList.add('music-entry-anim');
                } catch (_) {}
            }

            if (closeBtn) {
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    closeMusicFromDock();
                };
            }

            if (playBtn) {
                playBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (activeId === 'music' && window.__twelveAmMusicController) {
                        window.__twelveAmMusicController.togglePlayPause();
                        setTimeout(() => refreshDockMusicWidgetUI(), 60);
                    } else if (window.__toggleBgMusicPlayPause) {
                        window.__toggleBgMusicPlayPause();
                    }
                };
            }

            if (nextBtn) {
                nextBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (activeId === 'music' && window.__twelveAmMusicController) {
                        window.__twelveAmMusicController.next();
                        setTimeout(() => refreshDockMusicWidgetUI(), 100);
                    } else if (window.__skipBgMusicTrack) {
                        window.__skipBgMusicTrack(1);
                    }
                };
            }

            if (prevBtn) {
                prevBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (activeId === 'music' && window.__twelveAmMusicController) {
                        window.__twelveAmMusicController.prev();
                        setTimeout(() => refreshDockMusicWidgetUI(), 100);
                    } else if (window.__skipBgMusicTrack) {
                        window.__skipBgMusicTrack(-1);
                    }
                };
            }

            // Initialize background audio player & cache downloader on NON-music pages
            if (activeId !== 'music' && !window.__12amBgAudioInitialized) {
                window.__12amBgAudioInitialized = true;
                initGlobalBackgroundAudioPlayer();
            }

            refreshDockMusicWidgetUI();
        }

        async function initGlobalBackgroundAudioPlayer() {
            const state = readSavedMusicState();
            if (!state || !state.track) return;

            let bgAudio = document.getElementById('12am-bg-audio-player');
            if (!bgAudio) {
                bgAudio = document.createElement('audio');
                bgAudio.id = '12am-bg-audio-player';
                bgAudio.preload = 'auto';
                bgAudio.removeAttribute('crossorigin');
                bgAudio.style.display = 'none';
                document.body.appendChild(bgAudio);
            } else {
                bgAudio.removeAttribute('crossorigin');
            }

            const inflightCacheDownloads = new Set();
            let currentActiveObjectUrl = null;
            let activeLoadedUid = '';
            let desiredPlaying = Boolean(state.isPlaying);
            let pendingSeekTime = Math.max(0, Number(state.currentTime) || 0);
            let lastPersistAt = 0;

            try {
                const storedVol = parseFloat(localStorage.getItem('yolk_volume') ?? state.volume ?? '1');
                bgAudio.volume = Number.isFinite(storedVol) ? Math.max(0, Math.min(1, storedVol)) : 1;
            } catch (_) {
                bgAudio.volume = 1;
            }

            function persistBgAudioState(forcePlayFlag) {
                if (window.__12amMusicClosed) return;
                const latest = readSavedMusicState();
                const trackNow = latest && latest.track ? latest.track : null;
                if (!trackNow) return;
                const cur = Number.isFinite(bgAudio.currentTime) ? bgAudio.currentTime : (Number(latest.currentTime) || 0);
                const dur = Number.isFinite(bgAudio.duration) && bgAudio.duration > 0 ? bgAudio.duration : (Number(latest.duration) || 0);
                const playingFlag = typeof forcePlayFlag === 'boolean'
                    ? forcePlayFlag
                    : (!bgAudio.paused && !bgAudio.ended ? true : desiredPlaying);
                const nextState = {
                    ...latest,
                    track: trackNow,
                    currentTime: Math.max(0, cur),
                    duration: Math.max(0, dur),
                    isPlaying: Boolean(playingFlag),
                    updatedAt: Date.now(),
                    source: 'dock'
                };
                writeSavedMusicState(nextState);
                refreshDockMusicWidgetUI();
            }
            window.__saveBgAudioState = persistBgAudioState;

            window.__closeBgMusicPlayer = () => {
                window.__12amMusicClosed = true;
                desiredPlaying = false;
                activeLoadedUid = '';
                pendingSeekTime = 0;
                if (currentActiveObjectUrl) {
                    try { URL.revokeObjectURL(currentActiveObjectUrl); } catch (_) {}
                    currentActiveObjectUrl = null;
                }
                try {
                    bgAudio.pause();
                    bgAudio.removeAttribute('src');
                    bgAudio.load();
                } catch (_) {}
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(false);
                }
            };

            async function cacheSongInBackground(track, ytId, fmt) {
                const uid = resolveDockTrackUid(track) || ytId;
                if (!uid || !ytId || inflightCacheDownloads.has(uid)) return;
                inflightCacheDownloads.add(uid);
                try {
                    const existing = await getCachedTrackFromIDB(uid);
                    if (existing && existing.audioBlob) {
                        window.__12amBgCachedStatus = 'Cached';
                        refreshDockMusicWidgetUI();
                        return;
                    }
                    window.__12amBgCachedStatus = 'Caching…';
                    refreshDockMusicWidgetUI();

                    const dlUrl = `${prefix}api/music-api?endpoint=download&id=${encodeURIComponent(ytId)}&format=${encodeURIComponent(fmt)}&v=2`;
                    let audioRes = await fetch(dlUrl).catch(() => null);
                    if (!audioRes || !audioRes.ok) {
                        try {
                            const resolveRes = await fetch(`${prefix}api/music-api?endpoint=resolve_audio&id=${encodeURIComponent(ytId)}&format=${encodeURIComponent(fmt)}&v=2`);
                            if (resolveRes.ok) {
                                const info = await resolveRes.json();
                                const corsSafeUrl = info?.issuerUrl || info?.proxiedUrl || (Array.isArray(info?.companionUrls) ? info.companionUrls[0] : null);
                                if (corsSafeUrl) {
                                    audioRes = await fetch(corsSafeUrl).catch(() => null);
                                }
                            }
                        } catch (_) {}
                    }
                    if (!audioRes || !audioRes.ok) throw new Error(`HTTP ${audioRes ? audioRes.status : 'network'}`);
                    const audioBlob = await audioRes.blob();
                    if (!audioBlob || audioBlob.size < 1024) throw new Error('Empty audio blob');

                    let artworkBlob = null;
                    const artUrl = resolveDockCoverUrl(track);
                    if (artUrl) {
                        try {
                            const artRes = await fetch(`${prefix}api/music-api?endpoint=proxy-image&url=${encodeURIComponent(artUrl)}`);
                            if (artRes.ok) artworkBlob = await artRes.blob();
                        } catch (_) {}
                    }

                    const savedOk = await saveTrackBlobToIDB(track, ytId, audioBlob, artworkBlob);

                    if (window.caches) {
                        try {
                            const cache = await caches.open(MUSIC_CACHE_STORAGE);
                            await cache.put(
                                `${prefix}api/music-api?endpoint=stream&id=${encodeURIComponent(ytId)}&format=${encodeURIComponent(fmt)}`,
                                new Response(audioBlob, { headers: { 'Content-Type': audioBlob.type || 'audio/mp4' } })
                            );
                        } catch (_) {}
                    }

                    window.__12amBgCachedStatus = savedOk ? 'Cached' : '';
                    refreshDockMusicWidgetUI();
                } catch (_) {
                    if (window.__12amBgCachedStatus === 'Caching…') {
                        window.__12amBgCachedStatus = '';
                        refreshDockMusicWidgetUI();
                    }
                } finally {
                    inflightCacheDownloads.delete(uid);
                }
            }

            async function loadTrackIntoBgPlayer(track, startTimeSec, shouldPlay) {
                if (!track) return;
                const uid = resolveDockTrackUid(track);
                activeLoadedUid = uid;
                pendingSeekTime = Math.max(0, Number(startTimeSec) || 0);
                desiredPlaying = Boolean(shouldPlay);

                if (currentActiveObjectUrl) {
                    try { URL.revokeObjectURL(currentActiveObjectUrl); } catch (_) {}
                    currentActiveObjectUrl = null;
                }

                const fmt = getSupportedBgAudioFormat();
                let cached = await getCachedTrackFromIDB(uid);
                if (activeLoadedUid !== uid) return;

                if (cached && cached.audioBlob) {
                    currentActiveObjectUrl = URL.createObjectURL(cached.audioBlob);
                    bgAudio.src = currentActiveObjectUrl;
                    window.__12amBgCachedStatus = 'Cached';
                } else {
                    window.__12amBgCachedStatus = '';
                    const ytId = await resolveYoutubeIdForTrack(track);
                    if (activeLoadedUid !== uid) return;
                    if (!ytId) {
                        if (typeof window.__sync12amGameAudioDucking === 'function') {
                            window.__sync12amGameAudioDucking(false);
                        }
                        return;
                    }
                    // Re-check IDB by ytId in case original uid differed from resolved ytId
                    if (ytId !== uid) {
                        const altCached = await getCachedTrackFromIDB(ytId);
                        if (altCached && altCached.audioBlob) {
                            currentActiveObjectUrl = URL.createObjectURL(altCached.audioBlob);
                            bgAudio.src = currentActiveObjectUrl;
                            window.__12amBgCachedStatus = 'Cached';
                        } else {
                            bgAudio.src = `${prefix}api/music-api?endpoint=stream&id=${encodeURIComponent(ytId)}&format=${encodeURIComponent(fmt)}&v=2`;
                            if (desiredPlaying) {
                                cacheSongInBackground(track, ytId, fmt);
                            }
                        }
                    } else {
                        bgAudio.src = `${prefix}api/music-api?endpoint=stream&id=${encodeURIComponent(ytId)}&format=${encodeURIComponent(fmt)}&v=2`;
                        if (desiredPlaying) {
                            cacheSongInBackground(track, ytId, fmt);
                        }
                    }
                }

                if (desiredPlaying) {
                    bgAudio.play().then(() => {
                        persistBgAudioState(true);
                        if (typeof window.__sync12amGameAudioDucking === 'function') {
                            window.__sync12amGameAudioDucking(true);
                        }
                    }).catch(() => {
                        if (typeof window.__sync12amGameAudioDucking === 'function') {
                            window.__sync12amGameAudioDucking(false);
                        }
                        const resumeOnInteraction = () => {
                            if (desiredPlaying && bgAudio.paused) {
                                bgAudio.play().then(() => {
                                    persistBgAudioState(true);
                                    if (typeof window.__sync12amGameAudioDucking === 'function') {
                                        window.__sync12amGameAudioDucking(true);
                                    }
                                }).catch(() => {});
                            }
                        };
                        document.addEventListener('pointerdown', resumeOnInteraction, { once: true, capture: true });
                        document.addEventListener('keydown', resumeOnInteraction, { once: true, capture: true });
                        refreshDockMusicWidgetUI('Tap page to resume audio');
                    });
                } else {
                    if (typeof window.__sync12amGameAudioDucking === 'function') {
                        window.__sync12amGameAudioDucking(false);
                    }
                    refreshDockMusicWidgetUI();
                }
            }

            const applyPendingSeek = () => {
                if (pendingSeekTime > 0.3) {
                    const safeTarget = Number.isFinite(bgAudio.duration) && bgAudio.duration > 1
                        ? Math.min(pendingSeekTime, Math.max(0, bgAudio.duration - 0.5))
                        : pendingSeekTime;
                    try {
                        bgAudio.currentTime = safeTarget;
                    } catch (_) {}
                    if (bgAudio.readyState >= 1) {
                        pendingSeekTime = 0;
                    }
                }
            };

            bgAudio.addEventListener('loadedmetadata', applyPendingSeek);
            bgAudio.addEventListener('canplay', applyPendingSeek);
            bgAudio.addEventListener('play', () => {
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(true);
                }
            });
            bgAudio.addEventListener('playing', async () => {
                applyPendingSeek();
                desiredPlaying = true;
                persistBgAudioState(true);
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(true);
                }
                // Ensure any playing track on a non-music page gets cached for faster loading
                const curState = readSavedMusicState();
                const tr = curState?.track || state.track;
                if (tr) {
                    const ytId = await resolveYoutubeIdForTrack(tr);
                    if (ytId) cacheSongInBackground(tr, ytId, getSupportedBgAudioFormat());
                }
            });
            bgAudio.addEventListener('pause', () => {
                if (window.__12amHandingOffToMusic) return;
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(false);
                }
                if (!bgAudio.ended) {
                    persistBgAudioState(false);
                }
            });
            const restoreGameAudioOnStop = () => {
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(false);
                }
            };
            bgAudio.addEventListener('error', restoreGameAudioOnStop);
            bgAudio.addEventListener('abort', restoreGameAudioOnStop);
            bgAudio.addEventListener('emptied', restoreGameAudioOnStop);
            bgAudio.addEventListener('timeupdate', () => {
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(!bgAudio.paused && !bgAudio.ended);
                }
                const now = Date.now();
                if (now - lastPersistAt >= 450 && (!bgAudio.paused || bgAudio.currentTime > 0)) {
                    lastPersistAt = now;
                    persistBgAudioState(!bgAudio.paused);
                }
            });
            bgAudio.addEventListener('ended', () => {
                restoreGameAudioOnStop();
                window.__skipBgMusicTrack?.(1);
            });

            window.__toggleBgMusicPlayPause = async () => {
                window.__12amMusicClosed = false;
                const latest = readSavedMusicState();
                const tr = latest?.track || state.track;
                if (!tr) return;
                if (!bgAudio.src) {
                    desiredPlaying = true;
                    await loadTrackIntoBgPlayer(tr, Number(latest?.currentTime) || 0, true);
                    persistBgAudioState(true);
                    return;
                }
                if (bgAudio.paused) {
                    desiredPlaying = true;
                    try {
                        await bgAudio.play();
                        persistBgAudioState(true);
                    } catch (_) {}
                } else {
                    desiredPlaying = false;
                    bgAudio.pause();
                    persistBgAudioState(false);
                }
            };

            window.__skipBgMusicTrack = async (delta) => {
                window.__12amMusicClosed = false;
                const latest = readSavedMusicState() || {};
                const q = Array.isArray(latest.queue) && latest.queue.length ? latest.queue : (latest.track ? [latest.track] : []);
                if (!q.length) return;
                let idx = typeof latest.queueIndex === 'number' ? latest.queueIndex : 0;
                if (delta < 0 && Number.isFinite(bgAudio.currentTime) && bgAudio.currentTime > 3) {
                    bgAudio.currentTime = 0;
                    persistBgAudioState(!bgAudio.paused);
                    return;
                }
                idx = (idx + delta + q.length) % q.length;
                const nextTrack = q[idx];
                if (!nextTrack) return;
                desiredPlaying = true;
                writeSavedMusicState({
                    ...latest,
                    track: nextTrack,
                    queue: q,
                    queueIndex: idx,
                    currentTime: 0,
                    duration: (nextTrack.duration || 0) > 1000 ? nextTrack.duration / 1000 : (nextTrack.duration || 0),
                    isPlaying: true,
                    updatedAt: Date.now(),
                    source: 'dock'
                });
                refreshDockMusicWidgetUI();
                await loadTrackIntoBgPlayer(nextTrack, 0, true);
            };

            window.addEventListener('pagehide', () => {
                if (window.__12amHandingOffToMusic) return;
                persistBgAudioState(!bgAudio.paused);
            });
            window.addEventListener('beforeunload', () => {
                if (window.__12amHandingOffToMusic) return;
                persistBgAudioState(!bgAudio.paused);
            });

            if (state.isPlaying) {
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(true);
                }
                loadTrackIntoBgPlayer(state.track, Number(state.currentTime) || 0, true);
            } else {
                if (typeof window.__sync12amGameAudioDucking === 'function') {
                    window.__sync12amGameAudioDucking(false);
                }
                // Pre-check cache status silently for UI badge
                const uid = resolveDockTrackUid(state.track);
                getCachedTrackFromIDB(uid).then((c) => {
                    if (c && c.audioBlob) {
                        window.__12amBgCachedStatus = 'Cached';
                        refreshDockMusicWidgetUI();
                    }
                });
            }
        }

        // Bottom section: Music Mini-Player cover right above Auth section
        const musicMiniHtml = renderMusicMiniPlayerHtml();
        const authSectionHtml = renderAuthSectionHtml(prefix, activeId);

        container.innerHTML = `
            <div class="sidebar-section sidebar-section-top">
                ${topSectionHtml}
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section sidebar-section-bottom">
                ${musicMiniHtml}
                ${authSectionHtml}
            </div>
        `;

        queueMicrotask(() => {
            try { initDockAndBackgroundMusic(); } catch (_) {}
        });

        if (isSignedIn && localStorage.getItem('12am_sidebar_collapsed') === 'true') {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed', 'sidebar-peek-open');
        }

        setupPanicKey();
        setupAuthMenuListeners();
        setupMoreMenuListeners();
        setupSettingsSecondaryDock();
        setupEdgeSensorAndPeek();
        injectMinimalFooter();
        if (typeof window.__updateNavbarLogo === 'function') window.__updateNavbarLogo();
    }

    // Injected Minimal Footer: Injected on top in bottom right, separate from page flow
    function injectMinimalFooter() {
        let footer = document.getElementById('minimal-footer-cluster');
        if (!footer) {
            footer = document.createElement('footer');
            footer.id = 'minimal-footer-cluster';
            footer.className = 'minimal-footer-cluster';
            document.body.appendChild(footer);
        }

        const isLegalPage = window.location.pathname.includes('legal') || getActivePageId() === 'legal';
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';

        if (isLegalPage) {
            footer.innerHTML = `
                <a href="#terms" class="minimal-footer-link" title="Terms &amp; Policies">
                    <i class="fa-solid fa-scale-balanced mr-1.5" style="font-size: 11px; opacity: 0.85; color: var(--accent-color, #f59e0b);"></i>Terms &amp; Policies
                </a>
                <span class="minimal-footer-dot">•</span>
                <span class="minimal-footer-copy">All rights reserved</span>
            `;
        } else {
            footer.innerHTML = `
                <a href="${prefix}legal.html" class="minimal-footer-link" title="Terms of Service & Privacy Policy">
                    <i class="fa-solid fa-shield-halved mr-1.5" style="font-size: 11px; opacity: 0.85; color: var(--accent-color, #f59e0b);"></i>Terms &amp; Privacy Policy
                </a>
                <span class="minimal-footer-dot">•</span>
                <span class="minimal-footer-copy">All rights reserved</span>
            `;
        }
    }

    window.__updateNavbarUser = function() {
        createFloatingSidebar();
    };

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
        const logos = document.querySelectorAll('.navbar-logo, #navbar-logo, #sidebar-logo, .minimal-footer-logo');
        const t = theme || (typeof window.getCurrentTheme === 'function' ? window.getCurrentTheme() : null);
        if (!t) return;
        const isLight = lightThemeNames.includes(t.name);
        const tintColor = isLight ? '#000000' : (t.name === 'AMOLED' ? '#ffffff' : (t['accent-primary'] || '#f59e0b'));
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';

        logos.forEach(logo => {
            if (!logo) return;
            const logoUrl = `${prefix}images/logo-white.png`;
            logo.src = logoUrl;
            if (logo.parentElement && logo.parentElement.classList && logo.parentElement.classList.contains('sidebar-logo-inner')) {
                const maskUrl = `url("${logoUrl}")`;
                const wrap = logo.parentElement;
                wrap.style.backgroundColor = tintColor;
                wrap.style.transition = 'background-color 0.2s ease';
                wrap.style.webkitMaskImage = maskUrl;
                wrap.style.maskImage = maskUrl;
                wrap.style.webkitMaskSize = 'contain';
                wrap.style.maskSize = 'contain';
                wrap.style.webkitMaskRepeat = 'no-repeat';
                wrap.style.maskRepeat = 'no-repeat';
                wrap.style.webkitMaskPosition = 'center';
                wrap.style.maskPosition = 'center';
                logo.style.opacity = '0';
                logo.style.transform = 'none';
                logo.style.filter = 'none';
            } else {
                logo.style.transition = 'filter 0.2s ease';
                logo.style.transform = 'translateX(-100px)';
                logo.style.filter = `drop-shadow(100px 0 0 ${tintColor})`;
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
