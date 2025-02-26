const Database = require('./db');

class Schema {
    constructor(db) {
        this.db = db;
    }

    initialize() {
        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    price REAL NOT NULL,
                    quantity INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    country TEXT NOT NULL DEFAULT 'RSA',
                    last_updated TEXT NOT NULL
                )
            `);

            this.db.run(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id TEXT,
                    type TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    value REAL NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `);

            this.db.run(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)`);
        });
    }
}

module.exports = Schema;