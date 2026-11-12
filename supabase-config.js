// 12AM Supabase Configuration
// Supports standard script tags, CommonJS, and ES Modules
export const supabaseConfig = {
    url: "https://gsihkocouoigddbpahxd.supabase.co",
    anonKey: "sb_publishable_oB5gQBtTFrhq6Vvas_938A_zq2DJVgL"
};

if (typeof window !== 'undefined') {
    window.supabaseConfig = supabaseConfig;
    if (typeof window.TwelveAMSupabase === 'undefined') {
        window.TwelveAMSupabase = {
            url: supabaseConfig.url,
            anonKey: supabaseConfig.anonKey
        };
    }
}

export default supabaseConfig;
