import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_drop_coordination (
    drop_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    arc_phase VARCHAR(20),
    drop_type VARCHAR(30) NOT NULL,
    profile_id INTEGER,
    creative_id INTEGER,
    platform VARCHAR(50),
    scheduled_at TIMESTAMP,
    reminder_at TIMESTAMP,
    reminder_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

let tableCreated = false;

async function ensureTable() {
  if (!tableCreated) {
    await pool.query(CREATE_TABLE);
    tableCreated = true;
  }
}

// 드랍 목록 조회
export const getDrops = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;
    const { phase, type } = req.query;

    let query = 'SELECT * FROM fnco_influencer.dw_drop_coordination WHERE campaign_id = $1';
    const params = [campaignId];
    let paramIdx = 2;

    if (phase) {
      query += ` AND arc_phase = $${paramIdx}`;
      params.push(phase);
      paramIdx++;
    }
    if (type) {
      query += ` AND drop_type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    query += ' ORDER BY scheduled_at ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[getDrops]', error);
    res.status(500).json({ error: '드랍 목록 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// Mock 자동 스케줄 생성
export const generateDrops = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    // Delete existing drops for this campaign
    await pool.query(
      'DELETE FROM fnco_influencer.dw_drop_coordination WHERE campaign_id = $1',
      [campaignId]
    );

    // Get campaign's scheduled_start as D-Day reference
    let dDay;
    try {
      const campaignResult = await pool.query(
        'SELECT scheduled_start FROM mst_campaign WHERE campaign_id = $1',
        [campaignId]
      );
      if (campaignResult.rows.length > 0 && campaignResult.rows[0].scheduled_start) {
        dDay = new Date(campaignResult.rows[0].scheduled_start);
      }
    } catch (_) {
      // If campaign table doesn't have scheduled_start, use fallback
    }

    if (!dDay || isNaN(dDay.getTime())) {
      dDay = new Date();
      dDay.setDate(dDay.getDate() + 21);
    }

    // Helper: add days to date
    function addDays(date, days) {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    }

    // Helper: random int in range [min, max]
    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Helper: random item from array
    function pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // Helper: random time between 9:00 and 21:00
    function randomTime(date) {
      const d = new Date(date);
      d.setHours(randInt(9, 21), randInt(0, 59), 0, 0);
      return d;
    }

    const drops = [];

    // Phase definitions (채널별 전략 반영)
    const phases = [
      {
        name: 'tease',
        startOffset: -21,
        endOffset: -14,
        minDrops: 6,
        maxDrops: 8,
        types: [
          { type: 'influencer', weight: 6, platforms: ['tiktok', 'tiktok', 'tiktok', 'instagram'], notes: ['인플루언서 TikTok 티저 (동시 드랍)', '인플루언서 TikTok 힌트 영상 (동시 드랍)', '인플루언서 TikTok 미스터리 (동시 드랍)', '인플루언서 Instagram 스토리 티저'] },
          { type: 'brand', weight: 2, platforms: ['instagram', 'tiktok'], notes: ['브랜드 공식 티저 이미지', '브랜드 카운트다운 TikTok'] },
        ],
      },
      {
        name: 'reveal',
        startOffset: -7,
        endOffset: -3,
        minDrops: 5,
        maxDrops: 7,
        types: [
          { type: 'influencer', weight: 5, platforms: ['tiktok', 'tiktok', 'instagram', 'youtube'], notes: ['인플루언서 TikTok 제품 공개 (동시 드랍)', '인플루언서 TikTok 첫인상 (동시 드랍)', '인플루언서 Instagram Reels 공개', '인플루언서 YouTube 쇼츠 언박싱'] },
          { type: 'brand', weight: 2, platforms: ['instagram', 'youtube'], notes: ['브랜드 공식 공개 Reels', '브랜드 YouTube 비하인드'] },
        ],
      },
      {
        name: 'validate',
        startOffset: 0,
        endOffset: 3,
        minDrops: 8,
        maxDrops: 10,
        types: [
          { type: 'influencer', weight: 4, platforms: ['instagram', 'instagram', 'tiktok', 'youtube'], notes: ['인플루언서 Instagram Reels 리뷰', '인플루언서 Instagram Reels 후기', '인플루언서 TikTok 솔직 후기', '인플루언서 YouTube 비교 리뷰'] },
          { type: 'brand', weight: 2, platforms: ['instagram', 'youtube'], notes: ['브랜드 공식 론칭 Reels', '브랜드 이벤트 공지'] },
          { type: 'ugc', weight: 4, platforms: ['instagram', 'instagram', 'tiktok'], notes: ['사용자 Instagram Reels 후기', 'UGC Instagram 챌린지', '고객 TikTok 언박싱'] },
        ],
      },
      {
        name: 'amplify',
        startOffset: 7,
        endOffset: 30,
        minDrops: 5,
        maxDrops: 7,
        types: [
          { type: 'ad', weight: 4, platforms: ['instagram', 'tiktok', 'youtube'], notes: ['Instagram 퍼포먼스 광고 A/B', 'TikTok 리타겟팅 광고', 'YouTube 전환 최적화 광고'] },
          { type: 'ugc', weight: 2, platforms: ['instagram', 'tiktok'], notes: ['UGC 리포스트', 'UGC 베스트 모음'] },
          { type: 'brand', weight: 3, platforms: ['youtube', 'youtube', 'blog'], notes: ['YouTube 심층 리뷰 (SEO 최적화)', 'YouTube 성과 리캡 영상', '블로그 성분 분석 포스트'] },
        ],
      },
    ];

    for (const phase of phases) {
      const dropCount = randInt(phase.minDrops, phase.maxDrops);
      const totalWeight = phase.types.reduce((sum, t) => sum + t.weight, 0);

      for (let i = 0; i < dropCount; i++) {
        // Weighted random type selection
        let r = Math.random() * totalWeight;
        let selectedType = phase.types[0];
        for (const t of phase.types) {
          r -= t.weight;
          if (r <= 0) {
            selectedType = t;
            break;
          }
        }

        const dayOffset = randInt(phase.startOffset, phase.endOffset);
        const scheduledAt = randomTime(addDays(dDay, dayOffset));
        const reminderAt = new Date(scheduledAt);
        reminderAt.setHours(reminderAt.getHours() - 24);

        drops.push({
          campaign_id: campaignId,
          arc_phase: phase.name,
          drop_type: selectedType.type,
          platform: pick(selectedType.platforms),
          scheduled_at: scheduledAt.toISOString(),
          reminder_at: reminderAt.toISOString(),
          notes: pick(selectedType.notes),
          status: 'draft',
        });
      }
    }

    // Sort by scheduled_at
    drops.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    // Bulk insert
    const insertQuery = `
      INSERT INTO fnco_influencer.dw_drop_coordination
        (campaign_id, arc_phase, drop_type, platform, scheduled_at, reminder_at, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const insertedDrops = [];
    for (const drop of drops) {
      const result = await pool.query(insertQuery, [
        drop.campaign_id,
        drop.arc_phase,
        drop.drop_type,
        drop.platform,
        drop.scheduled_at,
        drop.reminder_at,
        drop.notes,
        drop.status,
      ]);
      insertedDrops.push(result.rows[0]);
    }

    res.json({
      success: true,
      data: insertedDrops,
      count: insertedDrops.length,
      message: `${insertedDrops.length}개의 동시 드랍 스케줄이 생성되었습니다.`,
    });
  } catch (error) {
    console.error('[generateDrops]', error);
    res.status(500).json({ error: '드랍 스케줄 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// 단일 드랍 수정
export const updateDrop = async (req, res) => {
  try {
    await ensureTable();
    const { dropId } = req.params;
    const updates = req.body;

    if (!dropId) {
      return res.status(400).json({ error: '드랍 ID가 필요합니다.' });
    }

    // Build dynamic SET clause
    const allowedFields = ['arc_phase', 'drop_type', 'profile_id', 'creative_id', 'platform', 'scheduled_at', 'reminder_at', 'reminder_sent', 'notes', 'status'];
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIdx}`);
        values.push(updates[field]);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: '수정할 필드가 없습니다.' });
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(dropId);

    const query = `
      UPDATE fnco_influencer.dw_drop_coordination
      SET ${setClauses.join(', ')}
      WHERE drop_id = $${paramIdx}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 드랍을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[updateDrop]', error);
    res.status(500).json({ error: '드랍 수정 중 오류가 발생했습니다.', details: error.message });
  }
};

// Mock 리마인더 발송
export const sendReminders = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_drop_coordination
       SET reminder_sent = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $1
         AND reminder_sent = FALSE
         AND reminder_at <= NOW()
       RETURNING *`,
      [campaignId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: `${result.rows.length}건의 리마인더가 발송되었습니다.`,
    });
  } catch (error) {
    console.error('[sendReminders]', error);
    res.status(500).json({ error: '리마인더 발송 중 오류가 발생했습니다.', details: error.message });
  }
};
