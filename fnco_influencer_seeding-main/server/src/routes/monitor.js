import express from 'express';
import {
    getMonitorDashboard,
    getPDAHeatmap,
    getFatigueReport,
    generateMockMetrics,
} from '../controllers/monitorController.js';

const router = express.Router({ mergeParams: true });

// 모니터링 대시보드 조회
// GET /api/v2/campaigns/:id/monitor
router.get('/', getMonitorDashboard);

// PDA 히트맵 조회
// GET /api/v2/campaigns/:id/monitor/pda-heatmap
router.get('/pda-heatmap', getPDAHeatmap);

// 피로도 리포트 조회
// GET /api/v2/campaigns/:id/monitor/fatigue
router.get('/fatigue', getFatigueReport);

// Mock 성과 지표 생성
// POST /api/v2/campaigns/:id/monitor/generate-mock
router.post('/generate-mock', generateMockMetrics);

export default router;
