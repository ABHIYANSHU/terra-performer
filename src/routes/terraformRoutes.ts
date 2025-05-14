import { Router } from 'express';
import { applyTerraform } from '../controllers/terraformController';

const router = Router();

// Route to handle terraform apply
router.post('/terraform/apply', applyTerraform);

export default router;