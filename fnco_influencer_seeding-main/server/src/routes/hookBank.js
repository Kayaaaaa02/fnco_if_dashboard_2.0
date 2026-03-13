import express from 'express';
import {
  getHooks,
  generateHooks,
  updateHook,
  deleteHook,
} from '../controllers/hookBankController.js';

const router = express.Router({ mergeParams: true });

// 훅 목록 조회 (캠페인별)
// GET /api/v2/campaigns/:id/hook-bank?phase=tease&type=headline
router.get('/', getHooks);

// AI 훅 생성 (mock)
// POST /api/v2/campaigns/:id/hook-bank/generate
router.post('/generate', generateHooks);

// 훅 단건 수정
// PUT /api/v2/campaigns/:id/hook-bank/:hookId
router.put('/:hookId', updateHook);

// 훅 단건 삭제
// DELETE /api/v2/campaigns/:id/hook-bank/:hookId
router.delete('/:hookId', deleteHook);

export default router;
