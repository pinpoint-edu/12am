/**
 * 12AM Device Authentication
 * 
 * In-page modal authentication & device-bound profile system.
 * Zero redirects, persistent sessions, and clean minimal UI.
 */

(function() {
    const DB_NAME = '12AM_DeviceDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'device_account';
    const LS_USER_KEY = '12am_user';
    const LS_BOUND_KEY = '12am_device_account';
    const LS_LOGGED_OUT_KEY = '12am_logged_out';
    const LS_TOKEN_KEY = '12am_device_token';

    const SUPABASE_URL = "https://gsihkocouoigddbpahxd.supabase.co";
    const SUPABASE_KEY = "sb_publishable_oB5gQBtTFrhq6Vvas_938A_zq2DJVgL";

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function render12AMAvatar(user, size = 36, fontSize = '14px', radius = '12px') {
        if (!user) {
            return `<div class="pfp-squircle" style="width:${size}px; height:${size}px; border-radius:${radius}; background:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize};">?</div>`;
        }

        const type = user.avatar_type || user.pfpType || (user.mibiConfig ? 'mibi' : (user.avatar_url || user.avatar || user.pfp || localStorage.getItem('12am_profile_picture') ? 'image' : 'letter'));
        const imgUrl = user.avatar_url || user.avatar || user.pfp || user.photoURL || localStorage.getItem('12am_profile_picture');

        // Mibi Avatar Rendering
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
            return `<div class="pfp-squircle" style="width:${size}px; height:${size}px; border-radius:${radius}; background:${bg}; position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.16); flex-shrink:0;">
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
            return `<img src="${escapeHtml(imgUrl)}" alt="Avatar" class="pfp-squircle" style="width:${size}px; height:${size}px; border-radius:${radius}; object-fit:cover; display:block; border:1px solid rgba(255,255,255,0.16);" onerror="this.outerHTML='<div class=\\'pfp-squircle\\' style=\\'width:${size}px; height:${size}px; border-radius:${radius}; background:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize};\\'>${fallbackInitial}</div>'">`;
        }

        const rawLetters = user.avatar_letter || user.pfp_letter_char || user.letterAvatarText || (user.firstName || user.nickname || 'U')[0] || 'U';
        const letters = escapeHtml(String(rawLetters).slice(0, 3).toUpperCase());
        const bg = escapeHtml(user.avatar_bg || user.pfpLetterBg || user.pfp_letter_bg || '#000000');
        const color = escapeHtml(user.avatar_color || '#ffffff');

        return `<div class="pfp-squircle" style="width:${size}px; height:${size}px; border-radius:${radius}; background:${bg}; color:${color}; border:1px solid rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; font-weight:500; font-size:${fontSize}; text-transform:uppercase; letter-spacing:0.5px; user-select:none; flex-shrink:0;">${letters}</div>`;
    }
    window.render12AMAvatar = render12AMAvatar;

    // Generates or retrieves browser fingerprint token
    function getDeviceFingerprint() {
        let stored = null;
        try {
            stored = localStorage.getItem(LS_TOKEN_KEY);
        } catch(e) {}
        if (stored) return stored;

        const raw = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('###');

        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = ((hash << 5) - hash) + raw.charCodeAt(i);
            hash |= 0;
        }

        const token = '12AM_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
        try {
            localStorage.setItem(LS_TOKEN_KEY, token);
        } catch(e) {}
        return token;
    }

    // Open IndexedDB database for persistent device backup
    function openDB() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                resolve(null);
                return;
            }
            try {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            } catch(e) {
                resolve(null);
            }
        });
    }

    // Read bound account from IndexedDB
    async function idbGetAccount() {
        try {
            const db = await openDB();
            if (!db) return null;
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get('primary_device');
                req.onsuccess = () => resolve(req.result ? req.result.account : null);
                req.onerror = () => resolve(null);
            });
        } catch(e) {
            return null;
        }
    }

    // Save bound account to IndexedDB
    async function idbSaveAccount(account) {
        try {
            const db = await openDB();
            if (!db) return false;
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.put({
                    id: 'primary_device',
                    deviceToken: getDeviceFingerprint(),
                    account: account,
                    updatedAt: Date.now()
                });
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            });
        } catch(e) {
            return false;
        }
    }

    // Clear IndexedDB bound account
    async function idbClearAccount() {
        try {
            const db = await openDB();
            if (!db) return;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete('primary_device');
        } catch(e) {}
    }

    // Core 12AM Device Auth API
    window.TwelveAMAuth = {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
        getDeviceToken: getDeviceFingerprint,

        // Synchronously get currently active session (preserves unlock across reloads)
        getCurrentUser: function() {
            try {
                const u = JSON.parse(localStorage.getItem(LS_USER_KEY) || 'null');
                if (u && (u.nickname || u.firstName)) return u;

                // If user unlocked on this device and hasn't explicitly logged out, keep session alive
                const isLoggedOut = localStorage.getItem(LS_LOGGED_OUT_KEY) === 'true';
                if (!isLoggedOut) {
                    const bound = JSON.parse(localStorage.getItem(LS_BOUND_KEY) || 'null');
                    if (bound && (bound.nickname || bound.firstName)) {
                        localStorage.setItem(LS_USER_KEY, JSON.stringify(bound));
                        return bound;
                    }
                }
                return null;
            } catch(e) {
                return null;
            }
        },

        // Asynchronously get the account bound to this device
        getBoundDeviceAccount: async function() {
            try {
                const local = JSON.parse(localStorage.getItem(LS_BOUND_KEY) || 'null');
                if (local) return local;
            } catch(e) {}

            const idb = await idbGetAccount();
            if (idb) {
                try {
                    localStorage.setItem(LS_BOUND_KEY, JSON.stringify(idb));
                } catch(e) {}
                return idb;
            }
            return null;
        },

        // Register the account for this device
        registerAccount: async function({ firstName, lastName, nickname, pin }) {
            const token = getDeviceFingerprint();
            const account = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                nickname: nickname.trim(),
                pin: String(pin).trim(),
                deviceToken: token,
                createdAt: Date.now()
            };

            try {
                localStorage.setItem(LS_BOUND_KEY, JSON.stringify(account));
                localStorage.setItem(LS_USER_KEY, JSON.stringify(account));
                localStorage.removeItem(LS_LOGGED_OUT_KEY);
                localStorage.setItem(LS_TOKEN_KEY, token);
            } catch(e) {}

            await idbSaveAccount(account);
            return { success: true, account };
        },

        // Unlock account on this device
        loginAccount: async function(enteredPin) {
            const bound = await this.getBoundDeviceAccount();
            if (!bound) {
                return { success: false, error: "No account found." };
            }

            if (bound.pin !== String(enteredPin).trim()) {
                return { success: false, error: "Incorrect PIN." };
            }

            try {
                localStorage.setItem(LS_USER_KEY, JSON.stringify(bound));
                localStorage.removeItem(LS_LOGGED_OUT_KEY);
            } catch(e) {}

            return { success: true, account: bound };
        },

        // Log out active session
        logout: function() {
            try {
                localStorage.removeItem(LS_USER_KEY);
                localStorage.setItem(LS_LOGGED_OUT_KEY, 'true');
            } catch(e) {}
            window.location.reload();
        },

        // Complete device reset
        resetDevice: async function() {
            try {
                localStorage.removeItem(LS_USER_KEY);
                localStorage.removeItem(LS_BOUND_KEY);
                localStorage.removeItem(LS_LOGGED_OUT_KEY);
                localStorage.removeItem(LS_TOKEN_KEY);
            } catch(e) {}
            await idbClearAccount();
            return true;
        },

        // In-Page Auth Popup Modal (Over the current page, zero redirects)
        showAuthModal: async function(onSuccess) {
            // If already open, do not duplicate
            if (document.getElementById('12am-auth-overlay')) return;

            const bound = await this.getBoundDeviceAccount();

            // Style keyframes & inputs
            if (!document.getElementById('12am-auth-styles')) {
                const styleEl = document.createElement('style');
                styleEl.id = '12am-auth-styles';
                styleEl.textContent = `
                    @keyframes twelveAmFadeIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    #12am-auth-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: 9999999;
                        background: rgba(3, 3, 6, 0.88);
                        backdrop-filter: blur(28px);
                        -webkit-backdrop-filter: blur(28px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 1.25rem;
                        font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
                    }
                    .auth-modal-card {
                        background: var(--bg-card, #0c0c11);
                        border: 1px solid var(--navbar-border, rgba(255, 140, 0, 0.28));
                        border-radius: 26px;
                        max-width: 380px;
                        width: 100%;
                        padding: 2.25rem 2rem;
                        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85), 0 0 45px var(--accent-glow, rgba(255, 140, 0, 0.25));
                        color: #ffffff;
                        animation: twelveAmFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
                        box-sizing: border-box;
                        position: relative;
                    }
                    .auth-modal-close {
                        position: absolute;
                        top: 14px;
                        right: 14px;
                        background: transparent;
                        border: none;
                        color: #a1a1aa;
                        font-size: 15px;
                        width: 32px;
                        height: 32px;
                        border-radius: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.15s ease;
                    }
                    .auth-modal-close:hover {
                        color: #ffffff;
                        background: rgba(255, 255, 255, 0.08);
                    }
                    .auth-modal-input {
                        width: 100%;
                        height: 48px;
                        background: var(--bg-page, #060608);
                        border: 1px solid var(--border-main, rgba(255, 255, 255, 0.12));
                        border-radius: 16px;
                        color: #ffffff;
                        font-size: 0.95rem;
                        padding: 0 16px;
                        outline: none;
                        transition: border-color 0.2s, box-shadow 0.2s;
                        box-sizing: border-box;
                    }
                    .auth-modal-input:focus {
                        border-color: var(--accent-primary, #ff8800);
                        box-shadow: 0 0 0 3px var(--accent-secondary, rgba(255, 136, 0, 0.35));
                    }
                    .auth-modal-btn {
                        width: 100%;
                        height: 48px;
                        background: linear-gradient(135deg, var(--accent-primary, #ff8800) 0%, #ea580c 100%);
                        border: none;
                        border-radius: 16px;
                        color: #ffffff;
                        font-size: 0.95rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s ease;
                        margin-top: 6px;
                        box-shadow: 0 8px 24px var(--accent-secondary, rgba(255, 136, 0, 0.35));
                    }
                    .auth-modal-btn:hover {
                        background: linear-gradient(135deg, #ffa028 0%, #f97316 100%);
                        box-shadow: 0 12px 30px var(--accent-glow, rgba(255, 136, 0, 0.45));
                        transform: translateY(-1px);
                    }
                `;
                document.head.appendChild(styleEl);
            }

            const overlay = document.createElement('div');
            overlay.id = '12am-auth-overlay';

            const card = document.createElement('div');
            card.className = 'auth-modal-card';

            const prefix = window.location.pathname.includes('/logged-in/') ? '../' : '';
            const logoPath = `${prefix}images/logo.png`;

            if (bound) {
                // UNLOCK MODE (Theme Synced Squircle Card Styling with placeholder PFP)
                const displayName = bound.firstName ? `${bound.firstName} ${bound.lastName || ''}`.trim() : (bound.nickname || 'user');
                const handle = bound.nickname || 'user';
                card.innerHTML = `
                    <button type="button" class="auth-modal-close" id="modalCloseBtn" title="Close">✕</button>
                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 1.5rem;">
                        <img src="${logoPath}" alt="12AM" style="height: 20px; margin-bottom: 1.25rem; opacity: 0.95;" onerror="this.style.display='none'">
                        <div style="margin-bottom: 0.85rem; box-shadow: 0 12px 28px rgba(0,0,0,0.6);">
                            ${render12AMAvatar(bound, 64, '24px', '20px')}
                        </div>
                        <h2 style="font-size: 1.25rem; font-weight: 500; margin: 0 0 4px; color: #fff;">${escapeHtml(displayName)}</h2>
                        <p style="font-size: 0.85rem; color: var(--accent-primary, #ff8800); margin: 0; font-family: monospace; font-weight: 500;">@${escapeHtml(handle)}</p>
                    </div>

                    <form id="modalAuthForm" style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <input type="password" id="modalPinInput" class="auth-modal-input" placeholder="••••" maxlength="6" pattern="[0-9]{4,6}" inputmode="numeric" required style="text-align: center; letter-spacing: 0.4em; font-size: 1.35rem; font-family: monospace;" autofocus autocomplete="off">
                        </div>
                        <div id="modalAuthError" style="font-size: 0.8rem; color: #f87171; text-align: center; min-height: 18px;"></div>
                        <button type="submit" class="auth-modal-btn">
                            <span>Unlock Session</span>
                            <i class="fa-solid fa-arrow-right" style="font-size: 12px;"></i>
                        </button>
                    </form>

                    <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                        <button type="button" id="modalResetBtn" style="background: none; border: none; color: #71717a; font-size: 0.78rem; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#71717a'">Reset Account</button>
                    </div>
                `;

                overlay.appendChild(card);
                document.body.appendChild(overlay);

                const pinInput = document.getElementById('modalPinInput');
                if (pinInput) pinInput.focus();

                const closeBtn = document.getElementById('modalCloseBtn');
                if (closeBtn) closeBtn.addEventListener('click', () => overlay.remove());

                document.getElementById('modalAuthForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const errEl = document.getElementById('modalAuthError');
                    errEl.textContent = '';
                    const pin = pinInput.value.trim();

                    const res = await window.TwelveAMAuth.loginAccount(pin);
                    if (!res.success) {
                        errEl.textContent = res.error;
                        pinInput.value = '';
                        pinInput.focus();
                        return;
                    }

                    // Success: close modal smoothly
                    overlay.style.transition = 'opacity 0.2s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 200);

                    // Update navbar user pill
                    if (typeof window.__updateNavbarUser === 'function') {
                        window.__updateNavbarUser();
                    }

                    if (typeof onSuccess === 'function') {
                        onSuccess(res.account);
                    }
                });

                document.getElementById('modalResetBtn').addEventListener('click', async () => {
                    if (confirm("Reset account on this device?")) {
                        await window.TwelveAMAuth.resetDevice();
                        overlay.remove();
                        window.TwelveAMAuth.showAuthModal(onSuccess);
                    }
                });

            } else {
                // REGISTER MODE (Clean, minimal, squircle styling)
                card.innerHTML = `
                    <button type="button" class="auth-modal-close" id="modalCloseBtn" title="Close">✕</button>
                    <div style="text-align: center; margin-bottom: 1.25rem;">
                        <img src="${logoPath}" alt="12AM" style="height: 22px; margin: 0 auto 0.75rem; display: block; opacity: 0.95;" onerror="this.style.display='none'">
                        <h2 style="font-size: 1.2rem; font-weight: 500; margin: 0; color: #fff;">Create Account</h2>
                        <p style="font-size: 0.8rem; color: #a1a1aa; margin: 4px 0 0;">Bind a quick profile to this device</p>
                    </div>

                    <form id="modalRegisterForm" style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <input type="text" id="modalRegFirst" class="auth-modal-input" placeholder="First" required>
                            <input type="text" id="modalRegLast" class="auth-modal-input" placeholder="Last" required>
                        </div>
                        <input type="text" id="modalRegNick" class="auth-modal-input" placeholder="Nickname / Handle" required autocomplete="username">
                        <input type="password" id="modalRegPin" class="auth-modal-input" placeholder="PIN (4-6 digits)" maxlength="6" pattern="[0-9]{4,6}" inputmode="numeric" required style="font-family: monospace;">
                        <div id="modalAuthError" style="font-size: 0.78rem; color: #f87171; text-align: center; min-height: 16px;"></div>
                        <button type="submit" class="auth-modal-btn">
                            <span>Create Account</span>
                            <i class="fa-solid fa-arrow-right" style="font-size: 11px;"></i>
                        </button>
                    </form>
                `;

                overlay.appendChild(card);
                document.body.appendChild(overlay);

                const regCloseBtn = document.getElementById('modalCloseBtn');
                if (regCloseBtn) regCloseBtn.onclick = () => overlay.remove();

                document.getElementById('modalRegisterForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const errEl = document.getElementById('modalAuthError');
                    errEl.textContent = '';

                    const firstName = document.getElementById('modalRegFirst').value.trim();
                    const lastName = document.getElementById('modalRegLast').value.trim();
                    const nickname = document.getElementById('modalRegNick').value.trim();
                    const pin = document.getElementById('modalRegPin').value.trim();

                    if (!firstName || !lastName || !nickname || !pin) {
                        errEl.textContent = 'All fields are required.';
                        return;
                    }

                    if (!/^\d{4,6}$/.test(pin)) {
                        errEl.textContent = 'PIN must be 4 to 6 numbers.';
                        return;
                    }

                    const res = await window.TwelveAMAuth.registerAccount({ firstName, lastName, nickname, pin });
                    if (!res.success) {
                        errEl.textContent = res.error;
                        return;
                    }

                    overlay.style.transition = 'opacity 0.2s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 200);

                    if (typeof window.__updateNavbarUser === 'function') {
                        window.__updateNavbarUser();
                    }

                    if (typeof onSuccess === 'function') {
                        onSuccess(res.account);
                    }
                });
            }
        }
    };

    // Global helper for navbar logout
    window.logOut12AM = function() {
        window.TwelveAMAuth.logout();
    };

    // Auto-check on protected pages (Modal popup directly over current page, ZERO redirects)
    function enforcePageAuth() {
        try {
            const path = (window.location.pathname || '').toLowerCase();
            const fileName = path.split('/').filter(Boolean).pop() || '';
            const cleanName = fileName.replace(/\.html$/, '');

            const publicPages = ['index', 'legal', 'authentication', ''];
            const isPublic = publicPages.includes(cleanName);

            if (!isPublic) {
                const user = window.TwelveAMAuth.getCurrentUser();
                if (!user) {
                    // Show in-page popup modal directly over the current page
                    window.TwelveAMAuth.showAuthModal();
                }
            }
        } catch(e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforcePageAuth);
    } else {
        enforcePageAuth();
    }
})();
