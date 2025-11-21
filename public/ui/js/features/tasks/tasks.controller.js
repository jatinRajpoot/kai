import { TasksService } from './tasks.service.js';
import { TasksView } from './tasks.view.js';
import { dom } from '../../core/dom.js';
import { bus } from '../../core/bus.js';

export const TasksController = {
    init() {
        this.setupFormListeners();
        this.setupListListeners();
    },

    setupFormListeners() {
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const payload = {
                    title: document.getElementById('taskTitle').value,
                    description: document.getElementById('taskDesc').value,
                    priority: document.getElementById('taskPriority').value,
                    due_date: document.getElementById('taskDue').value,
                };
                await TasksService.create(document.getElementById('taskPhaseId').value, payload);
                taskForm.reset();
                bus.dispatchEvent(new CustomEvent('refresh'));
            });
        }
    },

    setupListListeners() {
        if (dom.tasksList) {
            dom.tasksList.addEventListener('click', this.handleTaskListClick.bind(this));
        }
    },

    async handleTaskListClick(event) {
        // Delete Task
        const deleteButton = event.target.closest('button[data-task-delete]');
        if (deleteButton) {
            const taskId = Number(deleteButton.dataset.taskDelete);
            if (!taskId) return;
            if (!confirm('Delete this task?')) return;

            try {
                await TasksService.delete(taskId);
                bus.dispatchEvent(new CustomEvent('refresh'));
            } catch (error) {
                alert(error.message);
            }
            return;
        }

        // Complete Task
        const completeButton = event.target.closest('button[data-task-complete]');
        if (completeButton) {
            const taskId = Number(completeButton.dataset.taskComplete);
            if (!taskId) return;

            try {
                await TasksService.update(taskId, { status: 'done' });
                bus.dispatchEvent(new CustomEvent('refresh'));
            } catch (error) {
                alert(error.message);
            }
        }
    }
};
