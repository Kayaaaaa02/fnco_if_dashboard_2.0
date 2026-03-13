import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getCampaigns,
    getCampaignById,
    getCampaignHub,
    createCampaign,
    updateCampaign,
    archiveCampaign,
} from '../controllers/campaignController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 제품 파일 업로드 설정
const productStorage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads/products'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
    },
});
const uploadProduct = multer({
    storage: productStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.ppt', '.pptx'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    },
});

const router = express.Router();

// 캠페인 목록 조회
// GET /api/campaign?status=draft&brand_cd=xxx&country=KR
router.get('/', getCampaigns);

// 캠페인 단건 조회
// GET /api/campaign/:id
router.get('/:id', getCampaignById);

// 캠페인 허브 조회 (캠페인 + 페이즈별 요약)
// GET /api/campaign/:id/hub
router.get('/:id/hub', getCampaignHub);

// 캠페인 생성 (제품 파일 업로드 지원)
// POST /api/campaign
router.post('/', uploadProduct.single('productFile'), createCampaign);

// 캠페인 업데이트
// PUT /api/campaign/:id
router.put('/:id', updateCampaign);

// 캠페인 아카이브 (소프트 삭제)
// DELETE /api/campaign/:id
router.delete('/:id', archiveCampaign);

export default router;
