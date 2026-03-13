import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_early_signal (
    signal_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    signal_type VARCHAR(30) NOT NULL,
    dimension VARCHAR(50),
    rank_data JSONB DEFAULT '[]',
    anomalies JSONB DEFAULT '[]',
    detection_period VARCHAR(20),
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

// 초기 신호 조회
export const getSignals = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_early_signal WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[getSignals]', error);
    res.status(500).json({ error: '초기 신호 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// Mock 신호 감지 생성
export const detectSignals = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    // 기존 신호 삭제
    await pool.query(
      'DELETE FROM fnco_influencer.dw_early_signal WHERE campaign_id = $1',
      [campaignId]
    );

    const now = new Date();
    const period = `${now.getFullYear()}-W${String(Math.ceil((now.getDate()) / 7)).padStart(2, '0')}`;

    // --- 1. Hook Ranking ---
    const hookNames = [
      '매일 아침 거울 보면서 한숨?',
      '피부 나이 되돌리는 3단계',
      '30대 피부 고민 끝판왕',
      '이거 안 쓰면 후회해요',
      '하루 5분으로 달라지는 피부',
      '친구가 피부 뭐 했냐고 물어봄',
      '피부과 의사가 추천한 방법',
      '2주 만에 피부 환해짐',
      '겨울철 건조함 완전 해결',
      '민감성 피부도 OK',
    ];

    const hookRankData = hookNames.map((name, idx) => {
      const rank = idx + 1;
      const ctr = parseFloat((Math.random() * 5 + 1).toFixed(1));
      const changePct = parseFloat((Math.random() * 40 - 10).toFixed(1));
      let alertLevel = 'normal';
      if (rank <= 3) alertLevel = 'good';
      else if (rank >= 8) alertLevel = 'warning';

      return {
        entity_id: rank,
        entity_name: name,
        metric: 'CTR',
        value: ctr,
        rank,
        change_pct: changePct,
        alert_level: alertLevel,
      };
    });

    // Sort by value descending to ensure rank order matches value
    hookRankData.sort((a, b) => b.value - a.value);
    hookRankData.forEach((item, idx) => {
      item.rank = idx + 1;
      item.entity_id = idx + 1;
      if (item.rank <= 3) item.alert_level = 'good';
      else if (item.rank >= 8) item.alert_level = 'warning';
      else item.alert_level = 'normal';
    });

    await pool.query(
      `INSERT INTO fnco_influencer.dw_early_signal
       (campaign_id, signal_type, dimension, rank_data, anomalies, detection_period)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [campaignId, 'hook_ranking', 'hook', JSON.stringify(hookRankData), '[]', period]
    );

    // --- 2. Channel Ranking ---
    const channels = [
      { entity_name: 'Instagram Reels', metric: 'ROAS' },
      { entity_name: 'TikTok', metric: 'ROAS' },
      { entity_name: 'YouTube Shorts', metric: 'ROAS' },
      { entity_name: 'Blog', metric: 'ROAS' },
    ];

    const channelRankData = channels.map((ch, idx) => {
      const value = parseFloat((Math.random() * 4 + 0.5).toFixed(1));
      const changePct = parseFloat((Math.random() * 50 - 15).toFixed(1));
      return {
        entity_id: idx + 1,
        entity_name: ch.entity_name,
        metric: ch.metric,
        value,
        rank: idx + 1,
        change_pct: changePct,
        alert_level: 'normal',
      };
    });

    channelRankData.sort((a, b) => b.value - a.value);
    channelRankData.forEach((item, idx) => {
      item.rank = idx + 1;
      item.entity_id = idx + 1;
      if (item.rank === 1) item.alert_level = 'good';
      else if (item.rank === channels.length) item.alert_level = 'warning';
      else item.alert_level = 'normal';
    });

    await pool.query(
      `INSERT INTO fnco_influencer.dw_early_signal
       (campaign_id, signal_type, dimension, rank_data, anomalies, detection_period)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [campaignId, 'channel_ranking', 'channel', JSON.stringify(channelRankData), '[]', period]
    );

    // --- 3. Anomaly Detection ---
    const anomalyItems = [
      {
        metric: 'CTR',
        expected: 3.2,
        actual: 1.1,
        deviation: -65.6,
        severity: 'high',
        message: 'Instagram 카루셀 CTR이 예상 대비 65% 하락',
      },
      {
        metric: 'CPA',
        expected: 2500,
        actual: 4200,
        deviation: 68,
        severity: 'medium',
        message: 'YouTube 쇼츠 CPA가 급상승',
      },
      {
        metric: 'Engagement',
        expected: 1200,
        actual: 2800,
        deviation: 133,
        severity: 'low',
        message: 'TikTok 참여율이 예상 대비 133% 상승 (긍정적 이상)',
      },
    ];

    await pool.query(
      `INSERT INTO fnco_influencer.dw_early_signal
       (campaign_id, signal_type, dimension, rank_data, anomalies, detection_period)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [campaignId, 'anomaly', 'performance', '[]', JSON.stringify(anomalyItems), period]
    );

    // 생성된 데이터 다시 조회
    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_early_signal WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );

    res.json({
      success: true,
      message: '초기 신호 감지가 완료되었습니다.',
      data: result.rows,
    });
  } catch (error) {
    console.error('[detectSignals]', error);
    res.status(500).json({ error: '초기 신호 감지 중 오류가 발생했습니다.', details: error.message });
  }
};
