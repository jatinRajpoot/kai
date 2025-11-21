import { apiFetch } from '../../core/api.js';

export const BackupService = {
    async export() {
        return apiFetch('/backup/export');
    },

    async import(backupData) {
        return apiFetch('/backup/import', {
            method: 'POST',
            body: JSON.stringify({ backup: backupData }),
        });
    }
};
