import { BackupService } from './backup.service.js';
import { dom } from '../../core/dom.js';
import { state } from '../../core/store.js';
import { bus } from '../../core/bus.js';

// Helper until full event bus


function setStatusText(element, message, state = 'muted') {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('success', 'error');
    if (state === 'success') element.classList.add('success');
    else if (state === 'error') element.classList.add('error');
}

function downloadJsonFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const BackupController = {
    init() {
        this.setupListeners();
    },

    setupListeners() {
        const { downloadButton, exportStatus, importForm, fileInput, importStatus } = dom.backup;

        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                this.handleExport(downloadButton, exportStatus);
            });
        }

        if (importForm && fileInput) {
            importForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleImport(fileInput, importStatus);
            });
        }
    },

    async handleExport(button, statusEl) {
        if (!button || !statusEl) return;

        if (!state.token) {
            setStatusText(statusEl, 'Authenticate first to run a backup.', 'error');
            return;
        }

        button.disabled = true;
        setStatusText(statusEl, 'Preparing backup...');
        try {
            const result = await BackupService.export();
            if (!result.backup) throw new Error('Backup payload missing');

            const filename = result.filename || `kai-backup-${Date.now()}.json`;
            downloadJsonFile(result.backup, filename);
            setStatusText(statusEl, `Backup created (${new Date().toLocaleString()})`, 'success');
        } catch (error) {
            setStatusText(statusEl, error.message || 'Unable to generate backup', 'error');
        } finally {
            button.disabled = false;
        }
    },

    async handleImport(fileInput, statusEl) {
        if (!fileInput || !statusEl) return;

        if (!state.token) {
            setStatusText(statusEl, 'Authenticate first to import data.', 'error');
            return;
        }

        const file = fileInput.files?.[0];
        if (!file) {
            setStatusText(statusEl, 'Select a .json backup file to continue.', 'error');
            return;
        }

        setStatusText(statusEl, `Reading ${file.name}...`);
        try {
            const text = await file.text();
            let backup;
            try {
                backup = JSON.parse(text);
            } catch (parseError) {
                throw new Error('File is not valid JSON.');
            }

            setStatusText(statusEl, 'Uploading backup...');
            await BackupService.import(backup);

            setStatusText(statusEl, 'Import complete. Dashboard refreshed.', 'success');
            fileInput.value = '';
            if (typeof window.refreshApp === 'function') window.refreshApp();
            bus.dispatchEvent(new CustomEvent('refresh'));
        } catch (error) {
            setStatusText(statusEl, error.message || 'Import failed', 'error');
        }
    }
};
