// test_auth.js
const bcrypt = require("bcrypt");

// Пароли из базы данных (из schema.sql)
const storedHashes = {
    admin: "$2b$10$8J3Y9cL1m6f5sV2wX7zN4eBpQrStUvWxYzA1bC3d5E7fG9hIjKlMnOp",
    manager: "$2b$10$6H5gF8jI2kL9mN1oP3qR7sTvUwXyZ4aB6cD8eF0gH2iJ4lMnOpQrStU"
};

// Пароли которые пользователь будет вводить
const testPasswords = ["admin123", "manager123", "password", "123456"];

async function testPassword(username, password) {
    const storedHash = storedHashes[username];
    if (!storedHash) {
        console.log(\` Пользователь \${username} не найден\`);
        return;
    }
    
    try {
        const isValid = await bcrypt.compare(password, storedHash);
        console.log(\` Тест: \${username} / \${password} -> \${isValid ? " ВЕРНЫЙ" : " НЕВЕРНЫЙ"}\`);
    } catch (error) {
        console.log(\` Ошибка проверки: \${error.message}\`);
    }
}

async function runTests() {
    console.log(" Тестирование паролей...");
    console.log("=" .repeat(50));
    
    for (const username in storedHashes) {
        for (const password of testPasswords) {
            await testPassword(username, password);
        }
    }
    
    console.log("=" .repeat(50));
    console.log(" Правильные пароли:");
    console.log(" admin / admin123");
    console.log(" manager / manager123");
}

runTests();
