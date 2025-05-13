import { Router } from 'express';
import { storeKeys } from '../controllers/keysController';

const router = Router();

// Route to handle AWS credentials
router.post('/keys', storeKeys);

export default router;