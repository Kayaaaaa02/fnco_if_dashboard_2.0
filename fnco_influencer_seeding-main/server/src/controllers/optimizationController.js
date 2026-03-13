import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_optimization_action (
    action_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    recommendation JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    applied_by VARCHAR(100),
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

let tableCreated = false;

async function ensureTable() {
  if (!tableCreated) {
    await pool.query(CREATE_TABLE);
    tableCreated = true;
  }
}

// 최적화 추천 목록 조회
export const getOptimizations = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_optimization_action WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[getOptimizations]', error);
    res.status(500).json({ error: '최적화 추천 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// 최적화 추천 생성 (Mock)
export const generateOptimizations = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    // 기존 pending 상태 삭제
    await pool.query(
      "DELETE FROM fnco_influencer.dw_optimization_action WHERE campaign_id = $1 AND status = 'pending'",
      [campaignId]
    );

    // 1. creative_rotation
    const creativeRotation = {
      replace: {
        creative_name: '밀착 커버 파운데이션 리뷰',
        reason: 'CTR 1.2% — 평균 대비 60% 낮음',
        current_ctr: 1.2,
      },
      with: {
        hook_text: '매일 아침 거울 보면서 한숨 쉰 적 있나요?',
        hook_type: 'headline',
        predicted_ctr: 3.8,
      },
      priority: 'high',
    };

    // 2. channel_rebalance
    const channelRebalance = {
      channels: [
        { channel: 'Instagram Reels', current_pct: 30, recommended_pct: 45, roi_score: 3.8, reason: 'ROAS 최고 채널' },
        { channel: 'YouTube Shorts', current_pct: 35, recommended_pct: 25, roi_score: 2.1, reason: 'CPA 대비 전환율 낮음' },
        { channel: 'TikTok', current_pct: 25, recommended_pct: 20, roi_score: 1.8, reason: '도달률은 높으나 전환 약함' },
        { channel: 'Blog', current_pct: 10, recommended_pct: 10, roi_score: 2.5, reason: '안정적 전환' },
      ],
    };

    // 3. message_pivot
    const messagePivot = {
      current_tone: '기능 강조 (성분/효능 중심)',
      suggested_tone: '감성 어필 (일상 공감 + 변화 스토리)',
      sentiment_score: 0.42,
      trigger_reason: "댓글 분석 결과 '성분' 관련 반응 낮음, '일상 변화' 스토리에 3배 높은 참여율",
    };

    const actions = [
      { type: 'creative_rotation', recommendation: creativeRotation },
      { type: 'channel_rebalance', recommendation: channelRebalance },
      { type: 'message_pivot', recommendation: messagePivot },
    ];

    const inserted = [];
    for (const action of actions) {
      const result = await pool.query(
        `INSERT INTO fnco_influencer.dw_optimization_action (campaign_id, action_type, recommendation, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [campaignId, action.type, JSON.stringify(action.recommendation)]
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      data: inserted,
    });
  } catch (error) {
    console.error('[generateOptimizations]', error);
    res.status(500).json({ error: '최적화 추천 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// 최적화 적용/무시
export const applyOptimization = async (req, res) => {
  try {
    await ensureTable();
    const { actionId } = req.params;
    const { status, applied_by } = req.body;

    if (!actionId) {
      return res.status(400).json({ error: 'Action ID가 필요합니다.' });
    }

    if (!status || !['applied', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: "status는 'applied' 또는 'dismissed'여야 합니다." });
    }

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_optimization_action
       SET status = $1, applied_by = $2, applied_at = CURRENT_TIMESTAMP
       WHERE action_id = $3
       RETURNING *`,
      [status, applied_by || null, actionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 최적화 액션을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[applyOptimization]', error);
    res.status(500).json({ error: '최적화 적용 중 오류가 발생했습니다.', details: error.message });
  }
};
