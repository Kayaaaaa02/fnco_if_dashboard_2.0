import { pool } from '../config/database.js';

export async function getAuditLog(req, res) {
  try {
    const campaignId = req.params.id;
    const { limit = 50, offset = 0, entity_type } = req.query;

    let query = `SELECT * FROM dw_audit_log WHERE campaign_id = $1`;
    const params = [campaignId];
    let paramIdx = 2;

    if (entity_type) {
      query += ` AND entity_type = $${paramIdx}`;
      params.push(entity_type);
      paramIdx++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('[AuditLog] Query failed:', error);
    res.status(500).json({ error: error.message });
  }
}
