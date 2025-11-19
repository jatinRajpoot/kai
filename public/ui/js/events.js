import { state, saveToken } from './state.js';
import { apiFetch } from './api.js';
import { dom, showSection, updateTokenIndicator, setStatusText, navigation } from './render.js';
import { refreshAll, loadGoals, loadHabits, loadHabitLogs, loadDailyLogs, loadAnalytics, loadNotes } from './actions.js';

const modalElements = dom.modal || {};
let modalCleanup = null;
let modalListenersReady = false;
let previousBodyOverflow = '';

export function initNavigation() {
    const defaultSection = state.token ? 'dashboard' : 'login';
    showSection(defaultSection);
    navigation.buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const target = button.dataset.nav;
            if (target) {
                showSection(target);
            }
        });
    });
}

export function initFormToggles() {
    const toggleButtons = document.querySelectorAll('[data-toggle-form]');
    toggleButtons.forEach((button) => {
        const targetId = button.dataset.toggleForm;
        if (!targetId) {
            return;
        }
        const container = document.querySelector(`[data-form-container="${targetId}"]`);
        if (!container) {
            return;
        }

        button.addEventListener('click', () => {
            const isHidden = container.hasAttribute('hidden');
            if (isHidden) {
                container.removeAttribute('hidden');
            } else {
                container.setAttribute('hidden', '');
            }
            button.setAttribute('aria-expanded', String(isHidden));
        });
    });
}

export function initBackupControls() {
    const controls = dom.backup || {};
    const { downloadButton, exportStatus, importForm, fileInput, importStatus } = controls;

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            handleBackupExport(downloadButton, exportStatus);
        });
    }

    if (importForm && fileInput) {
        importForm.addEventListener('submit', (event) => {
            event.preventDefault();
            handleBackupImport(fileInput, importStatus);
        });
    }
}

async function handleBackupExport(button, statusEl) {
    if (!button || !statusEl) {
        return;
    }

    if (!state.token) {
        setStatusText(statusEl, 'Authenticate first to run a backup.', 'error');
        return;
    }

    button.disabled = true;
    setStatusText(statusEl, 'Preparing backup...');
    try {
        const result = await apiFetch('/backup/export');
        if (!result.backup) {
            throw new Error('Backup payload missing');
        }

        const filename = result.filename || `kai-backup-${Date.now()}.json`;
        downloadJsonFile(result.backup, filename);
        setStatusText(statusEl, `Backup created (${new Date().toLocaleString()})`, 'success');
    } catch (error) {
        setStatusText(statusEl, error.message || 'Unable to generate backup', 'error');
    } finally {
        button.disabled = false;
    }
}

async function handleBackupImport(fileInput, statusEl) {
    if (!fileInput || !statusEl) {
        return;
    }

    if (!state.token) {
        setStatusText(statusEl, 'Authenticate first to import data.', 'error');
        return;
    }

    const file = fileInput.files?.[0];
    if (!file) {
        setStatusText(statusEl, 'Select a .json backup file to continue.', 'error');
        return;
    }

    setStatusText(statusEl, `Reading ${file.name}...`);
    try {
        const text = await file.text();
        let backup;
        try {
            backup = JSON.parse(text);
        } catch (parseError) {
            throw new Error('File is not valid JSON.');
        }

        setStatusText(statusEl, 'Uploading backup...');
        await apiFetch('/backup/import', {
            method: 'POST',
            body: JSON.stringify({ backup }),
        });

        setStatusText(statusEl, 'Import complete. Dashboard refreshed.', 'success');
        fileInput.value = '';
        await refreshAll();
    } catch (error) {
        setStatusText(statusEl, error.message || 'Import failed', 'error');
    }
}

function downloadJsonFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function setupEventListeners() {
    initDialogControls();

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const result = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }, false);
            saveToken(result.token);
            updateTokenIndicator();
            showSection('dashboard');
            refreshAll();
        } catch (error) {
            alert(error.message || 'Login failed');
        }
    });

    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await apiFetch('/goals', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('goalName').value,
                    description: document.getElementById('goalDesc').value,
                }),
            });
            goalForm.reset();
            refreshAll();
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
            await apiFetch(`/goals/${document.getElementById('phaseGoalId').value}/phases`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            phaseForm.reset();
            clearPhaseSelection();
            refreshAll();
        });
    }

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = {
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDesc').value,
                priority: document.getElementById('taskPriority').value,
                due_date: document.getElementById('taskDue').value,
            };
            await apiFetch(`/phases/${document.getElementById('taskPhaseId').value}/tasks`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            taskForm.reset();
            clearTaskSelection();
            refreshAll();
        });
    }

    document.querySelectorAll('.noteForm').forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            await apiFetch(`/${form.dataset.endpoint}`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            form.reset();
            loadNotes(form.dataset.endpoint);
        });
    });

    const habitCreateForm = document.getElementById('habitCreateForm');
    if (habitCreateForm) {
        habitCreateForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('habitCreateName').value.trim();
            if (!name) {
                return;
            }

            await apiFetch('/habits', {
                method: 'POST',
                body: JSON.stringify({ name }),
            });

            habitCreateForm.reset();
            await Promise.all([loadHabits(), loadAnalytics()]);
        });
    }

    const habitForm = document.getElementById('habitForm');
    if (habitForm) {
        habitForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await apiFetch('/habits/log', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('habitName').value,
                    status: Number(document.getElementById('habitStatus').value),
                    date: document.getElementById('habitDate').value,
                }),
            });
            habitForm.reset();
            await loadHabitLogs();
            await loadAnalytics();
        });
    }

    const dailyForm = document.getElementById('dailyForm');
    if (dailyForm) {
        dailyForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await apiFetch('/daily/log', {
                method: 'POST',
                body: JSON.stringify({
                    log_date: document.getElementById('dailyDate').value,
                    summary: document.getElementById('dailySummary').value,
                    mood: document.getElementById('dailyMood').value,
                    energy: document.getElementById('dailyEnergy').value,
                }),
            });
            dailyForm.reset();
            await loadDailyLogs();
        });
    }

    if (dom.tasksList) {
        dom.tasksList.addEventListener('click', handleTaskListClick);
    }

    if (dom.goalsList) {
        dom.goalsList.addEventListener('click', handleGoalListClick);
    }

    if (dom.phasesList) {
        dom.phasesList.addEventListener('click', handlePhaseListClick);
    }
}

async function handleTaskListClick(event) {
    const deleteButton = event.target.closest('button[data-task-delete]');
    if (deleteButton) {
        const taskId = Number(deleteButton.dataset.taskDelete);
        if (!taskId) {
            return;
        }

        if (!window.confirm('Delete this task?')) {
            return;
        }

        const originalDeleteText = deleteButton.textContent;
        deleteButton.disabled = true;
        deleteButton.textContent = 'Deleting...';

        try {
            await apiFetch(`/tasks/${taskId}`, {
                method: 'DELETE',
            });
            await Promise.all([loadGoals(), loadAnalytics()]);
        } catch (error) {
            alert(error.message || 'Unable to delete task');
        } finally {
            deleteButton.disabled = false;
            deleteButton.textContent = originalDeleteText;
        }

        return;
    }

    const button = event.target.closest('button[data-task-complete]');
    if (!button) {
        return;
    }

    const taskId = Number(button.dataset.taskComplete);
    if (!taskId) {
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Updating...';

    try {
        await apiFetch(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'done' }),
        });
        await Promise.all([loadGoals(), loadAnalytics()]);
    } catch (error) {
        alert(error.message || 'Unable to update task');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function handleGoalListClick(event) {
    const addPhaseButton = event.target.closest('button[data-goal-add-phase]');
    if (addPhaseButton) {
        const goalId = Number(addPhaseButton.dataset.goalAddPhase);
        if (goalId) {
            openPhaseDialog(goalId);
        }
        return;
    }

    const deleteButton = event.target.closest('button[data-goal-delete]');
    if (deleteButton) {
        const goalId = Number(deleteButton.dataset.goalDelete);
        if (!goalId) {
            return;
        }

        if (!window.confirm('Delete this goal? All related phases and tasks will also be removed.')) {
            return;
        }

        const originalDeleteText = deleteButton.textContent;
        deleteButton.disabled = true;
        deleteButton.textContent = 'Deleting...';

        try {
            await apiFetch(`/goals/${goalId}`, {
                method: 'DELETE',
            });
            await Promise.all([loadGoals(), loadAnalytics()]);
        } catch (error) {
            alert(error.message || 'Unable to delete goal');
        } finally {
            deleteButton.disabled = false;
            deleteButton.textContent = originalDeleteText;
        }

        return;
    }

    const button = event.target.closest('button[data-goal-status]');
    if (!button) {
        return;
    }

    const goalId = Number(button.dataset.goalStatus);
    const nextStatus = button.dataset.nextStatus;
    if (!goalId || !nextStatus) {
        return;
    }

    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Updating...';

    try {
        await apiFetch(`/goals/${goalId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus }),
        });
        await loadGoals();
    } catch (error) {
        alert(error.message || 'Unable to update goal');
    } finally {
        button.disabled = false;
        button.textContent = original;
    }
}

async function handlePhaseListClick(event) {
    const addTaskButton = event.target.closest('button[data-phase-add-task]');
    if (addTaskButton) {
        const phaseId = Number(addTaskButton.dataset.phaseAddTask);
        if (phaseId) {
            openTaskDialog(phaseId);
        }
        return;
    }

    const deleteButton = event.target.closest('button[data-phase-delete]');
    if (deleteButton) {
        const phaseId = Number(deleteButton.dataset.phaseDelete);
        if (!phaseId) {
            return;
        }

        if (!window.confirm('Delete this phase? Tasks inside it will also be removed.')) {
            return;
        }

        const originalDeleteText = deleteButton.textContent;
        deleteButton.disabled = true;
        deleteButton.textContent = 'Deleting...';

        try {
            await apiFetch(`/phases/${phaseId}`, {
                method: 'DELETE',
            });
            await Promise.all([loadGoals(), loadAnalytics()]);
        } catch (error) {
            alert(error.message || 'Unable to delete phase');
        } finally {
            deleteButton.disabled = false;
            deleteButton.textContent = originalDeleteText;
        }

        return;
    }

    const button = event.target.closest('button[data-phase-status]');
    if (!button) {
        return;
    }

    const phaseId = Number(button.dataset.phaseStatus);
    const nextStatus = button.dataset.nextStatus;
    if (!phaseId || !nextStatus) {
        return;
    }

    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Updating...';

    try {
        await apiFetch(`/phases/${phaseId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus }),
        });
        await loadGoals();
    } catch (error) {
        alert(error.message || 'Unable to update phase');
    } finally {
        button.disabled = false;
        button.textContent = original;
    }
}

function openPhaseDialog(goalId) {
    const goal = findGoal(goalId);
    if (!goal) {
        return;
    }

    openDialog({
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
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Saving...';

                try {
                    await apiFetch(`/goals/${goal.id}/phases`, {
                        method: 'POST',
                        body: JSON.stringify({
                            name: nameInput.value.trim(),
                            status: statusSelect?.value || 'planned',
                        }),
                    });
                    closeDialog();
                    await refreshAll();
                } catch (error) {
                    alert(error.message || 'Unable to create phase');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        },
    });
}

function openTaskDialog(phaseId) {
    const match = findPhase(phaseId);
    if (!match) {
        return;
    }

    const { goal, phase } = match;
    openDialog({
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
            titleInput?.focus();

            form?.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!titleInput?.value.trim()) {
                    alert('Task title is required.');
                    return;
                }

                const submitButton = form.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Saving...';

                try {
                    await apiFetch(`/phases/${phase.id}/tasks`, {
                        method: 'POST',
                        body: JSON.stringify({
                            title: titleInput.value.trim(),
                            description: descInput?.value || '',
                            priority: prioritySelect?.value || 'normal',
                            due_date: dueInput?.value || '',
                        }),
                    });
                    closeDialog();
                    await refreshAll();
                } catch (error) {
                    alert(error.message || 'Unable to create task');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        },
    });
}

function initDialogControls() {
    if (modalListenersReady || !modalElements.root) {
        return;
    }

    modalElements.root.addEventListener('click', (event) => {
        const closeTarget = event.target.closest('[data-modal-close]');
        if (closeTarget) {
            event.preventDefault();
            closeDialog();
        }
    });

    document.addEventListener('keydown', handleDialogEscape);
    modalListenersReady = true;
}

function openDialog({ title, content, onReady }) {
    if (!modalElements.root || !modalElements.content || !modalElements.title) {
        return;
    }

    modalElements.title.textContent = title || '';
    if (typeof content === 'string') {
        modalElements.content.innerHTML = content;
    } else {
        modalElements.content.innerHTML = '';
        if (content instanceof Node) {
            modalElements.content.appendChild(content);
        }
    }

    modalElements.root.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
    modalCleanup = typeof onReady === 'function' ? onReady(modalElements.content) : null;
}

function closeDialog() {
    if (!modalElements.root || !modalElements.content || !modalElements.title) {
        return;
    }

    modalElements.root.setAttribute('aria-hidden', 'true');
    modalElements.content.innerHTML = '';
    modalElements.title.textContent = '';

    if (typeof modalCleanup === 'function') {
        modalCleanup();
    }
    modalCleanup = null;
    unlockBodyScroll();
}

function handleDialogEscape(event) {
    if (event.key === 'Escape' && isDialogOpen()) {
        event.preventDefault();
        closeDialog();
    }
}

function isDialogOpen() {
    return Boolean(modalElements.root && modalElements.root.getAttribute('aria-hidden') !== 'true');
}

function lockBodyScroll() {
    if (!document.body) {
        return;
    }
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
    if (!document.body) {
        return;
    }
    document.body.style.overflow = previousBodyOverflow || '';
    previousBodyOverflow = '';
}

function setFormContext(element, text) {
    if (!element) {
        return;
    }

    if (!text) {
        element.textContent = '';
        element.hidden = true;
        return;
    }

    element.textContent = text;
    element.hidden = false;
}

function clearPhaseSelection() {
    if (dom.phaseGoalInput) {
        dom.phaseGoalInput.value = '';
    }
    setFormContext(dom.phaseContext, null);
}

function clearTaskSelection() {
    if (dom.taskPhaseInput) {
        dom.taskPhaseInput.value = '';
    }
    setFormContext(dom.taskContext, null);
}

function findGoal(goalId) {
    const numericId = Number(goalId);
    if (!numericId) {
        return null;
    }
    return state.goals.find((goal) => Number(goal.id) === numericId) || null;
}

function findPhase(phaseId) {
    const numericId = Number(phaseId);
    if (!numericId) {
        return null;
    }

    for (const goal of state.goals) {
        const match = (goal.phases || []).find((phase) => Number(phase.id) === numericId);
        if (match) {
            return { goal, phase: match };
        }
    }

    return null;
}
