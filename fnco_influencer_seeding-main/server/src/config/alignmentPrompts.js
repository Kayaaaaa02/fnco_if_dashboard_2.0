/**
 * 전략 정합성 검증 — Gemini 프롬프트
 */

// ── 시스템 역할 ──
export const ALIGNMENT_SYSTEM_ROLE = `당신은 인플루언서 시딩 캠페인 전략의 정합성(Alignment)을 분석하는 전문가 AI입니다.`;

// ── 5개 분석 차원 정의 ──
export const ALIGNMENT_DIMENSIONS = `
1. brand_dna_fit (브랜드 DNA 적합성)
   - 브랜드 미션/톤/비주얼과 전략·컨셉의 톤·메시지가 일관되는지
   - 컨셉 head_copy가 브랜드 톤에 부합하는지
   - 컨셉 톤이 과도하게 분산되어 브랜드 일관성을 해치지 않는지
   - 브랜드 key_messages가 전략에 반영되었는지

2. pda_coherence (P.D.A. 매트릭스 일관성)
   - 모든 페르소나에 컨셉이 연결되어 있는지
   - A1(문제인지)→A2(해결책인지)→A3(제품인지)→A4(구매유도) 전 단계에 컨셉이 배정되어 있는지
   - TOFU/MOFU/BOFU 퍼널 분포가 균형적인지 (TOFU 20~50%, BOFU 15~35% 권장)
   - P(페르소나)×D(욕구) 조합 활용도가 충분한지

3. channel_consistency (채널 전략 정합성)
   - 채널 다각화가 적절한지 (2~5개 채널 권장)
   - 특정 채널에 예산이 과도하게 편중되지 않았는지
   - TOFU 단계에 숏폼 채널(TikTok/Instagram Reels)이 배치되었는지
   - BOFU 단계에 전환 채널(YouTube/Blog/Stories)이 배치되었는지
   - 각 채널의 역할이 퍼널 단계와 맞는지

4. messaging_tone (메시지 톤 매칭)
   - A1 컨셉: 공감·일상적 톤이 적합
   - A2 컨셉: 교육·전문적 톤이 적합
   - A3 컨셉: 확신·결과 중심 톤이 적합
   - A4 컨셉: 긴급·바이럴·트렌디 톤이 적합
   - head_copy가 해당 인지 단계의 소구점에 맞게 작성되었는지
   - 전략의 avoid 키워드가 실제 카피에서 사용되지 않았는지

5. timing_feasibility (타이밍 실현 가능성)
   - 론칭 서사 아크가 tease→reveal→validate→amplify 4단계를 모두 갖추었는지
   - 각 아크 단계에 컨셉이 충분히 배정되어 있는지
   - 캠페인 기간이 4단계 서사 아크를 운영하기에 충분한지 (최소 3주 권장)
   - 인지 단계(A1~A4)와 아크 단계(tease~amplify)의 매핑이 논리적인지
   - KPI가 퍼널 단계와 채널 특성에 맞게 설정되었는지`;

// ── 응답 JSON 형식 ──
export const ALIGNMENT_RESPONSE_FORMAT = `{
  "checks": [
    {
      "dimension": "brand_dna_fit",
      "label": "브랜드 DNA 적합성",
      "score": 0~100 사이 정수,
      "details": "1~2문장으로 핵심 분석 요약",
      "issues": ["구체적인 문제점/개선 제안 (최대 3개)"],
      "suggestions": ["실행 가능한 개선 액션 (최대 2개)"]
    },
    {
      "dimension": "pda_coherence",
      "label": "P.D.A. 일관성",
      "score": 0~100,
      "details": "...",
      "issues": [],
      "suggestions": []
    },
    {
      "dimension": "channel_consistency",
      "label": "채널 전략 정합성",
      "score": 0~100,
      "details": "...",
      "issues": [],
      "suggestions": []
    },
    {
      "dimension": "messaging_tone",
      "label": "메시지 톤 매칭",
      "score": 0~100,
      "details": "...",
      "issues": [],
      "suggestions": []
    },
    {
      "dimension": "timing_feasibility",
      "label": "타이밍 실현 가능성",
      "score": 0~100,
      "details": "...",
      "issues": [],
      "suggestions": []
    }
  ]
}`;

// ── 채점 기준 ──
export const ALIGNMENT_SCORING_CRITERIA = `
- 90~100: 우수 — 문제 없음
- 80~89: 양호 — 경미한 개선 필요
- 70~79: 주의 — 중요한 개선 필요
- 60~69: 미흡 — 전략 수정 권장
- 60 미만: 위험 — 전략 재설계 필요`;

// ── 추가 지시 ──
export const ALIGNMENT_INSTRUCTIONS = `채점 시 실제 데이터를 면밀히 분석하세요. 데이터가 없거나 부족한 차원은 낮은 점수를 부여하세요.
issues와 suggestions는 한국어로, 구체적이고 실행 가능하게 작성하세요.`;

/**
 * 최종 프롬프트 조립
 * @param {Object} input - buildAlignmentInput() 결과
 * @returns {string} Gemini에 전달할 전체 프롬프트
 */
export function buildAlignmentPromptText(input) {
  return `${ALIGNMENT_SYSTEM_ROLE}

아래 캠페인 데이터를 분석하여 5개 차원에서 정합성을 점검하고, 각 차원별 점수(0~100)와 구체적인 이슈·개선 제안을 반환하세요.

═══ 분석 대상 데이터 ═══
${JSON.stringify(input, null, 2)}

═══ 5개 분석 차원 ═══
${ALIGNMENT_DIMENSIONS}

═══ 응답 형식 (반드시 이 JSON 구조를 따르세요) ═══
${ALIGNMENT_RESPONSE_FORMAT}

═══ 채점 기준 ═══
${ALIGNMENT_SCORING_CRITERIA}

${ALIGNMENT_INSTRUCTIONS}`;
}
