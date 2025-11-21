import { apiFetch } from '../../core/api.js';

export const DashboardService = {
    async getDailyLogs(limit = 10) {
        return apiFetch(`/daily/logs?limit=${limit}`);
    },

    async createDailyLog(data) {
        return apiFetch('/daily/log', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
