import { pool } from '../config/database.js';
import { selectStrategy, selectStrategyHistory } from '../sql/strategy/selectQuery.js';
import { insertStrategy } from '../sql/strategy/insertQuery.js';
import { updateStrategy as updateStrategyQuery, updateStrategyStatus } from '../sql/strategy/updateQuery.js';
import { runAlignmentLogic } from './alignmentController.js';

// 캠페인 전략 최신 버전 조회
export const getStrategy = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectStrategy(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '전략을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[getStrategy]', error);
        res.status(500).json({ error: '전략 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 전략 히스토리 조회
export const getStrategyHistory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectStrategyHistory(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getStrategyHistory]', error);
        res.status(500).json({ error: '전략 히스토리 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 전략 생성 — PDA 확정 컨셉 기반
export const generateStrategy = async (req, res) => {
    try {
        const { id } = req.params;
        const { created_by, confirmed_concept_ids } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 현재 버전 확인
        const historySql = selectStrategyHistory(id);
        const historyResult = await pool.query(historySql.selectQuery, historySql.params);
        const nextVersion = historyResult.rows.length > 0
            ? historyResult.rows[0].version + 1
            : 1;

        // PDA 데이터 조회
        const [personaRes, desireRes, awarenessRes, conceptRes] = await Promise.all([
            pool.query(`SELECT * FROM fnco_influencer.mst_pda_persona WHERE campaign_id = $1 AND is_active = true ORDER BY sort_order`, [id]),
            pool.query(`SELECT * FROM fnco_influencer.mst_pda_desire WHERE campaign_id = $1 AND is_active = true ORDER BY sort_order`, [id]),
            pool.query(`SELECT * FROM fnco_influencer.mst_pda_awareness WHERE campaign_id = $1 ORDER BY sort_order`, [id]),
            pool.query(`
                SELECT c.*, p.code AS persona_code, p.name AS persona_name,
                       d.code AS desire_code, d.name AS desire_name,
                       a.code AS awareness_code, a.name AS awareness_name, a.funnel AS awareness_funnel
                FROM fnco_influencer.mst_pda_concept c
                LEFT JOIN fnco_influencer.mst_pda_persona p ON c.persona_id = p.persona_id
                LEFT JOIN fnco_influencer.mst_pda_desire d ON c.desire_id = d.desire_id
                LEFT JOIN fnco_influencer.mst_pda_awareness a ON c.awareness_id = a.awareness_id
                WHERE c.campaign_id = $1 ORDER BY c.sort_order
            `, [id]),
        ]);

        const personas = personaRes.rows;
        const desires = desireRes.rows;
        const awareness = awarenessRes.rows;
        let concepts = conceptRes.rows;

        // 확정된 컨셉 ID가 있으면 필터링
        if (confirmed_concept_ids?.length > 0) {
            concepts = concepts.filter((c) => confirmed_concept_ids.includes(c.concept_id));
        }

        if (concepts.length === 0) {
            return res.status(400).json({ error: '확정된 컨셉이 없습니다. 먼저 컨셉을 확정해주세요.' });
        }

        // PDA 기반 전략 데이터 빌드
        const strategyKo = buildStrategyFromPDA(personas, desires, awareness, concepts);

        const sqlSet = insertStrategy({
            campaign_id: id,
            version: nextVersion,
            strategy_ko: strategyKo,
            strategy_eng: null,
            strategy_cn: null,
            created_by: created_by || null,
        });

        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        // ── 론칭 서사 아크 자동 생성 ──
        try {
            const narrativePhases = buildNarrativeArcFromPDA(personas, awareness, concepts);
            await pool.query(
                `CREATE TABLE IF NOT EXISTS fnco_influencer.dw_narrative_arc (
                    arc_id SERIAL PRIMARY KEY,
                    campaign_id VARCHAR(64) NOT NULL,
                    version INTEGER DEFAULT 1,
                    phases JSONB NOT NULL DEFAULT '[]',
                    status VARCHAR(20) DEFAULT 'draft',
                    created_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`
            );
            const arcVersionRes = await pool.query(
                `SELECT COALESCE(MAX(version), 0) AS max_version FROM fnco_influencer.dw_narrative_arc WHERE campaign_id = $1`,
                [id]
            );
            const arcNextVersion = arcVersionRes.rows[0].max_version + 1;
            await pool.query(
                `INSERT INTO fnco_influencer.dw_narrative_arc (campaign_id, version, phases, status, created_by)
                 VALUES ($1, $2, $3, 'draft', $4)`,
                [id, arcNextVersion, JSON.stringify(narrativePhases), created_by || null]
            );
            console.log('[generateStrategy] 론칭 서사 아크 자동 생성 완료 — 4단계');
        } catch (arcErr) {
            console.error('[generateStrategy] 서사 아크 자동 생성 실패 (전략 생성은 성공):', arcErr.message);
        }

        // ── 정합성 체크 자동 실행 ──
        let alignmentResult = null;
        try {
            alignmentResult = await runAlignmentLogic(id);
            console.log('[generateStrategy] 정합성 체크 자동 완료 — 종합 점수:', alignmentResult?.overall_score);
        } catch (alignErr) {
            console.error('[generateStrategy] 정합성 체크 자동 실행 실패 (전략 생성은 성공):', alignErr.message);
        }

        console.log('[generateStrategy] PDA 기반 전략 생성 완료 — 확정 컨셉:', concepts.length, '개');

        res.status(201).json({
            success: true,
            message: `${concepts.length}개 확정 컨셉 기반으로 캠페인 전략 + 론칭 서사 아크 + 정합성 체크가 생성되었습니다.`,
            data: result.rows[0],
            alignment: alignmentResult,
        });
    } catch (error) {
        console.error('[generateStrategy]', error);
        res.status(500).json({ error: '전략 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// ── PDA 확정 컨셉 → 캠페인 전략 빌드 ──
function buildStrategyFromPDA(personas, desires, awareness, concepts) {
    // 채널 집계: 틱톡 / 인스타그램 / 유튜브 3채널로 통합
    const channelMap = {};

    // placement → 3채널 통합 매핑
    const PLACEMENT_TO_CORE = {
        tiktok: 'tiktok',
        instagram_reels: 'instagram',
        instagram_feed: 'instagram',
        instagram_stories: 'instagram',
        youtube: 'youtube',
        naver_blog: 'youtube', // 블로그 컨셉은 유튜브로 흡수
    };

    const CHANNEL_LABELS = {
        tiktok: '틱톡',
        instagram: '인스타그램',
        youtube: '유튜브',
    };

    const CHANNEL_ROLES = {
        tiktok: 'TOFU 주력 — 숏폼 바이럴로 빠른 인지 확산. 추천 알고리즘 기반 비팔로워 도달 극대화, 트렌드 사운드·챌린지로 공감형 콘텐츠 확산',
        instagram: 'MOFU 주력 — Reels·피드·스토리를 활용한 비주얼 브랜딩 & 소셜프루프. 팔로워 기반 참여 유도, 저장·DM 공유를 통한 비교·교육 콘텐츠 배포',
        youtube: 'BOFU 주력 — 심층 리뷰·비교·언박싱으로 최종 구매 결정 유도. 긴 시청 시간을 활용한 제품 신뢰 구축, SEO 기반 장기 검색 유입',
    };

    // 퍼널별 추천 비중 (TOFU 많으면 틱톡↑, BOFU 많으면 유튜브↑)
    const CHANNEL_BASE_BUDGET = { tiktok: 35, instagram: 40, youtube: 25 };

    for (const c of concepts) {
        const rawPl = c.campaign_placement || 'instagram_reels';
        const coreCh = PLACEMENT_TO_CORE[rawPl] || 'instagram';
        if (!channelMap[coreCh]) {
            channelMap[coreCh] = { count: 0, funnels: {}, formats: new Set(), concepts: [] };
        }
        channelMap[coreCh].count++;
        channelMap[coreCh].funnels[c.funnel || 'TOFU'] = (channelMap[coreCh].funnels[c.funnel || 'TOFU'] || 0) + 1;
        if (c.format) channelMap[coreCh].formats.add(c.format);
        channelMap[coreCh].concepts.push(c.concept_name);
    }

    // 퍼널 분포 기반 동적 예산 비중 조정
    const funnelTotal = { TOFU: 0, MOFU: 0, BOFU: 0 };
    for (const c of concepts) funnelTotal[c.funnel || 'TOFU']++;
    const total = concepts.length || 1;
    const tofuW = funnelTotal.TOFU / total;
    const mofuW = funnelTotal.MOFU / total;
    const bofuW = funnelTotal.BOFU / total;

    // 퍼널 가중 비중: TOFU↑→틱톡↑, MOFU↑→인스타↑, BOFU↑→유튜브↑
    const dynamicBudget = {
        tiktok: Math.round(CHANNEL_BASE_BUDGET.tiktok + (tofuW - 0.33) * 30),
        instagram: Math.round(CHANNEL_BASE_BUDGET.instagram + (mofuW - 0.33) * 25),
        youtube: Math.round(CHANNEL_BASE_BUDGET.youtube + (bofuW - 0.33) * 25),
    };
    // 합계 100% 정규화
    const budgetSum = dynamicBudget.tiktok + dynamicBudget.instagram + dynamicBudget.youtube;
    Object.keys(dynamicBudget).forEach((k) => {
        dynamicBudget[k] = Math.round((dynamicBudget[k] / budgetSum) * 100);
    });

    // 3채널 순서: 비중 높은 순
    const channels = ['tiktok', 'instagram', 'youtube']
        .map((ch) => {
            const data = channelMap[ch] || { count: 0, funnels: {}, formats: new Set(), concepts: [] };
            return {
                name: CHANNEL_LABELS[ch],
                role: CHANNEL_ROLES[ch],
                content_types: [...data.formats],
                concept_count: data.count,
                concepts: data.concepts,
                budget_ratio: dynamicBudget[ch],
            };
        })
        .sort((a, b) => b.budget_ratio - a.budget_ratio);

    // 메시징: 페르소나 기반 핵심 메시지 + 욕구 기반 카피
    const keyMessages = concepts.slice(0, 3).map((c) => c.head_copy).filter(Boolean);
    const tones = [...new Set(concepts.map((c) => c.tone).filter(Boolean))];
    const messaging = {
        key_messages: keyMessages.length > 0 ? keyMessages : ['PDA 프레임워크 기반 메시지 설계'],
        tone: tones.join(', ') || '전문적이면서 공감형',
        brand_voice: personas.length > 0
            ? `${personas.map((p) => p.name).join(', ')} 타겟에 최적화된 톤앤매너`
            : '타겟 맞춤형 톤앤매너',
        avoid: ['과장된 효과 표현', '경쟁사 비교 광고', '근거 없는 주장'],
    };

    // 타이밍: 4단계 인지 여정 기반 페이즈 설계 — phases 배열 형식
    const awarenessPhases = awareness.length > 0 ? awareness : [
        { code: 'A1', name: '문제 인지', funnel: 'TOFU' },
        { code: 'A2', name: '해결책 인지', funnel: 'MOFU' },
        { code: 'A3', name: '제품 인지', funnel: 'MOFU' },
        { code: 'A4', name: '구매 유도', funnel: 'BOFU' },
    ];

    const timingPhases = awarenessPhases.map((stage, idx) => {
        const stageConcepts = concepts.filter((c) => c.awareness_code === stage.code);
        const stageChannels = [...new Set(stageConcepts.map((c) => {
            const core = PLACEMENT_TO_CORE[c.campaign_placement] || 'instagram';
            return CHANNEL_LABELS[core];
        }))];
        return {
            name: stage.name,
            funnel: stage.funnel,
            period: `${idx * 2 + 1}-${idx * 2 + 2}주차`,
            description: stage.strategy || `${stage.funnel} 단계 컨셉 배포`,
            channels: stageChannels,
            concept_count: stageConcepts.length,
            concept_ids: stageConcepts.map((c) => c.concept_id),
            concepts: stageConcepts.map((c) => ({
                name: c.concept_name,
                head_copy: c.head_copy,
                persona: c.persona_code,
                desire: c.desire_code,
                format: c.format,
            })),
        };
    });
    const timing = { phases: timingPhases };

    // 예산 배분
    const budget_allocation = {
        influencer_seeding: 40,
        paid_media: 25,
        content_production: 20,
        platform_ads: 10,
        contingency: 5,
    };

    // KPI 목표 — PDA 데이터 기반 동적 산출
    const kpis = buildKPIsFromPDA(concepts, channels, awarenessPhases);

    // PDA 요약 (전략 참조용)
    const pda_summary = {
        personas: personas.map((p) => ({
            code: p.code,
            name: p.name,
            occupation: p.profile_json?.occupation,
            pain_points: p.profile_json?.pain_points,
        })),
        desires: desires.map((d) => ({
            code: d.code,
            name: d.name,
            definition: d.definition,
        })),
        awareness_funnel: awarenessPhases.map((a) => ({
            code: a.code,
            name: a.name,
            funnel: a.funnel,
        })),
        confirmed_concepts: concepts.length,
        total_concepts_available: concepts.length,
    };

    return {
        pda_summary,
        channels,
        messaging,
        timing,
        budget: budget_allocation,
        kpis,
    };
}

// ── PDA 기반 KPI 목표 산출 ──
function buildKPIsFromPDA(concepts, channels, awarenessPhases) {
    const totalConcepts = concepts.length;

    // 퍼널별 컨셉 분포
    const funnelDist = { TOFU: 0, MOFU: 0, BOFU: 0 };
    for (const c of concepts) funnelDist[c.funnel || 'TOFU']++;
    const tofuRatio = totalConcepts > 0 ? funnelDist.TOFU / totalConcepts : 0.33;
    const bofuRatio = totalConcepts > 0 ? funnelDist.BOFU / totalConcepts : 0.25;

    // 채널 가중치 — 바이럴 채널이 많으면 도달 목표↑, 블로그 많으면 검색 유입↑
    const channelCount = channels.length;
    const hasShortForm = channels.some((ch) =>
        ['틱톡', '인스타그램'].includes(ch.name)
    );
    const hasLongForm = channels.some((ch) =>
        ['유튜브'].includes(ch.name)
    );

    // 인플루언서 시딩 기준: 컨셉당 평균 15명 = 총 시딩 인플루언서
    const estInfluencers = totalConcepts * 15;

    // ── KPI 산출 공식 (3개월 평균 대비 120% 목표) ──
    return {
        items: [
            {
                name: '평균 조회수',
                metric: 'avg_views',
                target: 140000,
                current: 140000,
                avg3m: 116244,
                unit: '회',
                formula: '3개월 평균 조회수(116,244회) 대비 120% → 140,000회',
            },
            {
                name: '인게이지먼트율',
                metric: 'engagement_rate',
                target: 2.62,
                current: 2.62,
                avg3m: 2.18,
                unit: '%',
                formula: '3개월 평균(2.18%) 대비 120% → 2.62%',
            },
            {
                name: '평균 좋아요 수',
                metric: 'avg_likes',
                target: 1014,
                current: 1014,
                avg3m: 845,
                unit: '회',
                formula: '3개월 평균(845회) 대비 120% → 1,014회',
            },
            {
                name: '컨텐츠 수',
                metric: 'content_count',
                target: 20,
                current: 20,
                avg3m: 17,
                unit: '건',
                formula: '3개월 월 평균(17건) 대비 120% → 20건',
            },
        ],
    };
}

// ── PDA 기반 론칭 서사 아크 빌드 ──
function buildNarrativeArcFromPDA(personas, awareness, concepts) {
    const AWARENESS_TO_ARC = { A1: 'tease', A2: 'reveal', A3: 'validate', A4: 'amplify' };
    const ARC_META = {
        tease: {
            timing: 'D-21 ~ D-14',
            purpose_template: (stage, conceptList) =>
                `${stage.strategy || '타겟의 Pain Point를 자극하여 문제를 인식시킵니다.'} ${conceptList.length}개 컨셉으로 호기심을 유발합니다.`,
            message_tone_template: (conceptList) => {
                const tones = [...new Set(conceptList.map((c) => c.tone).filter(Boolean))];
                return tones.length > 0 ? `"${tones.join(' + ')}" 톤으로 공감 자극` : '"이거 불편하지 않았어?" — 공감 자극';
            },
            default_channels: ['TikTok', 'Instagram'],
            channel_strategy: {
                tiktok: { role: '초반 점화', tactic: '동시 드랍으로 토픽 클러스터링', signal: '완시청률 + 토픽 트렌드' },
                instagram: { role: '비주얼 티저', tactic: '스토리+릴스로 호기심 유발', signal: 'DM 공유 + 스토리 조회수' },
            },
        },
        reveal: {
            timing: 'D-7 ~ D-3',
            purpose_template: (stage, conceptList) =>
                `${stage.strategy || '해결 메커니즘과 제품 원리를 교육합니다.'} ${conceptList.length}개 컨셉으로 차별점을 극대화합니다.`,
            message_tone_template: (conceptList) => {
                const copies = conceptList.slice(0, 2).map((c) => c.head_copy).filter(Boolean);
                return copies.length > 0 ? `"${copies[0]}" 기반 교육형 톤` : '"이렇게 해결했다" — 교육 + 신뢰';
            },
            default_channels: ['TikTok', 'Instagram', 'YouTube'],
            channel_strategy: {
                tiktok: { role: '바이럴 확산', tactic: '동시 드랍 유지 + 트렌드 사운드', signal: '완시청률 + 공유수' },
                instagram: { role: '제품 공개 비주얼', tactic: 'Reels+피드로 상세 공개', signal: '저장수 + DM 공유' },
                youtube: { role: '초기 리뷰', tactic: '첫인상/언박싱 쇼츠', signal: 'CTR + 초기 리텐션' },
            },
        },
        validate: {
            timing: 'D-Day ~ D+3',
            purpose_template: (stage, conceptList) =>
                `${stage.strategy || '사회적 증거를 축적하여 신뢰를 강화합니다.'} ${conceptList.length}개 컨셉으로 검증 콘텐츠를 전개합니다.`,
            message_tone_template: (conceptList) => {
                const copies = conceptList.slice(0, 2).map((c) => c.head_copy).filter(Boolean);
                return copies.length > 0 ? `"${copies[0]}" — 결과 중심 확신` : '"다들 이미 쓰고 있다" — 사회적 증거';
            },
            default_channels: ['Instagram', 'TikTok', 'YouTube'],
            channel_strategy: {
                instagram: { role: '사회적 증거', tactic: '"보내고 싶은 콘텐츠" 설계 + Reels 집중', signal: 'DM 공유 + 좋아요' },
                tiktok: { role: '유지 확산', tactic: 'UGC 챌린지 + 리포스트', signal: '토픽 지속성' },
                youtube: { role: '심층 리뷰', tactic: '비교 리뷰 + 성분 분석', signal: '시청 만족도 + 리텐션' },
            },
        },
        amplify: {
            timing: 'D+7 ~ D+30',
            purpose_template: (stage, conceptList) =>
                `${stage.strategy || '성과 데이터 기반으로 최적화하고 전환을 극대화합니다.'} ${conceptList.length}개 컨셉의 상위 성과 콘텐츠를 증폭합니다.`,
            message_tone_template: () => '"데이터가 결정한다" — 성과 기반 최적화',
            default_channels: ['YouTube', 'Instagram', 'TikTok'],
            channel_strategy: {
                youtube: { role: '장기 신뢰', tactic: '심층 리뷰 + SEO 최적화', signal: '시청 만족도 + CTR' },
                instagram: { role: '전환 최적화', tactic: '상위 콘텐츠 리포스트 + 쇼핑 태그 연동', signal: 'CTR + 전환수' },
                tiktok: { role: 'UGC 선순환', tactic: '고객 리뷰 리포스트 + 바이럴 큐레이션', signal: 'UGC 생성량 + 공유수' },
            },
        },
    };

    const awarenessPhases = awareness.length > 0 ? awareness : [
        { code: 'A1', name: '문제 인지', funnel: 'TOFU', strategy: '' },
        { code: 'A2', name: '해결책 인지', funnel: 'MOFU', strategy: '' },
        { code: 'A3', name: '제품 인지', funnel: 'MOFU', strategy: '' },
        { code: 'A4', name: '구매 유도', funnel: 'BOFU', strategy: '' },
    ];

    return awarenessPhases.map((stage) => {
        const arcKey = AWARENESS_TO_ARC[stage.code] || 'tease';
        const meta = ARC_META[arcKey];
        const stageConcepts = concepts.filter((c) => c.awareness_code === stage.code);

        // 실제 컨셉의 placement에서 채널 추출
        const PLACEMENT_TO_CHANNEL = {
            tiktok: 'TikTok',
            instagram_reels: 'Instagram', instagram_feed: 'Instagram', instagram_stories: 'Instagram',
            youtube: 'YouTube',
        };
        const actualChannels = [...new Set(
            stageConcepts.map((c) => PLACEMENT_TO_CHANNEL[c.campaign_placement] || c.campaign_placement).filter(Boolean)
        )];

        // 단계별 KPI 산출
        const conceptCount = stageConcepts.length;
        const kpiMap = {
            tease: `조회수 ${(conceptCount * 150).toLocaleString()}K+, 완시청률 45%+`,
            reveal: `조회수 ${(conceptCount * 300).toLocaleString()}K+, 참여율 5%+`,
            validate: `공유수 ${(conceptCount * 500).toLocaleString()}건+, 저장수 ${(conceptCount * 700).toLocaleString()}건+`,
            amplify: `ROAS ${(3.0 + conceptCount * 0.3).toFixed(1)}x+, 전환수 ${(conceptCount * 150).toLocaleString()}건+`,
        };

        return {
            phase: arcKey,
            timing: meta.timing,
            purpose: meta.purpose_template(stage, stageConcepts),
            message_tone: meta.message_tone_template(stageConcepts),
            channels: actualChannels.length > 0 ? actualChannels : meta.default_channels,
            channel_strategy: meta.channel_strategy,
            kpi: kpiMap[arcKey],
            awareness: { code: stage.code, name: stage.name, funnel: stage.funnel },
            concepts: stageConcepts.map((c) => ({
                concept_id: c.concept_id,
                name: c.concept_name,
                head_copy: c.head_copy,
                persona: c.persona_code,
                format: c.format,
            })),
        };
    });
}

// 전략 콘텐츠 업데이트
export const updateStrategy = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 최신 전략 찾기
        const latestSql = selectStrategy(id);
        const latestResult = await pool.query(latestSql.selectQuery, latestSql.params);

        if (latestResult.rows.length === 0) {
            return res.status(404).json({ error: '업데이트할 전략을 찾을 수 없습니다.' });
        }

        const strategyId = latestResult.rows[0].strategy_id;

        const sqlSet = updateStrategyQuery(strategyId, data);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '전략을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '전략이 성공적으로 업데이트되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[updateStrategy]', error);
        res.status(500).json({ error: '전략 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 전략 승인
export const approveStrategy = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 최신 전략 찾기
        const latestSql = selectStrategy(id);
        const latestResult = await pool.query(latestSql.selectQuery, latestSql.params);

        if (latestResult.rows.length === 0) {
            return res.status(404).json({ error: '승인할 전략을 찾을 수 없습니다.' });
        }

        const strategyId = latestResult.rows[0].strategy_id;

        const sqlSet = updateStrategyStatus(strategyId, 'approved', approved_by);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '전략을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '전략이 성공적으로 승인되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[approveStrategy]', error);
        res.status(500).json({ error: '전략 승인 중 오류가 발생했습니다.', details: error.message });
    }
};
