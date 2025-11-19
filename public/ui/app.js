import { state } from './js/state.js';
import { updateTokenIndicator } from './js/render.js';
import { initNavigation, initFormToggles, initBackupControls, setupEventListeners } from './js/events.js';
import { refreshAll } from './js/actions.js';

updateTokenIndicator();
initNavigation();
initFormToggles();
initBackupControls();
setupEventListeners();

if (state.token) {
    refreshAll();
}
