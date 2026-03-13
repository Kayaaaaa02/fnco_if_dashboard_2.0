import express from 'express';
import {
    analyzeInfluencerProfiles,
    getInfluencerCountSelected,
    getPartneredCount,
    getInfluencerListSelected,
    getInfluencerListByUrls,
    markInfluencersSelected,
    unmarkInfluencersSelected,
    deepAnalysisInfluencer,
    getPlanReels,
} from '../controllers/influencerController.js';

const router = express.Router();

// 인플루언서 수 조회 (is_selected = true)
// GET /api/influencer/count
router.get('/count', getInfluencerCountSelected);

// 바닐라코 협업 인플루언서 수 조회
// GET /api/influencer/partnered-count
router.get('/partnered-count', getPartneredCount);

// 인플루언서 리스트 조회 (is_selected = true)
// GET /api/influencer/list
router.get('/list', getInfluencerListSelected);

// 인플루언서 리스트 조회 (엑셀 업로드 URL 기준)
// POST /api/influencer/list-by-urls
router.post('/list-by-urls', getInfluencerListByUrls);

// 선택한 인플루언서 저장 (is_selected = true, updated_at, updated_by)
// POST /api/influencer/mark-selected
router.post('/mark-selected', markInfluencersSelected);

// 선택한 인플루언서 저장 해제 (is_selected = false)
// POST /api/influencer/unmark-selected
router.post('/unmark-selected', unmarkInfluencersSelected);

// 해당 계정 AI 심층 분석
// POST /api/influencer/deep-analysis
router.post('/deep-analysis', deepAnalysisInfluencer);

// 인플루언서 프로필 분석
// POST /api/influencer/analyze
router.post('/analyze', analyzeInfluencerProfiles);

// 제품 기획안 조회 (AI 추천 기획안용)
// GET /api/influencer/plan-reels/:planDocId
router.get('/plan-reels/:planDocId', getPlanReels);

export default router;
