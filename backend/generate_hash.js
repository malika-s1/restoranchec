const bcrypt = require("bcrypt");

async function generateHash() {
    console.log(" Генерация хэшей паролей...");
    
    // Генерируем соль
    const saltRounds = 10;
    
    // Пароли которые мы хотим использовать
    const passwords = {
        admin: "admin123",
        manager: "manager123"
    };
    
    for (const [username, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(\`\n \${username}:\`);
        console.log(\`   Пароль: \${password}\`);
        console.log(\`   Хэш:    \${hash}\`);
        console.log(\`   SQL:    INSERT INTO users (username, password_hash, role) VALUES ('\${username}', '\${hash}', '\${username}');\`);
    }
}

generateHash();
