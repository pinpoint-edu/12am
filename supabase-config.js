// 12AM Supabase Configuration
// Supports both standard <script> tags and ES module environments
(function() {
    const config = {
        url: "https://gsihkocouoigddbpahxd.supabase.co",
        anonKey: "sb_publishable_oB5gQBtTFrhq6Vvas_938A_zq2DJVgL"
    };

    if (typeof window !== 'undefined') {
        window.supabaseConfig = config;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { supabaseConfig: config };
    }
})();
