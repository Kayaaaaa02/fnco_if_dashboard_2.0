import { pool } from '../config/database.js';
import { selectCampaignInfluencers, selectCampaignInfluencer } from '../sql/campaignInfluencer/selectQuery.js';
import { insertBulkCampaignInfluencers } from '../sql/campaignInfluencer/insertQuery.js';
import { updateInfluencerStatus as updateInfluencerStatusQuery, updateInfluencerDeepAnalysis } from '../sql/campaignInfluencer/updateQuery.js';

// 대량 인플루언서 상태 업데이트
export const bulkUpdateInfluencers = async (req, res) => {
    try {
        const { id: campaignId } = req.params;
        const { ids, action, data } = req.body;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids 배열이 필요합니다.' });
        }

        const validActions = ['approve', 'reject', 'update_status'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ error: `유효하지 않은 action입니다. (${validActions.join(', ')})` });
        }

        let status;
        if (action === 'approve') {
            status = 'selected';
        } else if (action === 'reject') {
            status = 'declined';
        } else if (action === 'update_status') {
            status = data?.status;
            const allowedStatuses = ['matched', 'selected', 'declined', 'contacted', 'confirmed'];
            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({ error: `유효하지 않은 status입니다. (${allowedStatuses.join(', ')})` });
            }
        }

        // 동적 파라미터 생성: $1=status, $2=campaignId, $3...$N=profileIds
        const params = [status, campaignId];
        const placeholders = ids.map((id, idx) => `$${idx + 3}`);
        ids.forEach((id) => params.push(String(id)));

        const updateQuery = `
            UPDATE dw_campaign_influencer
            SET
                status = $1,
                selected_at = NOW(),
                created_at = NOW()
            WHERE campaign_id = $2
              AND profile_id IN (${placeholders.join(', ')})
        `;

        const result = await pool.query(updateQuery, params);

        res.json({
            success: true,
            message: '대량 업데이트가 완료되었습니다.',
            updated: result.rowCount || 0,
        });
    } catch (error) {
        console.error('[bulkUpdateInfluencers]', error);
        res.status(500).json({ error: '대량 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 인플루언서 매칭 목록 조회
export const getCampaignInfluencers = async (req, res) => {
    try {
        const { id: campaignId } = req.params;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectCampaignInfluencers(campaignId);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getCampaignInfluencers]', error);
        res.status(500).json({ error: '인플루언서 매칭 목록 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

/** 키워드 → 페르소나 매핑 테이블 */
const PERSONA_KEYWORD_MAP = [
    { code: 'P1', keywords: ['입문', '초보', '뷰티 관심', '뷰티 팁', '메이크업 팁', '데일리 뷰티', '메이크업덕후', '트렌드 민감', '메이크업 정보', 'ootd', '오오티디', '쿨톤', '웜톤'] },
    { code: 'P2', keywords: ['효율', '실용', '가성비', '합리적', '올리브영', '다이소', '올영'] },
    { code: 'P3', keywords: ['마니아', '코덕', '스킨케어', '성분', '전문', '리뷰', '상세리뷰', '전문성'] },
    { code: 'P4', keywords: ['안티에이징', '탄력', '주름', '에이징'] },
    { code: 'P5', keywords: ['클린', '비건', '자연', '유기농'] },
    { code: 'P6', keywords: ['그루밍', '남성', '남자', '남녀'] },
    { code: 'P7', keywords: ['트러블', '여드름', '피지', '모공'] },
    { code: 'P8', keywords: ['골든', '4050', '40대', '50대', '중년'] },
    { code: 'P9', keywords: ['민감', '더마', '진정', '수딩', '자극'] },
    { code: 'P10', keywords: ['육아', '워킹맘', '주부', '산후', '바쁜'] },
    { code: 'P11', keywords: ['럭셔리', '프리미엄', '하이엔드', '고급', '감성 소비'] },
    { code: 'P12', keywords: ['이벤트', '챌린지', '프로모션'] },
];

/** deep analysis JSON에서 P코드 추출 (P1, P2 등) — 직접 P코드 + 키워드 폴백 */
function extractPersonaCodesFromAnalysis(deepAnalysis) {
    if (!deepAnalysis) return [];
    const overview = deepAnalysis.overview || deepAnalysis;
    const ta = overview?.['타겟_오디언스'];
    if (!ta) return [];

    // 1) 직접 P코드 추출
    const desc = ta['설명'] || [];
    const arr = Array.isArray(desc) ? desc : [desc];
    const codes = [];
    for (const item of arr) {
        if (typeof item !== 'string') continue;
        const m = item.match(/P\d+/g);
        if (m) codes.push(...m);
    }
    if (codes.length > 0) return [...new Set(codes)];

    // 2) 키워드 기반 폴백 매칭
    const tags = Array.isArray(ta['태그']) ? ta['태그'] : [];
    const allText = [...(Array.isArray(desc) ? desc : [desc]), ...tags]
        .filter(Boolean).join(' ').toLowerCase();
    if (!allText) return [];

    const matched = [];
    for (const p of PERSONA_KEYWORD_MAP) {
        if (p.keywords.some((kw) => allText.includes(kw))) {
            matched.push(p.code);
        }
    }
    return matched.slice(0, 2);
}

// 인플루언서 매칭 실행 — 허브 확정 인원(is_selected=true)을 페르소나 기반으로 매칭
export const matchInfluencers = async (req, res) => {
    try {
        const { id: campaignId } = req.params;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 1. 캠페인의 P.D.A. 컨셉 + 페르소나 조회
        const conceptResult = await pool.query(
            'SELECT * FROM mst_pda_concept WHERE campaign_id = $1',
            [campaignId]
        );
        const concepts = conceptResult.rows;

        if (concepts.length === 0) {
            return res.status(400).json({ error: '캠페인에 등록된 P.D.A. 컨셉이 없습니다. 먼저 컨셉을 생성해주세요.' });
        }

        const personaResult = await pool.query(
            `SELECT * FROM fnco_influencer.mst_pda_persona
             WHERE campaign_id = $1 AND is_active = true
             ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`,
            [campaignId]
        );
        const personas = personaResult.rows;

        // 2. 허브 확정 인원 (is_selected = true) + deep analysis 조회
        const influencerResult = await pool.query(
            `SELECT
                A.profile_id, A.profile_nm, A.profile_url, A.profile_img,
                A.follow_count, A.post_count, A.influencer_type, A.platform,
                B.deep_analysis, B.deep_analysis_eng, B.deep_analysis_cn,
                B.avg_engagement_quick, B.quick_summary, B.avg_views_quick,
                B.content_types
            FROM fnco_influencer.mst_influencer A
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            WHERE A.is_selected IS TRUE`
        );
        const influencers = influencerResult.rows;

        if (influencers.length === 0) {
            return res.status(400).json({ error: '허브 대상 확정된 인플루언서가 없습니다. 인플루언서 풀에서 먼저 확정해주세요.' });
        }

        // 3. 페르소나 기반 매칭
        const conceptIds = concepts.map((c) => c.concept_id);
        // 페르소나 코드 → 연결된 컨셉 매핑
        const personaConceptMap = {};
        concepts.forEach((c) => {
            const pCode = c.persona_code || c.persona_id;
            if (pCode) {
                if (!personaConceptMap[pCode]) personaConceptMap[pCode] = [];
                personaConceptMap[pCode].push(c.concept_id);
            }
        });

        const matchedInfluencers = influencers.map((inf) => {
            const deepAnalysis = typeof inf.deep_analysis === 'string'
                ? JSON.parse(inf.deep_analysis) : inf.deep_analysis;

            // deep analysis에서 P코드 추출
            const pCodes = extractPersonaCodesFromAnalysis(deepAnalysis);

            // 페르소나 매칭 스코어 계산
            let bestPersonaCode = pCodes[0] || null;
            let matchScore = 50;

            if (pCodes.length > 0 && personas.length > 0) {
                // P코드가 캠페인 페르소나와 일치하는지 확인
                const campaignPersonaCodes = personas.map((p) => p.code);
                const matched = pCodes.filter((pc) => campaignPersonaCodes.includes(pc));
                if (matched.length > 0) {
                    bestPersonaCode = matched[0];
                    matchScore = 75 + Math.min(matched.length * 5, 20);
                    // 참여율 보너스
                    const engRate = Number(inf.avg_engagement_quick) || 0;
                    if (engRate >= 5) matchScore = Math.min(matchScore + 5, 98);
                    else if (engRate >= 3) matchScore = Math.min(matchScore + 3, 98);
                }
            }

            // 매칭된 컨셉: 해당 페르소나에 연결된 컨셉 우선, 없으면 전체에서 선택
            let matchedConcepts = [];
            if (bestPersonaCode && personaConceptMap[bestPersonaCode]) {
                matchedConcepts = personaConceptMap[bestPersonaCode];
            }
            if (matchedConcepts.length === 0) {
                matchedConcepts = conceptIds.slice(0, Math.min(2, conceptIds.length));
            }

            // 매칭 사유 생성
            const overview = deepAnalysis?.overview || {};
            const targetAudience = overview['타겟_오디언스'] || {};
            const tags = Array.isArray(targetAudience['태그']) ? targetAudience['태그'].join(', ') : '';
            const personaLabel = pCodes.length > 0 ? pCodes.join(', ') : '미분류';

            const matchReason = deepAnalysis
                ? `페르소나 ${personaLabel} 매칭. ${tags ? `타겟 오디언스: ${tags}.` : ''} ${inf.quick_summary || ''}`
                : `허브 확정 인플루언서. 심층 분석 후 정확한 페르소나 매칭이 가능합니다.`;

            return {
                profile_id: inf.profile_id,
                matched_concepts: matchedConcepts,
                match_score: matchScore,
                match_reason: {
                    ko: matchReason,
                    persona_codes: pCodes,
                    persona_primary: bestPersonaCode,
                },
            };
        });

        // 4. 기존 매칭 삭제 후 새로 등록
        await pool.query(
            'DELETE FROM dw_campaign_influencer WHERE campaign_id = $1',
            [campaignId]
        );

        const sqlSet = insertBulkCampaignInfluencers(campaignId, matchedInfluencers);
        await pool.query(sqlSet.insertQuery, sqlSet.params);

        // 5. 전체 매칭 결과 반환
        const resultSqlSet = selectCampaignInfluencers(campaignId);
        const finalResult = await pool.query(resultSqlSet.selectQuery, resultSqlSet.params);

        res.status(201).json({
            success: true,
            message: `${finalResult.rows.length}명의 FNCO 크리에이터가 페르소나 기반으로 매칭되었습니다.`,
            data: finalResult.rows,
            count: finalResult.rows.length,
        });
    } catch (error) {
        console.error('[matchInfluencers]', error);
        res.status(500).json({ error: '인플루언서 매칭 중 오류가 발생했습니다.', details: error.message });
    }
};

// 인플루언서 상태 업데이트 (selected/declined/contacted/confirmed)
export const updateInfluencerStatus = async (req, res) => {
    try {
        const { id: campaignId, profileId } = req.params;
        const { status, selected_by } = req.body;

        if (!campaignId || !profileId) {
            return res.status(400).json({ error: 'campaign_id와 profile_id가 필요합니다.' });
        }

        if (!status) {
            return res.status(400).json({ error: 'status가 필요합니다.' });
        }

        const validStatuses = ['matched', 'selected', 'declined', 'contacted', 'confirmed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `유효하지 않은 status입니다. (${validStatuses.join(', ')})` });
        }

        const sqlSet = updateInfluencerStatusQuery(campaignId, profileId, status, selected_by || null);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '인플루언서 매칭 기록을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '인플루언서 상태가 업데이트되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[updateInfluencerStatus]', error);
        res.status(500).json({ error: '인플루언서 상태 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 인플루언서 딥 분석 (MOCK AI)
export const deepAnalyzeInfluencer = async (req, res) => {
    try {
        const { id: campaignId, profileId } = req.params;

        if (!campaignId || !profileId) {
            return res.status(400).json({ error: 'campaign_id와 profile_id가 필요합니다.' });
        }

        // 인플루언서 존재 확인
        const checkSqlSet = selectCampaignInfluencer(campaignId, profileId);
        const checkResult = await pool.query(checkSqlSet.selectQuery, checkSqlSet.params);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: '인플루언서 매칭 기록을 찾을 수 없습니다.' });
        }

        const influencer = checkResult.rows[0];

        // MOCK 딥 분석 결과 생성
        const themes = [
            ['스킨케어', 'GRWM', '데일리룩'],
            ['맛집', '카페투어', '브이로그'],
            ['운동', '건강식', '자기관리'],
            ['여행', '호텔리뷰', '핫플레이스'],
            ['뷰티', '메이크업', '제품리뷰'],
        ];
        const styles = ['자연스러운', '트렌디한', '미니멀한', '감성적인', '전문적인'];
        const bestContents = ['클렌징 루틴', '주간 브이로그', '제품 비교 리뷰', '일상 공유', '챌린지 콘텐츠'];
        const frequencies = ['주 3회', '주 5회', '매일', '주 2회', '주 4회'];
        const demographics = ['20대 여성 78%', '10대~20대 여성 65%', '20대~30대 남녀 55%', '30대 여성 72%', '20대 남녀 60%'];

        const randIdx = Math.floor(Math.random() * 5);

        const deepAnalysis = {
            overview: {
                bio: influencer.bio || '크리에이티브 콘텐츠 제작자',
                content_frequency: frequencies[randIdx],
                audience_demographics: demographics[randIdx],
            },
            content_analysis: {
                themes: themes[randIdx],
                style: styles[randIdx],
                best_content: bestContents[randIdx],
            },
            collaboration_fit: {
                score: Math.floor(Math.random() * 30) + 70,
                reason: '브랜드 톤과 높은 일치도',
                recommended_concepts: influencer.matched_concepts || [],
            },
        };

        // 딥 분석 결과 업데이트
        const sqlSet = updateInfluencerDeepAnalysis(campaignId, profileId, deepAnalysis);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        res.json({
            success: true,
            message: '인플루언서 딥 분석이 완료되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[deepAnalyzeInfluencer]', error);
        res.status(500).json({ error: '인플루언서 딥 분석 중 오류가 발생했습니다.', details: error.message });
    }
};
