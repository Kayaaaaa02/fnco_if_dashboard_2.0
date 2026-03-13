import express from 'express';
import {
    getCalendar,
    generateCalendar,
    updateCalendarItem,
} from '../controllers/calendarController.js';

const router = express.Router({ mergeParams: true });

// 콘텐츠 캘린더 전체 조회
// GET /api/v2/campaigns/:id/calendar
router.get('/', getCalendar);

// 콘텐츠 캘린더 AI 생성
// POST /api/v2/campaigns/:id/calendar/generate
router.post('/generate', generateCalendar);

// 캘린더 아이템 단건 업데이트
// PUT /api/v2/campaigns/:id/calendar/:calId
router.put('/:calId', updateCalendarItem);

export default router;
