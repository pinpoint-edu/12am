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
        const href = (window.location.href || '').toLowerCase();
        if (href.includes('dashboard.html')) return 'dashboard';
        if (href.includes('games.html')) return 'games';
        if (href.includes('movies.html') || href.includes('/movies/')) return 'movies';
        if (href.includes('music.html') || href.includes('/yolk/')) return 'music';
        if (href.includes('messenger.html')) return 'messenger';
        if (href.includes('notes.html')) return 'notes';
        if (href.includes('dictionary.html')) return 'dictionary';
        if (href.includes('ai.html')) return 'ai';
        if (href.includes('proxy.html') || href.includes('web.html')) return 'proxy';
        if (href.includes('settings.html')) return 'settings';
        return 'dashboard';
    }

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
        try {
            localStorage.removeItem('12am_user');
        } catch(e) {}
        window.location.reload();
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

        // 1. Brand Logo (Pure Logo, No Clock, No Text)
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

        // 3. Right Controls: Log In Button / User Pill (Clean, No avatar circle, No buzzwords)
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
                const displayName = currentUser.nickname || currentUser.firstName;
                return `
                    <div class="nav-right-controls" id="navRightControls">
                        <div class="nav-user-pill" title="@${escapeHtml(displayName)}">
                            <span class="user-nickname-text">@${escapeHtml(displayName)}</span>
                            <button onclick="window.logOut12AM()" class="nav-logout-btn" title="Log Out">
                                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="nav-right-controls" id="navRightControls">
                        <button type="button" onclick="if(window.TwelveAMAuth) window.TwelveAMAuth.showAuthModal();" class="nav-btn-pill nav-login-btn" id="navLoginBtn" title="Log In">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i>
                            <span>Log In</span>
                        </button>
                    </div>
                `;
            }
        }

        window.__updateNavbarUser = function() {
            const ctrl = document.getElementById('navRightControls');
            if (ctrl && ctrl.parentElement) {
                const temp = document.createElement('div');
                temp.innerHTML = getRightControlsHtml();
                const newChild = temp.firstElementChild;
                if (newChild) {
                    ctrl.replaceWith(newChild);
                }
            }
        };

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
    }

    function setupScrollGliders() {
        const scrollContainer = document.getElementById('tabScrollContainer');
        const leftBtn = document.getElementById('glide-left');
        const rightBtn = document.getElementById('glide-right');

        if (!scrollContainer || !leftBtn || !rightBtn) return;

        function updateGliders() {
            const hasOverflow = scrollContainer.scrollWidth > scrollContainer.offsetWidth + 2;
            if (!hasOverflow) {
                leftBtn.classList.add('hidden');
                rightBtn.classList.add('hidden');
                return;
            }
            const isLeft = scrollContainer.scrollLeft <= 4;
            const isRight = scrollContainer.scrollLeft + scrollContainer.offsetWidth >= scrollContainer.scrollWidth - 4;
            leftBtn.classList.toggle('hidden', isLeft);
            rightBtn.classList.toggle('hidden', isRight);
        }

        leftBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -180, behavior: 'smooth' });
        });
        rightBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 180, behavior: 'smooth' });
        });

        scrollContainer.addEventListener('scroll', updateGliders, { passive: true });
        window.addEventListener('resize', updateGliders);
        setTimeout(updateGliders, 100);
    }


    function setupThemeDropdown() {
        const btn = document.getElementById('themeMenuBtn');
        const menu = document.getElementById('themeMenuDropdown');
        const itemsContainer = document.getElementById('themeMenuItems');

        if (!btn || !menu) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
            if (menu.classList.contains('open')) {
                renderThemeMenuItems();
            }
        });

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.remove('open');
            }
        });

        function renderThemeMenuItems() {
            if (!itemsContainer) return;
            const themes = (typeof window.getThemes === 'function') ? window.getThemes() : [];
            const currentTheme = (typeof window.getCurrentTheme === 'function') ? window.getCurrentTheme() : null;

            const displayThemes = themes.length > 0 ? themes : [
                { name: 'Dark', 'accent-primary': '#4f46e5' },
                { name: 'Light', 'accent-primary': '#4f46e5' },
                { name: 'Matrix', 'accent-primary': '#22c55e' },
                { name: 'Ocean', 'accent-primary': '#0ea5e9' },
                { name: 'Crimson', 'accent-primary': '#ef4444' },
                { name: 'Sunset', 'accent-primary': '#f97316' },
                { name: 'Lavender', 'accent-primary': '#a855f7' },
                { name: 'Christmas', 'accent-primary': '#22c55e' }
            ];

            itemsContainer.innerHTML = displayThemes.slice(0, 14).map(t => {
                const isActive = currentTheme && currentTheme.name.toLowerCase() === t.name.toLowerCase();
                const accent = t['accent-primary'] || '#4f46e5';
                return `
                    <button class="theme-menu-item ${isActive ? 'active' : ''}" onclick="window.selectNavTheme('${t.name}')">
                        <span>${t.name}</span>
                        <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${accent};"></span>
                    </button>
                `;
            }).join('');
        }
    }

    window.selectNavTheme = function(name) {
        if (typeof window.setThemeByName === 'function') {
            window.setThemeByName(name);
        }
        const menu = document.getElementById('themeMenuDropdown');
        if (menu) menu.classList.remove('open');
    };

    window.addEventListener('12am:theme-changed', (e) => {
        const theme = e.detail;
        const dot = document.getElementById('navThemeDot');
        const label = document.getElementById('navThemeName');
        const logo = document.getElementById('navbar-logo');

        if (dot && theme['accent-primary']) dot.style.background = theme['accent-primary'];
        if (label && theme.name) label.textContent = theme.name;
        if (logo) logo.src = getLogoSrc(theme);
    });

    // Panic Key & Cloaking
    function setupPanicKey() {
        window.addEventListener('keydown', (e) => {
            const savedPanicKey = localStorage.getItem('12am_panic_key') || ']';
            if (e.key === savedPanicKey && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                window.triggerPanicCloak();
            }
        });
    }

    window.triggerPanicCloak = function() {
        const destination = localStorage.getItem('12am_panic_url') || 'https://classroom.google.com';
        window.location.replace(destination);
    };

    // Initialize Navigation on ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createNavbar);
    } else {
        createNavbar();
    }
})();
