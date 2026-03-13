import express from 'express';
import {
    getOutreach,
    generateOutreach,
    updateOutreach,
    sendOutreach,
} from '../controllers/outreachController.js';

const router = express.Router({ mergeParams: true });

// 아웃리치 목록 조회
// GET /api/v2/campaigns/:id/outreach
router.get('/', getOutreach);

// 아웃리치 브리프 생성 (MOCK AI)
// POST /api/v2/campaigns/:id/outreach/generate
router.post('/generate', generateOutreach);

// 아웃리치 업데이트
// PUT /api/v2/campaigns/:id/outreach/:oId
router.put('/:oId', updateOutreach);

// 아웃리치 발송 (MOCK)
// POST /api/v2/campaigns/:id/outreach/:oId/send
router.post('/:oId/send', sendOutreach);

export default router;
