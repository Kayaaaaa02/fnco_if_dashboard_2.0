import { pool } from '../config/database.js';

// Auto-create table if not exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dw_notification (
      notification_id BIGSERIAL PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL DEFAULT 'system',
      campaign_id VARCHAR(64),
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      link VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

let tableEnsured = false;

async function safeEnsure() {
  if (!tableEnsured) {
    await ensureTable();
    tableEnsured = true;
  }
}

export async function getNotifications(req, res) {
  try {
    await safeEnsure();
    const userId = req.query.user_id || 'system';
    const limit = parseInt(req.query.limit) || 30;

    const result = await pool.query(
      `SELECT * FROM dw_notification WHERE user_id = $1 OR user_id = 'all'
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );

    const unreadCount = await pool.query(
      `SELECT COUNT(*) FROM dw_notification
       WHERE (user_id = $1 OR user_id = 'all') AND is_read = FALSE`,
      [userId]
    );

    res.json({
      notifications: result.rows,
      unread_count: parseInt(unreadCount.rows[0].count),
    });
  } catch (error) {
    console.error('[Notification] Query failed:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    await safeEnsure();
    const { notification_id } = req.params;

    await pool.query(
      `UPDATE dw_notification SET is_read = TRUE WHERE notification_id = $1`,
      [notification_id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await safeEnsure();
    const userId = req.query.user_id || 'system';

    await pool.query(
      `UPDATE dw_notification SET is_read = TRUE WHERE user_id = $1 OR user_id = 'all'`,
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createNotification(req, res) {
  try {
    await safeEnsure();
    const { user_id = 'all', campaign_id, type, title, message, link } = req.body;

    const result = await pool.query(
      `INSERT INTO dw_notification (user_id, campaign_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, campaign_id, type, title, message, link]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
