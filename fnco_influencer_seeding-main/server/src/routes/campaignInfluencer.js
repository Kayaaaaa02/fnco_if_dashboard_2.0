import express from 'express';
import {
    getCampaignInfluencers,
    matchInfluencers,
    updateInfluencerStatus,
    deepAnalyzeInfluencer,
    bulkUpdateInfluencers,
} from '../controllers/campaignInfluencerController.js';

const router = express.Router({ mergeParams: true });

// 캠페인 인플루언서 매칭 목록 조회
// GET /api/v2/campaigns/:id/influencers
router.get('/', getCampaignInfluencers);

// 인플루언서 매칭 실행 (MOCK AI)
// POST /api/v2/campaigns/:id/influencers/match
router.post('/match', matchInfluencers);

// 대량 인플루언서 상태 업데이트
// PATCH /api/v2/campaigns/:id/influencers/bulk
router.patch('/bulk', bulkUpdateInfluencers);

// 인플루언서 상태 업데이트
// PATCH /api/v2/campaigns/:id/influencers/:profileId
router.patch('/:profileId', updateInfluencerStatus);

// 인플루언서 딥 분석 (MOCK AI)
// POST /api/v2/campaigns/:id/influencers/:profileId/deep-analysis
router.post('/:profileId/deep-analysis', deepAnalyzeInfluencer);

export default router;
