import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import messageRoutes from './routes/messageRoutes';
import keysRoutes from './routes/keysRoutes';
import terraformRoutes from './routes/terraformRoutes';
import { initSocketIO } from './services/socketService';

// Initialize express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize socket.io
initSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/api', messageRoutes);
app.use('/api', keysRoutes);
app.use('/api', terraformRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Example client route
app.get('/terraform-client', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'socket-client-example.html'));
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Socket.IO server initialized`);
  console.log(`Example client available at: http://localhost:${config.port}/terraform-client`);
});