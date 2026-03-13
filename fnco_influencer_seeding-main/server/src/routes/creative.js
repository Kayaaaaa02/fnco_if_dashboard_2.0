import express from 'express';
import {
    getCreatives,
    getCreativeById,
    generateCreatives,
    updateCreative,
    generateImages,
    selectImages,
    generateGuide,
} from '../controllers/creativeController.js';

const router = express.Router({ mergeParams: true });

// 캠페인별 크리에이티브 목록 조회
// GET /api/v2/campaigns/:id/creatives
router.get('/', getCreatives);

// 크리에이티브 단건 조회
// GET /api/v2/campaigns/:id/creatives/:cId
router.get('/:cId', getCreativeById);

// AI 크리에이티브 생성 (MOCK)
// POST /api/v2/campaigns/:id/creatives/generate
router.post('/generate', generateCreatives);

// 크리에이티브 업데이트
// PUT /api/v2/campaigns/:id/creatives/:cId
router.put('/:cId', updateCreative);

// Gemini 기반 최종 기획안 생성
// POST /api/v2/campaigns/:id/creatives/:cId/guide/generate
router.post('/:cId/guide/generate', generateGuide);

// AI 이미지 생성 (MOCK)
// POST /api/v2/campaigns/:id/creatives/:cId/images/generate
router.post('/:cId/images/generate', generateImages);

// 이미지 선택
// PATCH /api/v2/campaigns/:id/creatives/:cId/images/select
router.patch('/:cId/images/select', selectImages);

export default router;
