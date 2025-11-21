import { state } from './store.js';

export async function apiFetch(url, options = {}, includeToken = true) {
    const config = { ...options };
    config.headers = {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
    };

    if (includeToken && state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(url, config);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
    }

    return payload.data ?? payload;
}
