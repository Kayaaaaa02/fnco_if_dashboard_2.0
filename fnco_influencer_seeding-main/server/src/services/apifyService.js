/**
 * Apify API를 활용한 인플루언서 최근 30일 콘텐츠 크롤링 서비스
 *
 * 플랫폼별 Actor:
 *   - Instagram: apify/instagram-post-scraper
 *   - YouTube:   streamers/youtube-scraper
 *   - TikTok:    clockworks/free-tiktok-scraper
 *
 * 사용법:
 *   import { crawlRecentPosts } from '../services/apifyService.js';
 *   const posts = await crawlRecentPosts('instagram', 'https://instagram.com/username');
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const APIFY_BASE = 'https://api.apify.com/v2';

/** Instagram URL에서 username 추출 */
function extractInstagramUsername(profileUrl) {
  if (!profileUrl) return null;
  // https://www.instagram.com/jxxohee/ → jxxohee
  const match = profileUrl.match(/instagram\.com\/([^/?#]+)/i);
  if (match && match[1] && !['p', 'reel', 'stories', 'explore'].includes(match[1])) {
    return match[1].replace(/\/$/, '');
  }
  return null;
}

// 플랫폼별 Apify Actor 설정
const ACTOR_CONFIG = {
  instagram: {
    actorId: 'apify~instagram-post-scraper',
    buildInput: (profileUrl) => {
      const username = extractInstagramUsername(profileUrl);
      return {
        username: username ? [username] : [],
        resultsLimit: 30,
        resultsType: 'posts',
        searchType: 'user',
        addParentData: true,
      };
    },
    mapResult: (item) => ({
      postId: item.id || item.shortCode,
      url: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
      type: item.type || (item.videoUrl ? 'video' : 'image'),
      caption: item.caption || '',
      hashtags: item.hashtags || extractHashtags(item.caption || ''),
      likes: item.likesCount ?? item.likes ?? 0,
      comments: item.commentsCount ?? item.comments ?? 0,
      views: item.videoViewCount ?? item.videoPlayCount ?? item.views ?? 0,
      shares: item.sharesCount ?? 0,
      postedAt: (() => {
        const ts = item.timestamp || item.takenAtTimestamp;
        if (ts && !isNaN(Number(ts))) {
          const d = new Date(Number(ts) * 1000);
          return isNaN(d.getTime()) ? item.date || null : d.toISOString();
        }
        if (item.date) {
          const d = new Date(item.date);
          return isNaN(d.getTime()) ? null : d.toISOString();
        }
        return null;
      })(),
      thumbnailUrl: item.displayUrl || item.thumbnailUrl || null,
      isAd: detectAd(item.caption || ''),
    }),
  },
  youtube: {
    actorId: 'streamers~youtube-scraper',
    buildInput: (profileUrl) => ({
      startUrls: [{ url: profileUrl }],
      maxResults: 30,
      maxResultsShorts: 30,
      type: 'videos',
    }),
    mapResult: (item) => ({
      postId: item.id || item.videoId,
      url: item.url || `https://www.youtube.com/watch?v=${item.id || item.videoId}`,
      type: 'video',
      caption: item.title || item.description || '',
      hashtags: extractHashtags((item.title || '') + ' ' + (item.description || '')),
      likes: item.likes ?? item.likesCount ?? 0,
      comments: item.commentsCount ?? item.comments ?? 0,
      views: item.viewCount ?? item.views ?? 0,
      shares: 0,
      postedAt: item.date || item.uploadDate || item.publishedAt || null,
      thumbnailUrl: item.thumbnailUrl || (item.thumbnails?.[0]?.url) || null,
      isAd: detectAd((item.title || '') + ' ' + (item.description || '')),
    }),
  },
  tiktok: {
    actorId: 'clockworks~free-tiktok-scraper',
    buildInput: (profileUrl) => ({
      profiles: [profileUrl],
      resultsPerPage: 30,
      shouldDownloadVideos: false,
    }),
    mapResult: (item) => ({
      postId: item.id || item.videoId,
      url: item.webVideoUrl || item.url || '',
      type: 'video',
      caption: item.text || item.desc || '',
      hashtags: item.hashtags?.map((h) => h.name || h) || extractHashtags(item.text || item.desc || ''),
      likes: item.diggCount ?? item.likes ?? 0,
      comments: item.commentCount ?? item.comments ?? 0,
      views: item.playCount ?? item.views ?? 0,
      shares: item.shareCount ?? item.shares ?? 0,
      postedAt: item.createTime
        ? new Date(item.createTime * 1000).toISOString()
        : item.date || null,
      thumbnailUrl: item.coverUrl || item.thumbnailUrl || null,
      isAd: detectAd(item.text || item.desc || ''),
    }),
  },
};

/** 캡션에서 해시태그 추출 */
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[\w가-힣]+/g);
  return matches ? [...new Set(matches)] : [];
}

/** 광고 게시물 감지 */
function detectAd(text) {
  if (!text) return false;
  const adKeywords = ['#광고', '#AD', '#ad', '#제품제공', '#협찬', '#sponsored', '#partnership'];
  const lowerText = text.toLowerCase();
  return adKeywords.some((kw) => lowerText.includes(kw.toLowerCase()));
}

/**
 * Apify Actor를 동기 실행하고 결과 데이터셋을 반환
 * (run-sync-get-dataset-items 엔드포인트 사용)
 */
async function runActorSync(actorId, input, timeoutSecs = 300) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN이 .env에 설정되지 않았습니다.');
  }

  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutSecs * 1000 + 30000), // Actor 타임아웃 + 30초 여유
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify Actor 실행 실패 (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * 최근 30일 이내 게시물만 필터링
 */
function filterLast30Days(posts) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return posts.filter((post) => {
    if (!post.postedAt) return true; // 날짜 없으면 포함
    const postDate = new Date(post.postedAt);
    return postDate >= thirtyDaysAgo;
  });
}

/**
 * 크롤링된 게시물에서 요약 통계 생성
 */
function computePostStats(posts) {
  if (!posts.length) {
    return {
      totalPosts: 0,
      videoPosts: 0,
      avgViews: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      adCount: 0,
      topHashtags: [],
      sampleCaptions: '',
    };
  }

  const videoPosts = posts.filter((p) => p.type === 'video');
  const adCount = posts.filter((p) => p.isAd).length;

  const sumField = (arr, field) => arr.reduce((sum, p) => sum + (p[field] || 0), 0);
  const avgField = (arr, field) => arr.length ? Math.round(sumField(arr, field) / arr.length) : 0;

  // 해시태그 빈도 집계
  const hashtagCount = {};
  posts.forEach((p) => {
    (p.hashtags || []).forEach((tag) => {
      const normalized = tag.startsWith('#') ? tag : `#${tag}`;
      hashtagCount[normalized] = (hashtagCount[normalized] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // 샘플 캡션 (상위 3개)
  const sampleCaptions = posts
    .filter((p) => p.caption)
    .slice(0, 3)
    .map((p) => p.caption.slice(0, 200))
    .join('\n---\n');

  // 최고 성과 콘텐츠 (조회수 기준)
  const bestPost = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || null;

  return {
    totalPosts: posts.length,
    videoPosts: videoPosts.length,
    avgViews: avgField(videoPosts.length ? videoPosts : posts, 'views'),
    avgLikes: avgField(posts, 'likes'),
    avgComments: avgField(posts, 'comments'),
    avgShares: avgField(posts, 'shares'),
    adCount,
    topHashtags,
    sampleCaptions,
    bestPost,
  };
}

/**
 * 인플루언서의 최근 30일 콘텐츠를 Apify로 크롤링
 *
 * @param {string} platform - 'instagram' | 'youtube' | 'tiktok'
 * @param {string} profileUrl - 인플루언서 프로필 URL
 * @returns {{ posts: Array, stats: Object }} 크롤링된 게시물 + 요약 통계
 */
export async function crawlRecentPosts(platform, profileUrl) {
  const normalizedPlatform = platform.toLowerCase().trim();
  const config = ACTOR_CONFIG[normalizedPlatform];

  if (!config) {
    throw new Error(`지원하지 않는 플랫폼: ${platform}. (instagram, youtube, tiktok만 지원)`);
  }

  console.log(`[Apify] ${normalizedPlatform} 크롤링 시작: ${profileUrl}`);

  const input = config.buildInput(profileUrl);
  const rawItems = await runActorSync(config.actorId, input);

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    console.warn(`[Apify] ${profileUrl}: 크롤링 결과 없음`);
    return { posts: [], stats: computePostStats([]) };
  }

  // 플랫폼별 매핑 + 30일 필터
  const mappedPosts = rawItems.map(config.mapResult);
  const recentPosts = filterLast30Days(mappedPosts);

  console.log(`[Apify] ${profileUrl}: 전체 ${rawItems.length}개 → 최근 30일 ${recentPosts.length}개`);

  const stats = computePostStats(recentPosts);

  return { posts: recentPosts, stats };
}

/**
 * Apify API 사용 가능 여부 확인
 */
export function isApifyAvailable() {
  return !!process.env.APIFY_API_TOKEN;
}
