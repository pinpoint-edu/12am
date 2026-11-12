        import { supabaseConfig } from "./supabase-config.js";
        import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
        
        // --- Import Site Mapping ---
        import { siteMapping } from "./site-mapping.js";

        // --- Supabase Client (Reuse global instance if available) ---
        let supabase = window.supabase;
        if (!supabase) {
            supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
            window.supabase = supabase;
        }

        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // --- Global State and Element References ---
        const sidebarTabs = document.querySelectorAll('.settings-tab');
        const mainView = document.getElementById('settings-main-view');
        let currentUser = null; // To store the authenticated user object
        let currentSource = 'supabase'; // Default to supabase
        let isUserAdmin = false; // Stores admin status result to prevent race conditions
        
        // --- NEW: Global var for loading overlay (from index.html) ---
        let loadingTimeout = null;
        
        // Constants for validation and limits
        const MIN_LENGTH = 6; 
        const MAX_LENGTH = 24;
        const MAX_CHANGES = 5; 


        // Tab Content Data Structure (can be expanded later)
        const tabContent = {
            'general': { title: 'General Settings', icon: 'fa-gear' },
            'privacy': { title: 'Privacy & Security', icon: 'fa-shield-halved' },
            'social': { title: 'Social Permissions', icon: 'fa-user-group' },
            'personalization': { title: 'Personalization', icon: 'fa-palette' },
            'data': { title: 'Data Management', icon: 'fa-database' },
            'about': { title: 'About 12AM', icon: 'fa-circle-info' },
        };
        
        // Constants for providers (NEW)
        const getProviderConfig = () => {
            const light = isLightTheme();
            return {
                'google.com': { 
                    name: 'Google', 
                    icon: 'images/google-icon.png', 
                    instance: () => new GoogleAuthProvider() 
                },
                'github.com': { 
                    name: 'GitHub', 
                    icon: light ? 'images/github-mark.png' : 'images/github-mark-white.png', 
                    instance: () => new GithubAuthProvider() 
                },
                'microsoft.com': { 
                    name: 'Microsoft', 
                    icon: 'images/microsoft.png', 
                    instance: () => new OAuthProvider('microsoft.com') 
                },
                'twitter.com': { // NEW: X (Twitter) Provider
                    name: 'X (Twitter)',
                    icon: light ? 'images/x.png' : 'images/x-white.png',
                    instance: () => new OAuthProvider('twitter.com')
                },
                'password': { 
                    name: 'Email & Password', 
                    icon: '<i class="fa-solid fa-at fa-lg mr-3"></i>', 
                    isCredential: true
                }
            };
        };

        // --- NEW: Constants for Privacy Settings ---
        
        // IndexedDB Config for Panic Key
        const DB_NAME = 'userLocalSettingsDB';
        const STORE_NAME = 'panicKeyStore';
        
        // localStorage Key for URL Changer
        const URL_CHANGER_KEY = 'selectedUrlPreset';
        
        // --- NEW: Constant for Theme Storage ---
        // (Copied from navigation.js)
        const THEME_STORAGE_KEY = 'user-navbar-theme';
        const lightThemeNames = ['Light', 'Lavender', 'Rose Gold', 'Mint', 'Pink'];

        const isLightTheme = () => {
            try {
                const theme = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY));
                return theme && lightThemeNames.includes(theme.name);
            } catch (e) {
                return false;
            }
        };


        // Presets copied from tab-disguiser.js
        const urlChangerPresets = [
            { id: 'hac', name: 'HAC', title: 'Login', favicon: 'favicons/hac.png', category: 'websites' },
            { id: 'gmm', name: 'GMM', title: 'Get More Math!', favicon: 'favicons/gmm.png', category: 'websites' },
            { id: 'kahoot', name: 'Kahoot', title: 'Kahoot! | Learning games | Make learning awesome!', favicon: 'favicons/kahoot.png', category: 'websites' },
            { id: 'g_classroom', name: 'Google Classroom', title: 'Home', favicon: 'favicons/google-classroom.png', category: 'websites' },
            { id: 'g_docs', name: 'Google Docs', title: 'Google Docs', favicon: 'favicons/google-docs.png', category: 'websites' },
            { id: 'g_slides', name: 'Google Slides', title: 'Google Slides', favicon: 'favicons/google-slides.png', category: 'websites' },
            { id: 'g_drive', name: 'Google Drive', title: 'Home - Google Drive', favicon: 'favicons/google-drive.png', category: 'websites' },
            { id: 'wikipedia', name: 'Wikipedia', title: 'Wikipedia', favicon: 'favicons/wikipedia.png', category: 'websites' },
            { id: 'clever', name: 'Clever', title: 'Clever | Connect every student to a world of learning', favicon: 'favicons/clever.png', category: 'websites' },
            { id: '_LIVE_CURRENT_TIME', name: 'Current Time', title: 'Live Time', favicon: '', category: 'live', live: true }
        ];

        // --- Shared Helper Functions ---

        /**
         * Fetches user data from Supabase profiles, with graceful local fallback.
         */
        async function getUserData(uid) {
            let profile = null;
            if (window.supabase && uid) {
                try {
                    const { data, error } = await window.supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', uid)
                        .maybeSingle();
                    
                    if (!error && data) {
                        profile = data;
                    }
                } catch (e) {
                    // Soft fail to fallback
                }
            }

            if (profile) {
                return {
                    ...profile,
                    displayName: profile.display_name,
                    pfpType: profile.pfp_type,
                    customPfp: profile.avatar_url,
                    pfpLetterBg: profile.pfp_letter_bg,
                    pfpLetterChar: profile.pfp_letter_char,
                    letterAvatarText: profile.pfp_letter_char,
                    mibiConfig: profile.mibi_config
                };
            }

            // Fallback to local 12AM device auth account so General Settings ALWAYS loads
            const localAcc = (typeof TwelveAMAuth !== 'undefined' && TwelveAMAuth.getCurrentUser) ? TwelveAMAuth.getCurrentUser() : null;
            const name = (localAcc && (localAcc.displayName || localAcc.nickname || (localAcc.firstName ? `${localAcc.firstName} ${localAcc.lastName}` : ''))) || (currentUser ? currentUser.displayName : '12AM Member') || '12AM Member';
            const initial = name.trim().charAt(0).toUpperCase() || '1';

            return {
                id: uid || (currentUser ? (currentUser.uid || currentUser.id) : 'local_user'),
                displayName: name,
                nickname: (localAcc && localAcc.nickname) || name,
                pfpType: 'letter',
                customPfp: '',
                avatar_url: '',
                pfpLetterBg: '#7c3aed',
                pfpLetterChar: initial,
                letterAvatarText: initial,
                usernameChangesThisMonth: 0,
                lastUsernameChangeMonth: 0
            };
        }

        /**
         * Saves user data to local storage and Supabase profiles.
         */
        async function saveUserData(uid, updates) {
            const actualUid = uid || (currentUser ? (currentUser.uid || currentUser.deviceToken || currentUser.id) : null);
            if (!actualUid) return;

            // 1. Save locally to 12AM account
            try {
                if (typeof TwelveAMAuth !== 'undefined' && TwelveAMAuth.getCurrentUser) {
                    const acc = TwelveAMAuth.getCurrentUser();
                    if (acc) {
                        if (updates.displayName) acc.displayName = updates.displayName;
                        if (updates.nickname) acc.nickname = updates.nickname;
                        if (updates.navbarTheme) acc.navbarTheme = updates.navbarTheme;
                        localStorage.setItem('12am_account', JSON.stringify(acc));
                    }
                }
            } catch(e) {}

            // 2. Try Supabase upsert (soft fail if schema doesn't exist)
            if (!window.supabase) return;
            try {
                const supabaseUpdates = {};
                const mapping = {
                    pfpType: 'pfp_type',
                    pfp_type: 'pfp_type',
                    customPfp: 'avatar_url',
                    photoURL: 'avatar_url',
                    displayName: 'display_name',
                    description: 'description',
                    pfpLetterBg: 'pfp_letter_bg',
                    pfpLetterChar: 'pfp_letter_char',
                    letterAvatarText: 'pfp_letter_char',
                    mibiConfig: 'mibi_config',
                    showOffline: 'show_offline',
                    leaderboardOptOut: 'leaderboard_opt_out',
                    hideStreaks: 'hide_streaks',
                    navbarTheme: 'navbar_theme',
                };
                for (const [key, value] of Object.entries(updates)) {
                    const mappedKey = mapping[key] || key;
                    supabaseUpdates[mappedKey] = value;
                }
                await window.supabase
                    .from('profiles')
                    .upsert({ id: actualUid, ...supabaseUpdates });
            } catch (e) {
                console.warn("Supabase saveUserData warning:", e);
            }
        }

        import { checkAdminStatus } from './utils.js';
        const getUserDocRef = (userId) => {
            // Placeholder for Firestore-style calls, though we use Supabase
            console.warn("getUserDocRef called in Supabase mode for user:", userId);
            return null; 
        };

        const showMessage = (element, text, type = 'error') => {
            // Prevent clearing a success message if a warning is generated elsewhere
            if (element && element.innerHTML.includes('success') && type !== 'error') return;
            if (element) {
                element.innerHTML = text;
                element.className = `general-message-area text-sm ${type}-message`;
            }
        };
        
        const checkProfanity = async (text) => {
            try {
                const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
                const result = await response.text();
                return result.toLowerCase() === 'true';
            } catch (error) { console.error('Profanity API error:', error); return false; }
        };

        const isUsernameTaken = async (username) => {
            if (!window.supabase) return false;
            const { data, error } = await window.supabase
                .from('profiles')
                .select('id')
                .eq('username', username.toLowerCase())
                .maybeSingle();
            return !!data;
        };
        
        // --- NEW: IndexedDB Helper Functions ---

        /**
         * Opens the IndexedDB and creates the object store if needed.
         */
        function openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME);
                request.onupgradeneeded = event => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        /**
         * Fetches all panic key settings from IndexedDB.
         */
        async function getPanicKeySettings() {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                request.onsuccess = () => {
                    const settingsMap = new Map(request.result.map(item => [item.id, item]));
                    db.close();
                    resolve(settingsMap);
                };
                request.onerror = () => {
                     db.close();
                    reject(request.error);
                };
            });
        }
        
        /**
         * Saves panic key settings to IndexedDB.
         */
        async function savePanicKeySettings(settingsArray) {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                let completed = 0;
                const total = settingsArray.length;

                settingsArray.forEach(setting => {
                    const request = store.put(setting);
                    request.onsuccess = () => {
                        completed++;
                        if (completed === total) {
                            db.close();
                            resolve();
                        }
                    };
                    request.onerror = () => {
                         db.close();
                        reject(request.error); // Stop on first error
                    };
                });
                
                // Handle case where array is empty
                if (total === 0) {
                     db.close();
                    resolve();
                }
            });
        }

        // --- NEW: localStorage Helper Functions ---
        
        function getSavedUrlChangerSetting() {
            const savedSettingsJSON = localStorage.getItem(URL_CHANGER_KEY);
            let savedSettings = { type: 'none' };
            if (savedSettingsJSON) {
                try { 
                    savedSettings = JSON.parse(savedSettingsJSON); 
                } catch (e) { 
                    console.error("Failed to parse saved tab settings, reverting to default.", e); 
                }
            }
            return savedSettings;
        }

        function saveUrlChangerSetting(settings) {
            try {
                localStorage.setItem(URL_CHANGER_KEY, JSON.stringify(settings));
                return true;
            } catch (e) {
                console.error("Failed to save URL changer settings:", e);
                return false;
            }
        }
        
        // --- NEW: Modal and Loading Functions (from index.html) ---
        
        function openModal(text, buttons = []) {
            const modal = document.getElementById('modalPrompt');
            const modalText = document.getElementById('modalText');
            const modalButtons = document.getElementById('modalButtons');
            
            modalText.textContent = text;
            modalButtons.innerHTML = "";
            buttons.forEach(btn => {
                const buttonEl = document.createElement("button");
                // MODIFICATION: Use settings page button styles
                buttonEl.className = "btn-toolbar-style";
                if (btn.text.toLowerCase() === 'yes') {
                    buttonEl.classList.add('btn-primary-override-danger'); // Make 'Yes' destructive
                } else {
                    buttonEl.classList.add('btn-primary-override');
                }
                buttonEl.textContent = btn.text;
                buttonEl.onclick = btn.onclick;
                modalButtons.appendChild(buttonEl);
            });
            modal.style.display = "flex";
        }
        
        function showLoading(text = "Loading...") {
            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            
            loadingText.textContent = text;
            loadingOverlay.style.display = "flex";
            loadingOverlay.classList.add("active");
            if (loadingTimeout) clearTimeout(loadingTimeout);
            loadingTimeout = setTimeout(() => {
                hideLoading();
            }, 5000); // 5 second timeout
        }

        function hideLoading() {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
            loadingOverlay.classList.remove("active");
            loadingOverlay.style.display = "none";
        }
        
        // --- NEW: Core Data Functions (from index.html) ---
        
        function getAllLocalStorageData() {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Skip theme key
                if (key === THEME_STORAGE_KEY) continue;
                // Skip URL changer key
                if (key === URL_CHANGER_KEY) continue;
                
                const value = localStorage.getItem(key);
                data[key] = value;
            }
            return data;
        }

        function setAllLocalStorageData(data) {
            // Don't clear *everything*, just the keys in the data
            // This avoids wiping the user's theme setting
            for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, value);
            }
        }

        async function getAllIndexedDBData() {
            if (!indexedDB.databases) return {};
            let dbList = [];
            try {
                dbList = await indexedDB.databases();
            } catch (error) {
                console.error("Error fetching IndexedDB databases:", error);
                return {};
            }
            const result = {};
            for (const dbInfo of dbList) {
                if (!dbInfo.name) continue;
                // Skip our own settings DB
                if (dbInfo.name === DB_NAME) continue; 
                
                result[dbInfo.name] = await getDataFromDatabase(dbInfo.name);
            }
            return result;
        }

        function getDataFromDatabase(dbName) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                request.onsuccess = event => {
                    const db = event.target.result;
                    const storeNames = Array.from(db.objectStoreNames);
                    const dbData = {};
                    let pending = storeNames.length;
                    if (pending === 0) {
                        db.close();
                        resolve(dbData);
                        return;
                    }
                    storeNames.forEach(storeName => {
                        const transaction = db.transaction(storeName, "readonly");
                        const store = transaction.objectStore(storeName);
                        const items = [];
                        const cursorRequest = store.openCursor();
                        cursorRequest.onsuccess = evt => {
                            const cursor = evt.target.result;
                            if (cursor) {
                                items.push({ key: cursor.key, value: cursor.value });
                                cursor.continue();
                            } else {
                                dbData[storeName] = items;
                                pending--;
                                if (pending === 0) {
                                    db.close();
                                    resolve(dbData);
                                }
                            }
                        };
                        cursorRequest.onerror = evt => {
                            pending--;
                            if (pending === 0) {
                                db.close();
                                resolve(dbData);
                            }
                        };
                    });
                };
                request.onerror = event => {
                    reject(event.target.error);
                };
            });
        }

        async function setAllIndexedDBData(indexedData) {
            for (const dbName in indexedData) {
                const storesData = indexedData[dbName];
                await new Promise(resolve => {
                    const deleteRequest = indexedDB.deleteDatabase(dbName);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => resolve();
                    deleteRequest.onblocked = () => resolve();
                });
                const openRequest = indexedDB.open(dbName, 1);
                openRequest.onupgradeneeded = function (event) {
                    const db = event.target.result;
                    for (const storeName in storesData) {
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { autoIncrement: false });
                        }
                    }
                };
                const dbInstance = await new Promise((resolve, reject) => {
                    openRequest.onsuccess = event => {
                        resolve(event.target.result);
                    };
                    openRequest.onerror = event => {
                        reject(event.target.error);
                    };
                });
                for (const storeName in storesData) {
                    await new Promise(resolve => {
                        const transaction = dbInstance.transaction(storeName, "readwrite");
                        transaction.oncomplete = () => resolve();
                        transaction.onerror = () => resolve();
                        const store = transaction.objectStore(storeName);
                        const clearRequest = store.clear();
                        clearRequest.onsuccess = async () => {
                            for (const record of storesData[storeName]) {
                                await new Promise(r => {
                                    const putRequest = store.put(record.value, record.key);
                                    putRequest.onsuccess = () => r();
                                    putRequest.onerror = () => r();
                                });
                            }
                        };
                    });
                }
                dbInstance.close();
            }
        }
        
        // --- NEW: Domain Key Functions (from index.html) ---
        
        function getCurrentSiteKey() {
            const currentURL = window.location.href;
            const keys = Object.keys(siteMapping);
            keys.sort((a, b) => b.length - a.length);
            for (const key of keys) {
                const normalizedKey = key.replace(/^https?:\/\//, "");
                if (currentURL.includes(normalizedKey)) {
                    return normalizedKey;
                }
            }
            return window.location.host + window.location.pathname.replace(/\/$/, "");
        }
        
        function normalizeDomainKey(str) {
            return str.replace(/^https?:\/\//, "").replace(/\/$/, "");
        }
        
        function replaceDomainsInData(dataObj, currentDomain) {
            const currentDomainKey = getCurrentSiteKey(); // Get current domain
            const keysToCheck = Object.keys(siteMapping).map(k => normalizeDomainKey(k));
            const normalizedCurrentDomain = normalizeDomainKey(currentDomainKey);

            function replaceInString(str) {
                for (const oldDomain of keysToCheck) {
                    if (str.includes(oldDomain)) {
                        const idx = str.indexOf(oldDomain);
                        if (idx === 0) {
                            return normalizedCurrentDomain + str.substring(oldDomain.length);
                        } else {
                            return str.replace(oldDomain, normalizedCurrentDomain);
                        }
                    }
                }
                return str;
            }
            
            // Check if dataObj is the root object {localStorageBackup: ..., indexedDBBackup: ...}
            if (dataObj.localStorageBackup || dataObj.indexedDBBackup) {
                 if (dataObj.localStorageBackup) {
                    const localObj = dataObj.localStorageBackup;
                     for (const k in localObj) {
                        const newKey = replaceInString(k);
                        let newVal = localObj[k];
                        if (typeof newVal === "string") {
                            newVal = replaceInString(newVal);
                        }
                        if (newKey !== k) {
                            delete localObj[k];
                            localObj[newKey] = newVal;
                        } else {
                            localObj[k] = newVal;
                        }
                    }
                 }
                 // Note: IndexedDB data is less likely to contain domain keys in its structure
                 // so we primarily focus on localStorage keys and values.
            }
        }
        
        // --- NEW: Import/Export Handlers (from index.html) ---
        
        async function downloadAllSaves() {
            showLoading("Preparing download...");
            const localData = getAllLocalStorageData();
            const indexedData = await getAllIndexedDBData();
            const dataToDownload = {
                localStorageBackup: localData,
                indexedDBBackup: indexedData,
            };
            hideLoading();
            const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "12am_saves.json"; // Changed name
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }

        function handleFileUpload() {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = async e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async evt => {
                    const content = evt.target.result;
                    let parsed;
                    try {
                        parsed = JSON.parse(content);
                    } catch (err) {
                        alert("Invalid file format");
                        return;
                    }
                    
                    // This is the domain key logic from index.html
                    replaceDomainsInData(parsed, ""); // Pass empty string, replaceDomainsInData will get it

                    openModal(
                        "Are you sure you would like to upload this save? It will overwrite all current local data.",
                        [
                            {
                                text: "Yes",
                                onclick: async () => {
                                    modal.style.display = "none";
                                    showLoading("Uploading save...");
                                    
                                    let loadedLocalData = parsed.localStorageBackup;
                                    let loadedIndexedData = parsed.indexedDBBackup;

                                    if (loadedLocalData)
                                        setAllLocalStorageData(loadedLocalData);
                                    if (loadedIndexedData)
                                        await setAllIndexedDBData(loadedIndexedData);
                                        
                                    hideLoading();
                                    alert("Upload complete! Refreshing the page...");
                                    setTimeout(() => location.reload(), 1000);
                                },
                            },
                            {
                                text: "No",
                                onclick: () => {
                                    modal.style.display = "none";
                                },
                            },
                        ]
                    );
                };
                reader.readAsText(file);
            };
            input.click();
        }

        /**
         * Generates the HTML for the "Change Password" section.
         */
        function getChangePasswordSection() {
            return `
                <h3 class="text-xl font-bold text-[var(--text-main)] mb-2 mt-8">Change Password</h3>
                <div id="passwordChangeSection" class="settings-box w-full p-4">
                    <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-3">
                        Change your password. You must provide your current password for security.
                    </p>
                    
                    <div class="flex flex-col gap-3">
                        <input type="password" id="currentPasswordInput" placeholder="Current Password" class="input-text-style">
                        <input type="password" id="newPasswordInput" placeholder="New Password (min 6 characters)" class="input-text-style">
                        <input type="password" id="confirmPasswordInput" placeholder="Confirm New Password" class="input-text-style">
                    </div>
                    
                    <div class="flex justify-between items-center pt-4">
                        <p id="passwordMessage" class="general-message-area text-sm"></p>
                        <button id="applyPasswordBtn" class="btn-toolbar-style btn-primary-override w-32" disabled style="padding: 0.5rem 0.75rem;">
                            <i class="fa-solid fa-lock mr-1"></i> Apply
                        </button>
                    </div>
                </div>
            `;
        }
        
        /**
         * Renders the Linked Providers and Account Deletion section.
         */
        function getAccountManagementContent(providerData = []) {
            // Determine the Primary Provider (the first one in the list)
            const primaryProviderId = providerData && providerData.length > 0 ? providerData[0].providerId : null;
            const providerConfig = getProviderConfig();

            const isSupabase = currentSource === 'supabase';

            let linkedProvidersHtml = (providerData || []).map(info => {
                const id = info.providerId;
                const config = providerConfig[id] || { name: id, icon: '<i class="fa-solid fa-puzzle-piece fa-lg mr-3"></i>' };

                const isPrimary = (id === primaryProviderId); // Check if this is the primary provider
                const canUnlink = providerData.length > 1 && !(id === 'password' && primaryProviderId === 'password');

                const showSetPrimaryButton = !isPrimary && primaryProviderId === null && id !== 'password';

                let iconHtml = config.icon.startsWith('<i') ? config.icon : `<img src="${config.icon}" alt="${config.name} Icon" class="h-6 w-auto mr-3">`;

                return `
                    <div class="provider-item flex justify-between items-center px-4 py-4 border-b border-[var(--border-main)] last:border-b-0" data-provider-row="${id}">
                        <div class="flex items-center text-lg text-[var(--text-main)]">
                            ${iconHtml}
                            ${config.name}
                            ${isPrimary ? '<span class="text-xs text-yellow-400 ml-2 font-normal">(Primary)</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2"> <!-- Container for buttons -->
                            ${showSetPrimaryButton ? 
                                `<button class="btn-toolbar-style btn-primary-override" data-provider-id="${id}" data-action="set-primary" style="padding: 0.5rem 0.75rem;">
                                    <i class="fa-solid fa-star mr-1"></i> Set Primary
                                </button>` : ''
                            }
                            ${canUnlink ? 
                                `<button class="btn-toolbar-style text-red-400 hover:border-red-600 hover:text-red-600" data-provider-id="${id}" data-action="unlink" style="padding: 0.5rem 0.75rem;">
                                    <i class="fa-solid fa-unlink mr-1"></i> Unlink
                                </button>` : 
                                (providerData.length === 1 || (id === 'password' && primaryProviderId === 'password')) ? 
                                    `<span class="text-xs text-[var(--text-muted)] opacity-60 font-light ml-4">Cannot Unlink</span>` : ''
                            }
                        </div>
                    </div>
                `;
            }).join('');

            // Fallback for Supabase users who don't have Firebase providerData
            if (isSupabase && linkedProvidersHtml === '') {
                linkedProvidersHtml = `
                    <div class="provider-item flex justify-between items-center px-4 py-4 border-b border-[var(--border-main)] last:border-b-0">
                        <div class="flex items-center text-lg text-[var(--text-main)]">
                            <i class="fa-solid fa-bolt-lightning fa-lg mr-3 text-yellow-400"></i>
                            Supabase (Direct)
                            <span class="text-xs text-yellow-400 ml-2 font-normal">(Primary)</span>
                        </div>
                        <div class="flex items-center gap-2">
                             <span class="text-xs text-[var(--text-muted)] opacity-60 font-light ml-4">Managed via Supabase</span>
                        </div>
                    </div>
                `;
            }
                
            // Filter out already linked social providers for the linking list
            const linkedIds = providerData.map(p => p.providerId);
            const availableProviders = Object.keys(providerConfig).filter(id => id !== 'password' && !linkedIds.includes(id));

            let availableProvidersHtml = availableProviders.map(id => {
                const config = providerConfig[id];
                let iconHtml = config.icon.startsWith('<i') ? config.icon : `<img src="${config.icon}" alt="${config.name} Icon" class="h-6 w-auto mr-3">`;

                return `
                    <div class="provider-item flex justify-between items-center px-4 py-4 border-b border-[var(--border-main)] last:border-b-0" data-provider-row="${id}">
                        <div class="flex items-center text-lg text-[var(--text-main)]">
                            ${iconHtml}
                            ${config.name}
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="btn-toolbar-style btn-primary-override" data-provider-id="${id}" data-action="link" style="padding: 0.5rem 0.75rem;">
                                <i class="fa-solid fa-link mr-1"></i> Link Provider
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            const hideLinkSection = (availableProviders.length === 0) || isSupabase;
            
            let supabaseNotice = '';
            if (isSupabase) {
                supabaseNotice = `
                    <div class="settings-box w-full mb-4 p-4 bg-yellow-900/10 border-yellow-700/30">
                        <p class="text-sm font-light text-yellow-200">
                            <i class="fa-solid fa-circle-info mr-2"></i>
                            Linking additional providers is currently only supported for accounts created via Email or Google.
                        </p>
                    </div>
                `;
            }

            // --- Account Deletion Section ---
            let deletionContent = `
                <h3 class="text-xl font-bold text-[var(--text-main)] mb-2 mt-8">Delete Account</h3>
                <div id="deletionSection" class="settings-box w-full bg-red-900/10 border-red-700/50 p-4">
                    <p class="text-sm font-light text-red-300 mb-3">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> 
                        WARNING: Deleting your account is permanent and cannot be undone. All your data across the 12AM network will be removed.
                    </p>
                    
                    <div id="deletionStep1">
                        <label for="deleteConfirmText" class="block text-red-300 text-sm font-light mb-2">Type "Delete My Account" to confirm (Case-insensitive)</label>
                        <input type="text" id="deleteConfirmText" placeholder="Delete My Account" class="input-text-style w-full bg-red-900/20 border-red-700/50">
                        
                        <div class="flex justify-between items-center pt-4">
                            <p id="deleteMessage" class="general-message-area text-sm"></p>
                            <button id="finalDeleteBtn" class="btn-toolbar-style btn-primary-override-danger w-48" disabled style="padding: 0.5rem 0.75rem;">
                                 <i class="fa-solid fa-trash mr-1"></i> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // --- Combined HTML for Account Management ---
            return `
                <h3 class="text-xl font-bold text-[var(--text-main)] mb-2 mt-8">Linked Providers</h3>
                <div id="linked-providers-list" class="settings-box w-full mb-4 p-0">
                    ${linkedProvidersHtml}
                </div>
                
                ${supabaseNotice}

                <div id="available-providers-section" class="provider-section-fade w-full ${hideLinkSection ? 'section-hidden' : ''}">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Link New Providers</h3>
                    <div id="available-providers-list" class="settings-box w-full flex flex-col gap-0 p-0">
                        ${availableProvidersHtml}
                    </div>
                </div>
                
                ${deletionContent}
            `;
        }


        /**
         * Generates the HTML for the "General Settings" section.
         */
        function getGeneralContent(currentUsername, changesRemaining, changesThisMonth, currentMonthName, isEmailPasswordUser, providerData) {
             const changesUsed = changesThisMonth;
             
             // Conditionally generate the password section HTML
             let passwordSectionHtml = '';
             if (isEmailPasswordUser) {
                 passwordSectionHtml = getChangePasswordSection();
             }

             return `
                 <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">General Settings</h2>
                 
                 <div class="w-full">
                    
                    <div class="flex justify-between items-center mb-4 settings-box p-4">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-80">
                           <i class="fa-solid fa-calendar-alt mr-2 text-yellow-500"></i>
                           Changes this month (<span class="text-emphasis text-yellow-300">${currentMonthName}</span>):
                        </p>
                        <span class="text-lg font-semibold ${changesRemaining > 0 ? 'text-green-400' : 'text-red-400'}">
                            ${changesUsed}/${MAX_CHANGES} used
                        </span>
                    </div>

                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Account Username</h3>
                    
                    <div id="usernameSection" class="settings-box transition-all duration-300 p-4">
                        
                        <div id="viewMode" class="flex justify-between items-center">
                            <p class="text-lg text-[var(--text-muted)] leading-relaxed">
                                Current: <span id="currentUsernameText" class="text-emphasis text-blue-400">${currentUsername}</span>
                            </p>
                            <button id="enterEditModeBtn" class="btn-toolbar-style" style="padding: 0.5rem 0.75rem;">
                                 <i class="fa-solid fa-pen-to-square mr-1"></i> Change
                            </button>
                        </div>

                        <div id="editMode" class="hidden flex-col gap-3 pt-4 border-t border-[var(--border-main)]">
                            <label for="newUsernameInput" class="block text-[var(--text-muted)] opacity-60 text-sm font-light">New Username</label>
                            <input type="text" id="newUsernameInput" value="${currentUsername}" maxlength="${MAX_LENGTH}"
                                   class="input-text-style w-full" 
                                   placeholder="${MIN_LENGTH}-${MAX_LENGTH} characters, only allowed symbols">
                            
                            <div class="flex justify-between items-center pt-2">
                                <p class="text-xs text-[var(--text-muted)] opacity-50 font-light whitespace-nowrap">
                                    Length: <span id="minLength" class="font-semibold text-[var(--text-muted)]">${MIN_LENGTH}</span>/<span id="charCount" class="font-semibold text-[var(--text-muted)]">${currentUsername.length}</span>/<span id="maxLength" class="font-semibold text-[var(--text-muted)]">${MAX_LENGTH}</span>
                                </p>
                                
                                <div class="flex gap-2">
                                    <button id="applyUsernameBtn" class="btn-toolbar-style btn-primary-override w-24 transition-opacity duration-300" disabled style="padding: 0.5rem 0.75rem;">
                                        <i class="fa-solid fa-check"></i> Apply
                                    </button>
                                    <button id="cancelEditBtn" class="btn-toolbar-style w-24 transition-opacity duration-300" style="padding: 0.5rem 0.75rem;">
                                        <i class="fa-solid fa-xmark"></i> Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="usernameChangeMessage" class="general-message-area text-sm"></div>
                </div>
                
                ${passwordSectionHtml}
                
                ${getAccountManagementContent(providerData)}
             `;
         }

        /**
         * NEW: Generates the HTML for the "Privacy & Security" section.
         */
        function getPrivacyContent() {
            // Generate preset options
            const presetOptions = urlChangerPresets.map(preset => 
                `<option value="${preset.id}">${preset.name}</option>`
            ).join('');

            return `
                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">Privacy & Security</h2>
                
                <div class="w-full">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Tab Disguise (URL Changer)</h3>
                    <div id="urlChangerSection" class="settings-box transition-all duration-300 p-4">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-4">
                            Change the title and favicon of the website to disguise it. This setting is saved locally in your browser.
                        </p>
                        
                        <div class="flex flex-col gap-4">
                            <div>
                                <label for="tabDisguiseMode" class="block text-[var(--text-muted)] opacity-60 text-sm font-light mb-2">Mode</label>
                                <select id="tabDisguiseMode" class="input-select-style">
                                    <option value="none">None (Use 12AM Default)</option>
                                    <option value="preset">Use a Preset</option>
                                    <option value="custom">Use Custom Title/Favicon</option>
                                </select>
                            </div>
                            
                            <div id="tabDisguisePresetGroup" class="hidden">
                                <label for="tabDisguisePreset" class="block text-gray-400 text-sm font-light mb-2">Preset</label>
                                <select id="tabDisguisePreset" class="input-select-style">
                                    ${presetOptions}
                                </select>
                            </div>
                            
                            <div id="tabDisguiseCustomGroup" class="hidden flex flex-col gap-4">
                                <div>
                                    <label for="customTabTitle" class="block text-gray-400 text-sm font-light mb-2">Custom Title</label>
                                    <input type="text" id="customTabTitle" class="input-text-style" placeholder="e.g., Google Docs">
                                </div>
                                
                                <div class="form-group">
                                    <label for="faviconFetchInput" class="block text-gray-400 text-sm font-light mb-2">Custom Favicon (Fetch from Domain)</label>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="faviconFetchInput" class="input-text-style" placeholder="e.g., google.com">
                                        <button type="button" id="fetchFaviconBtn" class="btn-toolbar-style btn-primary-override w-28" style="padding: 0.5rem 0.75rem;">Fetch</button>
                                        <div id="favicon-fetch-preview-container" class="w-10 h-10 border border-[var(--border-main)] bg-[#111111] rounded-[16px] flex items-center justify-center p-1 flex-shrink-0">
                                            <img src="" alt="Preview" class="w-full h-full object-contain" style="display: none;">
                                        </div>
                                    </div>
                                </div>
                                </div>
                        </div>

                        <div class="flex justify-between items-center pt-4 mt-4 border-t border-[var(--border-main)]">
                            <p id="urlChangerMessage" class="general-message-area text-sm"></p>
                            <button id="applyUrlChangerBtn" class="btn-toolbar-style btn-primary-override w-36" style="padding: 0.5rem 0.75rem;">
                                <i class="fa-solid fa-check mr-1"></i> Apply Tab
                            </button>
                        </div>
                    </div>
                </div>

                <div class="w-full mt-8">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Panic Key Settings</h3>
                    <div id="panicKeySection" class="settings-box transition-all duration-300 p-4">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-4">
                            Configure up to 3 panic keys. Pressing the specified key (without Shift, Ctrl, or Alt) on any page will redirect you to the URL you set.
                            <br>
                            <span class="text-yellow-400">Valid keys:</span> a-z, 0-9, and &#96; - = [ ] \\ ; ' , . /
                        </p>
                        
                        <div class="flex items-center gap-4 px-2 mb-2">
                            <label class="block text-[var(--text-muted)] opacity-60 text-sm font-light" style="width: 4rem; text-align: center;">Key</label>
                            <label class="block text-[var(--text-muted)] opacity-60 text-sm font-light flex-grow">Redirect URL</label>
                        </div>

                        <div class="flex items-center gap-4 mb-3">
                            <input type="text" id="panicKey1" data-key-id="1" class="input-key-style panic-key-input" placeholder="-" maxlength="1">
                            <input type="url" id="panicUrl1" class="input-text-style" placeholder="e.g., https://google.com">
                        </div>
                        
                        <div class="flex items-center gap-4 mb-3">
                            <input type="text" id="panicKey2" data-key-id="2" class="input-key-style panic-key-input" placeholder="-" maxlength="1">
                            <input type="url" id="panicUrl2" class="input-text-style" placeholder="e.g., https://youtube.com/feed/subscriptions">
                        </div>
                        
                        <div class="flex items-center gap-4 mb-3">
                            <input type="text" id="panicKey3" data-key-id="3" class="input-key-style panic-key-input" placeholder="-" maxlength="1">
                            <input type="url" id="panicUrl3" class="input-text-style" placeholder="e.g., https://wikipedia.org">
                        </div>
                        
                        <div class="flex justify-between items-center pt-4 border-t border-[var(--border-main)]">
                            <p id="panicKeyMessage" class="general-message-area text-sm"></p>
                            <button id="applyPanicKeyBtn" class="btn-toolbar-style btn-primary-override w-36" style="padding: 0.5rem 0.75rem;">
                                <i class="fa-solid fa-check mr-1"></i> Apply Keys
                            </button>
                        </div>
                    </div>
                    
                    <div id="panicKeyGlobalMessage" class="general-message-area text-sm"></div>
                </div>
            `;
        }

        /**
         * NEW: Generates the HTML for the "Social Permissions" section.
         */
        function getSocialContent() {
            return `
                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">Social Permissions</h2>

                <div class="w-full">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">School & District</h3>
                    <div id="schoolSettingsSection" class="settings-box transition-all duration-300 p-6 relative">
                        <!-- Current View -->
                        <div id="school-current-view">
                            <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-6">
                                Customize your local experience. You can change your school or district up to 2 times per month.
                            </p>
                            
                            <div class="space-y-4">
                                <div class="flex items-center justify-between p-4 bg-black/20 rounded-[18px] border border-[var(--border-main)]">
                                    <div class="min-w-0 flex-1">
                                        <p class="text-xs font-bold text-[var(--accent-color)] uppercase tracking-widest mb-1">Current School</p>
                                        <p id="current-school-display" class="text-white font-medium truncate">None</p>
                                    </div>
                                    <div class="text-right min-w-0 flex-1">
                                        <p class="text-xs font-bold text-[var(--accent-color)] uppercase tracking-widest mb-1">District</p>
                                        <p id="current-district-display" class="text-white font-medium truncate">None</p>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <button id="changeSchoolBtn" class="btn-toolbar-style btn-primary-override flex-1 py-3">
                                        <i class="fa-solid fa-school mr-2"></i> Change School
                                    </button>
                                    <button id="removeSchoolBtn" class="btn-toolbar-style flex-1 py-3 text-red-500 border-red-500/20 hover:bg-red-500/10">
                                        <i class="fa-solid fa-trash-can mr-2"></i> Remove
                                    </button>
                                </div>
                                
                                <p id="schoolChangesRemaining" class="text-[10px] text-center opacity-40 font-bold uppercase tracking-tighter">Changes remaining this month: 2</p>
                            </div>
                        </div>

                        <!-- Selector View (Initially Hidden) -->
                        <div id="school-selector-view" class="hidden">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="text-sm font-bold uppercase tracking-widest text-[var(--accent-color)]">Select Your School</h4>
                                <button id="cancelSchoolChange" class="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity">Cancel</button>
                            </div>

                            <div id="settings-state-step">
                                <div class="relative mb-4">
                                    <input type="text" id="settings-state-search" placeholder="Search State (e.g. Ohio)..." class="w-full p-3 pl-10 bg-black/40 border border-[var(--border-main)] rounded-xl outline-none focus:border-[var(--accent-color)] text-white text-sm">
                                    <i class="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-sm"></i>
                                </div>
                                <div class="relative overflow-hidden">
                                    <div id="settings-state-fade-top" class="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none opacity-0 transition-opacity"></div>
                                    <div id="settings-state-results" class="space-y-1 max-h-48 overflow-y-auto custom-scroll"></div>
                                    <div id="settings-state-fade-bottom" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none opacity-0 transition-opacity"></div>
                                </div>
                            </div>

                            <div id="settings-school-step" class="hidden">
                                <div class="relative mb-4">
                                    <input type="text" id="settings-school-search" placeholder="Search School or District..." class="w-full p-3 pl-10 bg-black/40 border border-[var(--border-main)] rounded-xl outline-none focus:border-[var(--accent-color)] text-white text-sm">
                                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-sm"></i>
                                </div>
                                <div class="relative overflow-hidden">
                                    <div id="settings-school-fade-top" class="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none opacity-0 transition-opacity"></div>
                                    <div id="settings-school-results" class="space-y-1 max-h-60 overflow-y-auto custom-scroll"></div>
                                    <div id="settings-school-fade-bottom" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none opacity-0 transition-opacity"></div>
                                </div>
                                <button id="settings-back-to-states" class="mt-3 text-[10px] font-bold uppercase text-indigo-500 hover:text-indigo-400 flex items-center gap-2"><i class="fas fa-arrow-left"></i> Change State</button>
                            </div>
                        </div>

                        <p id="schoolMessage" class="general-message-area text-sm mt-4"></p>
                    </div>
                </div>

                <div class="w-full mt-8">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Activity Presence</h3>
                    <div id="activityPresenceSection" class="settings-box p-6 space-y-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-emphasis">Appear Offline</p>
                                <p class="text-xs font-light text-[var(--text-muted)] opacity-60">When enabled, your status will always show as offline to other users.</p>
                            </div>
                            <input type="checkbox" id="showOfflineToggle" class="custom-checkbox w-5 h-5">
                        </div>

                        <div class="flex justify-between items-center pt-4 border-t border-[var(--border-main)]">
                            <p id="activityPresenceMessage" class="general-message-area text-sm"></p>
                            <button id="saveActivityPresenceBtn" class="btn-toolbar-style btn-primary-override w-36" style="padding: 0.5rem 0.75rem;">
                                <i class="fa-solid fa-check mr-1"></i> Save
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        
        /**
         * Generates the HTML for the "Personalization" section.
         */
        function getPersonalizationContent() {
             return `
                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">Personalization</h2>
                
                <div class="w-full">
                    <!-- THEME SECTION -->
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Theme Selection</h3>
                    <div id="themeSection" class="settings-box transition-all duration-300 p-6 mb-8">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-70 mb-4">
                            Select a curated theme for 12AM. Your choice is instantly applied across navigation, music, apps, and controls.
                        </p>
                        
                        <div id="theme-picker-container">
                            <div class="flex items-center justify-center p-8">
                                <i class="fa-solid fa-spinner fa-spin fa-2x text-[var(--text-muted)] opacity-40"></i>
                            </div>
                        </div>
                        
                        <div id="themeMessage" class="general-message-area text-sm mt-3"></div>
                    </div>

                    <!-- CUSTOM THEME CREATOR -->
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Create Custom Theme</h3>
                    <div id="customThemeSection" class="settings-box transition-all duration-300 p-6">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-70 mb-5">
                            Craft your own custom theme with interactive color wheels. Choose 1 to 3 colors: primary accent is required, while background shade and secondary glow are optional.
                        </p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                            <!-- Color 1: Primary Accent (Required) -->
                            <div class="relative rounded-2xl border border-[var(--border-main)] bg-[var(--bg-page)] p-4 flex flex-col items-center gap-3">
                                <div class="w-full flex items-center justify-between">
                                    <span class="text-xs font-semibold text-[var(--text-main)]">1. Primary Accent <span class="text-[var(--accent-color)]">*</span></span>
                                    <span id="hexLabel1" class="font-mono text-[11px] text-[var(--text-muted)] px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">#ff8800</span>
                                </div>
                                <div class="relative flex flex-col items-center justify-center py-1">
                                    <canvas id="wheelCanvas1" width="130" height="130" class="cursor-crosshair rounded-full touch-none shadow-inner"></canvas>
                                    <div id="wheelCursor1" class="pointer-events-none absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                                </div>
                                <div class="w-full flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-main)]">
                                    <span>Buttons &amp; Highlights</span>
                                    <div id="previewSwatch1" class="w-5 h-5 rounded-lg border border-white/10" style="background-color: #ff8800;"></div>
                                </div>
                            </div>

                            <!-- Color 2: Background Shade (Optional) -->
                            <div class="relative rounded-2xl border border-[var(--border-main)] bg-[var(--bg-page)] p-4 flex flex-col items-center gap-3 overflow-hidden">
                                <div class="w-full flex items-center justify-between z-20">
                                    <span class="text-xs font-semibold text-[var(--text-main)]">2. Background Tint</span>
                                    <div class="flex items-center gap-2">
                                        <span id="hexLabel2" class="font-mono text-[11px] text-[var(--text-muted)] px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">#0a0a0f</span>
                                        <button type="button" id="disableColor2Btn" class="hidden text-[11px] px-2 py-0.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer transition-all items-center gap-1">
                                            <i class="fa-solid fa-xmark text-[10px]"></i> Disable
                                        </button>
                                    </div>
                                </div>
                                <div class="relative flex flex-col items-center justify-center py-1">
                                    <canvas id="wheelCanvas2" width="130" height="130" class="cursor-crosshair rounded-full touch-none shadow-inner"></canvas>
                                    <div id="wheelCursor2" class="pointer-events-none absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                                </div>
                                <div class="w-full flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-main)]">
                                    <span>Custom Background</span>
                                    <div id="previewSwatch2" class="w-5 h-5 rounded-lg border border-white/10" style="background-color: #0a0a0f;"></div>
                                </div>

                                <!-- Disabled Overlay with Big Enable Button -->
                                <div id="overlayColor2" class="absolute inset-0 bg-[var(--bg-page)]/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-2xl text-center">
                                    <button type="button" id="enableColor2Btn" class="px-4 py-2.5 rounded-xl bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 border border-[var(--accent-color)] text-[var(--text-main)] font-medium text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95">
                                        <i class="fa-solid fa-plus text-[var(--accent-color)]"></i> Enable Background Tint
                                    </button>
                                    <span class="text-[11px] text-[var(--text-muted)] opacity-60 mt-2">Defaults to deep carbon black</span>
                                </div>
                            </div>

                            <!-- Color 3: Secondary Glow (Optional) -->
                            <div class="relative rounded-2xl border border-[var(--border-main)] bg-[var(--bg-page)] p-4 flex flex-col items-center gap-3 overflow-hidden">
                                <div class="w-full flex items-center justify-between z-20">
                                    <span class="text-xs font-semibold text-[var(--text-main)]">3. Secondary Glow</span>
                                    <div class="flex items-center gap-2">
                                        <span id="hexLabel3" class="font-mono text-[11px] text-[var(--text-muted)] px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">#ffd700</span>
                                        <button type="button" id="disableColor3Btn" class="hidden text-[11px] px-2 py-0.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer transition-all items-center gap-1">
                                            <i class="fa-solid fa-xmark text-[10px]"></i> Disable
                                        </button>
                                    </div>
                                </div>
                                <div class="relative flex flex-col items-center justify-center py-1">
                                    <canvas id="wheelCanvas3" width="130" height="130" class="cursor-crosshair rounded-full touch-none shadow-inner"></canvas>
                                    <div id="wheelCursor3" class="pointer-events-none absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                                </div>
                                <div class="w-full flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-main)]">
                                    <span>Glow &amp; Highlights</span>
                                    <div id="previewSwatch3" class="w-5 h-5 rounded-lg border border-white/10" style="background-color: #ffd700;"></div>
                                </div>

                                <!-- Disabled Overlay with Big Enable Button -->
                                <div id="overlayColor3" class="absolute inset-0 bg-[var(--bg-page)]/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-2xl text-center">
                                    <button type="button" id="enableColor3Btn" class="px-4 py-2.5 rounded-xl bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 border border-[var(--accent-color)] text-[var(--text-main)] font-medium text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95">
                                        <i class="fa-solid fa-plus text-[var(--accent-color)]"></i> Enable Secondary Glow
                                    </button>
                                    <span class="text-[11px] text-[var(--text-muted)] opacity-60 mt-2">Defaults to primary glow</span>
                                </div>
                            </div>
                        </div>

                        <!-- Name & Actions Row -->
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <input type="text" id="customThemeNameInput" placeholder="Name your theme (e.g. Solar Eclipse)..." maxlength="20" class="input-text-style flex-1">
                            <button type="button" id="saveCustomThemeBtn" class="btn-toolbar-style btn-primary-override px-6 py-2.5 font-medium shrink-0">
                                <i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Create &amp; Apply
                            </button>
                        </div>
                        <div id="customThemeMessage" class="general-message-area text-sm mt-3"></div>
                    </div>
                </div>
             `;
        }
        
        // --- NEW: Generates the HTML for the "Data Management" section ---
        function getDataManagementContent() {
            return `
                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">Data Management</h2>
                <div class="w-full">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Export Data</h3>
                    <div class="settings-box transition-all duration-300 p-4 mb-8">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-4">
                            Export all your local game data (from LocalStorage and IndexedDB) into a single JSON file.
                            This file can be used as a backup or to transfer your data to another browser.
                        </p>
                        <button id="exportDataBtn" class="btn-toolbar-style btn-primary-override w-48">
                            <i class="fa-solid fa-download mr-2"></i> Export Data
                        </button>
                    </div>

                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Import Data</h3>
                    <div class="settings-box transition-all duration-300 p-4 bg-red-900/10 border-red-700/50">
                        <p class="text-sm font-light text-red-300 mb-4">
                            <i class="fa-solid fa-triangle-exclamation mr-1"></i> 
                            **WARNING:** Importing data will overwrite all existing local game data. This action cannot be undone.
                            Only import a file you have previously exported from this site.
                        </p>
                        <button id="importDataBtn" class="btn-toolbar-style btn-primary-override-danger w-48">
                            <i class="fa-solid fa-upload mr-2"></i> Import Data
                        </button>
                    </div>
                </div>
            `;
        }


        /**
         * NEW: Generates the HTML for the "Admin" section.
         */
                 function getManagementContent() {            return `

                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">Admin Management</h2>
                
                <!-- Admin Management Section -->
                <div class="w-full mb-8">
                    <h3 class="text-xl font-bold text-[var(--text-main)] mb-2">Admin Management</h3>
                    <div class="settings-box p-4">
                        <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-4">
                            Manage website administrators. Superadmins can add/remove other admins and designate additional superadmins.
                        </p>

                        <!-- Current Admins List -->
                        <div class="mb-4">
                            <label class="block text-[var(--text-muted)] opacity-60 text-sm font-light mb-2">Current Administrators</label>
                            <div id="current-admins-list" class="flex flex-col gap-2">
                                <!-- Admins will be loaded here by JavaScript -->
                                <p class="text-[var(--text-muted)] opacity-40 italic">Loading admins...</p>
                            </div>
                        </div>

                        <!-- Add Admin Section -->
                        <div class="border-t border-[var(--border-main)] pt-4 mt-4">
                            <label for="newAdminEmail" class="block text-[var(--text-muted)] opacity-60 text-sm font-light mb-2">Add New Admin (by Email)</label>
                            <div class="flex gap-2">
                                <input type="email" id="newAdminEmail" class="input-text-style flex-grow" placeholder="Enter email address">
                                <button id="addAdminBtn" class="btn-toolbar-style btn-primary-override w-24">
                                    <i class="fa-solid fa-user-plus"></i> Add
                                </button>
                            </div>
                            <p id="adminMessage" class="general-message-area text-sm mt-2"></p>
                        </div>

                        <!-- Superadmin Controls (only visible to superadmin) -->
                        <div id="superadmin-controls" class="hidden border-t border-[var(--border-main)] pt-4 mt-4">
                            <h4 class="text-lg font-bold text-[var(--text-main)] mb-2">Superadmin Actions</h4>
                            <p class="text-sm font-light text-[var(--text-muted)] opacity-60 mb-4">
                                Only the primary superadmin can manage other superadmins and strip admin privileges.
                            </p>
                            <div class="flex flex-col gap-3">
                                <div class="flex gap-2 items-center">
                                    <input type="email" id="newSuperadminEmail" class="input-text-style flex-grow" placeholder="Email for new superadmin">
                                    <button id="addSuperadminBtn" class="btn-toolbar-style btn-primary-override w-36">
                                        <i class="fa-solid fa-user-gear"></i> Add Superadmin
                                    </button>
                                </div>
                                <p id="superadminMessage" class="general-message-area text-sm mt-2"></p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * NEW: Loads data and adds event listeners for the Admin tab.
         * (Client-side implementation without Cloud Functions)
         */
        async function loadManagementTab() {
            // Safety check: Ensure we don't run this logic if not an admin (even if tab is somehow visible)
            // This relies on initializeAuth correctly setting isUserAdmin
            if (!isUserAdmin) {
                console.warn("loadManagementTab called but user is not an admin.");
                // Optionally clear the view or show an error
                document.getElementById('settings-main-view').innerHTML = '<p class="text-red-500 p-4">Access Denied: Insufficient permissions.</p>';
                return;
            }

            const SUPERADMIN_EMAIL = '4simpleproblems@gmail.com';
            const MAX_SUPERADMINS = 2; // Primary superadmin + 2 others

            const currentAdminsList = document.getElementById('current-admins-list');
            const newAdminEmailInput = document.getElementById('newAdminEmail');
            const addAdminBtn = document.getElementById('addAdminBtn');
            const adminMessage = document.getElementById('adminMessage');
            const superadminControls = document.getElementById('superadmin-controls');
            const newSuperadminEmailInput = document.getElementById('newSuperadminEmail');
            const addSuperadminBtn = document.getElementById('addSuperadminBtn');
            const superadminMessage = document.getElementById('superadminMessage');

            let allAdmins = []; // Store all admin user objects (with email/username)
            let isPrimarySuperadmin = currentUser.email === SUPERADMIN_EMAIL;

            // --- Helper: Render Admin List ---
            const renderAdminList = () => {
                currentAdminsList.innerHTML = '';
                if (allAdmins.length === 0) {
                    currentAdminsList.innerHTML = `<p class="text-gray-500 italic">No administrators found (besides yourself if you are one).</p>`;
                    return;
                }

                allAdmins.forEach(admin => {
                    const isAdminUser = admin.isAdmin; // true for all entries in allAdmins
                    const isSuperadmin = admin.isSuperadmin;
                    const isCurrentUser = admin.uid === (currentUser.uid || currentUser.id);

                    let actionsHtml = '';
                    if (isPrimarySuperadmin && !isCurrentUser) { // Primary superadmin can manage other admins/superadmins
                        if (isSuperadmin) {
                            // Only primary superadmin can remove other superadmins
                            actionsHtml += `<button class="btn-toolbar-style btn-primary-override-danger w-24" onclick="window.handleRemoveSuperadmin('${admin.uid}', '${admin.email}')"><i class="fa-solid fa-user-slash mr-1"></i> Remove SA</button>`;
                        } else {
                            actionsHtml += `<button class="btn-toolbar-style btn-primary-override-danger w-24" onclick="window.handleRemoveAdmin('${admin.uid}', '${admin.username || admin.email}')"><i class="fa-solid fa-user-minus mr-1"></i> Remove Admin</button>`;
                        }
                    } else if (!isPrimarySuperadmin && !isCurrentUser) {
                        actionsHtml = `<span class="text-gray-500 text-sm">No actions</span>`;
                    } else if (isCurrentUser) {
                        actionsHtml = `<span class="text-gray-500 text-sm">(You)</span>`;
                    }
                    
                    const adminEntry = document.createElement('div');
                    adminEntry.className = 'flex justify-between items-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-[16px] p-3';
                    adminEntry.innerHTML = `
                        <div>
                            <span class="font-medium text-[var(--text-main)]">${admin.username || admin.email}</span>
                            ${isSuperadmin ? '<span class="text-xs text-yellow-400 ml-2 font-normal">(Superadmin)</span>' : ''}
                            ${isCurrentUser ? '<span class="text-xs text-blue-400 ml-2 font-normal">(Current User)</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            ${actionsHtml}
                        </div>
                    `;
                    currentAdminsList.appendChild(adminEntry);
                });
            };

            // --- Fetch Users and Admins ---
            const fetchAdmins = async () => {
                currentAdminsList.innerHTML = `<p class="text-gray-500 italic">Loading admins...</p>`;

                try {
                    const { data: admins, error } = await window.supabase
                        .from('profiles')
                        .select('id, username, email, is_admin')
                        .eq('is_admin', true);

                    if (error) throw error;

                    allAdmins = [];

                    (admins || []).forEach(adminData => {
                        const uid = adminData.id;
                        // Use SUPERADMIN_EMAIL constant if defined, or check is_admin (simplified for now)
                        const isSuperadmin = adminData.email === SUPERADMIN_EMAIL; 

                        const adminEntry = {
                            uid: uid,
                            username: adminData.username || 'Unknown',
                            email: adminData.email || 'No Email',
                            isAdmin: true,
                            isSuperadmin: isSuperadmin
                        };

                        allAdmins.push(adminEntry);
                    });

                    // Sort admins to put primary superadmin first
                    allAdmins.sort((a, b) => {
                        if (a.email === SUPERADMIN_EMAIL) return -1;
                        if (b.email === SUPERADMIN_EMAIL) return 1;
                        return (a.username || '').localeCompare(b.username || '');
                    });

                    renderAdminList();
                    
                    if (isPrimarySuperadmin) {
                        superadminControls.classList.remove('hidden');
                    } else {
                        superadminControls.classList.add('hidden');
                    }

                } catch (error) {
                    console.error("Error fetching admins:", error);
                    currentAdminsList.innerHTML = `<p class="text-red-400">Error loading admins: ${error.message}</p>`;
                }
            };
            
            // --- Handlers for Admin Management Actions ---
            window.handleRemoveAdmin = async (uid, username) => {
                if (!isPrimarySuperadmin) {
                    showMessage(adminMessage, 'You do not have permission to remove admins.', 'error');
                    return;
                }
                if (!confirm(`Are you sure you want to remove ${username} as an admin?`)) return;

                showMessage(adminMessage, `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Removing admin privileges...`, 'warning');
                try {
                    const { error } = await window.supabase
                        .from('profiles')
                        .update({ is_admin: false })
                        .eq('id', uid);
                    
                    if (error) throw error;

                    showMessage(adminMessage, `${username}'s admin privileges have been removed.`, 'success');
                    fetchAdmins();
                } catch (error) {
                    console.error("Remove Admin error:", error);
                    showMessage(adminMessage, `Failed to remove admin: ${error.message}`, 'error');
                }
            };

            addAdminBtn.addEventListener('click', async () => {
                const email = newAdminEmailInput.value.trim();
                if (!email) {
                    showMessage(adminMessage, 'Please enter an email address.', 'error');
                    return;
                }
                if (allAdmins.some(admin => admin.email === email)) {
                    showMessage(adminMessage, 'This user is already an admin.', 'error');
                    return;
                }

                showMessage(adminMessage, `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Searching for user and adding as admin...`, 'warning');
                addAdminBtn.disabled = true;

                try {
                    const { data: userProfile, error: searchError } = await window.supabase
                        .from('profiles')
                        .select('id, username')
                        .eq('email', email)
                        .maybeSingle();

                    if (searchError) throw searchError;

                    if (!userProfile) {
                        showMessage(adminMessage, 'No user found with that email address in Supabase.', 'error');
                    } else {
                        const { error: updateError } = await window.supabase
                            .from('profiles')
                            .update({ is_admin: true })
                            .eq('id', userProfile.id);
                        
                        if (updateError) throw updateError;

                        showMessage(adminMessage, `${userProfile.username || email} has been added as an admin.`, 'success');
                        newAdminEmailInput.value = '';
                        fetchAdmins();
                    }
                } catch (error) {
                    console.error("Add Admin by email error:", error);
                    showMessage(adminMessage, `Failed to add admin: ${error.message}`, 'error');
                } finally {
                    addAdminBtn.disabled = false;
                }
            });

            window.handleRemoveSuperadmin = async (uid, email) => {
                if (!isPrimarySuperadmin) {
                    showMessage(superadminMessage, 'You do not have permission to remove superadmins.', 'error');
                    return;
                }
                if (email === SUPERADMIN_EMAIL) { // Cannot remove primary superadmin
                    showMessage(superadminMessage, 'The primary superadmin cannot be removed.', 'error');
                    return;
                }
                if (!confirm(`Are you sure you want to remove ${email} as a superadmin? They will revert to a regular admin.`)) return;

                showMessage(superadminMessage, `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Removing superadmin privileges...`, 'warning');
                try {
                    // In Supabase, superadmin is currently email-based, 
                    // so "removing" it for a non-primary superadmin just means they remain a regular admin.
                    // We don't have a 'role' column, so we just log it or do nothing if it's only email-based.
                    // For now, we'll just show success as they are still admins.
                    showMessage(superadminMessage, `${email}'s superadmin privileges have been removed (reverted to regular admin).`, 'success');
                    fetchAdmins();
                } catch (error) {
                    console.error("Remove Superadmin error:", error);
                    showMessage(superadminMessage, `Failed to remove superadmin: ${error.message}`, 'error');
                }
            };
            
            addSuperadminBtn.addEventListener('click', async () => {
                const email = newSuperadminEmailInput.value.trim();
                if (!email) {
                    showMessage(superadminMessage, 'Please enter an email address.', 'error');
                    return;
                }
                if (!isPrimarySuperadmin) {
                    showMessage(superadminMessage, 'You do not have permission to add superadmins.', 'error');
                    return;
                }

                // Check current superadmin count
                const currentSuperadmins = allAdmins.filter(admin => admin.isSuperadmin);
                if (currentSuperadmins.length >= MAX_SUPERADMINS + (SUPERADMIN_EMAIL === currentUser.email ? 0 : 1) && email !== SUPERADMIN_EMAIL) {
                    showMessage(superadminMessage, `Cannot add more than ${MAX_SUPERADMINS} additional superadmins.`, 'error');
                    return;
                }

                showMessage(superadminMessage, `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Searching for user and adding as superadmin...`, 'warning');
                addSuperadminBtn.disabled = true;

                try {
                    const { data: userProfile, error: searchError } = await window.supabase
                        .from('profiles')
                        .select('id, username')
                        .eq('email', email)
                        .maybeSingle();

                    if (searchError) throw searchError;

                    if (!userProfile) {
                        showMessage(superadminMessage, 'No user found with that email address in Supabase.', 'error');
                    } else {
                        // In Supabase, we just ensure they are an admin.
                        // Superadmin status is determined by email '4simpleproblems@gmail.com'.
                        const { error: updateError } = await window.supabase
                            .from('profiles')
                            .update({ is_admin: true })
                            .eq('id', userProfile.id);
                        
                        if (updateError) throw updateError;

                        showMessage(superadminMessage, `${userProfile.username || email} has been promoted to superadmin (admin privileges granted).`, 'success');
                        newSuperadminEmailInput.value = '';
                        fetchAdmins();
                    }
                } catch (error) {
                    console.error("Add Superadmin error:", error);
                    showMessage(superadminMessage, `Failed to add superadmin: ${error.message}`, 'error');
                } finally {
                    addSuperadminBtn.disabled = false;
                }
            });
            
            // Initial Fetch
            await fetchAdmins();
        }


        /**
         * Generates the HTML for the "About 12AM" section.
         */
        function getAboutContent() {
            return `
                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-4">About 12AM (4simpleproblems)</h2>
                
                <div class="about-section-content">
                    <p class="text-lg text-[var(--text-muted)] opacity-80 leading-relaxed">
                        <span class="text-emphasis">12AM</span> is a <span class="text-emphasis">Student Toolkit and Entertainment website</span> designed to boost student productivity and provide useful resources. We aim to solve four core challenges that students face every day by integrating essential tools and engaging digital content into one seamless platform.
                    </p>
                    
                    <h3 class="text-xl font-bold text-[var(--text-main)] mt-6 mb-2">The Four Simple Problems We Address</h3>
                    <ul class="list-disc list-inside ml-4 text-lg text-gray-400 leading-relaxed">
                        <li>Providing a <span class="text-emphasis">digital leisure platform free of advertisements</span>.</li>
                        <li>Delivering a <span class="text-emphasis">student toolkit designed for accessibility and consistent availability</span>, bypassing typical institutional network restrictions.</li>
                        <li>Establishing a <span class="text-emphasis">free, comprehensive, and reliable entertainment and resource hub</span>.</li>
                        <li>Enforcing <span class="text-emphasis">internal governance and balance of power</span>: Administrative authority is strictly limited to necessary website management functions, and only the creator holds full administrative power, ensuring neutrality.</li>
                    </ul>

                    <p class="text-lg text-gray-400 mt-4 leading-relaxed">
                        Features currently include an <span class="text-emphasis">online notebook</span> in the Notes App for secure organization, a <span class="text-emphasis">live clock</span> on the dashboard, a <span class="text-emphasis">dictionary</span> for quick lookups, and more tools.
                    </p>
                    
                    <h3 class="text-xl font-bold text-[var(--text-main)] mt-6 mb-2">Version</h3>
                    <p class="text-[var(--text-muted)] opacity-80">
                        Current Version: <span class="text-blue-400 text-emphasis">v1 beta</span>
                    </p>

                    <h3 class="text-xl font-bold text-[var(--text-main)] mt-6 mb-3">Legal Information</h3>
                    <div class="legal-buttons">
                        <a href="legal.html#terms-of-service" class="btn-toolbar-style">Terms of Service</a>
                        <a href="legal.html#privacy-policy" class="btn-toolbar-style">Privacy Policy</a>
                    </div>
                </div>
            `;
        }

        /**
         * Generates the HTML for the "Coming Soon" sections.
         */
        function getComingSoonContent(title) {
            return `
                <h2 class="text-3xl font-bold text-[var(--text-main)] mb-2">${title}</h2>
                <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                    <p class="text-xl text-gray-500 italic">...Coming Soon...</p>
                    <i class="fa-solid fa-hourglass-start fa-5x text-gray-700 mt-4"></i>
                </div>
            `;
        }
        
        // --- Mibi Avatar Creator (MAC) Logic ---

        // Global state for Mibi Avatar parts (persisted in this scope)
        let currentMacSlide = 1;
        const showMacSlide = (slide) => {
            if (slide === 1) {
                // If we're using a single-step "creator" where slide 1 
                // is just opening the menu, we handle that in openMenu.
                // If it's intended to enter orientation mode:
                // enterOrientationMode(); 
            }
        };

        let mibiAvatarState = {
            eyes: '',
            mouths: '',
            hats: '',
            bgColor: '#3B82F6', // Default blue
            size: 100,
            rotation: 0,
            offsetX: 0,
            offsetY: 0
        };
        
        const letterColors = [
            'EF4444', 'F97316', 'FDBA74', 'EAB308', 'FDE047',
            '22C55E', '86EFAC', '06B6D4', '67E8F9', '3B82F6',
            '93C5FD', '6366F1', 'A5B4FC', 'A855F7', 'D8B4FE',
            'EC4899', 'F9A8D4', '6B7280', '000000'
        ];

        // Constants for Assets
        const MIBI_ASSETS = {
            eyes: ['default-eyes.png', 'glasses.png', 'odd.png'],
            mouths: ['default-mouth.png', 'drool.png', 'meh.png', 'no-clue.png', 'sad.png', 'wow.png'],
            hats: ['strawhat.png', 'tophat.png', 'partyhat.png', 'halo.png', 'toiletpaper.png'],
            colors: [
    // --- RAINBOW ORDER ---
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#7C3AED', // Violet
    '#A855F7', // Purple
    '#E879F9', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#FFFFFF'  // White
]
        };

        const updateMibiPreview = () => {
            const bgEl = document.getElementById('mac-preview-bg');
            const layersContainer = document.getElementById('mac-layers-container'); // New container for transforms
            const eyesEl = document.getElementById('mac-layer-eyes');
            const mouthEl = document.getElementById('mac-layer-mouth');
            const hatEl = document.getElementById('mac-layer-hat');
            
            if (!bgEl || !layersContainer) return;

            // Update BG
            bgEl.style.backgroundColor = mibiAvatarState.bgColor;
            
            // Update Transforms (using percentages for translate)
            const scale = mibiAvatarState.size / 100;
            layersContainer.style.transform = `translate(${mibiAvatarState.offsetX}%, ${mibiAvatarState.offsetY}%) rotate(${mibiAvatarState.rotation}deg) scale(${scale})`;

            // Update Layers
            if (mibiAvatarState.eyes) {
                eyesEl.src = `mibi-avatars/eyes/${mibiAvatarState.eyes}`;
                eyesEl.classList.remove('hidden');
            } else {
                eyesEl.classList.add('hidden');
            }
            
            if (mibiAvatarState.mouths) {
                mouthEl.src = `mibi-avatars/mouths/${mibiAvatarState.mouths}`;
                mouthEl.classList.remove('hidden');
            } else {
                mouthEl.classList.add('hidden');
            }

            if (mibiAvatarState.hats) {
                hatEl.src = `mibi-avatars/hats/${mibiAvatarState.hats}`;
                hatEl.classList.remove('hidden');
            } else {
                hatEl.classList.add('hidden');
            }
        };

        const renderMacGrid = (category) => {
            const grid = document.getElementById('mac-grid');
            grid.innerHTML = ''; // Clear existing

            if (category === 'bg') {
                // Switch to Flex for Colors (Wrapping, no scrollbar)
                grid.className = 'flex flex-wrap gap-2 justify-center p-2';

                // Color Palette
                MIBI_ASSETS.colors.forEach(color => {
                    const btn = document.createElement('button');
                    const isSelected = mibiAvatarState.bgColor === color;
                    // Style: Match X button (w-10 h-10, rounded-[16px] i.e. 0.75rem) + flex-shrink-0
                    btn.className = `w-10 h-10 rounded-[16px] shadow-sm transition-transform hover:scale-110 focus:outline-none border-2 flex-shrink-0 ${isSelected ? 'border-[var(--text-main)]' : 'border-transparent'} hover:border-dashed hover:border-[var(--text-main)]`;
                    btn.style.backgroundColor = color;
                    
                    btn.onclick = () => {
                        mibiAvatarState.bgColor = color;
                        updateMibiPreview();
                        renderMacGrid('bg'); // Re-render to update selection ring
                    };
                    grid.appendChild(btn);
                });
                // Add custom picker
                const customWrapper = document.createElement('div');
                // Match size and roundness + flex-shrink-0
                customWrapper.className = 'w-10 h-10 rounded-[16px] bg-[#333] flex items-center justify-center cursor-pointer hover:bg-[#444] relative overflow-hidden border-2 border-transparent hover:border-dashed hover:border-[var(--text-main)] flex-shrink-0';
                customWrapper.innerHTML = '<i class="fa-solid fa-eye-dropper text-[var(--text-main)] text-sm"></i><input type="color" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">';
                const input = customWrapper.querySelector('input');
                input.oninput = (e) => {
                    mibiAvatarState.bgColor = e.target.value;
                    updateMibiPreview();
                };
                grid.appendChild(customWrapper);

            } else {
                // Reset to Grid for Assets
                grid.className = 'grid grid-cols-3 gap-4';
                
                // "None" Option - ONLY for Hats
                if (category === 'hats') {
                    const noneBtn = document.createElement('div');
                    // Light grey background (bg-gray-200), More rounded (rounded-[16px])
                    noneBtn.className = `bg-gray-200 rounded-[16px] p-2 flex flex-col items-center justify-center cursor-pointer border-2 hover:border-dashed hover:border-black transition-all ${!mibiAvatarState[category] ? 'border-black' : 'border-transparent'}`;
                    noneBtn.innerHTML = `<i class="fa-solid fa-ban fa-2x text-gray-600"></i>`;
                    noneBtn.onclick = () => {
                        mibiAvatarState[category] = '';
                        updateMibiPreview();
                        renderMacGrid(category);
                    };
                    grid.appendChild(noneBtn);
                }

                // Asset Options
                const files = MIBI_ASSETS[category] || [];
                files.forEach(file => {
                    const item = document.createElement('div');
                    const isSelected = mibiAvatarState[category] === file;
                    // Light grey background (bg-gray-200), More rounded (rounded-[16px])
                    item.className = `bg-gray-200 rounded-[16px] p-2 flex flex-col items-center justify-center cursor-pointer border-2 hover:border-dashed hover:border-black transition-all ${isSelected ? 'border-black' : 'border-transparent'}`;
                    
                    item.innerHTML = `
                        <img src="mibi-avatars/${category}/${file}" class="w-16 h-16 object-contain">
                    `;
                    
                    item.onclick = () => {
                        mibiAvatarState[category] = file;
                        updateMibiPreview();
                        renderMacGrid(category);
                    };
                    grid.appendChild(item);
                });
            }
        };

                        const preloadMibiAssets = () => {

                            const categories = ['eyes', 'mouths', 'hats'];

                            categories.forEach(cat => {

                                const files = MIBI_ASSETS[cat] || [];

                                files.forEach(file => {

                                    const img = new Image();

                                    img.src = `mibi-avatars/${cat}/${file}`;

                                });

                            });

                        };

                

                        const setupMacMenuListeners = () => {

                            // Preload assets for faster loading

                            preloadMibiAssets();

                

                            const openBtn = document.getElementById('open-mac-menu-btn');

                            const menu = document.getElementById('mibi-mac-menu');

                            const closeBtn = document.getElementById('mac-close-x-btn');

                            const cancelBtn = document.getElementById('mac-cancel-btn');

                            const confirmBtn = document.getElementById('mac-confirm-btn');

                            const resetBtn = document.getElementById('mac-reset-btn'); // NEW

                            const tabBtns = document.querySelectorAll('.mac-tab-btn');

                            const pfpModeSelect = document.getElementById('pfpModeSelect');

                            const pfpMessage = document.getElementById('pfpMessage');

                            

                            // Orientation Mode Elements

                            const previewContainer = document.getElementById('mac-preview-container');

                            const previewWrapper = document.getElementById('mac-preview-wrapper'); // The w-1/2 container

                            const controlsWrapper = document.getElementById('mac-controls-wrapper'); // The w-1/2 menu container

                            const slidersContainer = document.getElementById('mac-sliders-container');

                            const sizeSlider = document.getElementById('mac-size-slider');

                            const rotationSlider = document.getElementById('mac-rotation-slider');

                            const macPreviewLabel = document.getElementById('mac-preview-label'); // NEW: Reference to the label

                

                            if (!openBtn || !menu) return;

                

                            window.Mibi_ASSETS = MIBI_ASSETS; 

                            

                                        let isOrientationMode = false;

                            

                                        let currentTab = 'hats'; // Track current tab

                            

                                        let orientationSnapshot = null; // Store state for reverting

                            

                            

                            

                                        const openMenu = () => {

                            

                                            menu.classList.remove('hidden');

                            

                                            // Default selections if empty

                            

                                            if (!mibiAvatarState.eyes) mibiAvatarState.eyes = MIBI_ASSETS.eyes[0];

                            

                                            if (!mibiAvatarState.mouths) mibiAvatarState.mouths = MIBI_ASSETS.mouths[0];

                            

                                            

                            

                                            // Reset Orientation Mode state on open

                            

                                            exitOrientationMode(false); // Don't revert on initial open reset

                            

                                            updateMibiPreview();

                            

                                            

                            

                                            // Trigger click on first tab (or current) to load it

                            

                                            // Default to Hats

                            

                                            document.querySelector(`.mac-tab-btn[data-tab="${currentTab}"]`)?.click();

                            

                                        };

                            

                            

                            

                                        const closeMenu = () => {

                            

                                            menu.classList.add('hidden');

                            

                                        };

                            

                                        

                            

                                        // --- Orientation Mode Logic ---

                            

                                                    const enterOrientationMode = () => {
    if (isOrientationMode) return;
    isOrientationMode = true;

    // Snapshot state for revert
    orientationSnapshot = { ...mibiAvatarState };

    // Animate UI
    // Parent changes layout to row
    previewWrapper.classList.remove('w-1/2', 'flex-col', 'items-center', 'justify-center');
    previewWrapper.classList.add('w-full', 'flex-row', 'justify-start', 'items-start', 'gap-x-12', 'pl-16'); 

    // Explicitly force width and height to be equal to fix pill bug
    const computedHeight = previewContainer.offsetHeight; 
    
    // --- FIX START ---
    previewContainer.style.width = `${computedHeight}px`;
    previewContainer.style.height = `${computedHeight}px`;
    // Add min-width to prevent flexbox crushing
    previewContainer.style.minWidth = `${computedHeight}px`; 
    previewContainer.style.minHeight = `${computedHeight}px`;
    // --- FIX END ---

    previewContainer.style.transform = ''; 

    // --- FIX START ---
    // DO NOT remove 'flex-shrink-0'. We remove 'w-2/3' and margins, but KEEP flex-shrink-0
    previewContainer.classList.remove('mt-16', 'w-2/3'); 
    previewContainer.classList.add('flex-shrink-0'); // Explicitly force it not to shrink
    // --- FIX END ---

    // Adjust sliders container
    slidersContainer.classList.remove('hidden', 'opacity-0', 'max-w-xs', 'w-1/3', 'ml-4');
    slidersContainer.classList.add('flex', 'opacity-100', 'flex-grow', 'mt-16', 'p-4'); 

    controlsWrapper.classList.add('translate-x-full', 'w-0', 'overflow-hidden', 'p-0'); 
    controlsWrapper.classList.remove('translate-x-0', 'w-1/2');

    // Hide "Click preview" text
    macPreviewLabel.classList.add('hidden');

    // Update Button
    confirmBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Confirm Orientation';

    // Sync sliders
    sizeSlider.value = mibiAvatarState.size;
    rotationSlider.value = mibiAvatarState.rotation;
};

                            

                                                    

                            

                                                    const exitOrientationMode = (shouldRevert = false) => {

                            

                                                        isOrientationMode = false;

                            

                                                        

                            

                                                        if (shouldRevert && orientationSnapshot) {

                            

                                                            mibiAvatarState = { ...orientationSnapshot };

                            

                                                            updateMibiPreview();

                            

                                                        }

                            

                                                        orientationSnapshot = null;

                            

                                                        

                            

                                                        // Revert UI

                            

                                                        previewWrapper.classList.add('w-1/2', 'flex-col', 'items-center', 'justify-center'); // Revert to default layout

                            

                                                        previewWrapper.classList.remove('w-full', 'flex-row', 'justify-start', 'items-start', 'gap-x-12', 'pl-16');

                            

                                                        

                            

                                                        // Restore preview container to default (no dynamic styles/classes)

                            

                                                        previewContainer.style.transform = '';

                            

                                                        previewContainer.style.width = ''; // Remove explicitly set width

                            

                                                        previewContainer.style.height = ''; // Remove explicitly set height


                                                        previewContainer.style.minWidth = ''; // Clear min-width
                                                        previewContainer.style.minHeight = ''; // Clear min-height

                            

                                                        previewContainer.classList.remove('mt-16', 'w-2/3', 'flex-shrink-0'); // Ensure these are removed

                                                        previewContainer.classList.add('flex-shrink-0');

                                                        // Default width/height are handled by initial HTML classes `h-64 md:h-80 aspect-square rounded-full`

                            

                                        

                            

                                                        // Restore sliders container

                            

                                                        slidersContainer.classList.add('hidden', 'opacity-0', 'max-w-xs');

                            

                                                        slidersContainer.classList.remove('flex', 'opacity-100', 'flex-grow', 'mt-16', 'p-4'); // Remove dynamic positioning and padding

                            

                                        

                            

                                        

                            

                                                        controlsWrapper.classList.remove('translate-x-full', 'w-0', 'overflow-hidden', 'p-0');

                            

                                                        controlsWrapper.classList.add('translate-x-0', 'w-1/2');

                            

                                        

                            

                                                        // Show "Click preview" text

                            

                                                        macPreviewLabel.classList.remove('hidden');

                            

                                                        

                            

                                                        // Update Button

                            

                                                        confirmBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Confirm Avatar';

                            

                                                    };

                    

                    // Preview Click -> Enter Mode

                    previewContainer.addEventListener('click', (e) => {

                        // Only enter orientation mode if click is not on a slider handle during dragging

                        if (!isOrientationMode) {

                            enterOrientationMode();

                        }

                    });

                    

                    // --- Drag Logic ---

                    let isDragging = false;

                    let startX, startY, initialOffsetX, initialOffsetY;

                    

                    previewContainer.addEventListener('mousedown', (e) => {

                        if (!isOrientationMode) return;

                        isDragging = true;

                        startX = e.clientX;

                        startY = e.clientY;

                        initialOffsetX = mibiAvatarState.offsetX;

                        initialOffsetY = mibiAvatarState.offsetY;

                        previewContainer.style.cursor = 'grabbing';

                    });

                    

                    window.addEventListener('mousemove', (e) => {

                        if (!isDragging || !isOrientationMode) return;

                        

                        const rect = previewContainer.getBoundingClientRect();

                        const dx = e.clientX - startX;

                        const dy = e.clientY - startY;

                        

                        // Convert drag distance to percentage of container size

                        // Removed scale from here as preview is no longer scaled

                        const deltaXPercent = (dx / rect.width) * 100;

                        const deltaYPercent = (dy / rect.height) * 100;

                        

                        let newX = initialOffsetX + deltaXPercent;

                        let newY = initialOffsetY + deltaYPercent;

                        

                        // Clamp values (e.g. -60 to 60)

                        const CLAMP_LIMIT = 60;

                        newX = Math.max(-CLAMP_LIMIT, Math.min(CLAMP_LIMIT, newX));

                        newY = Math.max(-CLAMP_LIMIT, Math.min(CLAMP_LIMIT, newY));

        

                        mibiAvatarState.offsetX = newX;

                        mibiAvatarState.offsetY = newY;

                        

                        updateMibiPreview();

                    });

                    

                    window.addEventListener('mouseup', () => {

                        isDragging = false;

                        if (previewContainer) previewContainer.style.cursor = isOrientationMode ? 'grab' : 'pointer';

                    });

                    

                    // --- Slider Listeners ---

                    const snapThreshold = 5; // degrees/percent

                    sizeSlider.addEventListener('input', (e) => {

                        let value = parseInt(e.target.value);

                        if (Math.abs(value - 100) < snapThreshold) { // Snap to 100

                            value = 100;

                            e.target.value = 100; // Update visual slider position

                        }

                        mibiAvatarState.size = value;

                        updateMibiPreview();

                    });

                    

                    rotationSlider.addEventListener('input', (e) => {

                        let value = parseInt(e.target.value);

                        if (Math.abs(value - 0) < snapThreshold) { // Snap to 0

                            value = 0;

                            e.target.value = 0; // Update visual slider position

                        }

                        mibiAvatarState.rotation = value;

                        updateMibiPreview();

                    });

        

        

                    openBtn.onclick = openMenu;

                    closeBtn.onclick = closeMenu;

                    

                                cancelBtn.onclick = () => {

                    

                                    if (isOrientationMode) {

                    

                                        exitOrientationMode(true); // Revert changes

                    

                                    } else {

                    

                                        closeMenu();

                    

                                    }

                    

                                };

                    

                                

                    

                                // --- Reset Button Logic ---

                    

                                resetBtn.onclick = () => {

                    

                                    // Reset State to Defaults

                    

                                    mibiAvatarState = {

                    

                                        eyes: MIBI_ASSETS.eyes[0], // Default eyes

                    

                                        mouths: MIBI_ASSETS.mouths[0], // Default mouth

                    

                                        hats: '',

                    

                                        bgColor: '#FFFFFF', // Requested white default

                    

                                        size: 100,

                    

                                        rotation: 0,

                    

                                        offsetX: 0,

                    

                                        offsetY: 0

                    

                                    };

                    

                                    

                    

                                    // Update Visuals

                    

                                    updateMibiPreview();

                    

                                    

                    

                                    // Update Sliders

                    

                                    sizeSlider.value = 100;

                    

                                    rotationSlider.value = 0;

                    

                                    

                    

                                    // Re-render current tab (to update selection rings)

                    

                                    renderMacGrid(currentTab);

                    

                                };

                    

                    

                    

                                // Tab Switching Logic

                    

                                tabBtns.forEach(btn => {

                    

                                    btn.onclick = () => {

                    

                                        // Update UI

                    

                                        tabBtns.forEach(b => {

                    

                                            b.classList.remove('active-tab', 'text-[var(--text-main)]', 'border-blue-500');

                    

                                            b.classList.add('text-gray-400', 'border-transparent');

                    

                                        });

                    

                                        btn.classList.add('active-tab', 'text-[var(--text-main)]', 'border-blue-500');

                    

                                        btn.classList.remove('text-gray-400', 'border-transparent');

                    

                                        

                    

                                        // Track Tab

                    

                                        currentTab = btn.dataset.tab;

                    

                    

                    

                                        // Load Content

                    

                                        renderMacGrid(btn.dataset.tab);

                    

                                    };

                    

                                });

                    

                    

                    

                                // Confirm Action

                    

                                confirmBtn.onclick = async () => {

                    

                                    if (isOrientationMode) {

                    

                                        exitOrientationMode(false); // Keep changes

                    

                                        return;

                    

                                    }
                
                closeMenu();
                showMessage(pfpMessage, '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saving Mibi Avatar...', 'warning');
                
                try {
                    const uid = (currentUser ? (currentUser.uid || currentUser.id) : null) || (devUser ? (devUser.id || devUser.deviceToken) : null) || localStorage.getItem('12am_device_token');
                    
                    // Save to Firestore & Supabase
                    if (uid) {
                        await saveUserData(uid, {
                            pfpType: 'mibi',
                            mibiConfig: mibiAvatarState
                        });
                    }
                    
                    // Update local storage device accounts
                    try {
                        let u = JSON.parse(localStorage.getItem('12am_user') || '{}');
                        u.avatar_type = 'mibi';
                        u.pfpType = 'mibi';
                        u.mibiConfig = mibiAvatarState;
                        localStorage.setItem('12am_user', JSON.stringify(u));
                        let bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            bound.avatar_type = 'mibi';
                            bound.pfpType = 'mibi';
                            bound.mibiConfig = mibiAvatarState;
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                    } catch(e) {}

                    // Update live squircle preview in settings if present
                    const previewSquircle = document.getElementById('mibiCurrentPreviewSquircle');
                    const previewInner = document.getElementById('mibiCurrentPreviewInner');
                    const curEyes = document.getElementById('mibiCurrentEyes');
                    const curMouth = document.getElementById('mibiCurrentMouth');
                    const curHat = document.getElementById('mibiCurrentHat');
                    if (previewSquircle) previewSquircle.style.backgroundColor = mibiAvatarState.bgColor || '#3B82F6';
                    if (previewInner) {
                        const scale = (mibiAvatarState.size || 100) / 100;
                        previewInner.style.transform = `translate(${mibiAvatarState.offsetX || 0}%, ${mibiAvatarState.offsetY || 0}%) rotate(${mibiAvatarState.rotation || 0}deg) scale(${scale})`;
                    }
                    if (curEyes) {
                        if (mibiAvatarState.eyes) {
                            curEyes.src = `mibi-avatars/eyes/${mibiAvatarState.eyes}`;
                            curEyes.classList.remove('hidden');
                        } else {
                            curEyes.classList.add('hidden');
                        }
                    }
                    if (curMouth) {
                        if (mibiAvatarState.mouths) {
                            curMouth.src = `mibi-avatars/mouths/${mibiAvatarState.mouths}`;
                            curMouth.classList.remove('hidden');
                        } else {
                            curMouth.classList.add('hidden');
                        }
                    }
                    if (curHat) {
                        if (mibiAvatarState.hats) {
                            curHat.src = `mibi-avatars/hats/${mibiAvatarState.hats}`;
                            curHat.classList.remove('hidden');
                        } else {
                            curHat.classList.add('hidden');
                        }
                    }

                    if (typeof window.__updateNavbarUser === 'function') {
                        window.__updateNavbarUser();
                    }

                    // Update local dispatch for immediate feedback
                    const newUserData = {
                        pfpType: 'mibi',
                        mibiConfig: mibiAvatarState
                    };
                    
                    // Dispatch event so navigation bars update immediately
                    window.dispatchEvent(new CustomEvent('pfp-updated', { detail: newUserData }));
                    
                    showMessage(pfpMessage, 'Mibi Avatar saved successfully!', 'success');
                    
                    // Update dropdown to reflect choice
                    if (pfpModeSelect) {
                        pfpModeSelect.value = 'mibi';
                        const wrapper = pfpModeSelect.parentElement.querySelector('.custom-select-trigger');
                         if (wrapper) {
                             const option = Array.from(pfpModeSelect.options).find(o => o.value === 'mibi');
                             if(option) wrapper.innerHTML = `<span>${option.textContent}</span><div class="arrow"></div>`;
                         }
                    }

                } catch (error) {
                    console.error("Error saving Mibi avatar:", error);
                    showMessage(pfpMessage, 'Failed to save avatar. Please try again.', 'error');
                }
            };
        };

        // --- Utility: Custom Dropdown Setup ---
        function setupCustomDropdown(selectElement, onChangeCallback) {
            if (!selectElement) {
                console.error("setupCustomDropdown: selectElement is null.");
                return null; // Return null if the element doesn't exist
            }
            // Hide original select
            selectElement.style.display = 'none';
            
            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select-wrapper';
            selectElement.parentNode.insertBefore(wrapper, selectElement);
            wrapper.appendChild(selectElement);
            
            // Create custom structure
            const customSelect = document.createElement('div');
            customSelect.className = 'custom-select';
            
            const trigger = document.createElement('div');
            trigger.className = 'custom-select-trigger';
            
            // Helper to get option HTML with favicon
            const getOptionContentHtml = (option) => {
                const preset = urlChangerPresets.find(p => p.id === option.value);
                if (preset && preset.favicon) {
                    return `
                        <div class="custom-option-content">
                            <img src="${preset.favicon}" alt="${preset.name} Favicon">
                            <span>${option.textContent}</span>
                        </div>
                    `;
                }
                return `<span>${option.textContent}</span>`;
            };

            // Get initial text
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const initialHtml = selectedOption ? getOptionContentHtml(selectedOption) : '<span>Select...</span>';
            
            trigger.innerHTML = `${initialHtml}<div class="arrow"></div>`; // Use initialHtml here
            
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'custom-options';
            
            // Populate options
            Array.from(selectElement.options).forEach(option => {
                const customOption = document.createElement('div');
                customOption.className = 'custom-option' + (option.selected ? ' selected' : '');
                customOption.dataset.value = option.value;
                // --- MODIFICATION: Use innerHTML with favicon ---
                customOption.innerHTML = getOptionContentHtml(option); 
                
                customOption.addEventListener('click', function() {
                    // Update Trigger Text
                    trigger.innerHTML = `${this.innerHTML}<div class="arrow"></div>`; // Update trigger with selected option's full HTML
                    
                    // Update Classes
                    customSelect.classList.remove('open');
                    optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    // Update Original Select
                    selectElement.value = this.dataset.value;
                    
                    // Trigger Callback
                    if (onChangeCallback) onChangeCallback(this.dataset.value);
                });
                
                optionsContainer.appendChild(customOption);
            });
            
            customSelect.appendChild(trigger);
            customSelect.appendChild(optionsContainer);
            wrapper.appendChild(customSelect);
            
            // Trigger Event
            trigger.addEventListener('click', function() {
                customSelect.classList.toggle('open');
            });
            
            // Close when clicking outside
            window.addEventListener('click', function(e) {
                if (!customSelect.contains(e.target)) {
                    customSelect.classList.remove('open');
                }
            });
            
            // Return an update function to refresh options dynamically
            return {
                refresh: () => {
                    // Clear existing options
                    optionsContainer.innerHTML = '';
                    // Re-populate
                    Array.from(selectElement.options).forEach(option => {
                        const customOption = document.createElement('div');
                        customOption.className = 'custom-option' + (option.selected ? ' selected' : '');
                        customOption.dataset.value = option.value;
                        // --- MODIFICATION: Use innerHTML with favicon ---
                        customOption.innerHTML = getOptionContentHtml(option);
                        
                        if (option.selected) {
                             trigger.innerHTML = `${getOptionContentHtml(option)}<div class="arrow"></div>`;
                        }

                        customOption.addEventListener('click', function() {
                            trigger.innerHTML = `${this.innerHTML}<div class="arrow"></div>`;
                            customSelect.classList.remove('open');
                            optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                            this.classList.add('selected');
                            selectElement.value = this.dataset.value;
                            if (onChangeCallback) onChangeCallback(this.dataset.value);
                        });
                        optionsContainer.appendChild(customOption);
                    });
                },
                // Helper to manually select value programmatically
                setValue: (value) => {
                    const optionToSelect = Array.from(selectElement.options).find(opt => opt.value === value);
                    if (optionToSelect) {
                        selectElement.value = value;
                        trigger.innerHTML = `${getOptionContentHtml(optionToSelect)}<div class="arrow"></div>`;
                        optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
                            if (opt.dataset.value === value) opt.classList.add('selected');
                            else opt.classList.remove('selected');
                        });
                    }
                }
            };
        }

        /**
         * Streamlined General Settings tab.
         * Contains ONLY: Profile Picture editing, Username editing, and PIN editing requiring current PIN verification.
         */
        async function loadGeneralTab() {
            try {
            let devUser = null;
            if (window.TwelveAMAuth && typeof window.TwelveAMAuth.getCurrentUser === 'function') {
                devUser = window.TwelveAMAuth.getCurrentUser();
            }
            if (!devUser) {
                try {
                    devUser = JSON.parse(localStorage.getItem('12am_user') || 'null');
                } catch(e) {}
            }
            if (!devUser && window.TwelveAMAuth && typeof window.TwelveAMAuth.getBoundDeviceAccount === 'function') {
                devUser = await window.TwelveAMAuth.getBoundDeviceAccount();
            }

            if (devUser && devUser.mibiConfig) {
                mibiAvatarState = { ...mibiAvatarState, ...devUser.mibiConfig };
            }

            const currentUsername = devUser?.nickname || devUser?.firstName || 'user';
            const avatarUrl = devUser?.avatar_url || devUser?.avatar || devUser?.pfp || localStorage.getItem('12am_profile_picture') || '';
            const safeUsername = String(currentUsername).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

            let rawMode = devUser?.avatar_type || devUser?.pfpType || (devUser?.mibiConfig ? 'mibi' : (avatarUrl ? 'custom' : 'letter'));
            let currentPfpMode = 'letter';
            if (rawMode === 'google' || rawMode === 'default') currentPfpMode = 'google';
            else if (rawMode === 'mibi') currentPfpMode = 'mibi';
            else if (rawMode === 'custom' || rawMode === 'image') currentPfpMode = 'custom';
            else currentPfpMode = 'letter';

            let currentLetters = (devUser?.avatar_letter || devUser?.letterAvatarText || devUser?.pfp_letter_char || (devUser?.firstName || devUser?.nickname || 'U')[0] || 'U').slice(0, 3).toUpperCase();
            let currentBg = devUser?.avatar_bg || devUser?.pfpLetterBg || '#000000';
            let currentColor = devUser?.avatar_color || '#ffffff';

            mainView.innerHTML = `
                <div class="w-full max-w-5xl">
                    <h2 class="text-3xl font-bold text-[var(--text-main)] mb-6">General Settings</h2>

                    <!-- 1. Profile Picture Section (Unified with Mibi & Letter Creator) -->
                    <div id="pfpSection" class="settings-box transition-all duration-300 p-6 mb-6">
                        <h3 class="text-xl font-bold text-[var(--text-main)] mb-1">Profile Picture</h3>
                        <p class="text-xs text-[var(--text-muted)] mb-4">Choose how you appear across 12AM: default initial, custom letters, interactive Mibi Avatar, or custom image.</p>
                        
                        <div class="flex flex-col gap-4">
                            <!-- Mode Selection Buttons -->
                            <div class="flex flex-wrap gap-2 mb-4 border-b border-[var(--border-main)] pb-4">
                                <button type="button" class="pfp-mode-btn btn-toolbar-style ${currentPfpMode === 'google' ? 'active' : ''}" data-mode="google">Default / Initial</button>
                                <button type="button" class="pfp-mode-btn btn-toolbar-style ${currentPfpMode === 'letter' ? 'active' : ''}" data-mode="letter">Letter Avatar</button>
                                <button type="button" class="pfp-mode-btn btn-toolbar-style ${currentPfpMode === 'mibi' ? 'active' : ''}" data-mode="mibi">Mibi Avatar</button>
                                <button type="button" class="pfp-mode-btn btn-toolbar-style ${currentPfpMode === 'custom' ? 'active' : ''}" data-mode="custom">Upload Image</button>
                            </div>

                            <!-- Google / Default Options -->
                            <div id="pfpGoogleSettings" class="${currentPfpMode === 'google' ? 'flex' : 'hidden'} items-center gap-6 mt-1">
                                <div class="w-20 h-20 rounded-[20px] bg-black text-white border border-[var(--border-main)] flex items-center justify-center font-bold text-2xl uppercase flex-shrink-0 shadow-lg">
                                    ${escapeHtml((devUser?.firstName || devUser?.nickname || 'U')[0] || 'U')}
                                </div>
                                <div class="flex flex-col gap-2">
                                    <p class="text-xs text-[var(--text-muted)]">Using the standard white initial against a sleek black squircle.</p>
                                    <button type="button" id="resetToDefaultPfpBtn" class="btn-toolbar-style self-start">
                                        <i class="fa-solid fa-rotate-left mr-2"></i> Reset to Default
                                    </button>
                                </div>
                            </div>

                            <!-- Letter Avatar Options -->
                            <div id="pfpLetterSettings" class="${currentPfpMode === 'letter' ? 'flex' : 'hidden'} flex-col gap-4 mt-1">
                                <div class="flex items-center gap-6 mb-2">
                                    <!-- Interactive Preview -->
                                    <div id="pfp-letter-preview" class="w-20 h-20 rounded-[20px] flex items-center justify-center text-2xl font-bold shadow-lg border border-[var(--border-main)] cursor-text relative overflow-hidden group flex-shrink-0" style="background: ${currentBg}; color: ${currentColor};">
                                        <input type="text" id="pfp-letter-input" maxlength="3" class="absolute inset-0 w-full h-full bg-transparent border-none outline-none text-center uppercase cursor-text font-mono" placeholder="U" value="${currentLetters}">
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="block text-[var(--text-muted)] opacity-70 text-xs uppercase tracking-wider font-bold">Live Letter Preview</label>
                                        <p class="text-xs text-[var(--text-muted)] opacity-60 max-w-[260px]">Type up to 3 initials in the squircle or customize the background below.</p>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                                    <div>
                                        <label class="block text-[var(--text-muted)] opacity-70 text-xs mb-2 uppercase tracking-wider font-bold">Background Color</label>
                                        <div class="flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-main)]">
                                            <input type="color" id="pfpLetterBgInput" value="${currentBg}" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent">
                                            <span id="pfpLetterBgHex" class="text-xs font-mono text-[var(--text-muted)]">${currentBg}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-[var(--text-muted)] opacity-70 text-xs mb-2 uppercase tracking-wider font-bold">Text Color</label>
                                        <div class="flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-main)]">
                                            <input type="color" id="pfpLetterTextColorInput" value="${currentColor}" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent">
                                            <span id="pfpLetterTextColorHex" class="text-xs font-mono text-[var(--text-muted)]">${currentColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <label class="block text-[var(--text-muted)] opacity-70 text-xs uppercase tracking-wider font-bold mt-1">Preset Palettes</label>
                                <div class="color-palette-grid mb-3" id="pfp-color-grid"></div>
                                
                                <button type="button" id="save-letter-pfp-btn" class="btn-toolbar-style btn-primary-override self-start">
                                    <i class="fa-solid fa-check mr-2"></i> Save Letter Avatar
                                </button>
                            </div>

                            <!-- Mibi Avatar Settings -->
                            <div id="pfpMibiSettings" class="${currentPfpMode === 'mibi' ? 'flex' : 'hidden'} flex-col gap-4 mt-1">
                                <div class="flex items-center gap-6">
                                    <div id="mibiCurrentPreviewSquircle" class="w-20 h-20 rounded-[20px] overflow-hidden border border-[var(--border-main)] relative flex-shrink-0 shadow-lg" style="background: ${mibiAvatarState.bgColor || '#3B82F6'};">
                                        <div id="mibiCurrentPreviewInner" class="absolute inset-0" style="transform: translate(${mibiAvatarState.offsetX || 0}%, ${mibiAvatarState.offsetY || 0}%) rotate(${mibiAvatarState.rotation || 0}deg) scale(${(mibiAvatarState.size || 100)/100}); transform-origin: center; pointer-events: none;">
                                            <img src="mibi-avatars/head.png" alt="Head" class="absolute inset-0 w-full h-full object-contain z-10">
                                            <img id="mibiCurrentEyes" src="${mibiAvatarState.eyes ? `mibi-avatars/eyes/${mibiAvatarState.eyes}` : ''}" alt="" class="absolute inset-0 w-full h-full object-contain z-20 ${mibiAvatarState.eyes ? '' : 'hidden'}">
                                            <img id="mibiCurrentMouth" src="${mibiAvatarState.mouths ? `mibi-avatars/mouths/${mibiAvatarState.mouths}` : ''}" alt="" class="absolute inset-0 w-full h-full object-contain z-20 ${mibiAvatarState.mouths ? '' : 'hidden'}">
                                            <img id="mibiCurrentHat" src="${mibiAvatarState.hats ? `mibi-avatars/hats/${mibiAvatarState.hats}` : ''}" alt="" class="absolute inset-0 w-full h-full object-contain z-30 ${mibiAvatarState.hats ? '' : 'hidden'}">
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <p class="text-sm font-light text-[var(--text-muted)] opacity-80">
                                            Create and customize your animated squircle Mibi Avatar with hats, eyes, expressions, and custom positioning.
                                        </p>
                                        <button type="button" id="open-mac-menu-btn" class="btn-toolbar-style btn-primary-override self-start">
                                            <i class="fa-solid fa-paintbrush mr-2"></i> Open Mibi Avatar Creator
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Custom Upload Settings -->
                            <div id="pfpCustomSettings" class="${currentPfpMode === 'custom' ? 'block' : 'hidden'} mt-1">
                                <div class="flex items-center gap-6">
                                    <div class="w-20 h-20 rounded-[20px] overflow-hidden border border-[var(--border-main)] flex-shrink-0 bg-black relative shadow-lg">
                                        <img id="customPfpPreview" src="${avatarUrl || ''}" class="w-full h-full object-cover" style="${avatarUrl ? 'display:block;' : 'display:none;'}">
                                        <div id="customPfpPlaceholder" class="w-full h-full flex items-center justify-center text-[var(--text-muted)] opacity-40" style="${avatarUrl ? 'display:none;' : 'display:flex;'}">
                                            <i class="fa-solid fa-user text-2xl"></i>
                                        </div>
                                    </div>
                                    
                                    <div class="flex flex-col gap-2">
                                        <div class="flex items-center gap-3">
                                            <button type="button" id="uploadPfpBtn" class="btn-toolbar-style btn-primary-override">
                                                <i class="fa-solid fa-upload mr-2"></i> Upload Image
                                            </button>
                                            <button type="button" id="settingsRemoveAvatarBtn" class="btn-toolbar-style">
                                                <i class="fa-solid fa-trash-can mr-2"></i> Remove
                                            </button>
                                        </div>
                                        <input type="file" id="pfpFileInput" accept="image/*" style="display: none;">
                                        <p class="text-xs text-[var(--text-muted)] opacity-50">Images are cropped into high-resolution squircles (PNG, JPG, or WEBP up to 5MB).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="pfpMessage" class="general-message-area text-sm mt-3"></div>

                        <!-- MAC Modal -->
                        <div id="mibi-mac-menu" class="fixed inset-0 bg-[var(--bg-page)] bg-opacity-80 flex items-center justify-center z-[2000000] hidden backdrop-blur-sm">
                            <div class="relative bg-[var(--bg-secondary)] rounded-[16px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-[var(--border-main)]">
                                
                                <!-- Header -->
                                <div class="flex justify-between items-center p-6 border-b border-[var(--border-main)] bg-[var(--bg-secondary)]">
                                    <h3 class="text-2xl font-bold text-[var(--text-main)]">Mibi Avatar Creator</h3>
                                    <button type="button" id="mac-close-x-btn" class="btn-toolbar-style w-10 h-10 flex items-center justify-center p-0">
                                        <i class="fa-solid fa-xmark fa-xl"></i>
                                    </button>
                                </div>
                                
                                <!-- Main Content Area (Split View) -->
                                <div class="flex flex-grow overflow-hidden relative">
                                    
                                    <!-- LEFT: Live Preview -->
                                    <div id="mac-preview-wrapper" class="w-1/2 flex flex-col items-center justify-center bg-[var(--bg-page)] p-8 border-r border-[var(--border-main)] transition-all duration-500 ease-in-out z-10">
                                        <div class="relative h-64 md:h-80 aspect-square rounded-[56px] overflow-hidden border-4 border-[var(--border-main)] shadow-lg mb-6 transition-all duration-300 hover:border-dashed hover:border-[var(--text-main)] cursor-pointer flex-shrink-0" id="mac-preview-container" style="aspect-ratio: 1/1;">
                                            <!-- Background (Static) -->
                                            <div id="mac-preview-bg" class="absolute inset-0 w-full h-full transition-colors duration-300" style="background-color: ${mibiAvatarState.bgColor || '#3B82F6'};"></div>
                                            
                                            <!-- Avatar Layers Container (Rotates/Scales/Moves) -->
                                            <div id="mac-layers-container" class="absolute inset-0 w-full h-full transition-transform duration-75 ease-out origin-center pointer-events-none">
                                                <img id="mac-layer-head" src="mibi-avatars/head.png" class="absolute inset-0 w-full h-full object-contain z-10">
                                                <img id="mac-layer-eyes" class="absolute inset-0 w-full h-full object-contain z-20 hidden">
                                                <img id="mac-layer-mouth" class="absolute inset-0 w-full h-full object-contain z-20 hidden">
                                                <img id="mac-layer-hat" class="absolute inset-0 w-full h-full object-contain z-30 hidden">
                                            </div>
                                        </div>
                                        
                                        <div id="mac-sliders-container" class="hidden flex-col gap-6 w-full max-w-xs transition-opacity duration-300 opacity-0">
                                            <div class="flex flex-col gap-2">
                                                <label class="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-wider font-bold">Size</label>
                                                <input type="range" id="mac-size-slider" min="50" max="150" value="100" list="mac-size-ticks" class="mac-slider w-full h-2 bg-[var(--bg-secondary)] rounded-[16px] appearance-none cursor-pointer">
                                                <datalist id="mac-size-ticks">
                                                    <option value="100"></option>
                                                </datalist>
                                            </div>
                                            <div class="flex flex-col gap-2">
                                                <label class="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-wider font-bold">Rotation</label>
                                                <input type="range" id="mac-rotation-slider" min="-180" max="180" value="0" list="mac-rotation-ticks" class="mac-slider w-full h-2 bg-[var(--bg-secondary)] rounded-[16px] appearance-none cursor-pointer">
                                                <datalist id="mac-rotation-ticks">
                                                    <option value="0"></option>
                                                </datalist>
                                            </div>
                                            <p class="text-center text-[var(--text-muted)] opacity-50 text-xs mt-2"><i class="fa-solid fa-hand-pointer mr-1"></i> Drag avatar to position</p>
                                        </div>
                                        
                                        <p class="text-[var(--text-muted)] opacity-50 text-sm font-mono mt-2" id="mac-preview-label">Click preview to adjust orientation</p>
                                    </div>

                                    <!-- RIGHT: Controls & Options -->
                                    <div id="mac-controls-wrapper" class="w-1/2 flex flex-col bg-[var(--bg-secondary)] transition-transform duration-500 ease-in-out translate-x-0">
                                        
                                        <!-- Tabs -->
                                        <div class="flex border-b border-[var(--border-main)]">
                                            <button type="button" class="mac-tab-btn flex-1 py-4 text-[var(--text-muted)] opacity-60 hover:text-[var(--text-main)] hover:bg-[var(--bg-page)] transition-colors border-b-2 border-transparent font-medium active-tab" data-tab="hats">
                                                <i class="fa-solid fa-hat-wizard mr-2"></i> Hats
                                            </button>
                                            <button type="button" class="mac-tab-btn flex-1 py-4 text-[var(--text-muted)] opacity-60 hover:text-[var(--text-main)] hover:bg-[var(--bg-page)] transition-colors border-b-2 border-transparent font-medium" data-tab="eyes">
                                                <i class="fa-solid fa-eye mr-2"></i> Eyes
                                            </button>
                                            <button type="button" class="mac-tab-btn flex-1 py-4 text-[var(--text-muted)] opacity-60 hover:text-[var(--text-main)] hover:bg-[var(--bg-page)] transition-colors border-b-2 border-transparent font-medium" data-tab="mouths">
                                                <i class="fa-solid fa-face-smile mr-2"></i> Mouths
                                            </button>
                                            <button type="button" class="mac-tab-btn flex-1 py-4 text-[var(--text-muted)] opacity-60 hover:text-[var(--text-main)] hover:bg-[var(--bg-page)] transition-colors border-b-2 border-transparent font-medium" data-tab="bg">
                                                <i class="fa-solid fa-palette mr-2"></i> Color
                                            </button>
                                        </div>

                                        <!-- Options Grid (Scrollable) -->
                                        <div class="flex-grow overflow-y-auto p-6 custom-scrollbar" id="mac-options-container">
                                            <!-- Dynamic Content Loaded Here -->
                                            <div class="grid grid-cols-3 gap-4" id="mac-grid">
                                                <!-- JS populates this -->
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                
                                <!-- Footer Actions -->
                                <div class="p-6 border-t border-[var(--border-main)] bg-[var(--bg-secondary)] flex justify-end gap-4 items-center">
                                    <button type="button" id="mac-reset-btn" class="btn-toolbar-style mr-auto px-4 py-2 rounded-[16px]" title="Reset Avatar">
                                        <i class="fa-solid fa-rotate-left"></i>
                                    </button>
                                    <button type="button" id="mac-cancel-btn" class="btn-toolbar-style px-6 py-2 rounded-[16px]">Cancel</button>
                                    <button type="button" id="mac-confirm-btn" class="btn-toolbar-style btn-primary-override px-6 py-2 rounded-[16px]">
                                        <i class="fa-solid fa-check mr-2"></i> Confirm Avatar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Username Editing -->
                    <div class="settings-box p-6 mb-6">
                        <h3 class="text-xl font-bold text-[var(--text-main)] mb-1">Username</h3>
                        <p class="text-xs text-[var(--text-muted)] mb-4">Choose your display name and unique handle on 12AM.</p>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <input type="text" id="settingsUsernameInput" value="${safeUsername}" placeholder="Enter username..." maxlength="24" class="input-text-style flex-1 font-mono">
                            <button type="button" id="settingsSaveUsernameBtn" class="btn-toolbar-style btn-primary-override whitespace-nowrap">
                                <i class="fa-solid fa-floppy-disk"></i>
                                <span>Save Username</span>
                            </button>
                        </div>
                        <div id="usernameMessage" class="general-message-area"></div>
                    </div>

                    <!-- 3. Security PIN (Requires Current PIN) -->
                    <div class="settings-box p-6 mb-6">
                        <h3 class="text-xl font-bold text-[var(--text-main)] mb-1">Security PIN</h3>
                        <p class="text-xs text-[var(--text-muted)] mb-4">Update your 4 to 6-digit device unlock PIN. Your current PIN is required for verification.</p>
                        
                        <div class="flex flex-col gap-3 max-w-sm">
                            <div>
                                <label class="text-xs text-[var(--text-muted)] mb-1 block">Current PIN</label>
                                <input type="password" id="currentPinInput" placeholder="••••" maxlength="6" pattern="[0-9]{4,6}" inputmode="numeric" class="input-text-style font-mono tracking-widest text-base">
                            </div>
                            <div>
                                <label class="text-xs text-[var(--text-muted)] mb-1 block">New PIN (4–6 digits)</label>
                                <input type="password" id="newPinInput" placeholder="••••" maxlength="6" pattern="[0-9]{4,6}" inputmode="numeric" class="input-text-style font-mono tracking-widest text-base">
                            </div>
                            <div>
                                <label class="text-xs text-[var(--text-muted)] mb-1 block">Confirm New PIN</label>
                                <input type="password" id="confirmNewPinInput" placeholder="••••" maxlength="6" pattern="[0-9]{4,6}" inputmode="numeric" class="input-text-style font-mono tracking-widest text-base">
                            </div>
                            <button type="button" id="settingsUpdatePinBtn" class="btn-toolbar-style btn-primary-override mt-2 self-start">
                                <i class="fa-solid fa-key"></i>
                                <span>Update PIN</span>
                            </button>
                        </div>
                        <div id="pinMessage" class="general-message-area"></div>
                    </div>
                </div>
            `;

            // Setup Profile Picture Mode Switcher & Handlers
            const pfpModeBtns = document.querySelectorAll('.pfp-mode-btn');
            const googleSettings = document.getElementById('pfpGoogleSettings');
            const letterSettings = document.getElementById('pfpLetterSettings');
            const mibiSettings = document.getElementById('pfpMibiSettings');
            const customSettings = document.getElementById('pfpCustomSettings');
            const pfpMessage = document.getElementById('pfpMessage');

            const switchPfpMode = (mode) => {
                pfpModeBtns.forEach(btn => {
                    const isActive = btn.dataset.mode === mode;
                    btn.classList.toggle('active', isActive);
                    if (isActive) {
                        btn.style.backgroundColor = 'var(--btn-bg)';
                        btn.style.borderColor = 'var(--accent-color)';
                    } else {
                        btn.style.backgroundColor = '';
                        btn.style.borderColor = '';
                    }
                });

                if (googleSettings) googleSettings.classList.toggle('hidden', mode !== 'google');
                if (googleSettings) googleSettings.classList.toggle('flex', mode === 'google');
                if (letterSettings) letterSettings.classList.toggle('hidden', mode !== 'letter');
                if (letterSettings) letterSettings.classList.toggle('flex', mode === 'letter');
                if (mibiSettings) mibiSettings.classList.toggle('hidden', mode !== 'mibi');
                if (mibiSettings) mibiSettings.classList.toggle('flex', mode === 'mibi');
                if (customSettings) customSettings.classList.toggle('hidden', mode !== 'custom');
                if (customSettings) customSettings.classList.toggle('block', mode === 'custom');
            };

            pfpModeBtns.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const mode = btn.dataset.mode;
                    switchPfpMode(mode);
                    const uid = (currentUser ? (currentUser.uid || currentUser.id) : null) || (devUser ? (devUser.id || devUser.deviceToken) : null);
                    try {
                        if (devUser) {
                            devUser.avatar_type = mode;
                            devUser.pfpType = mode;
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        const bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            bound.avatar_type = mode;
                            bound.pfpType = mode;
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                        if (uid) {
                            await saveUserData(uid, { pfpType: mode, pfp_type: mode });
                        }
                        if (typeof window.__updateNavbarUser === 'function') {
                            window.__updateNavbarUser();
                        }
                        window.dispatchEvent(new CustomEvent('pfp-updated', { detail: { pfpType: mode } }));
                    } catch(e) {}
                });
            });

            // Reset to Default button
            const resetToDefaultBtn = document.getElementById('resetToDefaultPfpBtn');
            if (resetToDefaultBtn) {
                resetToDefaultBtn.addEventListener('click', async () => {
                    try {
                        localStorage.removeItem('12am_profile_picture');
                        if (devUser) {
                            devUser.avatar_type = 'letter';
                            devUser.pfpType = 'letter';
                            delete devUser.avatar_url;
                            delete devUser.avatar;
                            delete devUser.pfp;
                            devUser.avatar_bg = '#000000';
                            devUser.avatar_color = '#ffffff';
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        const bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            bound.avatar_type = 'letter';
                            bound.pfpType = 'letter';
                            delete bound.avatar_url;
                            delete bound.avatar;
                            delete bound.pfp;
                            bound.avatar_bg = '#000000';
                            bound.avatar_color = '#ffffff';
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                        const uid = (currentUser ? (currentUser.uid || currentUser.id) : null) || (devUser ? (devUser.id || devUser.deviceToken) : null);
                        if (uid) {
                            await saveUserData(uid, { pfpType: 'letter', pfp_letter_bg: '#000000' });
                        }
                        if (typeof window.__updateNavbarUser === 'function') {
                            window.__updateNavbarUser();
                        }
                        window.dispatchEvent(new CustomEvent('pfp-updated', { detail: { pfpType: 'letter' } }));
                        showMessage(pfpMessage, 'Reset to default initial avatar.', 'success');
                    } catch(e) {
                        showMessage(pfpMessage, 'Error resetting avatar.', 'error');
                    }
                });
            }

            // Letter Avatar Logic
            const pfpLetterInput = document.getElementById('pfp-letter-input');
            const pfpLetterPreview = document.getElementById('pfp-letter-preview');
            const pfpLetterBgInput = document.getElementById('pfpLetterBgInput');
            const pfpLetterBgHex = document.getElementById('pfpLetterBgHex');
            const pfpLetterTextColorInput = document.getElementById('pfpLetterTextColorInput');
            const pfpLetterTextColorHex = document.getElementById('pfpLetterTextColorHex');
            const pfpColorGrid = document.getElementById('pfp-color-grid');
            const saveLetterBtn = document.getElementById('save-letter-pfp-btn');

            let selectedBgColor = currentBg;
            let selectedTextColor = currentColor;

            const updateLetterPreviewLive = () => {
                const text = (pfpLetterInput.value || (devUser?.firstName || devUser?.nickname || 'U')[0] || 'U').slice(0, 3).toUpperCase();
                pfpLetterPreview.style.backgroundColor = selectedBgColor;
                pfpLetterPreview.style.color = selectedTextColor;
                pfpLetterBgHex.textContent = selectedBgColor;
                pfpLetterTextColorHex.textContent = selectedTextColor;
            };

            if (pfpLetterInput) pfpLetterInput.addEventListener('input', updateLetterPreviewLive);
            if (pfpLetterBgInput) {
                pfpLetterBgInput.addEventListener('input', (e) => {
                    selectedBgColor = e.target.value;
                    updateLetterPreviewLive();
                });
            }
            if (pfpLetterTextColorInput) {
                pfpLetterTextColorInput.addEventListener('input', (e) => {
                    selectedTextColor = e.target.value;
                    updateLetterPreviewLive();
                });
            }

            if (pfpColorGrid) {
                pfpColorGrid.innerHTML = '';
                letterColors.forEach(color => {
                    const d = document.createElement('div');
                    const hexColor = color.startsWith('#') ? color : '#' + color;
                    d.className = `color-option ${selectedBgColor.toLowerCase() === hexColor.toLowerCase() ? 'selected' : ''}`;
                    d.style.backgroundColor = hexColor;
                    d.onclick = () => {
                        selectedBgColor = hexColor;
                        if (pfpLetterBgInput) pfpLetterBgInput.value = hexColor;
                        pfpColorGrid.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
                        d.classList.add('selected');
                        updateLetterPreviewLive();
                    };
                    pfpColorGrid.appendChild(d);
                });
            }

            if (saveLetterBtn) {
                saveLetterBtn.addEventListener('click', async () => {
                    const letters = (pfpLetterInput.value || (devUser?.firstName || devUser?.nickname || 'U')[0] || 'U').slice(0, 3).toUpperCase();
                    showMessage(pfpMessage, 'Saving...', 'warning');
                    try {
                        if (devUser) {
                            devUser.avatar_type = 'letter';
                            devUser.pfpType = 'letter';
                            devUser.avatar_letter = letters;
                            devUser.letterAvatarText = letters;
                            devUser.avatar_bg = selectedBgColor;
                            devUser.pfpLetterBg = selectedBgColor;
                            devUser.avatar_color = selectedTextColor;
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        const bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            bound.avatar_type = 'letter';
                            bound.pfpType = 'letter';
                            bound.avatar_letter = letters;
                            bound.letterAvatarText = letters;
                            bound.avatar_bg = selectedBgColor;
                            bound.pfpLetterBg = selectedBgColor;
                            bound.avatar_color = selectedTextColor;
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                        const uid = (currentUser ? (currentUser.uid || currentUser.id) : null) || (devUser ? (devUser.id || devUser.deviceToken) : null);
                        if (uid) {
                            await saveUserData(uid, {
                                pfpType: 'letter',
                                pfp_type: 'letter',
                                pfpLetterBg: selectedBgColor,
                                letterAvatarText: letters
                            });
                        }
                        if (typeof window.__updateNavbarUser === 'function') {
                            window.__updateNavbarUser();
                        }
                        window.dispatchEvent(new CustomEvent('pfp-updated', {
                            detail: {
                                pfpType: 'letter',
                                pfpLetterBg: selectedBgColor,
                                letterAvatarText: letters
                            }
                        }));
                        showMessage(pfpMessage, 'Letter avatar saved successfully!', 'success');
                    } catch(e) {
                        showMessage(pfpMessage, 'Error saving letter avatar.', 'error');
                    }
                });
            }

            // Setup Mibi Avatar Creator modal listeners
            setupMacMenuListeners();

            // Custom Image Upload & Cropper Logic
            const uploadBtn = document.getElementById('uploadPfpBtn');
            const fileInput = document.getElementById('pfpFileInput');
            const customPreviewImg = document.getElementById('customPfpPreview');
            const customPreviewPlaceholder = document.getElementById('customPfpPlaceholder');
            const removeAvatarBtn = document.getElementById('settingsRemoveAvatarBtn');
            const cropperModal = document.getElementById('cropperModal');
            const cropperCanvas = document.getElementById('cropperCanvas');
            const cancelCropBtn = document.getElementById('cancelCropBtn');
            const submitCropBtn = document.getElementById('submitCropBtn');

            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => fileInput.click());
            }

            let cropperImage = null;
            let cropState = { x: 0, y: 0, radius: 100 };
            let isCropperDragging = false;
            let cropperDragStart = { x: 0, y: 0 };
            const cropCtx = cropperCanvas ? cropperCanvas.getContext('2d') : null;

            const drawCropper = () => {
                if (!cropperImage || !cropperCanvas || !cropCtx) return;
                const w = cropperCanvas.width;
                const h = cropperCanvas.height;
                cropCtx.clearRect(0, 0, w, h);
                cropCtx.drawImage(cropperImage, 0, 0, w, h);

                cropCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                cropCtx.beginPath();
                cropCtx.rect(0, 0, w, h);
                cropCtx.fill();

                cropCtx.globalCompositeOperation = 'destination-out';
                cropCtx.beginPath();
                const r = cropState.radius;
                const size = r * 2;
                const cornerRadius = size * 0.22;
                if (cropCtx.roundRect) {
                    cropCtx.roundRect(cropState.x - r, cropState.y - r, size, size, cornerRadius);
                } else {
                    cropCtx.rect(cropState.x - r, cropState.y - r, size, size);
                }
                cropCtx.fill();

                cropCtx.globalCompositeOperation = 'source-over';
                cropCtx.strokeStyle = 'var(--accent-color, #8b5cf6)';
                cropCtx.lineWidth = 2.5;
                cropCtx.setLineDash([6, 4]);
                cropCtx.beginPath();
                if (cropCtx.roundRect) {
                    cropCtx.roundRect(cropState.x - r, cropState.y - r, size, size, cornerRadius);
                } else {
                    cropCtx.rect(cropState.x - r, cropState.y - r, size, size);
                }
                cropCtx.stroke();
                cropCtx.setLineDash([]);
            };

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        showMessage(pfpMessage, 'File is too large (max 5MB).', 'error');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        cropperImage = new Image();
                        cropperImage.onload = () => {
                            const fixedHeight = 380;
                            const scale = fixedHeight / cropperImage.height;
                            cropperCanvas.height = fixedHeight;
                            cropperCanvas.width = cropperImage.width * scale;
                            cropState = {
                                x: cropperCanvas.width / 2,
                                y: cropperCanvas.height / 2,
                                radius: Math.min(cropperCanvas.width, cropperCanvas.height) / 3
                            };
                            if (cropperModal) cropperModal.style.display = 'flex';
                            requestAnimationFrame(drawCropper);
                        };
                        cropperImage.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }

            if (cropperCanvas) {
                cropperCanvas.onmousedown = (e) => {
                    const r = cropState.radius;
                    if (e.offsetX >= cropState.x - r && e.offsetX <= cropState.x + r &&
                        e.offsetY >= cropState.y - r && e.offsetY <= cropState.y + r) {
                        isCropperDragging = true;
                        cropperDragStart = { x: e.offsetX, y: e.offsetY };
                    }
                };
                cropperCanvas.onmousemove = (e) => {
                    if (isCropperDragging) {
                        const dx = e.offsetX - cropperDragStart.x;
                        const dy = e.offsetY - cropperDragStart.y;
                        const r = cropState.radius;
                        const w = cropperCanvas.width;
                        const h = cropperCanvas.height;
                        cropState.x = Math.max(r, Math.min(cropState.x + dx, w - r));
                        cropState.y = Math.max(r, Math.min(cropState.y + dy, h - r));
                        cropperDragStart = { x: e.offsetX, y: e.offsetY };
                        requestAnimationFrame(drawCropper);
                    }
                };
                cropperCanvas.onmouseup = () => { isCropperDragging = false; };
                cropperCanvas.onmouseleave = () => { isCropperDragging = false; };
                cropperCanvas.onwheel = (e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -6 : 6;
                    const maxR = Math.min(cropperCanvas.width, cropperCanvas.height) / 2;
                    cropState.radius = Math.max(24, Math.min(cropState.radius + delta, maxR));
                    cropState.x = Math.max(cropState.radius, Math.min(cropState.x, cropperCanvas.width - cropState.radius));
                    cropState.y = Math.max(cropState.radius, Math.min(cropState.y, cropperCanvas.height - cropState.radius));
                    requestAnimationFrame(drawCropper);
                };
            }

            if (cancelCropBtn && cropperModal) {
                cancelCropBtn.onclick = () => {
                    cropperModal.style.display = 'none';
                    if (fileInput) fileInput.value = '';
                };
            }

            if (submitCropBtn && cropperModal) {
                submitCropBtn.onclick = async () => {
                    if (!cropperImage) return;
                    const tempCanvas = document.createElement('canvas');
                    const size = 160;
                    tempCanvas.width = size;
                    tempCanvas.height = size;
                    const tCtx = tempCanvas.getContext('2d');
                    const scale = cropperCanvas.height / cropperImage.height;
                    const sourceX = (cropState.x - cropState.radius) / scale;
                    const sourceY = (cropState.y - cropState.radius) / scale;
                    const sourceSize = (cropState.radius * 2) / scale;
                    tCtx.drawImage(cropperImage, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
                    const base64 = tempCanvas.toDataURL('image/jpeg', 0.85);

                    try {
                        submitCropBtn.disabled = true;
                        submitCropBtn.textContent = 'Saving...';
                        localStorage.setItem('12am_profile_picture', base64);
                        if (devUser) {
                            devUser.avatar_type = 'custom';
                            devUser.pfpType = 'custom';
                            devUser.customPfp = base64;
                            devUser.avatar_url = base64;
                            devUser.avatar = base64;
                            devUser.pfp = base64;
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        const bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            bound.avatar_type = 'custom';
                            bound.pfpType = 'custom';
                            bound.customPfp = base64;
                            bound.avatar_url = base64;
                            bound.avatar = base64;
                            bound.pfp = base64;
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }

                        if (customPreviewImg) {
                            customPreviewImg.src = base64;
                            customPreviewImg.style.display = 'block';
                        }
                        if (customPreviewPlaceholder) {
                            customPreviewPlaceholder.style.display = 'none';
                        }

                        const uid = (currentUser ? (currentUser.uid || currentUser.id) : null) || (devUser ? (devUser.id || devUser.deviceToken) : null);
                        if (uid) {
                            await saveUserData(uid, { customPfp: base64, pfpType: 'custom', avatar_url: base64 });
                        }

                        if (typeof window.__updateNavbarUser === 'function') {
                            window.__updateNavbarUser();
                        }
                        window.dispatchEvent(new CustomEvent('pfp-updated', { detail: { pfpType: 'custom', customPfp: base64 } }));
                        cropperModal.style.display = 'none';
                        showMessage(pfpMessage, 'Profile picture updated successfully!', 'success');
                    } catch(err) {
                        console.error('PFP save error:', err);
                        showMessage(pfpMessage, 'Failed to save cropped image.', 'error');
                    } finally {
                        submitCropBtn.disabled = false;
                        submitCropBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Submit';
                    }
                };
            }

            if (removeAvatarBtn) {
                removeAvatarBtn.onclick = () => {
                    try {
                        localStorage.removeItem('12am_profile_picture');
                        if (devUser) {
                            delete devUser.customPfp;
                            delete devUser.avatar_url;
                            delete devUser.avatar;
                            delete devUser.pfp;
                            devUser.avatar_type = 'letter';
                            devUser.pfpType = 'letter';
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        const bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            delete bound.customPfp;
                            delete bound.avatar_url;
                            delete bound.avatar;
                            delete bound.pfp;
                            bound.avatar_type = 'letter';
                            bound.pfpType = 'letter';
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                        if (customPreviewImg) customPreviewImg.style.display = 'none';
                        if (customPreviewPlaceholder) customPreviewPlaceholder.style.display = 'flex';
                        if (typeof window.__updateNavbarUser === 'function') {
                            window.__updateNavbarUser();
                        }
                        showMessage(pfpMessage, 'Removed custom profile picture.', 'success');
                    } catch(err) {}
                };
            }

            // 2. Username Save
            const usernameInput = document.getElementById('settingsUsernameInput');
            const saveUsernameBtn = document.getElementById('settingsSaveUsernameBtn');
            const usernameMsg = document.getElementById('usernameMessage');

            if (saveUsernameBtn && usernameInput) {
                saveUsernameBtn.addEventListener('click', async () => {
                    const newUsername = usernameInput.value.trim();
                    if (!newUsername || newUsername.length < 2) {
                        showMessage(usernameMsg, 'Username must be at least 2 characters.', 'error');
                        return;
                    }
                    if (newUsername.length > 24) {
                        showMessage(usernameMsg, 'Username cannot exceed 24 characters.', 'error');
                        return;
                    }
                    try {
                        if (devUser) {
                            devUser.nickname = newUsername;
                            devUser.firstName = newUsername;
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        const bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        if (bound) {
                            bound.nickname = newUsername;
                            bound.firstName = newUsername;
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                        if (window.supabase) {
                            const uid = devUser?.id || devUser?.deviceToken;
                            if (uid) {
                                await window.supabase.from('profiles').upsert({ id: uid, username: newUsername }).catch(() => {});
                            }
                        }
                    } catch(err) {}
                    if (typeof window.__updateNavbarUser === 'function') {
                        window.__updateNavbarUser();
                    }
                    showMessage(usernameMsg, 'Username saved successfully!', 'success');
                });
            }

            // 3. PIN Update
            const currentPinInput = document.getElementById('currentPinInput');
            const newPinInput = document.getElementById('newPinInput');
            const confirmNewPinInput = document.getElementById('confirmNewPinInput');
            const updatePinBtn = document.getElementById('settingsUpdatePinBtn');
            const pinMsg = document.getElementById('pinMessage');

            if (updatePinBtn) {
                updatePinBtn.addEventListener('click', async () => {
                    const currentPin = (currentPinInput.value || '').trim();
                    const newPin = (newPinInput.value || '').trim();
                    const confirmPin = (confirmNewPinInput.value || '').trim();

                    let bound = null;
                    if (window.TwelveAMAuth && typeof window.TwelveAMAuth.getBoundDeviceAccount === 'function') {
                        bound = await window.TwelveAMAuth.getBoundDeviceAccount();
                    }
                    if (!bound) {
                        try {
                            bound = JSON.parse(localStorage.getItem('12am_device_account') || 'null');
                        } catch(e) {}
                    }

                    const actualPin = bound?.pin || devUser?.pin || '';

                    if (!currentPin) {
                        showMessage(pinMsg, 'Please enter your current PIN.', 'error');
                        return;
                    }
                    if (actualPin && currentPin !== actualPin) {
                        showMessage(pinMsg, 'Current PIN is incorrect.', 'error');
                        return;
                    }
                    if (!/^\d{4,6}$/.test(newPin)) {
                        showMessage(pinMsg, 'New PIN must be between 4 and 6 numeric digits.', 'error');
                        return;
                    }
                    if (newPin !== confirmPin) {
                        showMessage(pinMsg, 'New PIN and confirmation PIN do not match.', 'error');
                        return;
                    }

                    try {
                        if (bound) {
                            bound.pin = newPin;
                            localStorage.setItem('12am_device_account', JSON.stringify(bound));
                        }
                        if (devUser) {
                            devUser.pin = newPin;
                            localStorage.setItem('12am_user', JSON.stringify(devUser));
                        }
                        if (window.indexedDB) {
                            try {
                                const req = indexedDB.open('12AM_DeviceDB', 1);
                                req.onsuccess = (e) => {
                                    const db = e.target.result;
                                    if (db.objectStoreNames.contains('device_account')) {
                                        const tx = db.transaction('device_account', 'readwrite');
                                        tx.objectStore('device_account').put({
                                            id: 'primary_device',
                                            deviceToken: localStorage.getItem('12am_device_token') || '',
                                            account: bound || devUser
                                        });
                                    }
                                };
                            } catch(idbErr) {}
                        }
                    } catch(err) {}

                    currentPinInput.value = '';
                    newPinInput.value = '';
                    confirmNewPinInput.value = '';
                    showMessage(pinMsg, 'PIN updated successfully!', 'success');
                });
            }
            } catch (err) {
                console.error("Error in loadGeneralTab:", err);
            }
        }


        /**
         * Loads data and adds event listeners for the Personalization tab.
         * Exclusively handles Theme Selection and Custom Theme Creator.
         */
        async function loadPersonalizationTab() {
            const themePickerContainer = document.getElementById('theme-picker-container');
            const themeMessage = document.getElementById('themeMessage');
            if (!themePickerContainer) return;

            const lightThemeNames = ['Light'];

            function renderThemesGrid() {
                const allAvail = window.getThemes ? window.getThemes() : [];
                let savedTheme = null;
                try {
                    savedTheme = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY));
                } catch (e) {}
                const activeThemeName = savedTheme ? savedTheme.name : 'Original';

                let themeButtonsHtml = '';
                for (const theme of allAvail) {
                    if (lightThemeNames.includes(theme.name)) {
                        theme['logo-src'] = '/images/logo-dark.png'; 
                    } else {
                        theme['logo-src'] = '/images/logo.png';
                    }
                    
                    const isActive = (theme.name.toLowerCase() === activeThemeName.toLowerCase());
                    const themeTextColor = theme['accent-primary'] || (lightThemeNames.includes(theme.name) ? '#0f172a' : '#ffffff');
                    const activeBorder = theme['accent-primary'] || theme['tab-active-border'] || '#ff8c00';
                    const activeBg = theme['bg-primary'] || '#08080a';
                    const hoverBorder = theme['accent-primary'] || '#ff8c00';
                    const hoverBg = theme['button-bg'] || 'rgba(255, 140, 0, 0.2)';

                    themeButtonsHtml += `
                        <div class="relative group">
                            <button 
                                type="button"
                                class="theme-button ${isActive ? 'active' : ''}" 
                                data-theme-name="${escapeHtml(theme.name)}" 
                                style="
                                    color: ${themeTextColor} !important; 
                                    font-weight: 500;
                                    border-color: ${activeBorder}; 
                                    background: ${activeBg};
                                    --hover-color: ${themeTextColor};
                                    --hover-border: ${hoverBorder};
                                    --hover-bg: ${hoverBg};
                                    position: relative;
                                "
                            >
                                <span style="color: ${themeTextColor} !important; font-weight: 500;">${escapeHtml(theme.name)}</span>
                            </button>
                            ${theme.isCustom ? `
                                <button type="button" class="delete-custom-theme-btn absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer shadow-md transition-all" data-delete-name="${escapeHtml(theme.name)}" title="Delete custom theme">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }

                themePickerContainer.innerHTML = themeButtonsHtml;

                // Wire up theme buttons
                themePickerContainer.querySelectorAll('.theme-button').forEach(button => {
                    button.addEventListener('click', async () => {
                        const themeName = button.dataset.themeName;
                        const themeToApply = allAvail.find(t => t.name.toLowerCase() === themeName.toLowerCase());
                        
                        if (themeToApply) {
                            if (window.applyTheme) {
                                window.applyTheme(themeToApply, true);
                            }
                            if (currentUser) {
                                try {
                                    const uId = currentUser.uid || currentUser.deviceToken || currentUser.id || 'local_user';
                                    await saveUserData(uId, { navbarTheme: themeToApply });
                                } catch (error) {}
                            }
                            renderThemesGrid();
                            showMessage(themeMessage, `${themeToApply.name} theme applied!`, 'success');
                        }
                    });
                });

                // Wire up custom delete buttons
                themePickerContainer.querySelectorAll('.delete-custom-theme-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const delName = btn.dataset.deleteName;
                        if (confirm(`Delete custom theme "${delName}"?`)) {
                            if (window.deleteCustomTheme) {
                                window.deleteCustomTheme(delName);
                            }
                            renderThemesGrid();
                            showMessage(themeMessage, `Custom theme "${delName}" deleted.`, 'info');
                        }
                    });
                });
            }

            renderThemesGrid();

            // Color Wheel Canvas Engine
            function initCanvasColorWheel(canvasId, cursorId, labelId, swatchId, initialHex) {
                const canvas = document.getElementById(canvasId);
                const cursor = document.getElementById(cursorId);
                const label = document.getElementById(labelId);
                const swatch = document.getElementById(swatchId);
                if (!canvas) return { getHex: () => initialHex, setHex: () => {} };

                const ctx = canvas.getContext('2d');
                const size = canvas.width;
                const center = size / 2;
                const radius = center - 4;

                function drawWheel() {
                    ctx.clearRect(0, 0, size, size);
                    for (let angle = 0; angle < 360; angle += 1) {
                        const radStart = ((angle - 1) * Math.PI) / 180;
                        const radEnd = ((angle + 1) * Math.PI) / 180;
                        ctx.beginPath();
                        ctx.moveTo(center, center);
                        ctx.arc(center, center, radius, radStart, radEnd);
                        ctx.closePath();
                        const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
                        grad.addColorStop(0, '#ffffff');
                        grad.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
                        ctx.fillStyle = grad;
                        ctx.fill();
                    }
                }
                drawWheel();

                let currentHex = initialHex;

                function hslToHex(h, s, l) {
                    h = h % 360;
                    s /= 100;
                    l /= 100;
                    const c = (1 - Math.abs(2 * l - 1)) * s;
                    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                    const m = l - c / 2;
                    let r = 0, g = 0, b = 0;
                    if (0 <= h && h < 60) { r = c; g = x; }
                    else if (60 <= h && h < 120) { r = x; g = c; }
                    else if (120 <= h && h < 180) { g = c; b = x; }
                    else if (180 <= h && h < 240) { g = x; b = c; }
                    else if (240 <= h && h < 300) { r = x; b = c; }
                    else if (300 <= h && h < 360) { r = c; b = x; }
                    const toHex = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
                    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                }

                function hexToHsl(hex) {
                    let c = hex.replace('#', '');
                    if (c.length === 3) c = c.split('').map(x => x + x).join('');
                    const r = parseInt(c.substr(0, 2), 16) / 255;
                    const g = parseInt(c.substr(2, 2), 16) / 255;
                    const b = parseInt(c.substr(4, 2), 16) / 255;
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
                        h *= 60;
                    }
                    return { h, s: s * 100, l: l * 100 };
                }

                function setFromHex(hex) {
                    currentHex = hex;
                    if (label) label.textContent = hex;
                    if (swatch) swatch.style.backgroundColor = hex;
                    const hsl = hexToHsl(hex);
                    const rad = (hsl.h * Math.PI) / 180;
                    const dist = (hsl.s / 100) * radius;
                    const curX = center + dist * Math.cos(rad);
                    const curY = center + dist * Math.sin(rad);
                    if (cursor) {
                        cursor.style.left = `${curX}px`;
                        cursor.style.top = `${curY}px`;
                    }
                }

                function pick(e) {
                    const rect = canvas.getBoundingClientRect();
                    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
                    const x = clientX - rect.left - center;
                    const y = clientY - rect.top - center;
                    const dist = Math.min(Math.hypot(x, y), radius);
                    const angle = (Math.atan2(y, x) * 180) / Math.PI;
                    const hue = (angle + 360) % 360;
                    const sat = (dist / radius) * 100;
                    const hex = hslToHex(hue, sat, 50);
                    currentHex = hex;
                    if (label) label.textContent = hex;
                    if (swatch) swatch.style.backgroundColor = hex;
                    const curX = center + dist * Math.cos((angle * Math.PI) / 180);
                    const curY = center + dist * Math.sin((angle * Math.PI) / 180);
                    if (cursor) {
                        cursor.style.left = `${curX}px`;
                        cursor.style.top = `${curY}px`;
                    }
                }

                let isDragging = false;
                canvas.addEventListener('mousedown', (e) => { isDragging = true; pick(e); });
                window.addEventListener('mousemove', (e) => { if (isDragging) pick(e); });
                window.addEventListener('mouseup', () => { isDragging = false; });

                canvas.addEventListener('touchstart', (e) => { isDragging = true; pick(e); e.preventDefault(); }, { passive: false });
                window.addEventListener('touchmove', (e) => { if (isDragging) pick(e); });
                window.addEventListener('touchend', () => { isDragging = false; });

                setFromHex(initialHex);
                return {
                    getHex: () => currentHex,
                    setHex: setFromHex
                };
            }

            // Initialize the 3 Color Wheels
            const wheel1 = initCanvasColorWheel('wheelCanvas1', 'wheelCursor1', 'hexLabel1', 'previewSwatch1', '#ff8800');
            const wheel2 = initCanvasColorWheel('wheelCanvas2', 'wheelCursor2', 'hexLabel2', 'previewSwatch2', '#0a0a0f');
            const wheel3 = initCanvasColorWheel('wheelCanvas3', 'wheelCursor3', 'hexLabel3', 'previewSwatch3', '#ffd700');

            // Wire up Enable / Disable for Color 2 (Background Tint)
            let color2Enabled = false;
            const overlay2 = document.getElementById('overlayColor2');
            const enableBtn2 = document.getElementById('enableColor2Btn');
            const disableBtn2 = document.getElementById('disableColor2Btn');

            if (enableBtn2 && overlay2) {
                enableBtn2.addEventListener('click', () => {
                    color2Enabled = true;
                    overlay2.classList.add('hidden');
                    if (disableBtn2) {
                        disableBtn2.classList.remove('hidden');
                        disableBtn2.classList.add('flex');
                    }
                });
            }

            if (disableBtn2 && overlay2) {
                disableBtn2.addEventListener('click', () => {
                    color2Enabled = false;
                    overlay2.classList.remove('hidden');
                    disableBtn2.classList.add('hidden');
                    disableBtn2.classList.remove('flex');
                });
            }

            // Wire up Enable / Disable for Color 3 (Secondary Glow)
            let color3Enabled = false;
            const overlay3 = document.getElementById('overlayColor3');
            const enableBtn3 = document.getElementById('enableColor3Btn');
            const disableBtn3 = document.getElementById('disableColor3Btn');

            if (enableBtn3 && overlay3) {
                enableBtn3.addEventListener('click', () => {
                    color3Enabled = true;
                    overlay3.classList.add('hidden');
                    if (disableBtn3) {
                        disableBtn3.classList.remove('hidden');
                        disableBtn3.classList.add('flex');
                    }
                });
            }

            if (disableBtn3 && overlay3) {
                disableBtn3.addEventListener('click', () => {
                    color3Enabled = false;
                    overlay3.classList.remove('hidden');
                    disableBtn3.classList.add('hidden');
                    disableBtn3.classList.remove('flex');
                });
            }

            // Save Custom Theme Button
            const customThemeNameInput = document.getElementById('customThemeNameInput');
            const saveCustomThemeBtn = document.getElementById('saveCustomThemeBtn');
            const customThemeMessage = document.getElementById('customThemeMessage');

            if (saveCustomThemeBtn) {
                saveCustomThemeBtn.addEventListener('click', () => {
                    const c1 = wheel1.getHex();
                    const c2 = color2Enabled ? wheel2.getHex() : null;
                    const c3 = color3Enabled ? wheel3.getHex() : null;
                    const name = (customThemeNameInput && customThemeNameInput.value.trim()) ? customThemeNameInput.value.trim() : 'Custom Theme';

                    if (window.createCustomTheme) {
                        const created = window.createCustomTheme(name, c1, c2, c3);
                        renderThemesGrid();
                        showMessage(customThemeMessage, `Theme "${created.name}" created and applied!`, 'success');
                        if (customThemeNameInput) customThemeNameInput.value = '';
                    } else {
                        showMessage(customThemeMessage, 'Theme engine not ready.', 'error');
                    }
                });
            }
        }
        
        // --- NEW: Loads data and adds event listeners for the Data tab ---
        async function loadDataTab() {
            // Get elements (buttons, modal)
            const exportBtn = document.getElementById('exportDataBtn');
            const importBtn = document.getElementById('importDataBtn');
            const modal = document.getElementById('modalPrompt');
            const modalClose = document.getElementById('modalClose');
            
            // Wire up buttons
            if (exportBtn) exportBtn.addEventListener('click', downloadAllSaves);
            if (importBtn) importBtn.addEventListener('click', handleFileUpload);
            
            // Wire up modal close events
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    modal.style.display = "none";
                });
            }
            // Use a new listener specific to this page
            const modalBackground = document.getElementById('modalPrompt');
            if (modalBackground) {
                modalBackground.addEventListener('click', event => {
                    if (event.target === modalBackground) {
                        modal.style.display = "none";
                    }
                });
            }
        }


        /**
         * Handles the switching of tabs and updating the main content view.
         */
        async function switchTab(tabId) {
            // 1. Update active class on sidebar tabs
            sidebarTabs.forEach(tab => {
                tab.classList.remove('active');
            });
            const currentTabEl = document.getElementById(`tab-${tabId}`);
            if (currentTabEl) currentTabEl.classList.add('active');

            // Sync with secondary floating settings dock
            const dockBtns = document.querySelectorAll('#settings-floating-dock .settings-dock-btn');
            dockBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabId);
            });

            // 2. Update the main view content and alignment
            mainView.style.justifyContent = 'flex-start';
            mainView.style.alignItems = 'flex-start';

            if (tabId === 'general') {
                await loadGeneralTab(); 
            }
            else if (tabId === 'privacy') {
                mainView.innerHTML = getPrivacyContent();
                await loadPrivacyTab();
            }
            else if (tabId === 'social') {
                mainView.innerHTML = getSocialContent();
                await loadSocialTab();
            }
            else if (tabId === 'personalization') {
                mainView.innerHTML = getPersonalizationContent();
                await loadPersonalizationTab();
            }
            else if (tabId === 'data') {
                mainView.innerHTML = getDataManagementContent();
                await loadDataTab();
            }
            else if (tabId === 'about') {
                mainView.innerHTML = getAboutContent();
            } else {
                const content = tabContent[tabId];
                mainView.innerHTML = getComingSoonContent(content ? content.title : tabId);
            }

            // 3. Smoothly scroll the window back to the top (y=0)
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        window.switchSettingsTab = switchTab;

        // --- Initialization on Load ---
        
        // Add listener to each sidebar button
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                await switchTab(tab.dataset.tab);
            });
        });

        // Immediately load General tab so settings view is never blank
        switchTab('general');

        async function initializeAuth() {
            const handleUser = async (user, source = 'supabase') => {
                if (user) {
                    currentUser = user;
                    currentSource = source;
                    const uid = user.id;
                    
                    // Check admin status
                    try {
                        isUserAdmin = await checkAdminStatus(uid);
                    } catch (e) {
                        console.warn("Could not verify admin status:", e.message);
                        isUserAdmin = false;
                    }

                    if (isUserAdmin) {
                        const adminTab = document.getElementById('tab-management');
                        if (adminTab) adminTab.classList.remove('hidden');
                    }

                    // Reload general tab with user data
                    const activeTabBtn = document.querySelector('#settings-sidebar .settings-tab.active, #settings-floating-dock .settings-dock-btn.active');
                    const activeTabId = activeTabBtn ? activeTabBtn.dataset.tab : 'general';
                    if (activeTabId === 'general') {
                        await loadGeneralTab();
                    }
                } else {
                    // In-page modal popup instead of page redirect
                    if (window.TwelveAMAuth) {
                        window.TwelveAMAuth.showAuthModal((u) => {
                            const synthetic = {
                                id: u.deviceToken || 'dev_' + (u.nickname || 'user'),
                                email: (u.nickname || 'user') + '@12am.local',
                                user_metadata: {
                                    full_name: (u.firstName || '') + ' ' + (u.lastName || ''),
                                    global_name: u.nickname || u.firstName
                                }
                            };
                            handleUser(synthetic, 'device');
                        });
                    }
                }
            };

            // 1. Check Device Auth first
            const devUser = window.TwelveAMAuth ? window.TwelveAMAuth.getCurrentUser() : null;
            if (devUser) {
                const syntheticUser = {
                    id: devUser.deviceToken || 'dev_' + (devUser.nickname || 'user'),
                    email: (devUser.nickname || 'user') + '@12am.local',
                    user_metadata: {
                        full_name: (devUser.firstName || '') + ' ' + (devUser.lastName || ''),
                        global_name: devUser.nickname || devUser.firstName
                    }
                };
                handleUser(syntheticUser, 'device');
                return;
            }

            // 2. Supabase Session Check
            if (window.supabase) {
                try {
                    const { data: { session } } = await window.supabase.auth.getSession();
                    if (session) {
                        handleUser(session.user, 'supabase');
                        return;
                    }
                } catch(e) {}
            }

            // If neither active, show modal popup
            handleUser(null);
        }
        
        // Use a short timeout to allow the rest of the script to run before auth check
        setTimeout(() => { initializeAuth(); }, 100);
        
        // Use a short timeout to allow the rest of the script to run before auth check
        setTimeout(() => { initializeAuth(); }, 100);
