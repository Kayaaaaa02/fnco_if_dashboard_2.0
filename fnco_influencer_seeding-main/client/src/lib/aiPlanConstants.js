/**
 * 콘텐츠 타입별 훅(hook) 전략 매핑
 * V1 AI-PLAN 시스템의 콘텐츠 유형 → 한국어 훅 문구 매핑
 */
export const CONTENT_TYPE_TO_HOOKS = {
  grwm: { label: 'GRWM', hooks: ['출근 준비하면서 같이 써볼까?', '오늘의 겟레디윗미 시작!'] },
  routine: { label: '루틴', hooks: ['아침 루틴에 꼭 빠지지 않는 아이템', '자기 전 필수 루틴 공개'] },
  daily: { label: '일상', hooks: ['요즘 매일 쓰는 갓생템', '일상에서 빠질 수 없는 아이'] },
  review: { label: '리뷰', hooks: ['한 달 써보고 솔직 리뷰', '광고 아님! 진짜 후기'] },
  info: { label: '정보성', hooks: ['이거 모르면 손해!', '아직도 이렇게 쓰세요?'] },
  asmr: { label: 'ASMR', hooks: ['이 소리 들어보세요', '소리로 느끼는 제품 언박싱'] },
  recommend: { label: '추천', hooks: ['무조건 사야 하는 템 TOP3', '이건 진짜 강추!'] },
  haul: { label: '하울', hooks: ['이번 달 쇼핑 하울 공개!', '지름신 강림한 날'] },
  beforeafter: { label: '비포애프터', hooks: ['1주일 사용 전후 비교', '진짜 달라졌을까?'] },
};

/**
 * 4-Step 타임라인 구간 (15초 쇼츠 기준)
 */
export const STEP_TIME_RANGES = [
  { key: 'HOOK', label: '후킹', range: '0-3초', seconds: [0, 3], description: '시선 사로잡기' },
  { key: 'MIDDLE', label: '전개', range: '3-9초', seconds: [3, 9], description: '핵심 내용 전달' },
  { key: 'HIGHLIGHT', label: '하이라이트', range: '9-13초', seconds: [9, 13], description: '제품/서비스 강조' },
  { key: 'CTA', label: 'CTA', range: '13-15초', seconds: [13, 15], description: '행동 유도' },
];

/**
 * 콘텐츠 타입 ID 매핑
 */
export const CONTENT_TYPE_ID_MAP = {
  grwm: 1, routine: 2, daily: 3, review: 4,
  info: 5, asmr: 6, recommend: 7, haul: 8, beforeafter: 9,
};

/**
 * 카테고리 ID 매핑
 */
export const CATEGORY_ID_MAP = {
  beauty: 1, fashion: 2, food: 3, lifestyle: 4,
  tech: 5, travel: 6, fitness: 7, parenting: 8,
};
