import { dom } from './dom.js';

export const Router = {
    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.setupFormToggles();
    },

    setupNavigation() {
        const buttons = document.querySelectorAll('[data-nav]');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                const target = button.dataset.nav;
                if (target) {
                    this.showSection(target);
                }
            });
        });
    },

    showSection(sectionName) {
        const buttons = document.querySelectorAll('[data-nav]');
        buttons.forEach((button) => {
            button.classList.toggle('active', button.dataset.nav === sectionName);
        });

        const sections = document.querySelectorAll('[data-section]');
        sections.forEach((section) => {
            const isActive = section.dataset.section === sectionName;
            section.classList.toggle('visible', isActive);
            section.setAttribute('aria-hidden', String(!isActive));
        });
    },

    setupSidebar() {
        const toggleButton = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('primarySidebar');
        const overlay = document.querySelector('[data-sidebar-overlay]');
        const appShell = document.querySelector('.app-shell');
        if (!toggleButton || !sidebar || !appShell) return;

        const mobileQuery = window.matchMedia('(max-width: 1024px)');
        const isMobileViewport = () => mobileQuery.matches;

        const setOverlayVisibility = (isVisible) => {
            if (overlay) overlay.setAttribute('aria-hidden', String(!isVisible));
        };

        const updateSidebarAccessibility = (isOpen) => {
            if (!isMobileViewport()) {
                sidebar.removeAttribute('aria-hidden');
                sidebar.removeAttribute('inert');
                return;
            }
            sidebar.setAttribute('aria-hidden', String(!isOpen));
            if (isOpen) {
                sidebar.removeAttribute('inert');
            } else {
                sidebar.setAttribute('inert', '');
            }
        };

        const closeSidebar = () => {
            if (!appShell.classList.contains('sidebar-open')) {
                updateSidebarAccessibility(false);
                return;
            }
            appShell.classList.remove('sidebar-open');
            toggleButton.setAttribute('aria-expanded', 'false');
            setOverlayVisibility(false);
            updateSidebarAccessibility(false);
        };

        const openSidebar = () => {
            if (appShell.classList.contains('sidebar-open')) return;
            appShell.classList.add('sidebar-open');
            toggleButton.setAttribute('aria-expanded', 'true');
            setOverlayVisibility(true);
            updateSidebarAccessibility(true);
        };

        toggleButton.addEventListener('click', () => {
            if (appShell.classList.contains('sidebar-open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        overlay?.addEventListener('click', closeSidebar);

        const buttons = document.querySelectorAll('[data-nav]');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                if (isMobileViewport()) closeSidebar();
            });
        });

        const handleViewportChange = () => {
            if (!isMobileViewport()) {
                closeSidebar();
            } else {
                updateSidebarAccessibility(appShell.classList.contains('sidebar-open'));
            }
        };

        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', handleViewportChange);
        } else if (typeof mobileQuery.addListener === 'function') {
            mobileQuery.addListener(handleViewportChange);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeSidebar();
        });

        updateSidebarAccessibility(false);
    },

    setupFormToggles() {
        const toggleButtons = document.querySelectorAll('[data-toggle-form]');
        toggleButtons.forEach((button) => {
            const targetId = button.dataset.toggleForm;
            if (!targetId) return;
            const container = document.querySelector(`[data-form-container="${targetId}"]`);
            if (!container) return;

            button.addEventListener('click', () => {
                const isHidden = container.hasAttribute('hidden');
                if (isHidden) {
                    container.removeAttribute('hidden');
                } else {
                    container.setAttribute('hidden', '');
                }
                button.setAttribute('aria-expanded', String(isHidden));
            });
        });
    }
};
