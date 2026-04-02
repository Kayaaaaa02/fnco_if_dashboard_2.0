import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import {
    upsertConfirmedInfluencer,
    selectConfirmedInfluencers,
    countConfirmedInfluencers,
    updateIsSelected,
    bulkCancelConfirmed,
} from '../sql/influencerPool/query.js';

const router = express.Router();

const BASE_URL = 'https://internal-bo-ane2-alb-prd-pri-751976581.ap-northeast-2.elb.amazonaws.com';
const API_KEY = process.env.INFLUENCER_API_KEY;
if (!API_KEY) console.warn('[InfluencerPool] INFLUENCER_API_KEY 환경변수가 설정되지 않았습니다.');
const PAGE_SIZE = 100;
const CACHE_TTL = 30 * 60 * 1000; // 30분

// 캐시 파일 경로
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../../.cache');
const BRAND_CACHE_FILE = path.join(CACHE_DIR, 'brand-collabs-kr.json');
const COLLAB_CACHE_FILE = path.join(CACHE_DIR, 'collaborators.json');

// ─── 메모리 캐시 ───
let brandCache = { data: null, timestamp: 0, loading: false };
let collabCache = { data: null, timestamp: 0, loading: false };

// 캐시 디렉토리 생성
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// 파일 캐시 로드 (서버 시작 시 즉시)
function loadFileCache() {
    try {
        if (fs.existsSync(BRAND_CACHE_FILE)) {
            const raw = JSON.parse(fs.readFileSync(BRAND_CACHE_FILE, 'utf-8'));
            brandCache = { data: raw.data, timestamp: raw.timestamp, loading: false };
            console.log(`[InfluencerPool] 파일 캐시 로드: brand-collabs ${raw.data.length}명 (${new Date(raw.timestamp).toLocaleString()})`);
        }
        if (fs.existsSync(COLLAB_CACHE_FILE)) {
            const raw = JSON.parse(fs.readFileSync(COLLAB_CACHE_FILE, 'utf-8'));
            collabCache = { data: raw.data, timestamp: raw.timestamp, loading: false };
            console.log(`[InfluencerPool] 파일 캐시 로드: collaborators ${raw.data.length}명 (${new Date(raw.timestamp).toLocaleString()})`);
        }
    } catch (e) {
        console.error('[InfluencerPool] 파일 캐시 로드 실패:', e.message);
    }
}
loadFileCache();

function saveFileCache(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
        console.error('[InfluencerPool] 파일 캐시 저장 실패:', e.message);
    }
}

// ─── ALB 호출 ───
function fetchFromALB(url) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const req = https.request({
            hostname: parsed.hostname,
            port: 443,
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: { 'x-api-key': API_KEY },
            rejectUnauthorized: false,
            timeout: 30000,
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
        req.end();
    });
}

async function fetchPageSafe(path, page, extraParams = '') {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const url = `${BASE_URL}${path}?page=${page}&pageSize=${PAGE_SIZE}${extraParams}`;
            const response = await fetchFromALB(url);
            if (response.status === 200) return JSON.parse(response.body);
            if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        } catch (e) {
            if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
            else throw e;
        }
    }
    return null;
}

// ─── 백그라운드 수집: 타브랜드 KR (전체 플랫폼) ───
const BRAND_PLATFORMS = ['instagram', 'tiktok'];
const BRAND_MAX_PAGES = { instagram: 80, tiktok: 30 };

async function fetchBrandCollabsByPlatform(platform) {
    const param = `&platform=${platform}`;
    const first = await fetchPageSafe('/influencer-find-agent/api/brand-collabs', 1, param);
    if (!first) return [];

    const maxPages = BRAND_MAX_PAGES[platform] || 30;
    const totalPages = Math.min(first.pagination?.totalPages || 1, maxPages);
    let krList = (first.influencers || []).filter((i) => i.estimatedCountry === 'KR');

    for (let p = 2; p <= totalPages; p += 3) {
        const batch = [];
        for (let i = p; i < p + 3 && i <= totalPages; i++) {
            batch.push(fetchPageSafe('/influencer-find-agent/api/brand-collabs', i, param));
        }
        const results = await Promise.all(batch);
        for (const data of results) {
            if (data) {
                krList = krList.concat((data.influencers || []).filter((i) => i.estimatedCountry === 'KR'));
            }
        }
    }

    console.log(`[InfluencerPool] brand-collabs ${platform} KR: ${krList.length}명`);
    return krList;
}

async function refreshBrandCollabs() {
    if (brandCache.loading) return;
    brandCache.loading = true;

    try {
        console.log('[InfluencerPool] brand-collabs KR 전체 플랫폼 수집 시작...');
        const results = await Promise.allSettled(BRAND_PLATFORMS.map(fetchBrandCollabsByPlatform));
        const krList = results
            .filter((r) => r.status === 'fulfilled')
            .flatMap((r) => r.value);

        results.forEach((r, i) => {
            if (r.status === 'rejected') console.warn(`[InfluencerPool] brand-collabs ${BRAND_PLATFORMS[i]} 실패:`, r.reason?.message);
        });

        // 이전 캐시 + 새 수집 합산 (실패한 플랫폼은 기존 캐시에서 유지)
        const successPlatforms = new Set(results.filter((r, i) => r.status === 'fulfilled').map((_, i) => BRAND_PLATFORMS[i]));
        const preserved = (brandCache.data || []).filter((inf) => !successPlatforms.has(inf.platform));
        const merged = [...preserved, ...krList];

        brandCache = { data: merged, timestamp: Date.now(), loading: false };
        saveFileCache(BRAND_CACHE_FILE, merged);
        console.log(`[InfluencerPool] brand-collabs KR 수집 완료: ${merged.length}명 (성공: ${[...successPlatforms].join(', ')})`);
    } catch (error) {
        console.error('[InfluencerPool] brand-collabs 수집 실패:', error.message);
        brandCache.loading = false;
    }
}

// ─── 백그라운드 수집: FNCO collaborators (전체 플랫폼) ───
const COLLAB_PLATFORMS = ['instagram', 'tiktok'];

async function fetchCollabsByPlatform(platform) {
    const param = `&platform=${platform}`;
    const first = await fetchPageSafe('/influencer-find-agent/api/collaborators', 1, param);
    if (!first) return [];

    const totalCount = first.totalCount || first.collaborators?.length || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    let list = [...(first.collaborators || [])];

    for (let p = 2; p <= totalPages; p += 3) {
        const batch = [];
        for (let i = p; i < p + 3 && i <= totalPages; i++) {
            batch.push(fetchPageSafe('/influencer-find-agent/api/collaborators', i, param));
        }
        const results = await Promise.all(batch);
        for (const data of results) {
            if (data) list = list.concat(data.collaborators || []);
        }
    }

    console.log(`[InfluencerPool] collaborators ${platform}: ${list.length}명`);
    return list;
}

async function refreshCollaborators() {
    if (collabCache.loading) return;
    collabCache.loading = true;

    try {
        console.log('[InfluencerPool] collaborators 전체 플랫폼 수집 시작...');
        const results = await Promise.allSettled(COLLAB_PLATFORMS.map(fetchCollabsByPlatform));
        const allCollabs = results
            .filter((r) => r.status === 'fulfilled')
            .flatMap((r) => r.value);

        results.forEach((r, i) => {
            if (r.status === 'rejected') console.warn(`[InfluencerPool] collaborators ${COLLAB_PLATFORMS[i]} 실패:`, r.reason?.message);
        });

        const successPlatforms = new Set(results.filter((r, i) => r.status === 'fulfilled').map((_, i) => COLLAB_PLATFORMS[i]));
        const preserved = (collabCache.data || []).filter((inf) => !successPlatforms.has(inf.platform));
        const merged = [...preserved, ...allCollabs];

        collabCache = { data: merged, timestamp: Date.now(), loading: false };
        saveFileCache(COLLAB_CACHE_FILE, merged);
        console.log(`[InfluencerPool] collaborators 수집 완료: ${merged.length}명 (성공: ${[...successPlatforms].join(', ')})`);
    } catch (error) {
        console.error('[InfluencerPool] collaborators 수집 실패:', error.message);
        collabCache.loading = false;
    }
}

// 서버 시작 시: 파일 캐시 없으면 백그라운드 수집
setTimeout(() => {
    if (!brandCache.data) refreshBrandCollabs();
    if (!collabCache.data) refreshCollaborators();
}, 2000);

// ─── 라우트 ───

// GET /api/influencer-pool/brand-collabs
router.get('/brand-collabs', (req, res) => {
    // 캐시 만료 시 백그라운드 갱신
    if (Date.now() - brandCache.timestamp > CACHE_TTL && !brandCache.loading) {
        refreshBrandCollabs();
    }

    if (brandCache.data) {
        return res.json({
            influencers: brandCache.data,
            pagination: { totalCount: brandCache.data.length },
        });
    }

    // 캐시 아직 없음
    res.json({ influencers: [], pagination: { totalCount: 0 }, _loading: true });
});

// GET /api/influencer-pool/collaborators
router.get('/collaborators', (req, res) => {
    if (Date.now() - collabCache.timestamp > CACHE_TTL && !collabCache.loading) {
        refreshCollaborators();
    }

    if (collabCache.data) {
        return res.json({
            collaborators: collabCache.data,
            totalCount: collabCache.data.length,
        });
    }

    res.json({ collaborators: [], totalCount: 0, _loading: true });
});

// 수동 캐시 갱신
// POST /api/influencer-pool/refresh
router.post('/refresh', (req, res) => {
    refreshBrandCollabs();
    refreshCollaborators();
    res.json({ message: '캐시 갱신 시작됨' });
});

// ─── 허브 대상 확정 ───

// 서버용 profileId 해시 생성 (클라이언트와 동일 로직)
function generateProfileId(platform, username) {
    const str = `${platform}:${username}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    let hash2 = 0;
    for (let i = str.length - 1; i >= 0; i--) {
        const char = str.charCodeAt(i);
        hash2 = ((hash2 << 5) - hash2) + char;
        hash2 = hash2 & hash2;
    }
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
    return (hex + hex2).substring(0, 12);
}

// POST /api/influencer-pool/confirm
router.post('/confirm', async (req, res) => {
    const { influencers, created_by } = req.body;

    if (!influencers?.length || !created_by) {
        return res.status(400).json({ error: 'influencers 배열과 created_by 필수' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const inf of influencers) {
            const profileId = generateProfileId(inf.platform, inf.username);
            await client.query(upsertConfirmedInfluencer, [
                profileId,                  // $1 profile_id
                inf.platform,               // $2 platform
                inf.username,               // $3 profile_nm
                inf.displayName,            // $4 display_name
                inf.profileUrl || '',       // $5 profile_url
                inf.biography || '',        // $6 bio
                '',                         // $7 profile_img (빈 값)
                inf.followers || 0,         // $8 follow_count
                inf.posts || 0,             // $9 post_count
                inf.creator_type,           // $10 influencer_type
                inf.engagementRate ?? null,  // $11 engagement_rate
                created_by,                 // $12 created_by / updated_by
            ]);
        }

        await client.query('COMMIT');
        console.log(`[InfluencerPool] 허브 대상 ${influencers.length}명 확정 by ${created_by}`);
        res.json({ success: true, count: influencers.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[InfluencerPool] confirm error:', error.message);
        res.status(500).json({ error: '허브 대상 확정 실패' });
    } finally {
        client.release();
    }
});

// GET /api/influencer-pool/confirmed
router.get('/confirmed', async (req, res) => {
    try {
        const result = await pool.query(selectConfirmedInfluencers);
        res.json({ influencers: result.rows, count: result.rows.length });
    } catch (error) {
        console.error('[InfluencerPool] confirmed error:', error.message);
        res.status(500).json({ error: '확정 인원 조회 실패' });
    }
});

// GET /api/influencer-pool/confirmed/count
router.get('/confirmed/count', async (req, res) => {
    try {
        const result = await pool.query(countConfirmedInfluencers);
        res.json({ count: Number(result.rows[0].count) });
    } catch (error) {
        console.error('[InfluencerPool] confirmed count error:', error.message);
        res.status(500).json({ error: '확정 인원 수 조회 실패' });
    }
});

// POST /api/influencer-pool/cancel — 벌크 허브 대상 취소
router.post('/cancel', async (req, res) => {
    const { profileIds, updated_by } = req.body;

    if (!profileIds?.length || !updated_by) {
        return res.status(400).json({ error: 'profileIds 배열과 updated_by 필수' });
    }

    try {
        await pool.query(bulkCancelConfirmed, [updated_by, profileIds]);
        console.log(`[InfluencerPool] 허브 대상 ${profileIds.length}명 취소 by ${updated_by}`);
        res.json({ success: true, count: profileIds.length });
    } catch (error) {
        console.error('[InfluencerPool] cancel error:', error.message);
        res.status(500).json({ error: '허브 대상 취소 실패' });
    }
});

// PATCH /api/influencer-pool/confirm/:profileId
router.patch('/confirm/:profileId', async (req, res) => {
    const { profileId } = req.params;
    const { platform, is_selected, updated_by } = req.body;

    if (!platform || !updated_by) {
        return res.status(400).json({ error: 'platform과 updated_by 필수' });
    }

    try {
        await pool.query(updateIsSelected, [
            is_selected ?? false, // $1
            updated_by,           // $2
            profileId,            // $3
            platform,             // $4
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error('[InfluencerPool] update is_selected error:', error.message);
        res.status(500).json({ error: '확정 상태 변경 실패' });
    }
});

// ─── 심층 분석 ───

const FASTAPI_URL = process.env.API_URL || 'http://localhost:8000';

// POST /api/influencer-pool/deep-analysis — 심층 분석 요청 (FastAPI 프록시)
router.post('/deep-analysis', async (req, res) => {
    const { profile_id, platform, username, display_name, profile_url, followers_count } = req.body;

    if (!profile_id || !platform || !username) {
        return res.status(400).json({ status: 'error', message: 'profile_id, platform, username 필수' });
    }

    try {
        // FastAPI에 비동기 요청 (fire-and-forget은 아니고, 즉시 응답을 받음)
        const response = await fetch(`${FASTAPI_URL}/api/influencer-pool/deep-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_id, platform, username, display_name, profile_url, followers_count }),
        });

        const data = await response.json();
        res.status(response.status === 200 ? 202 : response.status).json(data);
    } catch (error) {
        console.error('[DeepAnalysis] 요청 실패:', error.message);

        // FastAPI 연결 실패 시에도 DB에 processing 상태로 기록 (추후 재시도 가능)
        try {
            await pool.query(`
                INSERT INTO fnco_influencer.dw_influencer_ai_analysis (profile_id, platform, followers_count, status)
                VALUES ($1, $2, $3, 'failed')
                ON CONFLICT (profile_id, platform) DO UPDATE SET status = 'failed', analyzed_at = NOW()
            `, [profile_id, platform, followers_count || 0]);
        } catch (dbErr) {
            console.error('[DeepAnalysis] DB fallback 실패:', dbErr.message);
        }

        res.status(502).json({ status: 'error', message: 'FastAPI 연결 실패' });
    }
});

// GET /api/influencer-pool/deep-analysis/status — 상태 폴링 (completedIds)
//   ?profile_ids=abc123,def456   → 특정 ID들 상태
//   (파라미터 없으면)             → 전체 completed ID 목록
router.get('/deep-analysis/status', async (req, res) => {
    try {
        const { profile_ids } = req.query;

        if (profile_ids) {
            // 특정 ID들의 상태 조회
            const ids = profile_ids.split(',').map((id) => id.trim()).filter(Boolean);
            const result = await pool.query(`
                SELECT profile_id, status
                FROM fnco_influencer.dw_influencer_ai_analysis
                WHERE profile_id = ANY($1)
            `, [ids]);

            const statuses = {};
            for (const row of result.rows) {
                statuses[row.profile_id] = row.status;
            }
            return res.json({ statuses });
        }

        // 전체 completed + processing 목록
        const result = await pool.query(`
            SELECT profile_id, status, avg_views_deep
            FROM fnco_influencer.dw_influencer_ai_analysis
            WHERE status IN ('completed', 'processing')
        `);

        const completedIds = [];
        const processingIds = [];
        const statsMap = {};
        for (const row of result.rows) {
            if (row.status === 'completed') {
                completedIds.push(row.profile_id);
                statsMap[row.profile_id] = { avg_views: Number(row.avg_views_deep) || 0 };
            } else if (row.status === 'processing') {
                processingIds.push(row.profile_id);
            }
        }
        res.json({ completedIds, processingIds, statsMap });
    } catch (error) {
        console.error('[DeepAnalysis] status 조회 실패:', error.message);
        res.status(500).json({ error: '상태 조회 실패' });
    }
});

// GET /api/influencer-pool/deep-analysis/:profileId — 분석 결과 조회
router.get('/deep-analysis/:profileId', async (req, res) => {
    const { profileId } = req.params;
    const { platform } = req.query;

    try {
        const query = platform
            ? `SELECT * FROM fnco_influencer.dw_influencer_ai_analysis WHERE profile_id = $1 AND platform = $2`
            : `SELECT * FROM fnco_influencer.dw_influencer_ai_analysis WHERE profile_id = $1 ORDER BY analyzed_at DESC LIMIT 1`;

        const params = platform ? [profileId, platform] : [profileId];
        console.log('[DeepAnalysis] 결과 조회 쿼리:', query);
        console.log('[DeepAnalysis] 파라미터:', params);
        const result = await pool.query(query, params);
        console.log('[DeepAnalysis] 조회 결과 행 수:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('[DeepAnalysis] ❌ 결과 없음 — profile_id:', profileId, 'platform:', platform);
            return res.status(404).json({ status: 'not_found', message: '분석 결과 없음' });
        }

        const row = result.rows[0];
        console.log('[DeepAnalysis] ✅ 조회 성공 — status:', row.status, '| deep_analysis 존재:', row.deep_analysis != null, '| deep_analysis 타입:', typeof row.deep_analysis, '| overview 존재:', row.deep_analysis?.overview != null);
        res.json({
            status: row.status,
            profile_id: row.profile_id,
            platform: row.platform,
            analyzed_at: row.analyzed_at,
            stats: {
                recent_posts_count: row.recent_posts_count_deep,
                video_posts_count: row.video_posts_count_deep,
                avg_views: row.avg_views_deep,
                avg_likes: row.avg_likes_deep,
                avg_comments: row.avg_comments_deep,
                avg_shares: row.avg_shares_deep,
                engagement_rate: row.engagement_rate_deep,
                ad_posts_count: row.ad_posts_count_deep,
                ad_ratio: row.ad_ratio_deep,
            },
            top_content: {
                url: row.top_content_url,
                caption: row.top_content_caption,
                type: row.top_content_type,
                likes: row.top_content_likes,
                comments: row.top_content_comments,
                views: row.top_content_views,
                shares: row.top_content_shares,
                posted_at: row.top_content_posted_at,
                thumbnail_s3_url: row.top_content_thumbnail_s3_url,
            },
            deep_analysis: row.deep_analysis,
        });
    } catch (error) {
        console.error('[DeepAnalysis] 결과 조회 실패:', error.message);
        res.status(500).json({ error: '분석 결과 조회 실패' });
    }
});

export default router;
