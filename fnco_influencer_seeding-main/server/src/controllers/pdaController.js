import { pool } from '../config/database.js';
import { selectPDAFull, selectPersonas, selectDesires, selectAwareness } from '../sql/pda/selectQuery.js';
import { insertBulkPersonas, insertBulkDesires, insertBulkAwareness, insertBulkConcepts } from '../sql/pda/insertQuery.js';
import { deleteAllPDA } from '../sql/pda/deleteQuery.js';
import {
    isGeminiAvailable,
    generatePersonas as geminiPersonas,
    generateDesires as geminiDesires,
    generateAwareness as geminiAwareness,
    generateConceptsAI,
    analyzeProduct,
} from '../services/geminiService.js';

// ── 캠페인 정보 조회 헬퍼 ──
async function getCampaignInfo(campaignId) {
    const result = await pool.query(
        `SELECT * FROM fnco_influencer.mst_campaign WHERE campaign_id = $1`,
        [campaignId],
    );
    return result.rows[0] || {};
}

// ── 마스터 PDA 데이터 조회 헬퍼 ──
async function getMasterPDA() {
    const [p, d, a] = await Promise.all([
        pool.query(`SELECT * FROM fnco_influencer.mst_persona WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`),
        pool.query(`SELECT * FROM fnco_influencer.mst_desire WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`),
        pool.query(`SELECT * FROM fnco_influencer.mst_awareness WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`),
    ]);
    return { personas: p.rows, desires: d.rows, awareness: a.rows };
}

// P.D.A. 매트릭스 전체 조회
export const getPDA = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const queries = selectPDAFull(id);

        const [personaResult, desireResult, awarenessResult, conceptResult] = await Promise.all([
            pool.query(queries.personaQuery.selectQuery, queries.personaQuery.params),
            pool.query(queries.desireQuery.selectQuery, queries.desireQuery.params),
            pool.query(queries.awarenessQuery.selectQuery, queries.awarenessQuery.params),
            pool.query(queries.conceptQuery.selectQuery, queries.conceptQuery.params),
        ]);

        res.json({
            success: true,
            data: {
                personas: personaResult.rows,
                desires: desireResult.rows,
                awareness: awarenessResult.rows,
                concepts: conceptResult.rows,
            },
        });
    } catch (error) {
        console.error('[getPDA]', error);
        res.status(500).json({ error: 'P.D.A. 매트릭스 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
//  P.D.A. AI 생성 — Gemini 연동 (fallback: MOCK)
// ═══════════════════════════════════════════════════════════
export const generatePDA = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 기존 P.D.A. 데이터 삭제
        const deleteQueries = deleteAllPDA(id);
        await pool.query(deleteQueries.deleteConceptsQuery.deleteQuery, deleteQueries.deleteConceptsQuery.params);
        await pool.query(deleteQueries.deleteAwarenessQuery.deleteQuery, deleteQueries.deleteAwarenessQuery.params);
        await pool.query(deleteQueries.deleteDesiresQuery.deleteQuery, deleteQueries.deleteDesiresQuery.params);
        await pool.query(deleteQueries.deletePersonasQuery.deleteQuery, deleteQueries.deletePersonasQuery.params);

        let personas, desires, awareness;

        if (isGeminiAvailable()) {
            // ── Gemini AI 생성 ──
            console.log('[generatePDA] Gemini AI로 P.D.A. 생성 중...');
            const campaign = await getCampaignInfo(id);

            // 제품 파일 경로 추출 (brand_dna JSONB 내 product_file_path)
            const productFilePath = campaign.brand_dna?.product_file_path || null;
            if (productFilePath) console.log('[generatePDA] 제품 파일 포함:', productFilePath);

            // 마스터 PDA 데이터 조회 (Gemini 프롬프트에 주입)
            const masterPDA = await getMasterPDA();
            console.log('[generatePDA] 마스터 PDA 로드 — P:', masterPDA.personas.length, 'D:', masterPDA.desires.length, 'A:', masterPDA.awareness.length);

            // STEP 0: 제품 분석 (첨부 기획안 기반 — 결과를 brand_dna.product_analysis에 저장)
            try {
                const analysisResult = await analyzeProduct(campaign, productFilePath, masterPDA);
                console.log('[generatePDA] STEP 0 완료 — 제품 분석 결과 저장');
                // analysis 결과를 brand_dna에 병합 저장
                const updatedBrandDna = { ...(campaign.brand_dna || {}), product_analysis: analysisResult?.analysis || analysisResult };
                await pool.query(
                    `UPDATE fnco_influencer.mst_campaign SET brand_dna = $1, updated_at = NOW() WHERE campaign_id = $2`,
                    [JSON.stringify(updatedBrandDna), id],
                );
                // campaign 객체도 갱신 (이후 프롬프트에 반영)
                campaign.brand_dna = updatedBrandDna;
            } catch (analysisErr) {
                console.warn('[generatePDA] 제품 분석 실패 (PDA 생성은 계속 진행):', analysisErr.message);
            }

            // STEP 1-A: 핵심 페르소나 선정 (제품 USP × 마스터 풀 핏 기반)
            personas = await geminiPersonas(campaign, productFilePath, masterPDA);
            console.log('[generatePDA] STEP 1-A 완료 — 페르소나', personas.length, '개');

            // STEP 1-B: 핵심 욕구 도출 (선정된 페르소나 + 고객 Pain Point 기반)
            desires = await geminiDesires(campaign, personas, productFilePath, masterPDA);
            console.log('[generatePDA] STEP 1-B 완료 — 욕구', desires.length, '개');

            // 4단계 인지 여정 설정 (선정된 페르소나/욕구 참조)
            awareness = await geminiAwareness(campaign, productFilePath, masterPDA, personas, desires);
            console.log('[generatePDA] Gemini 생성 완료 — P:', personas.length, 'D:', desires.length, 'A:', awareness.length);
        } else {
            // ── MOCK 데이터 (Gemini 미설정 시) ──
            console.log('[generatePDA] MOCK 데이터로 P.D.A. 생성');
            personas = getMockPersonas();
            desires = getMockDesires();
            awareness = getMockAwareness();
        }

        // 데이터 삽입
        const personaSql = insertBulkPersonas(id, personas);
        const personaResult = await pool.query(personaSql.insertQuery, personaSql.params);

        const desireSql = insertBulkDesires(id, desires);
        const desireResult = await pool.query(desireSql.insertQuery, desireSql.params);

        const awarenessSql = insertBulkAwareness(id, awareness);
        const awarenessResult = await pool.query(awarenessSql.insertQuery, awarenessSql.params);

        // ── STEP 2: 컨셉 자동 생성 (P×D×A 매트릭스 기반 12개) ──
        let conceptResult = { rows: [] };
        try {
            const insertedPersonas = personaResult.rows;
            const insertedDesires = desireResult.rows;
            const insertedAwareness = awarenessResult.rows;

            let conceptsToInsert;

            if (isGeminiAvailable()) {
                console.log('[generatePDA] STEP 2 — Gemini AI로 컨셉 생성 중...');
                const campaign2 = await getCampaignInfo(id); // 갱신된 brand_dna 반영
                const productFilePath2 = campaign2.brand_dna?.product_file_path || null;
                const aiConcepts = await generateConceptsAI(campaign2, insertedPersonas, insertedDesires, insertedAwareness, productFilePath2);

                // code → id 매핑
                const pMap = Object.fromEntries(insertedPersonas.map((p) => [p.code, p.persona_id]));
                const dMap = Object.fromEntries(insertedDesires.map((d) => [d.code, d.desire_id]));
                const aMap = Object.fromEntries(insertedAwareness.map((a) => [a.code, a.awareness_id]));

                conceptsToInsert = aiConcepts.map((c, idx) => ({
                    persona_id: pMap[c.persona_code] || insertedPersonas[0].persona_id,
                    desire_id: dMap[c.desire_code] || insertedDesires[0].desire_id,
                    awareness_id: aMap[c.awareness_code] || insertedAwareness[0].awareness_id,
                    concept_name: c.concept_name,
                    head_copy: c.head_copy,
                    copy_type: c.copy_type,
                    tone: c.tone,
                    format: c.format,
                    funnel: c.funnel,
                    campaign_placement: c.placement,
                    sort_order: c.sort_order || idx + 1,
                }));
            } else {
                conceptsToInsert = getMockConcepts(insertedPersonas, insertedDesires, insertedAwareness);
            }

            if (conceptsToInsert.length > 0) {
                const conceptSql = insertBulkConcepts(id, conceptsToInsert);
                conceptResult = await pool.query(conceptSql.insertQuery, conceptSql.params);
                console.log('[generatePDA] STEP 2 완료 — 컨셉', conceptResult.rows.length, '개 생성');
            }
        } catch (conceptErr) {
            console.warn('[generatePDA] 컨셉 자동 생성 실패 (PDA 결과는 유효):', conceptErr.message);
        }

        res.status(201).json({
            success: true,
            message: isGeminiAvailable()
                ? 'Gemini AI로 P.D.A. 매트릭스 및 컨셉이 생성되었습니다.'
                : 'P.D.A. 매트릭스 및 컨셉이 생성되었습니다. (MOCK — .env에 GEMINI_API_KEY를 설정하면 AI가 활성화됩니다)',
            source: isGeminiAvailable() ? 'gemini' : 'mock',
            data: {
                personas: personaResult.rows,
                desires: desireResult.rows,
                awareness: awarenessResult.rows,
                concepts: conceptResult.rows,
            },
        });
    } catch (error) {
        console.error('[generatePDA]', error);
        res.status(500).json({ error: 'P.D.A. 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
//  컨셉 AI 생성 — Gemini 연동 (fallback: MOCK)
// ═══════════════════════════════════════════════════════════
export const generateConcepts = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 기존 P.D.A. 데이터 조회
        const personaSql = selectPersonas(id);
        const desireSql = selectDesires(id);
        const awarenessSql = selectAwareness(id);

        const [personaResult, desireResult, awarenessResult] = await Promise.all([
            pool.query(personaSql.selectQuery, personaSql.params),
            pool.query(desireSql.selectQuery, desireSql.params),
            pool.query(awarenessSql.selectQuery, awarenessSql.params),
        ]);

        if (personaResult.rows.length === 0 || desireResult.rows.length === 0 || awarenessResult.rows.length === 0) {
            return res.status(400).json({ error: '컨셉 생성을 위한 P.D.A. 데이터가 부족합니다. 먼저 P.D.A. 매트릭스를 생성해주세요.' });
        }

        const personas = personaResult.rows;
        const desires = desireResult.rows;
        const awareness = awarenessResult.rows;

        // 기존 컨셉 삭제
        const deleteQueries = deleteAllPDA(id);
        await pool.query(deleteQueries.deleteConceptsQuery.deleteQuery, deleteQueries.deleteConceptsQuery.params);

        let concepts;

        if (isGeminiAvailable()) {
            // ── Gemini AI 컨셉 생성 ──
            console.log('[generateConcepts] Gemini AI로 컨셉 생성 중...');
            const campaign = await getCampaignInfo(id);
            const productFilePath = campaign.brand_dna?.product_file_path || null;
            const aiConcepts = await generateConceptsAI(campaign, personas, desires, awareness, productFilePath);

            // code → id 매핑
            const pMap = Object.fromEntries(personas.map((p) => [p.code, p.persona_id]));
            const dMap = Object.fromEntries(desires.map((d) => [d.code, d.desire_id]));
            const aMap = Object.fromEntries(awareness.map((a) => [a.code, a.awareness_id]));

            concepts = aiConcepts.map((c, idx) => ({
                persona_id: pMap[c.persona_code] || personas[0].persona_id,
                desire_id: dMap[c.desire_code] || desires[0].desire_id,
                awareness_id: aMap[c.awareness_code] || awareness[0].awareness_id,
                concept_name: c.concept_name,
                head_copy: c.head_copy,
                copy_type: c.copy_type,
                tone: c.tone,
                format: c.format,
                funnel: c.funnel,
                campaign_placement: c.placement,
                sort_order: c.sort_order || idx + 1,
            }));
            console.log('[generateConcepts] Gemini 생성 완료 —', concepts.length, '개 컨셉');
        } else {
            // ── MOCK 컨셉 ──
            console.log('[generateConcepts] MOCK 데이터로 컨셉 생성');
            concepts = getMockConcepts(personas, desires, awareness);
        }

        const sqlSet = insertBulkConcepts(id, concepts);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.status(201).json({
            success: true,
            message: isGeminiAvailable()
                ? 'Gemini AI로 컨셉이 생성되었습니다.'
                : '컨셉이 생성되었습니다. (MOCK)',
            source: isGeminiAvailable() ? 'gemini' : 'mock',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[generateConcepts]', error);
        res.status(500).json({ error: '컨셉 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
//  제품 분석 단독 실행 (PDA 재생성 없이)
// ═══════════════════════════════════════════════════════════
export const runProductAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'campaign_id가 필요합니다.' });

        if (!isGeminiAvailable()) {
            return res.status(400).json({ error: 'Gemini API가 설정되지 않았습니다. .env에 GEMINI_API_KEY를 설정하세요.' });
        }

        const campaign = await getCampaignInfo(id);
        const productFilePath = campaign.brand_dna?.product_file_path || null;

        if (!productFilePath) {
            return res.status(400).json({ error: '첨부된 제품 기획안이 없습니다. 제품 파일을 먼저 업로드하세요.' });
        }

        const masterPDA = await getMasterPDA();
        const analysisResult = await analyzeProduct(campaign, productFilePath, masterPDA);

        // brand_dna에 product_analysis 저장
        const updatedBrandDna = { ...(campaign.brand_dna || {}), product_analysis: analysisResult?.analysis || analysisResult };
        await pool.query(
            `UPDATE fnco_influencer.mst_campaign SET brand_dna = $1, updated_at = NOW() WHERE campaign_id = $2`,
            [JSON.stringify(updatedBrandDna), id],
        );

        res.json({
            success: true,
            message: '제품 분석이 완료되었습니다.',
            data: analysisResult?.analysis || analysisResult,
        });
    } catch (error) {
        console.error('[runProductAnalysis]', error);
        res.status(500).json({ error: '제품 분석 중 오류가 발생했습니다.', details: error.message });
    }
};

// 페르소나 일괄 업데이트 (삭제 후 재삽입)
export const updatePersonas = async (req, res) => {
    try {
        const { id } = req.params;
        const { personas } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        if (!personas || !Array.isArray(personas) || personas.length === 0) {
            return res.status(400).json({ error: '페르소나 배열이 필요합니다.' });
        }

        // 기존 페르소나 삭제 (관련 컨셉 먼저 삭제)
        const deleteQueries = deleteAllPDA(id);
        await pool.query(deleteQueries.deleteConceptsQuery.deleteQuery, deleteQueries.deleteConceptsQuery.params);
        await pool.query(deleteQueries.deletePersonasQuery.deleteQuery, deleteQueries.deletePersonasQuery.params);

        // 새 페르소나 삽입
        const sqlSet = insertBulkPersonas(id, personas);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.json({
            success: true,
            message: '페르소나가 성공적으로 업데이트되었습니다.',
            data: result.rows,
        });
    } catch (error) {
        console.error('[updatePersonas]', error);
        res.status(500).json({ error: '페르소나 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 욕구 일괄 업데이트 (삭제 후 재삽입)
export const updateDesires = async (req, res) => {
    try {
        const { id } = req.params;
        const { desires } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        if (!desires || !Array.isArray(desires) || desires.length === 0) {
            return res.status(400).json({ error: '욕구 배열이 필요합니다.' });
        }

        // 기존 욕구 삭제 (관련 컨셉 먼저 삭제)
        const deleteQueries = deleteAllPDA(id);
        await pool.query(deleteQueries.deleteConceptsQuery.deleteQuery, deleteQueries.deleteConceptsQuery.params);
        await pool.query(deleteQueries.deleteDesiresQuery.deleteQuery, deleteQueries.deleteDesiresQuery.params);

        // 새 욕구 삽입
        const sqlSet = insertBulkDesires(id, desires);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.json({
            success: true,
            message: '욕구가 성공적으로 업데이트되었습니다.',
            data: result.rows,
        });
    } catch (error) {
        console.error('[updateDesires]', error);
        res.status(500).json({ error: '욕구 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 컨셉 상태 일괄 업데이트 (confirmed / draft)
export const updateConceptStatuses = async (req, res) => {
    try {
        const { id } = req.params;
        const { concept_ids, status } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        if (!concept_ids || !Array.isArray(concept_ids) || concept_ids.length === 0) {
            return res.status(400).json({ error: 'concept_ids 배열이 필요합니다.' });
        }

        const validStatuses = ['draft', 'confirmed', 'planned', 'in_progress', 'completed'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `유효한 상태값이 필요합니다: ${validStatuses.join(', ')}` });
        }

        // 해당 캠페인의 컨셉만 업데이트
        const placeholders = concept_ids.map((_, i) => `$${i + 3}`).join(', ');
        const result = await pool.query(
            `UPDATE mst_pda_concept
             SET status = $1, updated_at = NOW()
             WHERE campaign_id = $2 AND concept_id IN (${placeholders})
             RETURNING *`,
            [status, id, ...concept_ids]
        );

        res.json({
            success: true,
            message: `${result.rowCount}개 컨셉 상태가 '${status}'(으)로 업데이트되었습니다.`,
            data: result.rows,
        });
    } catch (error) {
        console.error('[updateConceptStatuses]', error);
        res.status(500).json({ error: '컨셉 상태 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 컨셉 일괄 업데이트 (삭제 후 재삽입)
export const updateConcepts = async (req, res) => {
    try {
        const { id } = req.params;
        const { concepts } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
            return res.status(400).json({ error: '컨셉 배열이 필요합니다.' });
        }

        // 기존 컨셉 삭제
        const deleteQueries = deleteAllPDA(id);
        await pool.query(deleteQueries.deleteConceptsQuery.deleteQuery, deleteQueries.deleteConceptsQuery.params);

        // 새 컨셉 삽입
        const sqlSet = insertBulkConcepts(id, concepts);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.json({
            success: true,
            message: '컨셉이 성공적으로 업데이트되었습니다.',
            data: result.rows,
        });
    } catch (error) {
        console.error('[updateConcepts]', error);
        res.status(500).json({ error: '컨셉 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
//  MOCK 데이터 (Gemini 미설정 시 fallback)
// ═══════════════════════════════════════════════════════════
function getMockPersonas() {
    return [
        {
            code: 'P1', name: '트렌드 세터 지은', name_eng: 'Trend Setter Ji-eun', name_cn: '潮流引领者智恩',
            profile_json: {
                age: '25-34', gender: '여성', occupation: '마케팅/크리에이티브 직군',
                interests: ['뷰티', '패션', 'K-컬처'],
                pain_points: ['피부 트러블', '시간 부족', '제품 선택 고민'],
                media_usage: ['인스타그램', '유튜브', '틱톡'],
                purchase_behavior: '리뷰 확인 후 구매, SNS 영향력 높음',
            },
            sort_order: 1,
        },
        {
            code: 'P2', name: '실용주의 수현', name_eng: 'Pragmatic Su-hyeon', name_cn: '务实派秀贤',
            profile_json: {
                age: '30-39', gender: '여성', occupation: '전문직/사무직',
                interests: ['셀프케어', '건강', '효율'],
                pain_points: ['바쁜 일상', '가성비 고민', '성분 민감'],
                media_usage: ['네이버 블로그', '유튜브', '카카오톡'],
                purchase_behavior: '성분 비교 후 구매, 재구매율 높음',
            },
            sort_order: 2,
        },
        {
            code: 'P3', name: '글로벌 뷰티러버 하나', name_eng: 'Global Beauty Lover Hana', name_cn: '全球美妆爱好者花',
            profile_json: {
                age: '20-29', gender: '여성', occupation: '대학생/사회초년생',
                interests: ['K-뷰티', '글로벌 트렌드', '비건'],
                pain_points: ['예산 제한', '정보 과부하', '신제품 탐색'],
                media_usage: ['틱톡', '인스타그램', '레딧'],
                purchase_behavior: '틱톡 바이럴 영향, 충동구매 경향',
            },
            sort_order: 3,
        },
    ];
}

function getMockDesires() {
    return [
        { code: 'D1', name: '자기표현 욕구', name_eng: 'Self-Expression Desire', name_cn: '自我表达欲望', definition: '나만의 스타일과 개성을 뷰티를 통해 표현하고 싶은 욕구', emotion_trigger: '자신감, 독창성, 인정받고 싶은 마음', linked_products: '립 제품, 컬러 메이크업, 스킨케어 루틴', sort_order: 1 },
        { code: 'D2', name: '효율적 케어 욕구', name_eng: 'Efficient Care Desire', name_cn: '高效护理欲望', definition: '최소한의 시간과 노력으로 최대의 피부 케어 효과를 얻고 싶은 욕구', emotion_trigger: '편안함, 시간 절약, 합리적 선택', linked_products: '올인원 제품, 클렌징 밤, 멀티 기능 제품', sort_order: 2 },
        { code: 'D3', name: '안전한 성분 욕구', name_eng: 'Clean Ingredients Desire', name_cn: '安全成分欲望', definition: '피부에 안전하고 신뢰할 수 있는 성분의 제품을 사용하고 싶은 욕구', emotion_trigger: '안전감, 신뢰, 건강한 피부에 대한 기대', linked_products: '더마 라인, 저자극 제품, 비건 인증 제품', sort_order: 3 },
    ];
}

function getMockAwareness() {
    return [
        { code: 'A1', name: '문제 인지', name_eng: 'Problem Aware', name_cn: '问题认知', strategy: '현상 자체에 불만이 있는 상태 — Pain Point를 자극하여 공감 유도', funnel: 'TOFU', tone: '공감형, 문제 제기 톤', sort_order: 1 },
        { code: 'A2', name: '해결책 인지', name_eng: 'Solution Aware', name_cn: '方案认知', strategy: '해결할 방법론을 찾는 상태 — 원리 및 솔루션 제시로 교육', funnel: 'MOFU', tone: '교육적, 전문적 톤', sort_order: 2 },
        { code: 'A3', name: '제품 인지', name_eng: 'Product Aware', name_cn: '产品认知', strategy: '해당 제품의 차별점을 검증하는 상태 — 스펙, 임상 데이터, 성분 증명', funnel: 'MOFU', tone: '신뢰감, 데이터 기반 톤', sort_order: 3 },
        { code: 'A4', name: '구매 유도', name_eng: 'Most Aware', name_cn: '购买驱动', strategy: '구매 명분과 확신이 필요한 상태 — 대세감, 베스트셀러, 크로스셀링 제안', funnel: 'BOFU', tone: '설득적, 긴급감 있는 톤', sort_order: 4 },
    ];
}

function getMockConcepts(personas, desires, awareness) {
    const conceptTemplates = [
        { pIdx: 0, dIdx: 0, aIdx: 0, name: '나만의 뷰티 시그니처', headCopy: '당신만의 색을 찾아보세요', copyType: 'hook', tone: '영감을 주는', format: 'short_video', funnel: 'TOFU', placement: 'instagram_reels' },
        { pIdx: 0, dIdx: 0, aIdx: 1, name: '피부 고민, 이제 그만', headCopy: '매일 아침 거울 앞에서 한숨 쉬셨나요?', copyType: 'empathy', tone: '공감형', format: 'carousel', funnel: 'TOFU', placement: 'instagram_feed' },
        { pIdx: 0, dIdx: 0, aIdx: 2, name: '프로의 선택', headCopy: '뷰티 에디터가 직접 선택한 이유', copyType: 'authority', tone: '전문적', format: 'long_video', funnel: 'MOFU', placement: 'youtube' },
        { pIdx: 0, dIdx: 1, aIdx: 2, name: '5분 완성 글로우', headCopy: '바쁜 아침, 5분이면 충분해요', copyType: 'solution', tone: '실용적', format: 'short_video', funnel: 'MOFU', placement: 'tiktok' },
        { pIdx: 1, dIdx: 1, aIdx: 1, name: '올인원의 진실', headCopy: '멀티 스텝이 정말 필요할까요?', copyType: 'myth_breaking', tone: '논리적', format: 'blog_post', funnel: 'TOFU', placement: 'naver_blog' },
        { pIdx: 1, dIdx: 1, aIdx: 2, name: '성분 비교 리포트', headCopy: '성분표 하나로 알 수 있는 것들', copyType: 'education', tone: '교육적', format: 'infographic', funnel: 'MOFU', placement: 'instagram_feed' },
        { pIdx: 1, dIdx: 1, aIdx: 3, name: '리얼 후기 총정리', headCopy: '30일 사용기, 숫자로 말합니다', copyType: 'social_proof', tone: '데이터 기반', format: 'carousel', funnel: 'BOFU', placement: 'instagram_feed' },
        { pIdx: 1, dIdx: 2, aIdx: 2, name: '더마 인증의 의미', headCopy: '피부과 전문의가 추천하는 기준', copyType: 'authority', tone: '신뢰감', format: 'long_video', funnel: 'MOFU', placement: 'youtube' },
        { pIdx: 2, dIdx: 0, aIdx: 0, name: 'K-뷰티 글로벌 트렌드', headCopy: 'TikTok에서 난리난 그 제품', copyType: 'trend', tone: '바이럴', format: 'short_video', funnel: 'TOFU', placement: 'tiktok' },
        { pIdx: 2, dIdx: 0, aIdx: 3, name: '지금 아니면 없어요', headCopy: '한정 기획세트, 오늘 마감', copyType: 'urgency', tone: '긴급감', format: 'story', funnel: 'BOFU', placement: 'instagram_stories' },
        { pIdx: 2, dIdx: 2, aIdx: 1, name: '비건 뷰티의 새로운 기준', headCopy: '동물실험 NO, 성분도 착하게', copyType: 'value', tone: '가치 중심', format: 'short_video', funnel: 'TOFU', placement: 'tiktok' },
        { pIdx: 2, dIdx: 2, aIdx: 3, name: '글로벌 뷰티 어워드 수상', headCopy: '전 세계가 인정한 K-뷰티', copyType: 'social_proof', tone: '권위적', format: 'carousel', funnel: 'BOFU', placement: 'instagram_feed' },
    ];

    return conceptTemplates.map((t, idx) => ({
        persona_id: personas[t.pIdx]?.persona_id,
        desire_id: desires[t.dIdx]?.desire_id,
        awareness_id: awareness[t.aIdx]?.awareness_id,
        concept_name: t.name,
        head_copy: t.headCopy,
        copy_type: t.copyType,
        tone: t.tone,
        format: t.format,
        funnel: t.funnel,
        campaign_placement: t.placement,
        sort_order: idx + 1,
    }));
}
