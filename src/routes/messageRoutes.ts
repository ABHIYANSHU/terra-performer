import { Router } from 'express';
import { processMessage } from '../controllers/messageController';

const router = Router();

// Route to handle incoming messages
router.post('/message', processMessage);

export default router;