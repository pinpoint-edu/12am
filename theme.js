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
        "logo-src": "/images/logo.png",
        "navbar-bg": "#09090d",
        "navbar-border": "rgba(245, 158, 11, 0.24)",
        "avatar-gradient": "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        "avatar-border": "#f59e0b",
        "menu-bg": "#0d0d12",
        "menu-border": "rgba(245, 158, 11, 0.28)",
        "menu-divider": "rgba(245, 158, 11, 0.18)",
        "menu-text": "#fef3c7",
        "menu-item-hover-bg": "rgba(245, 158, 11, 0.14)",
        "menu-item-hover-text": "#ffffff",
        "glass-menu-bg": "rgba(13, 13, 18, 0.85)",
        "glass-menu-border": "rgba(245, 158, 11, 0.3)",
        "logged-out-icon-bg": "#09090d",
        "logged-out-icon-border": "#f59e0b",
        "logged-out-icon-color": "#fbbf24",
        "glide-btn-color": "#f59e0b",
        "glide-gradient-left": "linear-gradient(to right, #060608, transparent)",
        "glide-gradient-right": "linear-gradient(to left, #060608, transparent)",
        "tab-text": "#d1d5db",
        "tab-hover-text": "#ffffff",
        "tab-hover-border": "#f59e0b",
        "tab-hover-bg": "rgba(245, 158, 11, 0.08)",
        "tab-active-text": "#fbbf24",
        "tab-active-border": "#f59e0b",
        "tab-active-bg": "rgba(245, 158, 11, 0.18)",
        "tab-active-hover-text": "#fde68a",
        "tab-active-hover-border": "#fde68a",
        "tab-active-hover-bg": "rgba(245, 158, 11, 0.25)",
        "pin-btn-border": "#f59e0b",
        "pin-btn-hover-bg": "rgba(245, 158, 11, 0.15)",
        "pin-btn-icon-color": "#fef3c7",
        "hint-bg": "#09090d",
        "hint-border": "rgba(245, 158, 11, 0.3)",
        "hint-text": "#fef3c7",
        "bg-primary": "#060608",
        "bg-secondary": "#0c0c10",
        "text-primary": "#ffffff",
        "text-secondary": "#d4d4dc",
        "accent-primary": "#f59e0b",
        "accent-secondary": "rgba(245, 158, 11, 0.45)",
        "border-primary": "#1c1c24",
        "border-secondary": "rgba(245, 158, 11, 0.12)",
        "button-bg": "rgba(245, 158, 11, 0.14)",
        "button-text": "#f59e0b"
    },
    {
        "name": "Dark",
        "logo-src": "/images/logo.png",
        "navbar-bg": "#000000",
        "navbar-border": "rgb(31 41 55)",
        "avatar-gradient": "linear-gradient(135deg, #374151 0%, #111827 100%)",
        "avatar-border": "#4b5563",
        "menu-bg": "#000000",
        "menu-border": "rgb(55 65 81)",
        "menu-divider": "#374151",
        "menu-text": "#d1d5db",
        "menu-item-hover-bg": "rgb(55 65 81)",
        "menu-item-hover-text": "#ffffff",
        "glass-menu-bg": "rgba(10, 10, 10, 0.8)",
        "glass-menu-border": "rgba(55, 65, 81, 0.8)",
        "logged-out-icon-bg": "#010101",
        "logged-out-icon-border": "#374151",
        "logged-out-icon-color": "#DADADA",
        "glide-btn-color": "#8b5cf6",
        "glide-gradient-left": "linear-gradient(to right, #000000, transparent)",
        "glide-gradient-right": "linear-gradient(to left, #000000, transparent)",
        "tab-text": "#9ca3af",
        "tab-hover-text": "#ffffff",
        "tab-hover-border": "#d1d5db",
        "tab-hover-bg": "rgba(139, 92, 246, 0.05)",
        "tab-active-text": "#8b5cf6",
        "tab-active-border": "#8b5cf6",
        "tab-active-bg": "rgba(139, 92, 246, 0.12)",
        "tab-active-hover-text": "#a78bfa",
        "tab-active-hover-border": "#a78bfa",
        "tab-active-hover-bg": "rgba(139, 92, 246, 0.18)",
        "pin-btn-border": "#4b5563",
        "pin-btn-hover-bg": "#374151",
        "pin-btn-icon-color": "#d1d5db",
        "hint-bg": "#010101",
        "hint-border": "#374151",
        "hint-text": "#ffffff",
        "bg-primary": "#040404",
        "bg-secondary": "#080808",
        "text-primary": "#ffffff",
        "text-secondary": "#c0c0c0",
        "accent-primary": "#8b5cf6",
        "accent-secondary": "rgba(139, 92, 246, 0.4)",
        "border-primary": "#1a1a1a",
        "border-secondary": "rgba(255,255,255,0.05)",
        "button-bg": "rgba(139, 92, 246, 0.12)",
        "button-text": "#8b5cf6"
    },
    {
        "name": "AMOLED Midnight",
        "logo-src": "/images/logo.png",
        "navbar-bg": "#000000",
        "navbar-border": "#111111",
        "avatar-gradient": "linear-gradient(135deg, #18181b 0%, #000000 100%)",
        "avatar-border": "#27272a",
        "menu-bg": "#000000",
        "menu-border": "#141416",
        "menu-divider": "#111111",
        "menu-text": "#a1a1aa",
        "menu-item-hover-bg": "#09090b",
        "menu-item-hover-text": "#ffffff",
        "glass-menu-bg": "rgba(0, 0, 0, 0.95)",
        "glass-menu-border": "rgba(20, 20, 22, 0.9)",
        "logged-out-icon-bg": "#000000",
        "logged-out-icon-border": "#18181b",
        "logged-out-icon-color": "#e4e4e7",
        "glide-btn-color": "#8b5cf6",
        "glide-gradient-left": "linear-gradient(to right, #000000, transparent)",
        "glide-gradient-right": "linear-gradient(to left, #000000, transparent)",
        "tab-text": "#71717a",
        "tab-hover-text": "#ffffff",
        "tab-hover-border": "#27272a",
        "tab-hover-bg": "rgba(139, 92, 246, 0.05)",
        "tab-active-text": "#8b5cf6",
        "tab-active-border": "#8b5cf6",
        "tab-active-bg": "rgba(139, 92, 246, 0.12)",
        "tab-active-hover-text": "#a78bfa",
        "tab-active-hover-border": "#a78bfa",
        "tab-active-hover-bg": "rgba(139, 92, 246, 0.18)",
        "pin-btn-border": "#18181b",
        "pin-btn-hover-bg": "#09090b",
        "pin-btn-icon-color": "#a1a1aa",
        "hint-bg": "#000000",
        "hint-border": "#18181b",
        "hint-text": "#ffffff",
        "bg-primary": "#000000",
        "bg-secondary": "#000000",
        "text-primary": "#ffffff",
        "text-secondary": "#71717a",
        "accent-primary": "#8b5cf6",
        "accent-secondary": "rgba(139, 92, 246, 0.15)",
        "border-primary": "#111111",
        "border-secondary": "rgba(255, 255, 255, 0.03)",
        "button-bg": "rgba(139, 92, 246, 0.12)",
        "button-text": "#8b5cf6"
    },
    {
        "name": "Light",
        "logo-src": "/images/logo-dark.png",
        "navbar-bg": "#f9fafb",
        "navbar-border": "#e5e7eb",
        "avatar-gradient": "linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)",
        "avatar-border": "#d1d5db",
        "menu-bg": "#ffffff",
        "menu-border": "#e5e7eb",
        "menu-divider": "#e5e7eb",
        "menu-text": "#111827",
        "menu-item-hover-bg": "#f3f4f6",
        "menu-item-hover-text": "#000000",
        "glass-menu-bg": "rgba(255, 255, 255, 0.9)",
        "glass-menu-border": "rgba(229, 231, 235, 0.9)",
        "logged-out-icon-bg": "#f3f4f6",
        "logged-out-icon-border": "#e5e7eb",
        "logged-out-icon-color": "#4b5563",
        "glide-btn-color": "#4f46e5",
        "glide-gradient-left": "linear-gradient(to right, #f9fafb, transparent)",
        "glide-gradient-right": "linear-gradient(to left, #f9fafb, transparent)",
        "tab-text": "#4b5563",
        "tab-hover-text": "#000000",
        "tab-hover-border": "#9ca3af",
        "tab-hover-bg": "rgba(79, 70, 229, 0.05)",
        "tab-active-text": "#4f46e5",
        "tab-active-border": "#4f46e5",
        "tab-active-bg": "rgba(79, 70, 229, 0.1)",
        "tab-active-hover-text": "#4338ca",
        "tab-active-hover-border": "#4338ca",
        "tab-active-hover-bg": "rgba(79, 70, 229, 0.15)",
        "pin-btn-border": "#d1d5db",
        "pin-btn-hover-bg": "#f3f4f6",
        "pin-btn-icon-color": "#4b5563",
        "hint-bg": "#ffffff",
        "hint-border": "#e5e7eb",
        "hint-text": "#111827",
        "bg-primary": "#f3f4f6",
        "bg-secondary": "#ffffff",
        "text-primary": "#111827",
        "text-secondary": "#4b5563",
        "accent-primary": "#4f46e5",
        "accent-secondary": "rgba(79, 70, 229, 0.25)",
        "border-primary": "#e5e7eb",
        "border-secondary": "rgba(0, 0, 0, 0.06)",
        "button-bg": "rgba(79, 70, 229, 0.1)",
        "button-text": "#4f46e5"
    },
    {
        "name": "Christmas",
        "logo-src": "/images/logo.png",
        "navbar-bg": "#0B3C1F",
        "navbar-border": "#166534",
        "avatar-gradient": "linear-gradient(135deg, #DC2626 0%, #166534 100%)",
        "avatar-border": "#DC2626",
        "menu-bg": "#082F18",
        "menu-border": "#166534",
        "menu-divider": "#166534",
        "menu-text": "#FEF3C7",
        "menu-item-hover-bg": "#14532D",
        "menu-item-hover-text": "#ffffff",
        "glass-menu-bg": "rgba(11, 60, 31, 0.8)",
        "glass-menu-border": "rgba(22, 101, 52, 0.8)",
        "logged-out-icon-bg": "#082F18",
        "logged-out-icon-border": "#166534",
        "logged-out-icon-color": "#FEF3C7",
        "glide-btn-color": "#F87171",
        "glide-gradient-left": "linear-gradient(to right, #082F18, transparent)",
        "glide-gradient-right": "linear-gradient(to left, #082F18, transparent)",
        "tab-text": "#86EFAC",
        "tab-hover-text": "#FFFFFF",
        "tab-hover-border": "#F87171",
        "tab-hover-bg": "rgba(254, 243, 199, 0.1)",
        "tab-active-text": "#F87171",
        "tab-active-border": "#F87171",
        "tab-active-bg": "rgba(220, 38, 38, 0.15)",
        "tab-active-hover-text": "#FFFFFF",
        "tab-active-hover-border": "#FFFFFF",
        "tab-active-hover-bg": "rgba(220, 38, 38, 0.25)",
        "pin-btn-border": "#166534",
        "pin-btn-hover-bg": "#14532D",
        "pin-btn-icon-color": "#FEF3C7",
        "hint-bg": "#082F18",
        "hint-border": "#166534",
        "hint-text": "#FEF3C7",
        "bg-primary": "#041a0d",
        "bg-secondary": "#082f18",
        "text-primary": "#fef3c7",
        "text-secondary": "#86efac",
        "accent-primary": "#ef4444",
        "accent-secondary": "rgba(239, 68, 68, 0.4)",
        "border-primary": "#166534",
        "border-secondary": "rgba(239, 68, 68, 0.2)",
        "button-bg": "rgba(239, 68, 68, 0.15)",
        "button-text": "#ef4444"
    },
    {
        "name": "The New Year",
        "logo-src": "/images/logo.png",
        "navbar-bg": "#0B0C10",
        "navbar-border": "#d97706",
        "avatar-gradient": "linear-gradient(135deg, #d97706 0%, #1f2937 100%)",
        "avatar-border": "#f59e0b",
        "menu-bg": "#0B0C10",
        "menu-border": "#d97706",
        "menu-divider": "#d97706",
        "menu-text": "#fef3c7",
        "menu-item-hover-bg": "rgba(217, 119, 6, 0.2)",
        "menu-item-hover-text": "#ffffff",
        "glass-menu-bg": "rgba(11, 12, 16, 0.85)",
        "glass-menu-border": "rgba(217, 119, 6, 0.5)",
        "logged-out-icon-bg": "#0B0C10",
        "logged-out-icon-border": "#d97706",
        "logged-out-icon-color": "#fcd34d",
        "glide-btn-color": "#fcd34d",
        "glide-gradient-left": "linear-gradient(to right, #0B0C10, transparent)",
        "glide-gradient-right": "linear-gradient(to left, #0B0C10, transparent)",
        "tab-text": "#94a3b8",
        "tab-hover-text": "#ffffff",
        "tab-hover-border": "#fcd34d",
        "tab-hover-bg": "rgba(255, 255, 255, 0.1)",
        "tab-active-text": "#fcd34d",
        "tab-active-border": "#fcd34d",
        "tab-active-bg": "rgba(252, 211, 77, 0.15)",
        "tab-active-hover-text": "#ffffff",
        "tab-active-hover-border": "#ffffff",
        "tab-active-hover-bg": "rgba(252, 211, 77, 0.25)",
        "pin-btn-border": "#d97706",
        "pin-btn-hover-bg": "rgba(217, 119, 6, 0.2)",
        "pin-btn-icon-color": "#fcd34d",
        "hint-bg": "#0B0C10",
        "hint-border": "#d97706",
        "hint-text": "#fcd34d",
        "bg-primary": "#050608",
        "bg-secondary": "#0c0d12",
        "text-primary": "#ffffff",
        "text-secondary": "#e2e8f0",
        "accent-primary": "#f59e0b",
        "accent-secondary": "rgba(245, 158, 11, 0.4)",
        "border-primary": "#78350f",
        "border-secondary": "rgba(245, 158, 11, 0.15)",
        "button-bg": "rgba(245, 158, 11, 0.15)",
        "button-text": "#fbbf24"
    }
    ];

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
