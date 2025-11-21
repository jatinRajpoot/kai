import { apiFetch } from '../../core/api.js';

export const GoalsService = {
    async getAll() {
        const baseGoals = await apiFetch('/goals');
        // Fetch details for each goal (phases, tasks)
        // Optimization: In a real app, the backend should return this in one go or we load on demand.
        // For now, keeping existing logic.
        const detailed = await Promise.all(
            baseGoals.map(async (goal) => {
                const full = await apiFetch(`/goals/${goal.id}`);
                return { ...goal, phases: full.phases, tasks: full.tasks };
            })
        );
        return detailed;
    },

    async create(data) {
        return apiFetch('/goals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id, data) {
        return apiFetch(`/goals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id) {
        return apiFetch(`/goals/${id}`, {
            method: 'DELETE',
        });
    },

    async createPhase(goalId, data) {
        return apiFetch(`/goals/${goalId}/phases`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updatePhase(id, data) {
        return apiFetch(`/phases/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async deletePhase(id) {
        return apiFetch(`/phases/${id}`, {
            method: 'DELETE',
        });
    }
};
