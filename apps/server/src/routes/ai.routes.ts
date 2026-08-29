import { Router } from 'express';
import * as ai from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/smart-replies', ai.smartReplies);
router.post('/translate', ai.translate);
router.post('/assistant', ai.assistant);

export default router;
