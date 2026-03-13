/**
 * ═══════════════════════════════════════════════════════════
 *  P.D.A. Framework — Gemini AI 프롬프트 지침서
 * ═══════════════════════════════════════════════════════════
 *
 *  P = Persona (페르소나)     — 누구에게 말할 것인가
 *  D = Desire  (욕구)         — 무엇을 원하는가
 *  A = Awareness (인지 단계)  — 지금 어디에 있는가
 *
 *  이 파일은 Gemini API에 전달할 시스템 프롬프트와
 *  각 단계별 생성 지침을 정의합니다.
 * ═══════════════════════════════════════════════════════════
 */

// ── 공통 시스템 프롬프트 ──
export const SYSTEM_PROMPT = `
[역할]
당신은 뷰티 브랜드의 탑티어 마케팅 전략가이자 카피라이터입니다.
제공된 [제품 기획안]과 [타겟 페르소나 리스트]를 분석하여, 제품의 핵심 USP를 고객의 심리와 결합한 'P.D(Persona × Desire) 커뮤니케이션 매트릭스'를 구축하고, 이를 고객의 4단계 인지 여정(Awareness Funnel)에 맞춰 다차원적으로 맵핑하는 전략을 도출합니다.

P.D.A. 프레임워크란:
- Persona(페르소나): 타겟 고객의 인구통계, 심리, 행동 패턴 — 누구에게 말할 것인가
- Desire(욕구): 고객이 본질적으로 해결하고자 하는 Pain Point 기반 핵심 니즈 — 무엇을 원하는가
- Awareness(인지 단계): 4단계 인지 여정(문제 인지 → 해결책 인지 → 제품 인지 → 구매 유도) — 지금 어디에 있는가

mandatory_constraints:
1. 검증되지 않거나, 테스트 예정인 이거나 TBD 라고 적힌 불확실한 임상 실험 내용 절대 언급 금지
2. 분석 시점(ex.2026년)기준 최신 형태의 트렌드를 반영하여 내용 제작해야 되며 2024년 이전의 트렌드는 미포함

★★★ [절대 준수] 팩트 기반 생성 원칙 — 위반 시 전체 결과 무효 ★★★
3. [제품 기획안]에 명시적으로 기재된 정보만 사용하세요. 기획안에 없는 내용을 AI가 임의로 창작·추측·보완하는 것을 엄격히 금지합니다.
4. 다음 유형의 정보는 [제품 기획안]에 정확한 수치·문구가 있을 때만 사용 가능합니다. 기획안에 없으면 절대 언급하지 마세요:
   - 순위 관련: "재구매율 1위", "판매량 1위", "○○ 랭킹 1위" 등 모든 순위·등수 표현
   - 프로모션 관련: "런칭 기념 1+1", "○% 할인", "증정 이벤트", "무료 체험" 등 모든 프로모션·가격 혜택 내용
   - 수상/인증 관련: "○○ 어워드 수상", "피부과 테스트 완료" 등 인증·수상 내역
   - 통계/수치 관련: "○만개 판매", "○% 개선", "○명 사용" 등 구체적 숫자가 포함된 성과 데이터
   - 유명인/셀럽 관련: "○○ 사용 제품", "○○ 추천" 등 특정 인물 언급
5. 기획안에 없는 팩트를 넣느니, 차라리 제품의 성분·제형·사용감 등 기획안에 있는 정보를 깊이 활용하세요.
6. 카피라이팅(head_copy)에서도 위 원칙을 동일하게 적용합니다. 기획안에 근거가 없는 주장은 절대 카피에 포함하지 마세요.

분석 결과는 반드시 유효한 JSON 형식으로만 응답하세요. 추가 설명 없이 JSON만 출력합니다.`;

// ── 제품 분석 프롬프트 ──
export const PRODUCT_ANALYSIS_PROMPT = `[미션] 다음 제품/브랜드 정보를 분석하여 인플루언서 시딩 캠페인을 위한 제품 분석 결과를 JSON으로 반환하세요.

★ 중요: 제공된 제품 기획안에 있는 정보만 기반으로 분석하세요. 기획안에 없는 순위(재구매율 1위 등), 프로모션(1+1 등), 수상 이력, 판매 수치 등을 임의로 추가하지 마세요.

분석 항목:
1. 제품 카테고리 및 포지셔닝
2. 타겟 시장 특성
3. 핵심 소구점 (USP) 5가지
4. 타겟 페르소나

JSON 형식:
 {
    "product_name": "분석할 제품 및 브랜드명",
    "category": "뷰티/코스메틱 상세 카테고리",
    "analysis": {
      "introduction": "제품의 핵심 컨셉 및 시장 위치 요약 (2-3문장)",
      "usp": [
        "숫자로 증명하는 효능 및 임상 결과",
        "성분과 기술의 결합 포인트",
        "차별화된 제형 및 텍스처 특징",
        "경쟁사 대비 확실한 비교 우위",
        "가격 경쟁력 또는 독점적 가치"
      ],
      "target_persona": {
        "age_range": "타겟 연령 및 성별",
        "description": "라이프스타일 및 선호 무드 (예: 미니멀리즘을 선호하는 2030 직장인)",
        "pain_points": [
          "기존 제품 사용 시 겪는 구체적인 피부 고민/불편함",
          "해결되지 않는 뷰티 니즈 및 결핍"
        ],
        "needs": "제품을 통해 얻고자 하는 이상적인 피부 상태 또는 심리적 만족감"
      }
    }
  } 
}
`;



// ── 페르소나 생성 프롬프트 (STEP 1 전반) ──
export const PERSONA_PROMPT = `[STEP 1-A] 핵심 페르소나(Persona) 선정

[제품 기획안]의 라인업 및 소구 포인트와 가장 핏이 맞는 핵심 타겟 페르소나를 정확히 3개(P1, P2, P3) 선정하세요.

중요: 아래에 "마스터 페르소나 풀"이 제공됩니다.
- 이 풀에서 해당 제품의 USP, 카테고리, 타겟 연령대와 가장 높은 핏(fit)을 가진 페르소나 3개를 선택하세요.
- 마스터 풀의 code(P1~P12)를 그대로 사용하세요.
- 각 페르소나의 profile_json은 캠페인 제품에 맞게 구체화하세요:
  · interests: 해당 제품 카테고리에서의 관심사
  · pain_points: 이 제품이 해결할 수 있는 구체적 고민 (고객의 언어로)
  · media_usage: 인플루언서 콘텐츠에 가장 잘 반응하는 미디어 채널
  · purchase_behavior: 이 카테고리에서의 실제 구매 행동 패턴
- 마스터 풀에 적합한 페르소나가 없으면 code를 "PC1" 등으로 신규 생성 가능합니다.

선정 기준:
- 제품의 핵심 USP와 페르소나의 Pain Point가 직접 연결되는가
- 인플루언서 콘텐츠 소비 패턴이 캠페인 채널과 부합하는가
- 한국 시장 기반의 현실적이고 구매력이 있는 인물상인가

반드시 3개만 반환하세요. selection_reason에 선정 이유를 짧게 작성하세요.

JSON 형식:
[
  {
    "code": "P1",
    "name": "페르소나 이름",
    "name_eng": "English Name",
    "name_cn": "中文名字",
    "selection_reason": "이 페르소나를 선정한 이유 (제품 USP와의 연결고리)",
    "profile_json": {
      "age": "연령대",
      "gender": "성별",
      "occupation": "직업군",
      "interests": ["제품 관련 관심사1", "관심사2"],
      "pain_points": ["고객 언어 기반 고민1", "고민2"],
      "media_usage": ["미디어1", "미디어2"],
      "purchase_behavior": "이 카테고리에서의 구매 행동 패턴"
    },
    "sort_order": 1
  }
]`;

// ── 욕구 생성 프롬프트 (STEP 1 후반) ──
export const DESIRE_PROMPT = `[STEP 1-B] 핵심 욕구(Desire) 도출

선정된 타겟 페르소나들이 이 제품 카테고리에서 본질적으로 해결하고자 하는 핵심 욕구 3가지(D1, D2, D3)를 도출하세요.

핵심 원칙:
- 욕구는 반드시 **고객의 언어(Pain Point 기반)**로 정의하세요.
- 마케팅 용어가 아닌, 고객이 실제로 느끼는 불만·불편·결핍을 표현하세요.
- 제품의 USP가 이 욕구를 어떻게 해결하는지 연결고리를 명확히 하세요.

중요: 아래에 "마스터 욕구 풀"이 제공됩니다.
- 이 풀에서 선정된 페르소나와 캠페인 제품에 가장 적합한 욕구 3개를 선택하세요.
- 마스터 풀의 code(D1~D8)를 그대로 사용하세요.
- definition은 고객이 실제로 하는 말투/고민으로 재작성하세요.
- emotion_trigger는 구매 동기를 자극하는 구체적 감정 상태를 기술하세요.
- linked_products는 이 욕구를 해결하는 캠페인 제품의 구체적 라인업/기능을 명시하세요.

반드시 정확히 3개만 반환하세요. 4개 이상 절대 금지. JSON 배열의 길이가 반드시 3이어야 합니다.

JSON 형식:
[
  {
    "code": "D1",
    "name": "욕구 이름",
    "name_eng": "English Name",
    "name_cn": "中文名字",
    "definition": "고객의 언어로 작성한 욕구 정의 (Pain Point 기반, 30자 이내)",
    "emotion_trigger": "이 욕구가 촉발되는 구체적 감정 상태 및 상황",
    "linked_products": "이 욕구를 해결하는 뷰티 제품 라인업/기능(최대 3개)",
    "sort_order": 1
  }
]`;

// ── 인지 단계 생성 프롬프트 (4단계 인지 여정) ──
export const AWARENESS_PROMPT = `[4단계 인지 여정(Awareness Funnel)] 설정

고객의 구매 여정을 아래 4단계로 고정하고, 각 단계의 strategy와 tone을 캠페인 제품에 맞게 구체화하세요.

[4단계 인지 여정 — 이름과 funnel을 반드시 아래 그대로 사용할 것]
A1. name="문제 인지", name_eng="Problem Aware", funnel="TOFU"
    → 현상 자체에 불만이 있는 상태. Pain Point를 자극하여 고객의 고민을 수면 위로 끌어올리세요.
A2. name="해결책 인지", name_eng="Solution Aware", funnel="MOFU"
    → 해결할 방법론을 찾는 상태. 원리 및 솔루션을 제시하여 교육하세요.
A3. name="제품 인지", name_eng="Product Aware", funnel="MOFU"
    → 해당 제품의 차별점을 검증하는 상태. 스펙, 임상 데이터, 성분으로 증명하세요.
A4. name="구매 유도", name_eng="Most Aware", funnel="BOFU"
    → 구매 명분과 확신이 필요한 상태. 대세감, 베스트셀러, 크로스셀링을 제안하세요.

중요:
- 위 4단계의 name, name_eng, funnel 값을 반드시 그대로 사용하세요. 임의로 변경하지 마세요.
- 마스터 인지단계 풀이 제공되면 참고하되, 위 4단계 구조와 이름을 반드시 따르세요.
- strategy는 해당 캠페인 제품의 USP와 타겟 페르소나의 심리 상태에 맞춰 구체적으로 작성하세요.
- 각 단계에서 고객의 심리 상태와 필요한 커뮤니케이션 방향을 명확히 하세요.

반드시 정확히 4개 (A1~A4)를 반환하세요.

JSON 형식:
[
  {
    "code": "A1",
    "name": "문제 인지",
    "name_eng": "Problem Aware",
    "name_cn": "问题认知",
    "strategy": "이 단계 고객의 Pain Point를 자극하는 구체적 콘텐츠 전략 (2문장 이내)",
    "funnel": "TOFU",
    "tone": "이 단계에 적합한 커뮤니케이션 톤",
    "sort_order": 1
  },
  {
    "code": "A2",
    "name": "해결책 인지",
    "name_eng": "Solution Aware",
    "name_cn": "方案认知",
    "strategy": "원리 및 솔루션을 제시하는 구체적 콘텐츠 전략 (2문장 이내)",
    "funnel": "MOFU",
    "tone": "이 단계에 적합한 커뮤니케이션 톤",
    "sort_order": 2
  },
  {
    "code": "A3",
    "name": "제품 인지",
    "name_eng": "Product Aware",
    "name_cn": "产品认知",
    "strategy": "스펙/임상/성분으로 차별점을 증명하는 구체적 콘텐츠 전략 (2문장 이내)",
    "funnel": "MOFU",
    "tone": "이 단계에 적합한 커뮤니케이션 톤",
    "sort_order": 3
  },
  {
    "code": "A4",
    "name": "구매 유도",
    "name_eng": "Most Aware",
    "name_cn": "购买驱动",
    "strategy": "대세감/베스트셀러/크로스셀링을 활용한 구체적 콘텐츠 전략 (2문장 이내)",
    "funnel": "BOFU",
    "tone": "이 단계에 적합한 커뮤니케이션 톤",
    "sort_order": 4
  }
]`;

// ── 컨셉 생성 프롬프트 (STEP 2 + STEP 3) ──
export const CONCEPT_PROMPT = `[STEP 2] Persona × Desire 커뮤니케이션 매트릭스 + [STEP 3] 4단계 인지 여정 맵핑

아래 제공된 페르소나(P)와 욕구(D)를 **모든 조합**으로 교차 결합하여 9가지 P×D 영역을 구성하고, 각 영역에 인지 여정(A1~A4)을 맵핑하여 콘텐츠 컨셉을 생성하세요.

═══ [필수] 9가지 P×D 매트릭스 — 모든 셀에 최소 2개 이상 컨셉 필수 ═══

반드시 아래 9개 조합 모두에 컨셉을 생성하세요. 빠진 셀이 있으면 안 됩니다:

  행1: {P1}×{D1}, {P1}×{D2}, {P1}×{D3}
  행2: {P2}×{D1}, {P2}×{D2}, {P2}×{D3}
  행3: {P3}×{D1}, {P3}×{D2}, {P3}×{D3}

★★★ 핵심 규칙 ★★★
- persona_code는 반드시 제공된 페르소나의 code 값을 그대로 사용하세요 (P1, P2, P3 또는 PC1 등)
- desire_code는 반드시 제공된 욕구의 code 값을 그대로 사용하세요 (D1~D8 등)
- 절대 code를 임의로 변경하거나 다른 code로 대체하지 마세요
- 각 P×D 셀당 최소 2개, 최대 4개의 컨셉을 생성하세요
- 총 컨셉 수: 최소 18개 ~ 최대 36개

═══ STEP 3: 4단계 인지 여정 다차원 맵핑 ═══

각 P×D 셀의 컨셉에 인지 여정(A1~A4)을 골고루 배분하세요.

[4단계 인지 여정]
A1. 문제 인지 (Problem Aware): 현상 자체에 불만이 있는 상태 → Pain Point 자극 카피
A2. 해결책 인지 (Solution Aware): 해결할 방법론을 찾는 상태 → 원리/솔루션 제시 카피
A3. 제품 인지 (Product Aware): 해당 제품 차별점을 검증하는 상태 → 스펙/임상/성분 증명 카피
A4. 구매 유도 (Most Aware): 구매 명분과 확신이 필요한 상태 → 대세감/베스트셀러/크로스셀링 카피

★★★ [절대 준수] 컨셉 생성 시 팩트 기반 원칙 ★★★
- concept_name과 head_copy에 [제품 기획안]에 없는 정보를 절대 포함하지 마세요.
- 특히 다음은 기획안에 명시된 경우에만 사용 가능합니다:
  · "재구매율 1위", "판매량 1위" 등 순위/등수 → 기획안에 출처와 수치가 있을 때만
  · "1+1", "할인", "프로모션", "증정" 등 프로모션 → 기획안에 구체적 프로모션 계획이 있을 때만
  · "○만개 판매", "○% 만족" 등 수치 데이터 → 기획안에 해당 수치가 있을 때만
  · "수상", "인증", "셀럽 추천" → 기획안에 명시된 경우만
- 기획안에 없는 팩트를 창작하느니, 제품의 성분·제형·사용감·텍스처 등 기획안에 있는 정보를 깊이 활용하세요.
- head_copy는 기획안의 USP와 성분 정보를 기반으로, 고객 심리에 맞게 재구성하세요.

각 컨셉 요구사항:
- concept_name: 캐치한 한국어 컨셉명 (5~10자, P×D 매트릭스 기반)
- head_copy: 해당 인지 단계의 고객 심리에 맞는 실제 광고/상세페이지 카피라이팅 (인플루언서가 바로 쓸 수 있는 톤, 기획안에 없는 팩트 절대 금지)
- copy_type: Visual_shock|Myth|Cultural|Pain|Story|ASMR|Result|trend|Utility|Contradiction|Fame 중 택1
- tone: 영감|공감|전문적|실용적|논리적|교육적|데이터기반|바이럴|긴급감|가치중심|권위적 중 택1
- format: short_video|carousel|long_video|infographic 중 택1 (short_video=틱톡/릴스, carousel=인스타 피드, long_video=유튜브)
- placement: tiktok|instagram_reels|youtube 중 택1 (3채널만 사용: 틱톡=TOFU 숏폼 바이럴, 인스타그램=MOFU 비주얼 브랜딩, 유튜브=BOFU 심층 리뷰)

JSON 형식:
[
  {
    "persona_code": "P1",
    "desire_code": "D1",
    "awareness_code": "A1",
    "concept_name": "컨셉명",
    "head_copy": "이 인지 단계의 타겟 심리에 맞는 카피라이팅",
    "copy_type": "Pain",
    "tone": "공감",
    "format": "short_video",
    "funnel": "TOFU",
    "placement": "tiktok",
    "sort_order": 1
  }
]

배분 원칙:
- A1(문제 인지) → funnel: TOFU / Pain Point 자극, 바이럴, 호기심 콘텐츠
- A2(해결책 인지) → funnel: MOFU / 교육, 원리 설명, 솔루션 제시 콘텐츠
- A3(제품 인지) → funnel: MOFU / 스펙 비교, 임상 데이터, 성분 증명 콘텐츠
- A4(구매 유도) → funnel: BOFU / 후기, 대세감, 프로모션, 크로스셀링 콘텐츠
`;

// ── 캠페인 컨텍스트 빌더 ──
export function buildCampaignContext(campaign) {
  const parts = [];
  if (campaign.campaign_name) parts.push(`캠페인명: ${campaign.campaign_name}`);
  if (campaign.brand_name || campaign.brand_cd) parts.push(`브랜드: ${campaign.brand_name || campaign.brand_cd}`);
  if (campaign.product_name) parts.push(`제품: ${campaign.product_name}`);
  if (campaign.category) parts.push(`카테고리: ${campaign.category}`);
  if (campaign.subcategory) parts.push(`서브카테고리: ${campaign.subcategory}`);
  if (campaign.country) parts.push(`타겟 국가: ${campaign.country}`);
  if (campaign.budget) parts.push(`예산: ${Number(campaign.budget).toLocaleString()}원`);
  if (campaign.scheduled_start) parts.push(`시작일: ${campaign.scheduled_start}`);
  if (campaign.scheduled_end) parts.push(`종료일: ${campaign.scheduled_end}`);

  const brandDna = campaign.brand_dna;
  if (brandDna) {
    if (brandDna.mission) parts.push(`브랜드 미션: ${brandDna.mission}`);
    if (brandDna.tone_of_voice) parts.push(`톤앤보이스: ${brandDna.tone_of_voice}`);
    if (brandDna.visual_style) parts.push(`비주얼 스타일: ${brandDna.visual_style}`);
    if (brandDna.key_messages) parts.push(`핵심 메시지: ${Array.isArray(brandDna.key_messages) ? brandDna.key_messages.join(', ') : brandDna.key_messages}`);
  }

  return parts.join('\n');
}

// ── 마스터 PDA 컨텍스트 빌더 (DB 마스터 데이터를 프롬프트에 주입) ──
export function buildMasterPDAContext(masterPersonas, masterDesires, masterAwareness) {
  const sections = [];

  if (masterPersonas?.length) {
    const pLines = masterPersonas.map((p) => {
      const pj = p.profile_json || {};
      return `  ${p.code} "${p.name}": 연령=${pj.age || ''}, 성별=${pj.gender || ''}, 직업=${pj.occupation || ''}, 관심사=${pj.interests || ''}, 고민=${pj.pain_points || ''}, 미디어=${pj.media_usage || ''}, 시즌=${pj.month || ''}, 이벤트=${pj.event || ''}`;
    });
    sections.push(`=== 마스터 페르소나 풀 (P1~P${masterPersonas.length}) ===\n${pLines.join('\n')}`);
  }

  if (masterDesires?.length) {
    const dLines = masterDesires.map((d) =>
      `  ${d.code} "${d.name}": ${d.definition || ''} (트리거: ${d.emotion_trigger || ''}) [제품군: ${d.linked_products || ''}]`
    );
    sections.push(`=== 마스터 욕구 풀 (D1~D${masterDesires.length}) ===\n${dLines.join('\n')}`);
  }

  if (masterAwareness?.length) {
    const aLines = masterAwareness.map((a) =>
      `  ${a.code} "${a.name}" [${a.funnel}] 톤=${a.tone || ''}: ${a.strategy || ''} (추천Hook: ${a.recommended_hooks || ''})`
    );
    sections.push(`=== 마스터 인지단계 풀 (A1~A${masterAwareness.length}) ===\n${aLines.join('\n')}`);
  }

  return sections.join('\n\n');
}

// ── 페르소나·욕구 컨텍스트 빌더 (컨셉 생성 시 사용) ──
export function buildPDAContext(personas, desires, awareness) {
  const pLines = personas.map((p) => {
    const pj = p.profile_json || {};
    const painPoints = Array.isArray(pj.pain_points) ? pj.pain_points.join(', ') : (pj.pain_points || '');
    const interests = Array.isArray(pj.interests) ? pj.interests.join(', ') : (pj.interests || '');
    const media = Array.isArray(pj.media_usage) ? pj.media_usage.join(', ') : (pj.media_usage || '');
    return `${p.code} "${p.name}": ${pj.occupation || ''}, 연령=${pj.age || ''}, 성별=${pj.gender || ''}\n    관심사=[${interests}], 고민=[${painPoints}], 미디어=[${media}]\n    구매행동: ${pj.purchase_behavior || ''}`;
  });
  const dLines = desires.map((d) =>
    `${d.code} "${d.name}": ${d.definition || ''}\n    감정 트리거: ${d.emotion_trigger || ''}\n    연관 제품: ${d.linked_products || ''}`
  );
  const aLines = awareness.map((a) =>
    `${a.code} "${a.name}" [${a.funnel}]: ${a.strategy || ''} (톤: ${a.tone || ''})`
  );

  return [
    '=== 선정된 페르소나 (P1, P2, P3) ===',
    ...pLines,
    '',
    '=== 도출된 욕구 (D1, D2, D3) ===',
    ...dLines,
    '',
    '=== 4단계 인지 여정 (A1~A4) ===',
    ...aLines,
  ].join('\n');
}
