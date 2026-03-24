import { Router } from 'express';
import { generateTTS, getActors, serveTTSAudio } from '../controllers/typecastController.js';

const router = Router();

router.post('/generate', generateTTS);
router.get('/actors', getActors);
router.get('/serve/:filename', serveTTSAudio);

export default router;
