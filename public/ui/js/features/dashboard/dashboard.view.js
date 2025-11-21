import { dom } from '../../core/dom.js';
import { getLocalDateString } from '../../shared/utils/date.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseYMD(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if ([year, month, day].some((value) => Number.isNaN(value))) return null;
    return new Date(year, (month || 1) - 1, day || 1);
}

function formatShortDate(dateString) {
    const date = parseYMD(dateString);
    if (!date) return dateString || '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getRelativeDueText(dateString, todayString) {
    const dueDate = parseYMD(dateString);
    const today = parseYMD(todayString);
    if (!dueDate || !today) return null;
    const diff = Math.round((dueDate - today) / DAY_IN_MS);
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff > 1) return `Due in ${diff} days`;
    if (diff === -1) return 'Overdue by 1 day';
    return `Overdue by ${Math.abs(diff)} days`;
}

function buildDueText(dateString, todayString) {
    if (!dateString) return '';
    const relativeText = getRelativeDueText(dateString, todayString);
    if (!relativeText) return `Due ${formatShortDate(dateString)}`;
    if (relativeText.startsWith('Due')) return relativeText;
    return `${formatShortDate(dateString)} · ${relativeText}`;
}

export const DashboardView = {
    renderTasks(goals) {
        if (!dom.dashboardTaskList) return;

        const tasks = goals.flatMap(goal =>
            (goal.tasks || []).map(task => ({
                ...task,
                goalName: goal.name,
                goalId: goal.id
            }))
        );

        const selectedDate = dom.dashboardDateFilter?.value || getLocalDateString();

        if (dom.dashboardDate) {
            const dateObj = new Date(selectedDate);
            if (!isNaN(dateObj)) {
                dom.dashboardDate.textContent = dateObj.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }

        const pendingTasks = [];
        const completedToday = [];

        tasks.forEach((task) => {
            if (task.status === 'done') {
                if (task.completed_at && task.completed_at.startsWith(selectedDate)) {
                    completedToday.push(task);
                }
                return;
            }
            if (task.due_date && task.due_date <= selectedDate) {
                pendingTasks.push(task);
            }
        });

        if (dom.dailyProgressStat) {
            const total = pendingTasks.length + completedToday.length;
            dom.dailyProgressStat.textContent = `${completedToday.length}/${total}`;
        }

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
            const dueText = task.due_date ? buildDueText(task.due_date, selectedDate) : 'No due date';
            const dueClassName = ['todo-due'];
            if (task.due_date && task.due_date < selectedDate) {
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
            divider.textContent = `Completed (${completedToday.length})`;
            fragment.appendChild(divider);

            completedToday.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
            completedToday.forEach((task) => renderTask(task, { completed: true }));
        }
        dom.dashboardTaskList.appendChild(fragment);
    },

    renderDailyLogs(logs) {
        if (!dom.dailyList) return;
        dom.dailyList.innerHTML = '';
        logs.forEach((log) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${log.log_date}</strong> · Mood: ${log.mood || '—'}<br/>${log.summary || ''}`;
            dom.dailyList.appendChild(li);
        });
    }
};
