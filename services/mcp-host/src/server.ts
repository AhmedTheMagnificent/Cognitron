import express, { Request, Response } from 'express';
import http from 'http';
import WebSocket from 'ws';
import 'dotenv/config';

import sequelize from './config/database';
import { processEvent } from './protocol/engine';
import { json } from 'sequelize';
import { start } from 'repl';
import { resolve } from 'path';


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3003;


app.get('/', (req: Request, res: Response) => {
    res.status(200).send("MCP host is alive and running!");
});

wss.on('connection', (ws: WebSocket) => {
    console.log('[Server] A new client has connected.');
    ws.on('message', (message: string) => {
        console.log(`[Server] Received message: ${message}`);
        try {
            const event = JSON.parse(message);
            processEvent(event, ws);
        } catch (error) {
            console.error('[Server] Failed to parse message or process event:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format. Expected JSON.' }));
        }
    });

    ws.on('close', () => {
        console.log('[Server] A client has disconnected.');
    });

    ws.on('error', (error) => {
        console.error('[Server] WebSocket error:', error);
    });
});

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const startServer = async () => {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    let currentRetry = 0;
    while (currentRetry < maxRetries)
        try {
            await sequelize.authenticate();
            console.log('[Server] Database connection has been established successfully.');
            await sequelize.sync()
            console.log('[Server] Database models synced successfully.');
            server.listen(PORT, () => {
                console.log(`[Server] MCP Host (TypeScript) is listening on http://localhost:${PORT}`);
            });
            return;
        } catch (error) {
            currentRetry++;
            console.error('[Server] Unable to start server:', error);
            if (currentRetry >= maxRetries) {
                console.error("[Server] Maximum connection retries reached. Could not start server. Exiting.");
                process.exit(1);
            }
            console.log(`[Server] Retrying connection in ${retryDelay / 1000} seconds...`);
            await sleep(retryDelay);
        }
};

startServer();