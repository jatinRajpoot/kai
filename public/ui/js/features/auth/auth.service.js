import { apiFetch } from '../../core/api.js';
import { saveToken } from '../../core/store.js';

export const AuthService = {
    async login(email, password) {
        const result = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }, false);
        if (result.token) {
            saveToken(result.token);
        }
        return result;
    }
};
