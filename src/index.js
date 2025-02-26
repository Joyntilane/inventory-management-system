const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const Database = require('./database/db');
const Schema = require('./database/schema');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

async function startServer() {
    try {
        const db = new Database();
        const schema = new Schema(db);
        schema.initialize();

        const inventoryRouter = inventoryRoutes(db);
        app.use('/api', inventoryRouter);

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