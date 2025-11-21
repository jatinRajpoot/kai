import { dom } from '../../core/dom.js';
import { STATUS_FLOW } from '../../core/store.js';

function formatStatusLabel(status) {
    return (status || 'pending').replace(/_/g, ' ');
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

export const GoalsView = {
    renderList(goals) {
        if (!dom.goalsList) return;

        dom.goalsList.innerHTML = '';
        if (!goals.length) {
            dom.goalsList.innerHTML = '<p class="empty-text">No goals yet. Create one to get started.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        goals.forEach((goal) => {
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
    },

    renderPhases(goals) {
        if (!dom.phasesList) return;

        const phases = goals.flatMap((goal) =>
            (goal.phases || []).map((phase) => ({
                ...phase,
                goalName: goal.name,
                goalId: goal.id,
            }))
        );

        dom.phasesList.innerHTML = '';
        if (!phases.length) {
            dom.phasesList.innerHTML = '<p class="empty-text">No phases yet.</p>';
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
};
