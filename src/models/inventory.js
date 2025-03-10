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

    async createProduct(name, price, quantity, category, country, companyId, shortDescription = '', photoPath = '') {
        validateName(name);
        validatePrice(price);
        validateQuantity(quantity);
        validateCategory(category);
        validateCountry(country);

        const stmt = this.db.prepare(`
            INSERT INTO products (name, price, quantity, category, country, companyId, short_description, photo_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(name, price, quantity, category, country, companyId, shortDescription, photoPath);
        const product = {
            id: info.lastInsertRowid,
            name,
            price,
            quantity,
            category,
            country,
            companyId,
            short_description: shortDescription,
            photo_path: photoPath
        };
        this.broadcastUpdate('productAdded', product);
        return product;
    }

    async getAllProductsForUsers() {
        return await this.db.all(`
            SELECT p.id, p.name, p.price, p.category, p.country, p.short_description, p.photo_path,
                   COALESCE(AVG(f.rating), 0) as average_rating, COUNT(f.id) as feedback_count
            FROM products p
            LEFT JOIN feedback f ON p.id = f.productId
            GROUP BY p.id, p.name, p.price, p.category, p.country, p.short_description, p.photo_path
        `);
    }

    async getProductsForCompany(companyId) {
        return await this.db.all(`
            SELECT id, name, price, quantity, category, country, short_description, photo_path
            FROM products
            WHERE companyId = ?
        `, [companyId]);
    }

    async updateQuantity(productId, quantityChange, type) {
        validateId(productId);
        validateQuantityChange(quantityChange);

        const product = this.db.prepare('SELECT quantity FROM products WHERE id = ?').get(productId);
        if (!product) throw new Error('Product not found');

        let newQuantity;
        if (type === 'add') {
            newQuantity = product.quantity + quantityChange;
        } else if (type === 'remove') {
            newQuantity = product.quantity - quantityChange;
            if (newQuantity < 0) throw new Error('Quantity cannot be negative');
        } else if (type === 'update') {
            newQuantity = quantityChange;
            if (newQuantity < 0) throw new Error('Quantity cannot be negative');
        } else {
            throw new Error('Invalid update type');
        }

        const stmt = this.db.prepare('UPDATE products SET quantity = ? WHERE id = ?');
        stmt.run(newQuantity, productId);

        const transactionStmt = this.db.prepare(`
            INSERT INTO transactions (productId, type, quantity, companyId)
            VALUES (?, ?, ?, ?)
        `);
        const productInfo = this.db.prepare('SELECT companyId FROM products WHERE id = ?').get(productId);
        transactionStmt.run(productId, type, quantityChange, productInfo.companyId);

        const updatedProduct = this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
        this.broadcastUpdate('productUpdated', updatedProduct);
        return updatedProduct;
    }

    async createFeedback(productId, userId, rating, comment = '') {
        if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
        const stmt = this.db.prepare(`
            INSERT INTO feedback (productId, userId, rating, comment)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(productId, userId, rating, comment);
        return { id: info.lastInsertRowid, productId, userId, rating, comment };
    }

    async getFeedbackForCompany(companyId) {
        return await this.db.all(`
            SELECT f.id, f.productId, f.userId, f.rating, f.comment, f.timestamp, p.name as product_name, u.username
            FROM feedback f
            JOIN products p ON f.productId = p.id
            JOIN users u ON f.userId = u.id
            WHERE p.companyId = ?
            ORDER BY f.timestamp DESC
        `, [companyId]);
    }

    async getFeedbackByUser(userId) {
        return await this.db.all(`
            SELECT f.id, f.productId, f.rating, f.comment, f.timestamp, p.name as product_name
            FROM feedback f
            JOIN products p ON f.productId = p.id
            WHERE f.userId = ?
            ORDER BY f.timestamp DESC
        `, [userId]);
    }

    async updateFeedback(feedbackId, userId, rating, comment) {
        if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
        const stmt = this.db.prepare(`
            UPDATE feedback
            SET rating = ?, comment = ?, timestamp = CURRENT_TIMESTAMP
            WHERE id = ? AND userId = ?
        `);
        const info = stmt.run(rating, comment, feedbackId, userId);
        if (info.changes === 0) throw new Error('Feedback not found or unauthorized');
        return { id: feedbackId, userId, rating, comment };
    }

    async deleteFeedback(feedbackId, userId) {
        const stmt = this.db.prepare(`
            DELETE FROM feedback
            WHERE id = ? AND userId = ?
        `);
        const info = stmt.run(feedbackId, userId);
        if (info.changes === 0) throw new Error('Feedback not found or unauthorized');
    }

    async getReviewAnalytics(companyId) {
        // Average rating per product
        const productAverages = await this.db.all(`
            SELECT p.id, p.name, COALESCE(AVG(f.rating), 0) as average_rating, COUNT(f.id) as feedback_count
            FROM products p
            LEFT JOIN feedback f ON p.id = f.productId
            WHERE p.companyId = ?
            GROUP BY p.id, p.name
        `, [companyId]);

        // Rating distribution (count of each rating: 1-5)
        const ratingDistribution = await this.db.all(`
            SELECT rating, COUNT(*) as count
            FROM feedback f
            JOIN products p ON f.productId = p.id
            WHERE p.companyId = ?
            GROUP BY rating
            ORDER BY rating
        `, [companyId]);

        // Feedback trend by month
        const feedbackTrends = await this.db.all(`
            SELECT strftime('%Y-%m', f.timestamp) as month, COUNT(*) as feedback_count
            FROM feedback f
            JOIN products p ON f.productId = p.id
            WHERE p.companyId = ?
            GROUP BY strftime('%Y-%m', f.timestamp)
            ORDER BY month
        `, [companyId]);

        return {
            productAverages,
            ratingDistribution,
            feedbackTrends
        };
    }
}

module.exports = InventoryManagement;