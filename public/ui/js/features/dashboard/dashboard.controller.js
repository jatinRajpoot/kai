import { DashboardService } from './dashboard.service.js';
import { DashboardView } from './dashboard.view.js';
import { TasksService } from '../tasks/tasks.service.js';
import { state } from '../../core/store.js';
import { dom } from '../../core/dom.js';
import { bus } from '../../core/bus.js';

export const DashboardController = {
    init() {
        this.setupFormListeners();
        this.setupListListeners();
        this.setupFilters();
    },

    async loadAndRenderLogs() {
        try {
            const logs = await DashboardService.getDailyLogs();
            DashboardView.renderDailyLogs(logs);
        } catch (error) {
            console.error('Failed to load daily logs:', error);
        }
    },

    setupFormListeners() {
        const dailyForm = document.getElementById('dailyForm');
        if (dailyForm) {
            dailyForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await DashboardService.createDailyLog({
                    log_date: document.getElementById('dailyDate').value,
                    summary: document.getElementById('dailySummary').value,
                    mood: document.getElementById('dailyMood').value,
                    energy: document.getElementById('dailyEnergy').value,
                });
                dailyForm.reset();
                await this.loadAndRenderLogs();
            });
        }
    },

    setupListListeners() {
        if (dom.dashboardTaskList) {
            dom.dashboardTaskList.addEventListener('change', this.handleDashboardTaskChange.bind(this));
        }
    },

    setupFilters() {
        if (dom.dashboardDateFilter) {
            dom.dashboardDateFilter.addEventListener('change', () => {
                DashboardView.renderTasks(state.goals);
            });
        }
    },

    async handleDashboardTaskChange(event) {
        if (!event.target.matches('.todo-checkbox')) return;

        const checkbox = event.target;
        const taskId = Number(checkbox.dataset.taskId);
        if (!taskId) return;

        const label = checkbox.closest('.todo-label');
        if (label) label.classList.add('completed');

        try {
            await TasksService.update(taskId, { status: 'done' });
            bus.dispatchEvent(new CustomEvent('refresh'));
        } catch (error) {
            alert(error.message || 'Unable to update task');
            checkbox.checked = false;
            if (label) label.classList.remove('completed');
        }
    }
};
