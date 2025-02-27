const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.inventory = null;

    // Get all products
    router.get('/products', async (req, res) => {
        try {
            const products = await router.inventory.db.all(`SELECT * FROM products`);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add a product
    router.post('/products', async (req, res) => {
        try {
            const { id, name, price, quantity, category, country } = req.body;
            await router.inventory.addProduct(id, name, price, quantity, category, country);
            res.status(201).json({ message: 'Product added successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Edit a product
    router.put('/products/:id', async (req, res) => {
        try {
            const { name, price, quantity, category, country } = req.body;
            await router.inventory.editProduct(req.params.id, name, price, quantity, category, country);
            res.json({ message: 'Product updated successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Remove a product
    router.delete('/products/:id', async (req, res) => {
        try {
            await router.inventory.removeProduct(req.params.id);
            res.json({ message: 'Product removed successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Update product quantity
    router.put('/products/:id/quantity', async (req, res) => {
        try {
            const { quantityChange } = req.body;
            await router.inventory.updateQuantity(req.params.id, quantityChange);
            res.json({ message: 'Quantity updated successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Search products
    router.get('/products/search', async (req, res) => {
        try {
            const { query } = req.query;
            const results = await router.inventory.searchProducts(query);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get products by category
    router.get('/products/category/:category', async (req, res) => {
        try {
            const results = await router.inventory.getProductsByCategory(req.params.category);
            res.json(results);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Get total inventory value
    router.get('/total-value', async (req, res) => {
        try {
            const total = await router.inventory.getTotalValue();
            res.json({ total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Export inventory to CSV
    router.get('/export', async (req, res) => {
        try {
            const csv = await router.inventory.exportToCSV();
            res.header('Content-Type', 'text/csv');
            res.attachment('inventory.csv');
            res.send(csv);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get transaction history
    router.get('/transactions', async (req, res) => {
        try {
            const transactions = await router.inventory.db.all(`SELECT * FROM transactions`);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};