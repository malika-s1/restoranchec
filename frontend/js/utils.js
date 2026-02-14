// Утилиты и вспомогательные функции
class Utils {
    // Форматирование даты
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Форматирование цены
    static formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    // Форматирование веса
    static formatWeight(weight) {
        return weight + ' г';
    }

    // Обновление текущей даты и времени
    static updateDateTime() {
        const now = new Date();
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = now.toLocaleString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // Показать/скрыть элемент
    static showElement(element) {
        if (element) element.classList.remove('hidden');
    }

    static hideElement(element) {
        if (element) element.classList.add('hidden');
    }

    // Показать сообщение об ошибке
    static showError(message, elementId = 'loginError') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            setTimeout(() => {
                errorElement.classList.remove('show');
            }, 5000);
        }
    }

    // Показать сообщение об успехе
    static showSuccess(message, elementId) {
        const successElement = document.getElementById(elementId);
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.add('show');
            setTimeout(() => {
                successElement.classList.remove('show');
            }, 3000);
        }
    }

    // Валидация телефона
    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[7-8]?[0-9\s\-\+\(\)]{10,15}$/;
        return phoneRegex.test(phone);
    }

    // Валидация email
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Создание элемента статуса
    static createStatusBadge(status) {
        const badge = document.createElement('span');
        badge.className = 'status-badge status-' + status;
        
        const statusTexts = {
            'new': 'Новый',
            'cooking': 'Готовится',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        
        badge.textContent = statusTexts[status] || status;
        return badge;
    }

    // Дебаунс функция для поиска
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Экспортируем утилиты
window.utils = Utils;
