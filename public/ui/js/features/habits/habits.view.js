import { dom } from '../../core/dom.js';

function sortByDateDesc(a, b) {
    const dateA = a.updated_at || a.created_at || '';
    const dateB = b.updated_at || b.created_at || '';
    return dateB.localeCompare(dateA);
}

export const HabitsView = {
    renderList(habits) {
        if (!dom.habitsList) {
            this.updateOptions(habits);
            return;
        }

        dom.habitsList.innerHTML = '';
        if (!habits.length) {
            dom.habitsList.innerHTML = '<p class="empty-text">No habits yet. Create one above.</p>';
            this.updateOptions(habits);
            return;
        }

        const fragment = document.createDocumentFragment();
        habits
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

        this.updateOptions(habits);
    },

    updateOptions(habits) {
        if (!dom.habitOptions) return;

        dom.habitOptions.innerHTML = '';
        const fragment = document.createDocumentFragment();
        habits.forEach((habit) => {
            const option = document.createElement('option');
            option.value = habit.name;
            fragment.appendChild(option);
        });
        dom.habitOptions.appendChild(fragment);
    },

    renderLogs(logs) {
        if (!dom.habitLogs) return;

        dom.habitLogs.innerHTML = '';
        logs.forEach((log) => {
            const li = document.createElement('li');
            const statusLabel = Number(log.status) === 1 ? 'Done' : 'Missed';
            const logDate = log.date || log.log_date || '—';
            li.innerHTML = `<strong>${log.name}</strong> · ${logDate} · ${statusLabel}`;
            dom.habitLogs.appendChild(li);
        });
    }
};
