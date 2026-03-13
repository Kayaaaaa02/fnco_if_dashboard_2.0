import express from 'express';
import {
    getPDA,
    generatePDA,
    runProductAnalysis,
    updatePersonas,
    updateDesires,
    updateConcepts,
    updateConceptStatuses,
    generateConcepts,
} from '../controllers/pdaController.js';

const router = express.Router({ mergeParams: true });

// P.D.A. 매트릭스 전체 조회
// GET /api/v2/campaigns/:id/pda
router.get('/', getPDA);

// P.D.A. AI 생성
// POST /api/v2/campaigns/:id/pda/generate
router.post('/generate', generatePDA);

// 제품 분석 단독 실행
// POST /api/v2/campaigns/:id/pda/analyze-product
router.post('/analyze-product', runProductAnalysis);

// 페르소나 일괄 업데이트
// PUT /api/v2/campaigns/:id/pda/personas
router.put('/personas', updatePersonas);

// 욕구 일괄 업데이트
// PUT /api/v2/campaigns/:id/pda/desires
router.put('/desires', updateDesires);

// 컨셉 일괄 업데이트
// PUT /api/v2/campaigns/:id/pda/concepts
router.put('/concepts', updateConcepts);

// 컨셉 상태 일괄 업데이트
// PATCH /api/v2/campaigns/:id/pda/concepts/status
router.patch('/concepts/status', updateConceptStatuses);

// 컨셉 AI 생성
// POST /api/v2/campaigns/:id/pda/concepts/generate
router.post('/concepts/generate', generateConcepts);

export default router;
