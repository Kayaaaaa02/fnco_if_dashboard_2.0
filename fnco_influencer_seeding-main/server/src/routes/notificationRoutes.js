import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, createNotification } from '../controllers/notificationController.js';

const router = Router();

router.get('/', getNotifications);
router.post('/', createNotification);
router.patch('/:notification_id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
