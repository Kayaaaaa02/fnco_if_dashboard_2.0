import express from 'express';
import multer from 'multer';
import {
    getAllUGCContents,
    // getUGCContentById,
    createUGCContent,
    updateUGCContent,
    deleteUGCContent,
    createSeedingContent,
    getAllSeedingContents,
    updateSeedingContent,
    deleteSeedingContent,
    getAllPreviewContents,
    createPreviewContentBulk,
    createPreviewContentIndividual,
    uploadVideoMiddleware,
    updatePreviewContent,
    deletePreviewContent,
    getAllPerformanceContents,
    checkPostExistsInPerformance,
    logPerformanceContentDetection,
    getUGCCategoryInsights,
} from '../controllers/contentsController.js';
import { getAllVideoAnalysisResults, getVideoAnalysisStatuses } from '../controllers/videoAnalysisController.js';
const router = express.Router();

// // 시딩 콘텐츠
// 시딩 콘텐츠 조회
router.get('/seeding', getAllSeedingContents);
// 시딩 콘텐츠 등록
router.post('/seeding', createSeedingContent);
// 시딩 콘텐츠 수정
router.put('/seeding', updateSeedingContent);
// 시딩 콘텐츠 삭제
router.delete('/seeding', deleteSeedingContent);

// // UGC
// UGC 뷰티 카테고리별 인사이트 (mst_plan_issue_top_content)
router.get('/ugc/insights', getUGCCategoryInsights);
// UGC 콘텐츠 전체 조회
router.get('/ugc', getAllUGCContents);
// UGC 콘텐츠 등록
router.post('/ugc', createUGCContent);
// UGC 콘텐츠 수정
router.put('/ugc', updateUGCContent);
// UGC 콘텐츠 삭제
router.delete('/ugc', deleteUGCContent);

// // Preview 콘텐츠
// Preview 콘텐츠 조회
router.get('/preview', getAllPreviewContents);
// Preview 콘텐츠 등록 (일괄 업로드: 구글 드라이브 URL)
router.post('/preview/bulk', createPreviewContentBulk);
// Preview 콘텐츠 등록 (개별 등록: 동영상 파일 직접 업로드)
router.post(
    '/preview/individual',
    (req, res, next) => {
        uploadVideoMiddleware(req, res, (err) => {
            if (err) {
                console.error('[Multer 에러]', err);
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
    createPreviewContentIndividual
);
// Preview 콘텐츠 수정
router.put('/preview', updatePreviewContent);
// Preview 콘텐츠 삭제
router.delete('/preview', deletePreviewContent);

// // 성과 우수 콘텐츠 (read-only)
// 성과 우수 콘텐츠 조회
router.get('/performance', getAllPerformanceContents);
// post_id가 performance 뷰에 존재하는지 확인
// 단일 조회: /performance/check?post_id=abc123
// 다중 조회: /performance/check?post_ids=abc123,def456,ghi789
router.get('/performance/check', checkPostExistsInPerformance);
// 성과 우수 콘텐츠 감지 로그 전송 (서버로)
router.post('/performance/log', logPerformanceContentDetection);

// 영상 분석 결과 조회
router.get('/videoAnalysis', getAllVideoAnalysisResults);
// 여러 post_id의 영상 분석 상태 조회 (DB에서) - post_ids=id1,id2,id3
router.get('/videoAnalysis/statuses', getVideoAnalysisStatuses);
// 여러 post_id의 영상 분석 상태 조회 (POST - 대량 요청용)
router.post('/videoAnalysis/statuses', getVideoAnalysisStatuses);

export default router;
