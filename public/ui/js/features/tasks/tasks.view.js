import { dom } from '../../core/dom.js';

function formatStatusLabel(status) {
    return (status || 'pending').replace(/_/g, ' ');
}

function sortByDateDesc(a, b) {
    const dateA = a.updated_at || a.created_at || '';
    const dateB = b.updated_at || b.created_at || '';
    return dateB.localeCompare(dateA);
}

export const TasksView = {
    renderList(goals) {
        if (!dom.tasksList) return;

        const tasks = goals.flatMap((goal) =>
            (goal.tasks || []).map((task) => ({
                ...task,
                goalName: goal.name,
                goalId: goal.id,
            }))
        );

        dom.tasksList.innerHTML = '';
        if (!tasks.length) {
            dom.tasksList.innerHTML = '<p class="empty-text">No tasks yet.</p>';
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
};
