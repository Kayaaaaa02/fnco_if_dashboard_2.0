import express from 'express';
import {
  getOptimizations,
  generateOptimizations,
  applyOptimization,
} from '../controllers/optimizationController.js';

const router = express.Router({ mergeParams: true });

// 최적화 추천 목록 조회
// GET /api/v2/campaigns/:id/optimization
router.get('/', getOptimizations);

// 최적화 추천 생성 (Mock AI)
// POST /api/v2/campaigns/:id/optimization/generate
router.post('/generate', generateOptimizations);

// 최적화 적용/무시
// PATCH /api/v2/campaigns/:id/optimization/:actionId
router.patch('/:actionId', applyOptimization);

export default router;
