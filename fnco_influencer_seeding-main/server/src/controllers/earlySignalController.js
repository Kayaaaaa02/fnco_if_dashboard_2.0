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

/* ════════════════════════════════════════════════════
   Helper: DB에서 실제 데이터 조회 시도 → 없으면 null
   ════════════════════════════════════════════════════ */

// 1) 훅 랭킹: copy_text별 ENG율 집계
async function queryHookRanking(campaignId) {
  try {
    // 이번 주 (최근 7일)
    // 인게이지먼트율 = (좋아요+댓글+공유) / 조회수 × 100
    const thisWeek = await pool.query(`
      SELECT
        cr.copy_text AS hook_text,
        AVG(m.impressions) AS avg_views,
        CASE WHEN SUM(m.impressions) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / SUM(m.impressions) * 100), 2)
          ELSE 0 END AS avg_eng_rate,
        SUM(m.clicks) AS total_likes,
        SUM(COALESCE(m.comments, 0)) AS total_comments,
        SUM(COALESCE(m.shares, 0)) AS total_shares,
        COUNT(*) AS content_count
      FROM fnco_influencer.dw_performance_metric m
      JOIN fnco_influencer.dw_creative cr ON m.creative_id = cr.creative_id
      WHERE m.campaign_id = $1
        AND m.date >= CURRENT_DATE - INTERVAL '7 days'
        AND cr.copy_text IS NOT NULL AND cr.copy_text != ''
      GROUP BY cr.copy_text
      HAVING COUNT(*) >= 1
      ORDER BY avg_eng_rate DESC
    `, [campaignId]);

    if (thisWeek.rows.length === 0) return null;

    // 지난 주 (8~14일 전) — 변동률 계산용
    const lastWeek = await pool.query(`
      SELECT
        cr.copy_text AS hook_text,
        CASE WHEN SUM(m.impressions) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / SUM(m.impressions) * 100), 2)
          ELSE 0 END AS avg_eng_rate
      FROM fnco_influencer.dw_performance_metric m
      JOIN fnco_influencer.dw_creative cr ON m.creative_id = cr.creative_id
      WHERE m.campaign_id = $1
        AND m.date >= CURRENT_DATE - INTERVAL '14 days'
        AND m.date < CURRENT_DATE - INTERVAL '7 days'
        AND cr.copy_text IS NOT NULL AND cr.copy_text != ''
      GROUP BY cr.copy_text
    `, [campaignId]);

    const lastWeekMap = {};
    for (const row of lastWeek.rows) {
      lastWeekMap[row.hook_text] = parseFloat(row.avg_eng_rate) || 0;
    }

    return thisWeek.rows.map((row, idx) => {
      const engRate = parseFloat(row.avg_eng_rate) || 0;
      const lastRate = lastWeekMap[row.hook_text];
      const changePct = lastRate > 0
        ? parseFloat((((engRate - lastRate) / lastRate) * 100).toFixed(1))
        : null;

      const rank = idx + 1;
      let alertLevel = 'normal';
      if (rank <= 3) alertLevel = 'good';
      else if (rank >= 8 || (changePct !== null && changePct < -10)) alertLevel = 'warning';

      return {
        entity_id: rank,
        entity_name: row.hook_text.length > 40 ? row.hook_text.substring(0, 40) + '...' : row.hook_text,
        metric: 'ENG율',
        value: parseFloat(engRate.toFixed(1)),
        rank,
        change_pct: changePct,
        alert_level: alertLevel,
        avg_views: Math.round(parseFloat(row.avg_views) || 0),
        content_count: parseInt(row.content_count),
      };
    });
  } catch (e) {
    console.warn('[HookRanking] DB 조회 실패, fallback 사용:', e.message);
    return null;
  }
}

// 2) 채널 랭킹: platform별 효율 배수
async function queryChannelRanking(campaignId) {
  try {
    // 인게이지먼트율 = (좋아요+댓글+공유) / 조회수 × 100
    const thisWeek = await pool.query(`
      SELECT
        cal.platform AS channel,
        SUM(m.impressions) AS total_views,
        SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0)) AS total_eng,
        COUNT(DISTINCT m.creative_id) AS content_count,
        CASE WHEN SUM(m.impressions) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / SUM(m.impressions) * 100), 2)
          ELSE 0 END AS avg_eng_rate
      FROM fnco_influencer.dw_performance_metric m
      JOIN fnco_influencer.dw_creative cr ON m.creative_id = cr.creative_id
      LEFT JOIN fnco_influencer.dw_calendar cal ON cr.calendar_id = cal.calendar_id
      WHERE m.campaign_id = $1
        AND m.date >= CURRENT_DATE - INTERVAL '7 days'
        AND cal.platform IS NOT NULL
      GROUP BY cal.platform
      HAVING SUM(m.impressions) > 0
      ORDER BY avg_eng_rate DESC
    `, [campaignId]);

    if (thisWeek.rows.length === 0) return null;

    // 전체 평균 인게이지먼트율
    const totalEng = thisWeek.rows.reduce((s, r) => s + (parseFloat(r.total_eng) || 0), 0);
    const totalViews = thisWeek.rows.reduce((s, r) => s + (parseFloat(r.total_views) || 0), 0);
    const overallRate = totalViews > 0 ? (totalEng / totalViews * 100) : 0;

    // 지난 주 — 변동률 계산
    const lastWeek = await pool.query(`
      SELECT
        cal.platform AS channel,
        CASE WHEN SUM(m.impressions) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / SUM(m.impressions) * 100), 2)
          ELSE 0 END AS avg_eng_rate
      FROM fnco_influencer.dw_performance_metric m
      JOIN fnco_influencer.dw_creative cr ON m.creative_id = cr.creative_id
      LEFT JOIN fnco_influencer.dw_calendar cal ON cr.calendar_id = cal.calendar_id
      WHERE m.campaign_id = $1
        AND m.date >= CURRENT_DATE - INTERVAL '14 days'
        AND m.date < CURRENT_DATE - INTERVAL '7 days'
        AND cal.platform IS NOT NULL
      GROUP BY cal.platform
    `, [campaignId]);

    const lastWeekMap = {};
    for (const row of lastWeek.rows) {
      lastWeekMap[row.channel] = parseFloat(row.avg_eng_rate) || 0;
    }

    return thisWeek.rows.map((row, idx) => {
      const engRate = parseFloat(row.avg_eng_rate) || 0;
      const efficiency = overallRate > 0 ? parseFloat((engRate / overallRate).toFixed(1)) : 1.0;
      const lastRate = lastWeekMap[row.channel];
      const changePct = lastRate > 0
        ? parseFloat((((engRate - lastRate) / lastRate) * 100).toFixed(1))
        : null;

      const rank = idx + 1;
      let alertLevel = 'normal';
      if (efficiency >= 2.0) alertLevel = 'good';
      else if (efficiency < 1.0) alertLevel = 'warning';

      const CHANNEL_LABELS = {
        instagram: 'Instagram Reels', tiktok: 'TikTok',
        youtube: 'YouTube Shorts', blog: 'Blog',
      };

      return {
        entity_id: rank,
        entity_name: CHANNEL_LABELS[row.channel?.toLowerCase()] || row.channel,
        metric: '효율배수',
        value: efficiency,
        rank,
        change_pct: changePct,
        alert_level: alertLevel,
        total_views: parseInt(row.total_views) || 0,
        content_count: parseInt(row.content_count),
      };
    });
  } catch (e) {
    console.warn('[ChannelRanking] DB 조회 실패, fallback 사용:', e.message);
    return null;
  }
}

// 3) 이상 감지: 콘텐츠별 성과점수 z-score 기반
//    성과점수 = (0.7 × 조회수_z) + (0.3 × 참여율_z)
//    그룹화: channel + follower_size
async function queryAnomalyDetection(campaignId) {
  try {
    // 인게이지먼트율 = (좋아요+댓글+공유) / 조회수 × 100
    // 참여율 = (좋아요+댓글+공유) / 팔로워수 × 100 (성과점수에 사용)
    const result = await pool.query(`
      SELECT
        cr.copy_text AS content_name,
        cal.platform AS channel,
        AVG(m.impressions) AS avg_views,
        CASE WHEN SUM(m.impressions) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / SUM(m.impressions) * 100), 2)
          ELSE 0 END AS avg_eng_rate,
        CASE WHEN MAX(COALESCE(i.follow_count, 0)) > 0
          THEN ROUND((SUM(m.clicks + COALESCE(m.comments,0) + COALESCE(m.shares,0))::numeric / MAX(i.follow_count) * 100), 4)
          ELSE NULL END AS participation_rate
      FROM fnco_influencer.dw_performance_metric m
      JOIN fnco_influencer.dw_creative cr ON m.creative_id = cr.creative_id
      LEFT JOIN fnco_influencer.dw_calendar cal ON cr.calendar_id = cal.calendar_id
      LEFT JOIN fnco_influencer.dw_campaign_influencer ci ON cr.campaign_id = ci.campaign_id
      LEFT JOIN fnco_influencer.mst_influencer i ON ci.profile_id = i.profile_id
      WHERE m.campaign_id = $1
        AND cr.copy_text IS NOT NULL AND cr.copy_text != ''
      GROUP BY cr.copy_text, cal.platform
      HAVING COUNT(*) >= 1
    `, [campaignId]);

    if (result.rows.length < 3) return null; // 최소 3개 콘텐츠 필요

    // 채널별 그룹화 후 z-score 계산
    const groups = {};
    for (const row of result.rows) {
      const key = row.channel || '_all';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    const scored = [];
    for (const [, items] of Object.entries(groups)) {
      if (items.length < 2) {
        // 그룹이 1개면 전체 풀에서 비교
        continue;
      }
      const views = items.map(r => parseFloat(r.avg_views) || 0);
      // 참여율 = (좋아요+댓글+공유) / 팔로워수 × 100 — 없으면 인게이지먼트율 fallback
      const partRates = items.map(r => parseFloat(r.participation_rate) || parseFloat(r.avg_eng_rate) || 0);
      const engRates = items.map(r => parseFloat(r.avg_eng_rate) || 0); // 인게이지먼트율 (표시용)
      const meanV = views.reduce((a, b) => a + b, 0) / views.length;
      const meanP = partRates.reduce((a, b) => a + b, 0) / partRates.length;
      const meanE = engRates.reduce((a, b) => a + b, 0) / engRates.length;
      const stdV = Math.sqrt(views.reduce((s, v) => s + (v - meanV) ** 2, 0) / views.length) || 1;
      const stdP = Math.sqrt(partRates.reduce((s, v) => s + (v - meanP) ** 2, 0) / partRates.length) || 1;

      for (let i = 0; i < items.length; i++) {
        const viewZ = (views[i] - meanV) / stdV;
        // 성과점수 = 0.7 × 조회수_z + 0.3 × 참여율_z
        const partZ = (partRates[i] - meanP) / stdP;
        const score = 0.7 * viewZ + 0.3 * partZ;
        scored.push({
          ...items[i],
          view_z: parseFloat(viewZ.toFixed(2)),
          eng_z: parseFloat(partZ.toFixed(2)),  // 참여율 z-score
          performance_score: parseFloat(score.toFixed(2)),
          group_mean_views: meanV,
          group_mean_eng: meanE,  // 인게이지먼트율 평균 (표시용)
          group_mean_part: meanP, // 참여율 평균
        });
      }
    }

    // 그룹 1개짜리 잔여 → 전체 풀에서 비교
    const ungrouped = [];
    for (const [, items] of Object.entries(groups)) {
      if (items.length < 2) ungrouped.push(...items);
    }
    if (ungrouped.length > 0 && scored.length > 0) {
      const allViews = scored.map(s => parseFloat(s.avg_views) || 0);
      const allParts = scored.map(s => parseFloat(s.participation_rate) || parseFloat(s.avg_eng_rate) || 0);
      const allEngs = scored.map(s => parseFloat(s.avg_eng_rate) || 0);
      const mV = allViews.reduce((a, b) => a + b, 0) / allViews.length;
      const mP = allParts.reduce((a, b) => a + b, 0) / allParts.length;
      const mE = allEngs.reduce((a, b) => a + b, 0) / allEngs.length;
      const sV = Math.sqrt(allViews.reduce((s, v) => s + (v - mV) ** 2, 0) / allViews.length) || 1;
      const sP = Math.sqrt(allParts.reduce((s, v) => s + (v - mP) ** 2, 0) / allParts.length) || 1;
      for (const row of ungrouped) {
        const v = parseFloat(row.avg_views) || 0;
        const p = parseFloat(row.participation_rate) || parseFloat(row.avg_eng_rate) || 0;
        const viewZ = (v - mV) / sV;
        const partZ = (p - mP) / sP;
        scored.push({
          ...row,
          view_z: parseFloat(viewZ.toFixed(2)),
          eng_z: parseFloat(partZ.toFixed(2)),
          performance_score: parseFloat((0.7 * viewZ + 0.3 * partZ).toFixed(2)),
          group_mean_views: mV,
          group_mean_eng: mE,
          group_mean_part: mP,
        });
      }
    }

    // 성과점수 < -1.0 인 콘텐츠만 이상으로 판별
    const anomalies = scored
      .filter(s => s.performance_score < -1.0)
      .sort((a, b) => a.performance_score - b.performance_score)
      .map(s => {
        const absScore = Math.abs(s.performance_score);
        let severity = 'low';
        if (absScore >= 2.5) severity = 'high';
        else if (absScore >= 1.5) severity = 'medium';

        // 진단: 조회수 vs 참여율 중 어느 쪽이 더 부진한지
        let message;
        if (s.view_z < -1.0 && s.eng_z < -1.0) {
          message = '조회수와 참여율 모두 그룹 평균 대비 크게 낮습니다. 콘텐츠 교체를 권장합니다.';
        } else if (s.view_z < s.eng_z) {
          message = '조회수가 그룹 평균 대비 부진합니다. 채널/타겟 재검토가 필요합니다.';
        } else {
          message = '참여율이 그룹 평균 대비 부진합니다. 훅/CTA 교체를 검토하세요.';
        }

        const engActual = parseFloat(s.avg_eng_rate) || 0;
        const viewsActual = parseFloat(s.avg_views) || 0;

        const name = s.content_name.length > 35
          ? s.content_name.substring(0, 35) + '...'
          : s.content_name;

        // 조회수 편차 (그룹 평균 대비)
        const viewDeviation = s.group_mean_views > 0
          ? parseFloat((((viewsActual - s.group_mean_views) / s.group_mean_views) * 100).toFixed(1))
          : 0;
        // 참여율 편차 (그룹 평균 대비)
        const engDeviation = s.group_mean_eng > 0
          ? parseFloat((((engActual - s.group_mean_eng) / s.group_mean_eng) * 100).toFixed(1))
          : 0;

        return {
          metric: name,
          severity,
          message,
          expected: `참여율${s.group_mean_eng.toFixed(1)}%  ·  VIEW ${Math.round(s.group_mean_views).toLocaleString()}`,
          actual: `참여율${engActual.toFixed(1)}%  ·  VIEW ${Math.round(viewsActual).toLocaleString()}`,
          eng_deviation: engDeviation,
          view_deviation: viewDeviation,
          performance_score: s.performance_score,
          view_z: s.view_z,
          eng_z: s.eng_z,
          channel: s.channel,
          views: Math.round(viewsActual),
        };
      });

    return anomalies.length > 0 ? anomalies : null;
  } catch (e) {
    console.warn('[AnomalyDetection] DB 조회 실패, fallback 사용:', e.message);
    return null;
  }
}

/* ════════════════════════════════════════════════════
   Fallback: DB 데이터 없을 때 시뮬레이션
   ════════════════════════════════════════════════════ */

function generateFallbackHookRanking() {
  const hooks = [
    '쌩얼 자신감 챌린지 - 3초 후 반전',
    '피부과 전문의가 추천하는 클렌징',
    '올영 1위 이유 있었네',
    '성분 비교: 클렌징밤 TOP 5',
    '10년차 여드름 피부의 세수법',
    '3분 클렌징 루틴 공개',
    '귀차니즘 탈출 클렌징 꿀팁',
    '매일 아침 거울 보면서 한숨?',
    '하루 5분으로 달라지는 피부',
    '2주 만에 피부 환해짐',
  ];

  const data = hooks.map((name, idx) => {
    const baseEng = 5.5 - idx * 0.35 + (Math.random() * 0.6 - 0.3);
    const changePct = parseFloat((Math.random() * 30 - 8).toFixed(1));
    return {
      entity_id: idx + 1,
      entity_name: name,
      metric: 'ENG율',
      value: parseFloat(Math.max(baseEng, 0.5).toFixed(1)),
      rank: idx + 1,
      change_pct: changePct,
      alert_level: 'normal',
    };
  });

  data.sort((a, b) => b.value - a.value);
  data.forEach((item, idx) => {
    item.rank = idx + 1;
    item.entity_id = idx + 1;
    if (idx < 3) item.alert_level = 'good';
    else if (idx >= 7 || item.change_pct < -10) item.alert_level = 'warning';
    else item.alert_level = 'normal';
  });

  return data;
}

function generateFallbackChannelRanking() {
  const channels = [
    { name: 'Instagram Reels', baseEff: 3.8 },
    { name: 'TikTok', baseEff: 3.2 },
    { name: 'YouTube Shorts', baseEff: 2.4 },
    { name: 'Blog', baseEff: 1.6 },
  ];

  const data = channels.map((ch, idx) => {
    const eff = parseFloat((ch.baseEff + (Math.random() * 1.0 - 0.5)).toFixed(1));
    const changePct = parseFloat((Math.random() * 40 - 12).toFixed(1));
    return {
      entity_id: idx + 1,
      entity_name: ch.name,
      metric: '효율배수',
      value: eff,
      rank: idx + 1,
      change_pct: changePct,
      alert_level: 'normal',
    };
  });

  data.sort((a, b) => b.value - a.value);
  data.forEach((item, idx) => {
    item.rank = idx + 1;
    item.entity_id = idx + 1;
    if (item.value >= 2.0 && idx === 0) item.alert_level = 'good';
    else if (item.value < 1.0 || idx === data.length - 1) item.alert_level = 'warning';
    else item.alert_level = 'normal';
  });

  return data;
}

function generateFallbackAnomalies() {
  return [
    {
      metric: '올리브영 1위의 이유',
      severity: 'high',
      message: '조회수와 참여율 모두 그룹 평균 대비 크게 낮습니다. 콘텐츠 교체를 권장합니다.',
      expected: '참여율3.7%  ·  VIEW 45,200',
      actual: '참여율0.9%  ·  VIEW 8,200',
      eng_deviation: -75.7,
      view_deviation: -81.9,
      performance_score: -2.8,
      view_z: -2.1,
      eng_z: -1.9,
      channel: 'Instagram Reels',
      views: 8200,
    },
    {
      metric: '3분 클렌징 루틴 공개',
      severity: 'medium',
      message: '참여율이 그룹 평균 대비 부진합니다. 훅/CTA 교체를 검토하세요.',
      expected: '참여율3.7%  ·  VIEW 45,200',
      actual: '참여율1.8%  ·  VIEW 27,600',
      eng_deviation: -51.4,
      view_deviation: -38.9,
      performance_score: -1.7,
      view_z: -0.6,
      eng_z: -2.1,
      channel: 'YouTube Shorts',
      views: 27600,
    },
    {
      metric: '10년차 여드름 피부의 세수법',
      severity: 'low',
      message: '조회수가 그룹 평균 대비 부진합니다. 채널/타겟 재검토가 필요합니다.',
      expected: '참여율3.7%  ·  VIEW 45,200',
      actual: '참여율2.4%  ·  VIEW 15,400',
      eng_deviation: -35.1,
      view_deviation: -65.9,
      performance_score: -1.2,
      view_z: -1.5,
      eng_z: -0.4,
      channel: 'TikTok',
      views: 15400,
    },
  ];
}

/* ════════════════════════════════════════════════════
   메인: 신호 감지 실행
   ════════════════════════════════════════════════════ */

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

    // --- 1. 훅 랭킹: DB 우선 → fallback ---
    const hookData = await queryHookRanking(campaignId) || generateFallbackHookRanking();

    await pool.query(
      `INSERT INTO fnco_influencer.dw_early_signal
       (campaign_id, signal_type, dimension, rank_data, anomalies, detection_period)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [campaignId, 'hook_ranking', 'hook', JSON.stringify(hookData), '[]', period]
    );

    // --- 2. 채널 랭킹: DB 우선 → fallback ---
    const channelData = await queryChannelRanking(campaignId) || generateFallbackChannelRanking();

    await pool.query(
      `INSERT INTO fnco_influencer.dw_early_signal
       (campaign_id, signal_type, dimension, rank_data, anomalies, detection_period)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [campaignId, 'channel_ranking', 'channel', JSON.stringify(channelData), '[]', period]
    );

    // --- 3. 이상 감지: DB 우선 → fallback ---
    const anomalyData = await queryAnomalyDetection(campaignId) || generateFallbackAnomalies();

    await pool.query(
      `INSERT INTO fnco_influencer.dw_early_signal
       (campaign_id, signal_type, dimension, rank_data, anomalies, detection_period)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [campaignId, 'anomaly', 'performance', '[]', JSON.stringify(anomalyData), period]
    );

    // 생성된 데이터 다시 조회
    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_early_signal WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );

    const dbUsed = {
      hook: !!(await queryHookRanking(campaignId)),
      channel: !!(await queryChannelRanking(campaignId)),
      anomaly: !!(await queryAnomalyDetection(campaignId)),
    };

    res.json({
      success: true,
      message: '초기 신호 감지가 완료되었습니다.',
      data: result.rows,
      source: dbUsed,
    });
  } catch (error) {
    console.error('[detectSignals]', error);
    res.status(500).json({ error: '초기 신호 감지 중 오류가 발생했습니다.', details: error.message });
  }
};
