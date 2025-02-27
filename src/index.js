require('dotenv').config();
const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const Database = require('./database/db');
const Schema = require('./database/schema');
const inventoryRoutes = require('./routes/inventoryRoutes');
const User = require('./models/user');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'Fallback key'; // Fallback key

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

async function startServer() {
    try {
        const db = new Database();
        const schema = new Schema(db);
        schema.initialize();

        const userModel = new User(db);

        // Login endpoint
        app.post('/api/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                const { token, role, company } = await userModel.authenticate(username, password);
                res.json({ token, role, company });
            } catch (error) {
                res.status(401).json({ error: error.message });
            }
        });

        // Registration endpoint
        app.post('/api/register', async (req, res) => {
            try {
                const { username, password, role, companyDetails } = req.body;
                if (!username || !password || !role) throw new Error('Missing required fields');
                if (role !== 'admin' && role !== 'user') throw new Error('Invalid role');
                if (role === 'admin' && (!companyDetails || !companyDetails.name)) throw new Error('Company name required for admin');

                await userModel.createUser(username, password, role, role === 'admin' ? companyDetails : null);
                res.status(201).json({ message: 'User registered successfully' });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Middleware to verify JWT
        const authenticateJWT = (req, res, next) => {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'No token provided' });
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                req.user = decoded;
                next();
            } catch (error) {
                res.status(403).json({ error: 'Invalid token' });
            }
        };

        // Protect admin routes
        const inventoryRouter = inventoryRoutes(db);
        app.use('/api/admin', authenticateJWT, (req, res, next) => {
            if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
            next();
        }, inventoryRouter);

        // Serve login page as default
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/login.html'));
        });

        const PORT = 3000;
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Frontend available at http://localhost:${PORT}`);
        });

        const wss = new WebSocket.Server({ server });
        wss.on('connection', (ws) => {
            console.log('WebSocket client connected');
            ws.on('close', () => console.log('WebSocket client disconnected'));
        });

        function broadcastUpdate(type, data) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type, data }));
                }
            });
        }

        const InventoryManagement = require('./models/inventory');
        const inventory = new InventoryManagement(db, broadcastUpdate);
        inventoryRouter.inventory = inventory;

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

startServer();