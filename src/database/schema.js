const Database = require('better-sqlite3');

class Schema {
    constructor(db) {
        this.db = db;
    }

    initialize() {
        // Create users table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
                companyId INTEGER,
                FOREIGN KEY (companyId) REFERENCES companies(id)
            )
        `).run();

        // Create companies table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                contact TEXT
            )
        `).run();

        // Create products table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                category TEXT NOT NULL,
                country TEXT NOT NULL,
                companyId INTEGER,
                short_description TEXT,
                photo_path TEXT,
                FOREIGN KEY (companyId) REFERENCES companies(id)
            )
        `).run();

        // Migration: Add short_description column if missing
        const hasShortDescription = this.db.prepare(`
            SELECT COUNT(*) as count FROM pragma_table_info('products') WHERE name = 'short_description'
        `).get().count;
        if (!hasShortDescription) {
            this.db.prepare(`
                ALTER TABLE products ADD COLUMN short_description TEXT
            `).run();
        }

        // Migration: Add photo_path column if missing
        const hasPhotoPath = this.db.prepare(`
            SELECT COUNT(*) as count FROM pragma_table_info('products') WHERE name = 'photo_path'
        `).get().count;
        if (!hasPhotoPath) {
            this.db.prepare(`
                ALTER TABLE products ADD COLUMN photo_path TEXT
            `).run();
        }

        // Create feedback table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                productId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                comment TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (productId) REFERENCES products(id),
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `).run();

        // Create transactions table
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                productId INTEGER,
                type TEXT NOT NULL CHECK(type IN ('add', 'remove', 'update')),
                quantity INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                companyId INTEGER,
                FOREIGN KEY (productId) REFERENCES products(id),
                FOREIGN KEY (companyId) REFERENCES companies(id)
            )
        `).run();
    }
}

module.exports = Schema;