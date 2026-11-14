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
    const lightThemeNames = ["Light"];

    // Embedded 25 Curated Themes with "Original" as default
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
        "name": "Valentine's Day",
        "description": "Romantic velvet rose-crimson, blush pink, and candy heart magenta.",
        "bg-primary": "#14060b",
        "bg-secondary": "#210a13",
        "text-primary": "#fff1f2",
        "text-secondary": "#fda4af",
        "accent-primary": "#f43f5e",
        "accent-secondary": "rgba(244, 63, 94, 0.42)",
        "accent-glow": "rgba(236, 72, 153, 0.34)",
        "navbar-bg": "rgba(26, 8, 16, 0.9)",
        "navbar-border": "rgba(244, 63, 94, 0.28)",
        "navbar-text": "#fff1f2",
        "tab-active-bg": "rgba(244, 63, 94, 0.2)",
        "tab-active-text": "#fbcfe8",
        "tab-active-border": "#f43f5e",
        "tab-hover-bg": "rgba(244, 63, 94, 0.1)",
        "tab-hover-text": "#fecdd3",
        "button-bg": "#240a15",
        "button-text": "#fb7185",
        "border-primary": "#3d1222",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #f43f5e 0%, #ec4899 55%, #fda4af 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "St. Patrick's Day",
        "description": "Shamrock clover green, radiant emerald, and lucky pot-of-gold accents.",
        "bg-primary": "#041109",
        "bg-secondary": "#0a1f12",
        "text-primary": "#ecfdf5",
        "text-secondary": "#fde047",
        "accent-primary": "#16a34a",
        "accent-secondary": "rgba(22, 163, 74, 0.44)",
        "accent-glow": "rgba(34, 197, 94, 0.32)",
        "navbar-bg": "rgba(7, 25, 14, 0.9)",
        "navbar-border": "rgba(22, 163, 74, 0.3)",
        "navbar-text": "#ecfdf5",
        "tab-active-bg": "rgba(22, 163, 74, 0.2)",
        "tab-active-text": "#fde047",
        "tab-active-border": "#22c55e",
        "tab-hover-bg": "rgba(22, 163, 74, 0.1)",
        "tab-hover-text": "#86efac",
        "button-bg": "#091c10",
        "button-text": "#facc15",
        "border-primary": "#163d24",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #22c55e 0%, #15803d 65%, #facc15 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Easter",
        "description": "Pastel lavender-lilac, robin's egg blue, and springtime buttercup yellow.",
        "bg-primary": "#120f1d",
        "bg-secondary": "#1c172e",
        "text-primary": "#faf5ff",
        "text-secondary": "#bae6fd",
        "accent-primary": "#d8b4fe",
        "accent-secondary": "rgba(216, 180, 254, 0.38)",
        "accent-glow": "rgba(186, 230, 253, 0.32)",
        "navbar-bg": "rgba(22, 18, 38, 0.9)",
        "navbar-border": "rgba(216, 180, 254, 0.28)",
        "navbar-text": "#faf5ff",
        "tab-active-bg": "rgba(216, 180, 254, 0.2)",
        "tab-active-text": "#fde68a",
        "tab-active-border": "#d8b4fe",
        "tab-hover-bg": "rgba(186, 230, 253, 0.1)",
        "tab-hover-text": "#bae6fd",
        "button-bg": "#1f1936",
        "button-text": "#fde68a",
        "border-primary": "#332954",
        "border-secondary": "rgba(255, 255, 255, 0.07)",
        "avatar-gradient": "linear-gradient(135deg, #d8b4fe 0%, #7dd3fc 50%, #fde68a 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "4th of July",
        "description": "Independence Day patriotic deep liberty navy, crimson red, and firework white & blue.",
        "bg-primary": "#050a18",
        "bg-secondary": "#0a152e",
        "text-primary": "#ffffff",
        "text-secondary": "#93c5fd",
        "accent-primary": "#ef4444",
        "accent-secondary": "rgba(239, 68, 68, 0.42)",
        "accent-glow": "rgba(59, 130, 246, 0.35)",
        "navbar-bg": "rgba(8, 17, 38, 0.9)",
        "navbar-border": "rgba(59, 130, 246, 0.3)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(239, 68, 68, 0.2)",
        "tab-active-text": "#ffffff",
        "tab-active-border": "#ef4444",
        "tab-hover-bg": "rgba(59, 130, 246, 0.14)",
        "tab-hover-text": "#bfdbfe",
        "button-bg": "#0d1a38",
        "button-text": "#f87171",
        "border-primary": "#1e3a6e",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #ef4444 0%, #ffffff 50%, #2563eb 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Halloween",
        "description": "Spooky midnight obsidian with glowing jack-o'-lantern pumpkin orange and eerie violet.",
        "bg-primary": "#0a060e",
        "bg-secondary": "#160d1f",
        "text-primary": "#fff7ed",
        "text-secondary": "#c084fc",
        "accent-primary": "#f97316",
        "accent-secondary": "rgba(249, 115, 22, 0.45)",
        "accent-glow": "rgba(168, 85, 247, 0.34)",
        "navbar-bg": "rgba(18, 10, 26, 0.9)",
        "navbar-border": "rgba(249, 115, 22, 0.3)",
        "navbar-text": "#fff7ed",
        "tab-active-bg": "rgba(249, 115, 22, 0.2)",
        "tab-active-text": "#fdba74",
        "tab-active-border": "#f97316",
        "tab-hover-bg": "rgba(168, 85, 247, 0.12)",
        "tab-hover-text": "#e9d5ff",
        "button-bg": "#1d1024",
        "button-text": "#fb923c",
        "border-primary": "#381c45",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #f97316 0%, #9333ea 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Thanksgiving",
        "description": "Warm harvest roasted chestnut brown, cranberry red, spiced pumpkin, and golden wheat.",
        "bg-primary": "#120905",
        "bg-secondary": "#1f1009",
        "text-primary": "#fef3c7",
        "text-secondary": "#fbbf24",
        "accent-primary": "#d97706",
        "accent-secondary": "rgba(217, 119, 6, 0.44)",
        "accent-glow": "rgba(185, 28, 28, 0.3)",
        "navbar-bg": "rgba(26, 13, 8, 0.9)",
        "navbar-border": "rgba(217, 119, 6, 0.3)",
        "navbar-text": "#fef3c7",
        "tab-active-bg": "rgba(217, 119, 6, 0.2)",
        "tab-active-text": "#fde68a",
        "tab-active-border": "#d97706",
        "tab-hover-bg": "rgba(185, 28, 28, 0.12)",
        "tab-hover-text": "#fed7aa",
        "button-bg": "#21120a",
        "button-text": "#f59e0b",
        "border-primary": "#3d2214",
        "border-secondary": "rgba(255, 255, 255, 0.06)",
        "avatar-gradient": "linear-gradient(135deg, #d97706 0%, #b91c1c 55%, #eab308 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Christmas",
        "description": "Festive pine forest green with warm holly berry red, ornament gold, and live falling snow.",
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
        "button-bg": "#0d2014",
        "button-text": "#ffd700",
        "border-primary": "#194229",
        "border-secondary": "rgba(255, 255, 255, 0.08)",
        "avatar-gradient": "linear-gradient(135deg, #ef4444 0%, #15803d 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "New Year's",
        "description": "Sparkling champagne gold on midnight onyx celebrating new beginnings.",
        "bg-primary": "#08080c",
        "bg-secondary": "#111119",
        "text-primary": "#ffffff",
        "text-secondary": "#fef08a",
        "accent-primary": "#eab308",
        "accent-secondary": "rgba(234, 179, 8, 0.42)",
        "accent-glow": "rgba(254, 240, 138, 0.32)",
        "navbar-bg": "rgba(15, 15, 22, 0.9)",
        "navbar-border": "rgba(234, 179, 8, 0.28)",
        "navbar-text": "#ffffff",
        "tab-active-bg": "rgba(234, 179, 8, 0.2)",
        "tab-active-text": "#fef08a",
        "tab-active-border": "#eab308",
        "tab-hover-bg": "rgba(234, 179, 8, 0.1)",
        "tab-hover-text": "#fde047",
        "button-bg": "#17160c",
        "button-text": "#facc15",
        "border-primary": "#292836",
        "border-secondary": "rgba(255, 255, 255, 0.07)",
        "avatar-gradient": "linear-gradient(135deg, #fef08a 0%, #eab308 55%, #ca8a04 100%)",
        "logo-src": "/images/logo.png"
    },
    {
        "name": "Camo",
        "description": "Tactical woodland olive drab, army moss green, khaki tan, and rugged bark brown.",
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
        "name": "Birthday",
        "description": "Festive party midnight and frosting cream with confetti magenta, balloon cyan, and candle gold.",
        "bg-primary": "#12081c",
        "bg-secondary": "#1e0e2e",
        "text-primary": "#fff1f2",
        "text-secondary": "#38bdf8",
        "accent-primary": "#ec4899",
        "accent-secondary": "rgba(236, 72, 153, 0.44)",
        "accent-glow": "rgba(56, 189, 248, 0.34)",
        "navbar-bg": "rgba(25, 11, 39, 0.9)",
        "navbar-border": "rgba(236, 72, 153, 0.3)",
        "navbar-text": "#fff1f2",
        "tab-active-bg": "rgba(236, 72, 153, 0.2)",
        "tab-active-text": "#facc15",
        "tab-active-border": "#ec4899",
        "tab-hover-bg": "rgba(56, 189, 248, 0.12)",
        "tab-hover-text": "#7dd3fc",
        "button-bg": "#241136",
        "button-text": "#f472b6",
        "border-primary": "#3c1c57",
        "border-secondary": "rgba(255, 255, 255, 0.07)",
        "avatar-gradient": "linear-gradient(135deg, #ec4899 0%, #38bdf8 50%, #facc15 100%)",
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
        "description": "Deep space nebula violet draped in starlight amethyst and cosmic dust.",
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
        "description": "Abyssal trench navy with bioluminescent electric cyan accents.",
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

    // Winter & Christmas Snowfall Engine
    const __snowState = { raf: null, canvas: null };
    function updateWinterSnow(themeName) {
        const tn = (themeName || '').toLowerCase();
        const wantSnow = tn === 'winter' || tn === 'christmas';
        if (!wantSnow) {
            if (__snowState.canvas) {
                cancelAnimationFrame(__snowState.raf);
                __snowState.canvas.remove();
                __snowState.canvas = null;
            }
            return;
        }
        if (__snowState.canvas || typeof document === 'undefined' || !document.body) return;

        const cv = document.createElement('canvas');
        cv.id = 'snowCanvas';
        cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-1;opacity:0.55;';
        document.body.prepend(cv);
        __snowState.canvas = cv;

        const ctx = cv.getContext('2d');
        const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);
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
    }

    function applyTheme(theme, save = true) {
        if (!theme || typeof theme !== "object") {
            theme = DEFAULT_THEME;
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
                html.theme-amoled-midnight .btn-primary-override:hover *,
                html.theme-amoled-midnight .custom-checkbox:checked::after {
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
            `;
        } else {
            fixStyle.textContent = `
                /* Dark surface contrast defaults */
                .sidebar-btn { color: #a1a1aa; }
                .sidebar-btn:hover { color: #ffffff; }
            `;
        }

        // Logo Tinting: Smooth 0.2s color transition without sliding from the left
        const logos = document.querySelectorAll(".navbar-logo, #navbar-logo, #sidebar-logo, .sidebar-logo-img, .minimal-footer-logo");
        const prefix = window.location.pathname.includes("/logged-in/") ? "../" : "";
        const tintColor = isLightTheme ? '#000000' : (theme.name === 'AMOLED' ? '#ffffff' : (theme['accent-primary'] || '#ff8800'));

        logos.forEach(img => {
            if (!img) return;
            img.src = prefix + "images/logo-white.png";
            img.style.transition = "filter 0.2s ease";
            img.style.transform = "translateX(-100px)";
            img.style.filter = `drop-shadow(100px 0 0 ${tintColor})`;
        });

        // Winter Theme Snowfall Engine
        updateWinterSnow(theme.name);

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
        const bg2 = color2 ? adjustHex(color2, 14) : "#0d0d12";
        const sec = color3 || color1;
        const btnBg = color2 ? adjustHex(color2, 8) : "#0e0e14";
        const themeName = name ? name.trim().slice(0, 20) : ("Custom " + (loadCustomThemes().length + 1));

        const theme = {
            name: themeName,
            description: `Custom 12AM colorway (${[color1, color2, color3].filter(Boolean).join(', ')})`,
            isCustom: true,
            "bg-primary": bg1,
            "bg-secondary": bg2,
            "text-primary": "#ffffff",
            "text-secondary": adjustHex(color1, 40),
            "accent-primary": color1,
            "accent-secondary": hexToRgba(sec, 0.45),
            "accent-glow": hexToRgba(sec, 0.35),
            "navbar-bg": hexToRgba(bg2, 0.88),
            "navbar-border": hexToRgba(color1, 0.28),
            "navbar-text": "#ffffff",
            "tab-active-bg": hexToRgba(color1, 0.18),
            "tab-active-text": color1,
            "tab-active-border": color1,
            "tab-hover-bg": "rgba(255, 255, 255, 0.05)",
            "tab-hover-text": "#ffffff",
            "button-bg": btnBg,
            "button-text": color1,
            "border-primary": hexToRgba(color1, 0.22),
            "border-secondary": "rgba(255, 255, 255, 0.06)",
            "avatar-gradient": `linear-gradient(135deg, ${color1} 0%, ${sec} 100%)`,
            "logo-src": "/images/logo.png"
        };
        saveCustomTheme(theme);
        return theme;
    }

    window.applyTheme = applyTheme;
    window.setThemeByName = setThemeByName;
    window.getThemes = () => allThemes;
    window.getCurrentTheme = () => currentTheme;
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
