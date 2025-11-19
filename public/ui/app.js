import { state } from './js/state.js';
import { updateTokenIndicator } from './js/render.js';
import { initNavigation, initSidebarToggle, initFormToggles, initBackupControls, setupEventListeners } from './js/events.js';
import { refreshAll } from './js/actions.js';

updateTokenIndicator();
initNavigation();
initSidebarToggle();
initFormToggles();
initBackupControls();
setupEventListeners();

if (state.token) {
    refreshAll();
}
