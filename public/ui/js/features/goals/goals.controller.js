import { GoalsService } from './goals.service.js';
import { GoalsView } from './goals.view.js';
import { state } from '../../core/store.js';
import { dom } from '../../core/dom.js';
import { bus } from '../../core/bus.js';

// Helper to refresh everything (temporary until full event bus)


export const GoalsController = {
    async init() {
        this.setupFormListeners();
        this.setupListListeners();
    },

    async loadAndRender() {
        try {
            const goals = await GoalsService.getAll();
            state.goals = goals; // specific to this feature, but updating global store
            GoalsView.renderList(goals);
            GoalsView.renderPhases(goals);
        } catch (error) {
            console.error('Failed to load goals:', error);
        }
    },

    setupFormListeners() {
        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await GoalsService.create({
                    name: document.getElementById('goalName').value,
                    description: document.getElementById('goalDesc').value,
                });
                goalForm.reset();
                // In a real app, we'd just add the new goal to state and re-render
                // For now, trigger full refresh to be safe
                // Trigger refresh via bus
                bus.dispatchEvent(new CustomEvent('refresh'));
            });
        }

        const phaseForm = document.getElementById('phaseForm');
        if (phaseForm) {
            phaseForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const payload = {
                    name: document.getElementById('phaseName').value,
                    status: document.getElementById('phaseStatus').value,
                };
                await GoalsService.createPhase(document.getElementById('phaseGoalId').value, payload);
                phaseForm.reset();
                bus.dispatchEvent(new CustomEvent('refresh'));
            });
        }
    },

    setupListListeners() {
        if (dom.goalsList) {
            dom.goalsList.addEventListener('click', this.handleGoalListClick.bind(this));
        }
        if (dom.phasesList) {
            dom.phasesList.addEventListener('click', this.handlePhaseListClick.bind(this));
        }
    },

    async handleGoalListClick(event) {
        // Add Phase
        const addPhaseButton = event.target.closest('button[data-goal-add-phase]');
        if (addPhaseButton) {
            const goalId = Number(addPhaseButton.dataset.goalAddPhase);
            if (goalId && window.openPhaseDialog) {
                window.openPhaseDialog(goalId);
            }
            return;
        }

        // Delete Goal
        const deleteButton = event.target.closest('button[data-goal-delete]');
        if (deleteButton) {
            const goalId = Number(deleteButton.dataset.goalDelete);
            if (!goalId) return;
            if (!confirm('Delete this goal?')) return; // Simple confirm for now

            try {
                await GoalsService.delete(goalId);
                bus.dispatchEvent(new CustomEvent('refresh'));
            } catch (error) {
                alert(error.message);
            }
            return;
        }

        // Update Status
        const statusButton = event.target.closest('button[data-goal-status]');
        if (statusButton) {
            const goalId = Number(statusButton.dataset.goalStatus);
            const nextStatus = statusButton.dataset.nextStatus;
            try {
                await GoalsService.update(goalId, { status: nextStatus });
                bus.dispatchEvent(new CustomEvent('refresh'));
            } catch (error) {
                alert(error.message);
            }
        }
    },

    async handlePhaseListClick(event) {
        // Add Task
        const addTaskButton = event.target.closest('button[data-phase-add-task]');
        if (addTaskButton) {
            const phaseId = Number(addTaskButton.dataset.phaseAddTask);
            if (phaseId && window.openTaskDialog) {
                window.openTaskDialog(phaseId);
            }
            return;
        }

        // Delete Phase
        const deleteButton = event.target.closest('button[data-phase-delete]');
        if (deleteButton) {
            const phaseId = Number(deleteButton.dataset.phaseDelete);
            if (!phaseId) return;
            if (!confirm('Delete this phase?')) return;

            try {
                await GoalsService.deletePhase(phaseId);
                bus.dispatchEvent(new CustomEvent('refresh'));
            } catch (error) {
                alert(error.message);
            }
            return;
        }

        // Update Status
        const statusButton = event.target.closest('button[data-phase-status]');
        if (statusButton) {
            const phaseId = Number(statusButton.dataset.phaseStatus);
            const nextStatus = statusButton.dataset.nextStatus;
            try {
                await GoalsService.updatePhase(phaseId, { status: nextStatus });
                bus.dispatchEvent(new CustomEvent('refresh'));
            } catch (error) {
                alert(error.message);
            }
        }
    }
};
