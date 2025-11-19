import { state, STATUS_FLOW } from './state.js';

export const dom = {
    tokenDot: document.getElementById('tokenDot'),
    tokenLabel: document.getElementById('tokenLabel'),
    goalsList: document.getElementById('goalsList'),
    phasesList: document.getElementById('phasesList'),
    tasksList: document.getElementById('tasksList'),
    stats: {
        goals: document.getElementById('statGoals'),
        done: document.getElementById('statDone'),
        today: document.getElementById('statToday'),
        streak: document.getElementById('statStreak'),
    },
    ideasList: document.getElementById('ideasList'),
    knowledgeList: document.getElementById('knowledgeList'),
    importantList: document.getElementById('importantList'),
    habitsList: document.getElementById('habitsList'),
    habitLogs: document.getElementById('habitLogs'),
    dailyList: document.getElementById('dailyList'),
    tasksTrendChart: document.getElementById('tasksTrendChart'),
    habitStreakChart: document.getElementById('habitStreakChart'),
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
                ${statusControl}
                ${deleteControl}
            </div>
        `;
        dom.goalsList.appendChild(el);
    });
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
            el.innerHTML = `
                <div class="item-header">
                    <strong>#${phase.id} · ${phase.name}</strong>
                    <span class="badge status-${status}">${formatStatusLabel(status)}</span>
                </div>
                <small>Goal #${phase.goalId} · ${phase.goalName}</small>
                <div class="task-actions">
                    ${statusControl}
                    ${deleteControl}
                </div>
            `;
            dom.phasesList.appendChild(el);
        });
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
            dom.tasksList.appendChild(el);
        });
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
            dom.habitsList.appendChild(li);
        });

    updateHabitOptions();
}

export function updateHabitOptions() {
    const datalist = document.getElementById('habitOptions');
    if (!datalist) {
        return;
    }

    datalist.innerHTML = '';
    state.habits.forEach((habit) => {
        const option = document.createElement('option');
        option.value = habit.name;
        datalist.appendChild(option);
    });
}

export function renderCharts() {
    const analytics = state.analytics;
    if (!analytics) return;

    const trendLabels = analytics.task_trend.map((entry) => entry.date.substring(5));
    const trendData = analytics.task_trend.map((entry) => entry.count);

    if (!state.charts.tasks) {
        state.charts.tasks = new Chart(dom.tasksTrendChart, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [
                    {
                        label: 'Tasks completed',
                        data: trendData,
                        borderColor: '#22d3ee',
                        fill: false,
                    },
                ],
            },
            options: {
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });
    } else {
        state.charts.tasks.data.labels = trendLabels;
        state.charts.tasks.data.datasets[0].data = trendData;
        state.charts.tasks.update();
    }

    const habitLabels = analytics.habit_streaks.map((item) => item.habit);
    const habitData = analytics.habit_streaks.map((item) => item.current_streak);

    if (!state.charts.habits) {
        state.charts.habits = new Chart(dom.habitStreakChart, {
            type: 'bar',
            data: {
                labels: habitLabels,
                datasets: [
                    {
                        label: 'Habit streak (days)',
                        data: habitData,
                        backgroundColor: '#6366f1',
                    },
                ],
            },
            options: {
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });
    } else {
        state.charts.habits.data.labels = habitLabels;
        state.charts.habits.data.datasets[0].data = habitData;
        state.charts.habits.update();
    }
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
    return getDateValue(b) - getDateValue(a);
}

function getDateValue(entry) {
    const stamp = entry?.updated_at || entry?.created_at;
    if (!stamp) {
        return 0;
    }
    const value = Date.parse(stamp);
    return Number.isNaN(value) ? 0 : value;
}
