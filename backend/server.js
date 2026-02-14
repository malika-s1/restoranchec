const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Check admin role middleware
const checkAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Routes

// 1. Auth Routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        const result = await pool.query(
            'SELECT * FROM users WHERE username = \',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        // Для демо упрощаем проверку пароля
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            } 
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Categories Routes
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/categories', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES (\, \) RETURNING *',
            [name, description || '']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/categories/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const result = await pool.query(
            'UPDATE categories SET name = \, description = \ WHERE id = \ RETURNING *',
            [name, description || '', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/categories/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Проверяем, есть ли блюда в этой категории
        const dishesCheck = await pool.query(
            'SELECT COUNT(*) FROM dishes WHERE category_id = \',
            [id]
        );
        
        if (parseInt(dishesCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with existing dishes' 
            });
        }
        
        const result = await pool.query(
            'DELETE FROM categories WHERE id = \ RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Dishes Routes
app.get('/api/dishes', authenticateToken, async (req, res) => {
    try {
        const { category_id, search, sort_by = 'name', sort_order = 'asc' } = req.query;
        
        let query = 'SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON d.category_id = c.id WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (category_id) {
            query += ' AND d.category_id = \$' + paramCount;
            params.push(category_id);
            paramCount++;
        }
        
        if (search) {
            query += ' AND d.name ILIKE \$' + paramCount;
            params.push('%' + search + '%');
            paramCount++;
        }
        
        // Добавляем сортировку
        const validSortColumns = ['name', 'price', 'weight', 'created_at'];
        const validSortOrders = ['asc', 'desc'];
        
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name';
        const sortOrder = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order : 'asc';
        
        query += ' ORDER BY d.' + sortColumn + ' ' + sortOrder;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching dishes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/dishes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON d.category_id = c.id WHERE d.id = \',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dish not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching dish:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/dishes', authenticateToken, checkAdminRole, upload.single('image'), async (req, res) => {
    try {
        const { name, composition, price, weight, category_id } = req.body;
        
        if (!name || !composition || !price || !weight || !category_id) {
            // Если есть загруженный файл, удаляем его
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const imagePath = req.file ? '/uploads/' + req.file.filename : null;
        
        const result = await pool.query(
            'INSERT INTO dishes (name, composition, price, weight, category_id, image_path) VALUES (\, \, \, \, \, \) RETURNING *',
            [name, composition, parseFloat(price), parseInt(weight), category_id, imagePath]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Удаляем загруженный файл при ошибке
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error creating dish:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/dishes/:id', authenticateToken, checkAdminRole, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, composition, price, weight, category_id } = req.body;
        
        // Получаем текущее блюдо для удаления старого изображения
        const currentDish = await pool.query(
            'SELECT * FROM dishes WHERE id = \',
            [id]
        );
        
        if (currentDish.rows.length === 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ error: 'Dish not found' });
        }
        
        let imagePath = currentDish.rows[0].image_path;
        
        // Если загружено новое изображение
        if (req.file) {
            // Удаляем старое изображение
            if (imagePath) {
                const oldImagePath = path.join(__dirname, imagePath);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imagePath = '/uploads/' + req.file.filename;
        }
        
        const result = await pool.query(
            'UPDATE dishes SET name = \, composition = \, price = \, weight = \, category_id = \, image_path = \ WHERE id = \ RETURNING *',
            [
                name || currentDish.rows[0].name,
                composition || currentDish.rows[0].composition,
                price ? parseFloat(price) : currentDish.rows[0].price,
                weight ? parseInt(weight) : currentDish.rows[0].weight,
                category_id || currentDish.rows[0].category_id,
                imagePath,
                id
            ]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error updating dish:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/dishes/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Получаем информацию о блюде для удаления изображения
        const dishResult = await pool.query(
            'SELECT * FROM dishes WHERE id = \',
            [id]
        );
        
        if (dishResult.rows.length === 0) {
            return res.status(404).json({ error: 'Dish not found' });
        }
        
        const dish = dishResult.rows[0];
        
        // Удаляем изображение
        if (dish.image_path) {
            const imagePath = path.join(__dirname, dish.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Удаляем блюдо из БД
        await pool.query('DELETE FROM dishes WHERE id = \', [id]);
        
        res.json({ message: 'Dish deleted successfully' });
    } catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Orders Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = 'SELECT o.*, json_agg(json_build_object(\'id\', oi.id, \'dish_name\', d.name, \'quantity\', oi.quantity, \'price\', oi.price)) as items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN dishes d ON oi.dish_id = d.id';
        const params = [];
        
        if (status) {
            query += ' WHERE o.status = \';
            params.push(status);
        }
        
        query += ' GROUP BY o.id ORDER BY o.created_at DESC';
        
        const result = await pool.query(query, params);
        
        // Обрабатываем случай когда нет items
        const orders = result.rows.map(order => ({
            ...order,
            items: order.items[0] && order.items[0].id ? order.items : []
        }));
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT o.*, json_agg(json_build_object(\'id\', oi.id, \'dish_id\', oi.dish_id, \'dish_name\', d.name, \'quantity\', oi.quantity, \'price\', oi.price)) as items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN dishes d ON oi.dish_id = d.id WHERE o.id = \ GROUP BY o.id',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = result.rows[0];
        order.items = order.items[0] && order.items[0].id ? order.items : [];
        
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { customer_name, customer_phone, items } = req.body;
        
        if (!customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'Customer name, phone, and at least one item are required' 
            });
        }
        
        // Начинаем транзакцию
        await pool.query('BEGIN');
        
        // Рассчитываем общую стоимость
        let totalPrice = 0;
        const dishPrices = [];
        
        for (const item of items) {
            const dishResult = await pool.query(
                'SELECT price FROM dishes WHERE id = \',
                [item.dish_id]
            );
            
            if (dishResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ error: 'Dish with id ' + item.dish_id + ' not found' });
            }
            
            const dishPrice = parseFloat(dishResult.rows[0].price);
            const itemTotal = dishPrice * parseInt(item.quantity);
            totalPrice += itemTotal;
            
            dishPrices.push({
                dish_id: item.dish_id,
                quantity: item.quantity,
                price: dishPrice
            });
        }
        
        // Создаем заказ
        const orderResult = await pool.query(
            'INSERT INTO orders (customer_name, customer_phone, total_price, status) VALUES (\, \, \, \'new\') RETURNING *',
            [customer_name, customer_phone, totalPrice]
        );
        
        const order = orderResult.rows[0];
        
        // Добавляем элементы заказа
        for (const dish of dishPrices) {
            await pool.query(
                'INSERT INTO order_items (order_id, dish_id, quantity, price) VALUES (\, \, \, \)',
                [order.id, dish.dish_id, dish.quantity, dish.price]
            );
        }
        
        await pool.query('COMMIT');
        
        // Получаем полные данные заказа
        const fullOrderResult = await pool.query(
            'SELECT o.*, json_agg(json_build_object(\'id\', oi.id, \'dish_id\', oi.dish_id, \'dish_name\', d.name, \'quantity\', oi.quantity, \'price\', oi.price)) as items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN dishes d ON oi.dish_id = d.id WHERE o.id = \ GROUP BY o.id',
            [order.id]
        );
        
        const fullOrder = fullOrderResult.rows[0];
        fullOrder.items = fullOrder.items[0] && fullOrder.items[0].id ? fullOrder.items : [];
        
        res.status(201).json(fullOrder);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['new', 'cooking', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ 
                error: 'Valid status is required (new, cooking, delivered, cancelled)' 
            });
        }
        
        const result = await pool.query(
            'UPDATE orders SET status = \ WHERE id = \ RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Food Service Admin API'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
    console.log('API Documentation:');
    console.log('  POST   /api/login         - Authenticate user');
    console.log('  GET    /api/categories    - Get all categories (requires auth)');
    console.log('  POST   /api/categories    - Create category (requires admin)');
    console.log('  GET    /api/dishes        - Get dishes with filters (requires auth)');
    console.log('  POST   /api/dishes        - Create dish (requires admin, multipart)');
    console.log('  GET    /api/orders        - Get all orders (requires auth)');
    console.log('  POST   /api/orders        - Create order (requires auth)');
});
