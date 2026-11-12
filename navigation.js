/**
 * 12AM Navigation Bar
 * Fully compatible with file:/// and http(s):// protocols
 */

(function() {
    if (window.__12am_nav_loaded) return;
    window.__12am_nav_loaded = true;

    const NAV_PAGES = [
        { id: "dashboard", name: "Dashboard", icon: "fa-solid fa-house-user", url: "dashboard.html" },
        { id: "games", name: "Games", icon: "fa-solid fa-gamepad", url: "games.html" },
        { id: "movies", name: "Movies", icon: "fa-solid fa-film", url: "movies.html" },
        { id: "music", name: "Music", icon: "fa-solid fa-music", url: "music.html" },
        { id: "messenger", name: "Messenger", icon: "fa-solid fa-comments", url: "messenger.html" },
        { id: "notes", name: "Notes", icon: "fa-solid fa-note-sticky", url: "notes.html" },
        { id: "dictionary", name: "Dictionary", icon: "fa-solid fa-book-bookmark", url: "dictionary.html" },
        { id: "ai", name: "AI", icon: "fa-solid fa-robot", url: "ai.html" },
        { id: "proxy", name: "Proxy", icon: "fa-solid fa-globe", url: "proxy.html" },
        { id: "settings", name: "Settings", icon: "fa-solid fa-gear", url: "settings.html" }
    ];

    const lightThemeNames = ['Light', 'Lavender', 'Rose Gold', 'Mint', 'Pink', 'Birthday'];

    function getActivePageId() {
        const path = (window.location.pathname || '').toLowerCase();
        const href = (window.location.href || '').toLowerCase();

        // Extract base page filename without directory and extension
        const cleanName = path.split('/').filter(Boolean).pop() || '';
        const base = cleanName.replace(/\.html$/, '');

        // Direct matching against NAV_PAGES
        for (const p of NAV_PAGES) {
            if (base === p.id) return p.id;
        }

        // Substring and alternate matching (works on Vercel clean URLs e.g. /games, /movies)
        if (base === 'games' || base.includes('game') || href.includes('games')) return 'games';
        if (base === 'movies' || base.includes('movie') || href.includes('movies')) return 'movies';
        if (base === 'music' || base.includes('music') || href.includes('music') || href.includes('yolk')) return 'music';
        if (base === 'messenger' || base.includes('messenger') || href.includes('messenger')) return 'messenger';
        if (base === 'notes' || base.includes('note') || href.includes('notes')) return 'notes';
        if (base === 'dictionary' || base.includes('dict') || href.includes('dictionary')) return 'dictionary';
        if (base === 'ai' || base.includes('ai') || href.includes('/ai')) return 'ai';
        if (base === 'proxy' || base.includes('proxy') || base.includes('web') || href.includes('proxy')) return 'proxy';
        if (base === 'settings' || base.includes('setting') || href.includes('settings')) return 'settings';
        if (base === 'dashboard' || base.includes('dash') || href.includes('dashboard') || base === '' || base === 'index') return 'dashboard';

        return 'dashboard';
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
        const t = theme || (typeof window.getCurrentTheme === 'function' ? window.getCurrentTheme() : null);
        const isLight = t && lightThemeNames.includes(t.name);
        return isLight ? 'images/logo-black.png' : 'images/logo-white.png';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

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

    function getRightControlsHtml() {
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

        if (currentUser && (currentUser.nickname || currentUser.firstName)) {
            const displayName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : currentUser.nickname;
            const handle = currentUser.nickname || 'user';

            return `
                <div class="nav-right-controls" id="navRightControls">
                    <div id="auth-button-container" class="auth-btn-container">
                        <button id="auth-toggle" class="auth-toggle-btn" title="@${escapeHtml(handle)}">
                            <i class="fa-solid fa-user-check"></i>
                        </button>
                        <div id="auth-menu-container" class="auth-menu-container closed">
                            <div class="auth-menu-header">
                                <p class="auth-menu-displayname">${escapeHtml(displayName)}</p>
                                <p class="auth-menu-handle">@${escapeHtml(handle)}</p>
                            </div>
                            <div class="auth-menu-divider"></div>
                            <a href="settings.html" class="auth-menu-link">
                                <i class="fa-solid fa-gear"></i>
                                <span>Settings</span>
                            </a>
                            <a href="legal.html" class="auth-menu-link">
                                <i class="fa-solid fa-shield-halved"></i>
                                <span>Terms &amp; Policies</span>
                            </a>
                            <button type="button" onclick="window.logOut12AM()" class="auth-menu-button auth-menu-logout">
                                <i class="fa-solid fa-right-from-bracket"></i>
                                <span>Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="nav-right-controls" id="navRightControls">
                    <div id="auth-button-container" class="auth-btn-container">
                        <button id="auth-toggle" class="auth-toggle-btn" title="Account">
                            <i class="fa-solid fa-user"></i>
                        </button>
                        <div id="auth-menu-container" class="auth-menu-container closed">
                            <div class="auth-menu-header">
                                <p class="auth-menu-displayname">Guest</p>
                                <p class="auth-menu-handle">Not signed in</p>
                            </div>
                            <div class="auth-menu-divider"></div>
                            <button type="button" onclick="if(window.TwelveAMAuth) window.TwelveAMAuth.showAuthModal();" class="auth-menu-button auth-menu-primary">
                                <i class="fa-solid fa-lock"></i>
                                <span>Authenticate</span>
                            </button>
                            <a href="settings.html" class="auth-menu-link">
                                <i class="fa-solid fa-gear"></i>
                                <span>Settings</span>
                            </a>
                            <a href="legal.html" class="auth-menu-link">
                                <i class="fa-solid fa-shield-halved"></i>
                                <span>Terms &amp; Policies</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    function setupAuthMenuListeners() {
        const toggleBtn = document.getElementById('auth-toggle');
        const menu = document.getElementById('auth-menu-container');
        if (!toggleBtn || !menu) return;

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains('open');
            if (isOpen) {
                menu.classList.remove('open');
                menu.classList.add('closed');
            } else {
                menu.classList.remove('closed');
                menu.classList.add('open');
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                if (menu.classList.contains('open')) {
                    menu.classList.remove('open');
                    menu.classList.add('closed');
                }
            }
        });
    }

    window.__updateNavbarUser = function() {
        const ctrl = document.getElementById('navRightControls');
        if (ctrl && ctrl.parentElement) {
            const temp = document.createElement('div');
            temp.innerHTML = getRightControlsHtml();
            const newChild = temp.firstElementChild;
            if (newChild) {
                ctrl.replaceWith(newChild);
                setupAuthMenuListeners();
            }
        }
    };

    function createNavbar() {
        let container = document.getElementById('navbar-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'navbar-container';
            document.body.prepend(container);
        }

        const activeId = getActivePageId();
        const logoSrc = getLogoSrc();

        // 1. Brand Logo
        const brandHtml = `
            <a href="dashboard.html" class="nav-brand-group" title="12AM">
                <img src="${logoSrc}" alt="12AM Logo" class="navbar-logo" id="navbar-logo">
            </a>
        `;

        // 2. Tabs with relative URLs
        const tabsHtml = NAV_PAGES.map(p => {
            const isActive = p.id === activeId;
            return `
                <a href="${p.url}" class="nav-tab ${isActive ? 'active' : ''}" data-page="${p.id}">
                    <i class="${p.icon}"></i>
                    <span class="tab-title">${p.name}</span>
                </a>
            `;
        }).join('');

        // 3. Right Controls: v6 Auth Dropdown
        const rightControlsHtml = getRightControlsHtml();

        container.innerHTML = `
            ${brandHtml}
            <div class="tab-wrapper">
                <button id="glide-left" class="scroll-glide-button hidden" title="Scroll left">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="tab-scroll-container" id="tabScrollContainer">
                    ${tabsHtml}
                </div>
                <button id="glide-right" class="scroll-glide-button hidden" title="Scroll right">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            ${rightControlsHtml}
        `;

        setupScrollGliders();
        setupPanicKey();
        setupAuthMenuListeners();
    }

    function setupScrollGliders() {
        const scrollContainer = document.getElementById('tabScrollContainer');
        const leftBtn = document.getElementById('glide-left');
        const rightBtn = document.getElementById('glide-right');

        if (!scrollContainer || !leftBtn || !rightBtn) return;

        function updateGliders() {
            const atStart = scrollContainer.scrollLeft <= 5;
            const atEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 5;

            leftBtn.classList.toggle('hidden', atStart);
            rightBtn.classList.toggle('hidden', atEnd);
        }

        leftBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -220, behavior: 'smooth' });
        });

        rightBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 220, behavior: 'smooth' });
        });

        scrollContainer.addEventListener('scroll', updateGliders, { passive: true });
        window.addEventListener('resize', updateGliders);
        setTimeout(updateGliders, 150);
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

    // Expose theme logo update callback
    window.__updateNavbarLogo = function(theme) {
        const logo = document.getElementById('navbar-logo');
        if (logo) {
            logo.src = getLogoSrc(theme);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createNavbar);
    } else {
        createNavbar();
    }
})();
