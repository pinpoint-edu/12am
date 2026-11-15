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
    const CUSTOM_THEMES_KEY = "12am-custom-themes";
    const lightThemeNames = ["Light", "Birthday", "Cloud", "Cream", "Mint"];

    // Embedded 28 Curated Themes with "Original" as default
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
        "button-bg": "#14100c",
        "button-text": "#ffd700",
        "border-primary": "rgba(255, 140, 0, 0.26)",
        "border-secondary": "rgba(255, 255, 255, 0.07)",
        "avatar-gradient": "linear-gradient(135deg, #ffd700 0%, #ff8800 50%, #ea580c 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "AMOLED",
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
        "button-bg": "#0a0a0a",
        "button-text": "#ffffff",
        "border-primary": "#181818",
        "border-secondary": "#111111",
        "avatar-gradient": "linear-gradient(135deg, #2a2a2a 0%, #000000 100%)",
        "logo-src": "/images/logo.png",
        "media-dim": 0.8
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
        "button-bg": "rgba(15, 23, 42, 0.08)",
        "button-text": "#4f46e5",
        "border-primary": "#e2e8f0",
        "border-secondary": "rgba(0, 0, 0, 0.04)",
        "avatar-gradient": "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
        "logo-src": "/images/logo-dark.png"
    },
    {
        "name": "Birthday",
        "description": "Festive pastel blue and pink light theme with colorful sprinkles in the background.",
        "bg-primary": "#f2f8ff",
        "bg-secondary": "#ffffff",
        "text-primary": "#1e1b4b",
        "text-secondary": "#64748b",
        "accent-primary": "#ec4899",
        "accent-secondary": "rgba(236, 72, 153, 0.22)",
        "accent-glow": "rgba(56, 189, 248, 0.22)",
        "navbar-bg": "rgba(255, 255, 255, 0.92)",
        "navbar-border": "rgba(236, 72, 153, 0.2)",
        "navbar-text": "#1e1b4b",
        "tab-active-bg": "rgba(236, 72, 153, 0.12)",
        "tab-active-text": "#db2777",
        "tab-active-border": "#ec4899",
        "tab-hover-bg": "rgba(56, 189, 248, 0.1)",
        "tab-hover-text": "#0284c7",
        "button-bg": "rgba(236, 72, 153, 0.1)",
        "button-text": "#db2777",
        "border-primary": "#fbcfe8",
        "border-secondary": "rgba(56, 189, 248, 0.15)",
        "avatar-gradient": "linear-gradient(135deg, #93c5fd 0%, #f9a8d4 55%, #f472b6 100%)",
        "logo-src": "/images/logo-dark.png"
    },
    {
        "name": "Cloud",
        "description": "Airy daylight sky-white palette with soft horizon blue accents.",
        "bg-primary": "#f0f9ff",
        "bg-secondary": "#ffffff",
        "text-primary": "#0c4a6e",
        "text-secondary": "#0369a1",
        "accent-primary": "#0284c7",
        "accent-secondary": "rgba(2, 132, 199, 0.2)",
        "accent-glow": "rgba(56, 189, 248, 0.2)",
        "navbar-bg": "rgba(255, 255, 255, 0.92)",
        "navbar-border": "rgba(2, 132, 199, 0.14)",
        "navbar-text": "#0c4a6e",
        "tab-active-bg": "rgba(2, 132, 199, 0.12)",
        "tab-active-text": "#0284c7",
        "tab-active-border": "#0284c7",
        "tab-hover-bg": "rgba(2, 132, 199, 0.06)",
        "tab-hover-text": "#0369a1",
        "button-bg": "rgba(2, 132, 199, 0.1)",
        "button-text": "#0284c7",
        "border-primary": "#bae6fd",
        "border-secondary": "rgba(12, 74, 110, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
        "logo-src": "/images/logo-dark.png"
    },
    {
        "name": "Cream",
        "description": "Warm vanilla parchment light theme with roasted caramel and amber ink.",
        "bg-primary": "#fefce8",
        "bg-secondary": "#ffffff",
        "text-primary": "#451a03",
        "text-secondary": "#78350f",
        "accent-primary": "#d97706",
        "accent-secondary": "rgba(217, 119, 6, 0.2)",
        "accent-glow": "rgba(245, 158, 11, 0.2)",
        "navbar-bg": "rgba(255, 253, 244, 0.92)",
        "navbar-border": "rgba(217, 119, 6, 0.16)",
        "navbar-text": "#451a03",
        "tab-active-bg": "rgba(217, 119, 6, 0.12)",
        "tab-active-text": "#b45309",
        "tab-active-border": "#d97706",
        "tab-hover-bg": "rgba(217, 119, 6, 0.06)",
        "tab-hover-text": "#92400e",
        "button-bg": "rgba(217, 119, 6, 0.1)",
        "button-text": "#b45309",
        "border-primary": "#fde68a",
        "border-secondary": "rgba(69, 26, 3, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #fbbf24 0%, #b45309 100%)",
        "logo-src": "/images/logo-dark.png"
    },
    {
        "name": "Mint",
        "description": "Crisp botanical spearmint frost light theme with deep emerald-teal ink.",
        "bg-primary": "#f0fdfa",
        "bg-secondary": "#ffffff",
        "text-primary": "#0f3f3c",
        "text-secondary": "#115e59",
        "accent-primary": "#0d9488",
        "accent-secondary": "rgba(13, 148, 136, 0.2)",
        "accent-glow": "rgba(20, 184, 166, 0.2)",
        "navbar-bg": "rgba(255, 255, 255, 0.92)",
        "navbar-border": "rgba(13, 148, 136, 0.15)",
        "navbar-text": "#0f3f3c",
        "tab-active-bg": "rgba(13, 148, 136, 0.12)",
        "tab-active-text": "#0f766e",
        "tab-active-border": "#0d9488",
        "tab-hover-bg": "rgba(13, 148, 136, 0.06)",
        "tab-hover-text": "#115e59",
        "button-bg": "rgba(13, 148, 136, 0.1)",
        "button-text": "#0f766e",
        "border-primary": "#99f6e4",
        "border-secondary": "rgba(15, 63, 60, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)",
        "logo-src": "/images/logo-dark.png"
    },
    {
        "name": "Valentine's Day",
        "description": "Vibrant velvet raspberry-rose, hot candy pink, and romantic magenta glow.",
        "bg-primary": "#240714",
        "bg-secondary": "#360c20",
        "text-primary": "#fff1f2",
        "text-secondary": "#ff9ebb",
        "accent-primary": "#ff3b7f",
        "accent-secondary": "rgba(255, 59, 127, 0.55)",
        "accent-glow": "rgba(255, 77, 148, 0.48)",
        "navbar-bg": "rgba(46, 10, 27, 0.9)",
        "navbar-border": "rgba(255, 59, 127, 0.4)",
        "navbar-text": "#fff1f2",
        "tab-active-bg": "rgba(255, 59, 127, 0.25)",
        "tab-active-text": "#fbcfe8",
        "tab-active-border": "#ff3b7f",
        "tab-hover-bg": "rgba(255, 59, 127, 0.14)",
        "tab-hover-text": "#fecdd3",
        "button-bg": "#3d0e24",
        "button-text": "#ff85b3",
        "border-primary": "#6b183d",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #ff3b7f 0%, #f472b6 50%, #fb7185 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "St. Patrick's Day",
        "description": "Vibrant emerald shamrock green, bright kelly clover, and lucky pot-of-gold.",
        "bg-primary": "#062412",
        "bg-secondary": "#0c381d",
        "text-primary": "#ecfdf5",
        "text-secondary": "#fde047",
        "accent-primary": "#22c55e",
        "accent-secondary": "rgba(34, 197, 94, 0.52)",
        "accent-glow": "rgba(250, 204, 21, 0.38)",
        "navbar-bg": "rgba(10, 44, 23, 0.9)",
        "navbar-border": "rgba(34, 197, 94, 0.42)",
        "navbar-text": "#ecfdf5",
        "tab-active-bg": "rgba(34, 197, 94, 0.26)",
        "tab-active-text": "#fde047",
        "tab-active-border": "#4ade80",
        "tab-hover-bg": "rgba(34, 197, 94, 0.14)",
        "tab-hover-text": "#86efac",
        "button-bg": "#0f4222",
        "button-text": "#facc15",
        "border-primary": "#1a5c32",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #4ade80 0%, #16a34a 55%, #facc15 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Easter",
        "description": "Colorful springtime twilight violet with pastel orchid, sky cyan, and buttercup gold.",
        "bg-primary": "#1c1438",
        "bg-secondary": "#2a1e52",
        "text-primary": "#faf5ff",
        "text-secondary": "#7dd3fc",
        "accent-primary": "#e879f9",
        "accent-secondary": "rgba(232, 121, 249, 0.48)",
        "accent-glow": "rgba(125, 211, 252, 0.44)",
        "navbar-bg": "rgba(34, 24, 68, 0.9)",
        "navbar-border": "rgba(232, 121, 249, 0.4)",
        "navbar-text": "#faf5ff",
        "tab-active-bg": "rgba(232, 121, 249, 0.24)",
        "tab-active-text": "#fde047",
        "tab-active-border": "#e879f9",
        "tab-hover-bg": "rgba(125, 211, 252, 0.16)",
        "tab-hover-text": "#bae6fd",
        "button-bg": "#312361",
        "button-text": "#fde047",
        "border-primary": "#4c3585",
        "border-secondary": "rgba(255, 255, 255, 0.09)",
        "avatar-gradient": "linear-gradient(135deg, #f472b6 0%, #7dd3fc 50%, #fde047 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "4th of July",
        "description": "Bold, colorful Independence Day royal navy, blazing liberty red, and electric starlight blue.",
        "bg-primary": "#09183d",
        "bg-secondary": "#11285e",
        "text-primary": "#ffffff",
        "text-secondary": "#7dd3fc",
        "accent-primary": "#ff334b",
        "accent-secondary": "rgba(255, 51, 75, 0.55)",
        "accent-glow": "rgba(59, 130, 246, 0.52)",
        "navbar-bg": "rgba(14, 34, 82, 0.92)",
        "navbar-border": "rgba(255, 51, 75, 0.45)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(255, 51, 75, 0.28)",
        "tab-active-text": "#ffffff",
        "tab-active-border": "#ff334b",
        "tab-hover-bg": "rgba(59, 130, 246, 0.25)",
        "tab-hover-text": "#bfdbfe",
        "button-bg": "#153275",
        "button-text": "#ff6b7d",
        "border-primary": "#2750a8",
        "border-secondary": "rgba(255, 255, 255, 0.1)",
        "avatar-gradient": "linear-gradient(135deg, #ff334b 0%, #ffffff 50%, #2563eb 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Halloween",
        "description": "Electric haunted violet with glowing neon jack-o'-lantern orange and toxic green.",
        "bg-primary": "#180926",
        "bg-secondary": "#26103b",
        "text-primary": "#fff7ed",
        "text-secondary": "#d8b4fe",
        "accent-primary": "#ff7a1a",
        "accent-secondary": "rgba(255, 122, 26, 0.55)",
        "accent-glow": "rgba(168, 85, 247, 0.48)",
        "navbar-bg": "rgba(31, 13, 48, 0.9)",
        "navbar-border": "rgba(255, 122, 26, 0.45)",
        "navbar-text": "#fff7ed",
        "tab-active-bg": "rgba(255, 122, 26, 0.26)",
        "tab-active-text": "#fed7aa",
        "tab-active-border": "#ff7a1a",
        "tab-hover-bg": "rgba(168, 85, 247, 0.18)",
        "tab-hover-text": "#e9d5ff",
        "button-bg": "#2e1447",
        "button-text": "#ff9248",
        "border-primary": "#52237a",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #ff7a1a 0%, #a855f7 55%, #22c55e 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Thanksgiving",
        "description": "Rich harvest spiced auburn, glowing amber pumpkin, cranberry red, and golden wheat.",
        "bg-primary": "#241006",
        "bg-secondary": "#36190b",
        "text-primary": "#fef3c7",
        "text-secondary": "#fcd34d",
        "accent-primary": "#f59e0b",
        "accent-secondary": "rgba(245, 158, 11, 0.54)",
        "accent-glow": "rgba(220, 38, 38, 0.42)",
        "navbar-bg": "rgba(43, 20, 9, 0.9)",
        "navbar-border": "rgba(245, 158, 11, 0.42)",
        "navbar-text": "#fef3c7",
        "tab-active-bg": "rgba(245, 158, 11, 0.25)",
        "tab-active-text": "#fde68a",
        "tab-active-border": "#f59e0b",
        "tab-hover-bg": "rgba(220, 38, 38, 0.18)",
        "tab-hover-text": "#fed7aa",
        "button-bg": "#3d1c0c",
        "button-text": "#fbbf24",
        "border-primary": "#632f15",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #f59e0b 0%, #dc2626 55%, #facc15 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Christmas",
        "description": "Vibrant evergreen pine with bright holly berry red, ornament gold, and live falling snow.",
        "bg-primary": "#082414",
        "bg-secondary": "#113821",
        "text-primary": "#ffffff",
        "text-secondary": "#fde047",
        "accent-primary": "#ff334b",
        "accent-secondary": "rgba(255, 51, 75, 0.52)",
        "accent-glow": "rgba(250, 204, 21, 0.42)",
        "navbar-bg": "rgba(13, 44, 26, 0.9)",
        "navbar-border": "rgba(255, 51, 75, 0.42)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(255, 51, 75, 0.26)",
        "tab-active-text": "#ffd700",
        "tab-active-border": "#ff334b",
        "tab-hover-bg": "rgba(250, 204, 21, 0.12)",
        "tab-hover-text": "#fecaca",
        "button-bg": "#154227",
        "button-text": "#ffd700",
        "border-primary": "#1d5e37",
        "border-secondary": "rgba(255, 255, 255, 0.1)",
        "avatar-gradient": "linear-gradient(135deg, #ff334b 0%, #16a34a 55%, #facc15 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "New Year's",
        "description": "Celebratory midnight indigo with dazzling champagne gold and live animated fireworks.",
        "bg-primary": "#0c0b1d",
        "bg-secondary": "#161433",
        "text-primary": "#ffffff",
        "text-secondary": "#fef08a",
        "accent-primary": "#facc15",
        "accent-secondary": "rgba(250, 204, 21, 0.52)",
        "accent-glow": "rgba(236, 72, 153, 0.42)",
        "navbar-bg": "rgba(18, 16, 42, 0.9)",
        "navbar-border": "rgba(250, 204, 21, 0.4)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(250, 204, 21, 0.24)",
        "tab-active-text": "#fef08a",
        "tab-active-border": "#facc15",
        "tab-hover-bg": "rgba(236, 72, 153, 0.16)",
        "tab-hover-text": "#fde047",
        "button-bg": "#1d1a42",
        "button-text": "#facc15",
        "border-primary": "#332f6b",
        "border-secondary": "rgba(255, 255, 255, 0.09)",
        "avatar-gradient": "linear-gradient(135deg, #fef08a 0%, #facc15 45%, #ec4899 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Camo",
        "description": "Tactical woodland camo pattern background with olive drab, moss green, and khaki tan.",
        "bg-primary": "#0b0e08",
        "bg-secondary": "#14190e",
        "text-primary": "#ecfccb",
        "text-secondary": "#d6c598",
        "accent-primary": "#65a30d",
        "accent-secondary": "rgba(101, 163, 13, 0.42)",
        "accent-glow": "rgba(161, 136, 95, 0.3)",
        "navbar-bg": "rgba(18, 22, 13, 0.9)",
        "navbar-border": "rgba(101, 163, 13, 0.28)",
        "navbar-text": "#ecfccb",
        "tab-active-bg": "rgba(101, 163, 13, 0.2)",
        "tab-active-text": "#d9f99d",
        "tab-active-border": "#84cc16",
        "tab-hover-bg": "rgba(214, 197, 152, 0.1)",
        "tab-hover-text": "#e7d8b1",
        "button-bg": "#181e11",
        "button-text": "#a3e635",
        "border-primary": "#2c361e",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #65a30d 0%, #a1885f 55%, #4d5d33 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Cyberpunk",
        "description": "High-voltage electric neon yellow and laser cyan on night-city carbon.",
        "bg-primary": "#08080a",
        "bg-secondary": "#101015",
        "text-primary": "#ffffff",
        "text-secondary": "#fef08a",
        "accent-primary": "#fcee0a",
        "accent-secondary": "rgba(252, 238, 10, 0.4)",
        "accent-glow": "rgba(252, 238, 10, 0.3)",
        "navbar-bg": "rgba(14, 14, 18, 0.9)",
        "navbar-border": "rgba(252, 238, 10, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(252, 238, 10, 0.16)",
        "tab-active-text": "#fcee0a",
        "tab-active-border": "#fcee0a",
        "tab-hover-bg": "rgba(252, 238, 10, 0.08)",
        "tab-hover-text": "#fef08a",
        "button-bg": "#14140c",
        "button-text": "#fcee0a",
        "border-primary": "#222228",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #fcee0a 0%, #00f0ff 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Matrix",
        "description": "Radiant terminal phosphor green on deep carbon code void shadows.",
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
        "button-bg": "#08140c",
        "button-text": "#10b981",
        "border-primary": "#132d20",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Dracula",
        "description": "Gothic midnight vampire purple with hot pink and neon orchid accents.",
        "bg-primary": "#0d0c14",
        "bg-secondary": "#161522",
        "text-primary": "#f8f8f2",
        "text-secondary": "#ff79c6",
        "accent-primary": "#ff79c6",
        "accent-secondary": "rgba(255, 121, 198, 0.4)",
        "accent-glow": "rgba(255, 121, 198, 0.3)",
        "navbar-bg": "rgba(18, 16, 28, 0.9)",
        "navbar-border": "rgba(255, 121, 198, 0.25)",
        "navbar-text": "#f8f8f2",
        "tab-active-bg": "rgba(255, 121, 198, 0.18)",
        "tab-active-text": "#ff79c6",
        "tab-active-border": "#ff79c6",
        "tab-hover-bg": "rgba(255, 121, 198, 0.08)",
        "tab-hover-text": "#ff92d0",
        "button-bg": "#181020",
        "button-text": "#ff79c6",
        "border-primary": "#2b203c",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #ff79c6 0%, #bd93f9 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Winter",
        "description": "Crisp snowfall and frost blue duotone with live falling snow particles.",
        "bg-primary": "#070c16",
        "bg-secondary": "#0c1527",
        "text-primary": "#f1f5f9",
        "text-secondary": "#93c5fd",
        "accent-primary": "#60a5fa",
        "accent-secondary": "rgba(96, 165, 250, 0.4)",
        "accent-glow": "rgba(147, 197, 253, 0.45)",
        "navbar-bg": "rgba(8, 14, 28, 0.86)",
        "navbar-border": "rgba(96, 165, 250, 0.35)",
        "navbar-text": "#f1f5f9",
        "tab-active-bg": "rgba(96, 165, 250, 0.22)",
        "tab-active-text": "#dbeafe",
        "tab-active-border": "#60a5fa",
        "tab-hover-bg": "rgba(96, 165, 250, 0.12)",
        "tab-hover-text": "#ffffff",
        "button-bg": "#0d1a33",
        "button-text": "#dbeafe",
        "border-primary": "rgba(96, 165, 250, 0.3)",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #dbeafe 0%, #60a5fa 50%, #2563eb 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Vaporwave",
        "description": "Dreamy 90s aesthetic blending retro aqua and hot fuchsia on deep indigo.",
        "bg-primary": "#0a0a14",
        "bg-secondary": "#121222",
        "text-primary": "#ffffff",
        "text-secondary": "#00f5d4",
        "accent-primary": "#00f5d4",
        "accent-secondary": "rgba(0, 245, 212, 0.4)",
        "accent-glow": "rgba(0, 245, 212, 0.3)",
        "navbar-bg": "rgba(14, 14, 28, 0.9)",
        "navbar-border": "rgba(0, 245, 212, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(0, 245, 212, 0.16)",
        "tab-active-text": "#00f5d4",
        "tab-active-border": "#00f5d4",
        "tab-hover-bg": "rgba(0, 245, 212, 0.08)",
        "tab-hover-text": "#5cffe7",
        "button-bg": "#0c1622",
        "button-text": "#00f5d4",
        "border-primary": "#1b283d",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #00f5d4 0%, #f72585 100%)",
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
        "button-bg": "#17080a",
        "button-text": "#ef4444",
        "border-primary": "#2b1216",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Sakura",
        "description": "Midnight Kyoto draped in delicate sakura cherry blossom petal pink.",
        "bg-primary": "#10080e",
        "bg-secondary": "#1c0e18",
        "text-primary": "#fff1f2",
        "text-secondary": "#fbcfe8",
        "accent-primary": "#f472b6",
        "accent-secondary": "rgba(244, 114, 182, 0.4)",
        "accent-glow": "rgba(244, 114, 182, 0.3)",
        "navbar-bg": "rgba(22, 11, 19, 0.9)",
        "navbar-border": "rgba(244, 114, 182, 0.25)",
        "navbar-text": "#fff1f2",
        "tab-active-bg": "rgba(244, 114, 182, 0.18)",
        "tab-active-text": "#fce7f3",
        "tab-active-border": "#f472b6",
        "tab-hover-bg": "rgba(244, 114, 182, 0.08)",
        "tab-hover-text": "#fbcfe8",
        "button-bg": "#1e0d18",
        "button-text": "#f472b6",
        "border-primary": "#38182d",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Galaxy",
        "description": "Deep space nebula violet with small glistening stars across the cosmos.",
        "bg-primary": "#090616",
        "bg-secondary": "#120d28",
        "text-primary": "#ffffff",
        "text-secondary": "#d8b4fe",
        "accent-primary": "#a855f7",
        "accent-secondary": "rgba(168, 85, 247, 0.4)",
        "accent-glow": "rgba(192, 132, 252, 0.32)",
        "navbar-bg": "rgba(15, 10, 34, 0.9)",
        "navbar-border": "rgba(168, 85, 247, 0.28)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(168, 85, 247, 0.18)",
        "tab-active-text": "#e9d5ff",
        "tab-active-border": "#a855f7",
        "tab-hover-bg": "rgba(168, 85, 247, 0.1)",
        "tab-hover-text": "#f3e8ff",
        "button-bg": "#150e30",
        "button-text": "#c084fc",
        "border-primary": "#271c4d",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #c084fc 0%, #6366f1 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Synthwave",
        "description": "Retro 80s outrun laser magenta and twilight violet grid.",
        "bg-primary": "#100618",
        "bg-secondary": "#1a0b26",
        "text-primary": "#ffffff",
        "text-secondary": "#f472b6",
        "accent-primary": "#ec4899",
        "accent-secondary": "rgba(236, 72, 153, 0.4)",
        "accent-glow": "rgba(236, 72, 153, 0.3)",
        "navbar-bg": "rgba(22, 10, 32, 0.9)",
        "navbar-border": "rgba(236, 72, 153, 0.25)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(236, 72, 153, 0.18)",
        "tab-active-text": "#fbcfe8",
        "tab-active-border": "#ec4899",
        "tab-hover-bg": "rgba(236, 72, 153, 0.08)",
        "tab-hover-text": "#fdf2f8",
        "button-bg": "#1a0a22",
        "button-text": "#ec4899",
        "border-primary": "#33154b",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Matcha",
        "description": "Zen bamboo charcoal paired with ceremonial matcha green harmony.",
        "bg-primary": "#0a0c08",
        "bg-secondary": "#131710",
        "text-primary": "#f7fee7",
        "text-secondary": "#bef264",
        "accent-primary": "#84cc16",
        "accent-secondary": "rgba(132, 204, 22, 0.4)",
        "accent-glow": "rgba(132, 204, 22, 0.3)",
        "navbar-bg": "rgba(14, 18, 12, 0.9)",
        "navbar-border": "rgba(132, 204, 22, 0.25)",
        "navbar-text": "#f7fee7",
        "tab-active-bg": "rgba(132, 204, 22, 0.18)",
        "tab-active-text": "#bef264",
        "tab-active-border": "#84cc16",
        "tab-hover-bg": "rgba(132, 204, 22, 0.08)",
        "tab-hover-text": "#d9f99d",
        "button-bg": "#121a0c",
        "button-text": "#84cc16",
        "border-primary": "#243217",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Ocean",
        "description": "Abyssal trench navy with slow-moving underwater waves and electric cyan.",
        "bg-primary": "#030814",
        "bg-secondary": "#071124",
        "text-primary": "#ecfeff",
        "text-secondary": "#67e8f9",
        "accent-primary": "#06b6d4",
        "accent-secondary": "rgba(6, 182, 212, 0.4)",
        "accent-glow": "rgba(6, 182, 212, 0.3)",
        "navbar-bg": "rgba(6, 15, 30, 0.9)",
        "navbar-border": "rgba(6, 182, 212, 0.25)",
        "navbar-text": "#ecfeff",
        "tab-active-bg": "rgba(6, 182, 212, 0.18)",
        "tab-active-text": "#67e8f9",
        "tab-active-border": "#06b6d4",
        "tab-hover-bg": "rgba(6, 182, 212, 0.1)",
        "tab-hover-text": "#a5f3fc",
        "button-bg": "#071322",
        "button-text": "#06b6d4",
        "border-primary": "#112842",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #06b6d4 0%, #1d4ed8 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Gold Rush",
        "description": "Deep obsidian void illuminated by pure forged bullion gold.",
        "bg-primary": "#080703",
        "bg-secondary": "#131006",
        "text-primary": "#fef9c3",
        "text-secondary": "#fde047",
        "accent-primary": "#eab308",
        "accent-secondary": "rgba(234, 179, 8, 0.4)",
        "accent-glow": "rgba(234, 179, 8, 0.3)",
        "navbar-bg": "rgba(18, 15, 6, 0.9)",
        "navbar-border": "rgba(234, 179, 8, 0.25)",
        "navbar-text": "#fef9c3",
        "tab-active-bg": "rgba(234, 179, 8, 0.18)",
        "tab-active-text": "#facc15",
        "tab-active-border": "#eab308",
        "tab-hover-bg": "rgba(234, 179, 8, 0.08)",
        "tab-hover-text": "#fef08a",
        "button-bg": "#181406",
        "button-text": "#eab308",
        "border-primary": "#2d240d",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #facc15 0%, #b45309 100%)",
        "logo-src": "/images/logo.png"
    }
];

    function hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string') return "rgba(245, 158, 11, " + alpha + ")";
        if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
        let clean = hex.replace('#', '');
        if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
        const num = parseInt(clean, 16);
        if (isNaN(num)) return "rgba(245, 158, 11, " + alpha + ")";
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }

    function adjustHex(hex, percent) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#000000';
        let clean = hex.replace('#', '');
        if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
        let num = parseInt(clean, 16);
        if (isNaN(num)) return hex;
        let r = Math.min(255, Math.max(0, ((num >> 16) & 255) + Math.round(255 * (percent / 100))));
        let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + Math.round(255 * (percent / 100))));
        let b = Math.min(255, Math.max(0, (num & 255) + Math.round(255 * (percent / 100))));
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Helper: calculate luminance of a hex or rgb color to determine if light or dark
    function getLuminance(color) {
        if (!color || typeof color !== 'string') return 0;
        let r = 0, g = 0, b = 0;
        if (color.startsWith('#')) {
            let clean = color.replace('#', '');
            if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
            const num = parseInt(clean, 16);
            if (!isNaN(num)) {
                r = (num >> 16) & 255;
                g = (num >> 8) & 255;
                b = num & 255;
            }
        } else if (color.startsWith('rgb')) {
            const parts = color.match(/\d+/g);
            if (parts && parts.length >= 3) {
                r = parseInt(parts[0], 10);
                g = parseInt(parts[1], 10);
                b = parseInt(parts[2], 10);
            }
        }
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    function loadCustomThemes() {
        try {
            const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) return list;
            }
        } catch (e) {}
        return [];
    }

    const DEFAULT_THEME = EMBEDDED_THEMES[0];
    let allThemes = [...EMBEDDED_THEMES, ...loadCustomThemes()];
    let currentTheme = DEFAULT_THEME;

    function mergeThemes(fetchedList) {
        const base = (Array.isArray(fetchedList) && fetchedList.length > 0) ? fetchedList : EMBEDDED_THEMES;
        const customs = loadCustomThemes();
        allThemes = [...base, ...customs];
        window.__12am_themes = allThemes;
    }

    async function fetchThemes() {
        let fetched = null;
        try {
            if (window.location.protocol.startsWith("http")) {
                const res = await fetch("themes.json");
                if (res.ok) {
                    const list = await res.json();
                    if (Array.isArray(list) && list.length > 0) {
                        fetched = list;
                    }
                }
            }
        } catch (e) {}
        mergeThemes(fetched);

        const saved = getSavedThemeName();
        if (saved && saved.toLowerCase() === 'song cover') {
            activateSongCoverTheme(false);
        } else {
            const matched = allThemes.find(t => t.name.toLowerCase() === saved.toLowerCase());
            if (matched) {
                applyTheme(matched, false);
            } else {
                applyTheme(DEFAULT_THEME, false);
            }
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

    // Theme Background Effects Engine (Snow, Woodland Camo SVG Filter, Ocean Waves, Galaxy Stars, Birthday Sprinkles, New Year's Fireworks)
    const __snowState = { raf: null, canvas: null, pattern: null, fireworksEl: null, fireworks: null, resizeFn: null, activeTheme: '' };
    const FIREWORKS_CDN_URL = 'https://cdn.jsdelivr.net/npm/fireworks-js@2.10.8/dist/index.umd.min.js';
    const SPRINKLES_BG_SVG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><g stroke-linecap="round" stroke-width="5.5"><line x1="20" y1="24" x2="34" y2="16" stroke="#f472b6"/><line x1="78" y1="18" x2="90" y2="28" stroke="#60a5fa"/><line x1="140" y1="26" x2="154" y2="18" stroke="#fbbf24"/><line x1="48" y1="68" x2="60" y2="56" stroke="#34d399"/><line x1="112" y1="64" x2="128" y2="70" stroke="#c084fc"/><line x1="162" y1="78" x2="170" y2="92" stroke="#f472b6"/><line x1="18" y1="114" x2="32" y2="122" stroke="#60a5fa"/><line x1="74" y1="108" x2="86" y2="96" stroke="#fbbf24"/><line x1="126" y1="118" x2="138" y2="108" stroke="#f472b6"/><line x1="42" y1="154" x2="58" y2="158" stroke="#c084fc"/><line x1="100" y1="152" x2="112" y2="164" stroke="#34d399"/><line x1="152" y1="146" x2="164" y2="136" stroke="#60a5fa"/></g></svg>');

    function startFireworksInContainer(container) {
        const FW = (typeof window.Fireworks === 'function')
            ? window.Fireworks
            : (window.Fireworks && (window.Fireworks.Fireworks || window.Fireworks.default));
        if (typeof FW !== 'function' || !container) return false;
        try {
            const fw = new FW(container, {
                autoresize: true,
                opacity: 0.45,
                acceleration: 1.03,
                friction: 0.97,
                gravity: 1.4,
                particles: 45,
                traceLength: 3,
                traceSpeed: 8,
                explosion: 5,
                intensity: 6,
                flickering: 45,
                hue: { min: 0, max: 360 },
                delay: { min: 70, max: 130 },
                brightness: { min: 55, max: 85 },
                decay: { min: 0.015, max: 0.03 }
            });
            fw.start();
            __snowState.fireworks = fw;
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearThemeEffects() {
        if (__snowState.raf) {
            cancelAnimationFrame(__snowState.raf);
            __snowState.raf = null;
        }
        if (__snowState.resizeFn && typeof window !== 'undefined') {
            window.removeEventListener('resize', __snowState.resizeFn);
            __snowState.resizeFn = null;
        }
        if (__snowState.fireworks) {
            try { __snowState.fireworks.stop(true); } catch (e) {}
            __snowState.fireworks = null;
        }
        if (__snowState.fireworksEl) {
            __snowState.fireworksEl.remove();
            __snowState.fireworksEl = null;
        }
        if (__snowState.canvas) {
            __snowState.canvas.remove();
            __snowState.canvas = null;
        }
        if (__snowState.pattern) {
            __snowState.pattern.remove();
            __snowState.pattern = null;
        }
        __snowState.activeTheme = '';
    }

    function updateWinterSnow(themeName) {
        const tn = (themeName || '').toLowerCase();
        const fxType = (tn === 'winter' || tn === 'christmas') ? 'snow'
            : (tn === 'camo') ? 'camo'
            : (tn === 'ocean') ? 'ocean'
            : (tn === 'galaxy') ? 'galaxy'
            : (tn === 'birthday') ? 'birthday'
            : (tn === "new year's" || tn === 'new year') ? 'fireworks'
            : (tn === "valentine's day" || tn === 'valentines day' || tn === 'valentine') ? 'hearts'
            : '';

        if (!fxType) {
            clearThemeEffects();
            return;
        }
        if (isSongCoverThemeMode && lastAppliedCoverTintKey !== '') {
            return;
        }
        if (__snowState.activeTheme === fxType && (__snowState.canvas || __snowState.pattern || __snowState.fireworksEl)) return;
        clearThemeEffects();
        if (typeof document === 'undefined' || !document.body) return;
        __snowState.activeTheme = fxType;

        if (fxType === 'fireworks') {
            const fwWrap = document.createElement('div');
            fwWrap.id = 'fireworksContainer';
            fwWrap.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-1;opacity:0;transition:opacity 0.65s ease;';
            document.body.prepend(fwWrap);
            __snowState.fireworksEl = fwWrap;
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => { fwWrap.style.opacity = '0.78'; });
            } else {
                fwWrap.style.opacity = '0.78';
            }
            if (!startFireworksInContainer(fwWrap)) {
                let script = document.querySelector(`script[src="${FIREWORKS_CDN_URL}"]`);
                if (!script && document.head) {
                    script = document.createElement('script');
                    script.src = FIREWORKS_CDN_URL;
                    script.async = true;
                    script.onload = () => {
                        if (__snowState.activeTheme === 'fireworks' && __snowState.fireworksEl) {
                            startFireworksInContainer(__snowState.fireworksEl);
                        }
                    };
                    document.head.appendChild(script);
                } else if (script) {
                    script.addEventListener('load', () => {
                        if (__snowState.activeTheme === 'fireworks' && __snowState.fireworksEl) {
                            startFireworksInContainer(__snowState.fireworksEl);
                        }
                    }, { once: true });
                }
            }
            return;
        }

        if (fxType === 'camo' || fxType === 'birthday') {
            const pat = document.createElement('div');
            pat.id = 'themeBgPattern';
            if (fxType === 'camo') {
                pat.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-1;opacity:0.34;';
                pat.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" style="display:block;width:100%;height:100%;"><filter id="12am-woodland-camo" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.0085" numOctaves="2" seed="11" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="2.6 0 0 0 -0.8 2.6 0 0 0 -0.8 2.6 0 0 0 -0.8 0 0 0 0 1" result="stretched"/><feComponentTransfer in="stretched" result="camo"><feFuncR type="discrete" tableValues="0.08 0.14 0.30 0.40 0.22 0.58"/><feFuncG type="discrete" tableValues="0.22 0.36 0.50 0.64 0.56 0.68"/><feFuncB type="discrete" tableValues="0.14 0.20 0.08 0.06 0.38 0.28"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#12am-woodland-camo)"/></svg>';
            } else {
                pat.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-1;opacity:0.5;background-color:transparent;background-image:url("${SPRINKLES_BG_SVG}"),linear-gradient(135deg,rgba(147,197,253,0.34) 0%,rgba(249,168,212,0.32) 100%);background-size:180px 180px,100% 100%;background-repeat:repeat,no-repeat;`;
            }
            document.body.prepend(pat);
            __snowState.pattern = pat;
            return;
        }

        const cv = document.createElement('canvas');
        cv.id = fxType === 'snow' ? 'snowCanvas' : 'themeBgCanvas';
        const cvOpacity = fxType === 'snow' ? '0.55' : (fxType === 'hearts' ? '0.26' : '0.85');
        cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-1;opacity:0;transition:opacity 0.65s ease;';
        document.body.prepend(cv);
        __snowState.canvas = cv;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => { cv.style.opacity = cvOpacity; });
        } else {
            cv.style.opacity = cvOpacity;
        }

        const ctx = cv.getContext('2d');
        const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
        resize();
        __snowState.resizeFn = resize;
        window.addEventListener('resize', resize);

        if (fxType === 'snow') {
            const count = Math.min(130, Math.floor(window.innerWidth / 9));
            const flakes = Array.from({ length: count }, () => ({
                x: Math.random() * cv.width,
                y: Math.random() * cv.height,
                r: Math.random() * 2.2 + 0.8,
                v: Math.random() * 0.8 + 0.35,
                d: Math.random() * Math.PI * 2,
                o: Math.random() * 0.30 + 0.18
            }));
            const frame = () => {
                ctx.clearRect(0, 0, cv.width, cv.height);
                for (const f of flakes) {
                    f.d += 0.012;
                    f.y += f.v;
                    f.x += Math.sin(f.d) * 0.5;
                    if (f.y > cv.height + 5) { f.y = -5; f.x = Math.random() * cv.width; }
                    if (f.x > cv.width + 5) f.x = -5;
                    if (f.x < -5) f.x = cv.width + 5;
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(224, 242, 254, ${f.o})`;
                    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                __snowState.raf = requestAnimationFrame(frame);
            };
            frame();
        } else if (fxType === 'ocean') {
            let t = 0;
            const waves = [
                { yRatio: 0.72, amp: 18, freq: 0.0038, speed: 0.7, color: 'rgba(6, 182, 212, 0.11)' },
                { yRatio: 0.80, amp: 22, freq: 0.0030, speed: -0.5, color: 'rgba(14, 165, 233, 0.13)' },
                { yRatio: 0.88, amp: 14, freq: 0.0048, speed: 0.9, color: 'rgba(56, 189, 248, 0.10)' }
            ];
            const frame = () => {
                t += 0.012;
                ctx.clearRect(0, 0, cv.width, cv.height);
                for (const w of waves) {
                    ctx.beginPath();
                    const baseY = cv.height * w.yRatio;
                    ctx.moveTo(0, cv.height);
                    for (let x = 0; x <= cv.width; x += 24) {
                        const y = baseY + Math.sin(x * w.freq + t * w.speed) * w.amp + Math.cos(x * w.freq * 0.6 - t * 0.4) * (w.amp * 0.4);
                        ctx.lineTo(x, y);
                    }
                    ctx.lineTo(cv.width, cv.height);
                    ctx.closePath();
                    ctx.fillStyle = w.color;
                    ctx.fill();
                }
                __snowState.raf = requestAnimationFrame(frame);
            };
            frame();
        } else if (fxType === 'galaxy') {
            const starCount = Math.min(125, Math.max(60, Math.floor((window.innerWidth * window.innerHeight) / 13000)));
            const colors = ['255,255,255', '233,213,255', '186,230,253'];
            const stars = Array.from({ length: starCount }, (_, i) => ({
                x: Math.random() * cv.width,
                y: Math.random() * cv.height,
                r: Math.random() * 1.45 + 0.55,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.028 + 0.009,
                glint: i % 3 === 0,
                rgb: colors[i % colors.length]
            }));
            const frame = () => {
                ctx.clearRect(0, 0, cv.width, cv.height);
                for (const s of stars) {
                    s.phase += s.speed;
                    const wave = 0.5 + 0.5 * Math.sin(s.phase);
                    const alpha = 0.22 + 0.72 * wave;

                    // Soft glistening halo around each star
                    const haloR = s.r * (s.glint ? (3.8 + wave * 2.2) : (2.4 + wave * 1.1));
                    if (typeof ctx.createRadialGradient === 'function') {
                        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
                        grad.addColorStop(0, `rgba(${s.rgb}, ${(alpha * (s.glint ? 0.55 : 0.35)).toFixed(3)})`);
                        grad.addColorStop(0.45, `rgba(${s.rgb}, ${(alpha * 0.16).toFixed(3)})`);
                        grad.addColorStop(1, `rgba(${s.rgb}, 0)`);
                        ctx.fillStyle = grad;
                    } else {
                        ctx.fillStyle = `rgba(${s.rgb}, ${(alpha * 0.22).toFixed(3)})`;
                    }
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
                    ctx.fill();

                    // Bright star core
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(${s.rgb}, ${alpha.toFixed(3)})`;
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fill();

                    if (s.glint && alpha > 0.45) {
                        const len = s.r * (3.6 + wave * 2.2);
                        const diag = len * 0.55;
                        ctx.strokeStyle = `rgba(${s.rgb}, ${(alpha * 0.72).toFixed(3)})`;
                        ctx.lineWidth = 0.9;
                        ctx.beginPath();
                        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
                        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
                        ctx.stroke();

                        ctx.strokeStyle = `rgba(${s.rgb}, ${(alpha * 0.38).toFixed(3)})`;
                        ctx.lineWidth = 0.65;
                        ctx.beginPath();
                        ctx.moveTo(s.x - diag, s.y - diag); ctx.lineTo(s.x + diag, s.y + diag);
                        ctx.moveTo(s.x - diag, s.y + diag); ctx.lineTo(s.x + diag, s.y - diag);
                        ctx.stroke();
                    }
                }
                __snowState.raf = requestAnimationFrame(frame);
            };
            frame();
        } else if (fxType === 'hearts') {
            const heartColors = ['#ff4d88', '#fb7185', '#f43f5e', '#ff85b3'];
            const count = Math.min(24, Math.max(10, Math.floor(window.innerWidth / 85)));
            const materialHeartPath = (typeof Path2D === 'function')
                ? new Path2D('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z')
                : null;
            const hearts = Array.from({ length: count }, () => ({
                x: Math.random() * cv.width,
                y: Math.random() * cv.height,
                size: 28 + Math.random() * 8,
                vy: 0.55 + Math.random() * 0.75,
                vx: (Math.random() - 0.5) * 0.35,
                rot: (Math.random() - 0.5) * 0.35,
                alpha: 0.55 + Math.random() * 0.4,
                color: heartColors[Math.floor(Math.random() * heartColors.length)]
            }));
            const drawHeart = (x, y, s, rot, color, alpha) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rot);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = color;
                if (materialHeartPath) {
                    const scale = s / 24;
                    ctx.scale(scale, scale);
                    ctx.translate(-12, -12);
                    ctx.fill(materialHeartPath);
                } else {
                    const r = s * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(0, r * 0.65);
                    ctx.bezierCurveTo(-r * 1.15, -r * 0.1, -r * 0.95, -r * 1.05, 0, -r * 0.42);
                    ctx.bezierCurveTo(r * 0.95, -r * 1.05, r * 1.15, -r * 0.1, 0, r * 0.65);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            };
            const frame = () => {
                ctx.clearRect(0, 0, cv.width, cv.height);
                for (const h of hearts) {
                    drawHeart(h.x, h.y, h.size, h.rot, h.color, h.alpha);
                    h.y += h.vy;
                    h.x += h.vx;
                    if (h.y > cv.height + h.size) {
                        h.y = -h.size;
                        h.x = Math.random() * cv.width;
                    }
                    if (h.x > cv.width + h.size) h.x = -h.size;
                    if (h.x < -h.size) h.x = cv.width + h.size;
                }
                __snowState.raf = requestAnimationFrame(frame);
            };
            frame();
        }
    }

    let selectedBaseTheme = null;
    let themeTransitionRaf = null;
    let lastAppliedCoverTintKey = '';
    let isSongCoverThemeMode = false;
    const SONG_COVER_FALLBACK_KEY = '12am_song_cover_fallback_theme';
    const MUSIC_STATE_KEY = '12am_music_playback_state';
    const coverPaletteCache = new Map();

    function isThemeLight(t) {
        if (!t || typeof t !== "object") return false;
        const bgLum = getLuminance(t["bg-primary"]);
        return lightThemeNames.includes(t.name) || bgLum > 0.65;
    }

    function getFallbackThemeForSongCover() {
        let name = 'Original';
        try {
            const stored = localStorage.getItem(SONG_COVER_FALLBACK_KEY);
            if (stored && stored.trim()) name = stored.trim();
        } catch (_) {}
        const found = allThemes.find(t => t.name && t.name.toLowerCase() === name.toLowerCase() && !t.isSongCoverTheme);
        return found || DEFAULT_THEME;
    }

    function activateSongCoverTheme(save = true) {
        isSongCoverThemeMode = true;
        const fallback = getFallbackThemeForSongCover();
        selectedBaseTheme = fallback;
        lastAppliedCoverTintKey = '';
        if (save) {
            try {
                localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ name: 'Song Cover', isSongCoverTheme: true }));
                localStorage.removeItem(LEGACY_STORAGE_KEY);
            } catch (e) {}
        }
        applyTheme(fallback, false, true);
        syncSongCoverThemeTint(true);
    }

    function setSongCoverFallbackTheme(themeName) {
        if (!themeName || typeof themeName !== 'string') return false;
        const found = allThemes.find(t => t.name && t.name.toLowerCase() === themeName.toLowerCase() && !t.isSongCoverTheme);
        if (!found) return false;
        try {
            localStorage.setItem(SONG_COVER_FALLBACK_KEY, found.name);
        } catch (_) {}
        if (isSongCoverThemeMode) {
            const prevBase = selectedBaseTheme || DEFAULT_THEME;
            selectedBaseTheme = found;
            const polarityChanged = isThemeLight(prevBase) !== isThemeLight(found);
            if (polarityChanged) {
                lastAppliedCoverTintKey = '';
            }
            syncSongCoverThemeTint(true);
        }
        return true;
    }

    function applyTheme(theme, save = true, isInternalFrame = false) {
        if (!theme || typeof theme !== "object") {
            theme = DEFAULT_THEME;
        }

        if (!isInternalFrame) {
            if (theme.isSongCoverTheme || (theme.name && theme.name.toLowerCase() === 'song cover')) {
                activateSongCoverTheme(save);
                return;
            }
            isSongCoverThemeMode = false;
            lastAppliedCoverTintKey = '';
            if (themeTransitionRaf) {
                cancelAnimationFrame(themeTransitionRaf);
                themeTransitionRaf = null;
            }
            selectedBaseTheme = theme;
        }
        currentTheme = theme;
        const root = document.documentElement;
        const bgLum = getLuminance(theme["bg-primary"]);
        const isLightTheme = lightThemeNames.includes(theme.name) || bgLum > 0.65;

        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty("--" + key, value);
        }

        root.style.setProperty("--bg-page", theme["bg-primary"] || "#060608");
        root.style.setProperty("--bg-card", theme["bg-secondary"] || "#0c0c10");
        root.style.setProperty("--text-main", theme["text-primary"] || (isLightTheme ? "#0f172a" : "#ffffff"));
        root.style.setProperty("--text-muted", theme["text-secondary"] || (isLightTheme ? "#475569" : "#c8c8d4"));
        root.style.setProperty("--accent-color", theme["accent-primary"] || "#ff8800");
        root.style.setProperty("--accent-glow", theme["accent-secondary"] || "rgba(255, 136, 0, 0.45)");
        root.style.setProperty("--border-main", theme["border-primary"] || (isLightTheme ? "#e2e8f0" : "#1c1c24"));
        root.style.setProperty("--border-faint", theme["border-secondary"] || (isLightTheme ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.06)"));
        root.style.setProperty("--btn-bg", theme["button-bg"] || (isLightTheme ? "rgba(15, 23, 42, 0.06)" : "#14100c"));
        root.style.setProperty("--btn-text", theme["button-text"] || theme["accent-primary"] || "#ff8800");

        // Dynamic icon brightness: on white/light backgrounds, icons are black; on dark backgrounds, white
        root.style.setProperty("--icon-color", isLightTheme ? "#0f172a" : "#ffffff");
        root.style.setProperty("--icon-muted", isLightTheme ? "#475569" : "#a1a1aa");

        const dynamicBg = document.getElementById("dynamic-background");
        if (dynamicBg) {
            const glowColor = theme["accent-secondary"] || "rgba(255, 136, 0, 0.45)";
            dynamicBg.style.background = `radial-gradient(circle at 50% 20%, ${glowColor}, transparent 65%)`;
        }

        // AMOLED Detection & 20% Player Brightness Reduction
        const isAmoled = theme.name === 'AMOLED' || theme.name === 'AMOLED Midnight' || (theme.name && theme.name.toLowerCase().includes('amoled'));
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
                html.theme-amoled-midnight #moss-player-frame,
                html.theme-amoled-midnight .stream-iframe {
                    filter: brightness(0.8) !important;
                    transition: filter 0.3s ease;
                }
                /* AMOLED Contrast Fix: --accent-primary is #ffffff, so accent-background buttons must use dark icons/text */
                html.theme-amoled-midnight #now-playing-container #now-playing-play-pause,
                html.theme-amoled-midnight #now-playing-container #now-playing-play-pause *,
                html.theme-amoled-midnight #np-lyrics-floating-bar #lyrics-bar-play-pause,
                html.theme-amoled-midnight #np-lyrics-floating-bar #lyrics-bar-play-pause *,
                html.theme-amoled-midnight .yolk-active,
                html.theme-amoled-midnight .yolk-active *,
                html.theme-amoled-midnight .crossfade-preset-pill.bg-zinc-900,
                html.theme-amoled-midnight .crossfade-preset-pill.bg-zinc-900 *,
                html.theme-amoled-midnight .crossfade-preset-pill.active,
                html.theme-amoled-midnight .crossfade-preset-pill.active *,
                html.theme-amoled-midnight #play-pause-btn:hover,
                html.theme-amoled-midnight #play-pause-btn:hover *,
                html.theme-amoled-midnight .card-btn-play,
                html.theme-amoled-midnight .card-btn-play *,
                html.theme-amoled-midnight .btn-primary-sharp:hover,
                html.theme-amoled-midnight .btn-primary-sharp:hover *,
                html.theme-amoled-midnight .proxy-go-btn,
                html.theme-amoled-midnight .proxy-go-btn *,
                html.theme-amoled-midnight .proxy-center-search button,
                html.theme-amoled-midnight .proxy-center-search button *,
                html.theme-amoled-midnight .ai-send-btn,
                html.theme-amoled-midnight .ai-send-btn *,
                html.theme-amoled-midnight .spotlight-btn-play,
                html.theme-amoled-midnight .spotlight-btn-play *,
                html.theme-amoled-midnight .search-btn,
                html.theme-amoled-midnight .search-btn *,
                html.theme-amoled-midnight .instant-audio-btn:hover,
                html.theme-amoled-midnight .instant-audio-btn:hover *,
                html.theme-amoled-midnight .squircle-chip:hover,
                html.theme-amoled-midnight .squircle-chip:hover *,
                html.theme-amoled-midnight .btn-home:hover,
                html.theme-amoled-midnight .btn-home:hover *,
                html.theme-amoled-midnight .btn-primary-override:hover,
                html.theme-amoled-midnight .btn-primary-override:hover * {
                    color: #000000 !important;
                }
                html.theme-amoled-midnight #now-playing-container #now-playing-play-pause svg,
                html.theme-amoled-midnight #np-lyrics-floating-bar #lyrics-bar-play-pause svg,
                html.theme-amoled-midnight .yolk-active svg,
                html.theme-amoled-midnight .card-btn-play svg,
                html.theme-amoled-midnight .proxy-go-btn svg,
                html.theme-amoled-midnight .proxy-center-search button svg,
                html.theme-amoled-midnight .ai-send-btn svg,
                html.theme-amoled-midnight .spotlight-btn-play svg,
                html.theme-amoled-midnight .search-btn svg,
                html.theme-amoled-midnight .instant-audio-btn:hover svg,
                html.theme-amoled-midnight .btn-home:hover svg,
                html.theme-amoled-midnight .btn-primary-override:hover svg {
                    fill: currentColor !important;
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

        // Dynamic contrast rules for Light/White surfaces
        let fixStyle = document.getElementById("12am-theme-contrast-fix");
        if (!fixStyle) {
            fixStyle = document.createElement("style");
            fixStyle.id = "12am-theme-contrast-fix";
            document.head.appendChild(fixStyle);
        }

        if (isLightTheme) {
            fixStyle.textContent = `
                /* Dynamic contrast for icons and text on light surfaces */
                .sidebar-btn, .settings-dock-btn { color: #0f172a !important; background: rgba(0, 0, 0, 0.05) !important; border-color: rgba(0, 0, 0, 0.12) !important; }
                .sidebar-btn i, .settings-dock-btn i { color: inherit !important; }
                .sidebar-btn:hover, .settings-dock-btn:hover, .nav-tab:hover { color: #000000 !important; background: rgba(0, 0, 0, 0.1) !important; }
                .sidebar-btn.active, .settings-dock-btn.active, .nav-tab.active {
                    color: var(--tab-active-text, var(--accent-primary, #0f172a)) !important;
                    background: var(--tab-active-bg, rgba(79, 70, 229, 0.14)) !important;
                    border-color: var(--tab-active-border, var(--accent-primary, #4f46e5)) !important;
                    font-weight: 500 !important;
                }
                .sidebar-btn.active i, .settings-dock-btn.active i, .nav-tab.active i {
                    color: var(--tab-active-text, var(--accent-primary, #0f172a)) !important;
                }
                .sidebar-page-badge i {
                    color: var(--accent-primary, #4f46e5) !important;
                }
                .auth-menu-container { background: #ffffff !important; border-color: #e2e8f0 !important; color: #0f172a !important; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15) !important; }
                .auth-menu-link, .auth-menu-button { color: #334155 !important; }
                .auth-menu-link:hover, .auth-menu-button:hover { color: #0f172a !important; background: rgba(0, 0, 0, 0.06) !important; }
                .auth-menu-displayname { color: #0f172a !important; }
                .auth-menu-collapse { color: #475569 !important; }
                .minimal-footer-cluster { background: #ffffff !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
                .minimal-footer-copy { color: #64748b !important; }
                .text-white:where(:not(.bg-zinc-900, .bg-zinc-800, .bg-black, .bg-black\\/45, .bg-black\\/50, .bg-black\\/60, .bg-black\\/70, .bg-black\\/75, .bg-black\\/80, .bg-black\\/90, .yolk-active, #bottom-player-play-pause, #now-playing-play-pause, #lyrics-bar-play-pause, #playlist-play-all-btn, #artist-play-all-btn, #album-play-all-btn, #create-playlist-btn, #playlist-modal-save, #modal-cover-upload-btn, #full-desc-done-btn, #crop-apply-btn, #tint-wheel-apply, #yt-import-submit-btn, #share-native-btn, #page-now-playing *)) { color: #0f172a !important; }
                .bg-zinc-900, .bg-zinc-900 .text-white, .bg-zinc-900 .material-symbols-rounded, .bg-zinc-900 svg,
                .bg-zinc-800, .bg-zinc-800 .text-white, .bg-zinc-800 .material-symbols-rounded, .bg-zinc-800 svg,
                .bg-black, .bg-black .text-white, .bg-black .material-symbols-rounded, .bg-black svg,
                .bg-black\\/45, .bg-black\\/45 .text-white, .bg-black\\/45 .material-symbols-rounded, .bg-black\\/45 svg,
                .bg-black\\/60, .bg-black\\/60 .text-white, .bg-black\\/60 .material-symbols-rounded, .bg-black\\/60 svg,
                .bg-black\\/75, .bg-black\\/75 .text-white, .bg-black\\/75 .material-symbols-rounded, .bg-black\\/75 svg,
                .bg-black\\/80, .bg-black\\/80 .text-white, .bg-black\\/80 .material-symbols-rounded, .bg-black\\/80 svg,
                .bg-black\\/90, .bg-black\\/90 .text-white, .bg-black\\/90 .material-symbols-rounded, .bg-black\\/90 svg,
                .yolk-active, .yolk-active .text-white, .yolk-active .material-symbols-rounded, .yolk-active svg,
                #bottom-player-play-pause, #bottom-player-play-pause *,
                #now-playing-play-pause, #now-playing-play-pause *,
                #lyrics-bar-play-pause, #lyrics-bar-play-pause *,
                #playlist-play-all-btn, #playlist-play-all-btn *,
                #artist-play-all-btn, #artist-play-all-btn *,
                #album-play-all-btn, #album-play-all-btn *,
                #create-playlist-btn, #create-playlist-btn * {
                    color: #ffffff !important;
                }
                .text-gray-400, .text-zinc-400 { color: #475569 !important; }
                i, .material-symbols-sharp, .material-symbols-rounded {
                    /* Inherit text contrast dynamically */
                }
                /* Lower, softer UI shadows for light themes */
                .floating-sidebar, .sidebar-nav, .auth-menu-container, .minimal-footer-cluster,
                .dock-music-menu, .dock-music-menu-container, .dict-card, .bento-card,
                .glass-card, .hero-card, .game-card, .card, .modal-content, .auth-card,
                .legal-card, .error-card, .search-bar, .search-box, .search-dropdown,
                .chat-input-box, .message-bubble {
                    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
                }
                .game-card:hover, .bento-card:hover, .hero-card:hover, .search-box:focus-within {
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.09), 0 2px 6px rgba(15, 23, 42, 0.05) !important;
                }
                .btn-primary-sharp, .search-btn, .pill-slider-indicator {
                    box-shadow: 0 2px 10px var(--accent-glow, rgba(79, 70, 229, 0.16)) !important;
                }
            `;
        } else {
            const fourthOfJulyDockCss = theme.name === '4th of July' ? `
                /* Faint star pattern behind main dock buttons */
                html #floating-sidebar {
                    background-color: var(--navbar-bg, rgba(14, 34, 82, 0.92)) !important;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='84' viewBox='0 0 60 84'%3E%3Cpolygon points='19,8 22.06,16.79 31.36,16.98 23.95,22.61 26.64,31.52 19,26.2 11.36,31.52 14.05,22.61 6.64,16.98 15.94,16.79' fill='%23ffffff' fill-opacity='0.11'/%3E%3Cpolygon points='41,50 44.06,58.79 53.36,58.98 45.95,64.61 48.64,73.52 41,68.2 33.36,73.52 36.05,64.61 28.64,58.98 37.94,58.79' fill='%23ffffff' fill-opacity='0.11'/%3E%3C/svg%3E") !important;
                    background-repeat: repeat-y !important;
                    background-position: center top !important;
                    background-size: 60px 84px !important;
                }
            ` : '';
            fixStyle.textContent = `
                /* Dark surface contrast defaults */
                .sidebar-btn { color: #a1a1aa; }
                .sidebar-btn:hover { color: #ffffff; }
                ${fourthOfJulyDockCss}
            `;
        }

        // Logo Tinting: Smooth 0.2s color transition without sliding from the left
        const logos = document.querySelectorAll(".navbar-logo, #navbar-logo, #sidebar-logo, .sidebar-logo-img, .minimal-footer-logo");
        const prefix = window.location.pathname.includes("/logged-in/") ? "../" : "";
        const tintColor = isLightTheme ? '#000000' : (theme.name === 'AMOLED' ? '#ffffff' : (theme['accent-primary'] || '#ff8800'));

        logos.forEach(img => {
            if (!img) return;
            const logoUrl = prefix + "images/logo-white.png";
            img.src = logoUrl;
            if (img.parentElement && img.parentElement.classList && img.parentElement.classList.contains("sidebar-logo-inner")) {
                const maskUrl = `url("${logoUrl}")`;
                const wrap = img.parentElement;
                wrap.style.backgroundColor = tintColor;
                wrap.style.transition = "background-color 0.2s ease";
                wrap.style.webkitMaskImage = maskUrl;
                wrap.style.maskImage = maskUrl;
                wrap.style.webkitMaskSize = "contain";
                wrap.style.maskSize = "contain";
                wrap.style.webkitMaskRepeat = "no-repeat";
                wrap.style.maskRepeat = "no-repeat";
                wrap.style.webkitMaskPosition = "center";
                wrap.style.maskPosition = "center";
                img.style.opacity = "0";
                img.style.transform = "none";
                img.style.filter = "none";
            } else {
                img.style.transition = "filter 0.2s ease";
                img.style.transform = "translateX(-100px)";
                img.style.filter = `drop-shadow(100px 0 0 ${tintColor})`;
            }
        });

        // Winter Theme Snowfall Engine
        if (!isInternalFrame) {
            updateWinterSnow(theme.name);
        }

        if (save && !isInternalFrame) {
            try {
                const serialized = JSON.stringify(theme);
                localStorage.setItem(THEME_STORAGE_KEY, serialized);
                localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
            } catch (e) {}
            if (typeof syncSongCoverThemeTint === 'function') {
                if (typeof setTimeout === 'function') {
                    setTimeout(() => syncSongCoverThemeTint(), 0);
                } else {
                    syncSongCoverThemeTint();
                }
            }
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

    function saveCustomTheme(themeObj) {
        if (!themeObj || !themeObj.name) return false;
        themeObj.isCustom = true;
        const customs = loadCustomThemes().filter(t => t.name.toLowerCase() !== themeObj.name.toLowerCase());
        customs.push(themeObj);
        try {
            localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customs));
        } catch (e) {}
        mergeThemes();
        applyTheme(themeObj, true);
        window.dispatchEvent(new CustomEvent("12am:themes-ready", { detail: allThemes }));
        return true;
    }

    function deleteCustomTheme(name) {
        if (!name) return false;
        const customs = loadCustomThemes().filter(t => t.name.toLowerCase() !== name.toLowerCase());
        try {
            localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customs));
        } catch (e) {}
        mergeThemes();
        if (currentTheme && currentTheme.name.toLowerCase() === name.toLowerCase()) {
            applyTheme(DEFAULT_THEME, true);
        }
        window.dispatchEvent(new CustomEvent("12am:themes-ready", { detail: allThemes }));
        return true;
    }

    function createCustomTheme(name, color1, color2, color3) {
        if (!color1) return null;
        const bg1 = color2 || "#060608";
        const isLightBg = getLuminance(bg1) > 0.65;
        const bg2 = color2 ? adjustHex(color2, isLightBg ? -4 : 3) : "#0d0d12";
        const sec = color3 || color1;
        const btnBg = color2 ? adjustHex(color2, isLightBg ? -6 : 4) : "#0e0e14";
        const themeName = name ? name.trim().slice(0, 20) : ("Custom " + (loadCustomThemes().length + 1));

        const theme = {
            name: themeName,
            description: `Custom 12AM colorway (${[color1, color2, color3].filter(Boolean).join(', ')})`,
            isCustom: true,
            "bg-primary": bg1,
            "bg-secondary": bg2,
            "text-primary": isLightBg ? "#0f172a" : "#ffffff",
            "text-secondary": isLightBg ? "#475569" : adjustHex(color1, 40),
            "accent-primary": color1,
            "accent-secondary": hexToRgba(sec, 0.45),
            "accent-glow": hexToRgba(sec, 0.35),
            "navbar-bg": hexToRgba(bg2, 0.90),
            "navbar-border": hexToRgba(color1, 0.28),
            "navbar-text": isLightBg ? "#0f172a" : "#ffffff",
            "tab-active-bg": hexToRgba(color1, 0.18),
            "tab-active-text": color1,
            "tab-active-border": color1,
            "tab-hover-bg": isLightBg ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.05)",
            "tab-hover-text": isLightBg ? "#0f172a" : "#ffffff",
            "button-bg": btnBg,
            "button-text": color1,
            "border-primary": hexToRgba(color1, 0.22),
            "border-secondary": isLightBg ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.06)",
            "avatar-gradient": `linear-gradient(135deg, ${color1} 0%, ${sec} 100%)`,
            "logo-src": isLightBg ? "/images/logo-dark.png" : "/images/logo.png"
        };
        saveCustomTheme(theme);
        return theme;
    }

    // Song Cover Theme Tinting Engine
    function parseCssColor(str) {
        if (!str || typeof str !== 'string') return null;
        const s = str.trim();
        if (s.startsWith('#')) {
            let h = s.slice(1);
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            if (h.length === 6) {
                const n = parseInt(h, 16);
                if (!Number.isNaN(n)) {
                    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
                }
            }
            return null;
        }
        const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
        if (m) {
            return {
                r: Math.max(0, Math.min(255, Number(m[1]))),
                g: Math.max(0, Math.min(255, Number(m[2]))),
                b: Math.max(0, Math.min(255, Number(m[3]))),
                a: m[4] !== undefined ? Math.max(0, Math.min(1, Number(m[4]))) : 1
            };
        }
        return null;
    }

    function formatRgba(c) {
        const r = Math.round(c.r);
        const g = Math.round(c.g);
        const b = Math.round(c.b);
        const a = Math.round((c.a ?? 1) * 1000) / 1000;
        return a >= 0.999 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    function mixRgba(c1, c2, t) {
        return {
            r: c1.r + (c2.r - c1.r) * t,
            g: c1.g + (c2.g - c1.g) * t,
            b: c1.b + (c2.b - c1.b) * t,
            a: (c1.a ?? 1) + ((c2.a ?? 1) - (c1.a ?? 1)) * t
        };
    }

    function mixCssColor(str1, str2, t) {
        const c1 = parseCssColor(str1);
        const c2 = parseCssColor(str2);
        if (!c1 || !c2) return t < 0.5 ? str1 : str2;
        return formatRgba(mixRgba(c1, c2, t));
    }

    function rgbToHslSimple(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, l };
    }

    function hslToRgbSimple(h, s, l) {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: 1 };
    }

    function getCorsSafeCoverUrlForTint(imgUrl) {
        if (!imgUrl) return '';
        if (imgUrl.startsWith('data:') || imgUrl.startsWith('blob:') || imgUrl.startsWith('/')) return imgUrl;
        const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';
        if (imgUrl.includes('api/music-api') || imgUrl.includes('proxy-image')) return imgUrl;
        return `${prefix}api/music-api?endpoint=proxy-image&url=${encodeURIComponent(imgUrl)}`;
    }

    function extractCoverPalette(imgUrl, callback) {
        if (!imgUrl) { callback(null); return; }
        if (coverPaletteCache.has(imgUrl)) {
            callback(coverPaletteCache.get(imgUrl));
            return;
        }
        const safeSrc = getCorsSafeCoverUrlForTint(imgUrl);
        const tryLoad = (src, allowFallback) => {
            const img = new Image();
            if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'Anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 48;
                    canvas.height = 48;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(img, 0, 0, 48, 48);
                    const data = ctx.getImageData(0, 0, 48, 48).data;
                    const buckets = new Map();
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] < 120) continue;
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`;
                        const existing = buckets.get(key);
                        if (existing) {
                            existing.rSum += r; existing.gSum += g; existing.bSum += b; existing.count++;
                        } else {
                            buckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
                        }
                    }
                    const allCandidates = Array.from(buckets.values()).map(bkt => {
                        const r = Math.round(bkt.rSum / bkt.count);
                        const g = Math.round(bkt.gSum / bkt.count);
                        const b = Math.round(bkt.bSum / bkt.count);
                        const hsl = rgbToHslSimple(r, g, b);
                        const score = (hsl.s * 3.5) + (1 - Math.abs(hsl.l - 0.5)) * 1.5 + Math.log(bkt.count + 1) * 0.3;
                        return { r, g, b, hsl, score };
                    }).sort((a, b) => b.score - a.score);

                    const vibrant = allCandidates.filter(c => c.hsl.s >= 0.14 && c.hsl.l >= 0.08 && c.hsl.l <= 0.92);
                    const candidates = vibrant.length ? vibrant : allCandidates;

                    if (!candidates.length) { callback(null); return; }
                    const c1 = candidates[0];
                    let c2 = candidates[1] || c1;
                    let bestDist = -1;
                    for (const cand of candidates.slice(1, 14)) {
                        const d = Math.hypot(cand.r - c1.r, cand.g - c1.g, cand.b - c1.b);
                        if (d > bestDist) { bestDist = d; c2 = cand; }
                    }
                    const palette = {
                        primary: { r: c1.r, g: c1.g, b: c1.b, hsl: c1.hsl },
                        secondary: { r: c2.r, g: c2.g, b: c2.b, hsl: c2.hsl }
                    };
                    coverPaletteCache.set(imgUrl, palette);
                    callback(palette);
                } catch (_) {
                    if (allowFallback && src !== imgUrl) {
                        tryLoad(imgUrl, false);
                    } else {
                        callback(null);
                    }
                }
            };
            img.onerror = () => {
                if (allowFallback && src !== imgUrl) {
                    tryLoad(imgUrl, false);
                } else {
                    callback(null);
                }
            };
            img.src = src;
        };
        tryLoad(safeSrc, true);
    }

    function buildTintedTheme(baseTheme, palette) {
        if (!baseTheme || !palette) return baseTheme;
        const isLight = lightThemeNames.includes(baseTheme.name) || getLuminance(baseTheme['bg-primary']) > 0.65;
        const pHsl = palette.primary.hsl;
        const sHsl = palette.secondary.hsl;

        const sat = Math.max(0.68, Math.min(0.95, pHsl.s * 1.25));
        const accentRgb = hslToRgbSimple(pHsl.h, Math.max(0.75, sat), isLight ? 0.44 : 0.62);
        const secRgb = hslToRgbSimple(sHsl.h, Math.max(0.62, Math.min(0.92, sHsl.s * 1.2)), isLight ? 0.48 : 0.60);
        const bgPrimaryTint = hslToRgbSimple(pHsl.h, sat * 0.78, isLight ? 0.88 : 0.16);
        const bgSecondaryTint = hslToRgbSimple(pHsl.h, sat * 0.82, isLight ? 0.93 : 0.23);
        const btnTint = hslToRgbSimple(pHsl.h, sat * 0.82, isLight ? 0.86 : 0.26);
        const borderTint = hslToRgbSimple(pHsl.h, sat * 0.75, isLight ? 0.72 : 0.42);

        const accentStr = formatRgba(accentRgb);
        const secStr = formatRgba(secRgb);

        return {
            ...baseTheme,
            'bg-primary': mixCssColor(baseTheme['bg-primary'] || (isLight ? '#f8fafc' : '#060608'), formatRgba(bgPrimaryTint), isLight ? 0.82 : 0.85),
            'bg-secondary': mixCssColor(baseTheme['bg-secondary'] || (isLight ? '#ffffff' : '#0e0e13'), formatRgba(bgSecondaryTint), isLight ? 0.85 : 0.88),
            'text-secondary': mixCssColor(baseTheme['text-secondary'] || (isLight ? '#475569' : '#c8c8d4'), accentStr, 0.55),
            'accent-primary': accentStr,
            'accent-secondary': formatRgba({ ...accentRgb, a: 0.58 }),
            'accent-glow': formatRgba({ ...secRgb, a: 0.52 }),
            'navbar-bg': mixCssColor(baseTheme['navbar-bg'] || (isLight ? 'rgba(255,255,255,0.9)' : 'rgba(12,12,16,0.9)'), formatRgba({ ...bgSecondaryTint, a: 0.92 }), 0.88),
            'navbar-border': formatRgba({ ...accentRgb, a: 0.48 }),
            'tab-active-bg': formatRgba({ ...accentRgb, a: isLight ? 0.24 : 0.30 }),
            'tab-active-text': isLight ? formatRgba(hslToRgbSimple(pHsl.h, Math.max(0.7, sat), 0.30)) : '#ffffff',
            'tab-active-border': accentStr,
            'tab-hover-bg': formatRgba({ ...accentRgb, a: 0.22 }),
            'button-bg': mixCssColor(baseTheme['button-bg'] || (isLight ? '#f1f5f9' : '#14141c'), formatRgba(btnTint), 0.88),
            'button-text': isLight ? formatRgba(hslToRgbSimple(pHsl.h, Math.max(0.7, sat), 0.34)) : accentStr,
            'border-primary': mixCssColor(baseTheme['border-primary'] || (isLight ? '#cbd5e1' : '#27272a'), formatRgba(borderTint), 0.85),
            'avatar-gradient': `linear-gradient(135deg, ${accentStr} 0%, ${secStr} 100%)`
        };
    }

    const INTERPOLATED_COLOR_KEYS = [
        'bg-primary', 'bg-secondary', 'text-primary', 'text-secondary',
        'accent-primary', 'accent-secondary', 'accent-glow', 'navbar-bg',
        'navbar-border', 'navbar-text', 'tab-active-bg', 'tab-active-text',
        'tab-active-border', 'tab-hover-bg', 'tab-hover-text', 'button-bg',
        'button-text', 'border-primary', 'border-secondary'
    ];

    function animateThemeTransition(fromTheme, toTheme, durationMs = 750) {
        if (themeTransitionRaf) {
            cancelAnimationFrame(themeTransitionRaf);
            themeTransitionRaf = null;
        }
        if (!fromTheme || !toTheme) {
            applyTheme(toTheme || selectedBaseTheme || DEFAULT_THEME, false, true);
            return;
        }
        const start = performance.now();
        const step = (now) => {
            const rawT = Math.min(1, Math.max(0, (now - start) / durationMs));
            const easeT = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2;
            const frameTheme = { ...toTheme };
            for (const key of INTERPOLATED_COLOR_KEYS) {
                if (fromTheme[key] && toTheme[key]) {
                    frameTheme[key] = mixCssColor(fromTheme[key], toTheme[key], easeT);
                }
            }
            applyTheme(frameTheme, false, true);
            if (rawT < 1) {
                themeTransitionRaf = requestAnimationFrame(step);
            } else {
                themeTransitionRaf = null;
                applyTheme(toTheme, false, true);
            }
        };
        themeTransitionRaf = requestAnimationFrame(step);
    }

    function resolveCoverUrlForTint(track) {
        if (!track) return '';
        const raw = track.artwork_url || track.cover || track.artwork || track.thumbnail || track.image || '';
        if (raw) {
            return String(raw).replace('100x100bb', '300x300bb').replace('50x50bb', '300x300bb');
        }
        const ytId = track.youtube_id || track.videoId || (track.id && String(track.id).startsWith('ytm-') ? String(track.id).slice(4) : '');
        if (ytId) return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
        return '';
    }

    function syncSongCoverThemeTint(forceImmediate = false) {
        if (!isSongCoverThemeMode) return;
        const base = getFallbackThemeForSongCover();
        selectedBaseTheme = base;

        let musicState = null;
        try {
            const raw = localStorage.getItem(MUSIC_STATE_KEY);
            musicState = raw ? JSON.parse(raw) : null;
        } catch (_) {}

        const track = musicState && musicState.track ? musicState.track : null;
        const isPlaying = Boolean(musicState && musicState.isPlaying && track);
        const coverUrl = isPlaying ? resolveCoverUrlForTint(track) : '';

        if (!isPlaying || !coverUrl) {
            if (lastAppliedCoverTintKey !== '') {
                lastAppliedCoverTintKey = '';
                animateThemeTransition(currentTheme, base, 750);
                if (typeof updateWinterSnow === 'function') updateWinterSnow(base.name);
            } else if (forceImmediate) {
                applyTheme(base, false, true);
            }
            return;
        }

        const tintKey = `${base.name}::${coverUrl}`;
        if (tintKey === lastAppliedCoverTintKey) return;

        extractCoverPalette(coverUrl, (palette) => {
            if (!isSongCoverThemeMode) return;
            let latestState = null;
            try {
                const raw = localStorage.getItem(MUSIC_STATE_KEY);
                latestState = raw ? JSON.parse(raw) : null;
            } catch (_) {}
            if (!latestState || !latestState.isPlaying || !latestState.track) return;
            if (!palette) return;
            const currentBase = getFallbackThemeForSongCover();
            selectedBaseTheme = currentBase;
            lastAppliedCoverTintKey = `${currentBase.name}::${coverUrl}`;
            // Fade out any fallback theme background effect while tinted to the song cover
            const activeFxEl = __snowState.canvas || __snowState.fireworksEl || __snowState.pattern;
            if (activeFxEl) {
                activeFxEl.style.transition = 'opacity 0.65s ease';
                activeFxEl.style.opacity = '0';
                setTimeout(() => {
                    if (isSongCoverThemeMode && lastAppliedCoverTintKey !== '') {
                        clearThemeEffects();
                    }
                }, 660);
            }
            const tinted = buildTintedTheme(currentBase, palette);
            animateThemeTransition(currentTheme, tinted, 750);
        });
    }

    window.__sync12amSongCoverThemeTint = syncSongCoverThemeTint;

    window.addEventListener('12am:music-state-updated', () => {
        syncSongCoverThemeTint();
    });

    window.applyTheme = applyTheme;
    window.setThemeByName = setThemeByName;
    window.getThemes = () => allThemes;
    window.getCurrentTheme = () => currentTheme;
    window.getSelectedBaseTheme = () => isSongCoverThemeMode ? { name: 'Song Cover', isSongCoverTheme: true } : (selectedBaseTheme || currentTheme);
    window.activateSongCoverTheme = activateSongCoverTheme;
    window.isSongCoverThemeActive = () => isSongCoverThemeMode;
    window.getSongCoverFallbackThemeName = () => getFallbackThemeForSongCover().name;
    window.setSongCoverFallbackTheme = setSongCoverFallbackTheme;
    window.DEFAULT_THEME = DEFAULT_THEME;
    window.saveCustomTheme = saveCustomTheme;
    window.deleteCustomTheme = deleteCustomTheme;
    window.createCustomTheme = createCustomTheme;
    window.loadCustomThemes = loadCustomThemes;
    window.getLuminance = getLuminance;

    // Apply saved theme immediately
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.isSongCoverTheme || (parsed.name && parsed.name.toLowerCase() === 'song cover'))) {
                activateSongCoverTheme(false);
            } else if (parsed && typeof parsed === "object" && parsed.name) {
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
        document.addEventListener("DOMContentLoaded", () => {
            fetchThemes();
            syncSongCoverThemeTint();
        });
    } else {
        fetchThemes();
        syncSongCoverThemeTint();
    }

    window.addEventListener("storage", (e) => {
        if (e.key === THEME_STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
            try {
                if (e.newValue) {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed && (parsed.isSongCoverTheme || (parsed.name && parsed.name.toLowerCase() === 'song cover'))) {
                        activateSongCoverTheme(false);
                    } else if (parsed && (!selectedBaseTheme || parsed.name !== selectedBaseTheme.name || isSongCoverThemeMode)) {
                        applyTheme(parsed, false);
                    }
                }
            } catch (err) {}
        } else if (e.key === MUSIC_STATE_KEY || e.key === SONG_COVER_FALLBACK_KEY) {
            syncSongCoverThemeTint(true);
        }
    });
})();
