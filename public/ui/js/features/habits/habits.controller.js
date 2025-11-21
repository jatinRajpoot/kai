import { HabitsService } from './habits.service.js';
import { HabitsView } from './habits.view.js';
import { state } from '../../core/store.js';
import { bus } from '../../core/bus.js';

export const HabitsController = {
    init() {
        this.setupFormListeners();
    },

    async loadAndRender() {
        try {
            const [habits, logs] = await Promise.all([
                HabitsService.getAll(),
                HabitsService.getLogs()
            ]);
            state.habits = habits;
            HabitsView.renderList(habits);
            HabitsView.renderLogs(logs);
        } catch (error) {
            console.error('Failed to load habits:', error);
        }
    },

    setupFormListeners() {
        const habitCreateForm = document.getElementById('habitCreateForm');
        if (habitCreateForm) {
            habitCreateForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const name = document.getElementById('habitCreateName').value.trim();
                if (!name) return;

                await HabitsService.create({ name });
                habitCreateForm.reset();
                await this.loadAndRender();
                bus.dispatchEvent(new CustomEvent('refresh'));
            });
        }

        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await HabitsService.log({
                    name: document.getElementById('habitName').value,
                    status: Number(document.getElementById('habitStatus').value),
                    date: document.getElementById('habitDate').value,
                });
                habitForm.reset();
                await this.loadAndRender();
                bus.dispatchEvent(new CustomEvent('refresh'));
            });
        }
    }
};
