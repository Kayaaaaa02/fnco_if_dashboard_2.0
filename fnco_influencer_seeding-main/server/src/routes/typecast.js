import { Router } from 'express';
import { generateTTS, getActors } from '../controllers/typecastController.js';

const router = Router();

router.post('/generate', generateTTS);
router.get('/actors', getActors);

export default router;
