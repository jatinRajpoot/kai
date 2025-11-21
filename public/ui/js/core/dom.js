export const dom = {
    get tokenDot() { return document.getElementById('tokenDot'); },
    get tokenLabel() { return document.getElementById('tokenLabel'); },
    get goalsList() { return document.getElementById('goalsList'); },
    get phasesList() { return document.getElementById('phasesList'); },
    get tasksList() { return document.getElementById('tasksList'); },
    get dashboardTaskList() { return document.getElementById('dashboardTaskList'); },
    get dashboardDateFilter() { return document.getElementById('dashboardDateFilter'); },
    get dashboardDate() { return document.getElementById('dashboardDate'); },
    get dailyProgressStat() { return document.getElementById('dailyProgressStat'); },
    get phaseForm() { return document.getElementById('phaseForm'); },
    get taskForm() { return document.getElementById('taskForm'); },
    get phaseFormContainer() { return document.querySelector('[data-form-container="phaseForm"]'); },
    get taskFormContainer() { return document.querySelector('[data-form-container="taskForm"]'); },
    get phaseGoalInput() { return document.getElementById('phaseGoalId'); },
    get taskPhaseInput() { return document.getElementById('taskPhaseId'); },
    get phaseContext() { return document.getElementById('phaseContext'); },
    get taskContext() { return document.getElementById('taskContext'); },
    get phaseNameInput() { return document.getElementById('phaseName'); },
    get taskTitleInput() { return document.getElementById('taskTitle'); },
    get modal() {
        return {
            get root() { return document.getElementById('dialogRoot'); },
            get title() { return document.getElementById('dialogTitle'); },
            get content() { return document.getElementById('dialogContent'); },
        };
    },
    get ideasList() { return document.getElementById('ideasList'); },
    get knowledgeList() { return document.getElementById('knowledgeList'); },
    get importantList() { return document.getElementById('importantList'); },
    get habitsList() { return document.getElementById('habitsList'); },
    get habitLogs() { return document.getElementById('habitLogs'); },
    get dailyList() { return document.getElementById('dailyList'); },
    get habitOptions() { return document.getElementById('habitOptions'); },
    get backup() {
        return {
            get downloadButton() { return document.getElementById('backupDownloadBtn'); },
            get exportStatus() { return document.getElementById('backupExportStatus'); },
            get importForm() { return document.getElementById('backupImportForm'); },
            get fileInput() { return document.getElementById('backupFileInput'); },
            get importStatus() { return document.getElementById('backupImportStatus'); },
        };
    },
};
