/**
 * 12AM Theme Engine
 * Fully compatible with file:/// and http(s):// protocols
 */

(function() {
    // Suppress Tailwind Play CDN production notice in console
    if (typeof console !== 'undefined' && console.warn) {
        const _origWarn = console.warn;
        console.warn = function(...args) {
            if (args && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
            _origWarn.apply(console, args);
        };
    }

    const THEME_STORAGE_KEY = "12am-theme";
    const LEGACY_STORAGE_KEY = "user-navbar-theme";
    const lightThemeNames = ["Light"];

    // Refined core themes with "Original" (sunset orange & gold on dark background) as the first and default
    const EMBEDDED_THEMES = [
    {
        "name": "Original",
        "description": "The default 12AM experience with vibrant solar orange and rich sunset gold accents.",
        "bg-primary": "#070709",
        "bg-secondary": "#0f0f14",
        "text-primary": "#ffffff",
        "text-secondary": "#ffd700",
        "accent-primary": "#ff8800",
        "accent-secondary": "rgba(255, 136, 0, 0.45)",
        "accent-glow": "rgba(255, 136, 0, 0.38)",
        "navbar-bg": "rgba(12, 11, 15, 0.85)",
        "navbar-border": "rgba(255, 140, 0, 0.32)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(255, 136, 0, 0.22)",
        "tab-active-text": "#ffd700",
        "tab-active-border": "#ff8800",
        "tab-hover-bg": "rgba(255, 136, 0, 0.12)",
        "tab-hover-text": "#ffe066",
        "button-bg": "rgba(255, 136, 0, 0.22)",
        "button-text": "#ffd700",
        "border-primary": "rgba(255, 140, 0, 0.26)",
        "border-secondary": "rgba(255, 255, 255, 0.07)",
        "avatar-gradient": "linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #ea580c 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Dark",
        "description": "Default dark theme with deep gray and violet accents.",
        "bg-primary": "#040404",
        "bg-secondary": "#0c0c0e",
        "text-primary": "#ffffff",
        "text-secondary": "#a1a1aa",
        "accent-primary": "#8b5cf6",
        "accent-secondary": "rgba(139, 92, 246, 0.4)",
        "accent-glow": "rgba(139, 92, 246, 0.35)",
        "navbar-bg": "rgba(10, 10, 14, 0.82)",
        "navbar-border": "rgba(255, 255, 255, 0.09)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(139, 92, 246, 0.15)",
        "tab-active-text": "#a78bfa",
        "tab-active-border": "#8b5cf6",
        "tab-hover-bg": "rgba(255, 255, 255, 0.05)",
        "tab-hover-text": "#c4b5fd",
        "button-bg": "rgba(139, 92, 246, 0.15)",
        "button-text": "#8b5cf6",
        "border-primary": "#1c1c20",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "AMOLED Midnight",
        "description": "Pure black darkness engineered for OLED screens. Dims media player brightness by 20% for pure nocturnal focus.",
        "bg-primary": "#000000",
        "bg-secondary": "#050505",
        "text-primary": "#ffffff",
        "text-secondary": "#999999",
        "accent-primary": "#ffffff",
        "accent-secondary": "rgba(255, 255, 255, 0.35)",
        "accent-glow": "rgba(255, 255, 255, 0.25)",
        "navbar-bg": "#000000",
        "navbar-border": "#1a1a1a",
        "navbar-text": "#ffffff",
        "tab-active-bg": "#141414",
        "tab-active-text": "#ffffff",
        "tab-active-border": "#ffffff",
        "tab-hover-bg": "#0c0c0c",
        "tab-hover-text": "#e0e0e0",
        "button-bg": "#141414",
        "button-text": "#ffffff",
        "border-primary": "#181818",
        "border-secondary": "#111111",
        "avatar-gradient": "linear-gradient(135deg, #2a2a2a 0%, #000000 100%)",
        "logo-src": "/images/logo.png",
        "media-dim": 0.8
    },
    {
        "name": "Tokyo Night",
        "description": "Iconic Tokyo cyberpunk midnight palette with neon cyan and magenta accents.",
        "bg-primary": "#1a1b26",
        "bg-secondary": "#16161e",
        "text-primary": "#c0caf5",
        "text-secondary": "#7aa2f7",
        "accent-primary": "#7aa2f7",
        "accent-secondary": "rgba(122, 162, 247, 0.35)",
        "accent-glow": "rgba(122, 162, 247, 0.25)",
        "navbar-bg": "rgba(22, 22, 30, 0.9)",
        "navbar-border": "rgba(122, 162, 247, 0.2)",
        "navbar-text": "#c0caf5",
        "tab-active-bg": "rgba(122, 162, 247, 0.15)",
        "tab-active-text": "#bb9af7",
        "tab-active-border": "#bb9af7",
        "tab-hover-bg": "rgba(122, 162, 247, 0.08)",
        "tab-hover-text": "#7dcfff",
        "button-bg": "rgba(122, 162, 247, 0.15)",
        "button-text": "#7aa2f7",
        "border-primary": "#24283b",
        "border-secondary": "rgba(255, 255, 255, 0.05)",
        "avatar-gradient": "linear-gradient(135deg, #7aa2f7 0%, #bb9af7 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Sunset",
        "description": "Deep twilight dusk blending warm coral, fiery amber, and glowing rose tones.",
        "bg-primary": "#0e0914",
        "bg-secondary": "#170f20",
        "text-primary": "#ffffff",
        "text-secondary": "#f472b6",
        "accent-primary": "#f43f5e",
        "accent-secondary": "rgba(244, 63, 94, 0.4)",
        "accent-glow": "rgba(244, 63, 94, 0.3)",
        "navbar-bg": "rgba(19, 12, 27, 0.88)",
        "navbar-border": "rgba(244, 63, 94, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(244, 63, 94, 0.18)",
        "tab-active-text": "#fb7185",
        "tab-active-border": "#f43f5e",
        "tab-hover-bg": "rgba(244, 63, 94, 0.1)",
        "tab-hover-text": "#fda4af",
        "button-bg": "rgba(244, 63, 94, 0.18)",
        "button-text": "#f43f5e",
        "border-primary": "#2d1b38",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Emerald Matrix",
        "description": "Radiant terminal phosphor green on deep carbon matrix shadows.",
        "bg-primary": "#040d08",
        "bg-secondary": "#08170f",
        "text-primary": "#ecfdf5",
        "text-secondary": "#6ee7b7",
        "accent-primary": "#10b981",
        "accent-secondary": "rgba(16, 185, 129, 0.4)",
        "accent-glow": "rgba(16, 185, 129, 0.3)",
        "navbar-bg": "rgba(7, 19, 13, 0.88)",
        "navbar-border": "rgba(16, 185, 129, 0.25)",
        "navbar-text": "#ecfdf5",
        "tab-active-bg": "rgba(16, 185, 129, 0.18)",
        "tab-active-text": "#34d399",
        "tab-active-border": "#10b981",
        "tab-hover-bg": "rgba(16, 185, 129, 0.1)",
        "tab-hover-text": "#6ee7b7",
        "button-bg": "rgba(16, 185, 129, 0.18)",
        "button-text": "#10b981",
        "border-primary": "#132d20",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Crimson",
        "description": "Velvet dark obsidian with burning blood ruby accents.",
        "bg-primary": "#0c0506",
        "bg-secondary": "#160a0c",
        "text-primary": "#ffffff",
        "text-secondary": "#fca5a5",
        "accent-primary": "#ef4444",
        "accent-secondary": "rgba(239, 68, 68, 0.4)",
        "accent-glow": "rgba(239, 68, 68, 0.3)",
        "navbar-bg": "rgba(18, 9, 11, 0.88)",
        "navbar-border": "rgba(239, 68, 68, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(239, 68, 68, 0.18)",
        "tab-active-text": "#f87171",
        "tab-active-border": "#ef4444",
        "tab-hover-bg": "rgba(239, 68, 68, 0.1)",
        "tab-hover-text": "#fca5a5",
        "button-bg": "rgba(239, 68, 68, 0.18)",
        "button-text": "#ef4444",
        "border-primary": "#2b1216",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Deep Ocean",
        "description": "Abyssal midnight navy with radiant electric cyan and sapphire accents.",
        "bg-primary": "#040914",
        "bg-secondary": "#081324",
        "text-primary": "#ffffff",
        "text-secondary": "#7dd3fc",
        "accent-primary": "#0ea5e9",
        "accent-secondary": "rgba(14, 165, 233, 0.4)",
        "accent-glow": "rgba(14, 165, 233, 0.3)",
        "navbar-bg": "rgba(7, 16, 30, 0.88)",
        "navbar-border": "rgba(14, 165, 233, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(14, 165, 233, 0.18)",
        "tab-active-text": "#38bdf8",
        "tab-active-border": "#0ea5e9",
        "tab-hover-bg": "rgba(14, 165, 233, 0.1)",
        "tab-hover-text": "#7dd3fc",
        "button-bg": "rgba(14, 165, 233, 0.18)",
        "button-text": "#0ea5e9",
        "border-primary": "#122642",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Royal Lavender",
        "description": "Regal midnight purple draped in soft glowing amethyst and lilac light.",
        "bg-primary": "#0b0614",
        "bg-secondary": "#140b22",
        "text-primary": "#ffffff",
        "text-secondary": "#d8b4fe",
        "accent-primary": "#c084fc",
        "accent-secondary": "rgba(192, 132, 252, 0.4)",
        "accent-glow": "rgba(192, 132, 252, 0.3)",
        "navbar-bg": "rgba(16, 9, 28, 0.88)",
        "navbar-border": "rgba(192, 132, 252, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(192, 132, 252, 0.18)",
        "tab-active-text": "#e9d5ff",
        "tab-active-border": "#c084fc",
        "tab-hover-bg": "rgba(192, 132, 252, 0.1)",
        "tab-hover-text": "#f3e8ff",
        "button-bg": "rgba(192, 132, 252, 0.18)",
        "button-text": "#c084fc",
        "border-primary": "#27153f",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Light",
        "description": "Crisp paper-white theme with slate accents and deep dark text.",
        "bg-primary": "#f8fafc",
        "bg-secondary": "#ffffff",
        "text-primary": "#0f172a",
        "text-secondary": "#475569",
        "accent-primary": "#4f46e5",
        "accent-secondary": "rgba(79, 70, 229, 0.2)",
        "accent-glow": "rgba(79, 70, 229, 0.15)",
        "navbar-bg": "rgba(255, 255, 255, 0.9)",
        "navbar-border": "rgba(0, 0, 0, 0.08)",
        "navbar-text": "#0f172a",
        "tab-active-bg": "rgba(79, 70, 229, 0.1)",
        "tab-active-text": "#4f46e5",
        "tab-active-border": "#4f46e5",
        "tab-hover-bg": "rgba(0, 0, 0, 0.04)",
        "tab-hover-text": "#312e81",
        "button-bg": "rgba(79, 70, 229, 0.1)",
        "button-text": "#4f46e5",
        "border-primary": "#e2e8f0",
        "border-secondary": "rgba(0, 0, 0, 0.04)",
        "avatar-gradient": "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
        "logo-src": "/images/logo-dark.png"
    },
    {
        "name": "Christmas",
        "description": "Festive pine forest green with warm holly berry red and gold accents.",
        "bg-primary": "#05130b",
        "bg-secondary": "#0c2416",
        "text-primary": "#ffffff",
        "text-secondary": "#fca5a5",
        "accent-primary": "#ef4444",
        "accent-secondary": "rgba(239, 68, 68, 0.4)",
        "accent-glow": "rgba(239, 68, 68, 0.3)",
        "navbar-bg": "rgba(9, 29, 17, 0.88)",
        "navbar-border": "rgba(239, 68, 68, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(239, 68, 68, 0.2)",
        "tab-active-text": "#ffd700",
        "tab-active-border": "#ef4444",
        "tab-hover-bg": "rgba(255, 255, 255, 0.06)",
        "tab-hover-text": "#fecaca",
        "button-bg": "rgba(239, 68, 68, 0.2)",
        "button-text": "#ffd700",
        "border-primary": "#194229",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #ef4444 0%, #15803d 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "The New Year",
        "description": "Sparkling champagne gold on midnight onyx celebrating new beginnings.",
        "bg-primary": "#08080a",
        "bg-secondary": "#111115",
        "text-primary": "#ffffff",
        "text-secondary": "#fef08a",
        "accent-primary": "#eab308",
        "accent-secondary": "rgba(234, 179, 8, 0.4)",
        "accent-glow": "rgba(234, 179, 8, 0.3)",
        "navbar-bg": "rgba(15, 15, 20, 0.88)",
        "navbar-border": "rgba(234, 179, 8, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(234, 179, 8, 0.18)",
        "tab-active-text": "#fef08a",
        "tab-active-border": "#eab308",
        "tab-hover-bg": "rgba(234, 179, 8, 0.1)",
        "tab-hover-text": "#fde047",
        "button-bg": "rgba(234, 179, 8, 0.18)",
        "button-text": "#eab308",
        "border-primary": "#24242e",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #facc15 0%, #ca8a04 100%)",
        "logo-src": "/images/logo.png"
    }
]

    const DEFAULT_THEME = EMBEDDED_THEMES[0];
    let allThemes = EMBEDDED_THEMES;
    let currentTheme = DEFAULT_THEME;

    async function fetchThemes() {
        try {
            if (window.location.protocol.startsWith("http")) {
                const res = await fetch("themes.json");
                if (res.ok) {
                    const list = await res.json();
                    if (Array.isArray(list) && list.length > 0) {
                        allThemes = list;
                    }
                }
            }
        } catch (e) {
            // Keep embedded themes on file:/// or fetch failure
        }
        window.__12am_themes = allThemes;
        const saved = getSavedThemeName();
        const matched = allThemes.find(t => t.name.toLowerCase() === saved.toLowerCase());
        if (matched) {
            applyTheme(matched, false);
        } else {
            applyTheme(DEFAULT_THEME, false);
        }
        window.dispatchEvent(new CustomEvent("12am:themes-ready", { detail: allThemes }));
    }

    function getSavedThemeName() {
        try {
            const direct = localStorage.getItem(THEME_STORAGE_KEY);
            if (direct) {
                const parsed = JSON.parse(direct);
                if (parsed && parsed.name) return parsed.name;
            }
            const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacy) {
                const parsed = JSON.parse(legacy);
                if (parsed && parsed.name) return parsed.name;
            }
        } catch (e) {}
        return "Original";
    }

    function applyTheme(theme, save = true) {
        if (!theme || typeof theme !== "object") {
            theme = DEFAULT_THEME;
        }

        currentTheme = theme;
        const root = document.documentElement;
        const isLightTheme = lightThemeNames.includes(theme.name);

        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty("--" + key, value);
        }

        root.style.setProperty("--bg-page", theme["bg-primary"] || "#060608");
        root.style.setProperty("--bg-card", theme["bg-secondary"] || "#0c0c10");
        root.style.setProperty("--text-main", theme["text-primary"] || "#ffffff");
        root.style.setProperty("--text-muted", theme["text-secondary"] || "#c8c8d4");
        root.style.setProperty("--accent-color", theme["accent-primary"] || "#f59e0b");
        root.style.setProperty("--accent-glow", theme["accent-secondary"] || "rgba(245, 158, 11, 0.45)");
        root.style.setProperty("--border-main", theme["border-primary"] || "#1c1c24");
        root.style.setProperty("--border-faint", theme["border-secondary"] || "rgba(245, 158, 11, 0.12)");
        root.style.setProperty("--btn-bg", theme["button-bg"] || "rgba(245, 158, 11, 0.14)");
        root.style.setProperty("--btn-text", theme["button-text"] || "#f59e0b");

        const dynamicBg = document.getElementById("dynamic-background");
        if (dynamicBg) {
            const glowColor = theme["accent-secondary"] || "rgba(245, 158, 11, 0.45)";
            dynamicBg.style.background = `radial-gradient(circle at 50% 20%, ${glowColor}, transparent 65%)`;
        }

        // AMOLED Midnight Detection & 20% Player Brightness Reduction
        const isAmoled = theme.name === 'AMOLED Midnight' || (theme.name && theme.name.toLowerCase().includes('amoled'));
        if (isAmoled) {
            root.classList.add("theme-amoled-midnight");
        } else {
            root.classList.remove("theme-amoled-midnight");
        }

        let amoledStyle = document.getElementById("12am-amoled-player-dim");
        if (!amoledStyle) {
            amoledStyle = document.createElement("style");
            amoledStyle.id = "12am-amoled-player-dim";
            amoledStyle.textContent = `
                html.theme-amoled-midnight #gameIframe,
                html.theme-amoled-midnight #player-view iframe,
                html.theme-amoled-midnight #player-view canvas,
                html.theme-amoled-midnight #streamIframe,
                html.theme-amoled-midnight #playerModal iframe,
                html.theme-amoled-midnight #playerModal video,
                html.theme-amoled-midnight .stream-iframe {
                    filter: brightness(0.8) !important;
                    transition: filter 0.3s ease;
                }
            `;
            document.head.appendChild(amoledStyle);
        }

        if (isLightTheme) {
            root.classList.remove("dark");
            root.classList.add("light");
        } else {
            root.classList.remove("light");
            root.classList.add("dark");
        }

        let fixStyle = document.getElementById("12am-theme-contrast-fix");
        if (isLightTheme) {
            if (!fixStyle) {
                fixStyle = document.createElement("style");
                fixStyle.id = "12am-theme-contrast-fix";
                document.head.appendChild(fixStyle);
            }
            fixStyle.textContent = `
                .nav-tab:hover { color: #000000 !important; }
                .nav-tab.active { color: var(--accent-primary) !important; font-weight: 500 !important; }
                .text-white { color: #111827 !important; }
                .text-gray-400 { color: #4b5563 !important; }
            `;
        } else if (fixStyle) {
            fixStyle.textContent = "";
        }

        // Logo Tinting with v6 drop-shadow trick
        const logos = document.querySelectorAll(".navbar-logo, #navbar-logo, #sidebar-logo, .sidebar-logo-img, .minimal-footer-logo");
        const prefix = window.location.pathname.includes("/logged-in/") ? "../" : "";
        const noFilterThemes = ['Dark', 'Light', 'Christmas'];
        const isNoFilter = noFilterThemes.includes(theme.name);
        const tintColor = theme['accent-primary'] || theme['tab-active-text'] || '#f59e0b';

        logos.forEach(img => {
            if (!img) return;
            if (isNoFilter) {
                img.src = prefix + (isLightTheme ? "images/logo-black.png" : "images/logo-white.png");
                img.style.filter = "";
                img.style.transform = "";
            } else {
                img.src = prefix + "images/logo-white.png";
                img.style.filter = `drop-shadow(100px 0 0 ${tintColor})`;
                img.style.transform = "translateX(-100px)";
            }
        });

        if (save) {
            try {
                const serialized = JSON.stringify(theme);
                localStorage.setItem(THEME_STORAGE_KEY, serialized);
                localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
            } catch (e) {}
        }

        window.dispatchEvent(new CustomEvent("12am:theme-changed", { detail: theme }));
    }

    function setThemeByName(name) {
        const found = allThemes.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (found) {
            applyTheme(found, true);
            return true;
        }
        return false;
    }

    window.applyTheme = applyTheme;
    window.setThemeByName = setThemeByName;
    window.getThemes = () => allThemes;
    window.getCurrentTheme = () => currentTheme;
    window.DEFAULT_THEME = DEFAULT_THEME;

    // Apply saved theme immediately
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && parsed.name) {
                const match = allThemes.find(t => t.name.toLowerCase() === parsed.name.toLowerCase());
                applyTheme(match || DEFAULT_THEME, false);
            } else {
                applyTheme(DEFAULT_THEME, false);
            }
        } else {
            applyTheme(DEFAULT_THEME, false);
        }
    } catch (e) {
        applyTheme(DEFAULT_THEME, false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fetchThemes);
    } else {
        fetchThemes();
    }

    window.addEventListener("storage", (e) => {
        if (e.key === THEME_STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
            try {
                if (e.newValue) {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed && parsed.name !== currentTheme.name) {
                        applyTheme(parsed, false);
                    }
                }
            } catch (err) {}
        }
    });
})();
