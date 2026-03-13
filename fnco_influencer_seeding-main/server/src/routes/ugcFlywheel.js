import express from 'express';
import {
  getUGCContent,
  harvestUGC,
  updatePermission,
  updateAmplify,
  getCreators,
  convertCreator,
} from '../controllers/ugcFlywheelController.js';

const router = express.Router({ mergeParams: true });

// UGC 콘텐츠 목록 조회
// GET /api/v2/campaigns/:id/ugc-flywheel/content
router.get('/content', getUGCContent);

// UGC 수확 (Mock 데이터 생성)
// POST /api/v2/campaigns/:id/ugc-flywheel/content/harvest
router.post('/content/harvest', harvestUGC);

// 권한 상태 업데이트
// PATCH /api/v2/campaigns/:id/ugc-flywheel/content/:ugcId/permission
router.patch('/content/:ugcId/permission', updatePermission);

// 증폭 상태 업데이트
// PATCH /api/v2/campaigns/:id/ugc-flywheel/content/:ugcId/amplify
router.patch('/content/:ugcId/amplify', updateAmplify);

// 크리에이터 목록 조회
// GET /api/v2/campaigns/:id/ugc-flywheel/creators
router.get('/creators', getCreators);

// 크리에이터 인플루언서 전환
// POST /api/v2/campaigns/:id/ugc-flywheel/creators/:creatorId/convert
router.post('/creators/:creatorId/convert', convertCreator);

export default router;
