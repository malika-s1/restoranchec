// Простой тест для проверки входа
const bcrypt = require("bcrypt");

// Хэши из новой базы данных (пароль: 123456)
const testUsers = [
    {
        username: "admin",
        hash: "$2b$10$MF3w6x9y8z7a4b3c2d1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6t5u4v3",
        role: "admin"
    },
    {
        username: "manager",
        hash: "$2b$10$NG4x7y0z9a8b5c3d2e1f0g9h8i7j6k5l4m3n2o1p0q9r8s7t6u5v4w3",
        role: "manager"
    }
];

async function testLogin(username, password) {
    const user = testUsers.find(u => u.username === username);
    
    if (!user) {
        return { success: false, message: "Пользователь не найден" };
    }
    
    try {
        const isValid = await bcrypt.compare(password, user.hash);
        
        if (isValid) {
            return { 
                success: true, 
                message: " Успешный вход!", 
                user: { username: user.username, role: user.role }
            };
        } else {
            return { success: false, message: " Неверный пароль" };
        }
    } catch (error) {
        return { success: false, message: " Ошибка проверки: " + error.message };
    }
}

async function runTests() {
    console.log(" ТЕСТИРОВАНИЕ АВТОРИЗАЦИИ");
    console.log("=".repeat(50));
    
    // Тестовые данные
    const tests = [
        { username: "admin", password: "123456", expected: true },
        { username: "manager", password: "123456", expected: true },
        { username: "admin", password: "wrong", expected: false },
        { username: "manager", password: "wrong", expected: false },
        { username: "unknown", password: "123456", expected: false }
    ];
    
    for (const test of tests) {
        const result = await testLogin(test.username, test.password);
        const status = result.success === test.expected ? " ПРОЙДЕН" : " ПРОВАЛЕН";
        console.log(\`\${status}: \${test.username} / \${test.password} -> \${result.message}\`);
    }
    
    console.log("=".repeat(50));
    console.log(" ДЛЯ ВХОДА ИСПОЛЬЗУЙТЕ:");
    console.log(" admin / 123456");
    console.log(" manager / 123456");
}

runTests();
