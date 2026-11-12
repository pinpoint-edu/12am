/**
 * 12AM Injector / Centralized Loader
 * Loads theme, navigation, and core utilities for 12AM pages
 */

(function() {
    if (window.__12am_injector_loaded) return;
    window.__12am_injector_loaded = true;

    // BareMux MessagePort fix
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
        if (!window.__12am_baremux_listener) {
            window.__12am_baremux_listener = true;
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'getPort' && event.data.port) {
                    try {
                        const tempWorker = new SharedWorker("baremux/worker.js", "bare-mux-worker");
                        event.data.port.postMessage(tempWorker.port, [tempWorker.port]);
                    } catch (e) {}
                }
            });
        }
    }

    // Global Loader Controls
    window.hideLoader = () => {
        const loader = document.getElementById('universal-loader');
        if (loader) loader.remove();
    };
    window.showLoader = () => {};

    // Helper to load CSS with relative path
    const loadCSS = (href) => {
        if (document.querySelector(`link[href*="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    };

    // Helper to load script with relative path
    const loadScript = ({ url, type = 'text/javascript' }) => {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src*="${url}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.type = type;
            script.onload = resolve;
            script.onerror = () => {
                resolve(); // Do not block
            };
            document.head.appendChild(script);
        });
    };

    // Always inject navigation CSS
    loadCSS('navigation.css');

    // Relative scripts to load
    const scripts = [
        { url: 'theme.js' },
        { url: 'navigation.js' }
    ];

    async function init() {
        for (const s of scripts) {
            await loadScript(s);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
