/**
 * DEMO_MODE 목업 데이터 + fetch 인터셉터
 *
 * VITE_DEMO_MODE=true 일 때 모든 /api/* 요청을 가로채 목업 데이터를 반환한다.
 * 기존 data.js의 13개 목업을 re-export하고, 나머지 29개를 새로 정의한다.
 */

// ── 기존 목업 re-export ────────────────────────────
import {
  MOCK_CAMPAIGN_ID,
  MOCK_VELVET_TINT_ID,
  mockCampaigns,
  mockCampaign,
  mockCampaignHub,
  mockPDA,
  mockStrategy,
  mockStrategyHistory,
  mockCalendar,
  mockCreatives,
  mockInfluencers,
  mockOutreach,
  mockLaunchSchedule,
  mockMonitorDashboard,
  mockPDAHeatmap,
  mockFatigueReport,
  mockVelvetTintCampaign,
  mockVelvetTintHub,
  mockVelvetTintPDA,
  mockVelvetTintMonitorDashboard,
  mockVelvetTintPDAHeatmap,
  mockVelvetTintFatigueReport,
} from './data.js';

export {
  MOCK_CAMPAIGN_ID,
  MOCK_VELVET_TINT_ID,
  mockCampaigns,
  mockCampaign,
  mockCampaignHub,
  mockPDA,
  mockStrategy,
  mockStrategyHistory,
  mockCalendar,
  mockCreatives,
  mockInfluencers,
  mockOutreach,
  mockLaunchSchedule,
  mockMonitorDashboard,
  mockPDAHeatmap,
  mockFatigueReport,
  mockVelvetTintCampaign,
  mockVelvetTintHub,
  mockVelvetTintPDA,
  mockVelvetTintMonitorDashboard,
  mockVelvetTintPDAHeatmap,
  mockVelvetTintFatigueReport,
};

// ── 신규 목업 데이터 ────────────────────────────────

// ─ Notifications ─
export const mockNotifications = [
  { id: 1, type: 'ai_complete', title: 'PDA 프레임워크 생성 완료', message: '바닐라코 2025 S/S 캠페인의 PDA 분석이 완료되었습니다.', read: false, created_at: '2025-03-10T14:30:00Z', campaign_id: MOCK_CAMPAIGN_ID },
  { id: 2, type: 'outreach_response', title: '인플루언서 회신 도착', message: 'Olivia Yang(@olafflee)님이 협업 제안에 수락하였습니다.', read: false, created_at: '2025-03-09T16:00:00Z', campaign_id: MOCK_CAMPAIGN_ID },
  { id: 3, type: 'launch_published', title: '콘텐츠 퍼블리시 완료', message: '쌩얼 자신감 챌린지 Reels가 Instagram에 게시되었습니다.', read: true, created_at: '2025-03-03T18:05:00Z', campaign_id: MOCK_CAMPAIGN_ID },
  { id: 4, type: 'fatigue_alert', title: '피로도 경고', message: '"올리브영 1위의 이유" 컨셉의 CTR이 하락 추세입니다.', read: true, created_at: '2025-03-08T09:00:00Z', campaign_id: MOCK_CAMPAIGN_ID },
];

// ─ Templates ─
export const mockTemplates = [
  { id: 'TPL_001', name: '뷰티 시딩 기본 템플릿', category: 'beauty', description: '화장품 인플루언서 시딩 캠페인 기본 구조. PDA → 크리에이티브 → 론칭 전 과정 포함.', created_at: '2025-01-15T09:00:00Z', phases_included: [1,2,3,4,5,6,7,8,9], phase_count: 9, brand_dna: { tone: '트렌디하면서 신뢰감 있는' } },
  { id: 'TPL_002', name: '더마 코스메틱 리뷰 템플릿', category: 'derma', description: '피부과 전문의 기반 리뷰 캠페인. 성분 분석 + 비포/애프터 중심.', created_at: '2025-02-01T10:00:00Z', phases_included: [1,2,3,4,5], phase_count: 5, brand_dna: { tone: '전문적이고 과학적인' } },
  { id: 'TPL_003', name: '숏폼 바이럴 템플릿', category: 'viral', description: 'TikTok/Reels 중심 바이럴 시딩. 15초 후킹 → 챌린지 확산.', created_at: '2025-02-10T11:00:00Z', phases_included: [1,2,3,4,5,6,7,8], phase_count: 8, brand_dna: { tone: '유쾌하고 중독성 있는' } },
];

// ─ Audit Log ─
export const mockAuditLog = [
  { id: 1, entity_type: 'campaign', entity_id: MOCK_CAMPAIGN_ID, action: 'create', actor: '김마케터', details: '캠페인 "바닐라코 2025 S/S 시딩" 생성', created_at: '2025-03-01T09:00:00Z' },
  { id: 2, entity_type: 'pda', entity_id: MOCK_CAMPAIGN_ID, action: 'generate', actor: 'AI System', details: 'PDA 프레임워크 자동 생성 (페르소나 3, 욕구 4, 컨셉 12)', created_at: '2025-03-02T10:30:00Z' },
  { id: 3, entity_type: 'strategy', entity_id: MOCK_CAMPAIGN_ID, action: 'approve', actor: '박팀장', details: '전략 v2 승인 완료', created_at: '2025-03-03T14:00:00Z' },
  { id: 4, entity_type: 'influencer', entity_id: MOCK_CAMPAIGN_ID, action: 'match', actor: 'AI System', details: '인플루언서 6명 P.D.A. 매칭 완료 (평균 점수 87.5)', created_at: '2025-03-04T11:00:00Z' },
  { id: 5, entity_type: 'outreach', entity_id: MOCK_CAMPAIGN_ID, action: 'send', actor: '이담당', details: 'Olivia Yang 외 2명에게 협업 제안 발송', created_at: '2025-03-05T15:00:00Z' },
  { id: 6, entity_type: 'creative', entity_id: MOCK_CAMPAIGN_ID, action: 'approve', actor: '박팀장', details: '크리에이티브 3건 일괄 승인', created_at: '2025-03-06T16:30:00Z' },
  { id: 7, entity_type: 'launch', entity_id: MOCK_CAMPAIGN_ID, action: 'publish', actor: 'System', details: 'Instagram Reels 2건 자동 퍼블리시', created_at: '2025-03-07T18:00:00Z' },
  { id: 8, entity_type: 'monitor', entity_id: MOCK_CAMPAIGN_ID, action: 'report', actor: 'AI System', details: '주간 성과 리포트 생성 (ROAS 3.2배)', created_at: '2025-03-10T09:00:00Z' },
];

// ─ Optimizations ─
export const mockOptimizations = [
  { action_id: 'OPT_001', type: 'budget', title: '예산 재배분 추천', description: 'TikTok Reels CTR이 Instagram 대비 2.1배 높습니다. TikTok 예산을 30% 증액하면 전체 ROAS가 0.8배 개선될 것으로 예측됩니다.', impact_score: 85, status: 'pending', recommended_action: 'TikTok 예산 +4,500만원, Instagram -3,000만원', created_at: '2025-03-10T08:00:00Z' },
  { action_id: 'OPT_002', type: 'creative_refresh', title: '크리에이티브 교체 필요', description: '"올리브영 1위의 이유" 컨셉의 CTR이 4일 연속 하락 중입니다. 새로운 훅 라인으로 교체를 권장합니다.', impact_score: 72, status: 'pending', recommended_action: '신규 훅 "3초만에 피부결 달라지는 비결" 적용', created_at: '2025-03-09T14:00:00Z' },
  { action_id: 'OPT_003', type: 'audience', title: '오디언스 확장 기회', description: '25-34세 여성 외에 18-24세 대학생 세그먼트에서 자연 유입이 감지되었습니다.', impact_score: 68, status: 'applied', recommended_action: '대학생 타겟 맞춤 컨셉 1건 추가 제작', created_at: '2025-03-08T10:00:00Z' },
  { action_id: 'OPT_004', type: 'timing', title: '게시 시간 최적화', description: '목요일 오후 8-9시 게시 콘텐츠의 인게이지먼트가 평균 대비 1.7배 높습니다.', impact_score: 55, status: 'applied', recommended_action: '주요 콘텐츠 게시를 목/금 20:00으로 조정', created_at: '2025-03-07T16:00:00Z' },
];

// ─ Early Signals ─
export const mockEarlySignals = [
  { signal_id: 'SIG_001', type: 'fatigue', severity: 'high', title: 'CTR 급락 감지', description: '"쌩얼 자신감" 컨셉 CTR이 72시간 내 1.8% → 0.9%로 하락', metric_name: 'CTR', current_value: 0.9, threshold: 1.2, detected_at: '2025-03-10T06:00:00Z' },
  { signal_id: 'SIG_002', type: 'viral', severity: 'low', title: '바이럴 잠재력 감지', description: 'Olivia Yang TikTok 공유율이 평균 대비 4.2배 — 챌린지 확산 가능성', metric_name: 'Share Rate', current_value: 8.4, threshold: 2.0, detected_at: '2025-03-09T20:00:00Z' },
  { signal_id: 'SIG_003', type: 'engagement_spike', severity: 'medium', title: '댓글 급증', description: '"민감성 피부 루틴" 콘텐츠에 24시간 내 댓글 340건 유입', metric_name: 'Comments', current_value: 340, threshold: 100, detected_at: '2025-03-09T12:00:00Z' },
  { signal_id: 'SIG_004', type: 'competitor', severity: 'medium', title: '경쟁사 캠페인 감지', description: '에스트라가 유사 제품 시딩 캠페인을 런칭한 것으로 감지됨', metric_name: 'Competitor Activity', current_value: 1, threshold: 0, detected_at: '2025-03-08T15:00:00Z' },
];

// ─ UGC Content ─
export const mockUGCContent = [
  { ugc_id: 'UGC_001', platform: 'instagram', author: '@skincare_mina', author_name: '미나', content_url: 'https://instagram.com/p/mock1', thumbnail: 'https://picsum.photos/seed/ugc1/300/300', engagement: { likes: 2340, comments: 89, shares: 45 }, permission_status: 'approved', amplify_status: 'active', discovered_at: '2025-03-08T10:00:00Z' },
  { ugc_id: 'UGC_002', platform: 'tiktok', author: '@beauty_jihye', author_name: '지혜', content_url: 'https://tiktok.com/@beauty_jihye/mock2', thumbnail: 'https://picsum.photos/seed/ugc2/300/300', engagement: { likes: 5670, comments: 234, shares: 890 }, permission_status: 'approved', amplify_status: 'boosted', discovered_at: '2025-03-07T18:00:00Z' },
  { ugc_id: 'UGC_003', platform: 'youtube', author: '@suyeon_beauty', author_name: '수연', content_url: 'https://youtube.com/watch?v=mock3', thumbnail: 'https://picsum.photos/seed/ugc3/300/300', engagement: { likes: 1230, comments: 67, shares: 23 }, permission_status: 'pending', amplify_status: 'none', discovered_at: '2025-03-06T14:00:00Z' },
  { ugc_id: 'UGC_004', platform: 'instagram', author: '@daily_yuna', author_name: '유나', content_url: 'https://instagram.com/p/mock4', thumbnail: 'https://picsum.photos/seed/ugc4/300/300', engagement: { likes: 890, comments: 34, shares: 12 }, permission_status: 'rejected', amplify_status: 'none', discovered_at: '2025-03-05T09:00:00Z' },
  { ugc_id: 'UGC_005', platform: 'tiktok', author: '@glow_hana', author_name: '하나', content_url: 'https://tiktok.com/@glow_hana/mock5', thumbnail: 'https://picsum.photos/seed/ugc5/300/300', engagement: { likes: 3450, comments: 156, shares: 234 }, permission_status: 'approved', amplify_status: 'active', discovered_at: '2025-03-09T22:00:00Z' },
];

// ─ UGC Creators ─
export const mockUGCCreators = [
  { creator_id: 'UGCC_001', name: '미나', handle: '@skincare_mina', platform: 'instagram', followers: 45000, ugc_count: 3, quality_score: 92, conversion_status: 'converted' },
  { creator_id: 'UGCC_002', name: '지혜', handle: '@beauty_jihye', platform: 'tiktok', followers: 128000, ugc_count: 5, quality_score: 88, conversion_status: 'converted' },
  { creator_id: 'UGCC_003', name: '수연', handle: '@suyeon_beauty', platform: 'youtube', followers: 67000, ugc_count: 2, quality_score: 85, conversion_status: 'potential' },
  { creator_id: 'UGCC_004', name: '유나', handle: '@daily_yuna', platform: 'instagram', followers: 23000, ugc_count: 1, quality_score: 70, conversion_status: 'none' },
  { creator_id: 'UGCC_005', name: '하나', handle: '@glow_hana', platform: 'tiktok', followers: 89000, ugc_count: 4, quality_score: 91, conversion_status: 'potential' },
];

// ─ AI Plan: Product Analysis ─
export const mockProductAnalysis = {
  plan_doc_id: 'PLANDOC_001',
  product_name: '클린잇제로 클렌징밤',
  category: '클렌징 > 클렌징밤',
  summary: '전 세계 8,000만 개 판매 신화를 기록한 대한민국 No.1 클렌징 밤으로, 2024년 4월 더욱 강력해진 세정력과 스킨케어 효능을 더해 리뉴얼된 올인원 딥 클렌저입니다.',
  usp: [
    '기존 대비 94%에서 97%로 업그레이드된 세정력 및 초미세먼지 97.34% 세정 임상 완료',
    '바닐라코 독자 성분 Spa-Biome(프랑스 온천수+유산균) 적용으로 세안 후 보습량 32.22% 개선',
    '피부 고민별 4종 라인업(오리지널, 포어, 카밍, 너리싱) 및 비건 인증(V-Label) 획득',
    '자석의 원리를 이용한 Micro-capture Technology로 노폐물만 골라 흡착하는 정밀 세정',
    '흘러내림 없는 셔벗 제형이 오일을 거쳐 우윳빛 유화 과정으로 변하는 3단계 트랜스포밍 텍스처',
  ],
  target_persona: {
    target: '2030 여성 및 남성',
    pain_points: [
      '이중, 삼중 세안의 번거로움과 세안 후 느껴지는 극심한 피부 당김',
      '클렌징 오일의 흘러내림과 눈 시림, 잔여감으로 인한 트러블 걱정',
    ],
    needs: '단 한 번의 사용으로 워터프루프 메이크업까지 지워지면서도 스킨케어를 한 듯 촉촉하고 매끈한 피부 결',
  },
  format_strategy: [
    { format: 'Reels/Shorts', ratio: 45, reason: '15초 후킹 → 제품 텍스처 시각화 최적' },
    { format: 'TikTok', ratio: 30, reason: '챌린지 확산 + 댓글 인게이지먼트 극대화' },
    { format: 'YouTube', ratio: 15, reason: '7일 루틴 장편 콘텐츠 + SEO 장기 유입' },
    { format: 'Blog', ratio: 10, reason: '성분 분석 + 비교 리뷰 텍스트 콘텐츠' },
  ],
  trending_top3: [
    { rank: 1, title: '셔벗 텍스처 ASMR 클렌징', views: '2.3M', platform: 'TikTok', trend_score: 98 },
    { rank: 2, title: '클렌징밤 비교 리뷰 (5종)', views: '1.8M', platform: 'YouTube', trend_score: 91 },
    { rank: 3, title: '쌩얼 루틴 GRWM', views: '1.2M', platform: 'Instagram', trend_score: 87 },
  ],
};

// ─ AI Plan: Refined Data (6 sections) ─
export const mockRefinedData = {
  meta: {
    title: '릴스 시딩 가이드',
    product: '클린잇제로 클렌징밤',
    platform: 'Instagram',
    period: '2026.02.13 - 2026.02.27',
    promotion: '프로모션 내용 없음',
  },
  data: {
    emotion: {
      target: '2035 남녀, 피부 컨디션 기복이 심하고 성분에 민감한 클렌징 유목민',
      concept: '"민감 장벽의 기적", 2주 만에 완성되는 저자극 정착 루틴',
      mention: {
        account: '인스타그램 @banilaco_official',
        hashtags: '#광고 #바닐라코 #클린잇제로 #클렌징밤 #민감피부 #클렌징추천',
      },
    },
    hooking: {
      logic: '화장대 위 수많은 실패작(소품)들을 배경으로 \'고백형 나레이션\'을 던지며 시작합니다. 이후 셔벗 밤 제형이 물과 만나 미세 거품으로 변하는 시각적 쾌감을 거쳐, 세안 직후의 붉은 기 없는 \'After Only\' 상태를 확대하여 보여줌으로써 제품의 진정 효능을 증명합니다.',
      triggers: [
        { type: '시각', content: '셔벗 밤이 펌핑되는 찰나의 매크로 샷과 조밀한 거품이 모공을 덮는 초근접 촬영' },
        { type: '소리', content: '펌핑기의 \'착\' 소리와 거품이 터지는 톡톡거리는 고감도 ASMR' },
        { type: '제스처', content: '세안 후 수건으로 닦지 않은 젖은 얼굴 위로 손가락을 튕겨 탄력과 수분감을 증명하는 동작' },
      ],
      focus: '비포의 붉은 피부를 강조하기보다, 제품 사용 후 \'원래 피부가 좋은 사람\'처럼 보이는 맑고 투명한 상태에 집중합니다. 특히 약산성 클렌저의 고질적 단점인 \'미끈거림\'이 전혀 없음을 강조하는 산뜻한 마무리 동작에 초점을 맞춥니다.',
    },
    contentGuide: {
      visual: {
        lighting: [
          'Main: 45도 측면에서 들어오는 소프트 박스로 피부 요철을 지우고 결을 매끄럽게 표현',
          'Fill: 반대편 화이트 반사판을 배치하여 그림자를 부드럽게 중화',
          'Rim Light: 제품 뒤편에서 셔벗 밤 제형을 투과하는 강한 조명을 배치하여 \'맑은 청량감\' 극대화',
          '주의: 화장실의 노란 조명은 배제하고 5600K 이상의 화이트/데이라이트 톤 유지',
        ],
        miseEnScene: {
          background: '화이트 톤의 깨끗한 욕실 또는 미니멀한 화장대',
          props: '투명한 유리잔(물), 연그린 빛 식물(시카 상징), 화이트 타월',
          costume: '깨끗한 화이트 슬리브리스 또는 실크 소재의 로브',
        },
      },
      copywriting: {
        onScreen: [
          { position: '상단', text: '화장품 아무거나 못 쓰는 사람?' },
          { position: '중앙', text: '드디어 정착했습니다' },
          { position: '하단', text: '2주 만에 바뀐 피부 장벽' },
        ],
        caption: {
          firstLine: '클렌징 유목민들, 딱 15초만 집중하세요.',
          body: '약산성은 세정력이 약하다? 미끈거린다? 바닐라코가 그 편견 완전히 깨버렸습니다. 블라인드 테스트 1위의 위엄, 직접 써보니 알겠더라고요. 시카와 세라마이드의 결합으로 세안하면서 장벽을 쌓는 기분!',
          cta: '지금 올리브영에서 \'클렌징밤\'를 검색하고 민감 피부 탈출하세요!',
        },
      },
      uploadStrategy: {
        thumbnail: '깨끗한 민낯의 인플루언서가 제품을 얼굴 옆에 대고 안도하는 표정 + \'인생 클렌저 정착\' 텍스트',
        hashtags: '#바닐라코 #클렌징밤 #민감성피부 #올리브영추천템 #피부장벽케어',
        firstComment: '"진짜 예민한 제 피부가 2주 동안 증명했어요. 궁금한 점은 댓글로 남겨주세요! (DM으로 구매 링크 보내드릴게요)"',
      },
    },
    scenario: {
      title: '[민감 피부 유목민 종료] 2주 만에 찾은 인생 클렌저',
      timeline: [
        {
          section: 'HOOK',
          time: '00–03s',
          visual: '[Extreme Close-up] 화장대 위 여러 클렌징 제품들을 뒤로 밀어내고, 바닐라코 클렌징밤를 정중앙에 배치. 인플루언서의 고민 섞인 표정에서 확신에 찬 표정으로 전환.',
          audio: '(NAR) "화장품 아무거나 못 쓰는 사람? 저예요. 드디어 정착했습니다."',
          emotion: '#해방감 #확신\n시청자의 페인 포인트를 즉각적으로 건드려 공감대 형성',
        },
        {
          section: 'Middle',
          time: '03–09s',
          visual: '[Macro Shot] 셔벗 밤 제형이 손바닥 위로 펌핑되는 순간 + 물과 섞여 몽글몽글한 미세 거품이 생성되는 과정. [Full Face] 얼굴에 부드럽게 롤링하며 편안해하는 표정.',
          audio: '(Effect) 쫀득한 밤 펌핑 소리 + 물소리 ASMR (NAR) "약산성인데 세정력은 완벽하고, 미끈거림은 제로예요."',
          emotion: '#매끈함 #신뢰\n제형의 시각적 쾌감과 제품의 기능적 차별성을 동시에 전달',
        },
        {
          section: 'Highlight',
          time: '09–13s',
          visual: '[Proof & Situation] 세안 직후 물기를 머금은 맑은 피부 상태. 손가락으로 볼을 눌렀을 때 차오르는 수분 광채 클로즈업. 텍스트 레이어: \'2주 후 민감도 개선 확인\'.',
          audio: '(BGM) 청량하고 세련된 비트 상승 (NAR) "세안만 했는데 피부가 진정되는 느낌, 이건 진짜예요."',
          emotion: '#안도감 #맑음\n임상 결과를 감성적인 비주얼로 치환하여 구매 욕구 자극',
        },
        {
          section: 'CTA',
          time: '13–15s',
          visual: '[Product Shot] 깨끗한 배경에 제품 단독 샷. 인플루언서가 카메라를 보며 윙크하거나 미소.',
          audio: '(NAR) "민감 피부라면 무조건, 바닐라코로 정착하세요."',
          emotion: '#정착함 #추천\n명확한 브랜드 각인과 행동 유도',
        },
      ],
    },
    production: {
      preProduction: {
        supplies: '바닐라코 클린잇제로 클렌징밤, 유리 볼(제형 관찰용), 화이트 민소매 상의, 연그린색 식물 화분, 고감도 마이크.',
        checklist: [
          '밤의 투명도가 잘 보이도록 촬영 전 제품 내부의 기포를 제거할 것.',
          '세안 장면 촬영 시 실제 거품의 밀도를 높이기 위해 거품 망을 활용하여 미리 조밀한 거품을 준비해둘 것.',
        ],
      },
      cutEditing: 'Hook 구간(00-03s)은 0.3초 단위의 빠른 컷 편집으로 시선을 고정시키고, Middle 구간(03-09s)의 제형 변화 장면은 0.8배속 슬로우 모션을 적용하여 텍스처의 고급스러움을 강조. Highlight(09-13s)에서 After 피부를 보여줄 때는 컷을 길게(1.5s) 가져가 시청자가 피부 결을 충분히 감상하게 할 것.',
    },
    caution: {
      items: [
        {
          title: '제형의 투명도 유지',
          content: '밤 제형이 탁해 보이지 않도록 반드시 뒤쪽에서 빛을 쏘는 림 라이트를 활용하여 맑은 느낌을 살려야 합니다.',
        },
        {
          title: '리얼리티와 퀄리티의 조화',
          content: '너무 연출된 느낌보다는 실제 욕실에서 사용하는 듯한 자연스러운 무드를 유지하되, 피부 결 표현만큼은 하이엔드 뷰티 광고 수준의 조명을 사용해야 합니다.',
        },
        {
          title: '과장 표현 주의',
          content: '\'마법처럼 사라진다\'는 표현보다는 \'민감도가 내려가는 편안함\' 등 감정적이고 기능적인 단어를 선택하여 신뢰도를 높입니다.',
        },
      ],
      directorTip: '인스타그램 알고리즘은 \'저장\'과 \'공유\'에 민감합니다. 캡션 하단이나 영상 마지막에 "민감 피부 친구에게 공유하세요" 혹은 "올영 세일 기간에 잊지 않게 저장해두세요"라는 문구를 삽입하여 지표를 관리하십시오. 특히 DM 자동화 툴을 사용하여 댓글에 \'민감\'이라고 남기면 상세 페이지 링크를 보내주는 전략은 전환율을 200% 이상 끌어올릴 수 있습니다.',
    },
  },
};

// ─ AI Plan: Top Content ─
export const mockTopContent = {
  recommendations: [
    { contentType: 'grwm', title: '쌩얼 자신감 GRWM', description: '클렌징부터 시작하는 리얼 겟레디 콘텐츠. 셔벗 텍스처를 활용한 ASMR 요소 포함.', matchScore: 95, hooks: ['클렌징밤 하나로 달라진 내 피부', '쌩얼도 자신감 있는 비결'] },
    { contentType: 'routine', title: '7일 스킨케어 루틴 챌린지', description: '일주일간 바닐라코 클렌징밤만 사용하고 피부 변화를 기록하는 브이로그.', matchScore: 92, hooks: ['7일이면 충분합니다', '매일 찍었더니 진짜 달라졌다'] },
    { contentType: 'review', title: '올영 클렌징 TOP5 비교 리뷰', description: '올리브영 베스트셀러 클렌징 5종 직접 비교. 세정력/보습력/가성비 3축 평가.', matchScore: 88, hooks: ['5만원대 vs 1만원대 승자는?', '500만개 팔린 이유를 검증'] },
    { contentType: 'info', title: '성분 덕후의 클린잇제로 해부', description: '주요 성분 5가지를 하나씩 분석하고 피부 타입별 적합도를 평가.', matchScore: 85, hooks: ['성분표만 보면 다 보입니다', '피부과 의사도 인정한 성분 조합'] },
    { contentType: 'asmr', title: '셔벗 클렌징 ASMR', description: '셔벗이 오일로 변하는 텍스처 ASMR + 세안 사운드.', matchScore: 82, hooks: ['이 소리 중독성 있음', '듣기만 해도 기분 좋아지는 클렌징'] },
  ],
};

// ─ AI Images (4 timeline steps) ─
export const mockAIImages = {
  plan_doc_id: 'PLANDOC_001',
  steps: [
    { step_number: 1, label: 'HOOK (0-3초)', prompt: '거울 앞에서 쌩얼로 클렌징밤을 보여주는 20대 여성, 소프트 라이팅, 핑크톤', images: [
      { url: 'https://picsum.photos/seed/hook1/512/512', style: 'soft_aesthetic', is_selected: true },
      { url: 'https://picsum.photos/seed/hook2/512/512', style: 'natural', is_selected: false },
    ]},
    { step_number: 2, label: 'MIDDLE (3-9초)', prompt: '셔벗 텍스처가 오일로 변하며 얼굴 마사지하는 클로즈업, ASMR 느낌', images: [
      { url: 'https://picsum.photos/seed/mid1/512/512', style: 'close_up', is_selected: true },
      { url: 'https://picsum.photos/seed/mid2/512/512', style: 'warm_tone', is_selected: false },
    ]},
    { step_number: 3, label: 'HIGHLIGHT (9-13초)', prompt: '세안 후 맑고 깨끗한 피부 클로즈업, 자연광, 물방울 디테일', images: [
      { url: 'https://picsum.photos/seed/hi1/512/512', style: 'dewy_skin', is_selected: false },
      { url: 'https://picsum.photos/seed/hi2/512/512', style: 'natural_light', is_selected: true },
    ]},
    { step_number: 4, label: 'CTA (13-15초)', prompt: '바닐라코 클린잇제로 제품 패키징 + 올리브영 로고, 깔끔한 프레젠테이션', images: [
      { url: 'https://picsum.photos/seed/cta1/512/512', style: 'product_shot', is_selected: true },
    ]},
  ],
};

// ─ Video Analysis ─
export const mockVideoAnalysis = {
  post_id: 'POST_MOCK_001',
  status: 'completed',
  sections: [
    { section: 'hook_analysis', title: '훅 분석', content: '첫 3초 내에 제품을 직접 보여주는 비주얼 훅 사용. 텍스트 오버레이 "이거 하나면 끝"이 강한 호기심을 유발. 개선점: 질문형 훅을 추가하면 댓글 유도 가능.' },
    { section: 'visual_composition', title: '비주얼 구성', content: '클로즈업 위주 편집이 제품 텍스처를 효과적으로 전달. 색 보정이 자연스러움. 개선점: 비포/애프터 분할 화면 추가 권장.' },
    { section: 'storytelling', title: '스토리텔링', content: '문제(거친 피부) → 해결(클렌징밤) → 결과(매끈한 피부) 3단 구조 양호. 감정 연결은 약간 부족.' },
    { section: 'audience_engagement', title: '오디언스 참여도', content: '댓글 반응: 긍정 82%, 질문 12%, 부정 6%. "어디서 사요?" 댓글이 가장 많아 CTA 추가 필요.' },
    { section: 'brand_alignment', title: '브랜드 정합성', content: '바닐라코 브랜드 톤(핑크, 청량감)과 일치. 로고 노출 시간 2.1초 — 최소 3초 권장.' },
    { section: 'platform_optimization', title: '플랫폼 최적화', content: '9:16 비율 적합. 자막 가독성 양호. TikTok 트렌딩 사운드 미사용 — 트렌드 음악 활용 시 도달률 1.5배 예상.' },
    { section: 'call_to_action', title: 'CTA 분석', content: '마지막 프레임에 "프로필 링크" 텍스트만 존재. 음성 CTA + 스와이프 화살표 애니메이션 추가 권장.' },
    { section: 'improvement_suggestions', title: '개선 제안', content: '1. 첫 1초에 결과 화면(비포/애프터)을 먼저 보여주는 리버스 훅 시도\n2. 댓글 유도 질문 추가: "여러분은 어떤 클렌징 쓰세요?"\n3. 배경음악을 TikTok 인기 사운드로 교체\n4. 자막 폰트 크기 10% 확대\n5. 엔딩에 다음 콘텐츠 예고 삽입' },
  ],
};

export const mockVideoAnalysisStatuses = [
  { post_id: 'POST_MOCK_001', status: 'completed' },
  { post_id: 'POST_MOCK_002', status: 'completed' },
];

// ─ Content Library ─
export const mockContentLibrarySeeding = {
  list: [
    { post_id: 'SEED_001', platform: 'tiktok', author_nm: 'Olivia Yang (@olafflee)', campaign_name: '바닐라코 S/S', content_summary: '쌩얼 자신감 챌린지 숏폼', thumbnail: 'https://picsum.photos/seed/seed1/200/200', bf_score: 96, views: 1240000, likes: 89000, upload_dt: '2025-03-05', created_dt: '2025-03-05T10:00:00Z' },
    { post_id: 'SEED_002', platform: 'tiktok', author_nm: '이시안 (@youseeany)', campaign_name: '바닐라코 S/S', content_summary: '7일 클렌징 루틴 브이로그', thumbnail: 'https://picsum.photos/seed/seed2/200/200', bf_score: 92, views: 567000, likes: 23400, upload_dt: '2025-03-06', created_dt: '2025-03-06T14:00:00Z' },
    { post_id: 'SEED_003', platform: 'tiktok', author_nm: '레오제이 (@leojmakeup)', campaign_name: '바닐라코 S/S', content_summary: '클렌징밤 TOP5 비교 리뷰', thumbnail: 'https://picsum.photos/seed/seed3/200/200', bf_score: 90, views: 312000, likes: 14200, upload_dt: '2025-03-07', created_dt: '2025-03-07T18:00:00Z' },
    { post_id: 'SEED_004', platform: 'tiktok', author_nm: '꿀아영 (@dkdud5070)', campaign_name: '바닐라코 S/S', content_summary: '올리브영 신상 클렌징밤 리뷰', thumbnail: 'https://picsum.photos/seed/seed4/200/200', bf_score: 85, views: 156000, likes: 7800, upload_dt: '2025-03-08', created_dt: '2025-03-08T11:00:00Z' },
    { post_id: 'SEED_005', platform: 'tiktok', author_nm: 'Olivia Yang (@olafflee)', campaign_name: '바닐라코 S/S', content_summary: '셔벗 ASMR 클렌징', thumbnail: 'https://picsum.photos/seed/seed5/200/200', bf_score: 94, views: 980000, likes: 52000, upload_dt: '2025-03-09', created_dt: '2025-03-09T20:00:00Z' },
  ],
};

export const mockContentLibraryUGC = {
  list: [
    { post_id: 'UGC_LIB_001', platform: 'instagram', author_nm: '@skincare_mina', content_summary: '자발적 리뷰: 민감성 피부에 딱', thumbnail: 'https://picsum.photos/seed/ugclib1/200/200', views: 12000, likes: 890, upload_dt: '2025-03-04', created_dt: '2025-03-04T09:00:00Z' },
    { post_id: 'UGC_LIB_002', platform: 'tiktok', author_nm: '@glow_hana', content_summary: '클린잇제로 듀프? 직접 비교', thumbnail: 'https://picsum.photos/seed/ugclib2/200/200', views: 34000, likes: 2300, upload_dt: '2025-03-06', created_dt: '2025-03-06T15:00:00Z' },
    { post_id: 'UGC_LIB_003', platform: 'youtube', author_nm: '@suyeon_beauty', content_summary: '1달 사용 솔직 후기', thumbnail: 'https://picsum.photos/seed/ugclib3/200/200', views: 8900, likes: 450, upload_dt: '2025-03-07', created_dt: '2025-03-07T12:00:00Z' },
  ],
};

export const mockContentLibraryPreview = {
  list: [
    { post_id: 'PREV_001', platform: 'tiktok', author_nm: 'Olivia Yang (@olafflee)', content_summary: '[미리보기] 쌩얼 챌린지 v2', thumbnail: 'https://picsum.photos/seed/prev1/200/200', status: 'pending_review', upload_dt: '2025-03-09', created_dt: '2025-03-09T16:00:00Z' },
    { post_id: 'PREV_002', platform: 'tiktok', author_nm: '이시안 (@youseeany)', content_summary: '[미리보기] ASMR 클렌징 편집본', thumbnail: 'https://picsum.photos/seed/prev2/200/200', status: 'approved', upload_dt: '2025-03-10', created_dt: '2025-03-10T10:00:00Z' },
    { post_id: 'PREV_003', platform: 'tiktok', author_nm: '레오제이 (@leojmakeup)', content_summary: '[미리보기] 비교 리뷰 최종본', thumbnail: 'https://picsum.photos/seed/prev3/200/200', status: 'revision_requested', upload_dt: '2025-03-10', created_dt: '2025-03-10T14:00:00Z' },
  ],
};

// ─ Influencer Pool ─
export const mockInfluencerPool = [
  // ── Partnered (3명) ──
  { profile_id: 'INF_001', user_nm: 'Olivia Yang', platform: 'tiktok', followers: 2400000, avg_views: 840000, engagement_rate: 6.8, is_saved: true, stage: 'partnered', country: 'US', quick_summary: '글로벌 뷰티 메가 크리에이터. K-뷰티 트렌드 선도. 클렌징 루틴 콘텐츠 바이럴 경험.', profile_url: 'https://tiktok.com/@olafflee', profile_image: 'https://picsum.photos/seed/olafflee/100/100' },
  { profile_id: 'INF_002', user_nm: '이시안 Lee Sian', platform: 'instagram', followers: 1200000, avg_views: 420000, engagement_rate: 7.5, is_saved: true, stage: 'partnered', country: 'KR', quick_summary: 'Instagram 메가 뷰티 인플루언서. 트렌드 세터. 바닐라코 장기 파트너.', profile_url: 'https://instagram.com/youseeany', profile_image: 'https://picsum.photos/seed/youseeany/100/100' },
  { profile_id: 'INF_003', user_nm: '레오제이', platform: 'youtube', followers: 584300, avg_views: 204000, engagement_rate: 5.9, is_saved: true, stage: 'partnered', country: 'KR', quick_summary: '전문 메이크업 아티스트. 클렌징 비교 리뷰로 유명. 높은 신뢰도.', profile_url: 'https://youtube.com/@leojmakeup', profile_image: 'https://picsum.photos/seed/leojmakeup/100/100' },

  // ── Performing (4명) ──
  { profile_id: 'INF_004', user_nm: 'Olia Majd', platform: 'tiktok', followers: 409100, avg_views: 143000, engagement_rate: 6.2, is_saved: true, stage: 'performing', country: 'US', quick_summary: '글로벌 뷰티 크리에이터. 스킨케어 루틴/리뷰 전문. 높은 참여율.', profile_url: 'https://tiktok.com/@oliamajd', profile_image: 'https://picsum.photos/seed/oliamajd/100/100' },
  { profile_id: 'INF_005', user_nm: '미선짱', platform: 'instagram', followers: 405800, avg_views: 142000, engagement_rate: 5.8, is_saved: true, stage: 'performing', country: 'KR', quick_summary: '뷰티/라이프스타일 크리에이터. 릴스 전문. 밝은 에너지 콘텐츠.', profile_url: 'https://instagram.com/sunn416', profile_image: 'https://picsum.photos/seed/sunn416/100/100' },
  { profile_id: 'INF_006', user_nm: 'Hasime Kukaj', platform: 'youtube', followers: 349300, avg_views: 122000, engagement_rate: 6.0, is_saved: true, stage: 'performing', country: 'US', quick_summary: '글로벌 뷰티 리뷰어. 스킨케어 추천 콘텐츠. 클렌징 밤 전문.', profile_url: 'https://youtube.com/@thebeautyradar', profile_image: 'https://picsum.photos/seed/thebeautyradar/100/100' },
  { profile_id: 'INF_007', user_nm: '권은지', platform: 'tiktok', followers: 337900, avg_views: 118000, engagement_rate: 7.1, is_saved: true, stage: 'performing', country: 'US', quick_summary: '한국계 미국 뷰티 크리에이터. K-뷰티 브릿지 역할. 영어 콘텐츠.', profile_url: 'https://tiktok.com/@3eunji__', profile_image: 'https://picsum.photos/seed/3eunji__/100/100' },

  // ── Posted (5명) ──
  { profile_id: 'INF_008', user_nm: '메이크업 아티스트 NANA', platform: 'instagram', followers: 292600, avg_views: 102000, engagement_rate: 5.3, is_saved: true, stage: 'posted', country: 'KR', quick_summary: '전문 메이크업 아티스트. 뷰티 튜토리얼/클렌징 루틴 전문.', profile_url: 'https://instagram.com/_twinkle_makeup_', profile_image: 'https://picsum.photos/seed/_twinkle_makeup_/100/100' },
  { profile_id: 'INF_009', user_nm: 'Candace Hampton-Fudge', platform: 'tiktok', followers: 261200, avg_views: 91000, engagement_rate: 4.8, is_saved: true, stage: 'posted', country: 'US', quick_summary: '댈러스 기반 뷰티 크리에이터. 리얼 리뷰 전문. 성인 스킨케어.', profile_url: 'https://tiktok.com/@thebeautybeau', profile_image: 'https://picsum.photos/seed/thebeautybeau/100/100' },
  { profile_id: 'INF_010', user_nm: '꿀아영(신아영)', platform: 'youtube', followers: 245100, avg_views: 86000, engagement_rate: 6.4, is_saved: true, stage: 'posted', country: 'KR', quick_summary: '뷰티/일상 크리에이터. 올리브영 리뷰 전문. 높은 댓글 참여율.', profile_url: 'https://youtube.com/@dkdud5070', profile_image: 'https://picsum.photos/seed/dkdud5070/100/100' },
  { profile_id: 'INF_011', user_nm: '이향 LEE HYANG', platform: 'instagram', followers: 227900, avg_views: 80000, engagement_rate: 5.1, is_saved: true, stage: 'posted', country: 'KR', quick_summary: '뷰티/메이크업 크리에이터. 데일리 루틴 콘텐츠. 차분한 톤.', profile_url: 'https://instagram.com/_leehyang', profile_image: 'https://picsum.photos/seed/_leehyang/100/100' },
  { profile_id: 'INF_012', user_nm: '加藤 美南', platform: 'tiktok', followers: 202300, avg_views: 71000, engagement_rate: 4.5, is_saved: true, stage: 'posted', country: 'JP', quick_summary: '일본 출신 뷰티 크리에이터. K-뷰티 리뷰. 동아시아 영향력.', profile_url: 'https://tiktok.com/@minamikato_0115', profile_image: 'https://picsum.photos/seed/minamikato/100/100' },

  // ── Seeded (4명) ──
  { profile_id: 'INF_013', user_nm: '모델 심지영', platform: 'instagram', followers: 193900, avg_views: 68000, engagement_rate: 4.8, is_saved: true, stage: 'seeded', country: 'KR', quick_summary: '프로 모델 겸 뷰티 크리에이터. 메이크업/클렌징 루틴 콘텐츠.', profile_url: 'https://instagram.com/jy____shim', profile_image: 'https://picsum.photos/seed/jy____shim/100/100' },
  { profile_id: 'INF_014', user_nm: 'Grazy Grace', platform: 'youtube', followers: 145600, avg_views: 51000, engagement_rate: 7.2, is_saved: true, stage: 'seeded', country: 'US', quick_summary: '한국계 미국 크리에이터. 뷰티/라이프스타일. 영어 콘텐츠.', profile_url: 'https://youtube.com/@gebabyk', profile_image: 'https://picsum.photos/seed/gebabyk/100/100' },
  { profile_id: 'INF_015', user_nm: '倉田乃彩', platform: 'tiktok', followers: 144100, avg_views: 50000, engagement_rate: 5.0, is_saved: true, stage: 'seeded', country: 'JP', quick_summary: '일본 뷰티 크리에이터. K-뷰티 리뷰 전문. 일본 시장 영향력.', profile_url: 'https://tiktok.com/@i_09_noa', profile_image: 'https://picsum.photos/seed/i_09_noa/100/100' },
  { profile_id: 'INF_016', user_nm: 'Shim hye jin', platform: 'instagram', followers: 140100, avg_views: 49000, engagement_rate: 4.8, is_saved: true, stage: 'seeded', country: 'KR', quick_summary: '뷰티/패션 크리에이터. 일본어/영어 다국어 콘텐츠.', profile_url: 'https://instagram.com/hyedini_sim', profile_image: 'https://picsum.photos/seed/hyedini_sim/100/100' },

  // ── Discovered (4명) ──
  { profile_id: 'INF_017', user_nm: 'Megan', platform: 'tiktok', followers: 131700, avg_views: 46000, engagement_rate: 7.8, is_saved: false, stage: 'discovered', country: 'US', quick_summary: '글로벌 뷰티 리뷰어. K-뷰티 전문. 높은 참여율.', profile_url: 'https://tiktok.com/@milktea.meg', profile_image: 'https://picsum.photos/seed/milktea.meg/100/100' },
  { profile_id: 'INF_018', user_nm: '오민초 Mincho Oh', platform: 'youtube', followers: 121500, avg_views: 43000, engagement_rate: 5.6, is_saved: false, stage: 'discovered', country: 'KR', quick_summary: '뷰티/라이프 크리에이터. 자연스러운 데일리 루틴.', profile_url: 'https://youtube.com/@mincho_oh', profile_image: 'https://picsum.photos/seed/mincho_oh/100/100' },
  { profile_id: 'INF_019', user_nm: '채원 Chaewon', platform: 'instagram', followers: 119000, avg_views: 42000, engagement_rate: 7.4, is_saved: false, stage: 'discovered', country: 'US', quick_summary: '글로벌 K-뷰티 크리에이터. 영어 콘텐츠. 높은 참여율.', profile_url: 'https://instagram.com/chaewonsays', profile_image: 'https://picsum.photos/seed/chaewonsays/100/100' },
  { profile_id: 'INF_020', user_nm: '모하뉴', platform: 'tiktok', followers: 99400, avg_views: 35000, engagement_rate: 6.5, is_saved: false, stage: 'discovered', country: 'KR', quick_summary: '뷰티/일상 크리에이터. 스킨케어 루틴 콘텐츠. 댓글 소통 활발.', profile_url: 'https://tiktok.com/@ujjja_e', profile_image: 'https://picsum.photos/seed/ujjja_e/100/100' },
];

// ─ Influencer Deep Analysis ─
export const mockInfluencerDeepAnalysis = {
  success: true,
  data: {
    profile_id: 'INF_001',
    name: 'Olivia Yang',
    platform: 'tiktok',
    demographics: { gender_ratio: { female: 87, male: 13 }, age_groups: { '18-24': 42, '25-34': 38, '35-44': 14, '45+': 6 }, top_locations: ['미국', '한국', '일본'] },
    posting_frequency: { weekly_avg: 5.5, best_day: '수요일', best_time: '19:00' },
    engagement_analysis: { avg_likes: 168000, avg_comments: 4200, avg_shares: 8500, engagement_rate: 6.8, trend: 'rising' },
    audience_growth: { monthly_growth_rate: 4.5, total_growth_6m: 380000 },
    content_themes: ['K-뷰티 루틴', '클렌징 리뷰', '스킨케어 팁', '겟레디윗미', 'ASMR'],
    shooting_style: '밝은 조명, 클로즈업 중심, 트렌디한 전환',
    editing_style: '빠른 컷 편집, 자막 활용, 트렌딩 사운드',
    brand_fit_score: 96,
    recommended_content_types: ['grwm', 'routine', 'asmr', 'comparison'],
  },
};

// ─ Roles & Permissions ─
export const mockRoles = [
  { role_id: 1, role_name: '관리자', description: '전체 시스템 접근 권한', user_count: 2 },
  { role_id: 2, role_name: '캠페인 매니저', description: '캠페인 생성/편집/실행 권한', user_count: 5 },
  { role_id: 3, role_name: '뷰어', description: '읽기 전용 접근 권한', user_count: 8 },
];

export const mockRolePermissions = [
  { permission_id: 1, resource: 'campaign', actions: ['create', 'read', 'update', 'delete'] },
  { permission_id: 2, resource: 'influencer', actions: ['read', 'analyze', 'match'] },
  { permission_id: 3, resource: 'creative', actions: ['create', 'read', 'update', 'approve'] },
  { permission_id: 4, resource: 'outreach', actions: ['read', 'send'] },
  { permission_id: 5, resource: 'monitor', actions: ['read'] },
];

export const mockRoleUsers = [
  { user_id: 'U001', name: '김마케터', email: 'kim@fnco.com', role_name: '관리자', joined_at: '2024-06-01T09:00:00Z' },
  { user_id: 'U002', name: '박팀장', email: 'park@fnco.com', role_name: '캠페인 매니저', joined_at: '2024-08-15T09:00:00Z' },
  { user_id: 'U003', name: '이담당', email: 'lee@fnco.com', role_name: '캠페인 매니저', joined_at: '2024-09-01T09:00:00Z' },
  { user_id: 'U004', name: '최인턴', email: 'choi@fnco.com', role_name: '뷰어', joined_at: '2025-01-10T09:00:00Z' },
];

export const mockAvailableUsers = [
  { user_id: 'U005', name: '정신입', email: 'jung@fnco.com' },
  { user_id: 'U006', name: '한마케터', email: 'han@fnco.com' },
];

// ─ Hook Bank ─
export const mockHookBank = [
  { hook_id: 'HK_001', campaign_id: MOCK_CAMPAIGN_ID, phase: 'hook', type: 'question', text: '클렌징밤 하나로 피부결이 달라질 수 있다면?', score: 95, status: 'active', created_at: '2025-03-02T10:00:00Z' },
  { hook_id: 'HK_002', campaign_id: MOCK_CAMPAIGN_ID, phase: 'hook', type: 'reversal', text: '비싼 클렌징 오일 다 버렸습니다', score: 90, status: 'active', created_at: '2025-03-02T10:00:00Z' },
  { hook_id: 'HK_003', campaign_id: MOCK_CAMPAIGN_ID, phase: 'hook', type: 'social_proof', text: '올리브영에서 500만개 팔린 이유', score: 88, status: 'active', created_at: '2025-03-02T10:00:00Z' },
  { hook_id: 'HK_004', campaign_id: MOCK_CAMPAIGN_ID, phase: 'cta', type: 'urgency', text: '올영 세일 마지막 3일! 링크는 프로필에', score: 82, status: 'active', created_at: '2025-03-02T10:00:00Z' },
  { hook_id: 'HK_005', campaign_id: MOCK_CAMPAIGN_ID, phase: 'hook', type: 'curiosity', text: '3초만에 피부결 달라지는 비결', score: 87, status: 'draft', created_at: '2025-03-02T10:00:00Z' },
  { hook_id: 'HK_006', campaign_id: MOCK_CAMPAIGN_ID, phase: 'hook', type: 'asmr', text: '이 소리 듣기만 해도 기분 좋아짐', score: 79, status: 'draft', created_at: '2025-03-02T10:00:00Z' },
];

// ─ Alignment ─
export const mockAlignment = {
  overall_score: 87,
  checks: [
    { dimension: 'brand_tone', label: '브랜드 톤', score: 92, details: '친근하면서 신뢰감 있는 톤이 바닐라코 브랜드 아이덴티티와 잘 부합합니다.', issues: [], suggestions: ['SNS별 톤 가이드라인 추가로 채널 간 일관성 강화'] },
    { dimension: 'target_fit', label: '타겟 적합성', score: 90, details: 'P2(효율 추구형), P7(트러블 슈터), P9(민감성/더마) 페르소나가 제품 주요 고객층과 일치합니다.', issues: [], suggestions: [] },
    { dimension: 'visual_alignment', label: '비주얼 정합성', score: 85, details: '파스텔 핑크 + 클린 화이트 컬러 팔레트가 브랜드 가이드라인을 준수합니다.', issues: ['일부 TikTok 콘텐츠에서 브랜드 컬러가 약하게 표현됨'], suggestions: ['TikTok 콘텐츠 썸네일에 브랜드 컬러 오버레이 적용'] },
    { dimension: 'message_consistency', label: '메시지 일관성', score: 82, details: '"저자극 클렌징밤" 핵심 메시지가 전 콘텐츠에 걸쳐 유지됩니다.', issues: ['P7 타겟 콘텐츠에서 "저자극" 키워드 누락 2건'], suggestions: ['모든 콘텐츠 브리프에 핵심 키워드 체크리스트 포함'] },
    { dimension: 'competitive_diff', label: '경쟁 차별화', score: 78, details: 'BHA+시카 조합과 약산성 포뮬러 USP가 경쟁사 대비 차별점으로 작용합니다.', issues: ['경쟁사 대비 가격 메리트 메시지가 부족', 'Solution Aware 단계에서 직접 비교 콘텐츠 추가 필요'], suggestions: ['경쟁사 성분 비교 인포그래픽 제작', '가격 대비 성능(CPV) 데이터 콘텐츠 추가'] },
  ],
};

// ─ Narrative Arc ─
export const mockNarrativeArc = {
  phases: [
    {
      phase: 'tease', timing: 'D-21 ~ D-14',
      purpose: '"입술이 건조한데 틴트 발색까지?" 피부 고민 공감으로 Problem Aware 관심 유도',
      message_tone: '궁금증 유발, 일상 공감형 — "촉촉한 입술 위에 올린 한 겹의 비밀"',
      channels: ['TikTok', 'Instagram Stories'],
      kpi: '조회수 800만+, 완시청률 45%+, 저장율 3%+',
      concepts: [
        { persona: 'P1 트렌드세터', name: '흔한 레드는 그만', head_copy: '촉촉한 발색, 건조함 없는 틴트의 시작' },
        { persona: 'P3 감성 뷰티러버', name: '입술 위의 벨벳 무드', head_copy: '한 번 바르면 하루 종일 촉촉한 비밀' },
      ],
    },
    {
      phase: 'reveal', timing: 'D-7 ~ D-3',
      purpose: '쉬어 벨벳 포뮬러의 보습+발색 차별점을 교육하며 Solution Aware로 전환',
      message_tone: '신뢰감 있는 비교형, 교육적 — "기존 틴트와 다른 3가지 이유"',
      channels: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
      kpi: '조회수 1,200만+, 참여율 5%+, 댓글 800건+',
      concepts: [
        { persona: 'P2 성분 분석러', name: '성분으로 증명하는 보습 틴트', head_copy: '히알루론산 + 쉬어버터 포뮬러의 과학' },
        { persona: 'P1 트렌드세터', name: '발색 비교 챌린지', head_copy: '6시간 후에도 선명한 컬러 테스트' },
        { persona: 'P4 실용주의 뷰티', name: '가성비 보습 틴트 TOP 3', head_copy: '2만원대로 완성하는 고급 입술' },
      ],
    },
    {
      phase: 'validate', timing: 'D-Day ~ D+3',
      purpose: '뷰티 크리에이터 실사용 후기와 전문가 리뷰로 구매 확신 강화',
      message_tone: '사회적 증거, 전문가 권위 — "이미 선택한 사람들의 이야기"',
      channels: ['YouTube', 'Instagram', 'Blog'],
      kpi: '공유수 5,000+, 저장수 12,000+, 전환율 3.2%+',
      concepts: [
        { persona: 'P5 리뷰 신뢰형', name: '72시간 리얼 착용 후기', head_copy: '아침부터 저녁까지, 진짜 후기' },
        { persona: 'P2 성분 분석러', name: '피부과 전문의 성분 리뷰', head_copy: '전문가가 인정한 저자극 포뮬러' },
      ],
    },
    {
      phase: 'amplify', timing: 'D+7 ~ D+30',
      purpose: 'Most Aware 고객의 자발적 UGC와 재구매 유도로 바이럴 극대화',
      message_tone: '팬덤 형성, 커뮤니티 참여 — "나만의 벨벳 컬러를 공유하세요"',
      channels: ['TikTok', 'Instagram', 'YouTube'],
      kpi: 'UGC 350건+, ROAS 6.5+, 재구매율 18%+',
      concepts: [
        { persona: 'P1 트렌드세터', name: '#벨벳틴트챌린지', head_copy: '나만의 벨벳 무드 공유 챌린지' },
        { persona: 'P3 감성 뷰티러버', name: '계절별 벨벳 컬러 추천', head_copy: '봄에 어울리는 벨벳 컬러 조합' },
        { persona: 'P4 실용주의 뷰티', name: '공구 & 재구매 혜택', head_copy: '팬들을 위한 특별 재구매 할인' },
      ],
    },
  ],
};

// ─ Channel Setup ─
export const mockChannelSetup = [
  { setup_id: 'CH_001', channel: 'Instagram Reels', platform_account: '@banilaco_official', posting_schedule: '화/목/토 20:00', content_guidelines: '9:16, 15-30초, 자막 필수, #광고 태그', status: 'active' },
  { setup_id: 'CH_002', channel: 'TikTok', platform_account: '@banilaco_kr', posting_schedule: '월/수/금 19:00', content_guidelines: '9:16, 15초 이내, 트렌딩 사운드 활용', status: 'active' },
  { setup_id: 'CH_003', channel: 'YouTube Shorts', platform_account: '바닐라코 공식', posting_schedule: '수/일 18:00', content_guidelines: '9:16, 60초 이내, 상세 자막, 챕터 마커', status: 'active' },
  { setup_id: 'CH_004', channel: 'Blog (Naver)', platform_account: 'banilaco_blog', posting_schedule: '금 10:00', content_guidelines: '성분 분석, 비교 리뷰, 2000자 이상, SEO 키워드 포함', status: 'setup' },
];

// ─ Drop Coordination ─
export const mockDrops = [
  { drop_id: 'DROP_001', influencer_name: 'Olivia Yang (@olafflee)', product: '클린잇제로 오리지널 + 카밍 세트', shipping_status: 'delivered', tracking_number: 'CJ1234567890', reminder_sent: true, delivery_confirmed: true, drop_date: '2025-03-01' },
  { drop_id: 'DROP_002', influencer_name: '이시안 Lee Sian (@youseeany)', product: '클린잇제로 전 라인업 세트', shipping_status: 'delivered', tracking_number: 'CJ2345678901', reminder_sent: true, delivery_confirmed: true, drop_date: '2025-03-01' },
  { drop_id: 'DROP_003', influencer_name: '레오제이 (@leojmakeup)', product: '클린잇제로 오리지널 + 포어', shipping_status: 'in_transit', tracking_number: 'CJ3456789012', reminder_sent: false, delivery_confirmed: false, drop_date: '2025-03-03' },
  { drop_id: 'DROP_004', influencer_name: 'Olia Majd (@oliamajd)', product: '클린잇제로 오리지널', shipping_status: 'delivered', tracking_number: 'CJ4567890123', reminder_sent: true, delivery_confirmed: false, drop_date: '2025-03-02' },
  { drop_id: 'DROP_005', influencer_name: '꿀아영(신아영) (@dkdud5070)', product: '클린잇제로 한정판 세트', shipping_status: 'preparing', tracking_number: null, reminder_sent: false, delivery_confirmed: false, drop_date: '2025-03-05' },
];


// ══════════════════════════════════════════════════════
// URL → 목업 라우터
// ══════════════════════════════════════════════════════

function resolveByURL(pathname) {
  // ── V2 API routes (/api/v2/...) ──
  if (pathname === '/api/v2/campaigns') return mockCampaigns;
  if (pathname === '/api/v2/templates') return mockTemplates;
  if (pathname === '/api/v2/notifications') return mockNotifications;

  // /api/v2/templates/:id
  if (/^\/api\/v2\/templates\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    return mockTemplates.find(t => t.id === id) || mockTemplates[0];
  }

  // Campaign-scoped V2 routes: /api/v2/campaigns/:id/...
  const campaignMatch = pathname.match(/^\/api\/v2\/campaigns\/([^/]+)(\/.*)?$/);
  if (campaignMatch) {
    const campaignId = campaignMatch[1];
    const subPath = campaignMatch[2] || '';
    const isVelvetTint = campaignId === MOCK_VELVET_TINT_ID;

    if (subPath === '' || subPath === '/') return isVelvetTint ? mockVelvetTintCampaign : mockCampaign;
    if (subPath === '/hub') return isVelvetTint ? mockVelvetTintHub : mockCampaignHub;
    if (subPath === '/pda') return isVelvetTint ? mockVelvetTintPDA : mockPDA;
    if (subPath === '/strategy') return mockStrategy;
    if (subPath === '/strategy/history') return mockStrategyHistory;
    if (subPath === '/calendar') return mockCalendar;
    if (subPath === '/creatives') return mockCreatives;
    if (/^\/creatives\/[^/]+$/.test(subPath)) {
      const cid = subPath.split('/').pop();
      return mockCreatives.find(c => c.creative_id === cid) || mockCreatives[0];
    }
    if (subPath === '/influencers') return mockInfluencers;
    if (subPath === '/outreach') return mockOutreach;
    if (subPath === '/launch') return mockLaunchSchedule;
    if (subPath === '/monitor') return isVelvetTint ? mockVelvetTintMonitorDashboard : mockMonitorDashboard;
    if (subPath === '/monitor/pda-heatmap') return isVelvetTint ? mockVelvetTintPDAHeatmap : mockPDAHeatmap;
    if (subPath === '/monitor/fatigue') return isVelvetTint ? mockVelvetTintFatigueReport : mockFatigueReport;
    if (subPath === '/audit') return mockAuditLog;
    if (subPath === '/optimization') return mockOptimizations;
    if (subPath === '/signals') return mockEarlySignals;
    if (subPath === '/ugc-flywheel/content') return mockUGCContent;
    if (subPath === '/ugc-flywheel/creators') return mockUGCCreators;
    if (subPath === '/hooks') return mockHookBank;
    if (subPath === '/alignment') return mockAlignment;
    if (subPath === '/narrative-arc') return mockNarrativeArc;
    if (subPath === '/channel-setup') return mockChannelSetup;
    if (subPath === '/drops') return mockDrops;

    return {};
  }

  // ── V1 API routes (/api/...) ──

  // AI Plan
  if (pathname === '/api/ai-plan/analysis') return mockProductAnalysis;
  if (pathname === '/api/ai-plan/refined') return mockRefinedData;
  if (pathname === '/api/ai-plan/top-content') return mockTopContent;

  // AI Image
  if (pathname === '/api/ai-image/images') return mockAIImages;

  // Contents
  if (pathname === '/api/contents/videoAnalysis') return mockVideoAnalysis;
  if (pathname === '/api/contents/videoAnalysis/statuses') return mockVideoAnalysisStatuses;
  if (pathname === '/api/contents/seeding') return mockContentLibrarySeeding;
  if (pathname === '/api/contents/ugc') return mockContentLibraryUGC;
  if (pathname === '/api/contents/preview') return mockContentLibraryPreview;
  if (pathname === '/api/contents/performance') return { list: [] };

  // Influencer
  if (pathname === '/api/influencer/list') return { success: true, list: mockInfluencerPool };
  if (pathname === '/api/influencer/count') return { success: true, count: mockInfluencerPool.length };
  if (/^\/api\/influencer\/deep-analysis\//.test(pathname)) return mockInfluencerDeepAnalysis;

  // Roles
  if (pathname === '/api/roles') return mockRoles;
  if (/^\/api\/roles\/[^/]+\/permissions$/.test(pathname)) return mockRolePermissions;
  if (/^\/api\/roles\/[^/]+\/users$/.test(pathname)) return mockRoleUsers;
  if (pathname === '/api/users') return mockAvailableUsers;

  console.warn('[DEMO] Unmatched GET:', pathname);
  return {};
}


// ══════════════════════════════════════════════════════
// fetch 인터셉터
// ══════════════════════════════════════════════════════

export function installDemoFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

    // 비-API 요청은 그대로 통과
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    const method = (init.method || 'GET').toUpperCase();
    const parsed = new URL(url, window.location.origin);
    const pathname = parsed.pathname;

    // POST인데 실질적으로 query인 케이스 (video analysis statuses polling)
    if (method === 'POST' && pathname === '/api/contents/videoAnalysis/statuses') {
      await delay(200);
      return jsonResponse(mockVideoAnalysisStatuses);
    }

    // 론칭 서사 아크 AI 생성 → mockNarrativeArc 반환
    const narrativeArcGenMatch = pathname.match(/^\/api\/v2\/campaigns\/[^/]+\/narrative-arc\/generate$/);
    if (method === 'POST' && narrativeArcGenMatch) {
      await delay(1200);
      return jsonResponse(mockNarrativeArc);
    }

    // 정합성 체크 실행 → mockAlignment 데이터 반환
    const alignmentRunMatch = pathname.match(/^\/api\/v2\/campaigns\/[^/]+\/alignment\/run$/);
    if (method === 'POST' && alignmentRunMatch) {
      await delay(800);
      return jsonResponse(mockAlignment);
    }

    // GET → 목업 데이터 반환
    if (method === 'GET') {
      await delay(250);
      const data = resolveByURL(pathname);
      return jsonResponse(structuredClone(data));
    }

    // POST/PUT/PATCH/DELETE → 성공 응답
    await delay(400);
    return jsonResponse({ success: true, message: '[DEMO] Operation completed' });
  };
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
