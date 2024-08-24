import cors from 'cors';
import express from 'express';
import { WebSocketServer } from 'ws';
import { Repo } from "@automerge/automerge-repo";
import * as Automerge from "@automerge/automerge";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const server = app.listen(8080, () => {
    console.log(`Server is running on http://localhost:8080`);
});

// WebSocket server setup
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});

const storagePath = path.join(__dirname, 'data');
const repo = new Repo({
    network: [new NodeWSServerAdapter(wss)],
    storage: new NodeFSStorageAdapter(storagePath),
});

wss.on('connection', (ws) => {
    console.log('Client connected.');

    ws.on('message', (message) => {
        console.log('Received:', message);
        // Broadcast the message to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
    });
});
