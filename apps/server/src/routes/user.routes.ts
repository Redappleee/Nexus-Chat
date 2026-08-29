import { Router } from 'express';
import * as user from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/search', user.searchUsers);
router.get('/friends/requests', user.listFriendRequests);
router.post('/friends/request', user.sendFriendRequest);
router.patch('/friends/requests/:id', user.respondFriendRequest);

export default router;
