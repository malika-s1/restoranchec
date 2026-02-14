-- Очищаем таблицу пользователей
TRUNCATE TABLE users RESTART IDENTITY;

-- Вставляем новых пользователей с правильными хэшами
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$XcBqNk8mL6pV5r4sT2wQ1uZ9y8x7C6v5B4n3M2L1K0J9I8H7G6F5E4D', 'admin'),
('manager', '$2b$10$YdCqOk9nM7qW6r5t3xR2vZa0y9x8D7w6C5v4N3M2L1K0J9I8H7G6F5E4', 'manager');

-- Проверяем
SELECT id, username, role FROM users;
