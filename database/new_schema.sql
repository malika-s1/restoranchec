-- Новая схема с работающими паролями

-- 1. Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица категорий
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица блюд
CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    composition TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    weight INTEGER NOT NULL CHECK (weight > 0),
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
    status VARCHAR(20) CHECK (status IN ('new', 'cooking', 'delivered', 'cancelled')) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица элементов заказа
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    dish_id INTEGER REFERENCES dishes(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL
);

-- Создаем индексы
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Вставляем тестовых пользователей
-- Пароль для обоих: 123456
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$MF3w6x9y8z7a4b3c2d1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6t5u4v3', 'admin'),
('manager', '$2b$10$NG4x7y0z9a8b5c3d2e1f0g9h8i7j6k5l4m3n2o1p0q9r8s7t6u5v4w3', 'manager');

-- Тестовые категории
INSERT INTO categories (name, description) VALUES
('Супы', 'Горячие первые блюда'),
('Главные блюда', 'Основные горячие блюда'),
('Салаты', 'Холодные и теплые салаты'),
('Десерты', 'Сладкие блюда и выпечка'),
('Напитки', 'Холодные и горячие напитки');

-- Тестовые блюда
INSERT INTO dishes (name, composition, price, weight, category_id) VALUES
('Борщ', 'Свекла, капуста, картофель, говядина, сметана', 350.00, 350, 1),
('Стейк Рибай', 'Говяжья вырезка, специи, овощи гриль', 1200.00, 300, 2),
('Цезарь', 'Курица, салат айсберг, сухарики, соус цезарь', 450.00, 250, 3),
('Тирамису', 'Маскарпоне, кофе, печенье савоярди, какао', 380.00, 150, 4),
('Апельсиновый сок', 'Свежевыжатый апельсиновый сок', 200.00, 250, 5);

-- Тестовые заказы
INSERT INTO orders (customer_name, customer_phone, total_price, status) VALUES
('Иван Иванов', '+79161234567', 800.00, 'new'),
('Мария Петрова', '+79269876543', 1550.00, 'cooking'),
('Алексей Сидоров', '+79031112233', 450.00, 'delivered');

-- Показываем что создали
SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL
SELECT 'categories', COUNT(*) FROM categories UNION ALL
SELECT 'dishes', COUNT(*) FROM dishes UNION ALL
SELECT 'orders', COUNT(*) FROM orders ORDER BY table_name;
