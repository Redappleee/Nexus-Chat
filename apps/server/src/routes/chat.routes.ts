import { Router } from 'express';
import multer from 'multer';
import * as chat from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createDirectChatSchema, createGroupSchema, sendMessageSchema } from '../validators/chat.validator';

const upload = multer({ dest: 'tmp/uploads/' });
const router = Router();

router.use(authenticate);

router.get('/', chat.listChats);
router.get('/archived', chat.listArchived);
router.get('/search/messages', chat.searchMessages);
router.post('/direct', validateBody(createDirectChatSchema), chat.createDirect);
router.post('/group', validateBody(createGroupSchema), chat.createGroup);
router.post('/messages', validateBody(sendMessageSchema), chat.sendMessage);
router.post('/upload', upload.single('file'), chat.uploadMedia);
router.patch('/messages/:messageId', chat.editMessage);
router.delete('/messages/:messageId', chat.deleteMessage);
router.post('/messages/:messageId/react', chat.reactMessage);
router.post('/:chatId/pin', chat.pinChat);
router.post('/:chatId/unpin', chat.unpinChat);
router.post('/:chatId/archive', chat.archiveChat);
router.post('/:chatId/unarchive', chat.unarchiveChat);
router.get('/:chatId/messages', chat.getMessages);

export default router;
