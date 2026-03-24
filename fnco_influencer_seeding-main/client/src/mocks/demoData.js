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

// ─ UGC Category Insights (mst_plan_issue_top_content 테이블 기반) ─
// category → subcategory 계층, 각 서브카테고리에 youtube/tiktok/instagram 3채널 콘텐츠
export const mockUGCCategoryInsights = {
  success: true,
  data: [
    // ── 립 메이크업 ──
    { category: '립 메이크업', subcategory: '틴트/립스틱 리뷰', contents: [
      { id: 1, rank_no: 1, platform: 'youtube', title: '2026 봄 신상 틴트 TOP 5 비교! 쉬어 벨벳 베일 틴트가 1위인 이유', author_nm: '뷰티 크리에이터 소희', view_count: 892000, ai_post_summary: '보습력과 발색력을 동시에 잡은 쉬어 벨벳 베일 틴트를 5개 경쟁 제품과 비교 리뷰. 6시간 지속력 테스트에서 압도적 1위.', ai_channel_summary: '뷰티 비교 리뷰 전문 채널. 객관적 테스트로 높은 신뢰도. 25-34 여성 시청자 중심.', post_url: 'https://www.youtube.com/watch?v=example_lip1', created_dt: '2026-02-28T14:00:00Z' },
      { id: 2, rank_no: 1, platform: 'tiktok', title: '건조한 입술 구원 틴트 찾았다! #벨벳틴트 #촉촉립', author_nm: '@lip_master', view_count: 1340000, ai_post_summary: '건조한 입술 고민 해결 보습 틴트로 쉬어 벨벳 베일 틴트를 소개. 바르는 순간부터 촉촉한 텍스처와 자연스러운 발색 시연.', ai_channel_summary: '립 메이크업 전문 TikTok 크리에이터. Z세대 팔로워 비중 68%. 완시청률 48%.', post_url: 'https://www.tiktok.com/@lip_master/video/example_lip2', created_dt: '2026-03-02T10:30:00Z' },
      { id: 3, rank_no: 1, platform: 'instagram', title: '봄 맞이 벨벳 틴트 전색상 스워치', author_nm: '@color_swatch_kr', view_count: 456000, ai_post_summary: '쉬어 벨벳 베일 틴트 전 8색상 립스워치. 코랄/로즈 계열 높은 반응. 캐러셀 형식으로 색상별 비교 제공.', ai_channel_summary: 'Instagram 컬러 스워치 전문 계정. 저장율 12%로 카테고리 평균 대비 4배.', post_url: 'https://www.instagram.com/p/example_lip3', created_dt: '2026-03-05T09:15:00Z' },
    ]},
    { category: '립 메이크업', subcategory: '컬러 트렌드', contents: [
      { id: 4, rank_no: 1, platform: 'youtube', title: '퍼스널 컬러별 벨벳 틴트 컬러 추천! 나에게 맞는 색은?', author_nm: '컬러 진단사 유진', view_count: 412000, ai_post_summary: '퍼스널 컬러 진단사가 8색상을 봄웜/여름쿨/가을웜/겨울쿨 타입별로 분류. 각 타입별 Best/Worst 컬러 시연.', ai_channel_summary: '전문 퍼스널 컬러 진단사 YouTube. 25-34 여성에게 높은 신뢰.', post_url: 'https://www.youtube.com/watch?v=example_color2', created_dt: '2026-03-09T14:20:00Z' },
      { id: 5, rank_no: 1, platform: 'tiktok', title: '2026 봄 립 트렌드 컬러 TOP 3! 벨벳 코랄이 대세', author_nm: '@color_trend', view_count: 1870000, ai_post_summary: '2026 S/S 시즌 립 트렌드 분석. 코랄·로즈·누드가 봄 트렌드 Top 3. 퍼스널 컬러별 추천도 소개.', ai_channel_summary: 'TikTok 컬러 트렌드 분석 채널. 시즌별 트렌드 콘텐츠로 빠른 바이럴. 210만 팔로워.', post_url: 'https://www.tiktok.com/@color_trend/video/example_color1', created_dt: '2026-03-07T09:00:00Z' },
      { id: 6, rank_no: 1, platform: 'instagram', title: '웜톤 vs 쿨톤 벨벳 틴트 비교 캐러셀', author_nm: '@tone_match_kr', view_count: 324000, ai_post_summary: '웜톤/쿨톤별 쉬어 벨벳 베일 틴트 추천 컬러를 캐러셀 10장으로 정리. 각 톤별 Best 2색상과 레이어링 팁.', ai_channel_summary: 'Instagram 퍼스널 컬러 전문. 캐러셀 저장율 15%.', post_url: 'https://www.instagram.com/p/example_color3', created_dt: '2026-03-10T11:00:00Z' },
    ]},
    // ── 스킨케어 ──
    { category: '스킨케어', subcategory: '보습/립케어', contents: [
      { id: 7, rank_no: 1, platform: 'youtube', title: '입술 건조 해결! 립 보습 루틴 A to Z (feat. 쉬어 벨벳 베일 틴트)', author_nm: '피부과 전문의 Dr.Kim', view_count: 623000, ai_post_summary: '피부과 전문의 추천 입술 보습 루틴. 히알루론산+쉬어버터 성분 분석과 보습 효과 검증.', ai_channel_summary: '피부과 전문의 운영 뷰티 채널. 30-40대 여성에게 높은 신뢰도.', post_url: 'https://www.youtube.com/watch?v=example_skin1', created_dt: '2026-02-25T11:00:00Z' },
      { id: 8, rank_no: 1, platform: 'tiktok', title: '입술 각질 제거 후 틴트 바르면 이렇게 달라요!', author_nm: '@skincare_daily', view_count: 987000, ai_post_summary: '입술 각질 케어 후 틴트 적용 Before/After 비교. 보습 지속력을 시간별로 체크.', ai_channel_summary: '데일리 스킨케어 루틴 전문 TikTok. 비포/애프터 콘텐츠로 높은 저장율.', post_url: 'https://www.tiktok.com/@skincare_daily/video/example_skin2', created_dt: '2026-03-01T16:20:00Z' },
      { id: 9, rank_no: 1, platform: 'instagram', title: '건조 입술 탈출 3단계 루틴 (스크럽→세럼→벨벳 틴트)', author_nm: '@lip_care_lab', view_count: 267000, ai_post_summary: '립 스크럽 → 립 세럼 → 쉬어 벨벳 베일 틴트 3단계 보습 루틴. 단계별 사진으로 변화 과정 시각화.', ai_channel_summary: 'Instagram 립케어 전문 계정. 스텝별 루틴 콘텐츠로 20대 여성에게 인기.', post_url: 'https://www.instagram.com/p/example_skin3', created_dt: '2026-03-03T13:00:00Z' },
    ]},
    { category: '스킨케어', subcategory: '성분 분석', contents: [
      { id: 10, rank_no: 1, platform: 'youtube', title: '쉬어 벨벳 베일 틴트 전성분 분석! 정말 보습될까?', author_nm: '코덕연구소', view_count: 534000, ai_post_summary: '전성분표 분석. 히알루론산·쉬어버터·비타민E 핵심 보습 성분 함량과 효과를 과학적으로 검증. 경쟁 대비 보습 성분 2.3배.', ai_channel_summary: '뷰티 성분 분석 전문 YouTube. 시청 시간 평균 8분으로 카테고리 2배.', post_url: 'https://www.youtube.com/watch?v=example_ingr1', created_dt: '2026-02-20T15:30:00Z' },
      { id: 11, rank_no: 1, platform: 'tiktok', title: '성분 오타쿠가 분석한 보습 틴트 성분 TOP 3', author_nm: '@ingredient_nerd', view_count: 756000, ai_post_summary: '쉬어 벨벳 베일 틴트 핵심 성분 3가지(히알루론산, 쉬어버터, 세라마이드)를 60초 안에 해설. 성분 시각화 자막 활용.', ai_channel_summary: 'TikTok 성분 분석 전문. 60초 숏폼 포맷으로 Z세대 성분 관심층 타겟.', post_url: 'https://www.tiktok.com/@ingredient_nerd/video/example_ingr2', created_dt: '2026-03-04T09:00:00Z' },
      { id: 12, rank_no: 1, platform: 'instagram', title: '비건 인증 틴트! 성분 안전한 립 추천 리스트', author_nm: '@clean_beauty_kr', view_count: 289000, ai_post_summary: '비건·클린 뷰티 관점에서 평가. 유해 성분 무첨가와 동물실험 미실시 인증 확인. 민감성 피부 사용자 후기 공유.', ai_channel_summary: 'Instagram 클린 뷰티 전문. 비건/클린 관심층 타겟. 팔로워 신뢰도 높음.', post_url: 'https://www.instagram.com/p/example_ingr3', created_dt: '2026-03-06T11:45:00Z' },
    ]},
    // ── 메이크업 룩 ──
    { category: '메이크업 룩', subcategory: 'GRWM/데일리', contents: [
      { id: 13, rank_no: 1, platform: 'youtube', title: '학교 가기 전 자연스러운 메이크업 — 틴트 추천', author_nm: '대학생 뷰티 하은', view_count: 245000, ai_post_summary: '대학생 일상 메이크업에서 자연스러운 발색 활용. 데일리 립 컬러로 10-20대 초반에게 높은 공감.', ai_channel_summary: '대학생 뷰티 크리에이터. 18-22세 여성 시청자 중심.', post_url: 'https://www.youtube.com/watch?v=example_grwm3', created_dt: '2026-03-08T10:30:00Z' },
      { id: 14, rank_no: 1, platform: 'tiktok', title: '출근 5분 메이크업 GRWM — 벨벳 틴트 하나면 끝!', author_nm: '@grwm_queen', view_count: 2150000, ai_post_summary: '바쁜 출근 5분 루틴에서 핵심 아이템으로 활용. 한 번 터치로 발색+보습 동시 달성. 댓글 대량 유입.', ai_channel_summary: 'GRWM 전문 TikTok 크리에이터. 20대 직장인 여성 타겟. 완시청률 52%.', post_url: 'https://www.tiktok.com/@grwm_queen/video/example_grwm1', created_dt: '2026-03-03T08:45:00Z' },
      { id: 15, rank_no: 1, platform: 'instagram', title: '봄 데이트 메이크업 — 벨벳 로즈 컬러가 찰떡!', author_nm: '@makeup_daily_ji', view_count: 378000, ai_post_summary: '봄 데이트 메이크업 튜토리얼. 로즈 컬러를 메인 립으로 활용한 소프트 글램 룩. 자연광 아래 발색 시연.', ai_channel_summary: 'Instagram 데일리 메이크업 크리에이터. 저장율 9%.', post_url: 'https://www.instagram.com/reel/example_grwm2', created_dt: '2026-03-06T13:00:00Z' },
    ]},
    { category: '메이크업 룩', subcategory: '시즌/이벤트 룩', contents: [
      { id: 16, rank_no: 1, platform: 'youtube', title: '벚꽃 시즌 메이크업 룩북 — 핑크 벨벳 립 포인트', author_nm: '뷰티 디렉터 민지', view_count: 367000, ai_post_summary: '봄 벚꽃 시즌에 어울리는 4가지 메이크업 룩. 쉬어 벨벳 베일 틴트 핑크 계열을 립 포인트로 활용.', ai_channel_summary: '시즌별 룩북 전문 YouTube. 트렌드 해석력 높은 평가.', post_url: 'https://www.youtube.com/watch?v=example_season1', created_dt: '2026-03-10T14:00:00Z' },
      { id: 17, rank_no: 1, platform: 'tiktok', title: '화이트데이 메이크업 — 남자친구가 좋아하는 립 컬러', author_nm: '@date_beauty', view_count: 1560000, ai_post_summary: '화이트데이 데이트 메이크업 1분 튜토리얼. 쉬어 벨벳 베일 틴트 누드 핑크를 자연스러운 데이트 립으로 활용.', ai_channel_summary: 'TikTok 데이트 메이크업 전문. 20대 여성 팔로워 78%.', post_url: 'https://www.tiktok.com/@date_beauty/video/example_season2', created_dt: '2026-03-11T11:30:00Z' },
      { id: 18, rank_no: 1, platform: 'instagram', title: '졸업식 메이크업 — 사진 잘 나오는 립 컬러 추천', author_nm: '@photo_makeup_kr', view_count: 298000, ai_post_summary: '졸업식/행사 메이크업에서 사진 촬영 시 가장 예쁘게 나오는 립 컬러 추천. 플래시 반사 테스트 포함.', ai_channel_summary: 'Instagram 행사 메이크업 전문 계정. 실용적 팁으로 높은 저장율.', post_url: 'https://www.instagram.com/p/example_season3', created_dt: '2026-03-12T09:00:00Z' },
    ]},
  ],
  totalCategories: 6,
  totalContents: 18,
};

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
  { profile_id: 'INF_001', user_nm: 'Olivia Yang', platform: 'tiktok', followers: 2400000, avg_views: 840000, engagement_rate: 6.8, is_saved: true, stage: 'partnered', country: 'US', quick_summary: '글로벌 뷰티 메가 크리에이터. K-뷰티 트렌드 선도. 클렌징 루틴 콘텐츠 바이럴 경험.', profile_url: 'https://tiktok.com/@olafflee', profile_image: 'https://picsum.photos/seed/olafflee/100/100', collected_at: '2026-01-15T09:30:00Z' },
  { profile_id: 'INF_002', user_nm: '이시안 Lee Sian', platform: 'instagram', followers: 1200000, avg_views: 420000, engagement_rate: 7.5, is_saved: true, stage: 'partnered', country: 'KR', quick_summary: 'Instagram 메가 뷰티 인플루언서. 트렌드 세터. 바닐라코 장기 파트너.', profile_url: 'https://instagram.com/youseeany', profile_image: 'https://picsum.photos/seed/youseeany/100/100', collected_at: '2026-01-18T14:20:00Z' },
  { profile_id: 'INF_003', user_nm: '레오제이', platform: 'youtube', followers: 584300, avg_views: 204000, engagement_rate: 5.9, is_saved: true, stage: 'partnered', country: 'KR', quick_summary: '전문 메이크업 아티스트. 클렌징 비교 리뷰로 유명. 높은 신뢰도.', profile_url: 'https://youtube.com/@leojmakeup', profile_image: 'https://picsum.photos/seed/leojmakeup/100/100', collected_at: '2026-01-20T11:45:00Z' },

  // ── Performing (4명) ──
  { profile_id: 'INF_004', user_nm: 'Olia Majd', platform: 'tiktok', followers: 409100, avg_views: 143000, engagement_rate: 6.2, is_saved: true, stage: 'performing', country: 'US', quick_summary: '글로벌 뷰티 크리에이터. 스킨케어 루틴/리뷰 전문. 높은 참여율.', profile_url: 'https://tiktok.com/@oliamajd', profile_image: 'https://picsum.photos/seed/oliamajd/100/100', collected_at: '2026-01-22T10:15:00Z' },
  { profile_id: 'INF_005', user_nm: '미선짱', platform: 'instagram', followers: 405800, avg_views: 142000, engagement_rate: 5.8, is_saved: true, stage: 'performing', country: 'KR', quick_summary: '뷰티/라이프스타일 크리에이터. 릴스 전문. 밝은 에너지 콘텐츠.', profile_url: 'https://instagram.com/sunn416', profile_image: 'https://picsum.photos/seed/sunn416/100/100', collected_at: '2026-01-25T16:30:00Z' },
  { profile_id: 'INF_006', user_nm: 'Hasime Kukaj', platform: 'youtube', followers: 349300, avg_views: 122000, engagement_rate: 6.0, is_saved: true, stage: 'performing', country: 'US', quick_summary: '글로벌 뷰티 리뷰어. 스킨케어 추천 콘텐츠. 클렌징 밤 전문.', profile_url: 'https://youtube.com/@thebeautyradar', profile_image: 'https://picsum.photos/seed/thebeautyradar/100/100', collected_at: '2026-01-28T08:50:00Z' },
  { profile_id: 'INF_007', user_nm: '권은지', platform: 'tiktok', followers: 337900, avg_views: 118000, engagement_rate: 7.1, is_saved: true, stage: 'performing', country: 'US', quick_summary: '한국계 미국 뷰티 크리에이터. K-뷰티 브릿지 역할. 영어 콘텐츠.', profile_url: 'https://tiktok.com/@3eunji__', profile_image: 'https://picsum.photos/seed/3eunji__/100/100', collected_at: '2026-02-01T13:10:00Z' },

  // ── Posted (5명) ──
  { profile_id: 'INF_008', user_nm: '메이크업 아티스트 NANA', platform: 'instagram', followers: 292600, avg_views: 102000, engagement_rate: 5.3, is_saved: true, stage: 'posted', country: 'KR', quick_summary: '전문 메이크업 아티스트. 뷰티 튜토리얼/클렌징 루틴 전문.', profile_url: 'https://instagram.com/_twinkle_makeup_', profile_image: 'https://picsum.photos/seed/_twinkle_makeup_/100/100', collected_at: '2026-02-03T09:00:00Z' },
  { profile_id: 'INF_009', user_nm: 'Candace Hampton-Fudge', platform: 'tiktok', followers: 261200, avg_views: 91000, engagement_rate: 4.8, is_saved: true, stage: 'posted', country: 'US', quick_summary: '댈러스 기반 뷰티 크리에이터. 리얼 리뷰 전문. 성인 스킨케어.', profile_url: 'https://tiktok.com/@thebeautybeau', profile_image: 'https://picsum.photos/seed/thebeautybeau/100/100', collected_at: '2026-02-05T15:40:00Z' },
  { profile_id: 'INF_010', user_nm: '꿀아영(신아영)', platform: 'youtube', followers: 245100, avg_views: 86000, engagement_rate: 6.4, is_saved: true, stage: 'posted', country: 'KR', quick_summary: '뷰티/일상 크리에이터. 올리브영 리뷰 전문. 높은 댓글 참여율.', profile_url: 'https://youtube.com/@dkdud5070', profile_image: 'https://picsum.photos/seed/dkdud5070/100/100', collected_at: '2026-02-08T11:25:00Z' },
  { profile_id: 'INF_011', user_nm: '이향 LEE HYANG', platform: 'instagram', followers: 227900, avg_views: 80000, engagement_rate: 5.1, is_saved: true, stage: 'posted', country: 'KR', quick_summary: '뷰티/메이크업 크리에이터. 데일리 루틴 콘텐츠. 차분한 톤.', profile_url: 'https://instagram.com/_leehyang', profile_image: 'https://picsum.photos/seed/_leehyang/100/100', collected_at: '2026-02-10T17:00:00Z' },
  { profile_id: 'INF_012', user_nm: '加藤 美南', platform: 'tiktok', followers: 202300, avg_views: 71000, engagement_rate: 4.5, is_saved: true, stage: 'posted', country: 'JP', quick_summary: '일본 출신 뷰티 크리에이터. K-뷰티 리뷰. 동아시아 영향력.', profile_url: 'https://tiktok.com/@minamikato_0115', profile_image: 'https://picsum.photos/seed/minamikato/100/100', collected_at: '2026-02-12T10:35:00Z' },

  // ── Seeded (4명) ──
  { profile_id: 'INF_013', user_nm: '모델 심지영', platform: 'instagram', followers: 193900, avg_views: 68000, engagement_rate: 4.8, is_saved: true, stage: 'seeded', country: 'KR', quick_summary: '프로 모델 겸 뷰티 크리에이터. 메이크업/클렌징 루틴 콘텐츠.', profile_url: 'https://instagram.com/jy____shim', profile_image: 'https://picsum.photos/seed/jy____shim/100/100', collected_at: '2026-02-15T14:50:00Z' },
  { profile_id: 'INF_014', user_nm: 'Grazy Grace', platform: 'youtube', followers: 145600, avg_views: 51000, engagement_rate: 7.2, is_saved: true, stage: 'seeded', country: 'US', quick_summary: '한국계 미국 크리에이터. 뷰티/라이프스타일. 영어 콘텐츠.', profile_url: 'https://youtube.com/@gebabyk', profile_image: 'https://picsum.photos/seed/gebabyk/100/100', collected_at: '2026-02-18T09:20:00Z' },
  { profile_id: 'INF_015', user_nm: '倉田乃彩', platform: 'tiktok', followers: 144100, avg_views: 50000, engagement_rate: 5.0, is_saved: true, stage: 'seeded', country: 'JP', quick_summary: '일본 뷰티 크리에이터. K-뷰티 리뷰 전문. 일본 시장 영향력.', profile_url: 'https://tiktok.com/@i_09_noa', profile_image: 'https://picsum.photos/seed/i_09_noa/100/100', collected_at: '2026-02-20T12:15:00Z' },
  { profile_id: 'INF_016', user_nm: 'Shim hye jin', platform: 'instagram', followers: 140100, avg_views: 49000, engagement_rate: 4.8, is_saved: true, stage: 'seeded', country: 'KR', quick_summary: '뷰티/패션 크리에이터. 일본어/영어 다국어 콘텐츠.', profile_url: 'https://instagram.com/hyedini_sim', profile_image: 'https://picsum.photos/seed/hyedini_sim/100/100', collected_at: '2026-02-22T16:45:00Z' },

  // ── Discovered (4명) ──
  { profile_id: 'INF_017', user_nm: 'Megan', platform: 'tiktok', followers: 131700, avg_views: 46000, engagement_rate: 7.8, is_saved: false, stage: 'discovered', country: 'US', quick_summary: '글로벌 뷰티 리뷰어. K-뷰티 전문. 높은 참여율.', profile_url: 'https://tiktok.com/@milktea.meg', profile_image: 'https://picsum.photos/seed/milktea.meg/100/100', collected_at: '2026-02-25T08:30:00Z' },
  { profile_id: 'INF_018', user_nm: '오민초 Mincho Oh', platform: 'youtube', followers: 121500, avg_views: 43000, engagement_rate: 5.6, is_saved: false, stage: 'discovered', country: 'KR', quick_summary: '뷰티/라이프 크리에이터. 자연스러운 데일리 루틴.', profile_url: 'https://youtube.com/@mincho_oh', profile_image: 'https://picsum.photos/seed/mincho_oh/100/100', collected_at: '2026-02-28T11:00:00Z' },
  { profile_id: 'INF_019', user_nm: '채원 Chaewon', platform: 'instagram', followers: 119000, avg_views: 42000, engagement_rate: 7.4, is_saved: false, stage: 'discovered', country: 'US', quick_summary: '글로벌 K-뷰티 크리에이터. 영어 콘텐츠. 높은 참여율.', profile_url: 'https://instagram.com/chaewonsays', profile_image: 'https://picsum.photos/seed/chaewonsays/100/100', collected_at: '2026-03-02T13:40:00Z' },
  { profile_id: 'INF_020', user_nm: '모하뉴', platform: 'tiktok', followers: 99400, avg_views: 35000, engagement_rate: 6.5, is_saved: false, stage: 'discovered', country: 'KR', quick_summary: '뷰티/일상 크리에이터. 스킨케어 루틴 콘텐츠. 댓글 소통 활발.', profile_url: 'https://tiktok.com/@ujjja_e', profile_image: 'https://picsum.photos/seed/ujjja_e/100/100', collected_at: '2026-03-05T15:20:00Z' },
];

// ─ Influencer Deep Analysis (프로필별 심층 분석 결과) ─
const _deepAnalysisProfiles = {
  INF_001: {
    overview: {
      '성별': '여성', '연령대': '20-30대',
      '라이프스타일': ['글로벌 K-뷰티 트렌드세터', 'GRWM 루틴 전문가', '뷰티 덕후'],
      '콘텐츠': 'K-뷰티 클렌징/스킨케어 루틴을 TikTok에서 바이럴시키는 메가 크리에이터. GRWM과 ASMR 포맷으로 높은 완시청률 달성.',
      '채널 특징': { '톤앤무드': '밝고 트렌디, 친근한 언니 느낌', '특징': 'K-뷰티 전문 글로벌 채널', '연출 스타일': '클로즈업 중심, 빠른 컷 편집, 트렌딩 사운드 활용' },
      '피부특성': { '피부타입': '복합성', '피부특징': '수분 밸런스 중시, 클렌징 루틴 강조' },
      '타겟_오디언스': {
        '설명': ['P1 피부 입문자 — 뷰티 트렌드에 민감한 Z세대', 'P3 스킨케어 마니아 — 성분/루틴에 관심 높은 팔로워'],
        '태그': ['#K뷰티루틴', '#클렌징밤', '#GRWM', '#스킨케어팁', '#겟레디윗미'],
      },
      '콘텐츠 강점': { '팔로워_특징': '18-24 여성 42%, 높은 Z세대 비중', '주간_컨텐츠_업로드_평균_회수_최근30일': '주 5.5회', '인게이지먼트_최근30일': '6.8% (카테고리 평균 3.2% 대비 2.1배)' },
      '최근_30일_콘텐츠_유형_분포': { '유형별_비중': [{ '유형': 'GRWM/루틴', '비중': '40%' }, { '유형': '제품 리뷰', '비중': '30%' }, { '유형': 'ASMR', '비중': '20%' }, { '유형': '일상 브이로그', '비중': '10%' }] },
      '주요_토픽_및_키워드': ['K-뷰티 루틴', '클렌징 리뷰', '스킨케어 팁', '겟레디윗미', 'ASMR 언박싱', '올리브영 추천'],
      '시딩_캠페인_적용_포인트': [
        'GRWM 포맷에서 클렌징 단계 자연스럽게 제품 노출 — 완시청률 45%+ 기대',
        'ASMR 포맷 활용 시 제품 텍스처·소리 강조로 감각적 소구 가능',
        '글로벌 팔로워 비중 높아 해외 시장 동시 노출 효과',
        '기존 K-뷰티 클렌징 콘텐츠 바이럴 경험으로 빠른 초기 도달 예상',
      ],
    },
    contentAnalysis: {
      '콘텐츠_최적화_개선안_마크다운': '### 🟢 강점\n**GRWM 루틴 콘텐츠** 완시청률이 카테고리 평균 대비 2배 이상 높음\n**트렌딩 사운드 활용** 알고리즘 노출 극대화\n\n### 🟡 개선 포인트\n**제품 클로즈업 시간** 현재 평균 3초 → 5초로 확대 시 브랜드 인지도 +15%\n**CTA 삽입** 영상 후반 구매 링크 언급 추가 필요\n\n### 🔴 주의사항\n**광고 표시** FTC 가이드라인 준수 필수 — #ad 또는 #sponsored 태그',
    },
  },
  INF_002: {
    overview: {
      '성별': '여성', '연령대': '25-34세',
      '라이프스타일': ['K-뷰티 트렌드 세터', '인스타 릴스 전문가', '감성 뷰티'],
      '콘텐츠': 'Instagram 메가 뷰티 인플루언서. 감성적 비주얼과 전문적 리뷰를 결합한 콘텐츠로 높은 저장율 달성.',
      '채널 특징': { '톤앤무드': '세련되고 감성적, 프리미엄 느낌', '특징': 'Instagram 뷰티 카테고리 TOP 크리에이터', '연출 스타일': '고퀄리티 비주얼, 캐러셀 활용, 디테일 샷' },
      '피부특성': { '피부타입': '건성', '피부특징': '보습 중심 루틴, 촉촉한 피부 강조' },
      '타겟_오디언스': {
        '설명': ['P3 스킨케어 마니아 — 성분/효능에 관심 높은 팔로워', 'P11 럭셔리 스테이머 — 프리미엄 뷰티에 관심'],
        '태그': ['#뷰티리뷰', '#스킨케어', '#인스타뷰티', '#감성메이크업', '#데일리루틴'],
      },
      '콘텐츠 강점': { '팔로워_특징': '25-34 여성 52%, 고소득 직장인 비중 높음', '주간_컨텐츠_업로드_평균_회수_최근30일': '주 4.2회', '인게이지먼트_최근30일': '7.5% (카테고리 평균 2.8% 대비 2.7배)' },
      '최근_30일_콘텐츠_유형_분포': { '유형별_비중': [{ '유형': '릴스 리뷰', '비중': '45%' }, { '유형': '캐러셀 성분분석', '비중': '25%' }, { '유형': '일상 스토리', '비중': '20%' }, { '유형': '콜라보', '비중': '10%' }] },
      '주요_토픽_및_키워드': ['뷰티 리뷰', '스킨케어 루틴', '성분 분석', '데일리 메이크업', '올리브영 추천'],
      '시딩_캠페인_적용_포인트': [
        '캐러셀 포맷에서 Before/After + 성분 설명 → 저장율 8%+ 기대',
        '장기 파트너십 경험으로 브랜드 메시지 자연스러운 전달 가능',
        '높은 저장율이 특징 — Reveal 단계 교육형 콘텐츠에 최적',
        '감성적 비주얼로 프리미엄 브랜드 이미지 강화 효과',
      ],
    },
    contentAnalysis: {
      '콘텐츠_최적화_개선안_마크다운': '### 🟢 강점\n**감성 비주얼** 저장율이 카테고리 평균 3배 이상\n**캐러셀 활용** 성분 교육 콘텐츠 높은 완독률\n\n### 🟡 개선 포인트\n**릴스 길이** 현재 45초 평균 → 30초 이내로 축소 시 완시청률 +20%\n**해시태그 전략** 브랜드 태그 + 카테고리 태그 조합 최적화 필요',
    },
  },
  INF_003: {
    overview: {
      '성별': '남성', '연령대': '30-40대',
      '라이프스타일': ['전문 메이크업 아티스트', '클렌징 비교 리뷰어', '신뢰도 높은 전문가'],
      '콘텐츠': 'YouTube 전문 메이크업 아티스트. 클렌징 비교 리뷰로 유명하며, 객관적이고 전문적인 분석으로 높은 신뢰도 보유.',
      '채널 특징': { '톤앤무드': '전문적이고 신뢰감 있는, 차분한 톤', '특징': '클렌징/스킨케어 비교 리뷰 전문', '연출 스타일': '상세 클로즈업, 비교 실험, 성분 분석 자막' },
      '피부특성': { '피부타입': '지성', '피부특징': '클렌징력 비교, 모공 관리 전문' },
      '타겟_오디언스': {
        '설명': ['P3 스킨케어 마니아 — 성분/비교 분석에 관심', 'P7 트러블 슈터 — 클렌징+모공 관리 관심'],
        '태그': ['#클렌징비교', '#뷰티전문가', '#성분분석', '#메이크업아티스트', '#스킨케어리뷰'],
      },
      '콘텐츠 강점': { '팔로워_특징': '25-44 남녀 골고루, 뷰티 전문 관심층', '주간_컨텐츠_업로드_평균_회수_최근30일': '주 2.5회', '인게이지먼트_최근30일': '5.9% (YouTube 뷰티 카테고리 평균 2.1% 대비 2.8배)' },
      '최근_30일_콘텐츠_유형_분포': { '유형별_비중': [{ '유형': '비교 리뷰', '비중': '50%' }, { '유형': '튜토리얼', '비중': '25%' }, { '유형': '성분 분석', '비중': '15%' }, { '유형': '일상', '비중': '10%' }] },
      '주요_토픽_및_키워드': ['클렌징 비교', '성분 분석', '메이크업 튜토리얼', '스킨케어 루틴', '뷰티 전문가 추천'],
      '시딩_캠페인_적용_포인트': [
        '비교 리뷰 포맷에서 경쟁사 대비 우위를 객관적으로 보여줄 수 있음',
        'Validate 단계 전문가 리뷰로 구매 확신 강화에 최적',
        '높은 시청 시간 — 상세 리뷰 콘텐츠 완시청률 68%+',
        '댓글 질의응답 활발 — 제품 궁금증 해소에 효과적',
      ],
    },
    contentAnalysis: {
      '콘텐츠_최적화_개선안_마크다운': '### 🟢 강점\n**비교 리뷰 전문성** 시청자 신뢰도 최상위\n**상세 분석** 시청 시간 카테고리 대비 1.8배\n\n### 🟡 개선 포인트\n**썸네일 최적화** CTR 현재 4.2% → 비교 이미지 강조 시 6%+ 기대\n**Shorts 활용** 비교 하이라이트 30초 편집 → 신규 유입 확대',
    },
  },
};

// 기본 fallback (프로필별 매핑 없는 인플루언서용)
const _defaultDeepAnalysis = {
  overview: {
    '성별': '여성', '연령대': '20-30대',
    '라이프스타일': ['뷰티 크리에이터', '스킨케어 관심'],
    '콘텐츠': '뷰티/스킨케어 전문 크리에이터. 제품 리뷰와 루틴 콘텐츠로 꾸준한 팔로워 성장 중.',
    '채널 특징': { '톤앤무드': '밝고 친근한', '특징': '뷰티 리뷰 전문 채널', '연출 스타일': '자연광 촬영, 깔끔한 편집' },
    '피부특성': { '피부타입': '복합성', '피부특징': '일반적 스킨케어 루틴 중시' },
    '타겟_오디언스': {
      '설명': ['P1 피부 입문자 — 기본 스킨케어에 관심', 'P2 효율 추구형 — 가성비 제품 선호'],
      '태그': ['#뷰티', '#스킨케어', '#데일리루틴', '#제품리뷰'],
    },
    '콘텐츠 강점': { '팔로워_특징': '20-34 여성 중심', '주간_컨텐츠_업로드_평균_회수_최근30일': '주 3회', '인게이지먼트_최근30일': '5.2%' },
    '최근_30일_콘텐츠_유형_분포': { '유형별_비중': [{ '유형': '제품 리뷰', '비중': '45%' }, { '유형': '루틴 콘텐츠', '비중': '30%' }, { '유형': '일상', '비중': '25%' }] },
    '주요_토픽_및_키워드': ['뷰티 리뷰', '스킨케어 루틴', '올리브영 추천', '데일리 메이크업'],
    '시딩_캠페인_적용_포인트': [
      '제품 리뷰 콘텐츠에서 자연스러운 사용 장면 연출 가능',
      '팔로워와의 소통이 활발하여 댓글 기반 바이럴 기대',
    ],
  },
  contentAnalysis: {
    '콘텐츠_최적화_개선안_마크다운': '### 🟢 강점\n**꾸준한 업로드** 팔로워 신뢰도 확보\n\n### 🟡 개선 포인트\n**CTA 강화** 제품 링크 및 프로모션 코드 활용 추가 권장',
  },
};

export function getMockDeepAnalysis(profileId) {
  return _deepAnalysisProfiles[profileId] || _defaultDeepAnalysis;
}

export const mockInfluencerDeepAnalysis = {
  success: true,
  data: _deepAnalysisProfiles.INF_001,
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
      return mockCreatives.find(c => String(c.creative_id) === String(cid)) || mockCreatives[0];
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
  if (pathname === '/api/contents/ugc/insights') return mockUGCCategoryInsights;

  // Influencer
  if (pathname === '/api/influencer/list') return { success: true, list: mockInfluencerPool };
  if (pathname === '/api/influencer/count') return { success: true, count: mockInfluencerPool.length };
  if (pathname === '/api/influencer/partnered-count') return { success: true, count: mockInfluencerPool.filter(i => i.stage === 'partnered').length };
  if (/^\/api\/influencer\/deep-analysis\//.test(pathname)) {
    const profileId = pathname.split('/').pop();
    return { success: true, data: getMockDeepAnalysis(profileId) };
  }

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

    // 실제 서버로 패스스루할 API 경로들
    if (
        // AI 이미지/영상/나레이션 생성
        pathname.startsWith('/api/ai-image/') ||
        pathname === '/api/v2/tts/generate' ||
        pathname === '/api/v2/tts/actors' ||
        pathname.startsWith('/api/v2/video/') ||
        // 캠페인 CRUD + 하위 리소스 (크리에이티브, PDA, 전략, 캘린더 등)
        pathname.startsWith('/api/v2/campaigns') ||
        // 마스터 PDA
        pathname.startsWith('/api/v2/master-pda') ||
        // 브랜드 DNA
        pathname.startsWith('/api/v2/brand-dna')
    ) {
      return originalFetch(input, init);
    }

    // POST인데 실질적으로 query인 케이스 (video analysis statuses polling)
    if (method === 'POST' && pathname === '/api/contents/videoAnalysis/statuses') {
      await delay(200);
      return jsonResponse(mockVideoAnalysisStatuses);
    }

    // 인플루언서 심층 분석 → 프로필별 분석 결과 반환
    if (method === 'POST' && pathname === '/api/influencer/deep-analysis') {
      await delay(1500);
      let profileId = null;
      try {
        const body = JSON.parse(init.body || '{}');
        profileId = body.influencers?.[0]?.profile_id;
      } catch (_) { /* ignore */ }
      const analysis = getMockDeepAnalysis(profileId);
      return jsonResponse({
        success: true,
        results: [{ profile_id: profileId, analysis }],
      });
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
