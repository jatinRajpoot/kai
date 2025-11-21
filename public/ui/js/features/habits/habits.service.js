import { apiFetch } from '../../core/api.js';

export const HabitsService = {
    async getAll() {
        return apiFetch('/habits');
    },

    async create(data) {
        return apiFetch('/habits', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async log(data) {
        return apiFetch('/habits/log', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getLogs() {
        return apiFetch('/habits/logs');
    }
};
