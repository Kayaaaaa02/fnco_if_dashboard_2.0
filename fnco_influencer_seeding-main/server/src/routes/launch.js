import express from 'express';
import {
    getLaunchSchedule,
    createSchedule,
    approveLaunch,
    executeLaunch,
} from '../controllers/launchController.js';

const router = express.Router({ mergeParams: true });

// 런칭 스케줄 전체 조회
// GET /api/v2/campaigns/:id/launch
router.get('/', getLaunchSchedule);

// 런칭 스케줄 자동 생성
// POST /api/v2/campaigns/:id/launch/schedule
router.post('/schedule', createSchedule);

// 런칭 스케줄 일괄 승인
// POST /api/v2/campaigns/:id/launch/approve
router.post('/approve', approveLaunch);

// 런칭 실행 (MOCK)
// POST /api/v2/campaigns/:id/launch/execute
router.post('/execute', executeLaunch);

export default router;
