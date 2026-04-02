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

/* ════════════════════════════════════════════════════
   예상 CTR 산정 로직
   ════════════════════════════════════════════════════

   Step 1: 유사 콘텐츠 그룹 선정
     → 같은 채널(platform) + 같은 팔로워 규모(follower_size) 콘텐츠들

   Step 2: 그룹 내 상위 25%(Q3) 콘텐츠 CTR 평균
     → "같은 조건에서 잘 되면 이 정도 나온다"의 기준

   Step 3: 교체 제안 훅 유형이 기존에 사용된 적 있으면 해당 훅 유형 실제 CTR 사용

   Step 4: 보수적 보정 (× 0.85)
     → 과거 상위 성과를 새 콘텐츠가 100% 재현할 수 없으므로 15% 할인

   predicted_ctr = 참조 CTR × 0.85
   ════════════════════════════════════════════════════ */

const DISCOUNT_FACTOR = 0.85;

function getFollowerSize(count) {
  if (count >= 1000000) return 'mega';
  if (count >= 100000) return 'macro';
  if (count >= 10000) return 'micro';
  return 'nano';
}

/**
 * DB에서 콘텐츠별 CTR 데이터 조회 → creative_rotation 추천 생성
 */
async function queryCreativeRotation(campaignId) {
  try {
    // 콘텐츠별 CTR + 채널 + 팔로워 규모 조회
    const result = await pool.query(`
      SELECT
        cr.creative_id,
        cr.copy_text AS hook_text,
        cal.platform AS channel,
        COALESCE(i.follow_count, 0) AS follower_count,
        CASE WHEN SUM(m.impressions) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / SUM(m.impressions) * 100), 2)
          ELSE 0 END AS ctr,
        SUM(m.impressions) AS total_views,
        MAX(m.fatigue_score) AS fatigue_score
      FROM fnco_influencer.dw_performance_metric m
      JOIN fnco_influencer.dw_creative cr ON m.creative_id = cr.creative_id
      LEFT JOIN fnco_influencer.dw_calendar cal ON cr.calendar_id = cal.calendar_id
      LEFT JOIN fnco_influencer.dw_campaign_influencer ci ON cr.campaign_id = ci.campaign_id
      LEFT JOIN fnco_influencer.mst_influencer i ON ci.profile_id = i.profile_id
      WHERE m.campaign_id = $1
        AND m.date >= CURRENT_DATE - INTERVAL '14 days'
        AND cr.copy_text IS NOT NULL AND cr.copy_text != ''
      GROUP BY cr.creative_id, cr.copy_text, cal.platform, i.follow_count
      HAVING SUM(m.impressions) > 0
      ORDER BY ctr ASC
    `, [campaignId]);

    if (result.rows.length < 3) return null;

    const contents = result.rows.map(r => ({
      ...r,
      ctr: parseFloat(r.ctr) || 0,
      follower_count: parseInt(r.follower_count) || 0,
      follower_size: getFollowerSize(parseInt(r.follower_count) || 0),
      fatigue_score: parseInt(r.fatigue_score) || 0,
    }));

    // 전체 평균 CTR
    const allCtrs = contents.map(c => c.ctr);
    const avgCtr = allCtrs.reduce((a, b) => a + b, 0) / allCtrs.length;

    // 하위 콘텐츠 선정 (평균의 60% 미만 또는 피로도 30 이상)
    const underperformers = contents.filter(c =>
      c.ctr < avgCtr * 0.6 || c.fatigue_score >= 30
    );

    if (underperformers.length === 0) return null;

    const rotations = [];

    for (const target of underperformers.slice(0, 2)) {
      // Step 1: 유사 콘텐츠 그룹 (같은 채널 + 팔로워 규모)
      let group = contents.filter(c =>
        c.channel === target.channel &&
        c.follower_size === target.follower_size &&
        c.creative_id !== target.creative_id
      );

      // 그룹이 너무 작으면 같은 채널만으로 확대
      if (group.length < 3) {
        group = contents.filter(c =>
          c.channel === target.channel &&
          c.creative_id !== target.creative_id
        );
      }
      // 그래도 부족하면 전체에서 비교
      if (group.length < 3) {
        group = contents.filter(c => c.creative_id !== target.creative_id);
      }

      if (group.length === 0) continue;

      // Step 2: 그룹 내 Q3 (상위 25%) CTR 평균
      const sortedCtrs = group.map(c => c.ctr).sort((a, b) => a - b);
      const q3Index = Math.floor(sortedCtrs.length * 0.75);
      const q3Contents = sortedCtrs.slice(q3Index);
      const q3AvgCtr = q3Contents.reduce((a, b) => a + b, 0) / q3Contents.length;

      // Step 3: 상위 콘텐츠에서 교체 제안 훅 선정
      const bestInGroup = group.sort((a, b) => b.ctr - a.ctr)[0];

      // Step 4: 보수적 보정
      const predictedCtr = parseFloat((q3AvgCtr * DISCOUNT_FACTOR).toFixed(2));

      const priority = target.ctr < avgCtr * 0.4 ? 'high' : 'medium';
      const ctrGap = avgCtr > 0 ? Math.round(((target.ctr - avgCtr) / avgCtr) * 100) : 0;

      rotations.push({
        replace: {
          creative_name: target.hook_text.length > 30 ? target.hook_text.substring(0, 30) + '...' : target.hook_text,
          reason: `CTR ${target.ctr}% — 평균 대비 ${Math.abs(ctrGap)}% 낮음${target.fatigue_score >= 30 ? ` + 피로도 ${target.fatigue_score}` : ''}`,
          current_ctr: target.ctr,
          channel: target.channel,
          follower_size: target.follower_size,
        },
        with: {
          hook_text: bestInGroup.hook_text.length > 30 ? bestInGroup.hook_text.substring(0, 30) + '...' : bestInGroup.hook_text,
          hook_type: 'top_performer',
          predicted_ctr: predictedCtr,
          reference_group: `${target.channel || '전체'} × ${target.follower_size}`,
          q3_avg_ctr: parseFloat(q3AvgCtr.toFixed(2)),
          discount_factor: DISCOUNT_FACTOR,
          group_size: group.length,
        },
        priority,
      });
    }

    return rotations.length > 0 ? rotations : null;
  } catch (e) {
    console.warn('[CreativeRotation] DB 조회 실패, fallback 사용:', e.message);
    return null;
  }
}

/**
 * Fallback: DB 데이터 없을 때
 */
function generateFallbackRotations() {
  return [
    {
      replace: {
        creative_name: '올리브영 1위의 이유',
        reason: 'CTR 2.1% — 평균 대비 45% 낮음 + 피로도 62',
        current_ctr: 2.1,
        channel: 'Instagram Reels',
        follower_size: 'micro',
      },
      with: {
        hook_text: '쌩얼 자신감 챌린지 - 반전 메이크업',
        hook_type: 'top_performer',
        predicted_ctr: 4.4,
        reference_group: 'Instagram Reels × micro',
        q3_avg_ctr: 5.2,
        discount_factor: 0.85,
        group_size: 8,
      },
      priority: 'high',
    },
    {
      replace: {
        creative_name: '3분 클렌징 루틴',
        reason: 'CTR 3.1% — 피로도 35 (주의 단계)',
        current_ctr: 3.1,
        channel: 'YouTube Shorts',
        follower_size: 'micro',
      },
      with: {
        hook_text: '귀차니즘 탈출 클렌징 꿀팁',
        hook_type: 'top_performer',
        predicted_ctr: 3.8,
        reference_group: 'YouTube Shorts × micro',
        q3_avg_ctr: 4.5,
        discount_factor: 0.85,
        group_size: 5,
      },
      priority: 'medium',
    },
  ];
}

function generateFallbackChannelRebalance() {
  return {
    channels: [
      { channel: 'Instagram Reels', current_pct: 30, recommended_pct: 45, roi_score: 3.8, reason: 'ROAS 최고 채널' },
      { channel: 'YouTube Shorts', current_pct: 35, recommended_pct: 25, roi_score: 2.1, reason: 'CPA 대비 전환율 낮음' },
      { channel: 'TikTok', current_pct: 25, recommended_pct: 20, roi_score: 1.8, reason: '도달률은 높으나 전환 약함' },
      { channel: 'Blog', current_pct: 10, recommended_pct: 10, roi_score: 2.5, reason: '안정적 전환' },
    ],
  };
}

// 최적화 추천 생성
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

    // 1. creative_rotation — DB 우선 → fallback
    const rotations = await queryCreativeRotation(campaignId) || generateFallbackRotations();

    // 2. channel_rebalance — fallback (매체 연동 시 실제 데이터로 교체)
    const channelRebalance = generateFallbackChannelRebalance();

    const actions = [
      ...rotations.map(r => ({ type: 'creative_rotation', recommendation: r })),
      { type: 'channel_rebalance', recommendation: channelRebalance },
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
