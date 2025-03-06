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

    // CHANGE: Added companyId parameter to associate products with an admin's company
    async addProduct(id, name, price, quantity, category, country, companyId) {
        const validatedId = validateId(id);
        const validatedName = validateName(name);
        const validatedPrice = validatePrice(price);
        const validatedQuantity = validateQuantity(quantity);
        const validatedCategory = validateCategory(category);
        const validatedCountry = validateCountry(country);

        const lastUpdated = new Date().toISOString();
        // CHANGE: Added company_id to INSERT query
        await this.db.run(
            `INSERT OR REPLACE INTO products (id, name, price, quantity, category, country, company_id, last_updated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [validatedId, validatedName, validatedPrice, validatedQuantity, validatedCategory, validatedCountry, companyId, lastUpdated]
        );

        // CHANGE: Pass companyId to logTransaction
        await this.logTransaction(validatedId, "ADD", validatedQuantity, companyId);
        // CHANGE: Filter broadcast by companyId
        this.broadcastUpdate('inventoryUpdate', await this.getProductsForCompany(companyId));
        console.log(`Added/Updated: ${validatedName} in ${validatedCategory}, ${validatedCountry}`);
    }

    // CHANGE: Added companyId parameter
    async editProduct(id, name, price, quantity, category, country, companyId) {
        const validatedId = validateId(id);
        const validatedName = validateName(name);
        const validatedPrice = validatePrice(price);
        const validatedQuantity = validateQuantity(quantity);
        const validatedCategory = validateCategory(category);
        const validatedCountry = validateCountry(country);

        // CHANGE: Pass companyId to getProduct
        const product = await this.getProduct(validatedId, companyId);
        if (!product) throw new Error("Product not found or not owned by this company");

        const lastUpdated = new Date().toISOString();
        // CHANGE: Added company_id to WHERE clause
        await this.db.run(
            `UPDATE products 
             SET name = ?, price = ?, quantity = ?, category = ?, country = ?, last_updated = ?
             WHERE id = ? AND company_id = ?`,
            [validatedName, validatedPrice, validatedQuantity, validatedCategory, validatedCountry, lastUpdated, validatedId, companyId]
        );

        const quantityChange = validatedQuantity - product.quantity;
        if (quantityChange !== 0) {
            // CHANGE: Pass companyId to logTransaction
            await this.logTransaction(validatedId, quantityChange > 0 ? "RESTOCK" : "SALE", Math.abs(quantityChange), companyId);
        }
        // CHANGE: Filter broadcast by companyId
        this.broadcastUpdate('inventoryUpdate', await this.getProductsForCompany(companyId));
        console.log(`Edited: ${validatedName}`);
    }

    async getAllProductsForUsers() {
        return await this.db.all(`SELECT * FROM products`);
    }

    // CHANGE: Added companyId parameter
    async removeProduct(id, companyId) {
        const validatedId = validateId(id);
        // CHANGE: Pass companyId to getProduct
        const product = await this.getProduct(validatedId, companyId);
        if (!product) throw new Error("Product not found or not owned by this company");

        // CHANGE: Added company_id to WHERE clause
        await this.db.run(`DELETE FROM products WHERE id = ? AND company_id = ?`, [validatedId, companyId]);
        // CHANGE: Pass companyId to logTransaction
        await this.logTransaction(validatedId, "REMOVE", product.quantity, companyId);
        // CHANGE: Filter broadcast by companyId
        this.broadcastUpdate('inventoryUpdate', await this.getProductsForCompany(companyId));
        console.log(`Removed: ${product.name}`);
    }

    // CHANGE: Added companyId parameter
    async updateQuantity(id, quantityChange, companyId) {
        const validatedId = validateId(id);
        const validatedChange = validateQuantityChange(quantityChange);
        // CHANGE: Pass companyId to getProduct
        const product = await this.getProduct(validatedId, companyId);
        if (!product) throw new Error("Product not found or not owned by this company");

        const newQuantity = product.quantity + validatedChange;
        if (newQuantity < 0) throw new Error(`Insufficient stock for ${product.name}`);

        const lastUpdated = new Date().toISOString();
        // CHANGE: Added company_id to WHERE clause
        await this.db.run(
            `UPDATE products 
             SET quantity = ?, last_updated = ?
             WHERE id = ? AND company_id = ?`,
            [newQuantity, lastUpdated, validatedId, companyId]
        );

        // CHANGE: Pass companyId to logTransaction
        await this.logTransaction(validatedId, validatedChange > 0 ? "RESTOCK" : "SALE", Math.abs(validatedChange), companyId);
        // CHANGE: Filter broadcast by companyId
        this.broadcastUpdate('inventoryUpdate', await this.getProductsForCompany(companyId));
        console.log(`Updated ${product.name} quantity to ${newQuantity}`);
    }

    // CHANGE: Added companyId parameter to filter by company
    async getProduct(id, companyId) {
        return await this.db.get(
            `SELECT * FROM products WHERE id = ? AND company_id = ?`,
            [validateId(id), companyId]
        );
    }

    // CHANGE: New method to get products for a specific company
    async getProductsForCompany(companyId) {
        return await this.db.all(`SELECT * FROM products WHERE company_id = ?`, [companyId]);
    }

    // CHANGE: Added companyId parameter to filter search
    async searchProducts(query, companyId) {
        query = `%${query.toLowerCase()}%`;
        return await this.db.all(
            `SELECT * FROM products 
             WHERE (LOWER(name) LIKE ? OR LOWER(category) LIKE ?) AND company_id = ?`,
            [query, query, companyId]
        );
    }

    // CHANGE: Added companyId parameter to filter by category
    async getProductsByCategory(category, companyId) {
        return await this.db.all(
            `SELECT * FROM products 
             WHERE LOWER(category) = ? AND company_id = ?`,
            [validateCategory(category), companyId]
        );
    }

    // CHANGE: Added companyId parameter to filter total value
    async getTotalValue(companyId) {
        const result = await this.db.get(
            `SELECT SUM(price * quantity) as total 
             FROM products WHERE company_id = ?`,
            [companyId]
        );
        return Number((result.total || 0).toFixed(2));
    }

    // CHANGE: Added companyId parameter to log transactions for a company
    async logTransaction(productId, type, quantity, companyId) {
        const product = await this.getProduct(productId, companyId);
        const timestamp = new Date().toISOString();
        const value = product ? (product.price * quantity) : 0;

        await this.db.run(
            `INSERT INTO transactions (product_id, type, quantity, value, timestamp)
             VALUES (?, ?, ?, ?, ?)`,
            [productId, type, quantity, value, timestamp]
        );
        // CHANGE: Filter transactions by companyId
        this.broadcastUpdate('transactionUpdate', await this.getTransactionsForCompany(companyId));
    }

    // CHANGE: New method to get transactions for a specific company
    async getTransactionsForCompany(companyId) {
        return await this.db.all(
            `SELECT t.* FROM transactions t
             JOIN products p ON t.product_id = p.id
             WHERE p.company_id = ?`,
            [companyId]
        );
    }

    // CHANGE: Added companyId parameter to filter CSV export
    async exportToCSV(companyId) {
        const products = await this.getProductsForCompany(companyId);
        let csv = "ID,Name,Price,Quantity,Category,Country,Last Updated,Total Value\n";
        for (const product of products) {
            const totalValue = formatPrice(product.price * product.quantity, product.country);
            csv += `${product.id},${product.name},${formatPrice(product.price, product.country)},${product.quantity},${product.category},${product.country},${product.last_updated},${totalValue}\n`;
        }
        return csv;
    }

    // CHANGE: Added companyId parameter to filter report
    async displayInventoryReport(companyId) {
        const products = await this.getProductsForCompany(companyId);
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
        console.log(`Total Inventory Value: $${await this.getTotalValue(companyId)}`);
        console.log("====================\n");
    }

    // CHANGE: Added companyId parameter to filter transaction history
    async displayTransactionHistory(companyId) {
        const transactions = await this.getTransactionsForCompany(companyId);
        console.log("\n=== Transaction History ===");
        for (const trans of transactions) {
            const product = await this.getProduct(trans.product_id, companyId);
            const value = product ? formatPrice(trans.value, product.country) : trans.value;
            console.log(`${new Date(trans.timestamp).toLocaleString()} | ${trans.type.padEnd(7)} | ${(product?.name || "Removed").padEnd(15)} | ${trans.quantity} units | ${value}`);
        }
        console.log("====================\n");
    }
}

module.exports = InventoryManagement;