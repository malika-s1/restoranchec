// Основной файл приложения
class FoodAdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    // Инициализация приложения
    async init() {
        // Проверяем авторизацию
        if (!auth.isAuthenticated()) {
            this.showLoginPage();
        } else {
            this.showMainApp();
            await this.loadInitialData();
        }

        this.initEventListeners();
        this.startDateTimeUpdater();
    }

    // Показать страницу авторизации
    showLoginPage() {
        utils.hideElement(document.getElementById('mainPage'));
        utils.showElement(document.getElementById('loginPage'));
    }

    // Показать основное приложение
    showMainApp() {
        utils.hideElement(document.getElementById('loginPage'));
        utils.showElement(document.getElementById('mainPage'));
        
        // Обновляем информацию о пользователе
        this.updateUserInfo();
        
        // Показываем текущую страницу
        this.showPage(this.currentPage);
    }

    // Обновить информацию о пользователе
    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement && auth.user) {
            const roleText = auth.user.role === 'admin' ? 'Администратор' : 'Менеджер';
            userInfoElement.textContent = \\ (\)\;
        }
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Форма авторизации
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Кнопка выхода
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
        });

        // Навигация по страницам
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('a').dataset.page;
                this.showPage(page);
            });
        });

        // Обработка нажатия клавиши Enter на форме логина
        document.getElementById('password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
        });
    }

    // Обработка авторизации
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            utils.showError('Введите имя пользователя и пароль');
            return;
        }

        // Показываем индикатор загрузки
        const submitBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        submitBtn.disabled = true;

        const result = await auth.login(username, password);

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (result.success) {
            this.showMainApp();
            await this.loadInitialData();
        } else {
            utils.showError(result.message);
        }
    }

    // Загрузка начальных данных
    async loadInitialData() {
        // Загружаем категории
        await categoriesManager.loadCategories();
        
        // Загружаем блюда
        await dishesManager.loadDishes();
        
        // Загружаем заказы и статистику
        await ordersManager.loadOrders();
        await ordersManager.loadDashboardStats();
        
        // Обновляем дашборд
        this.showPage(this.currentPage);
    }

    // Показать страницу
    showPage(pageName) {
        // Обновляем активную ссылку в навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });

        // Скрываем все страницы
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });

        // Показываем выбранную страницу
        const pageElement = document.getElementById(pageName + 'Page');
        if (pageElement) {
            pageElement.classList.add('active');
            this.currentPage = pageName;
            
            // Обновляем заголовок
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                const titles = {
                    'dashboard': 'Дашборд',
                    'categories': 'Категории',
                    'dishes': 'Блюда',
                    'orders': 'Заказы',
                    'newOrder': 'Быстрый заказ'
                };
                pageTitle.textContent = titles[pageName] || pageName;
            }
        }
    }

    // Обновление даты и времени
    startDateTimeUpdater() {
        utils.updateDateTime();
        setInterval(utils.updateDateTime, 1000);
    }
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FoodAdminApp();
});

// Обработка ошибок при загрузке
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});
