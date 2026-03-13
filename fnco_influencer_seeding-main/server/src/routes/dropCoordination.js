import express from 'express';
import {
  getDrops,
  generateDrops,
  updateDrop,
  sendReminders,
} from '../controllers/dropCoordinationController.js';

const router = express.Router({ mergeParams: true });

// 드랍 목록 조회
// GET /api/v2/campaigns/:id/drops
router.get('/', getDrops);

// 동시 드랍 자동 생성
// POST /api/v2/campaigns/:id/drops/generate
router.post('/generate', generateDrops);

// 단일 드랍 수정
// PUT /api/v2/campaigns/:id/drops/:dropId
router.put('/:dropId', updateDrop);

// 리마인더 발송
// POST /api/v2/campaigns/:id/drops/send-reminders
router.post('/send-reminders', sendReminders);

export default router;
