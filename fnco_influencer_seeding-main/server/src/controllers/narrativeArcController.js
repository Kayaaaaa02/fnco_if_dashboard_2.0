import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_narrative_arc (
    arc_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    version INTEGER DEFAULT 1,
    phases JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'draft',
    created_by VARCHAR(100),
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

// 서사 아크 최신 버전 조회
// GET /api/v2/campaigns/:id/narrative-arc
export const getNarrativeArc = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      `SELECT * FROM fnco_influencer.dw_narrative_arc
       WHERE campaign_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[getNarrativeArc]', error);
    res.status(500).json({ error: '서사 아크 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// 서사 아크 AI 생성 — PDA 데이터 기반
// POST /api/v2/campaigns/:id/narrative-arc/generate
export const generateNarrativeArc = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { created_by } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    // PDA 데이터 조회
    const [personaRes, awarenessRes, conceptRes] = await Promise.all([
      pool.query(
        `SELECT * FROM fnco_influencer.mst_pda_persona WHERE campaign_id = $1 AND is_active = true ORDER BY sort_order`,
        [id]
      ),
      pool.query(
        `SELECT * FROM fnco_influencer.mst_pda_awareness WHERE campaign_id = $1 ORDER BY sort_order`,
        [id]
      ),
      pool.query(
        `SELECT c.*, p.code AS persona_code, d.code AS desire_code,
                a.code AS awareness_code, a.name AS awareness_name, a.funnel AS awareness_funnel
         FROM fnco_influencer.mst_pda_concept c
         LEFT JOIN fnco_influencer.mst_pda_persona p ON c.persona_id = p.persona_id
         LEFT JOIN fnco_influencer.mst_pda_desire d ON c.desire_id = d.desire_id
         LEFT JOIN fnco_influencer.mst_pda_awareness a ON c.awareness_id = a.awareness_id
         WHERE c.campaign_id = $1 ORDER BY c.sort_order`,
        [id]
      ),
    ]);

    const personas = personaRes.rows;
    const awareness = awarenessRes.rows;
    const concepts = conceptRes.rows;

    // PDA 기반 서사 아크 빌드
    const phases = buildNarrativeFromPDA(personas, awareness, concepts);

    // 기존 최대 버전 조회
    const versionResult = await pool.query(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM fnco_influencer.dw_narrative_arc WHERE campaign_id = $1`,
      [id]
    );
    const nextVersion = versionResult.rows[0].max_version + 1;

    const result = await pool.query(
      `INSERT INTO fnco_influencer.dw_narrative_arc
       (campaign_id, version, phases, status, created_by)
       VALUES ($1, $2, $3, 'draft', $4)
       RETURNING *`,
      [id, nextVersion, JSON.stringify(phases), created_by || null]
    );

    console.log('[generateNarrativeArc] PDA 기반 서사 아크 생성 — 컨셉', concepts.length, '개 참조');

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[generateNarrativeArc]', error);
    res.status(500).json({ error: '서사 아크 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// ── PDA 기반 론칭 서사 아크 빌드 함수 ──
function buildNarrativeFromPDA(personas, awareness, concepts) {
  const AWARENESS_TO_ARC = { A1: 'tease', A2: 'reveal', A3: 'validate', A4: 'amplify' };
  const PLACEMENT_MAP = {
    tiktok: 'TikTok', instagram_reels: 'Instagram Reels',
    instagram_feed: 'Instagram Feed', instagram_stories: 'Instagram Stories',
    youtube: 'YouTube', naver_blog: 'Naver Blog',
  };
  const ARC_CONFIG = {
    tease: {
      timing: 'D-21 ~ D-14',
      fallbackPurpose: '타겟의 Pain Point를 자극하여 문제를 인식시킵니다.',
      fallbackTone: '"이거 불편하지 않았어?" — 공감 자극',
      defaultChannels: ['TikTok', 'Instagram Stories'],
      channelStrategy: {
        tiktok: { role: '초반 점화', tactic: '동시 드랍으로 토픽 클러스터링', signal: '완시청률 + 토픽 트렌드' },
        instagram: { role: '비주얼 티저', tactic: '스토리+릴스로 호기심 유발', signal: 'DM 공유 + 스토리 조회수' },
      },
    },
    reveal: {
      timing: 'D-7 ~ D-3',
      fallbackPurpose: '해결 메커니즘과 제품 원리를 교육합니다.',
      fallbackTone: '"이렇게 해결했다" — 교육 + 신뢰',
      defaultChannels: ['TikTok', 'Instagram Reels', 'YouTube'],
      channelStrategy: {
        tiktok: { role: '바이럴 확산', tactic: '동시 드랍 + 트렌드 사운드', signal: '완시청률 + 공유수' },
        instagram: { role: '제품 공개 비주얼', tactic: 'Reels+피드로 상세 공개', signal: '저장수 + DM 공유' },
        youtube: { role: '초기 리뷰', tactic: '첫인상/언박싱 쇼츠', signal: 'CTR + 초기 리텐션' },
      },
    },
    validate: {
      timing: 'D-Day ~ D+3',
      fallbackPurpose: '사회적 증거를 축적하여 신뢰를 강화합니다.',
      fallbackTone: '"다들 이미 쓰고 있다" — 사회적 증거',
      defaultChannels: ['Instagram Reels', 'TikTok', 'YouTube'],
      channelStrategy: {
        instagram: { role: '사회적 증거', tactic: '"보내고 싶은 콘텐츠" + Reels 집중', signal: 'DM 공유 + 좋아요' },
        tiktok: { role: '유지 확산', tactic: 'UGC 챌린지 + 리포스트', signal: '토픽 지속성' },
        youtube: { role: '심층 리뷰', tactic: '비교 리뷰 + 성분 분석', signal: '시청 만족도 + 리텐션' },
      },
    },
    amplify: {
      timing: 'D+7 ~ D+30',
      fallbackPurpose: '성과 데이터 기반으로 최적화하고 전환을 극대화합니다.',
      fallbackTone: '"데이터가 결정한다" — 성과 최적화',
      defaultChannels: ['YouTube', 'Performance Ads', 'UGC Repost'],
      channelStrategy: {
        youtube: { role: '장기 신뢰', tactic: '심층 리뷰 + SEO 최적화', signal: '시청 만족도 + CTR' },
        performance_ads: { role: '전환 최적화', tactic: '상위 콘텐츠 광고 전환', signal: 'ROAS + CPA' },
        ugc: { role: 'UGC 선순환', tactic: '고객 리뷰 리포스트 + 큐레이션', signal: 'UGC 생성량' },
      },
    },
  };

  const stages = awareness.length > 0 ? awareness : [
    { code: 'A1', name: '문제 인지', funnel: 'TOFU', strategy: '' },
    { code: 'A2', name: '해결책 인지', funnel: 'MOFU', strategy: '' },
    { code: 'A3', name: '제품 인지', funnel: 'MOFU', strategy: '' },
    { code: 'A4', name: '구매 유도', funnel: 'BOFU', strategy: '' },
  ];

  return stages.map((stage) => {
    const arcKey = AWARENESS_TO_ARC[stage.code] || 'tease';
    const cfg = ARC_CONFIG[arcKey];
    const stageConcepts = concepts.filter((c) => c.awareness_code === stage.code);

    // 실제 채널 추출
    const actualChannels = [...new Set(
      stageConcepts.map((c) => PLACEMENT_MAP[c.campaign_placement]).filter(Boolean)
    )];

    // 톤 추출
    const tones = [...new Set(stageConcepts.map((c) => c.tone).filter(Boolean))];
    const headCopies = stageConcepts.map((c) => c.head_copy).filter(Boolean);

    // purpose: awareness strategy 있으면 사용 + 컨셉 수 기반 보강
    const purpose = stage.strategy
      ? `${stage.strategy} ${stageConcepts.length}개 컨셉으로 전개합니다.`
      : `${cfg.fallbackPurpose} ${stageConcepts.length}개 컨셉으로 전개합니다.`;

    // message_tone: 실제 컨셉 톤/카피 기반
    let messageTone = cfg.fallbackTone;
    if (headCopies.length > 0) {
      messageTone = `"${headCopies[0]}"`;
      if (tones.length > 0) messageTone += ` — ${tones.slice(0, 2).join(' + ')} 톤`;
    } else if (tones.length > 0) {
      messageTone = `${tones.join(' + ')} 톤`;
    }

    // KPI 산출
    const n = stageConcepts.length;
    const kpiMap = {
      tease: `조회수 ${(n * 150).toLocaleString()}K+, 완시청률 45%+`,
      reveal: `조회수 ${(n * 300).toLocaleString()}K+, 참여율 5%+`,
      validate: `공유수 ${(n * 500).toLocaleString()}건+, 저장수 ${(n * 700).toLocaleString()}건+`,
      amplify: `ROAS ${(3.0 + n * 0.3).toFixed(1)}x+, 전환수 ${(n * 150).toLocaleString()}건+`,
    };

    return {
      phase: arcKey,
      timing: cfg.timing,
      purpose,
      message_tone: messageTone,
      channels: actualChannels.length > 0 ? actualChannels : cfg.defaultChannels,
      channel_strategy: cfg.channelStrategy,
      kpi: kpiMap[arcKey],
      awareness: { code: stage.code, name: stage.name, funnel: stage.funnel },
      concepts: stageConcepts.map((c) => ({
        concept_id: c.concept_id,
        name: c.concept_name,
        head_copy: c.head_copy,
        persona: c.persona_code,
      })),
    };
  });
}

// 서사 아크 업데이트
// PUT /api/v2/campaigns/:id/narrative-arc
export const updateNarrativeArc = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { phases } = req.body;

    if (!id) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    if (!phases) {
      return res.status(400).json({ error: 'phases 데이터가 필요합니다.' });
    }

    // 최신 버전 찾기
    const latestResult = await pool.query(
      `SELECT arc_id FROM fnco_influencer.dw_narrative_arc
       WHERE campaign_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [id]
    );

    if (latestResult.rows.length === 0) {
      return res.status(404).json({ error: '업데이트할 서사 아크가 없습니다.' });
    }

    const arcId = latestResult.rows[0].arc_id;

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_narrative_arc
       SET phases = $1, updated_at = CURRENT_TIMESTAMP
       WHERE arc_id = $2
       RETURNING *`,
      [JSON.stringify(phases), arcId]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[updateNarrativeArc]', error);
    res.status(500).json({ error: '서사 아크 업데이트 중 오류가 발생했습니다.', details: error.message });
  }
};
