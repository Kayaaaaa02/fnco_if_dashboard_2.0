import express from 'express';
import { getAlignment, runAlignment } from '../controllers/alignmentController.js';

const router = express.Router({ mergeParams: true });

// GET /api/v2/campaigns/:id/alignment
router.get('/', getAlignment);

// POST /api/v2/campaigns/:id/alignment/run
router.post('/run', runAlignment);

export default router;
