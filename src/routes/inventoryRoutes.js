const express = require('express');
const router = express.Router();

module.exports = (db, upload) => {
    router.inventory = null;

    router.get('/all-products', async (req, res) => {
        console.log('Received request for /api/user/all-products');
        try {
            if (!router.inventory) {
                throw new Error('Inventory model not initialized');
            }
            const products = await router.inventory.getAllProductsForUsers();
            res.json(products);
        } catch (error) {
            console.error('Error in /all-products:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/products', async (req, res) => {
        try {
            const products = await router.inventory.getProductsForCompany(req.user.companyId);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/products', upload.single('photo'), async (req, res) => {
        try {
            const { name, price, quantity, category, country, shortDescription = '' } = req.body;
            const photoPath = req.file ? `/uploads/${req.file.filename}` : '';
            const product = await router.inventory.createProduct(name, parseFloat(price), parseInt(quantity, 10), category, country, req.user.companyId, shortDescription, photoPath);
            res.status(201).json(product);
        } catch (error) {
            console.error('Error creating product:', error.message);
            res.status(400).json({ error: error.message });
        }
    });

    router.post('/feedback', async (req, res) => {
        try {
            const { productId, rating, comment = '' } = req.body;
            const userId = req.user.id;
            if (!productId || !rating) throw new Error('Product ID and rating are required');
            const feedback = await router.inventory.createFeedback(productId, userId, parseInt(rating, 10), comment);
            res.status(201).json(feedback);
        } catch (error) {
            console.error('Error creating feedback:', error.message);
            res.status(400).json({ error: error.message });
        }
    });

    router.get('/admin/feedback', async (req, res) => {
        try {
            const feedback = await router.inventory.getFeedbackForCompany(req.user.companyId);
            res.json(feedback);
        } catch (error) {
            console.error('Error fetching feedback:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/feedback/history', async (req, res) => {
        try {
            const feedback = await router.inventory.getFeedbackByUser(req.user.id);
            res.json(feedback);
        } catch (error) {
            console.error('Error fetching feedback history:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/feedback/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            const userId = req.user.id;
            const feedback = await router.inventory.updateFeedback(id, userId, parseInt(rating, 10), comment);
            res.json(feedback);
        } catch (error) {
            console.error('Error updating feedback:', error.message);
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/feedback/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            await router.inventory.deleteFeedback(id, userId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting feedback:', error.message);
            res.status(400).json({ error: error.message });
        }
    });

    router.get('/admin/analytics', async (req, res) => {
        try {
            const analytics = await router.inventory.getReviewAnalytics(req.user.companyId);
            res.json(analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};