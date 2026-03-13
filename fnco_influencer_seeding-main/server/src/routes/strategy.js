import express from 'express';
import {
    getStrategy,
    getStrategyHistory,
    generateStrategy,
    updateStrategy,
    approveStrategy,
} from '../controllers/strategyController.js';

const router = express.Router({ mergeParams: true });

// 전략 최신 버전 조회
// GET /api/v2/campaigns/:id/strategy
router.get('/', getStrategy);

// 전략 히스토리 조회
// GET /api/v2/campaigns/:id/strategy/history
router.get('/history', getStrategyHistory);

// 전략 AI 생성
// POST /api/v2/campaigns/:id/strategy/generate
router.post('/generate', generateStrategy);

// 전략 업데이트
// PUT /api/v2/campaigns/:id/strategy
router.put('/', updateStrategy);

// 전략 승인
// POST /api/v2/campaigns/:id/strategy/approve
router.post('/approve', approveStrategy);

export default router;
