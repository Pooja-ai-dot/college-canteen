
require("dotenv").config();

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function createAdmin() {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD in .env");
    }

    const username = process.env.ADMIN_USERNAME.trim();
    const password = process.env.ADMIN_PASSWORD;

    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("Use a password between 12 and 72 bytes.");
    }

    const db = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "canteen_management_system"
    });

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        await db.execute(
            `INSERT INTO admins (username, password_hash)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            [username, passwordHash]
        );

        console.log("Admin account created/updated successfully.");
    } finally {
        await db.end();
    }
}

createAdmin().catch(error => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
});
