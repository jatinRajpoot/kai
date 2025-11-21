import { apiFetch } from '../../core/api.js';

export const TasksService = {
    async create(phaseId, data) {
        return apiFetch(`/phases/${phaseId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id, data) {
        return apiFetch(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id) {
        return apiFetch(`/tasks/${id}`, {
            method: 'DELETE',
        });
    }
};
