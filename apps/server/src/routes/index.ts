import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';
import adminRoutes from './admin.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

export default router;
