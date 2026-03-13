import express from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  createCampaignFromTemplate,
  deleteTemplate,
} from '../controllers/templateController.js';

const router = express.Router();

// 템플릿 목록 조회
// GET /api/v2/templates?category=뷰티
router.get('/', getTemplates);

// 템플릿 단건 조회
// GET /api/v2/templates/:id
router.get('/:id', getTemplate);

// 템플릿 생성
// POST /api/v2/templates
router.post('/', createTemplate);

// 템플릿으로 캠페인 생성
// POST /api/v2/templates/:id/create-campaign
router.post('/:id/create-campaign', createCampaignFromTemplate);

// 템플릿 삭제
// DELETE /api/v2/templates/:id
router.delete('/:id', deleteTemplate);

export default router;
