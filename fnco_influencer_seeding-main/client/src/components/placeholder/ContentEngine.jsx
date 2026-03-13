import { useMemo, useState, useEffect } from 'react';
import { Search, Eye, Heart, MessageCircle, Share2, Sparkles, Globe2, ArrowUpRight, Plus, Info, ChevronDown, ChevronUp, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { useContentLibrary, useUGCCategoryInsights } from '@/hooks/useContentLibrary.js';
import { formatCompactNumber, getPlatformMeta, tokens } from '@/styles/designTokens.js';
import SeedingContentForm from '@/components/content-engine/SeedingContentForm.jsx';
import UGCContentForm from '@/components/content-engine/UGCContentForm.jsx';
import PerformanceRuleSettings from '@/components/content-engine/PerformanceRuleSettings.jsx';

const CONTENT_TABS = [
  { value: 'seeding', label: '시딩 콘텐츠' },
  { value: 'ugc', label: 'UGC 콘텐츠' },
  { value: 'preview', label: '프리뷰' },
  { value: 'performance', label: '성과 콘텐츠' },
  { value: 'rules', label: '성과 룰' },
];

const FALLBACK_CONTENT = {
  seeding: [
    { id: 'DRb3tNHE0na', title: '술 먹는 날 필수 루틴 공유합미다 ㅋㅅㅋ', platform: 'instagram', author_nm: 'sunn416', view_count: 3027837, like_count: 5975, comment_count: 447, seeding_cntry: 'KR', upload_dt: '2025-11-23', post_url: 'https://www.instagram.com/reels/DRb3tNHE0na/', campaign_name: '[올영세일] 화이트쿠션', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DRb3tNHE0na/DRb3tNHE0na_1.mp4'] },
    { id: 'DUVhZQSAa5L', title: '겨울 광채쿠션 10명한테 쏠게요 - 내돈내산 이벤뜨', platform: 'instagram', author_nm: 'leojmakeup', view_count: 132126, like_count: 1623, comment_count: 503, seeding_cntry: 'KR', upload_dt: '2026-02-03', post_url: 'https://www.instagram.com/reels/DUVhZQSAa5L/', campaign_name: '에센스 스킨 핑크 쿠션', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUVhZQSAa5L/DUVhZQSAa5L_1.mp4'] },
    { id: 'ygmRIIkh49Y', title: '사랑도 렌탈이 되나요? | EP.01 렌탈 남친', platform: 'youtube', author_nm: 'just_Leemijoo', view_count: 400002, like_count: 5600, comment_count: 518, seeding_cntry: 'KR', upload_dt: '2026-01-22', post_url: 'https://www.youtube.com/watch?v=ygmRIIkh49Y', campaign_name: '에센스 스킨 핑크 쿠션', thumbnail_url: 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/ygmRIIkh49Y/ygmRIIkh49Y_thumb.jpg' },
    { id: '4Vb70n8ZMxQ', title: '10년차 여드름 피부의 세수 asmr', platform: 'youtube', author_nm: 'm1ngd.c', view_count: 39299, like_count: 702, comment_count: 10, seeding_cntry: 'KR', upload_dt: '2026-01-31', post_url: 'https://www.youtube.com/shorts/4Vb70n8ZMxQ', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', thumbnail_url: 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/4Vb70n8ZMxQ/4Vb70n8ZMxQ_thumb.jpg' },
    { id: '8H6J592fJug', title: '파우더로 얼굴 사기치는 법? 뷰티마케터가 알려드림', platform: 'youtube', author_nm: 'HIIZ.beauty', view_count: 12742, like_count: 240, comment_count: 5, seeding_cntry: 'KR', upload_dt: '2025-11-29', post_url: 'https://www.youtube.com/shorts/8H6J592fJug', campaign_name: '프라임 프라이머 피니쉬 파우더', thumbnail_url: 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/8H6J592fJug/8H6J592fJug_thumb.jpg' },
    { id: 'qDVDuE-KAWI', title: '톤그로 절대 없는 올영세일 립앤치크 추천', platform: 'youtube', author_nm: 'kyeol_see', view_count: 27687, like_count: 390, comment_count: 12, seeding_cntry: 'KR', upload_dt: '2025-12-04', post_url: 'https://www.youtube.com/shorts/qDVDuE-KAWI', campaign_name: '[올영세일] 립앤치크', thumbnail_url: 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/qDVDuE-KAWI/qDVDuE-KAWI_thumb.jpg' },
    { id: 'DUIRsQqgUVP', title: '바닐라코 베스트셀러! 클린 잇 제로 클렌징 밤 망곰 에디션', platform: 'instagram', author_nm: 's.u.my', view_count: 1374203, like_count: 344, comment_count: 4, seeding_cntry: 'KR', upload_dt: '2026-01-29', post_url: 'https://www.instagram.com/reels/DUIRsQqgUVP/', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUIRsQqgUVP/DUIRsQqgUVP_1.mp4'] },
    { id: 'DUNsV89icxG', title: '바닐라코 클린 잇 제로 [망곰 에디션]', platform: 'instagram', author_nm: 'sseohhyo', view_count: 1467525, like_count: 0, comment_count: 17, seeding_cntry: 'KR', upload_dt: '2026-01-31', post_url: 'https://www.instagram.com/p/DUNsV89icxG/', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUNsV89icxG/DUNsV89icxG_1.mp4'] },
  ],
  ugc: [
    { id: 'AgocxhJrQh4', title: '한국 화장품은 왜 노랗냐며 충격받은 외국인들', platform: 'youtube', author_nm: '스타템픽', view_count: 5701257, like_count: 33000, comment_count: 883, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.youtube.com/shorts/AgocxhJrQh4', campaign_name: 'TOP3_2026-03-06', media_url: ['https://www.youtube.com/shorts/AgocxhJrQh4'] },
    { id: '7568725417998241042', title: '외국언니들이 쓸어가는 올영 마스크팩 넘버즈인 3번', platform: 'tiktok', author_nm: 'yunsecho', view_count: 4700000, like_count: 4902, comment_count: 71, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.tiktok.com/@yunsecho/video/7568725417998241042', campaign_name: 'TOP3_2026-03-05', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/tiktok/7568725417998241042/7568725417998241042.mp4'] },
    { id: '7578477196839292168', title: '아니 이렇게 따가운팩이 어딨어!!!!', platform: 'tiktok', author_nm: 'ramnuggi', view_count: 2700000, like_count: 10500, comment_count: 192, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.tiktok.com/@ramnuggi/video/7578477196839292168', campaign_name: 'TOP3_2026-03-05', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/tiktok/7578477196839292168/7578477196839292168.mp4'] },
    { id: '7578103446755380498', title: '따가운 팩 절대 버리면 안되는 이유는?', platform: 'tiktok', author_nm: 'chae._.ullet', view_count: 2300000, like_count: 6557, comment_count: 77, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.tiktok.com/@chae._.ullet/video/7578103446755380498', campaign_name: 'TOP3_2026-03-05', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/tiktok/7578103446755380498/7578103446755380498.mp4'] },
    { id: 'JI58XdTECGw', title: '쿠션이 자꾸 들뜨고 밀린다면 보세요', platform: 'youtube', author_nm: 'Jella젤라', view_count: 2216514, like_count: 28000, comment_count: 285, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.youtube.com/shorts/JI58XdTECGw', campaign_name: 'TOP3_2026-03-06', media_url: ['https://www.youtube.com/shorts/JI58XdTECGw'] },
    { id: '7577769221887708424', title: '이게 왜 유행..? 다이소 신상 블랙 립밤?', platform: 'tiktok', author_nm: 'hwane_online', view_count: 1300000, like_count: 22100, comment_count: 83, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.tiktok.com/@hwane_online/video/7577769221887708424', campaign_name: 'TOP3_2026-03-05', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/tiktok/7577769221887708424/7577769221887708424.mp4'] },
    { id: 'DRa4ULRk6sM', title: '얼마나 마르고 닳도록 쓴거니? 이거 한번 써볼래?', platform: 'instagram', author_nm: 'bonito_435', view_count: 1249897, like_count: 0, comment_count: 31, seeding_cntry: 'KR', upload_dt: '2025-11-23', post_url: 'https://www.instagram.com/p/DRa4ULRk6sM/', campaign_name: 'TOP3_2026-03-04', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DRa4ULRk6sM/DRa4ULRk6sM.mp4'] },
    { id: 'i07VtjCP2Mw', title: '가구에 선크림을 바르면 놀라운 일이 생깁니다', platform: 'youtube', author_nm: 'Spring_butler', view_count: 1138645, like_count: 24000, comment_count: 484, seeding_cntry: 'KR', upload_dt: '', post_url: 'https://www.youtube.com/shorts/i07VtjCP2Mw', campaign_name: 'TOP3_2026-03-04', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/i07VtjCP2Mw/i07VtjCP2Mw_thumb.jpg'] },
  ],
  preview: [
    { id: 'DUNsV89icxG', title: '바닐라코 클린 잇 제로 [망곰 에디션]', platform: 'instagram', author_nm: 'sseohhyo', view_count: 1467525, like_count: 0, comment_count: 17, seeding_cntry: 'KR', upload_dt: '2026-01-31', post_url: 'https://www.instagram.com/p/DUNsV89icxG/', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUNsV89icxG/DUNsV89icxG_1.mp4'] },
    { id: 'DUIRsQqgUVP', title: '바닐라코 클린 잇 제로 클렌징 밤 망곰 에디션 출시', platform: 'instagram', author_nm: 's.u.my', view_count: 1374203, like_count: 344, comment_count: 4, seeding_cntry: 'KR', upload_dt: '2026-01-29', post_url: 'https://www.instagram.com/reels/DUIRsQqgUVP/', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUIRsQqgUVP/DUIRsQqgUVP_1.mp4'] },
    { id: 'DRb3tNHE0na', title: '술 먹는 날 필수 루틴 - 바닐라코 화이트쿠션', platform: 'instagram', author_nm: 'sunn416', view_count: 3027837, like_count: 5975, comment_count: 447, seeding_cntry: 'KR', upload_dt: '2025-11-23', post_url: 'https://www.instagram.com/reels/DRb3tNHE0na/', campaign_name: '[올영세일] 화이트쿠션', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DRb3tNHE0na/DRb3tNHE0na_1.mp4'] },
  ],
  performance: [
    { id: 'DUNsV89icxG', title: '바닐라코 클린 잇 제로 [망곰 에디션]', platform: 'instagram', author_nm: 'sseohhyo', view_count: 1467525, like_count: 0, comment_count: 17, seeding_cntry: 'KR', upload_dt: '2026-01-31', post_url: 'https://www.instagram.com/p/DUNsV89icxG/', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUNsV89icxG/DUNsV89icxG_1.mp4'] },
    { id: 'DUIRsQqgUVP', title: '바닐라코 클린 잇 제로 클렌징 밤 망곰 에디션 출시', platform: 'instagram', author_nm: 's.u.my', view_count: 1374203, like_count: 344, comment_count: 4, seeding_cntry: 'KR', upload_dt: '2026-01-29', post_url: 'https://www.instagram.com/reels/DUIRsQqgUVP/', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUIRsQqgUVP/DUIRsQqgUVP_1.mp4'] },
    { id: 'DRb3tNHE0na', title: '술 먹는 날 필수 루틴 - 바닐라코 화이트쿠션', platform: 'instagram', author_nm: 'sunn416', view_count: 3027837, like_count: 5975, comment_count: 447, seeding_cntry: 'KR', upload_dt: '2025-11-23', post_url: 'https://www.instagram.com/reels/DRb3tNHE0na/', campaign_name: '[올영세일] 화이트쿠션', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DRb3tNHE0na/DRb3tNHE0na_1.mp4'] },
    { id: 'DUVhZQSAa5L', title: '겨울 광채쿠션 - 에센스 스킨 핑크 쿠션', platform: 'instagram', author_nm: 'leojmakeup', view_count: 132126, like_count: 1623, comment_count: 503, seeding_cntry: 'KR', upload_dt: '2026-02-03', post_url: 'https://www.instagram.com/reels/DUVhZQSAa5L/', campaign_name: '에센스 스킨 핑크 쿠션', media_url: ['https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/instagram/DUVhZQSAa5L/DUVhZQSAa5L_1.mp4'] },
    { id: 'ygmRIIkh49Y', title: '사랑도 렌탈이 되나요? EP.01 렌탈 남친', platform: 'youtube', author_nm: 'just_Leemijoo', view_count: 400002, like_count: 5600, comment_count: 518, seeding_cntry: 'KR', upload_dt: '2026-01-22', post_url: 'https://www.youtube.com/watch?v=ygmRIIkh49Y', campaign_name: '에센스 스킨 핑크 쿠션', thumbnail_url: 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/ygmRIIkh49Y/ygmRIIkh49Y_thumb.jpg' },
    { id: '4Vb70n8ZMxQ', title: '10년차 여드름 피부의 세수 asmr', platform: 'youtube', author_nm: 'm1ngd.c', view_count: 39299, like_count: 702, comment_count: 10, seeding_cntry: 'KR', upload_dt: '2026-01-31', post_url: 'https://www.youtube.com/shorts/4Vb70n8ZMxQ', campaign_name: '클린 잇 제로 3종 [망곰 에디션]', thumbnail_url: 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com/social/channel/youtube/4Vb70n8ZMxQ/4Vb70n8ZMxQ_thumb.jpg' },
  ],
};

function normalizeResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function resolveThumbnail(item) {
  // 1) explicit thumbnail_url
  if (item.thumbnail_url) return item.thumbnail_url;

  // 2) media_url array — find _thumb.jpg or derive from video
  const mediaArr = Array.isArray(item.media_url) ? item.media_url : [];
  const thumbFromMedia = mediaArr.find((u) => typeof u === 'string' && u.includes('_thumb'));
  if (thumbFromMedia) return thumbFromMedia;

  // 3) YouTube: use public i.ytimg.com
  const postId = item.post_id || item.id || '';
  if (item.platform === 'youtube' && postId) {
    return `https://i.ytimg.com/vi/${postId}/hqdefault.jpg`;
  }

  // 4) Instagram mp4 on S3 — replace _1.mp4 with _thumb.jpg attempt
  const mp4 = mediaArr.find((u) => typeof u === 'string' && u.endsWith('.mp4'));
  if (mp4) {
    return mp4.replace(/_\d+\.mp4$/, '_thumb.jpg');
  }

  return '';
}

/* ── GEO Ready 복합 점수 (5시그널, 배점 설정 가능) ── */
const GEO_GLOBAL_KEYWORDS = ['asmr', 'tutorial', 'demo', 'unboxing', 'review', 'haul', 'grwm', 'get ready', 'routine', 'skincare', 'makeup'];

function calcGeoScore(item, views, engagement, allContents, rules) {
  let score = 0;
  const sigPerf = rules?.geoSigPerformance ?? 20;
  const sigPlat = rules?.geoSigPlatform ?? 20;
  const sigKw = rules?.geoSigKeyword ?? 20;
  const sigEdit = rules?.geoSigFncoEdit ?? 20;
  const sigGlobal = rules?.geoSigGlobalSeeding ?? 20;
  const viewThreshold = rules?.geoViewThreshold ?? 100000;
  const engThreshold = rules?.geoEngagementThreshold ?? 2;

  // ① 성과 임계치 초과
  if (views >= viewThreshold && engagement >= engThreshold) score += sigPerf;

  // ② 플랫폼 글로벌 도달력
  const platform = (item.platform || '').toLowerCase();
  if (platform === 'youtube') score += sigPlat;
  else if (platform === 'tiktok') score += Math.round(sigPlat * 0.75);
  else if (platform === 'instagram') score += Math.round(sigPlat * 0.5);

  // ③ 비언어적 콘텐츠 비중
  const keywords = (item.keyword || item.video_keywords || item.title || '').toLowerCase();
  if (GEO_GLOBAL_KEYWORDS.some((kw) => keywords.includes(kw))) score += sigKw;

  // ④ FNCO 편집본 존재
  if (item.is_fnco_edit) score += sigEdit;

  // ⑤ 동일 제품 글로벌 시딩 이력
  if (allContents && item.seeding_product) {
    const countries = new Set(
      allContents
        .filter((c) => (c.seeding_product || c.seeding_item) === (item.seeding_product || item.seeding_item))
        .map((c) => c.seeding_cntry || c.country || 'KR')
    );
    if (countries.size >= 2) score += sigGlobal;
  }

  return score;
}

function getGeoGrade(score, rules) {
  const readyThreshold = rules?.geoGradeReady ?? 80;
  const potentialThreshold = rules?.geoGradePotential ?? 50;
  if (score >= readyThreshold) return { grade: 'Ready', color: '#10b981', bg: '#d1fae5' };
  if (score >= potentialThreshold) return { grade: 'Potential', color: '#f59e0b', bg: '#fef3c7' };
  return { grade: 'Local', color: '#94a3b8', bg: '#f1f5f9' };
}

/* ── BF (Brief Fit) 복합 점수 (100점 만점) ── */
function calcBfScore(item, views, engagement, perfRules) {
  let funnelScore = 0;   // ① 퍼널 정합 (30pt)
  let hookScore = 0;     // ② Hook 적합 (30pt)
  let marketScore = 0;   // ③ 시장 반응 (40pt)

  // ① 퍼널 정합: 영상 분석 결과가 있으면 플랫폼-퍼널 매칭 평가
  const platform = (item.platform || '').toLowerCase();
  const funnel = (item.funnel || item.concept_funnel || '').toUpperCase();
  const hasAnalysis = !!(item.analysis_high_a || item.analysis_high_c || item.video_analysis_status === 'completed');

  if (hasAnalysis) {
    // 영상 분석 완료 + 플랫폼-퍼널 자연 매칭
    const funnelFitMap = {
      TOFU: { tiktok: 30, instagram: 22, youtube: 15 },
      MOFU: { instagram: 30, youtube: 22, tiktok: 15 },
      BOFU: { youtube: 30, instagram: 22, tiktok: 15 },
    };
    funnelScore = funnelFitMap[funnel]?.[platform] ?? 15;
  } else if (funnel) {
    // 영상 분석 없지만 퍼널 정보는 있음 — 기본 매칭만
    funnelScore = 15;
  }

  // ② Hook 적합: 영상 분석 Hook 섹션 존재 + copy_type 지정 여부
  const hasHookAnalysis = !!item.analysis_high_a;
  const hasCopyType = !!(item.copy_type || item.concept_copy_type);
  if (hasHookAnalysis && hasCopyType) hookScore = 30;
  else if (hasHookAnalysis || hasCopyType) hookScore = 15;

  // ③ 시장 반응: 사용자 설정 우수 콘텐츠 룰 충족 여부
  const rules = perfRules || { engagementThreshold: 2, viewCountThreshold: 100000 };
  let marketChecks = 0;
  let marketTotal = 0;

  // 참여율 체크
  marketTotal++;
  if (engagement >= (rules.engagementThreshold || 2)) marketChecks++;

  // 조회수 체크
  marketTotal++;
  if (views >= (rules.viewCountThreshold || 100000)) marketChecks++;

  // GEO Ready 체크 (룰에서 필수로 설정한 경우)
  if (rules.geoReadyRequired) {
    marketTotal++;
    const country = item.seeding_cntry || item.country || 'KR';
    if (GEO_TARGET_COUNTRIES.includes(String(country).toUpperCase())) marketChecks++;
  }

  marketScore = Math.round((marketChecks / marketTotal) * 40);

  const total = funnelScore + hookScore + marketScore;
  return { total, funnel: funnelScore, hook: hookScore, market: marketScore };
}

function getBfGrade(total, rules) {
  const aThreshold = rules?.bfGradeA ?? 80;
  const bThreshold = rules?.bfGradeB ?? 50;
  if (total >= aThreshold) return { grade: 'A', color: '#10b981', bg: '#d1fae5' };
  if (total >= bThreshold) return { grade: 'B', color: '#f59e0b', bg: '#fef3c7' };
  return { grade: 'C', color: '#ef4444', bg: '#fee2e2' };
}

/* ── 성과 룰 로드 헬퍼 ── */
function loadPerformanceRules() {
  try {
    const saved = localStorage.getItem('fnco-performance-rules');
    if (saved) return JSON.parse(saved);
  } catch { /* 무시 */ }
  return { bfThreshold: 2, engagementThreshold: 2, viewCountThreshold: 100000, geoReadyRequired: false };
}

function normalizeContent(item, index, allItems, perfRules) {
  const views = Number(item.view_count ?? item.views ?? 0) || 0;
  const likes = Number(item.like_count ?? item.likes ?? 0) || 0;
  const comments = Number(item.comment_count ?? item.comments ?? 0) || 0;
  const shares = Number(item.share_count ?? item.shares ?? 0) || 0;
  const interactions = likes + comments + shares;
  const engagement = views > 0 ? (interactions / views) * 100 : 0;
  const country = item.seeding_cntry || item.country || 'KR';

  // 신규 GEO & BF
  const geoScore = calcGeoScore(item, views, engagement, allItems, perfRules);
  const geoGrade = getGeoGrade(geoScore, perfRules);
  const geoReady = geoGrade.grade === 'Ready';
  const bfResult = calcBfScore(item, views, engagement, perfRules);
  const bfGrade = getBfGrade(bfResult.total, perfRules);

  // 하위 호환: 기존 bf 배열도 유지
  const bf = [bfResult.funnel > 0, bfResult.hook > 0, bfResult.market > 0];

  return {
    id: item.post_id || item.id || `content-${index + 1}`,
    title: item.title || item.description || item.content_summary || '제목 없음',
    platform: item.platform || 'instagram',
    creator: item.author_nm || item.author_nickname || item.user_nm || 'Unknown',
    views, likes, comments, shares, engagement, country,
    geoReady, geoScore, geoGrade,
    bf, bfResult, bfGrade,
    createdAt: item.upload_dt || item.created_dt || '',
    postUrl: item.post_url || '',
    thumbnail: resolveThumbnail(item),
    campaign: item.campaign_name || '-',
    seedingCost: Number(item.seeding_cost ?? item.cost ?? 0) || 0,
    collectEndDate: item.collect_end_dt || item.collection_end_date || '',
  };
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ko-KR');
}

/* ── Inline Select ── */
function FilterSelect({ value, onChange, children, width = 130 }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm font-medium"
      style={{
        width,
        height: 36,
        borderRadius: 8,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        padding: '0 10px',
        color: tokens.color.text,
        outline: 'none',
      }}
    >
      {children}
    </select>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, color }) {
  return (
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 'var(--fnco-radius-md)',
        padding: '16px 20px',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || tokens.color.text, lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  );
}

/* ── BF Score Badge (원본 디자인: ①②③ 칩) ── */
function BfScoreBadge({ bfResult, bfGrade }) {
  const score = [bfResult.funnel > 0, bfResult.hook > 0, bfResult.market > 0];
  const labels = ['①', '②', '③'];
  const titles = ['퍼널 정합', 'Hook 적합', '시장 반응'];
  return (
    <div className="flex gap-1">
      {labels.map((label, index) => (
        <span
          key={label}
          className="inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold"
          title={`${titles[index]}: ${score[index] ? '충족' : '미충족'}`}
          style={{
            borderRadius: 5,
            background: score[index] ? tokens.color.successSoft : '#edf1f7',
            color: score[index] ? tokens.color.success : '#a0aec0',
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/* ── Content Card ── */
function ContentCard({ item }) {
  const platform = getPlatformMeta(item.platform);

  return (
    <article
      className="overflow-hidden"
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 'var(--fnco-radius-md)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--fnco-shadow-card)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ height: 180, background: tokens.color.surfaceMuted }}>
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const postId = item.id || '';
              if (postId && !e.target.dataset.retried) {
                e.target.dataset.retried = '1';
                e.target.src = `https://i.ytimg.com/vi/${postId}/hqdefault.jpg`;
              } else {
                e.target.style.display = 'none';
              }
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: tokens.color.textSubtle }}>No Thumbnail</div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          <span className="px-2 py-0.5 text-[11px] font-semibold" style={{ borderRadius: 5, background: platform.soft, color: platform.color }}>
            {platform.label}
          </span>
          {item.geoReady && (
            <span className="px-2 py-0.5 text-[11px] font-semibold" style={{ borderRadius: 5, background: tokens.color.geoSoft, color: tokens.color.geo }}>
              GEO
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p className="line-clamp-2" style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, lineHeight: 1.4, marginBottom: 4 }}>
          {item.title}
        </p>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginBottom: 12 }}>
          @{item.creator} · {item.country}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3" style={{ fontSize: 12, color: tokens.color.textSubtle, marginBottom: 10 }}>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatCompactNumber(item.views)}</span>
          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{formatCompactNumber(item.likes)}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatCompactNumber(item.comments)}</span>
          {item.shares > 0 && <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{formatCompactNumber(item.shares)}</span>}
        </div>

        {/* BF + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BfScoreBadge bfResult={item.bfResult} bfGrade={item.bfGrade} />
            <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>BF-{item.bfGrade.grade === 'A' ? '1' : item.bfGrade.grade === 'B' ? '2' : '3'}</span>
          </div>
          <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>{formatDate(item.createdAt)}</span>
        </div>

        {item.postUrl && (
          <button
            onClick={() => window.open(item.postUrl, '_blank', 'noopener,noreferrer')}
            className="w-full text-center"
            style={{
              marginTop: 12,
              fontSize: 13,
              fontWeight: 600,
              color: tokens.color.primary,
              background: 'transparent',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 8,
              padding: '7px 0',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = tokens.color.surfaceMuted; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            콘텐츠 보기
          </button>
        )}
      </div>
    </article>
  );
}

/* ── Action Item ── */
function ActionItem({ icon: Icon, color, text }) {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        padding: '12px 14px',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 10,
        background: tokens.color.surfaceMuted,
      }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
      <p style={{ fontSize: 13, color: tokens.color.text, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

/* ── Main ── */
export default function ContentEngine() {
  const [activeTab, setActiveTab] = useState('seeding');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [geoFilter, setGeoFilter] = useState('all');
  const [bfFilter, setBfFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [seedingFormOpen, setSeedingFormOpen] = useState(false);
  const [ugcFormOpen, setUgcFormOpen] = useState(false);
  const [actionItemsPopupOpen, setActionItemsPopupOpen] = useState(false);
  const [insightPlatformFilter, setInsightPlatformFilter] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);

  const { data, isLoading } = useContentLibrary(activeTab);
  const { data: insightsData, isLoading: insightsLoading } = useUGCCategoryInsights(insightPlatformFilter);

  // 성과 룰 로드 (localStorage 변경 감지)
  const [perfRules, setPerfRules] = useState(loadPerformanceRules);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'fnco-performance-rules') setPerfRules(loadPerformanceRules());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const contents = useMemo(() => {
    const rawItems = normalizeResponse(data);
    const items = rawItems.length > 0 ? rawItems : (FALLBACK_CONTENT[activeTab] || []);
    // 2-pass: 먼저 raw items를 전달하여 글로벌 시딩 이력 계산에 활용
    return items.map((item, idx) => normalizeContent(item, idx, items, perfRules));
  }, [data, activeTab, perfRules]);

  const countries = useMemo(
    () => ['all', ...new Set(contents.map((item) => item.country).filter(Boolean))],
    [contents]
  );

  const campaigns = useMemo(
    () => ['all', ...new Set(contents.map((item) => item.campaign).filter((c) => c && c !== '-'))],
    [contents]
  );

  const filtered = useMemo(() => {
    const result = contents.filter((item) => {
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
      if (countryFilter !== 'all' && item.country !== countryFilter) return false;
      if (campaignFilter !== 'all' && item.campaign !== campaignFilter) return false;
      // GEO 필터 (등급 기반)
      if (geoFilter === 'ready' && item.geoGrade.grade !== 'Ready') return false;
      if (geoFilter === 'potential' && item.geoGrade.grade !== 'Potential') return false;
      if (geoFilter === 'local' && item.geoGrade.grade !== 'Local') return false;
      // BF 필터 (등급 기반)
      if (bfFilter === 'bf1' && item.bfGrade.grade !== 'A') return false;
      if (bfFilter === 'bf2' && item.bfGrade.grade !== 'B') return false;
      if (bfFilter === 'bf3' && item.bfGrade.grade !== 'C') return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (!item.title.toLowerCase().includes(q) && !item.creator.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'comments') return b.comments - a.comments;
      if (sortBy === 'shares') return b.shares - a.shares;
      if (sortBy === 'seedingCost') return (b.seedingCost || 0) - (a.seedingCost || 0);
      if (sortBy === 'uploadDate') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'collectEndDate') return new Date(b.collectEndDate || 0).getTime() - new Date(a.collectEndDate || 0).getTime();
      // default: 기본 순서 (원본 인덱스 유지)
      return 0;
    });
    return result;
  }, [contents, platformFilter, countryFilter, campaignFilter, geoFilter, bfFilter, search, sortBy]);

  const geoReadyCount = filtered.filter((item) => item.geoGrade.grade === 'Ready').length;
  const geoPotentialCount = filtered.filter((item) => item.geoGrade.grade === 'Potential').length;
  const bfACount = filtered.filter((item) => item.bfGrade.grade === 'A').length;
  const avgEngagement = filtered.reduce((sum, item) => sum + item.engagement, 0) / Math.max(filtered.length, 1);

  const isContentTab = activeTab !== 'rules';

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, letterSpacing: '-0.01em', marginBottom: 4 }}>
            콘텐츠 엔진
          </h1>
          <p style={{ fontSize: 13, color: tokens.color.textSubtle }}>
            콘텐츠 라이브러리 + 콘텐츠 엔진 통합 화면 (BF Score / GEO 필터 적용)
          </p>
        </div>
        {activeTab === 'seeding' && (
          <Button
            onClick={() => setSeedingFormOpen(true)}
            className="gap-2 h-10 px-5"
            style={{ borderRadius: 'var(--fnco-radius-sm)', background: tokens.color.text, color: '#fff', fontSize: 14, fontWeight: 600 }}
          >
            <Plus className="h-4 w-4" />콘텐츠 등록
          </Button>
        )}
        {activeTab === 'ugc' && (
          <Button
            onClick={() => setUgcFormOpen(true)}
            className="gap-2 h-10 px-5"
            style={{ borderRadius: 'var(--fnco-radius-sm)', background: tokens.color.text, color: '#fff', fontSize: 14, fontWeight: 600 }}
          >
            <Plus className="h-4 w-4" />UGC 등록
          </Button>
        )}
        {activeTab === 'preview' && (
          <Button
            onClick={() => setSeedingFormOpen(true)}
            className="gap-2 h-10 px-5"
            style={{ borderRadius: 'var(--fnco-radius-sm)', background: tokens.color.text, color: '#fff', fontSize: 14, fontWeight: 600 }}
          >
            <Plus className="h-4 w-4" />콘텐츠 등록
          </Button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1" style={{ marginBottom: 24, borderBottom: `1px solid ${tokens.color.border}`, paddingBottom: 0 }}>
        {CONTENT_TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="relative"
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? tokens.color.text : tokens.color.textSubtle,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: active ? `2px solid ${tokens.color.text}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 성과 룰 탭 ── */}
      {activeTab === 'rules' && <PerformanceRuleSettings />}

      {/* ── 콘텐츠 목록 탭 ── */}
      {isContentTab && (
        <>
          {/* KPI Cards (프리뷰 탭에서는 Total Contents만 표시) */}
          {activeTab === 'preview' ? (
            <div className="fnco-grid-kpi-4" style={{ marginBottom: 20 }}>
              <KpiCard label="Total Contents" value={filtered.length} />
            </div>
          ) : (
            <div className="fnco-grid-kpi-4" style={{ marginBottom: 20 }}>
              <KpiCard label="Total Contents" value={filtered.length} />
              <KpiCard label="GEO Ready / Potential" value={`${geoReadyCount} / ${geoPotentialCount}`} color="var(--fnco-geo)" />
              <KpiCard label="BF-1 (기획 부합)" value={bfACount} color="var(--fnco-success)" />
              <KpiCard label="Avg Engagement" value={`${avgEngagement.toFixed(2)}%`} color="var(--fnco-primary)" />
            </div>
          )}

          {/* Filter Bar */}
          <div
            className="flex flex-wrap items-center gap-2"
            style={{
              padding: '12px 16px',
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 'var(--fnco-radius-md)',
              marginBottom: 20,
            }}
          >
            <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 320 }}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: tokens.color.textSubtle }} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제목/크리에이터 검색..."
                className="pl-9"
                style={{ height: 36, borderRadius: 8, border: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceMuted, fontSize: 13 }}
              />
            </div>

            <FilterSelect value={platformFilter} onChange={setPlatformFilter}>
              <option value="all">전체 플랫폼</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </FilterSelect>

            <FilterSelect value={countryFilter} onChange={setCountryFilter}>
              {countries.map((c) => <option key={c} value={c}>{c === 'all' ? '전체 국가' : c}</option>)}
            </FilterSelect>

            <FilterSelect value={campaignFilter} onChange={setCampaignFilter} width={160}>
              {campaigns.map((c) => <option key={c} value={c}>{c === 'all' ? '전체 캠페인' : c}</option>)}
            </FilterSelect>

            <FilterSelect value={geoFilter} onChange={setGeoFilter} width={130}>
              <option value="all">GEO 전체</option>
              <option value="ready">GEO Ready</option>
              <option value="potential">GEO Potential</option>
              <option value="local">Local Only</option>
            </FilterSelect>

            <FilterSelect value={bfFilter} onChange={setBfFilter} width={120}>
              <option value="all">BF 전체</option>
              <option value="bf1">BF-1</option>
              <option value="bf2">BF-2</option>
              <option value="bf3">BF-3</option>
            </FilterSelect>

            <FilterSelect value={sortBy} onChange={setSortBy} width={150}>
              <option value="default">기본 순서</option>
              <option value="views">조회수</option>
              <option value="likes">좋아요수</option>
              <option value="comments">댓글수</option>
              <option value="shares">공유수</option>
              <option value="seedingCost">시딩 비용</option>
              <option value="uploadDate">업로드 날짜</option>
              <option value="collectEndDate">콘텐츠 수집 종료일</option>
            </FilterSelect>

            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.textSubtle, marginLeft: 'auto' }}>
              {filtered.length}건
            </span>
          </div>

          {/* Content Grid + Sidebar */}
          <div className="fnco-content-main-grid">
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-20" style={{ color: tokens.color.textSubtle }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: tokens.color.primary }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20" style={{ color: tokens.color.textSubtle, fontSize: 14 }}>
                  필터 조건에 맞는 콘텐츠가 없습니다.
                </div>
              ) : (
                <div className="fnco-content-card-grid">
                  {filtered.map((item) => <ContentCard key={item.id} item={item} />)}
                </div>
              )}
            </div>

            <aside>
              <div
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: 'var(--fnco-radius-md)',
                  padding: '20px',
                  position: 'sticky',
                  top: 20,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text }}>
                    Engine Action Items
                  </h2>
                  <button
                    onClick={() => setActionItemsPopupOpen(true)}
                    title="상세 설명 보기"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: tokens.color.primary,
                      background: 'transparent',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = tokens.color.surfaceMuted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Info className="h-3.5 w-3.5" />
                    상세 설명
                  </button>
                </div>
                <div className="space-y-2">
                  <ActionItem icon={Sparkles} color="var(--fnco-primary)" text="BF-A 콘텐츠를 성과 콘텐츠 탭으로 자동 승격" />
                  <ActionItem icon={Globe2} color="var(--fnco-geo)" text="GEO Potential 콘텐츠 현지화 보완 큐 생성" />
                  <ActionItem icon={ArrowUpRight} color="var(--fnco-warning)" text="BF-A + GEO Ready 콘텐츠를 글로벌 확장 후보로 표시" />
                </div>
              </div>

              {/* UGC 탭: 뷰티 카테고리별 인사이트 */}
              {activeTab === 'ugc' && (
                <div
                  style={{
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: 'var(--fnco-radius-md)',
                    padding: '20px',
                    marginTop: 16,
                  }}
                >
                  <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                    <TrendingUp className="h-4 w-4" style={{ color: tokens.color.primary }} />
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text }}>
                      카테고리별 인사이트
                    </h2>
                  </div>

                  {/* 플랫폼 필터 */}
                  <div style={{ marginBottom: 12 }}>
                    <select
                      value={insightPlatformFilter}
                      onChange={(e) => setInsightPlatformFilter(e.target.value)}
                      className="text-sm"
                      style={{
                        width: '100%',
                        height: 32,
                        borderRadius: 6,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.surfaceMuted,
                        padding: '0 8px',
                        color: tokens.color.text,
                        fontSize: 12,
                        outline: 'none',
                      }}
                    >
                      <option value="">전체 플랫폼</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>

                  {insightsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: tokens.color.primary }} />
                    </div>
                  ) : !insightsData?.data?.length ? (
                    <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '16px 0' }}>
                      인사이트 데이터가 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {insightsData.data.map((cat) => {
                        const isExpanded = expandedCategory === (cat.subcategory || cat.category);
                        const catKey = cat.subcategory || cat.category;
                        return (
                          <div
                            key={catKey}
                            style={{
                              border: `1px solid ${tokens.color.border}`,
                              borderRadius: 8,
                              overflow: 'hidden',
                            }}
                          >
                            {/* 카테고리 헤더 */}
                            <button
                              onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                              className="w-full flex items-center justify-between"
                              style={{
                                padding: '10px 12px',
                                background: isExpanded ? tokens.color.surfaceMuted : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = tokens.color.surfaceMuted; }}
                              onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#fff',
                                    background: tokens.color.primary,
                                    borderRadius: 4,
                                    padding: '2px 6px',
                                  }}
                                >
                                  {cat.category || 'Beauty'}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>
                                  {cat.subcategory || cat.category}
                                </span>
                                <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>
                                  ({cat.contents.length})
                                </span>
                              </div>
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4" style={{ color: tokens.color.textSubtle }} />
                                : <ChevronDown className="h-4 w-4" style={{ color: tokens.color.textSubtle }} />
                              }
                            </button>

                            {/* 확장된 인사이트 내용 */}
                            {isExpanded && (
                              <div style={{ padding: '0 12px 12px' }}>
                                {cat.contents.map((item, idx) => {
                                  const summary = typeof item.ai_post_summary === 'string'
                                    ? item.ai_post_summary
                                    : item.ai_post_summary?.summary || item.ai_post_summary?.insight || JSON.stringify(item.ai_post_summary);
                                  const channelSummary = typeof item.ai_channel_summary === 'string'
                                    ? item.ai_channel_summary
                                    : item.ai_channel_summary?.summary || item.ai_channel_summary?.insight || '';
                                  const platformMeta = getPlatformMeta(item.platform);

                                  return (
                                    <div
                                      key={item.id || idx}
                                      style={{
                                        padding: '10px 0',
                                        borderTop: idx > 0 ? `1px solid ${tokens.color.border}` : 'none',
                                      }}
                                    >
                                      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: platformMeta.color,
                                            background: platformMeta.soft,
                                            borderRadius: 4,
                                            padding: '1px 5px',
                                          }}
                                        >
                                          {platformMeta.label}
                                        </span>
                                        {item.rank_no && (
                                          <span style={{ fontSize: 10, fontWeight: 700, color: tokens.color.primary }}>
                                            TOP {item.rank_no}
                                          </span>
                                        )}
                                        {item.view_count > 0 && (
                                          <span className="flex items-center gap-0.5" style={{ fontSize: 10, color: tokens.color.textSubtle }}>
                                            <Eye className="h-3 w-3" />{formatCompactNumber(Number(item.view_count))}
                                          </span>
                                        )}
                                      </div>

                                      {item.title && (
                                        <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, marginBottom: 4, lineHeight: 1.4 }}>
                                          {item.title}
                                        </p>
                                      )}

                                      {summary && (
                                        <p style={{ fontSize: 11, color: tokens.color.textSubtle, lineHeight: 1.5, marginBottom: 4 }}>
                                          {typeof summary === 'string' && summary.length > 120 ? summary.slice(0, 120) + '...' : summary}
                                        </p>
                                      )}

                                      {channelSummary && (
                                        <p style={{ fontSize: 11, color: tokens.color.textSubtle, lineHeight: 1.5, marginBottom: 4, fontStyle: 'italic' }}>
                                          {typeof channelSummary === 'string' && channelSummary.length > 100 ? channelSummary.slice(0, 100) + '...' : channelSummary}
                                        </p>
                                      )}

                                      {item.post_url && (
                                        <button
                                          onClick={() => window.open(item.post_url, '_blank', 'noopener,noreferrer')}
                                          className="flex items-center gap-1"
                                          style={{
                                            fontSize: 11,
                                            color: tokens.color.primary,
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            marginTop: 2,
                                          }}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          원본 보기
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </>
      )}

      {/* 다이얼로그 */}
      <SeedingContentForm open={seedingFormOpen} onOpenChange={setSeedingFormOpen} />
      <UGCContentForm open={ugcFormOpen} onOpenChange={setUgcFormOpen} />

      {/* Engine Action Items 상세 설명 팝업 */}
      <Dialog open={actionItemsPopupOpen} onOpenChange={setActionItemsPopupOpen}>
        <DialogContent style={{ maxWidth: 560 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700 }}>
              Engine Action Items 상세 설명
            </DialogTitle>
            <DialogDescription>
              콘텐츠 엔진이 자동으로 수행하는 액션 항목들의 상세 동작 방식입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4" style={{ marginTop: 8 }}>
            <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <Sparkles className="h-5 w-5" style={{ color: 'var(--fnco-primary)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>BF-A 콘텐츠 자동 승격</h3>
              </div>
              <p style={{ fontSize: 13, color: tokens.color.textSubtle, lineHeight: 1.6 }}>
                BF Score가 A등급(기획 부합도 80점 이상)인 콘텐츠를 자동으로 성과 콘텐츠 탭으로 승격합니다.
                퍼널 정합성, Hook 적합성, 시장 반응 3가지 기준을 모두 충족하는 콘텐츠가 대상이며,
                승격 시 담당자에게 알림이 전송됩니다.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <Globe2 className="h-5 w-5" style={{ color: 'var(--fnco-geo)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>GEO Potential 현지화 큐</h3>
              </div>
              <p style={{ fontSize: 13, color: tokens.color.textSubtle, lineHeight: 1.6 }}>
                GEO 점수가 Potential 등급(50~79점)인 콘텐츠에 대해 현지화 보완 큐를 생성합니다.
                자막 추가, 현지어 더빙, 문화적 컨텍스트 조정 등의 작업이 필요한 콘텐츠를 자동으로 식별하여
                글로벌 확장 가능성을 높입니다.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <ArrowUpRight className="h-5 w-5" style={{ color: 'var(--fnco-warning)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>글로벌 확장 후보 표시</h3>
              </div>
              <p style={{ fontSize: 13, color: tokens.color.textSubtle, lineHeight: 1.6 }}>
                BF-A 등급과 GEO Ready 등급을 동시에 만족하는 콘텐츠를 글로벌 확장 최우선 후보로 표시합니다.
                이 콘텐츠는 기획 의도에 부합하면서 글로벌 확장 준비도까지 갖춘 최적의 콘텐츠로,
                해외 시장 시딩에 즉시 활용할 수 있습니다.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
