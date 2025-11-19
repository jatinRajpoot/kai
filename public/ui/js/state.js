export const state = {
    token: localStorage.getItem('kai_token') || '',
    goals: [],
    habits: [],
    analytics: null,
    charts: {
        tasks: null,
        habits: null,
    },
};

export const STATUS_FLOW = ['planned', 'in_progress', 'done'];

export function saveToken(token) {
    state.token = token;
    localStorage.setItem('kai_token', token);
}
