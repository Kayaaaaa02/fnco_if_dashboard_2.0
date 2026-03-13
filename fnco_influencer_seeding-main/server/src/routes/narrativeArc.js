import express from 'express';
import {
  getNarrativeArc,
  generateNarrativeArc,
  updateNarrativeArc,
} from '../controllers/narrativeArcController.js';

const router = express.Router({ mergeParams: true });

// 서사 아크 최신 버전 조회
// GET /api/v2/campaigns/:id/narrative-arc
router.get('/', getNarrativeArc);

// 서사 아크 AI 생성
// POST /api/v2/campaigns/:id/narrative-arc/generate
router.post('/generate', generateNarrativeArc);

// 서사 아크 업데이트
// PUT /api/v2/campaigns/:id/narrative-arc
router.put('/', updateNarrativeArc);

export default router;
