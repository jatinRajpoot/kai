import { dom } from '../../core/dom.js';

let modalCleanup = null;
let previousBodyOverflow = '';

export const Modal = {
    init() {
        if (!dom.modal.root) return;

        dom.modal.root.addEventListener('click', (event) => {
            const closeTarget = event.target.closest('[data-modal-close]');
            if (closeTarget) {
                event.preventDefault();
                this.close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen()) {
                event.preventDefault();
                this.close();
            }
        });
    },

    open({ title, content, onReady }) {
        if (!dom.modal.root || !dom.modal.content || !dom.modal.title) return;

        dom.modal.title.textContent = title || '';
        if (typeof content === 'string') {
            dom.modal.content.innerHTML = content;
        } else {
            dom.modal.content.innerHTML = '';
            if (content instanceof Node) {
                dom.modal.content.appendChild(content);
            }
        }

        if (onReady && typeof onReady === 'function') {
            onReady(dom.modal.content);
        }

        dom.modal.root.setAttribute('aria-hidden', 'false');
        this.lockBodyScroll();
    },

    close() {
        if (!dom.modal.root || !dom.modal.content || !dom.modal.title) return;

        dom.modal.root.setAttribute('aria-hidden', 'true');
        dom.modal.content.innerHTML = '';
        dom.modal.title.textContent = '';

        if (typeof modalCleanup === 'function') {
            modalCleanup();
        }
        modalCleanup = null;
        this.unlockBodyScroll();
    },

    isOpen() {
        return Boolean(dom.modal.root && dom.modal.root.getAttribute('aria-hidden') !== 'true');
    },

    lockBodyScroll() {
        if (!document.body) return;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    },

    unlockBodyScroll() {
        if (!document.body) return;
        document.body.style.overflow = previousBodyOverflow || '';
        previousBodyOverflow = '';
    },

    confirm(message) {
        return new Promise((resolve) => {
            let resolved = false;
            const resolveOnce = (value) => {
                if (!resolved) {
                    resolved = true;
                    resolve(value);
                }
            };

            modalCleanup = () => {
                resolveOnce(false);
            };

            this.open({
                title: 'Confirmation',
                content: `
                    <p style="margin-bottom: 1.5rem; line-height: 1.5;">${message}</p>
                    <div class="dialog-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button type="button" class="secondary-action" id="confirmCancel">Cancel</button>
                        <button type="button" id="confirmYes" style="background: var(--text-primary); color: white;">Confirm</button>
                    </div>
                `,
                onReady: (container) => {
                    const cancelBtn = container.querySelector('#confirmCancel');
                    const yesBtn = container.querySelector('#confirmYes');

                    cancelBtn?.addEventListener('click', () => {
                        this.close();
                    });

                    yesBtn?.addEventListener('click', () => {
                        resolveOnce(true);
                        this.close();
                    });

                    yesBtn?.focus();
                }
            });
        });
    }
};
