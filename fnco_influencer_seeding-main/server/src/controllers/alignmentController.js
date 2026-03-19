import { pool } from '../config/database.js';
import { getModel, isGeminiAvailable } from '../config/gemini.js';
import { buildAlignmentPromptText } from '../config/alignmentPrompts.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_strategy_alignment (
    alignment_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    strategy_id INTEGER,
    checks JSONB NOT NULL DEFAULT '[]',
    overall_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
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

// GET latest alignment for campaign
export const getAlignment = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      `SELECT * FROM fnco_influencer.dw_strategy_alignment
       WHERE campaign_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[getAlignment]', error);
    res.status(500).json({ error: '정합성 체크 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// POST run alignment check
export const runAlignment = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await runAlignmentLogic(campaignId);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[runAlignment]', error);
    res.status(500).json({ error: '정합성 체크 실행 중 오류가 발생했습니다.', details: error.message });
  }
};

// ── 정합성 분석 핵심 로직 (전략 생성 시 자동 호출용으로 분리) ──
export async function runAlignmentLogic(campaignId) {
  await ensureTable();

  // ── 1. 데이터 수집 ──
  const [campaignRes, strategyRes, personaRes, desireRes, awarenessRes, conceptRes, arcRes] = await Promise.all([
    pool.query(`SELECT * FROM mst_campaign WHERE campaign_id = $1`, [campaignId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM fnco_influencer.dw_campaign_strategy WHERE campaign_id = $1 ORDER BY version DESC LIMIT 1`, [campaignId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM fnco_influencer.mst_pda_persona WHERE campaign_id = $1 AND is_active = true ORDER BY sort_order`, [campaignId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM fnco_influencer.mst_pda_desire WHERE campaign_id = $1 AND is_active = true ORDER BY sort_order`, [campaignId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM fnco_influencer.mst_pda_awareness WHERE campaign_id = $1 ORDER BY sort_order`, [campaignId]).catch(() => ({ rows: [] })),
    pool.query(`
      SELECT c.*, p.code AS persona_code, p.name AS persona_name,
             d.code AS desire_code, d.name AS desire_name,
             a.code AS awareness_code, a.name AS awareness_name, a.funnel AS awareness_funnel
      FROM fnco_influencer.mst_pda_concept c
      LEFT JOIN fnco_influencer.mst_pda_persona p ON c.persona_id = p.persona_id
      LEFT JOIN fnco_influencer.mst_pda_desire d ON c.desire_id = d.desire_id
      LEFT JOIN fnco_influencer.mst_pda_awareness a ON c.awareness_id = a.awareness_id
      WHERE c.campaign_id = $1 ORDER BY c.sort_order
    `, [campaignId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM fnco_influencer.dw_narrative_arc WHERE campaign_id = $1 ORDER BY version DESC LIMIT 1`, [campaignId]).catch(() => ({ rows: [] })),
  ]);

  const campaign = campaignRes.rows[0];
  const brandDna = campaign?.brand_dna;
  const strategy = strategyRes.rows[0];
  const strategyKo = strategy?.strategy_ko;
  const personas = personaRes.rows;
  const desires = desireRes.rows;
  const awareness = awarenessRes.rows;
  const concepts = conceptRes.rows;
  const arc = arcRes.rows[0];
  const arcPhases = arc?.phases || [];

  // ── 2. Gemini AI 정합성 분석 ──
  let checks;

  if (isGeminiAvailable()) {
    try {
      checks = await runGeminiAlignmentCheck({
        campaign, brandDna, strategyKo,
        personas, desires, awareness, concepts, arcPhases,
      });
      console.log('[runAlignment] Gemini AI 정합성 분석 완료');
    } catch (aiErr) {
      console.error('[runAlignment] Gemini 호출 실패, 규칙 기반 폴백:', aiErr.message);
      checks = runRuleBasedAlignment({ brandDna, strategyKo, personas, desires, awareness, concepts, arcPhases, campaign });
    }
  } else {
    console.log('[runAlignment] Gemini 미설정 — 규칙 기반 분석');
    checks = runRuleBasedAlignment({ brandDna, strategyKo, personas, desires, awareness, concepts, arcPhases, campaign });
  }

  const overallScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);

  const insertResult = await pool.query(
    `INSERT INTO fnco_influencer.dw_strategy_alignment
     (campaign_id, strategy_id, checks, overall_score, status)
     VALUES ($1, $2, $3, $4, 'completed')
     RETURNING *`,
    [campaignId, strategy?.strategy_id || null, JSON.stringify(checks), overallScore]
  );

  console.log('[runAlignment] 정합성 체크 완료 — 종합:', overallScore, '점');
  return insertResult.rows[0];
}

// ══════════════════════════════════════════════════════════
// Gemini AI 정합성 분석
// ══════════════════════════════════════════════════════════

async function runGeminiAlignmentCheck({ campaign, brandDna, strategyKo, personas, desires, awareness, concepts, arcPhases }) {
  const model = getModel();
  if (!model) throw new Error('Gemini model not available');

  // ── 입력 데이터 요약 (토큰 절약) ──
  const inputSummary = buildAlignmentInput({
    campaign, brandDna, strategyKo,
    personas, desires, awareness, concepts, arcPhases,
  });

  const prompt = buildAlignmentPromptText(inputSummary);

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  const responseText = result.response.text();
  const parsed = parseGeminiJSON(responseText);

  // ── 응답 구조 검증 및 정규화 ──
  return normalizeGeminiChecks(parsed);
}

function buildAlignmentInput({ campaign, brandDna, strategyKo, personas, desires, awareness, concepts, arcPhases }) {
  return {
    brand: {
      name: campaign?.brand_cd || campaign?.campaign_name || '(미설정)',
      product: campaign?.product_name || '(미설정)',
      category: campaign?.category || '(미설정)',
      scheduled_start: campaign?.scheduled_start || null,
      scheduled_end: campaign?.scheduled_end || null,
      dna: brandDna ? {
        mission: brandDna.mission || '',
        tone_of_voice: brandDna.tone_of_voice || brandDna.tone || '',
        visual_style: brandDna.visual_style || '',
        key_messages: brandDna.key_messages || [],
      } : null,
    },
    strategy: strategyKo ? {
      channels: (strategyKo.channels || []).map(ch => ({
        name: ch.name,
        role: ch.role,
        budget_ratio: ch.budget_ratio,
        concept_count: ch.concept_count,
      })),
      messaging: strategyKo.messaging || {},
      timing_phases: (strategyKo.timing?.phases || []).map(p => ({
        name: p.name,
        funnel: p.funnel,
        period: p.period,
        concept_count: p.concept_count,
      })),
      kpis: strategyKo.kpis?.items?.map(k => ({ name: k.name, target: k.target, unit: k.unit })) || [],
    } : null,
    pda: {
      personas: personas.map(p => ({
        code: p.code,
        name: p.name,
        occupation: p.profile_json?.occupation || '',
        pain_points: p.profile_json?.pain_points || [],
      })),
      desires: desires.map(d => ({
        code: d.code,
        name: d.name,
        definition: d.definition || '',
      })),
      awareness: awareness.map(a => ({
        code: a.code,
        name: a.name,
        funnel: a.funnel,
        strategy: a.strategy || '',
      })),
      concepts: concepts.map(c => ({
        name: c.concept_name,
        persona: c.persona_code,
        desire: c.desire_code,
        awareness: c.awareness_code,
        funnel: c.awareness_funnel || c.funnel,
        tone: c.tone,
        head_copy: c.head_copy,
        placement: c.campaign_placement,
        format: c.format,
      })),
    },
    narrative_arc: arcPhases.map(p => ({
      phase: p.phase,
      timing: p.timing,
      purpose: p.purpose,
      message_tone: p.message_tone,
      channels: p.channels,
      kpi: p.kpi,
      awareness_code: p.awareness?.code,
      concept_count: p.concepts?.length || 0,
    })),
  };
}


// ── Gemini JSON 파싱 ──
function parseGeminiJSON(text) {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) cleaned = cleaned.slice(firstBrace);
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);
  return JSON.parse(cleaned);
}

// ── Gemini 응답 정규화 ──
function normalizeGeminiChecks(parsed) {
  const rawChecks = parsed?.checks || parsed || [];
  const arr = Array.isArray(rawChecks) ? rawChecks : Object.values(rawChecks);

  const EXPECTED_DIMENSIONS = [
    { dimension: 'brand_dna_fit', label: '브랜드 DNA 적합성' },
    { dimension: 'pda_coherence', label: 'P.D.A. 일관성' },
    { dimension: 'channel_consistency', label: '채널 전략 정합성' },
    { dimension: 'messaging_tone', label: '메시지 톤 매칭' },
    { dimension: 'timing_feasibility', label: '타이밍 실현 가능성' },
  ];

  return EXPECTED_DIMENSIONS.map(expected => {
    const found = arr.find(c => c.dimension === expected.dimension);
    if (!found) {
      return { ...expected, score: 50, details: '분석 데이터 부족', issues: ['AI 분석 결과가 누락되었습니다'], suggestions: [] };
    }
    return {
      dimension: expected.dimension,
      label: found.label || expected.label,
      score: Math.max(0, Math.min(100, Math.round(Number(found.score) || 50))),
      details: String(found.details || ''),
      issues: Array.isArray(found.issues) ? found.issues.filter(Boolean).slice(0, 5) : [],
      suggestions: Array.isArray(found.suggestions) ? found.suggestions.filter(Boolean).slice(0, 3) : [],
    };
  });
}

// ══════════════════════════════════════════════════════════
// 규칙 기반 폴백 (Gemini 사용 불가 시)
// ══════════════════════════════════════════════════════════

function runRuleBasedAlignment({ brandDna, strategyKo, personas, desires, awareness, concepts, arcPhases, campaign }) {
  return [
    checkBrandDnaFit(brandDna, strategyKo, concepts),
    checkPDACoherence(personas, desires, awareness, concepts),
    checkChannelConsistency(strategyKo, concepts),
    checkMessagingTone(awareness, concepts, strategyKo),
    checkTimingFeasibility(arcPhases, awareness, concepts, campaign),
  ];
}

// ── ① 브랜드 DNA 적합성 ──
function checkBrandDnaFit(brandDna, strategyKo, concepts) {
  let score = 60;
  const issues = [];

  if (!brandDna) {
    issues.push('브랜드 DNA가 설정되지 않았습니다. 캠페인 설정에서 입력해주세요.');
    return { dimension: 'brand_dna_fit', label: '브랜드 DNA 적합성', score: 50, details: '브랜드 DNA 데이터 없이 기본 분석 수행', issues, suggestions: [] };
  }

  const brandTone = brandDna.tone_of_voice || brandDna.tone || '';
  if (brandTone) score += 10;
  else issues.push('브랜드 톤 오브 보이스가 미정의 상태입니다');

  const brandMessages = brandDna.key_messages || [];
  if (brandMessages.length > 0) score += 10;
  else issues.push('브랜드 핵심 메시지가 설정되지 않았습니다');

  if (strategyKo?.messaging?.tone && brandTone) {
    const stratTone = (strategyKo.messaging.tone || '').toLowerCase();
    const bTone = brandTone.toLowerCase();
    const overlap = bTone.split(/[,\s]+/).filter(w => w.length > 1 && stratTone.includes(w));
    if (overlap.length > 0) score += 10;
    else issues.push(`브랜드 톤과 전략 메시징 톤 사이에 키워드 일치가 부족합니다`);
  }

  const uniqueTones = [...new Set(concepts.map(c => c.tone).filter(Boolean))];
  if (uniqueTones.length <= 5) score += 10;
  else issues.push(`컨셉 톤이 ${uniqueTones.length}가지로 과도하게 분산되어 브랜드 일관성이 낮을 수 있습니다`);

  score = Math.min(100, score);
  const details = issues.length === 0
    ? `브랜드 DNA와 전략 메시징이 일관됩니다.`
    : `브랜드 DNA 연관 분석 완료. ${issues.length}건 개선 필요`;

  return { dimension: 'brand_dna_fit', label: '브랜드 DNA 적합성', score, details, issues, suggestions: [] };
}

// ── ② P.D.A. 매트릭스 일관성 ──
function checkPDACoherence(personas, desires, awareness, concepts) {
  let score = 50;
  const issues = [];

  if (personas.length === 0 || desires.length === 0 || concepts.length === 0) {
    issues.push('PDA 데이터가 부족합니다');
    return { dimension: 'pda_coherence', label: 'P.D.A. 일관성', score: 30, details: 'PDA 데이터 부족', issues, suggestions: [] };
  }

  const coveredPersonas = new Set(concepts.map(c => c.persona_code).filter(Boolean));
  score += Math.round((coveredPersonas.size / Math.max(personas.length, 1)) * 15);
  if (coveredPersonas.size < personas.length) issues.push(`${personas.length - coveredPersonas.size}개 페르소나에 연결된 컨셉이 없습니다`);

  const coveredAwareness = new Set(concepts.map(c => c.awareness_code).filter(Boolean));
  score += Math.round((coveredAwareness.size / Math.max(awareness.length, 4)) * 15);
  if (coveredAwareness.size < 4) {
    const missing = ['A1', 'A2', 'A3', 'A4'].filter(a => !coveredAwareness.has(a));
    issues.push(`인지단계 ${missing.join(', ')}에 컨셉이 배정되지 않았습니다`);
  }

  const funnelDist = { TOFU: 0, MOFU: 0, BOFU: 0 };
  concepts.forEach(c => { funnelDist[c.funnel || 'TOFU']++; });
  const total = concepts.length;
  const tofuPct = funnelDist.TOFU / total;
  const bofuPct = funnelDist.BOFU / total;
  if (tofuPct >= 0.15 && tofuPct <= 0.55 && bofuPct >= 0.1 && bofuPct <= 0.4) score += 10;
  else score += 3;

  const pdCombos = new Set(concepts.map(c => `${c.persona_code}_${c.desire_code}`));
  const comboRatio = pdCombos.size / Math.max(personas.length * desires.length, 1);
  if (comboRatio >= 0.5) score += 10;
  else issues.push(`P×D 조합 활용률이 ${Math.round(comboRatio * 100)}%로 낮습니다`);

  score = Math.min(100, score);
  return { dimension: 'pda_coherence', label: 'P.D.A. 일관성', score, details: `${personas.length}P × ${desires.length}D × ${awareness.length}A 매트릭스 분석 완료 (${concepts.length}개 컨셉)`, issues, suggestions: [] };
}

// ── ③ 채널 전략 정합성 ──
function checkChannelConsistency(strategyKo, concepts) {
  let score = 60;
  const issues = [];

  if (!strategyKo?.channels || strategyKo.channels.length === 0) {
    return { dimension: 'channel_consistency', label: '채널 전략 정합성', score: 40, details: '채널 데이터 부족', issues: ['채널 전략이 설정되지 않았습니다'], suggestions: [] };
  }

  const channels = strategyKo.channels;
  if (channels.length >= 3 && channels.length <= 5) score += 15;
  else if (channels.length >= 2) score += 8;

  const maxRatio = Math.max(...channels.map(c => c.budget_ratio || 0));
  if (maxRatio <= 50) score += 10;
  else issues.push(`단일 채널이 예산의 ${maxRatio}%를 차지합니다`);

  const hasTofuShortform = concepts.some(c => c.funnel === 'TOFU' && ['tiktok', 'instagram_reels'].includes(c.campaign_placement));
  const hasBofuConversion = concepts.some(c => c.funnel === 'BOFU' && ['instagram_stories', 'youtube', 'naver_blog'].includes(c.campaign_placement));
  if (hasTofuShortform) score += 8;
  if (hasBofuConversion) score += 7;

  score = Math.min(100, score);
  return { dimension: 'channel_consistency', label: '채널 전략 정합성', score, details: `${channels.length}개 채널 운영, 최대 편중 ${maxRatio}%`, issues, suggestions: [] };
}

// ── ④ 메시지 톤 매칭 ──
function checkMessagingTone(awareness, concepts, strategyKo) {
  let score = 60;
  const issues = [];

  if (concepts.length === 0) {
    return { dimension: 'messaging_tone', label: '메시지 톤 매칭', score: 40, details: '컨셉 데이터 없음', issues: ['컨셉을 먼저 생성해주세요'], suggestions: [] };
  }

  const EXPECTED_TONE_KEYWORDS = {
    A1: ['공감', '일상', '감성', 'empathy', 'relatable'],
    A2: ['교육', '전문', '신뢰', 'educational', 'professional'],
    A3: ['데이터', '결과', '확신', 'confident', 'result'],
    A4: ['긴급', '바이럴', '트렌디', 'urgent', 'playful', 'impact'],
  };

  let toneMatches = 0, toneMismatches = 0;
  for (const c of concepts) {
    const expected = EXPECTED_TONE_KEYWORDS[c.awareness_code] || [];
    if (expected.length === 0 || !c.tone) continue;
    if (expected.some(kw => c.tone.toLowerCase().includes(kw))) toneMatches++;
    else toneMismatches++;
  }

  const toneAccuracy = (toneMatches + toneMismatches) > 0 ? toneMatches / (toneMatches + toneMismatches) : 0.5;
  score += Math.round(toneAccuracy * 20);
  if (toneAccuracy < 0.6) issues.push(`컨셉 톤 중 ${toneMismatches}개가 인지단계 권장 톤과 불일치합니다`);

  const withCopy = concepts.filter(c => c.head_copy && c.head_copy.length > 5).length;
  const copyRatio = withCopy / concepts.length;
  if (copyRatio >= 0.9) score += 10;
  else if (copyRatio >= 0.5) score += 5;

  const avoidList = strategyKo?.messaging?.avoid || [];
  if (avoidList.length > 0) {
    const allCopies = concepts.map(c => c.head_copy || '').join(' ');
    const violated = avoidList.filter(a => allCopies.includes(a));
    if (violated.length === 0) score += 10;
    else issues.push(`금지 표현 위반: "${violated.join('", "')}"`);
  } else {
    score += 5;
  }

  score = Math.min(100, score);
  return { dimension: 'messaging_tone', label: '메시지 톤 매칭', score, details: `톤 적합률 ${Math.round(toneAccuracy * 100)}%, 카피 작성률 ${Math.round(copyRatio * 100)}%`, issues, suggestions: [] };
}

// ── ⑤ 서사 아크 × 타이밍 실현 가능성 ──
function checkTimingFeasibility(arcPhases, awareness, concepts, campaign) {
  let score = 50;
  const issues = [];

  if (arcPhases.length === 0) {
    return { dimension: 'timing_feasibility', label: '타이밍 실현 가능성', score: 40, details: '서사 아크 데이터 없음', issues: ['론칭 서사 아크가 생성되지 않았습니다'], suggestions: [] };
  }

  const expectedPhases = ['tease', 'reveal', 'validate', 'amplify'];
  const missingPhases = expectedPhases.filter(p => !arcPhases.some(ap => ap.phase === p));
  if (missingPhases.length === 0) score += 15;
  else issues.push(`서사 아크에 ${missingPhases.join(', ')} 단계가 누락되었습니다`);

  let emptyPhases = arcPhases.filter(p => (p.concepts || []).length === 0).length;
  if (emptyPhases === 0) score += 15;
  else issues.push(`${emptyPhases}개 단계에 연결된 컨셉이 없습니다`);

  if (campaign?.scheduled_start && campaign?.scheduled_end) {
    const totalDays = Math.round((new Date(campaign.scheduled_end) - new Date(campaign.scheduled_start)) / (1000 * 60 * 60 * 24));
    score += 10;
    if (totalDays < 14) issues.push(`캠페인 기간이 ${totalDays}일로 짧습니다. 최소 3주를 권장합니다`);
    else if (totalDays >= 28) score += 5;
  } else {
    issues.push('캠페인 시작/종료 일자가 설정되지 않았습니다');
  }

  const AWARENESS_ARC_MAP = { A1: 'tease', A2: 'reveal', A3: 'validate', A4: 'amplify' };
  let mappingCorrect = arcPhases.filter(p => p.awareness?.code && AWARENESS_ARC_MAP[p.awareness.code] === p.phase).length;
  if (mappingCorrect === arcPhases.length && arcPhases.length > 0) score += 5;

  score = Math.min(100, score);
  return { dimension: 'timing_feasibility', label: '타이밍 실현 가능성', score, details: `${arcPhases.length}단계 서사 아크, ${emptyPhases === 0 ? '모든 단계에 컨셉 배정 완료' : emptyPhases + '개 빈 단계'}`, issues, suggestions: [] };
}
