import { Router } from 'express';
import { generateVideo, generateVideoPrompt, generateStep, mergeVideo, getVideoStatus, serveVideo } from '../controllers/videoController.js';

const router = Router();

// Kling AI 영상 생성 — 전체 (레거시)
router.post('/generate', generateVideo);

// 시나리오 한글 → 영어 영상 프롬프트 변환 (Gemini)
router.post('/generate-video-prompt', generateVideoPrompt);

// 단일 STEP I2V 생성
router.post('/generate-step', generateStep);

// 승인된 STEP 영상들 최종 합성 (나레이션 + concat)
router.post('/merge', mergeVideo);

// Kling 영상 생성 상태 조회 (폴링용)
router.get('/status/:taskId', getVideoStatus);

// 생성된 영상 파일 서빙
router.get('/serve/:filename', serveVideo);

export default router;
