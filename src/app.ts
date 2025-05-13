import express from 'express';
import cors from 'cors';
import { config } from './config';
import messageRoutes from './routes/messageRoutes';
import keysRoutes from './routes/keysRoutes';

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', messageRoutes);
app.use('/api', keysRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`API URL: ${config.apiUrl}`);
});