import { state, STATUS_FLOW } from './state.js';
import { getLocalDateString } from './date.js';

export const dom = {
    tokenDot: document.getElementById('tokenDot'),
    tokenLabel: document.getElementById('tokenLabel'),
    goalsList: document.getElementById('goalsList'),
    phasesList: document.getElementById('phasesList'),
    tasksList: document.getElementById('tasksList'),
    dashboardTaskList: document.getElementById('dashboardTaskList'),
    phaseForm: document.getElementById('phaseForm'),
    taskForm: document.getElementById('taskForm'),
    phaseFormContainer: document.querySelector('[data-form-container="phaseForm"]'),
    taskFormContainer: document.querySelector('[data-form-container="taskForm"]'),
    phaseGoalInput: document.getElementById('phaseGoalId'),
    taskPhaseInput: document.getElementById('taskPhaseId'),
    phaseContext: document.getElementById('phaseContext'),
    taskContext: document.getElementById('taskContext'),
    phaseNameInput: document.getElementById('phaseName'),
    taskTitleInput: document.getElementById('taskTitle'),
    modal: {
        root: document.getElementById('dialogRoot'),
        title: document.getElementById('dialogTitle'),
        content: document.getElementById('dialogContent'),
    },
    ideasList: document.getElementById('ideasList'),
    knowledgeList: document.getElementById('knowledgeList'),
    importantList: document.getElementById('importantList'),
    habitsList: document.getElementById('habitsList'),
    habitLogs: document.getElementById('habitLogs'),
    dailyList: document.getElementById('dailyList'),
    habitOptions: document.getElementById('habitOptions'),
    backup: {
        downloadButton: document.getElementById('backupDownloadBtn'),
        exportStatus: document.getElementById('backupExportStatus'),
        importForm: document.getElementById('backupImportForm'),
        fileInput: document.getElementById('backupFileInput'),
        importStatus: document.getElementById('backupImportStatus'),
    },
};

export const navigation = {
    buttons: Array.from(document.querySelectorAll('[data-nav]')),
    sections: Array.from(document.querySelectorAll('[data-section]')),
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseYMD(dateString) {
    if (!dateString) {
        return null;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    if ([year, month, day].some((value) => Number.isNaN(value))) {
        return null;
    }
    return new Date(year, (month || 1) - 1, day || 1);
}

function formatShortDate(dateString) {
    const date = parseYMD(dateString);
    if (!date) {
        return dateString || '';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getRelativeDueText(dateString, todayString) {
    const dueDate = parseYMD(dateString);
    const today = parseYMD(todayString);
    if (!dueDate || !today) {
        return null;
    }
    const diff = Math.round((dueDate - today) / DAY_IN_MS);
    if (diff === 0) {
        return 'Due today';
    }
    if (diff === 1) {
        return 'Due tomorrow';
    }
    if (diff > 1) {
        return `Due in ${diff} days`;
    }
    if (diff === -1) {
        return 'Overdue by 1 day';
    }
    return `Overdue by ${Math.abs(diff)} days`;
}

function buildDueText(dateString, todayString) {
    if (!dateString) {
        return '';
    }
    const relativeText = getRelativeDueText(dateString, todayString);
    if (!relativeText) {
        return `Due ${formatShortDate(dateString)}`;
    }
    if (relativeText.startsWith('Due')) {
        return relativeText;
    }
    return `${formatShortDate(dateString)} · ${relativeText}`;
}

export function updateTokenIndicator() {
    if (!dom.tokenDot) {
        return;
    }
    if (state.token) {
        dom.tokenDot.classList.add('active');
        dom.tokenLabel.textContent = 'Authenticated';
    } else {
        dom.tokenDot.classList.remove('active');
        dom.tokenLabel.textContent = 'Not authenticated';
    }
}

export function showSection(sectionName) {
    navigation.buttons.forEach((button) => {
        button.classList.toggle('active', button.dataset.nav === sectionName);
    });

    navigation.sections.forEach((section) => {
        const isActive = section.dataset.section === sectionName;
        section.classList.toggle('visible', isActive);
        section.setAttribute('aria-hidden', String(!isActive));
    });
}

export function renderGoals() {
    if (!dom.goalsList) {
        return;
    }

    dom.goalsList.innerHTML = '';
    if (!state.goals.length) {
        setListEmptyState(dom.goalsList, 'No goals yet. Create one to get started.');
        return;
    }

    const fragment = document.createDocumentFragment();
    state.goals.forEach((goal) => {
        const phaseCount = goal.phase_count ?? (goal.phases ? goal.phases.length : 0);
        const totalTasks = goal.task_count ?? (goal.tasks ? goal.tasks.length : 0);
        const doneTasks = goal.done_count ?? (goal.tasks ? goal.tasks.filter((task) => task.status === 'done').length : 0);
        const status = goal.status || 'planned';
        const nextStatus = getNextStatus(status);
        const el = document.createElement('div');
        el.className = 'item';
        const statusControl = nextStatus
            ? `<button type="button" class="status-advance" data-goal-status="${goal.id}" data-next-status="${nextStatus}">Mark ${formatStatusLabel(nextStatus)}</button>`
            : '<span class="done-label">Completed</span>';
        const deleteControl = `<button type="button" class="ghost-danger" data-goal-delete="${goal.id}">Delete</button>`;
        const addPhaseControl = `<button type="button" class="secondary-action" data-goal-add-phase="${goal.id}">Add Phase</button>`;
        el.innerHTML = `
            <div class="item-header">
                <div>
                    <strong>#${goal.id} · ${goal.name}</strong>
                    <span class="badge muted">${phaseCount} phases</span>
                </div>
                <span class="badge status-${status}">${formatStatusLabel(status)}</span>
            </div>
            <p>${goal.description || ''}</p>
            <small>${doneTasks}/${totalTasks} tasks done</small>
            <div class="task-actions">
                ${addPhaseControl}
                ${statusControl}
                ${deleteControl}
            </div>
        `;
        fragment.appendChild(el);
    });
    dom.goalsList.appendChild(fragment);
}

export function renderPhases() {
    if (!dom.phasesList) {
        return;
    }

    const phases = state.goals.flatMap((goal) =>
        (goal.phases || []).map((phase) => ({
            ...phase,
            goalName: goal.name,
            goalId: goal.id,
        }))
    );

    dom.phasesList.innerHTML = '';
    if (!phases.length) {
        setListEmptyState(dom.phasesList, 'No phases yet.');
        return;
    }

    const fragment = document.createDocumentFragment();
    phases
        .sort(sortByDateDesc)
        .slice(0, 10)
        .forEach((phase) => {
            const el = document.createElement('div');
            el.className = 'item';
            const status = phase.status || 'planned';
            const nextStatus = getNextStatus(status);
            const statusControl = nextStatus
                ? `<button type="button" class="status-advance" data-phase-status="${phase.id}" data-next-status="${nextStatus}">Move to ${formatStatusLabel(nextStatus)}</button>`
                : '<span class="done-label">Completed</span>';
            const deleteControl = `<button type="button" class="ghost-danger" data-phase-delete="${phase.id}">Delete</button>`;
            const addTaskControl = `<button type="button" class="secondary-action" data-phase-add-task="${phase.id}">Add Task</button>`;
            el.innerHTML = `
                <div class="item-header">
                    <strong>#${phase.id} · ${phase.name}</strong>
                    <span class="badge status-${status}">${formatStatusLabel(status)}</span>
                </div>
                <small>Goal #${phase.goalId} · ${phase.goalName}</small>
                <div class="task-actions">
                    ${addTaskControl}
                    ${statusControl}
                    ${deleteControl}
                </div>
            `;
            fragment.appendChild(el);
        });
    dom.phasesList.appendChild(fragment);
}

export function renderTasks() {
    if (!dom.tasksList) {
        return;
    }

    const tasks = state.goals.flatMap((goal) =>
        (goal.tasks || []).map((task) => ({
            ...task,
            goalName: goal.name,
            goalId: goal.id,
        }))
    );

    dom.tasksList.innerHTML = '';
    if (!tasks.length) {
        setListEmptyState(dom.tasksList, 'No tasks yet.');
        return;
    }

    const fragment = document.createDocumentFragment();
    tasks
        .sort(sortByDateDesc)
        .slice(0, 10)
        .forEach((task) => {
            const el = document.createElement('div');
            el.className = 'item task-item';
            const isComplete = task.status === 'done';
            const primaryAction = isComplete
                ? '<span class="done-label">Completed</span>'
                : `<button type="button" class="task-complete" data-task-complete="${task.id}">Mark complete</button>`;
            const deleteControl = `<button type="button" class="ghost-danger" data-task-delete="${task.id}">Delete</button>`;
            el.innerHTML = `
                <div class="item-header">
                    <strong>#${task.id} · ${task.title}</strong>
                    <span class="badge status-${task.status || 'pending'}">${formatStatusLabel(task.status)}</span>
                </div>
                <p>Goal #${task.goalId} · ${task.goalName}</p>
                <small>Phase #${task.phase_id} · Due: ${task.due_date || '—'} · Priority: ${task.priority}</small>
                <div class="task-actions">
                    ${primaryAction}
                    ${deleteControl}
                </div>
            `;
            fragment.appendChild(el);
        });
    dom.tasksList.appendChild(fragment);
}

export function renderHabits() {
    if (!dom.habitsList) {
        updateHabitOptions();
        return;
    }

    dom.habitsList.innerHTML = '';
    if (!state.habits.length) {
        setListEmptyState(dom.habitsList, 'No habits yet. Create one above.');
        updateHabitOptions();
        return;
    }

    const fragment = document.createDocumentFragment();
    state.habits
        .slice()
        .sort(sortByDateDesc)
        .forEach((habit) => {
            const li = document.createElement('li');
            const title = document.createElement('strong');
            title.textContent = habit.name;
            li.appendChild(title);
            if (habit.created_at) {
                li.appendChild(document.createElement('br'));
                const meta = document.createElement('small');
                meta.textContent = `Created ${habit.created_at.substring(0, 10)}`;
                li.appendChild(meta);
            }
            fragment.appendChild(li);
        });
    dom.habitsList.appendChild(fragment);

    updateHabitOptions();
}

export function updateHabitOptions() {
    if (!dom.habitOptions) {
        return;
    }

    dom.habitOptions.innerHTML = '';
    const fragment = document.createDocumentFragment();
    state.habits.forEach((habit) => {
        const option = document.createElement('option');
        option.value = habit.name;
        fragment.appendChild(option);
    });
    dom.habitOptions.appendChild(fragment);
}

export function renderDashboardTasks() {
    if (!dom.dashboardTaskList) return;

    const tasks = state.goals.flatMap(goal =>
        (goal.tasks || []).map(task => ({
            ...task,
            goalName: goal.name,
            goalId: goal.id
        }))
    );

    const today = getLocalDateString();
    const pendingTasks = [];
    const completedToday = [];

    tasks.forEach((task) => {
        if (task.status === 'done') {
            if (task.completed_at && task.completed_at.startsWith(today)) {
                completedToday.push(task);
            }
            return;
        }
        if (task.due_date && task.due_date <= today) {
            pendingTasks.push(task);
        }
    });

    dom.dashboardTaskList.innerHTML = '';
    const emptyState = document.getElementById('dashboardEmptyState');

    if (pendingTasks.length === 0 && completedToday.length === 0) {
        if (emptyState) emptyState.hidden = false;
        return;
    }

    if (emptyState) emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    pendingTasks.sort((a, b) => {
        const pMap = { high: 3, normal: 2, low: 1 };
        const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return (a.due_date || '').localeCompare(b.due_date || '');
    });

    const renderTask = (task, options = {}) => {
        const el = document.createElement('div');
        el.className = 'todo-item';
        const priority = (task.priority || 'normal').toLowerCase();
        const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
        const dueText = task.due_date ? buildDueText(task.due_date, today) : 'No due date';
        const dueClassName = ['todo-due'];
        if (task.due_date && task.due_date < today) {
            dueClassName.push('todo-overdue');
        }
        const completed = options.completed === true;
        el.innerHTML = `
            <label class="todo-label${completed ? ' completed' : ''}">
                ${completed ? '' : `<input type="checkbox" class="todo-checkbox" data-task-id="${task.id}">`}
                <div class="todo-content">
                    <div class="todo-header">
                        <span class="todo-text">${task.title}</span>
                        <span class="badge status-${priority}">${priorityLabel}</span>
                    </div>
                    <div class="todo-details">
                        <span class="todo-goal">Goal · ${task.goalName}</span>
                        <span class="${dueClassName.join(' ')}">${dueText}</span>
                    </div>
                </div>
            </label>
        `;
        fragment.appendChild(el);
    };

    pendingTasks.forEach((task) => renderTask(task));

    if (completedToday.length) {
        const divider = document.createElement('p');
        divider.className = 'todo-divider';
        divider.textContent = `Completed today (${completedToday.length})`;
        fragment.appendChild(divider);

        completedToday.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
        completedToday.forEach((task) => renderTask(task, { completed: true }));
    }
    dom.dashboardTaskList.appendChild(fragment);
}

export function setListEmptyState(element, message) {
    if (!element) {
        return;
    }
    element.innerHTML = `<p class="empty-text">${message}</p>`;
}

export function formatStatusLabel(status) {
    return (status || 'pending').replace(/_/g, ' ');
}

export function setStatusText(element, message, state = 'muted') {
    if (!element) {
        return;
    }
    element.textContent = message;
    element.classList.remove('success', 'error');
    if (state === 'success') {
        element.classList.add('success');
    } else if (state === 'error') {
        element.classList.add('error');
    }
}

function getNextStatus(currentStatus) {
    const index = STATUS_FLOW.indexOf(currentStatus || 'planned');
    if (index === -1 || index === STATUS_FLOW.length - 1) {
        return null;
    }
    return STATUS_FLOW[index + 1];
}

function sortByDateDesc(a, b) {
    const dateA = a.updated_at || a.created_at || '';
    const dateB = b.updated_at || b.created_at || '';
    return dateB.localeCompare(dateA);
}
