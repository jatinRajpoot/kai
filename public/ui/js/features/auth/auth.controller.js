import { AuthService } from './auth.service.js';
import { dom } from '../../core/dom.js';
import { Router } from '../../core/router.js';
import { bus } from '../../core/bus.js';

export const AuthController = {
    init() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                try {
                    await AuthService.login(email, password);
                    dom.tokenDot?.classList.add('active');
                    if (dom.tokenLabel) dom.tokenLabel.textContent = 'Authenticated';
                    Router.showSection('dashboard');
                    bus.dispatchEvent(new CustomEvent('refresh'));
                } catch (error) {
                    alert(error.message || 'Login failed');
                }
            });
        }
    }
};
