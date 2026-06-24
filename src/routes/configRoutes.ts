import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/ConfigController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getConfig);
router.put('/', requireAuth, updateConfig);

export default router;
