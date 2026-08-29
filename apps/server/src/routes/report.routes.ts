import { Router } from 'express';
import * as report from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/', report.createReport);

export default router;
