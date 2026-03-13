import { Router } from 'express';
import { getAuditLog } from '../controllers/auditController.js';

const router = Router({ mergeParams: true });

router.get('/', getAuditLog);

export default router;
