import { state } from './store.js';
import { dom } from './dom.js';
import { Router } from './router.js';
import { bus } from './bus.js';
import { Modal } from '../shared/ui/modal.js';

import { AuthController } from '../features/auth/auth.controller.js';
import { GoalsController } from '../features/goals/goals.controller.js';
import { TasksController } from '../features/tasks/tasks.controller.js';
import { DashboardController } from '../features/dashboard/dashboard.controller.js';
import { HabitsController } from '../features/habits/habits.controller.js';
import { BackupController } from '../features/backup/backup.controller.js';

import { GoalsService } from '../features/goals/goals.service.js';
import { TasksService } from '../features/tasks/tasks.service.js';

// Global refresh function
async function refreshApp() {
    console.log('Refreshing app data...');
    await Promise.all([
        GoalsController.loadAndRender(),
        DashboardController.loadAndRenderLogs(),
        HabitsController.loadAndRender(),
    ]);

    // Re-render views that depend on shared state
    const { DashboardView } = await import('../features/dashboard/dashboard.view.js');
    DashboardView.renderTasks(state.goals);
}

// Expose for debug
window.refreshApp = refreshApp;

// Dialog Helpers attached to window for access from Controllers
window.openPhaseDialog = (goalId) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    Modal.open({
        title: 'Add Phase',
        content: `
            <form id="dialogPhaseForm" class="stacked-form">
                <div class="form-context">Goal #${goal.id} · ${goal.name}</div>
                <label>Phase name
                    <input type="text" id="dialogPhaseName" placeholder="Phase name" required />
                </label>
                <label>Status
                    <select id="dialogPhaseStatus">
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </label>
                <div class="dialog-actions">
                    <button type="button" class="secondary-action" data-modal-close>Cancel</button>
                    <button type="submit">Save Phase</button>
                </div>
            </form>
        `,
        onReady: (container) => {
            const form = container.querySelector('#dialogPhaseForm');
            const nameInput = container.querySelector('#dialogPhaseName');
            const statusSelect = container.querySelector('#dialogPhaseStatus');
            nameInput?.focus();

            form?.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!nameInput?.value.trim()) {
                    alert('Phase name is required.');
                    return;
                }

                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                submitButton.textContent = 'Saving...';

                try {
                    await GoalsService.createPhase(goal.id, {
                        name: nameInput.value.trim(),
                        status: statusSelect?.value || 'planned',
                    });
                    Modal.close();
                    bus.dispatchEvent(new CustomEvent('refresh'));
                } catch (error) {
                    alert(error.message || 'Unable to create phase');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Save Phase';
                }
            });
        }
    });
};

window.openTaskDialog = (phaseId) => {
    let match = null;
    for (const g of state.goals) {
        const p = (g.phases || []).find(ph => ph.id === phaseId);
        if (p) { match = { goal: g, phase: p }; break; }
    }
    if (!match) return;
    const { goal, phase } = match;

    Modal.open({
        title: 'Add Task',
        content: `
            <form id="dialogTaskForm" class="stacked-form">
                <div class="form-context">Phase #${phase.id} · ${phase.name} (Goal #${goal.id} · ${goal.name})</div>
                <label>Task title
                    <input type="text" id="dialogTaskTitle" placeholder="Task title" required />
                </label>
                <label>Details
                    <textarea id="dialogTaskDesc" placeholder="Details"></textarea>
                </label>
                <label>Priority
                    <select id="dialogTaskPriority">
                        <option value="low">Low</option>
                        <option value="normal" selected>Normal</option>
                        <option value="high">High</option>
                    </select>
                </label>
                <label>Due date
                    <input type="date" id="dialogTaskDue" />
                </label>
                <div class="dialog-actions">
                    <button type="button" class="secondary-action" data-modal-close>Cancel</button>
                    <button type="submit">Save Task</button>
                </div>
            </form>
        `,
        onReady: (container) => {
            const form = container.querySelector('#dialogTaskForm');
            const titleInput = container.querySelector('#dialogTaskTitle');
            const descInput = container.querySelector('#dialogTaskDesc');
            const prioritySelect = container.querySelector('#dialogTaskPriority');
            const dueInput = container.querySelector('#dialogTaskDue');

            // Set today date
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            dueInput.value = `${y}-${m}-${d}`;

            titleInput?.focus();

            form?.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!titleInput?.value.trim()) {
                    alert('Task title is required.');
                    return;
                }

                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                submitButton.textContent = 'Saving...';

                try {
                    await TasksService.create(phase.id, {
                        title: titleInput.value.trim(),
                        description: descInput?.value || '',
                        priority: prioritySelect?.value || 'normal',
                        due_date: dueInput?.value || '',
                    });
                    Modal.close();
                    bus.dispatchEvent(new CustomEvent('refresh'));
                } catch (error) {
                    alert(error.message || 'Unable to create task');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Save Task';
                }
            });
        }
    });
};

function init() {


    if (state.token) {
        dom.tokenDot?.classList.add('active');
        if (dom.tokenLabel) dom.tokenLabel.textContent = 'Authenticated';
    }

    Modal.init();
    Router.init();

    AuthController.init();
    GoalsController.init();
    TasksController.init();
    DashboardController.init();
    HabitsController.init();
    BackupController.init();

    // Setup Event Bus
    bus.addEventListener('refresh', refreshApp);

    // Quick Add FAB
    const quickAddFab = document.getElementById('quickAddFab');
    if (quickAddFab) {
        quickAddFab.addEventListener('click', () => {
            Modal.open({
                title: 'Quick Add',
                content: `
                    <div class="grid-2" style="gap: 1rem;">
                        <button type="button" class="item" id="qaTask"><strong>Task</strong><small>Add to a phase</small></button>
                        <button type="button" class="item" id="qaNote"><strong>Note</strong><small>Idea, Knowledge, or Important</small></button>
                        <button type="button" class="item" id="qaHabit"><strong>Habit</strong><small>Track a habit</small></button>
                        <button type="button" class="item" id="qaLog"><strong>Daily Log</strong><small>Reflect on your day</small></button>
                    </div>
                `,
                onReady: (container) => {
                    container.querySelector('#qaTask')?.addEventListener('click', () => {
                        Modal.close();
                        Router.showSection('phases');
                        const taskFormBtn = document.querySelector('[data-toggle-form="taskForm"]');
                        if (taskFormBtn && taskFormBtn.getAttribute('aria-expanded') === 'false') {
                            taskFormBtn.click();
                        }
                    });
                    container.querySelector('#qaNote')?.addEventListener('click', () => {
                        Modal.close();
                        Router.showSection('ideas');
                        const ideasFormBtn = document.querySelector('[data-toggle-form="ideasForm"]');
                        if (ideasFormBtn && ideasFormBtn.getAttribute('aria-expanded') === 'false') {
                            ideasFormBtn.click();
                        }
                    });
                    container.querySelector('#qaHabit')?.addEventListener('click', () => {
                        Modal.close();
                        Router.showSection('habits');
                        const habitFormBtn = document.querySelector('[data-toggle-form="habitForm"]');
                        if (habitFormBtn && habitFormBtn.getAttribute('aria-expanded') === 'false') {
                            habitFormBtn.click();
                        }
                    });
                    container.querySelector('#qaLog')?.addEventListener('click', () => {
                        Modal.close();
                        Router.showSection('daily');
                        const dailyFormBtn = document.querySelector('[data-toggle-form="dailyForm"]');
                        if (dailyFormBtn && dailyFormBtn.getAttribute('aria-expanded') === 'false') {
                            dailyFormBtn.click();
                        }
                    });
                }
            });
        });
    }

    if (state.token) {
        refreshApp();
    } else {
        Router.showSection('login');
    }
}

// Initialize app
function startApp() {
    console.log('App initializing...');
    try {
        init();
    } catch (error) {
        console.error('App initialization failed:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
