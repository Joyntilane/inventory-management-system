const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.inventory = null;

    router.get('/products', async (req, res) => {
        try {
            // CHANGE: Filter products by req.user.companyId
            const products = await router.inventory.getProductsForCompany(req.user.companyId);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/products', async (req, res) => {
        try {
            const { id, name, price, quantity, category, country } = req.body;
            // CHANGE: Pass req.user.companyId to addProduct
            await router.inventory.addProduct(id, name, price, quantity, category, country, req.user.companyId);
            res.status(201).json({ message: 'Product added successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.put('/products/:id', async (req, res) => {
        try {
            const { name, price, quantity, category, country } = req.body;
            // CHANGE: Pass req.user.companyId to editProduct
            await router.inventory.editProduct(req.params.id, name, price, quantity, category, country, req.user.companyId);
            res.json({ message: 'Product updated successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/products/:id', async (req, res) => {
        try {
            // CHANGE: Pass req.user.companyId to removeProduct
            await router.inventory.removeProduct(req.params.id, req.user.companyId);
            res.json({ message: 'Product removed successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.put('/products/:id/quantity', async (req, res) => {
        try {
            const { quantityChange } = req.body;
            // CHANGE: Pass req.user.companyId to updateQuantity
            await router.inventory.updateQuantity(req.params.id, quantityChange, req.user.companyId);
            res.json({ message: 'Quantity updated successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.get('/products/search', async (req, res) => {
        try {
            const { query } = req.query;
            // CHANGE: Pass req.user.companyId to searchProducts
            const results = await router.inventory.searchProducts(query, req.user.companyId);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/products/category/:category', async (req, res) => {
        try {
            // CHANGE: Pass req.user.companyId to getProductsByCategory
            const results = await router.inventory.getProductsByCategory(req.params.category, req.user.companyId);
            res.json(results);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.get('/total-value', async (req, res) => {
        try {
            // CHANGE: Pass req.user.companyId to getTotalValue
            const total = await router.inventory.getTotalValue(req.user.companyId);
            res.json({ total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/export', async (req, res) => {
        try {
            // CHANGE: Pass req.user.companyId to exportToCSV
            const csv = await router.inventory.exportToCSV(req.user.companyId);
            res.header('Content-Type', 'text/csv');
            res.attachment('inventory.csv');
            res.send(csv);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/transactions', async (req, res) => {
        try {
            // CHANGE: Pass req.user.companyId to getTransactionsForCompany
            const transactions = await router.inventory.getTransactionsForCompany(req.user.companyId);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};