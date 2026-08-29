import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireRole('admin', 'moderator'));

router.get('/dashboard', admin.dashboard);
router.get('/users', admin.listUsers);
router.post('/users/:userId/ban', admin.banUser);
router.get('/reports', admin.listReports);

export default router;
