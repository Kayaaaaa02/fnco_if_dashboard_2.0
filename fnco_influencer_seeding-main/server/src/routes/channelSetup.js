import express from 'express';
import {
  getChannelSetups,
  generateChannelSetup,
  updateChannelSetup,
  deleteChannelSetup,
} from '../controllers/channelSetupController.js';

const router = express.Router({ mergeParams: true });

// 채널 설정 목록 조회
// GET /api/v2/campaigns/:campaignId/channel-setup
router.get('/', getChannelSetups);

// AI 채널 자동 생성
// POST /api/v2/campaigns/:campaignId/channel-setup/generate
router.post('/generate', generateChannelSetup);

// 채널 설정 수정
// PUT /api/v2/campaigns/:campaignId/channel-setup/:setupId
router.put('/:setupId', updateChannelSetup);

// 채널 설정 삭제
// DELETE /api/v2/campaigns/:campaignId/channel-setup/:setupId
router.delete('/:setupId', deleteChannelSetup);

export default router;
