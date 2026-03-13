import express from 'express';
import { getSignals, detectSignals } from '../controllers/earlySignalController.js';

const router = express.Router({ mergeParams: true });

// 초기 신호 조회
// GET /api/v2/campaigns/:id/signals
router.get('/', getSignals);

// 초기 신호 감지 실행
// POST /api/v2/campaigns/:id/signals/detect
router.post('/detect', detectSignals);

export default router;
