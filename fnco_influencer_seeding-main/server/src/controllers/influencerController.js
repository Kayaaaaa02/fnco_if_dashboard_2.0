import { pool } from '../config/database.js';
import { getModel, isGeminiAvailable } from '../config/gemini.js';
import { buildInfluencerAnalysisPrompt } from '../config/influencerAnalysisPrompts.js';
import { crawlRecentPosts, isApifyAvailable } from '../services/apifyService.js';
import {
    get_influencer_list_query,
    get_influencer_list_selected_query,
    get_influencer_count_query,
    get_influencer_count_selected_query,
    get_influencer_list_by_urls_query,
    get_plan_reels_query,
} from '../sql/influencer/selectQuery.js';
import { update_influencer_is_selected_query } from '../sql/influencer/updateQuery.js';

/**
 * DB row → 클라이언트 인플루언서 객체 변환
 * (컬럼명은 PostgreSQL 기본 lowercase 기준)
 */
function mapRowToInfluencer(row) {
    const contentTypesRaw = row.content_types ?? row.CONTENT_TYPES ?? '';
    const contentTypes =
        typeof contentTypesRaw === 'string'
            ? contentTypesRaw
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : Array.isArray(contentTypesRaw)
            ? contentTypesRaw
            : [];

    const parseDeepAnalysis = (val) => {
        if (val == null) return null;
        if (typeof val === 'object') return val;
        if (typeof val !== 'string') return null;
        try {
            return JSON.parse(val);
        } catch {
            return null;
        }
    };

    const deepAnalysis = parseDeepAnalysis(row.deep_analysis ?? row.DEEP_ANALYSIS);
    const deepAnalysisEng = parseDeepAnalysis(row.deep_analysis_eng ?? row.DEEP_ANALYSIS_ENG);
    const deepAnalysisCn = parseDeepAnalysis(row.deep_analysis_cn ?? row.DEEP_ANALYSIS_CN);

    return {
        id: row.profile_id ?? row.PROFILE_ID,
        name: row.profile_nm ?? row.PROFILE_NM ?? '',
        profileImage: row.profile_img ?? row.PROFILE_IMG ?? null,
        profileUrl: row.profile_url ?? row.PROFILE_URL ?? null,
        isSaved: row.is_selected === true || row.IS_SELECTED === true,
        followers: row.follow_count ?? row.FOLLOW_COUNT ?? 0,
        posts: row.post_count ?? row.POST_COUNT ?? 0,
        category: row.influencer_type ?? row.INFLUENCER_TYPE ?? '',
        engagementRate: row.avg_engagement_quick ?? row.AVG_ENGAGEMENT_QUICK ?? 0,
        recentPostsCount: row.recent_posts_count_quick ?? row.RECENT_POSTS_COUNT_QUICK ?? 0,
        avgViews: row.avg_views_quick ?? row.AVG_VIEWS_QUICK ?? 0,
        updatedAt: row.updated_at ?? row.UPDATED_AT ?? null,
        contentTypes,
        keywords: [],
        platform: (row.platform ?? row.PLATFORM ?? 'instagram').toString().toLowerCase(),
        quickSummary: row.quick_summary ?? row.QUICK_SUMMARY ?? '',
        quickSummaryEng: row.quick_summary_eng ?? row.QUICK_SUMMARY_ENG ?? '',
        deepAnalysis,
        deepAnalysisEng,
        deepAnalysisCn,
        // 콘텐츠 분석용 데이터
        topContent: {
            id: row.top_content_id ?? row.TOP_CONTENT_ID ?? null,
            url: row.top_content_url ?? row.TOP_CONTENT_URL ?? null,
            caption: row.top_content_caption ?? row.TOP_CONTENT_CAPTION ?? null,
            type: row.top_content_type ?? row.TOP_CONTENT_TYPE ?? null,
            productType: row.top_content_product_type ?? row.TOP_CONTENT_PRODUCT_TYPE ?? null,
            likes: row.top_content_likes ?? row.TOP_CONTENT_LIKES ?? 0,
            comments: row.top_content_comments ?? row.TOP_CONTENT_COMMENTS ?? 0,
            views: row.top_content_views ?? row.TOP_CONTENT_VIEWS ?? 0,
            shares: row.top_content_shares ?? row.TOP_CONTENT_SHARES ?? 0,
            postedAt: row.top_content_posted_at ?? row.TOP_CONTENT_POSTED_AT ?? null,
            thumbnailUrl: row.top_content_thumbnail_s3_url ?? row.TOP_CONTENT_THUMBNAIL_S3_URL ?? null,
        },
        contentStats: {
            recentPostsCount: row.recent_posts_count_deep ?? row.RECENT_POSTS_COUNT_DEEP ?? 0,
            videoPostsCount: row.video_posts_count_deep ?? row.VIDEO_POSTS_COUNT_DEEP ?? 0,
            avgViews: row.avg_views_deep ?? row.AVG_VIEWS_DEEP ?? 0,
            avgLikes: row.avg_likes_deep ?? row.AVG_LIKES_DEEP ?? 0,
            avgComments: row.avg_comments_deep ?? row.AVG_COMMENTS_DEEP ?? 0,
            avgShares: row.avg_shares_deep ?? row.AVG_SHARES_DEEP ?? 0,
            adPostsCount: row.ad_posts_count_deep ?? row.AD_POSTS_COUNT_DEEP ?? 0,
            adRatio: row.ad_ratio_deep ?? row.AD_RATIO_DEEP ?? 0,
        },
        analysisType: row.analysis_type ?? null,
        deepAnalyzedAt: row.deep_analyzed_at ?? null,
        crawledPostsCount: row.crawled_posts_count ?? 0,
    };
}

/**
 * 인플루언서 수 조회 (is_selected = true)
 * GET /api/influencer/count
 */
export const getInfluencerCountSelected = async (req, res) => {
    try {
        const selectedOnly = String(req.query?.selected_only || '').toLowerCase() === 'true';
        const sqlSet = selectedOnly ? get_influencer_count_selected_query() : get_influencer_count_query();
        const result = await pool.query(sqlSet.selectQuery);
        const count = parseInt(result.rows?.[0]?.count ?? result.rows?.[0]?.COUNT ?? 0, 10) || 0;
        return res.json({ success: true, count });
    } catch (err) {
        console.error('[인플루언서 수 조회 에러]', err);
        return res.status(500).json({
            error: '인플루언서 수 조회 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 바닐라코(BANILA CO) 협업 인플루언서 수 조회
 * GET /api/influencer/partnered-count
 *
 * dw_campaign_influencer와 mst_campaign을 조인하여
 * brand_cd = 'BANILA CO'인 캠페인에 매칭된 인플루언서 수를 반환
 */
export const getPartneredCount = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(DISTINCT ci.profile_id) AS count
            FROM fnco_influencer.dw_campaign_influencer ci
            INNER JOIN fnco_influencer.mst_campaign c
                ON ci.campaign_id = c.campaign_id
            WHERE c.brand_cd = 'BANILA CO'
              AND ci.status IN ('selected', 'confirmed', 'contacted', 'matched')
        `);
        const count = parseInt(result.rows?.[0]?.count ?? 0, 10) || 0;
        return res.json({ success: true, count });
    } catch (err) {
        console.error('[Partnered 수 조회 에러]', err);
        return res.status(500).json({
            error: 'Partnered 수 조회 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 인플루언서 리스트 조회 (is_selected = true)
 * GET /api/influencer/list
 */
export const getInfluencerListSelected = async (req, res) => {
    try {
        const selectedOnly = String(req.query?.selected_only || '').toLowerCase() === 'true';
        const sqlSet = selectedOnly ? get_influencer_list_selected_query() : get_influencer_list_query();
        const result = await pool.query(sqlSet.selectQuery);
        const list = (result.rows || []).map(mapRowToInfluencer);
        return res.json({ success: true, list });
    } catch (err) {
        console.error('[인플루언서 리스트 조회 에러]', err);
        return res.status(500).json({
            error: '인플루언서 리스트 조회 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 인플루언서 리스트 조회 (PROFILE_URL 목록으로) - 엑셀 업로드 후 수집된 항목
 * POST /api/influencer/list-by-urls
 * body: { profile_url: string | string[] }
 */
export const getInfluencerListByUrls = async (req, res) => {
    try {
        const profileUrl = req.body?.profile_url;
        const profileUrls = Array.isArray(profileUrl) ? profileUrl : profileUrl ? [profileUrl] : [];

        if (profileUrls.length === 0) {
            return res.json({ success: true, list: [] });
        }

        const sqlSet = get_influencer_list_by_urls_query(profileUrls);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        const list = (result.rows || []).map(mapRowToInfluencer);
        return res.json({ success: true, list });
    } catch (err) {
        console.error('[인플루언서 리스트 by URLs 에러]', err);
        return res.status(500).json({
            error: '인플루언서 리스트 조회 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 선택한 인플루언서를 mst_influencer에서 is_selected = true, updated_at = NOW(), updated_by = 현재 사용자로 저장
 * POST /api/influencer/mark-selected
 * body: { profile_ids: (string|number)[], updated_by: string|number }
 */
export const markInfluencersSelected = async (req, res) => {
    try {
        const { profile_ids, updated_by } = req.body;
        const profileIds = Array.isArray(profile_ids) ? profile_ids : profile_ids != null ? [profile_ids] : [];
        const updatedBy = updated_by ?? null;

        if (profileIds.length === 0) {
            return res.status(400).json({ error: 'profile_ids is required and must be a non-empty array' });
        }

        const sqlSet = update_influencer_is_selected_query({
            profile_ids: profileIds,
            updated_by: updatedBy,
            is_selected: true,
        });
        if (!sqlSet.updateQuery) {
            return res.status(400).json({ error: 'Invalid profile_ids' });
        }

        await pool.query(sqlSet.updateQuery, sqlSet.params);
        return res.json({ success: true, message: '선택한 인플루언서가 저장되었습니다.', count: profileIds.length });
    } catch (err) {
        console.error('[인플루언서 저장 에러]', err);
        return res.status(500).json({
            error: '선택한 인플루언서 저장 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 선택한 인플루언서를 mst_influencer에서 is_selected = false 처리
 * POST /api/influencer/unmark-selected
 * body: { profile_ids: (string|number)[], updated_by: string|number }
 */
export const unmarkInfluencersSelected = async (req, res) => {
    try {
        const { profile_ids, updated_by } = req.body || {};
        const rawIds = Array.isArray(profile_ids) ? profile_ids : profile_ids != null ? [profile_ids] : [];
        const profileIds = rawIds.map((id) => (id != null ? String(id) : '')).filter(Boolean);
        const updatedBy = updated_by ?? null;

        if (profileIds.length === 0) {
            return res.status(400).json({ error: 'profile_ids is required and must be a non-empty array' });
        }

        const sqlSet = update_influencer_is_selected_query({
            profile_ids: profileIds,
            updated_by: updatedBy,
            is_selected: false,
        });
        if (!sqlSet.updateQuery) {
            return res.status(400).json({ error: 'Invalid profile_ids' });
        }

        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);
        const rowCount = result?.rowCount ?? 0;

        return res.json({
            success: true,
            message: '선택한 인플루언서가 저장 해제되었습니다.',
            count: profileIds.length,
            updatedRows: rowCount,
        });
    } catch (err) {
        console.error('[인플루언서 저장 해제 에러]', err);
        return res.status(500).json({
            error: '선택한 인플루언서 저장 해제 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * Gemini 응답에서 JSON을 안전하게 파싱
 */
function parseGeminiJSON(text) {
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const firstBracket = Math.min(
        cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
        cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
    );
    if (firstBracket !== Infinity) cleaned = cleaned.slice(firstBracket);
    const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    if (lastBracket !== -1) cleaned = cleaned.slice(0, lastBracket + 1);
    return JSON.parse(cleaned);
}

/**
 * 해당 계정(들)에 대한 AI 심층 분석 (Gemini 직접 호출)
 * POST /api/influencer/deep-analysis
 * body: { plan_doc_id?: string, influencers: [{ profile_id, platform }, ...], language?: string }
 */
export const deepAnalysisInfluencer = async (req, res) => {
    try {
        const { influencers: influencersBody, language: langFromClient } = req.body;

        const influencers = Array.isArray(influencersBody)
            ? influencersBody.filter((i) => i != null && i.profile_id != null && i.profile_id !== '')
            : [];

        if (influencers.length === 0) {
            return res.status(400).json({ error: 'influencers array with profile_id is required' });
        }

        const language = langFromClient === 'cn' || langFromClient === 'eng' ? langFromClient : 'ko';

        // Gemini API 사용 가능 여부 확인
        if (!isGeminiAvailable()) {
            console.warn('[인플루언서 심층 분석] Gemini API 사용 불가 — FastAPI 폴백');
            return await fallbackToFastAPI(req, res);
        }

        const model = getModel();
        if (!model) {
            console.warn('[인플루언서 심층 분석] Gemini 모델 초기화 실패 — FastAPI 폴백');
            return await fallbackToFastAPI(req, res);
        }

        const profileIds = influencers.map((i) => String(i.profile_id));
        const placeholders = profileIds.map((_, i) => `$${i + 1}`).join(', ');

        // DB에서 인플루언서 데이터 조회
        const dbResult = await pool.query(
            `SELECT
                A.profile_id, A.profile_url, A.profile_nm, A.profile_img,
                A.follow_count, A.post_count, A.influencer_type, A.platform,
                B.avg_engagement_quick, B.content_types, B.quick_summary, B.quick_summary_eng,
                B.avg_views_quick, B.recent_posts_count_quick,
                B.recent_posts_count_deep, B.video_posts_count_deep,
                B.avg_views_deep, B.avg_likes_deep, B.avg_comments_deep, B.avg_shares_deep,
                B.ad_posts_count_deep, B.ad_ratio_deep,
                B.top_content_url, B.top_content_type, B.top_content_caption,
                B.top_content_views, B.top_content_likes, B.top_content_comments
            FROM fnco_influencer.mst_influencer A
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            WHERE A.profile_id IN (${placeholders})`,
            profileIds,
        );

        const results = [];

        for (const row of dbResult.rows) {
            try {
                console.log(`[인플루언서 심층 분석] 시작: ${row.profile_nm || row.profile_id}`);

                // ── Step 1: Apify로 최근 30일 콘텐츠 크롤링 → DB 적재 ──
                let crawledData = { posts: [], stats: {} };
                const platform = (row.platform || 'instagram').toLowerCase();
                const profileUrl = row.profile_url;
                const profileId = String(row.profile_id);

                if (isApifyAvailable() && profileUrl) {
                    try {
                        console.log(`[인플루언서 심층 분석] Apify 크롤링 시작: ${profileUrl}`);
                        crawledData = await crawlRecentPosts(platform, profileUrl);
                        console.log(`[인플루언서 심층 분석] Apify 크롤링 완료: ${crawledData.posts.length}개 게시물`);

                        // DB에 크롤링 데이터 적재 (upsert)
                        if (crawledData.posts.length > 0) {
                            for (const p of crawledData.posts) {
                                await pool.query(
                                    `INSERT INTO fnco_influencer.dw_influencer_ai_crawled_posts
                                     (profile_id, platform, post_id, post_url, post_type, posted_at,
                                      caption, hashtags, like_count, comment_count, view_count,
                                      share_count, thumbnail_url, is_ad, collected_at)
                                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
                                     ON CONFLICT (profile_id, post_id) DO UPDATE SET
                                       like_count = EXCLUDED.like_count,
                                       comment_count = EXCLUDED.comment_count,
                                       view_count = EXCLUDED.view_count,
                                       share_count = EXCLUDED.share_count,
                                       caption = EXCLUDED.caption,
                                       hashtags = EXCLUDED.hashtags,
                                       is_ad = EXCLUDED.is_ad,
                                       collected_at = NOW()`,
                                    [
                                        profileId, platform,
                                        p.postId || p.url || `${Date.now()}_${Math.random()}`,
                                        p.url || null, p.type || 'post', p.postedAt || null,
                                        p.caption || null,
                                        JSON.stringify(p.hashtags || []),
                                        p.likes || 0, p.comments || 0, p.views || 0,
                                        p.shares || 0, p.thumbnailUrl || null, p.isAd || false,
                                    ],
                                );
                            }
                            console.log(`[인플루언서 심층 분석] DB 적재 완료: ${crawledData.posts.length}개`);
                        }
                    } catch (crawlErr) {
                        console.warn(`[인플루언서 심층 분석] Apify 크롤링/적재 실패 (DB 데이터로 진행): ${crawlErr.message}`);
                    }
                } else if (!isApifyAvailable()) {
                    console.warn('[인플루언서 심층 분석] APIFY_API_TOKEN 미설정 — DB 데이터만 사용');
                }

                // ── Step 2: DB에서 크롤링 데이터 읽기 (이전/현재 크롤링 모두 포함) ──
                const storedPostsResult = await pool.query(
                    `SELECT * FROM fnco_influencer.dw_influencer_ai_crawled_posts
                     WHERE profile_id = $1
                       AND posted_at >= NOW() - INTERVAL '30 days'
                     ORDER BY posted_at DESC`,
                    [profileId],
                );
                const storedPosts = storedPostsResult.rows || [];

                // DB 저장된 게시물을 분석용 posts 배열로 변환
                const posts = storedPosts.map((sp) => ({
                    postId: sp.post_id,
                    url: sp.post_url,
                    type: sp.post_type,
                    caption: sp.caption || '',
                    hashtags: sp.hashtags || [],
                    likes: Number(sp.like_count) || 0,
                    comments: Number(sp.comment_count) || 0,
                    views: Number(sp.view_count) || 0,
                    shares: Number(sp.share_count) || 0,
                    postedAt: sp.posted_at,
                    thumbnailUrl: sp.thumbnail_url,
                    isAd: sp.is_ad || false,
                }));

                // 통계 재계산
                const computeStats = (arr) => {
                    if (!arr.length) return {};
                    const sum = (field) => arr.reduce((s, p) => s + (p[field] || 0), 0);
                    const avg = (field) => arr.length ? Math.round(sum(field) / arr.length) : 0;
                    const videoPosts = arr.filter((p) => p.type === 'video');
                    const adCount = arr.filter((p) => p.isAd).length;
                    const hashtagCount = {};
                    arr.forEach((p) => (p.hashtags || []).forEach((tag) => {
                        const n = typeof tag === 'string' ? (tag.startsWith('#') ? tag : `#${tag}`) : '';
                        if (n) hashtagCount[n] = (hashtagCount[n] || 0) + 1;
                    }));
                    const topHashtags = Object.entries(hashtagCount)
                        .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
                    const sampleCaptions = arr.filter((p) => p.caption).slice(0, 3)
                        .map((p) => p.caption.slice(0, 200)).join('\n---\n');
                    const bestPost = [...arr].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || null;
                    return {
                        totalPosts: arr.length, videoPosts: videoPosts.length,
                        avgViews: avg('views'), avgLikes: avg('likes'),
                        avgComments: avg('comments'), avgShares: avg('shares'),
                        adCount, topHashtags, sampleCaptions, bestPost,
                    };
                };
                const stats = computeStats(posts);

                // ── Step 3: 크롤링 데이터를 row에 보강 ──
                const enrichedRow = { ...row };

                if (posts.length > 0) {
                    enrichedRow.recent_posts_count_deep = stats.totalPosts;
                    enrichedRow.video_posts_count_deep = stats.videoPosts;
                    enrichedRow.avg_views_deep = stats.avgViews;
                    enrichedRow.avg_likes_deep = stats.avgLikes;
                    enrichedRow.avg_comments_deep = stats.avgComments;
                    enrichedRow.avg_shares_deep = stats.avgShares;
                    enrichedRow.ad_posts_count_deep = stats.adCount;
                    enrichedRow.ad_ratio_deep = stats.totalPosts > 0
                        ? Math.round((stats.adCount / stats.totalPosts) * 100)
                        : 0;

                    enrichedRow.content_types = stats.topHashtags.join(', ');
                    enrichedRow.top_content_caption = stats.sampleCaptions;

                    if (stats.bestPost) {
                        enrichedRow.top_content_url = stats.bestPost.url;
                        enrichedRow.top_content_type = stats.bestPost.type;
                        enrichedRow.top_content_views = stats.bestPost.views;
                        enrichedRow.top_content_likes = stats.bestPost.likes;
                        enrichedRow.top_content_comments = stats.bestPost.comments;
                        enrichedRow.top_content_caption = stats.bestPost.caption?.slice(0, 500) || enrichedRow.top_content_caption;
                    }
                }

                // ── Step 4: 프롬프트 생성 + Gemini 호출 ──
                let prompt = buildInfluencerAnalysisPrompt(enrichedRow);

                // DB에 저장된 개별 게시물 상세 데이터 추가
                if (posts.length > 0) {
                    const postsDetail = posts.slice(0, 20).map((p, i) => {
                        const parts = [`[${i + 1}] ${p.type || 'post'}`];
                        if (p.url) parts.push(`URL: ${p.url}`);
                        if (p.views) parts.push(`조회수: ${p.views.toLocaleString()}`);
                        if (p.likes) parts.push(`좋아요: ${p.likes.toLocaleString()}`);
                        if (p.comments) parts.push(`댓글: ${p.comments.toLocaleString()}`);
                        if (p.shares) parts.push(`공유: ${p.shares.toLocaleString()}`);
                        if (p.postedAt) parts.push(`업로드: ${new Date(p.postedAt).toISOString()}`);
                        if (p.isAd) parts.push(`[광고]`);
                        if (p.caption) parts.push(`캡션: ${p.caption.slice(0, 150)}`);
                        if (p.hashtags?.length) {
                            const tags = p.hashtags.map((h) => typeof h === 'string' ? h : '').filter(Boolean);
                            if (tags.length) parts.push(`해시태그: ${tags.slice(0, 5).join(' ')}`);
                        }
                        return parts.join(' | ');
                    }).join('\n');

                    prompt += `\n\n=== 최근 30일 개별 게시물 데이터 (${posts.length}개, DB 저장분) ===\n${postsDetail}`;
                }

                // 언어별 추가 지시
                const langInstruction = language === 'eng'
                    ? '\n\nIMPORTANT: Write ALL text values in English.'
                    : language === 'cn'
                    ? '\n\nIMPORTANT: Write ALL text values in Chinese (简体中文).'
                    : '';

                console.log(`[인플루언서 심층 분석] Gemini 호출: ${row.profile_nm || row.profile_id}`);

                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt + langInstruction }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.9,
                        maxOutputTokens: 8192,
                    },
                });

                const responseText = result.response.text();
                const analysisData = parseGeminiJSON(responseText);

                // ── Step 5: DB에 결과 저장 ──
                const columnKey = language === 'eng' ? 'deep_analysis_eng'
                    : language === 'cn' ? 'deep_analysis_cn'
                    : 'deep_analysis';

                await pool.query(
                    `UPDATE fnco_influencer.dw_influencer_ai_analysis
                     SET ${columnKey} = $1, analyzed_at = NOW()
                     WHERE profile_id = $2`,
                    [JSON.stringify(analysisData), row.profile_id],
                );

                // 트래킹 테이블에 DEEP_ANALYSIS 기록
                await pool.query(
                    `INSERT INTO fnco_influencer.dw_influencer_analysis_tracking
                     (profile_id, analysis_type, analyzed_at, crawled_posts_count)
                     VALUES ($1, 'DEEP_ANALYSIS', NOW(), $2)
                     ON CONFLICT (profile_id, analysis_type) DO UPDATE SET
                       analyzed_at = NOW(),
                       crawled_posts_count = EXCLUDED.crawled_posts_count`,
                    [row.profile_id, posts.length],
                );

                results.push({
                    profile_id: row.profile_id,
                    success: true,
                    analysis: analysisData,
                    crawledPostsCount: posts.length,
                });

                console.log(`[인플루언서 심층 분석] 완료: ${row.profile_nm || row.profile_id} (크롤링 ${posts.length}개)`);
            } catch (geminiErr) {
                console.error(`[인플루언서 심층 분석] 오류 (${row.profile_id}):`, geminiErr.message);
                results.push({
                    profile_id: row.profile_id,
                    success: false,
                    error: geminiErr.message,
                });
            }
        }

        return res.json({
            success: true,
            total: results.length,
            results,
        });
    } catch (err) {
        console.error('[인플루언서 심층 분석 에러]', err);
        return res.status(500).json({
            error: '심층 분석 요청 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * FastAPI 폴백 (Gemini 사용 불가 시)
 */
async function fallbackToFastAPI(req, res) {
    try {
        const { plan_doc_id, influencers: influencersBody, language: langFromClient } = req.body;
        const influencers = Array.isArray(influencersBody)
            ? influencersBody.filter((i) => i != null && i.profile_id != null && i.profile_id !== '')
            : [];
        const language = langFromClient === 'cn' || langFromClient === 'eng' ? langFromClient : 'ko';
        const fastApiUrl = `${process.env.API_URL}/influencer/deep-analysis`;

        const response = await fetch(fastApiUrl, {
            method: 'POST',
            headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_doc_id: plan_doc_id ?? null, influencers, language }),
            signal: AbortSignal.timeout(900000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[인플루언서 심층 분석] FastAPI error: ${response.status}`, errorText);
            return res.status(response.status).json({ error: '심층 분석 요청 실패', details: errorText });
        }

        const data = await response.json();
        return res.json(data);
    } catch (err) {
        console.error('[인플루언서 심층 분석 FastAPI 폴백 에러]', err);
        return res.status(500).json({ error: '심층 분석 요청 중 오류가 발생했습니다.', details: err.message });
    }
}

/**
 * 인플루언서 프로필 분석 컨트롤러
 * POST /api/influencer/analyze
 *
 * 엔드포인트 예시:
 * POST http://localhost:5000/api/influencer/analyze
 *
 * 요청 본문:
 * {
 *   "profile_url": ["https://www.instagram.com/...", ...],
 *   "user_id": 123
 * }
 *
 * 응답 예시:
 * {
 *   "success": true,
 *   "total": 3,
 *   "results": [...],
 *   "errors": []
 * }
 */
export const analyzeInfluencerProfiles = async (req, res) => {
    try {
        const { profile_url, user_nm } = req.body;

        // 필수 파라미터 검증
        if (!profile_url) {
            return res.status(400).json({ error: 'profile_url is required' });
        }

        // profile_url이 배열인지 단일 값인지 확인
        const profileUrls = Array.isArray(profile_url) ? profile_url : [profile_url];

        // FastAPI 엔드포인트 (인플루언서 분석 전용)
        const fastApiUrl = `${process.env.API_URL}/influencer/analyze`;

        // 배치 처리: 여러 URL을 한 번에 FastAPI로 전달 (유저명 전달)
        const requestBody = {
            profile_url: profileUrls,
            user_nm: user_nm || null,
        };

        const response = await fetch(fastApiUrl, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(900000), // 15분 타임아웃
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[인플루언서 분석] FastAPI error: ${response.status}`, errorText);
            return res.status(response.status).json({
                error: '인플루언서 분석 요청 실패',
                details: errorText,
            });
        }

        const data = await response.json();
        return res.json(data);
    } catch (err) {
        console.error('[인플루언서 분석 에러]', err);
        return res.status(500).json({
            error: '인플루언서 분석 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 제품 기획안 조회 (AI 추천 기획안용)
 * GET /api/influencer/plan-reels/:planDocId
 */
export async function getPlanReels(req, res) {
    try {
        const { planDocId } = req.params;

        const result = await pool.query(get_plan_reels_query, [planDocId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const reelsPlans = result.rows[0].ai_top10_reels_plan || [];
        res.json({ reelsPlans });
    } catch (error) {
        console.error('[기획안 조회 오류]', error);
        res.status(500).json({ error: 'Failed to fetch reels plans', details: error.message });
    }
}
