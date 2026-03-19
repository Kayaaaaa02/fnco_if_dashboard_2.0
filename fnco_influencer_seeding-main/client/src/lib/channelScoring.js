/**
 * 채널 배분 스코어링 엔진
 * 2단계 다중 요인 스코어링으로 PDA 컨셉을 최적 채널에 배분합니다.
 *
 * 1단계: 페르소나 선호 채널 (가중치 60%)
 * 2단계: 퍼널 × 채널 적합도 (가중치 40%)
 */

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube'];

/* ── 1단계: 페르소나 미디어 선호도 파싱 ── */
function parsePersonaMedia(mediaString) {
  if (!mediaString) return {};
  const lower = mediaString.toLowerCase();
  const scores = {};

  // 1순위 = 1.0, 2순위 = 0.5, 언급 없음 = 0.1
  const found = [];
  if (lower.includes('instagram')) found.push('Instagram');
  if (lower.includes('tiktok')) found.push('TikTok');
  if (lower.includes('youtube')) found.push('YouTube');

  PLATFORMS.forEach((p) => {
    const idx = found.indexOf(p);
    if (idx === 0) scores[p] = 1.0;       // 1순위
    else if (idx > 0) scores[p] = 0.5;    // 2순위 이하
    else scores[p] = 0.1;                  // 미언급
  });

  return scores;
}

/* ── 2단계: 퍼널 × 채널 적합도 매트릭스 ── */
const FUNNEL_FIT = {
  TOFU: { TikTok: 1.0, Instagram: 0.7, YouTube: 0.3 },
  MOFU: { Instagram: 1.0, YouTube: 0.7, TikTok: 0.3 },
  BOFU: { YouTube: 1.0, Instagram: 0.7, TikTok: 0.3 },
};

function getFunnelScore(funnel, platform) {
  return FUNNEL_FIT[funnel]?.[platform] ?? 0.3;
}

/* ── 종합 스코어 계산 ── */
const WEIGHTS = { persona: 0.6, funnel: 0.4 };

/**
 * 컨셉에 대해 각 플랫폼의 적합도 점수를 계산합니다.
 * @param {Object} concept - PDA 컨셉 (funnel 필드 포함)
 * @param {string} personaMedia - 페르소나의 media 문자열 (예: "Instagram, YouTube")
 * @returns {{ platform: string, scores: Object }} 최적 플랫폼과 점수 상세
 */
export function scoreConcept(concept, personaMedia) {
  const personaScores = parsePersonaMedia(personaMedia);
  const results = {};

  PLATFORMS.forEach((platform) => {
    const pScore = personaScores[platform] || 0.1;
    const fScore = getFunnelScore(concept.funnel, platform);

    const total = (pScore * WEIGHTS.persona) + (fScore * WEIGHTS.funnel);

    results[platform] = {
      total: Math.round(total * 100),
      persona: Math.round(pScore * 100),
      funnel: Math.round(fScore * 100),
    };
  });

  // 최고 점수 플랫폼
  let bestPlatform = PLATFORMS[0];
  let bestScore = 0;
  PLATFORMS.forEach((p) => {
    if (results[p].total > bestScore) {
      bestScore = results[p].total;
      bestPlatform = p;
    }
  });

  return { platform: bestPlatform, scores: results, bestScore };
}

/**
 * PDA 컨셉 배열을 최적 채널에 배분합니다.
 * @param {Array} concepts - PDA 컨셉 배열
 * @param {Array} personas - 페르소나 배열 (profile_json.media 포함)
 * @returns {Array} 채널이 할당된 컨셉 배열 (assigned_platform, scoring 필드 추가)
 */
export function assignConceptsToChannels(concepts, personas) {
  const personaMediaMap = {};
  (personas || []).forEach((p) => {
    personaMediaMap[p.persona_id] = p.profile_json?.media || '';
    personaMediaMap[p.code] = p.profile_json?.media || '';
  });

  return concepts.map((concept) => {
    const media = personaMediaMap[concept.persona_id] || personaMediaMap[concept.persona_code] || '';
    const result = scoreConcept(concept, media);
    return {
      ...concept,
      assigned_platform: result.platform,
      scoring: result.scores,
      score_total: result.bestScore,
    };
  });
}

/**
 * 채널별 배분 요약 통계를 생성합니다.
 * @param {Array} assignedConcepts - assignConceptsToChannels 결과
 * @returns {Array} 채널별 요약 [{ channel, count, ratio, concepts, reasoning }]
 */
export function getChannelSummary(assignedConcepts) {
  const total = assignedConcepts.length || 1;
  const grouped = {};
  PLATFORMS.forEach((p) => { grouped[p] = []; });

  assignedConcepts.forEach((c) => {
    const p = c.assigned_platform || 'Instagram';
    if (grouped[p]) grouped[p].push(c);
  });

  const CHANNEL_META = {
    Instagram: {
      color: '#db2777', bg: '#fdf2f8',
      strengths: ['높은 참여율', 'Reels/Carousel 포맷', '비주얼 중심 브랜딩'],
      role: 'MOFU 주력 — 참여·비교·소셜프루프 콘텐츠',
    },
    TikTok: {
      color: '#0f172a', bg: '#f1f5f9',
      strengths: ['바이럴 도달력', '숏폼 공감 콘텐츠', 'Z세대 접점'],
      role: 'TOFU 주력 — 바이럴 인지·공감 콘텐츠',
    },
    YouTube: {
      color: '#dc2626', bg: '#fef2f2',
      strengths: ['긴 시청 시간', '전문 리뷰·교육', '높은 신뢰도'],
      role: 'BOFU 주력 — 리뷰·전환·신뢰 구축 콘텐츠',
    },
  };

  return PLATFORMS.map((p) => {
    const concepts = grouped[p];
    const meta = CHANNEL_META[p];

    // 퍼널 분포
    const funnelDist = {};
    concepts.forEach((c) => {
      const f = c.funnel || 'TOFU';
      funnelDist[f] = (funnelDist[f] || 0) + 1;
    });

    return {
      channel: p,
      count: concepts.length,
      ratio: Math.round((concepts.length / total) * 100),
      concepts,
      funnelDist,
      ...meta,
    };
  }).sort((a, b) => b.count - a.count);
}

/**
 * 퍼널 × 채널 적합도 매트릭스를 반환합니다 (UI 렌더링용).
 */
export function getFunnelFitMatrix() {
  return FUNNEL_FIT;
}

export { PLATFORMS, WEIGHTS };
