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

    // More popup menu pages: Notes, Dictionary, Messenger
    const MORE_NAV_PAGES = [
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
            const avatarHtml = renderNavAvatar(currentUser, 32, '12px', '11px');
            const menuAvatarHtml = renderNavAvatar(currentUser, 42, '16px', '14px');

            const isCollapsed = localStorage.getItem('12am_sidebar_collapsed') === 'true';

            return `
                <div class="sidebar-auth-wrapper" id="sidebarAuthWrapper">
                    <button type="button" class="sidebar-btn sidebar-avatar-btn auth-toggle-btn" id="sidebarAuthToggle" aria-label="Account Menu">
                        ${avatarHtml}
                        <span class="sidebar-tooltip">@${escapeHtml(handle)}</span>
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
                    <span class="sidebar-tooltip">More</span>
                </button>
                <div id="more-menu-container" class="more-menu-container closed">
                    <div class="more-menu-header" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px 6px;">
                        <span style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted, #a1a1aa); font-weight: 500;">More Apps</span>
                    </div>
                    <div class="auth-menu-divider"></div>
                    <a href="${prefix}notes.html" class="auth-menu-link ${activeId === 'notes' ? 'active' : ''}">
                        <i class="fa-solid fa-note-sticky"></i>
                        <span>Notes</span>
                    </a>
                    <a href="${prefix}dictionary.html" class="auth-menu-link ${activeId === 'dictionary' ? 'active' : ''}">
                        <i class="fa-solid fa-book-bookmark"></i>
                        <span>Dictionary</span>
                    </a>
                    <a href="${prefix}messenger.html" class="auth-menu-link ${activeId === 'messenger' ? 'active' : ''}">
                        <i class="fa-solid fa-comments"></i>
                        <span>Messenger</span>
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
            moreToggle.addEventListener('mouseenter', () => clearTimeout(moreHoverTimer));
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

        // Bottom section: Auth section (auth toggle with menu when logged in, or direct buttons when logged out)
        const authSectionHtml = renderAuthSectionHtml(prefix, activeId);

        container.innerHTML = `
            <div class="sidebar-section sidebar-section-top">
                ${topSectionHtml}
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section sidebar-section-bottom">
                ${authSectionHtml}
            </div>
        `;

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
            logo.src = `${prefix}images/logo-white.png`;
            logo.style.transition = 'filter 0.2s ease';
            logo.style.transform = 'translateX(-100px)';
            logo.style.filter = `drop-shadow(100px 0 0 ${tintColor})`;
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
