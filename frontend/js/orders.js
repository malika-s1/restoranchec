// Модуль управления заказами
class OrdersManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.initEventListeners();
        this.initQuickOrderForm();
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Фильтрация заказов по статусу
        const statusFilter = document.getElementById('orderStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.loadOrders();
            });
        }

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Клик вне модального окна
        document.getElementById('orderDetailsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideOrderDetailsModal();
            }
        });

        // Сохранение статуса заказа
        document.getElementById('saveOrderStatusBtn')?.addEventListener('click', () => {
            this.saveOrderStatus();
        });
    }

    // Инициализация формы быстрого заказа
    initQuickOrderForm() {
        const form = document.getElementById('quickOrderForm');
        if (!form) return;

        // Кнопка добавления еще блюда
        const addMoreBtn = document.getElementById('addMoreDishesBtn');
        if (addMoreBtn) {
            addMoreBtn.addEventListener('click', () => {
                this.addDishToOrder();
            });
        }

        // Изменение количества или выбора блюда
        form.addEventListener('change', (e) => {
            if (e.target.classList.contains('dish-select') || 
                e.target.classList.contains('quantity-input')) {
                this.updateOrderTotal();
            }
        });

        // Удаление блюда из заказа
        form.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item-btn') || 
                e.target.closest('.remove-item-btn')) {
                const item = e.target.closest('.order-item');
                if (item && document.querySelectorAll('.order-item').length > 1) {
                    item.remove();
                    this.updateOrderTotal();
                }
            }
        });

        // Отправка формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createQuickOrder();
        });
    }

    // Загрузка заказов
    async loadOrders() {
        try {
            const status = document.getElementById('orderStatusFilter')?.value || '';
            
            let url = \\/orders\;
            if (status) {
                url += \?status=\\;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': 'Bearer ' + auth.token
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки заказов');
            }

            const orders = await response.json();
            this.renderOrdersTable(orders);
            return orders;
        } catch (error) {
            console.error('Error loading orders:', error);
            utils.showError('Не удалось загрузить заказы', 'ordersError');
            return [];
        }
    }

    // Загрузка статистики для дашборда
    async loadDashboardStats() {
        try {
            const orders = await this.loadOrders();
            
            // Подсчет статистики
            const totalOrders = orders.length;
            const newOrders = orders.filter(order => order.status === 'new').length;
            const cookingOrders = orders.filter(order => order.status === 'cooking').length;
            const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
            
            // Обновление счетчиков
            document.getElementById('totalOrders').textContent = totalOrders;
            document.getElementById('newOrders').textContent = newOrders;
            document.getElementById('cookingOrders').textContent = cookingOrders;
            document.getElementById('deliveredOrders').textContent = deliveredOrders;
            
            // Отображение последних заказов
            this.renderRecentOrders(orders.slice(0, 5));
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    // Отображение таблицы заказов
    renderOrdersTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = \
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Заказов не найдено</h3>
                        <p>Попробуйте изменить фильтр статуса</p>
                    </td>
                </tr>
            \;
            return;
        }

        tbody.innerHTML = orders.map(order => \
            <tr data-id="\">
                <td>#\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary view-order" 
                                data-id="\">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        \).join('');

        // Добавляем обработчики для кнопок просмотра
        this.addOrderActionListeners();
    }

    // Отображение последних заказов
    renderRecentOrders(orders) {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = \
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Нет последних заказов</h3>
                </div>
            \;
            return;
        }

        container.innerHTML = orders.map(order => \
            <div class="order-item-card">
                <div class="order-item-header">
                    <span class="order-id">Заказ #\</span>
                    <span class="order-customer">\</span>
                </div>
                <div class="order-details">
                    <span class="order-total">\</span>
                    <span class="order-date">\</span>
                    <span class="order-status">\</span>
                </div>
            </div>
        \).join('');
    }

    // Добавление обработчиков для кнопок действий
    addOrderActionListeners() {
        // Просмотр деталей заказа
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('button').dataset.id;
                this.viewOrderDetails(orderId);
            });
        });
    }

    // Просмотр деталей заказа
    async viewOrderDetails(orderId) {
        try {
            const response = await fetch(\\/orders/\\, {
                headers: {
                    'Authorization': 'Bearer ' + auth.token
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки деталей заказа');
            }

            const order = await response.json();
            this.showOrderDetailsModal(order);
            
        } catch (error) {
            console.error('Error loading order details:', error);
            utils.showError('Не удалось загрузить детали заказа', 'ordersError');
        }
    }

    // Показать модальное окно деталей заказа
    showOrderDetailsModal(order) {
        const modal = document.getElementById('orderDetailsModal');
        
        document.getElementById('orderDetailsId').textContent = order.id;
        document.getElementById('detailCustomerName').textContent = order.customer_name;
        document.getElementById('detailCustomerPhone').textContent = order.customer_phone;
        document.getElementById('detailOrderStatus').value = order.status;
        document.getElementById('detailCreatedAt').textContent = utils.formatDate(order.created_at);
        document.getElementById('detailTotalPrice').textContent = utils.formatPrice(order.total_price);
        
        // Заполняем таблицу с блюдами
        const itemsTbody = document.getElementById('orderItemsDetails');
        itemsTbody.innerHTML = order.items.map(item => \
            <tr>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
            </tr>
        \).join('');
        
        modal.classList.add('active');
    }

    // Скрыть модальное окно деталей заказа
    hideOrderDetailsModal() {
        document.getElementById('orderDetailsModal').classList.remove('active');
    }

    // Сохранение статуса заказа
    async saveOrderStatus() {
        const orderId = document.getElementById('orderDetailsId').textContent;
        const status = document.getElementById('detailOrderStatus').value;

        try {
            const response = await fetch(\\/orders/\/status\, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + auth.token
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка обновления статуса');
            }

            this.hideOrderDetailsModal();
            await this.loadOrders();
            await this.loadDashboardStats();
            
            utils.showSuccess('Статус заказа обновлен', 'ordersSuccess');
            
        } catch (error) {
            console.error('Error saving order status:', error);
            utils.showError(error.message, 'ordersError');
        }
    }

    // Добавление блюда в быстрый заказ
    addDishToOrder() {
        const container = document.getElementById('orderItemsContainer');
        const firstItem = container.querySelector('.order-item');
        const clone = firstItem.cloneNode(true);
        
        // Очищаем значения в клоне
        clone.querySelector('.dish-select').value = '';
        clone.querySelector('.quantity-input').value = 1;
        clone.querySelector('.item-price').textContent = '0 ';
        
        container.appendChild(clone);
        
        // Загружаем блюда в новый селект
        dishesManager.updateDishSelects(dishesManager.currentDishes);
    }

    // Обновление итоговой суммы в быстром заказе
    updateOrderTotal() {
        let total = 0;
        
        document.querySelectorAll('.order-item').forEach(item => {
            const select = item.querySelector('.dish-select');
            const quantityInput = item.querySelector('.quantity-input');
            const priceElement = item.querySelector('.item-price');
            
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption && selectedOption.value) {
                const price = parseFloat(selectedOption.dataset.price || 0);
                const quantity = parseInt(quantityInput.value || 1);
                const itemTotal = price * quantity;
                
                priceElement.textContent = utils.formatPrice(price);
                total += itemTotal;
            } else {
                priceElement.textContent = '0 ';
            }
        });
        
        document.getElementById('orderTotal').textContent = total.toFixed(2);
    }

    // Создание быстрого заказа
    async createQuickOrder() {
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        
        // Валидация
        if (!customerName || !customerPhone) {
            utils.showError('Заполните все обязательные поля', 'quickOrderError');
            return;
        }

        if (!utils.validatePhone(customerPhone)) {
            utils.showError('Введите корректный номер телефона', 'quickOrderError');
            return;
        }

        // Сбор данных о блюдах
        const items = [];
        let hasItems = false;
        
        document.querySelectorAll('.order-item').forEach(item => {
            const dishId = item.querySelector('.dish-select').value;
            const quantity = item.querySelector('.quantity-input').value;
            
            if (dishId && quantity) {
                items.push({
                    dish_id: dishId,
                    quantity: parseInt(quantity)
                });
                hasItems = true;
            }
        });

        if (!hasItems) {
            utils.showError('Добавьте хотя бы одно блюдо в заказ', 'quickOrderError');
            return;
        }

        try {
            const response = await fetch(this.apiBaseUrl + '/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + auth.token
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    items: items
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания заказа');
            }

            // Сбрасываем форму
            document.getElementById('quickOrderForm').reset();
            
            // Оставляем только одно поле для блюда
            const container = document.getElementById('orderItemsContainer');
            while (container.children.length > 1) {
                container.removeChild(container.lastChild);
            }
            
            // Сбрасываем первое поле
            const firstItem = container.querySelector('.order-item');
            firstItem.querySelector('.dish-select').value = '';
            firstItem.querySelector('.quantity-input').value = 1;
            firstItem.querySelector('.item-price').textContent = '0 ';
            
            document.getElementById('orderTotal').textContent = '0';
            
            // Обновляем список заказов
            await this.loadOrders();
            await this.loadDashboardStats();
            
            utils.showSuccess('Заказ создан успешно', 'quickOrderSuccess');
            
        } catch (error) {
            console.error('Error creating order:', error);
            utils.showError(error.message, 'quickOrderError');
        }
    }
}

// Создаем экземпляр менеджера заказов при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.ordersManager = new OrdersManager();
});
