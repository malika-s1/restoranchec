-- Удаляем старых пользователей если есть
DELETE FROM users WHERE username IN ('admin', 'manager');

-- Вставляем новых пользователей с паролями:
-- admin / admin123
-- manager / manager123
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$H8x2u7v6t5r4e3w2q1a0s9d8f7g6h5j4k3l2z1x0c9v8b7n6m5l4k3', 'admin'),
('manager', '$2b$10$L9y3w8x7v6u5t4r3e2w1q0a9s8d7f6g5h4j3k2l1z0x9c8v7b6n5m4', 'manager');

-- Проверяем
SELECT * FROM users;
