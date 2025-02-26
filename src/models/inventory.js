const { 
    validateId, 
    validateName, 
    validatePrice, 
    validateQuantity, 
    validateCategory,
    validateCountry,
    validateQuantityChange,
    formatPrice
} = require('../utils/helpers');

class InventoryManagement {
    constructor(db, broadcastUpdate = () => {}) {
        this.db = db;
        this.broadcastUpdate = broadcastUpdate;
    }

    async addProduct(id, name, price, quantity, category, country) {
        const validatedId = validateId(id);
        const validatedName = validateName(name);
        const validatedPrice = validatePrice(price);
        const validatedQuantity = validateQuantity(quantity);
        const validatedCategory = validateCategory(category);
        const validatedCountry = validateCountry(country);

        const lastUpdated = new Date().toISOString();
        await this.db.run(`
            INSERT OR REPLACE INTO products (id, name, price, quantity, category, country, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [validatedId, validatedName, validatedPrice, validatedQuantity, validatedCategory, validatedCountry, lastUpdated]);

        await this.logTransaction(validatedId, "ADD", validatedQuantity);
        this.broadcastUpdate('inventoryUpdate', await this.db.all(`SELECT * FROM products`));
        console.log(`Added/Updated: ${validatedName} in ${validatedCategory}, ${validatedCountry}`);
    }

    async editProduct(id, name, price, quantity, category, country) {
        const validatedId = validateId(id);
        const validatedName = validateName(name);
        const validatedPrice = validatePrice(price);
        const validatedQuantity = validateQuantity(quantity);
        const validatedCategory = validateCategory(category);
        const validatedCountry = validateCountry(country);

        const product = await this.getProduct(validatedId);
        if (!product) throw new Error("Product not found");

        const lastUpdated = new Date().toISOString();
        await this.db.run(`
            UPDATE products 
            SET name = ?, price = ?, quantity = ?, category = ?, country = ?, last_updated = ?
            WHERE id = ?
        `, [validatedName, validatedPrice, validatedQuantity, validatedCategory, validatedCountry, lastUpdated, validatedId]);

        const quantityChange = validatedQuantity - product.quantity;
        if (quantityChange !== 0) {
            await this.logTransaction(validatedId, quantityChange > 0 ? "RESTOCK" : "SALE", Math.abs(quantityChange));
        }
        this.broadcastUpdate('inventoryUpdate', await this.db.all(`SELECT * FROM products`));
        console.log(`Edited: ${validatedName}`);
    }

    async removeProduct(id) {
        const validatedId = validateId(id);
        const product = await this.getProduct(validatedId);
        if (!product) throw new Error("Product not found");
        
        await this.db.run(`DELETE FROM products WHERE id = ?`, [validatedId]);
        await this.logTransaction(validatedId, "REMOVE", product.quantity);
        this.broadcastUpdate('inventoryUpdate', await this.db.all(`SELECT * FROM products`));
        console.log(`Removed: ${product.name}`);
    }

    async updateQuantity(id, quantityChange) {
        const validatedId = validateId(id);
        const validatedChange = validateQuantityChange(quantityChange);
        const product = await this.getProduct(validatedId);
        if (!product) throw new Error("Product not found");

        const newQuantity = product.quantity + validatedChange;
        if (newQuantity < 0) throw new Error(`Insufficient stock for ${product.name}`);

        const lastUpdated = new Date().toISOString();
        await this.db.run(`
            UPDATE products 
            SET quantity = ?, last_updated = ?
            WHERE id = ?
        `, [newQuantity, lastUpdated, validatedId]);

        await this.logTransaction(validatedId, validatedChange > 0 ? "RESTOCK" : "SALE", Math.abs(validatedChange));
        this.broadcastUpdate('inventoryUpdate', await this.db.all(`SELECT * FROM products`));
        console.log(`Updated ${product.name} quantity to ${newQuantity}`);
    }

    async getProduct(id) {
        return await this.db.get(`SELECT * FROM products WHERE id = ?`, [validateId(id)]);
    }

    async searchProducts(query) {
        query = `%${query.toLowerCase()}%`;
        return await this.db.all(`
            SELECT * FROM products 
            WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ?
        `, [query, query]);
    }

    async getProductsByCategory(category) {
        return await this.db.all(`
            SELECT * FROM products 
            WHERE LOWER(category) = ?
        `, [validateCategory(category)]);
    }

    async getTotalValue() {
        const result = await this.db.get(`
            SELECT SUM(price * quantity) as total 
            FROM products
        `);
        return Number((result.total || 0).toFixed(2));
    }

    async logTransaction(productId, type, quantity) {
        const product = await this.getProduct(productId);
        const timestamp = new Date().toISOString();
        const value = product ? (product.price * quantity) : 0;

        await this.db.run(`
            INSERT INTO transactions (product_id, type, quantity, value, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `, [productId, type, quantity, value, timestamp]);
        this.broadcastUpdate('transactionUpdate', await this.db.all(`SELECT * FROM transactions`));
    }

    async exportToCSV() {
        const products = await this.db.all(`SELECT * FROM products`);
        let csv = "ID,Name,Price,Quantity,Category,Country,Last Updated,Total Value\n";
        for (const product of products) {
            const totalValue = formatPrice(product.price * product.quantity, product.country);
            csv += `${product.id},${product.name},${formatPrice(product.price, product.country)},${product.quantity},${product.category},${product.country},${product.last_updated},${totalValue}\n`;
        }
        return csv;
    }

    async displayInventoryReport() {
        const products = await this.db.all(`SELECT * FROM products`);
        const categories = [...new Set(products.map(p => p.category))];

        console.log("\n=== Inventory Report ===");
        console.log(`Date: ${new Date().toLocaleString()}`);
        console.log(`Total Items: ${products.length}`);
        console.log(`Categories: ${categories.join(", ")}`);
        
        console.log("\nProducts:");
        console.log("ID | Name | Price | Qty | Category | Country | Value");
        console.log("-".repeat(70));
        
        for (const product of products) {
            const value = formatPrice(product.price * product.quantity, product.country);
            console.log(`${product.id} | ${product.name.padEnd(15)} | ${formatPrice(product.price, product.country).padEnd(8)} | ${product.quantity.toString().padEnd(3)} | ${product.category.padEnd(10)} | ${product.country.padEnd(7)} | ${value}`);
        }
        
        console.log("-".repeat(70));
        console.log(`Total Inventory Value: $${await this.getTotalValue()}`); // Total still in base currency (USD)
        console.log("====================\n");
    }

    async displayTransactionHistory() {
        const transactions = await this.db.all(`SELECT * FROM transactions`);
        console.log("\n=== Transaction History ===");
        for (const trans of transactions) {
            const product = await this.getProduct(trans.product_id);
            const value = product ? formatPrice(trans.value, product.country) : trans.value;
            console.log(`${new Date(trans.timestamp).toLocaleString()} | ${trans.type.padEnd(7)} | ${(product?.name || "Removed").padEnd(15)} | ${trans.quantity} units | ${value}`);
        }
        console.log("====================\n");
    }
}

module.exports = InventoryManagement;