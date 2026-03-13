import express from 'express';
import multer from 'multer';
import {
    uploadProductPlan,
    upload,
    getPlanDocCount,
    getCompletedPlanDocCount,
    getUploadedPlanDocCount,
    getCompletedPlanDocCountSimple,
    getUploadedPlanDocList,
    getCompletedPlanDocList,
    getPlanDocAnalysis,
    getPlanProduct,
    getPlanIssueTopContent,
    modifyPlanDocument,
    getRefinedPlanData,
    updateRefinedPlanData,
    updateProductAnalyzedStatus,
    updateTargetPlatform,
    updateScheduledDates,
    unmarkPlanDocSelected,
} from '../controllers/aiPlanController.js';

const router = express.Router();

// 제품 기획안 파일 업로드
// POST /api/ai-plan/upload
router.post(
    '/upload',
    (req, res, next) => {
        // 요청 크기 체크 (프록시 서버에서 차단되기 전에 감지)
        const contentLength = req.headers['content-length'];
        if (contentLength) {
            const sizeInMB = parseInt(contentLength) / (1024 * 1024);
            if (sizeInMB > 500) {
                return res.status(413).json({
                    error: '파일 크기가 너무 큽니다.',
                    details: `요청 크기: ${sizeInMB.toFixed(2)}MB. 최대 500MB까지 업로드 가능합니다.`,
                    hint: '프록시 서버(nginx)의 client_max_body_size 설정을 확인하세요.',
                });
            }
        }

        upload.single('file')(req, res, (err) => {
            if (err) {
                console.error('[Multer 에러]', err);
                // Multer 에러 처리
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            error: '파일 크기가 너무 큽니다. 최대 500MB까지 업로드 가능합니다.',
                        });
                    }
                    return res.status(400).json({ error: `파일 업로드 오류: ${err.message}` });
                }
                return res.status(400).json({ error: err.message || '파일 업로드 중 오류가 발생했습니다.' });
            }
            next();
        });
    },
    uploadProductPlan
);

// 업로드된 제품 수 조회
// GET /api/ai-plan/count
router.get('/count', getPlanDocCount);

// 완료된 기획안 수 조회 (기존 공식)
// GET /api/ai-plan/count/completed
router.get('/count/completed', getCompletedPlanDocCount);

// 업로드 완료 기획안 건수 (KPI용)
// GET /api/ai-plan/count/uploaded
router.get('/count/uploaded', getUploadedPlanDocCount);

// 완료(status=compleate) 기획안 건수 - 단순 COUNT (KPI용)
// GET /api/ai-plan/count/completed-simple
router.get('/count/completed-simple', getCompletedPlanDocCountSimple);

// 업로드 완료 기획안 목록 (모달용)
// GET /api/ai-plan/list/uploaded
router.get('/list/uploaded', getUploadedPlanDocList);

// 완료된 기획안 목록 (최종 기획안 완료 건 모달용)
// GET /api/ai-plan/list/completed
router.get('/list/completed', getCompletedPlanDocList);

// plan_doc_id로 제품 분석 데이터 조회
// GET /api/ai-plan/analysis?plan_doc_id=xxx
router.get('/analysis', getPlanDocAnalysis);

// plan_doc_id로 생성 제품 정보 조회 (제품 카테고리 / 세부 카테고리 / 제품명)
// GET /api/ai-plan/plan-product?plan_doc_id=xxx
router.get('/plan-product', getPlanProduct);

// plan_doc_id와 platform으로 TOP 콘텐츠 조회
// GET /api/ai-plan/top-content?plan_doc_id=xxx&platform=youtube
router.get('/top-content', getPlanIssueTopContent);

// AI 기획안 수정을 위한 FastAPI 호출
// POST /api/ai-plan/modify
router.post('/modify', modifyPlanDocument);

// plan_doc_id로 refined 데이터 조회 (S3에서 parsed.json 읽기)
// GET /api/ai-plan/refined?plan_doc_id=xxx
router.get('/refined', getRefinedPlanData);

// Refined 기획안 데이터 업데이트 (수정된 데이터 S3에 저장 + DB 버전 업데이트)
// POST /api/ai-plan/update-refined
router.post('/update-refined', updateRefinedPlanData);

// AI 제품 분석 & 기획안 저장 완료 상태로 업데이트
// POST /api/ai-plan/update-product-analyzed
router.post('/update-product-analyzed', updateProductAnalyzedStatus);

// 타겟 플랫폼 업데이트
// POST /api/ai-plan/update-target-platform
router.post('/update-target-platform', updateTargetPlatform);

// 게시 기간 업데이트
// POST /api/ai-plan/update-scheduled-dates
router.post('/update-scheduled-dates', updateScheduledDates);

// 기획안 삭제 (is_selected를 false로 업데이트)
// POST /api/ai-plan/unmark-selected
router.post('/unmark-selected', unmarkPlanDocSelected);

export default router;
