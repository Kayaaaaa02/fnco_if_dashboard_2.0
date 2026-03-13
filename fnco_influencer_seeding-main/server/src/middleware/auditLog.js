import { pool } from '../config/database.js';

function extractEntityInfo(req) {
  const path = req.originalUrl;
  const parts = path.split('/').filter(Boolean);

  // /api/v2/campaigns/:id/pda -> entityType='pda'
  const campaignIdx = parts.indexOf('campaigns');
  const campaignId = campaignIdx >= 0 ? parts[campaignIdx + 1] : null;
  const entityType = campaignIdx >= 0 && parts.length > campaignIdx + 2 ? parts[campaignIdx + 2] : 'campaign';
  const entityId = parts.length > campaignIdx + 3 ? parts[campaignIdx + 3] : campaignId;

  return { campaignId, entityType, entityId: entityId || campaignId };
}

function getAction(method) {
  switch (method) {
    case 'POST': return 'create';
    case 'PUT': return 'update';
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return method.toLowerCase();
  }
}

export default function auditLog(req, res, next) {
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    return next();
  }

  // Only audit V2 campaign routes
  if (!req.originalUrl.startsWith('/api/v2/campaigns')) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Log after successful response
    if (res.statusCode < 400) {
      const { campaignId, entityType, entityId } = extractEntityInfo(req);
      let action = getAction(req.method);

      // Special actions from URL pattern
      if (req.originalUrl.includes('/approve')) action = 'approve';
      if (req.originalUrl.includes('/generate')) action = 'generate';
      if (req.originalUrl.includes('/send')) action = 'send';
      if (req.originalUrl.includes('/execute')) action = 'execute';

      // Async insert — don't block response
      pool.query(
        `INSERT INTO dw_audit_log (campaign_id, entity_type, entity_id, action, changes, user_id, user_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          campaignId,
          entityType,
          String(entityId || ''),
          action,
          JSON.stringify(req.body || {}),
          req.headers['x-user-id'] || 'system',
          req.headers['x-user-name'] || 'System',
        ]
      ).catch(err => console.error('[AuditLog] Insert failed:', err.message));
    }

    return originalJson(body);
  };

  next();
}
