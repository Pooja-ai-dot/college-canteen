const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const session = require("express-session");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "campus-bites-local-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));


app.get("/test-now", (req, res) => {
    res.send("Route is working!");
});

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("MySQL database connected successfully!");
});

// Test route
app.get("/test-db", (req, res) => {
    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database query failed",
                error: err.message
            });
        }

        res.json({
            message: "Database connected successfully!",
            tables: results
        });
    });
});

/* REGISTER API */
console.log("REGISTER ROUTE LOADED");
app.post("/api/auth/register", async (req, res) => {
    console.log("REGISTER API HIT");
    try {
        const username = String(req.body.username || "").trim();
        const phone = String(req.body.phone_number || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!username || (!phone && !email) || !password) {
            return res.status(400).json({
                message: "Name, password, and mobile number or email are required."
            });
        }

        if (username.length > 100) {
            return res.status(400).json({
                message: "Name is too long."
            });
        }

        if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
            return res.status(400).json({
                message: "Enter a valid mobile number."
            });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Enter a valid email address."
            });
        }

        const connection = db.promise();

        const [existing] = await connection.query(
            `SELECT user_id FROM users
             WHERE (? IS NOT NULL AND phone_number = ?)
                OR (? IS NOT NULL AND LOWER(email) = ?)
             LIMIT 1`,
            [
                phone || null, phone || null,
                email || null, email || null
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Mobile number or email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await connection.query(
            `INSERT INTO users
             (username, phone_number, email, password)
             VALUES (?, ?, ?, ?)`,
            [username, phone || null, email || null, hashedPassword]
        );

        return res.status(201).json({
            message: "Registration successful! Please log in.",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Mobile number or email is already registered."
            });
        }
        console.log("Registration error details:", error);
        return res.status(500).json({
            message: "Could not register. Please try again."
        });
    }
});


/* LOGIN API */
app.post("/api/auth/login", async (req, res) => {
    try {
        const identifier = String(req.body.identifier || "").trim();
        const password = String(req.body.password || "");

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Enter your mobile/email and password."
            });
        }

        const [users] = await db.promise().query(
            `SELECT user_id, username, phone_number, email, password
             FROM users
             WHERE phone_number = ? OR LOWER(email) = ?
             LIMIT 1`,
            [identifier, identifier.toLowerCase()]
        );

        if (
            users.length === 0 ||
            !(await bcrypt.compare(password, users[0].password))
        ) {
            return res.status(401).json({
                message: "Invalid mobile/email or password."
            });
        }

        const user = users[0];

        // Create a fresh session after successful login.
        await new Promise((resolve, reject) => {
            req.session.regenerate(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.userId = user.user_id;

        return res.json({
            message: "Login successful!",
            user: {
                userId: user.user_id,
                username: user.username,
                phone_number: user.phone_number,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Could not log in. Please try again."
        });
    }
});


/* CHECK LOGIN STATUS */
app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "You are not logged in."
        });
    }

    try {
        const [users] = await db.promise().query(
            `SELECT user_id, username, phone_number, email
             FROM users WHERE user_id = ? LIMIT 1`,
            [req.session.userId]
        );

        if (users.length === 0) {
            return req.session.destroy(() => {
                res.status(401).json({
                    message: "Please log in again."
                });
            });
        }

        return res.json({ user: users[0] });

    } catch (error) {
        console.error("Login status error:", error.message);

        return res.status(500).json({
            message: "Could not check login status."
        });
    }
});


/* LOGOUT API */
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                message: "Could not log out."
            });
        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        return res.json({
            message: "Logged out successfully."
        });
    });
});

// Get food menu
app.get("/api/foods", (req, res) => {
    db.query(
        "SELECT item_name, category, price FROM menu_items",
        (err, results) => {
            if (err) {
                console.error("Menu error:", err.message);

                return res.status(500).json({
                    message: "Could not load menu.",
                    error: err.message
                });
            }

            res.json(results);
        }
    );
});

// Place order

app.post("/api/orders", async (req, res) => {
    const items = req.body.items;
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please log in before placing an order."
        });
    }
    const pickupTime = req.body.pickupTime;
    const paymentMethod = req.body.paymentMethod;

    if (
        typeof pickupTime !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime) ||
        pickupTime < "08:30" ||
        pickupTime > "17:30"
    ) {
        return res.status(400).json({
            message: "Choose pickup time between 8:30 AM and 5:30 PM."
        });
    }

    if (!["Cash", "UPI"].includes(paymentMethod)) {
        return res.status(400).json({
            message: "Please select Cash or UPI."
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: "Your cart is empty."
        });
    }

    for (const item of items) {
        if (
            typeof item.name !== "string" ||
            !item.name.trim() ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) < 1
        ) {
            return res.status(400).json({
                message: "Invalid food name or quantity."
            });
        }
    }

    const connection = db.promise();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const names = [...new Set(items.map(item => item.name.trim()))];

        const [foods] = await connection.query(
            `SELECT item_name, category, price
             FROM menu_items
             WHERE item_name IN (?)
             FOR UPDATE`,
            [names]
        );

        const foodMap = new Map();

        for (const food of foods) {
            foodMap.set(food.item_name, {
                name: food.item_name,
                price: Number(food.price)
            });
        }

        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const food = foodMap.get(item.name.trim());

            if (!food) {
                throw new Error("Food not found: " + item.name);
            }

            const quantity = Number(item.quantity);
            const itemTotal = Number((food.price * quantity).toFixed(2));

            total += itemTotal;

            orderItems.push({
                name: food.name,
                price: food.price,
                quantity,
                itemTotal
            });
        }

        total = Number(total.toFixed(2));

        const [orderResult] = await connection.query(
            `INSERT INTO orders
     (user_id, total_amount, order_status, pickup_time)
     VALUES (?, ?, 'Received', ?)`,
            [req.session.userId, total, pickupTime]
        );

        const orderId = orderResult.insertId;

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO order_items
                 (order_id, item_name, price, quantity, item_total)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.name,
                    item.price,
                    item.quantity,
                    item.itemTotal
                ]
            );
        }

        await connection.query(
            `INSERT INTO transactions
             (order_id, amount, payment_method, payment_status)
             VALUES (?, ?, ?, 'Pending')`,
            [orderId, total, paymentMethod]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: "Order placed successfully!",
            orderId,
            pickupTime,
            total,
            paymentMethod,
            paymentStatus: "Pending"
        });

    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError.message);
            }
        }

        console.error("Checkout error:", error.message);

        return res.status(400).json({
            message: error.message || "Could not place order."
        });
    }
});
app.get("/test-history-route", (req, res) => {
    res.json({ message: "History route is working" });
});

/* LOGGED-IN USER'S ORDER HISTORY */
app.get("/api/my-orders", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Please log in to view your orders."
        });
    }

    try {
        const connection = db.promise();

        const [orders] = await connection.query(
            `SELECT order_id, total_amount, order_status,
                    pickup_time
             FROM orders
             WHERE user_id = ?
             ORDER BY order_id DESC`,
            [req.session.userId]
        );

        for (const order of orders) {
            const [items] = await connection.query(
                `SELECT item_name, price, quantity, item_total
                 FROM order_items
                 WHERE order_id = ?`,
                [order.order_id]
            );

            order.items = items;
        }

        return res.json({ orders });
    } catch (error) {
        console.error("My orders error:", error.message);

        return res.status(500).json({
            message: "Could not load your orders."
        });
    }
});



/* ================= ADMIN AUTHENTICATION ================= */

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({
            message: "Please log in as admin."
        });
    }

    next();
}

/* Admin login */
app.post("/api/admin/login", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");

        if (!username || !password) {
            return res.status(400).json({
                message: "Enter admin username and password."
            });
        }

        const [admins] = await db.promise().execute(
            `SELECT admin_id, username, password_hash
             FROM admins
             WHERE username = ?
             LIMIT 1`,
            [username]
        );

        if (
            admins.length === 0 ||
            !(await bcrypt.compare(password, admins[0].password_hash))
        ) {
            return res.status(401).json({
                message: "Invalid admin credentials."
            });
        }

        await new Promise((resolve, reject) => {
            req.session.regenerate(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.adminId = admins[0].admin_id;
        req.session.adminUsername = admins[0].username;

        return res.json({
            message: "Admin login successful!",
            admin: {
                id: admins[0].admin_id,
                username: admins[0].username
            }
        });
    } catch (error) {
        console.error("Admin login error:", error.message);
        return res.status(500).json({
            message: "Could not log in as admin."
        });
    }
});

/* Check admin session */
app.get("/api/admin/me", requireAdmin, (req, res) => {
    res.json({
        admin: {
            id: req.session.adminId,
            username: req.session.adminUsername
        }
    });
});

/* Admin logout */
app.post("/api/admin/logout", requireAdmin, (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                message: "Could not log out."
            });
        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        return res.json({ message: "Admin logged out." });
    });
});

/* ================= ADMIN DASHBOARD APIs ================= */

/* Dashboard summary */
app.get("/api/admin/summary", requireAdmin, async (req, res) => {
    try {
        const connection = db.promise();

        const [[orderStats]] = await connection.query(`
            SELECT COUNT(*) AS total_orders,
                   COALESCE(SUM(total_amount), 0) AS total_order_value
            FROM orders
        `);

        const [[foodStats]] = await connection.query(`
            SELECT COUNT(*) AS total_foods
            FROM menu_items
        `);

        const [[customerStats]] = await connection.query(`
            SELECT COUNT(*) AS total_customers
            FROM users
        `);

        const [[paymentStats]] = await connection.query(`
            SELECT COALESCE(SUM(amount), 0) AS total_payments
            FROM transactions
            WHERE payment_status = 'Paid'
        `);

        res.json({
            orders: orderStats,
            foods: foodStats,
            customers: customerStats,
            payments: paymentStats
        });
    } catch (error) {
        console.error("Admin summary error:", error.message);
        res.status(500).json({
            message: "Could not load dashboard summary."
        });
    }
});

/* View all orders */
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.promise().query(`
            SELECT o.order_id, o.user_id, u.username,
                   o.total_amount, o.order_status, o.pickup_time
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            ORDER BY o.order_id DESC
        `);

        res.json(orders);
    } catch (error) {
        console.error("Admin orders error:", error.message);
        res.status(500).json({
            message: "Could not load orders."
        });
    }
});

/* Update order status */
app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    const orderId = Number(req.params.id);
    const status = String(req.body.status || "");

    const allowedStatuses = [
        "Received",
        "Preparing",
        "Ready",
        "Completed",
        "Cancelled"
    ];

    if (!Number.isInteger(orderId) || orderId < 1 ||
        !allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid order ID or status."
        });
    }

    try {
        const [result] = await db.promise().execute(
            "UPDATE orders SET order_status = ? WHERE order_id = ?",
            [status, orderId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.json({ message: "Order status updated.", status });
    } catch (error) {
        console.error("Order update error:", error.message);
        res.status(500).json({
            message: "Could not update order status."
        });
    }
});

/* View menu */
app.get("/api/admin/menu", requireAdmin, async (req, res) => {
    try {
        const [foods] = await db.promise().query(`
            SELECT item_name, category, price
            FROM menu_items
            ORDER BY category, item_name
        `);

        res.json(foods);
    } catch (error) {
        console.error("Admin menu error:", error.message);
        res.status(500).json({
            message: "Could not load menu."
        });
    }
});

/* Add menu item */
app.post("/api/admin/menu", requireAdmin, async (req, res) => {
    const itemName = String(req.body.item_name || "").trim();
    const category = String(req.body.category || "").trim();
    const price = Number(req.body.price);

    if (!itemName || !category ||
        itemName.length > 150 || category.length > 100 ||
        !Number.isFinite(price) || price < 0 || price > 1000000) {
        return res.status(400).json({
            message: "Enter a valid item name, category and price."
        });
    }

    try {
        await db.promise().execute(
            `INSERT INTO menu_items (item_name, category, price)
             VALUES (?, ?, ?)`,
            [itemName, category, price]
        );

        res.status(201).json({ message: "Food item added." });
    } catch (error) {
        console.error("Add food error:", error.message);
        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
            message: error.code === "ER_DUP_ENTRY"
                ? "This item already exists."
                : "Could not add food item."
        });
    }
});

/* Edit menu item; old name identifies the item */
app.put("/api/admin/menu/:oldName", requireAdmin, async (req, res) => {
    const oldName = String(req.params.oldName || "").trim();
    const itemName = String(req.body.item_name || "").trim();
    const category = String(req.body.category || "").trim();
    const price = Number(req.body.price);

    if (!oldName || !itemName || !category ||
        itemName.length > 150 || category.length > 100 ||
        !Number.isFinite(price) || price < 0 || price > 1000000) {
        return res.status(400).json({
            message: "Enter valid food details."
        });
    }

    try {
        const [result] = await db.promise().execute(
            `UPDATE menu_items
             SET item_name = ?, category = ?, price = ?
             WHERE item_name = ?`,
            [itemName, category, price, oldName]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Food item not found."
            });
        }

        res.json({ message: "Food item updated." });
    } catch (error) {
        console.error("Edit food error:", error.message);
        res.status(500).json({
            message: "Could not update food item."
        });
    }
});

/* Delete menu item */
app.delete("/api/admin/menu/:name", requireAdmin, async (req, res) => {
    const name = String(req.params.name || "").trim();

    if (!name) {
        return res.status(400).json({
            message: "Food name is required."
        });
    }

    try {
        const [result] = await db.promise().execute(
            "DELETE FROM menu_items WHERE item_name = ?",
            [name]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Food item not found."
            });
        }

        res.json({ message: "Food item deleted." });
    } catch (error) {
        console.error("Delete food error:", error.message);
        res.status(500).json({
            message: "Could not delete food item. It may be linked to existing records."
        });
    }
});

/* View transactions */
app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT t.transaction_id, t.order_id, t.amount,
                   t.payment_method, t.payment_status, t.transaction_date,
                   o.order_status, o.pickup_time, u.username
            FROM transactions t
            INNER JOIN orders o ON t.order_id = o.order_id
            LEFT JOIN users u ON o.user_id = u.user_id
            ORDER BY t.transaction_id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Admin transactions error:", error.message);
        res.status(500).json({
            message: "Could not load transactions."
        });
    }
});

/* Update payment status */
app.patch("/api/admin/transactions/:id/status", requireAdmin, async (req, res) => {
    const transactionId = Number(req.params.id);
    const status = String(req.body.status || "");

    if (!Number.isInteger(transactionId) || transactionId < 1 ||
        !["Pending", "Paid", "Failed", "Refunded"].includes(status)) {
        return res.status(400).json({
            message: "Invalid transaction ID or payment status."
        });
    }

    try {
        const [result] = await db.promise().execute(
            `UPDATE transactions
             SET payment_status = ?
             WHERE transaction_id = ?`,
            [status, transactionId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Transaction not found."
            });
        }

        res.json({ message: "Payment status updated." });
    } catch (error) {
        console.error("Payment update error:", error.message);
        res.status(500).json({
            message: "Could not update payment status."
        });
    }
});
/* View customers: never return password hashes */
app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
        const [customers] = await db.promise().query(`
            SELECT user_id, username, phone_number, email
            FROM users
            ORDER BY user_id DESC
        `);

        res.json(customers);
    } catch (error) {
        console.error("Admin customers error:", error.message);
        res.status(500).json({
            message: "Could not load customers."
        });
    }
});
// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(
        "College Canteen server running on port " + PORT
    );
});
// Submit a rating
app.post("/api/foods/:foodId/ratings", async (req, res) => {
    try {
        const foodId = Number(req.params.foodId);
        const rating = Number(req.body.rating);

        if (!Number.isInteger(foodId) || foodId < 1) {
            return res.status(400).json({
                message: "Invalid food ID"
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }

        // Confirm this table and ID column match your menu schema.
        const [foods] = await db.execute(
            "SELECT id FROM menu_items WHERE id = ?",
            [foodId]
        );

        if (foods.length === 0) {
            return res.status(404).json({
                message: "Food item not found"
            });
        }

        await db.execute(
            `INSERT INTO food_ratings (food_id, rating)
             VALUES (?, ?)`,
            [foodId, rating]
        );

        res.status(201).json({
            message: "Rating submitted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not save rating"
        });
    }
});


// Get average rating for each food item
app.get("/api/foods/:foodId/ratings", async (req, res) => {
    try {
        const foodId = Number(req.params.foodId);

        if (!Number.isInteger(foodId) || foodId < 1) {
            return res.status(400).json({
                message: "Invalid food ID"
            });
        }

        const [rows] = await db.execute(
            `SELECT
                ROUND(AVG(rating), 1) AS averageRating,
                COUNT(*) AS totalRatings
             FROM food_ratings
             WHERE food_id = ?`,
            [foodId]
        );

        res.json({
            averageRating: Number(rows[0].averageRating) || 0,
            totalRatings: Number(rows[0].totalRatings) || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not load ratings"
        });
    }
});