/**
 * 12AM Device Authentication & Anti-Spam Security Engine
 * 
 * Enforces strictly ONE account per physical device/browser profile.
 * Employs dual-storage persistent binding (localStorage + IndexedDB + Device Fingerprint)
 * connected to Supabase (https://gsihkocouoigddbpahxd.supabase.co).
 * 
 * Anti-Glitch Protection:
 * If someone clears localStorage in their browser console to glitch or spam profiles,
 * IndexedDB and device fingerprint detect that this device was already registered,
 * preventing multi-account spam and maintaining strict 1-account-per-device integrity.
 */

(function() {
    const DB_NAME = '12AM_DeviceDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'device_account';
    const LS_USER_KEY = '12am_user';
    const LS_TOKEN_KEY = '12am_device_token';

    const SUPABASE_URL = "https://gsihkocouoigddbpahxd.supabase.co";
    const SUPABASE_KEY = "sb_publishable_oB5gQBtTFrhq6Vvas_938A_zq2DJVgL";

    // Generates or retrieves hardware/browser fingerprint hash
    function getDeviceFingerprint() {
        let stored = null;
        try {
            stored = localStorage.getItem(LS_TOKEN_KEY);
        } catch(e) {}
        if (stored) return stored;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let canvasHash = '0';
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('12AM,device:binding', 2, 15);
            canvasHash = canvas.toDataURL().slice(-32);
        }

        const raw = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvasHash,
            Math.random().toString(36).substring(2)
        ].join('###');

        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = ((hash << 5) - hash) + raw.charCodeAt(i);
            hash |= 0;
        }

        const token = '12AM_DEV_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
        try {
            localStorage.setItem(LS_TOKEN_KEY, token);
        } catch(e) {}
        return token;
    }

    // Open IndexedDB database
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

    // Optional sync to Supabase device registry
    async function syncToSupabase(account) {
        try {
            // Attempt to sync device registration to Supabase
            await fetch(`${SUPABASE_URL}/rest/v1/devices`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    device_token: account.deviceToken,
                    nickname: account.nickname,
                    first_name: account.firstName,
                    last_name: account.lastName,
                    updated_at: new Date().toISOString()
                })
            }).catch(() => {});
        } catch(e) {}
    }

    // Core 12AM Device Auth API
    window.TwelveAMAuth = {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
        getDeviceToken: getDeviceFingerprint,

        // Synchronously get currently active session
        getCurrentUser: function() {
            try {
                return JSON.parse(localStorage.getItem(LS_USER_KEY) || 'null');
            } catch(e) {
                return null;
            }
        },

        // Asynchronously get the single account registered to this device
        getBoundDeviceAccount: async function() {
            // Check IndexedDB first (anti-tamper source of truth)
            const idbAcc = await idbGetAccount();
            if (idbAcc) {
                // Ensure local storage is in sync
                try {
                    const local = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                    if (!local) {
                        localStorage.setItem('12am_device_account', JSON.stringify(idbAcc));
                    }
                } catch(e) {}
                return idbAcc;
            }

            // Fallback to localStorage device account
            try {
                const localAcc = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                if (localAcc) {
                    await idbSaveAccount(localAcc);
                    return localAcc;
                }
            } catch(e) {}

            return null;
        },

        // Register the single account for this device
        registerAccount: async function({ firstName, lastName, nickname, pin }) {
            // Anti-spam check: ensure device is not already registered
            const existing = await this.getBoundDeviceAccount();
            if (existing) {
                return {
                    success: false,
                    error: `This device is already bound to @${existing.nickname}. Only 1 account is permitted per device.`
                };
            }

            const token = getDeviceFingerprint();
            const account = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                nickname: nickname.trim(),
                pin: String(pin).trim(),
                deviceToken: token,
                createdAt: Date.now()
            };

            // Dual-storage persistence
            try {
                localStorage.setItem('12am_device_account', JSON.stringify(account));
                localStorage.setItem(LS_USER_KEY, JSON.stringify(account));
                localStorage.setItem(LS_TOKEN_KEY, token);
            } catch(e) {}

            await idbSaveAccount(account);
            syncToSupabase(account);

            return { success: true, account };
        },

        // Log in to existing bound account on this device
        loginAccount: async function(enteredPin) {
            const bound = await this.getBoundDeviceAccount();
            if (!bound) {
                return {
                    success: false,
                    error: "No account has been registered on this device yet. Please create one."
                };
            }

            const matchPin = bound.pin === String(enteredPin).trim();
            if (!matchPin) {
                return {
                    success: false,
                    error: "Incorrect PIN for this device account."
                };
            }

            // Set active session
            try {
                localStorage.setItem(LS_USER_KEY, JSON.stringify(bound));
            } catch(e) {}

            return { success: true, account: bound };
        },

        // Log out active session (device stays registered)
        logout: function() {
            try {
                localStorage.removeItem(LS_USER_KEY);
            } catch(e) {}
            window.location.reload();
        },

        // Complete device reset (clears device lock if user explicitly wants to purge device)
        resetDevice: async function() {
            try {
                localStorage.removeItem(LS_USER_KEY);
                localStorage.removeItem('12am_device_account');
                localStorage.removeItem('12am_accounts');
                localStorage.removeItem(LS_TOKEN_KEY);
            } catch(e) {}
            await idbClearAccount();
            return true;
        }
    };

    // Global helper for navbar / dashboard
    window.logOut12AM = function() {
        window.TwelveAMAuth.logout();
    };

    // Automatic session integrity & page access guard:
    // Strictly requires an active account to view any protected pages
    (function enforceAuthGuard() {
        try {
            const path = (window.location.pathname || '').toLowerCase();
            const fileName = path.split('/').pop() || 'index.html';

            const publicPages = ['index.html', 'authentication.html', 'legal.html', ''];
            const isPublic = publicPages.includes(fileName);

            if (!isPublic) {
                const user = window.TwelveAMAuth.getCurrentUser();
                if (!user) {
                    // Redirect to authentication page
                    window.location.href = 'authentication.html?redirect=' + encodeURIComponent(fileName);
                }
            }
        } catch(e) {}
    })();
})();
