import express from 'express';
import multer from 'multer';
import {
    generatePrompt,
    generateImage,
    updateImageSelected,
    getPlanAiImages,
    uploadPlanImage,
    servePlanImage,
} from '../controllers/aiImageController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// AI 프롬프트 생성 (현재 STEP 기준) — FastAPI로 프록시
// POST /api/ai-image/generate-prompt
// multipart: payload (JSON 문자열), images (선택, 제품 참고 이미지)
router.post(
    '/generate-prompt',
    upload.fields([
        { name: 'payload', maxCount: 1 },
        { name: 'images', maxCount: 10 },
    ]),
    generatePrompt
);

// AI 이미지 생성 (프롬프트 → Gemini → 이미지 URL 반환)
// POST /api/ai-image/generate-image
// multipart: payload (JSON 문자열), images (선택, 제품/모델 참고 이미지)
// 또는 JSON body: { prompt, step_number, num_images?, plan_doc_id?, created_by? }
router.post(
    '/generate-image',
    upload.fields([
        { name: 'payload', maxCount: 1 },
        { name: 'images', maxCount: 10 },
    ]),
    generateImage
);

// 생성된 이미지 클릭 시 선택/해제 → dw_plan_ai_image.is_selected 반영
// PATCH /api/ai-image/image/select
// body: { img_url, is_selected, plan_doc_id?, step? }
router.patch('/image/select', updateImageSelected);

// plan_doc_id별 STEP(1~4) 이미지 목록 (최종 검수 시나리오 이미지용)
// GET /api/ai-image/images?plan_doc_id=xxx
router.get('/images', getPlanAiImages);

// 시나리오 이미지 업로드 (파일 → 저장 → dw_plan_ai_image INSERT, is_selected=TRUE)
// POST /api/ai-image/upload  multipart: file, plan_doc_id, step, created_by?
router.post('/upload', upload.single('file'), uploadPlanImage);

// 업로드된 시나리오 이미지 파일 서빙
// GET /api/ai-image/serve/plan/:plan_doc_id/:filename
router.get('/serve/plan/:plan_doc_id/:filename', servePlanImage);

export default router;
