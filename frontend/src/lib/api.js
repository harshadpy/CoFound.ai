/**
 * CoFound.ai API Client & Base URL Resolver
 * 
 * Automatically resolves the backend API origin:
 * 1. Explicit import.meta.env.VITE_API_URL (if provided during build or runtime)
 * 2. If running on *.onrender.com, defaults to the live Render backend: https://cofound-ai.onrender.com
 * 3. Localhost / 127.0.0.1: defaults to empty string (proxied via Vite dev server)
 */

export function getApiBaseUrl() {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('.onrender.com')) {
            return 'https://cofound-ai.onrender.com';
        }
    }
    return '';
}

export function apiUrl(path) {
    const base = getApiBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
}

export async function safeFetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { detail: text };
        }
    }
    return { response, data, ok: response.ok, status: response.status };
}
