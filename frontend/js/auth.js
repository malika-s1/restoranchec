// Модуль авторизации
class Auth {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('auth_user')) || null;
        this.apiBaseUrl = 'http://localhost:3000/api';
    }

    // Проверка авторизации
    isAuthenticated() {
        return !!this.token;
    }

    // Получение токена для запросов
    getAuthHeader() {
        return this.token ? { 'Authorization': 'Bearer ' + this.token } : {};
    }

    // Вход в систему
    async login(username, password) {
        try {
            const response = await fetch(this.apiBaseUrl + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка авторизации');
            }

            const data = await response.json();
            
            // Сохраняем токен и данные пользователя
            this.token = data.token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    }

    // Выход из системы
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/';
    }

    // Получение роли пользователя
    getUserRole() {
        return this.user?.role || null;
    }

    // Проверка является ли пользователь администратором
    isAdmin() {
        return this.getUserRole() === 'admin';
    }
}

// Экспортируем экземпляр Auth
window.auth = new Auth();
