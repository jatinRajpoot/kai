import { apiFetch } from './api.js';
import { state } from './state.js';
import { renderGoals, renderPhases, renderTasks, renderHabits, renderDashboardTasks, dom } from './render.js';

export async function refreshAll() {
    await Promise.all([
        loadGoals(),
        loadNotes('ideas'),
        loadNotes('knowledge'),
        loadNotes('important'),
        loadHabits(),
        loadHabitLogs(),
        loadDailyLogs(),
        loadAnalytics(),
    ]);
}

export async function loadGoals() {
    const baseGoals = await apiFetch('/goals');
    const detailed = await Promise.all(
        baseGoals.map(async (goal) => {
            const full = await apiFetch(`/goals/${goal.id}`);
            return { ...goal, phases: full.phases, tasks: full.tasks };
        })
    );
    state.goals = detailed;
    renderGoals();
    renderPhases();
    renderTasks();
    renderDashboardTasks();
}

export async function loadNotes(endpoint) {
    const data = await apiFetch(`/${endpoint}`);
    const map = {
        ideas: dom.ideasList,
        knowledge: dom.knowledgeList,
        important: dom.importantList,
    };
    const list = map[endpoint];
    if (list) {
        list.innerHTML = '';
        data.forEach((entry) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${entry.title}</strong><p>${entry.content || ''}</p>`;
            list.appendChild(li);
        });
    }
}

export async function loadHabits() {
    const habits = await apiFetch('/habits');
    state.habits = habits;
    renderHabits();
}

export async function loadHabitLogs() {
    const logs = await apiFetch('/habits/logs');
    dom.habitLogs.innerHTML = '';
    logs.forEach((log) => {
        const li = document.createElement('li');
        const statusLabel = Number(log.status) === 1 ? 'Done' : 'Missed';
        const logDate = log.date || log.log_date || '—';
        li.innerHTML = `<strong>${log.name}</strong> · ${logDate} · ${statusLabel}`;
        dom.habitLogs.appendChild(li);
    });
}

export async function loadDailyLogs() {
    const logs = await apiFetch('/daily/logs?limit=10');
    dom.dailyList.innerHTML = '';
    logs.forEach((log) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${log.log_date}</strong> · Mood: ${log.mood || '—'}<br/>${log.summary || ''}`;
        dom.dailyList.appendChild(li);
    });
}

export async function loadAnalytics() {
    // Analytics removed
}
