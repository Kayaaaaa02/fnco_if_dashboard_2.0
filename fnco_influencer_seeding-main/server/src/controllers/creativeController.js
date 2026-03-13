import { pool } from '../config/database.js';
import { selectCreatives, selectCreativeById } from '../sql/creative/selectQuery.js';
import { insertCreative, insertBulkCreatives } from '../sql/creative/insertQuery.js';
import { updateCreative as updateCreativeQuery, updateCreativeImages } from '../sql/creative/updateQuery.js';
import { getModel, isGeminiAvailable } from '../config/gemini.js';
import { buildProductionGuidePrompt } from '../config/guidePrompts.js';

// 캠페인별 크리에이티브 목록 조회
export const getCreatives = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectCreatives(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getCreatives]', error);
        res.status(500).json({ error: '크리에이티브 목록 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 크리에이티브 단건 조회
export const getCreativeById = async (req, res) => {
    try {
        const { cId } = req.params;

        if (!cId) {
            return res.status(400).json({ error: 'creative_id가 필요합니다.' });
        }

        const sqlSet = selectCreativeById(cId);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[getCreativeById]', error);
        res.status(500).json({ error: '크리에이티브 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// MOCK AI 크리에이티브 생성 — 캠페인의 확정 컨셉별 1개씩 생성
export const generateCreatives = async (req, res) => {
    try {
        const { id } = req.params;
        const { conceptIds } = req.body || {};

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 캠페인의 컨셉 목록 조회
        const conceptResult = await pool.query(
            `SELECT
                c.concept_id,
                c.concept_name,
                c.head_copy,
                c.copy_type,
                c.tone,
                c.format,
                c.funnel,
                c.campaign_placement,
                p.name AS persona_name,
                p.code AS persona_code,
                d.name AS desire_name,
                d.code AS desire_code,
                a.name AS awareness_name,
                a.code AS awareness_code,
                a.tone AS awareness_tone
            FROM mst_pda_concept c
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE c.campaign_id = $1
            ORDER BY c.sort_order ASC`,
            [id]
        );

        if (conceptResult.rows.length === 0) {
            return res.status(404).json({ error: '캠페인에 등록된 컨셉이 없습니다. P.D.A. 매트릭스를 먼저 생성해주세요.' });
        }

        // 확정된 컨셉 ID가 전달되면 해당 컨셉만 필터링
        let concepts = conceptResult.rows;
        if (Array.isArray(conceptIds) && conceptIds.length > 0) {
            const idSet = new Set(conceptIds.map(String));
            concepts = concepts.filter((c) => idSet.has(String(c.concept_id)));
            if (concepts.length === 0) {
                return res.status(400).json({ error: '전달된 컨셉 ID에 해당하는 컨셉이 없습니다.' });
            }
            console.log(`[generateCreatives] 확정 컨셉 ${concepts.length}/${conceptResult.rows.length}개로 필터링`);
        }
        const creatives = concepts.map((concept) => {
            const copyText = generateMockCopyText(concept);
            const copyVariants = generateMockCopyVariants(concept);
            const scenario = generateMockScenario(concept);

            return {
                concept_id: concept.concept_id,
                calendar_id: null,
                copy_text: copyText,
                copy_variants: copyVariants,
                scenario: scenario,
                ai_images: null,
                status: 'ai_generated',
                created_by: 'ai_system',
            };
        });

        const sqlSet = insertBulkCreatives(id, creatives);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.status(201).json({
            success: true,
            message: `${result.rows.length}개의 크리에이티브가 AI로 생성되었습니다.`,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[generateCreatives]', error);
        res.status(500).json({ error: '크리에이티브 AI 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 크리에이티브 업데이트
export const updateCreative = async (req, res) => {
    try {
        const { cId } = req.params;
        const data = req.body;

        if (!cId) {
            return res.status(400).json({ error: 'creative_id가 필요합니다.' });
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: '업데이트할 필드가 필요합니다.' });
        }

        const sqlSet = updateCreativeQuery(cId, data);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '크리에이티브가 성공적으로 업데이트되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[updateCreative]', error);
        res.status(500).json({ error: '크리에이티브 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// MOCK AI 이미지 생성 — 시나리오 스텝별 4장씩, 총 16장
export const generateImages = async (req, res) => {
    try {
        const { cId } = req.params;

        if (!cId) {
            return res.status(400).json({ error: 'creative_id가 필요합니다.' });
        }

        // 기존 크리에이티브 조회
        const sqlSet = selectCreativeById(cId);
        const creativeResult = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (creativeResult.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        const creative = creativeResult.rows[0];
        const scenario = creative.scenario || [];
        const styles = ['friendly', 'premium', 'natural', 'dramatic'];

        const aiImages = [];

        for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
            const step = scenario[stepIdx] || { step: stepIdx + 1, visual: '' };

            for (let imgIdx = 0; imgIdx < 4; imgIdx++) {
                const style = styles[imgIdx];
                const stepNum = step.step || stepIdx + 1;
                aiImages.push({
                    url: `https://placeholder.com/800x800?text=Step${stepNum}_Img${imgIdx + 1}_${style}`,
                    step: stepNum,
                    style: style,
                    is_selected: false,
                    prompt: `${creative.concept_name || 'Beauty'} concept, ${style} style, step ${stepNum}: ${step.visual || 'product showcase'}`,
                });
            }
        }

        // ai_images 업데이트
        const updateSqlSet = updateCreativeImages(cId, aiImages);
        const result = await pool.query(updateSqlSet.updateQuery, updateSqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: `${aiImages.length}개의 AI 이미지가 생성되었습니다.`,
            data: result.rows[0],
            image_count: aiImages.length,
        });
    } catch (error) {
        console.error('[generateImages]', error);
        res.status(500).json({ error: 'AI 이미지 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 이미지 선택 — selections 배열로 is_selected 마킹
export const selectImages = async (req, res) => {
    try {
        const { cId } = req.params;
        const { selections } = req.body;

        if (!cId) {
            return res.status(400).json({ error: 'creative_id가 필요합니다.' });
        }

        if (!selections || !Array.isArray(selections) || selections.length === 0) {
            return res.status(400).json({ error: 'selections 배열이 필요합니다. [{step: 1, imageIndex: 0}, ...]' });
        }

        // 기존 크리에이티브 조회
        const sqlSet = selectCreativeById(cId);
        const creativeResult = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (creativeResult.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        const creative = creativeResult.rows[0];
        const aiImages = creative.ai_images || [];

        if (aiImages.length === 0) {
            return res.status(400).json({ error: 'AI 이미지가 아직 생성되지 않았습니다. 먼저 이미지를 생성해주세요.' });
        }

        // 기존 선택 초기화
        const updatedImages = aiImages.map((img) => ({ ...img, is_selected: false }));

        // 새로운 선택 마킹
        for (const sel of selections) {
            const matchingImages = updatedImages.filter((img) => img.step === sel.step);
            if (matchingImages[sel.imageIndex] !== undefined) {
                matchingImages[sel.imageIndex].is_selected = true;
            }
        }

        // ai_images 업데이트
        const updateSqlSet = updateCreativeImages(cId, updatedImages);
        const result = await pool.query(updateSqlSet.updateQuery, updateSqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        const selectedCount = updatedImages.filter((img) => img.is_selected).length;

        res.json({
            success: true,
            message: `${selectedCount}개의 이미지가 선택되었습니다.`,
            data: result.rows[0],
            selected_count: selectedCount,
        });
    } catch (error) {
        console.error('[selectImages]', error);
        res.status(500).json({ error: '이미지 선택 중 오류가 발생했습니다.', details: error.message });
    }
};

// ── Gemini 기반 최종 기획안(Production Guide) 생성 ──
export const generateGuide = async (req, res) => {
    try {
        const { id, cId } = req.params;
        const { conceptId } = req.body || {};
        let creativeId = cId;

        // 폴백 카드(concept-XX 형태)이거나 conceptId가 전달된 경우: 크리에이티브 자동 생성
        if (conceptId && (String(cId).startsWith('concept-') || cId === 'auto')) {
            // 이미 해당 컨셉에 대한 크리에이티브가 있는지 확인
            const existing = await pool.query(
                `SELECT creative_id FROM dw_creative WHERE campaign_id = $1 AND concept_id = $2 LIMIT 1`,
                [id, conceptId]
            );
            if (existing.rows.length > 0) {
                creativeId = existing.rows[0].creative_id;
            } else {
                // 새 크리에이티브 레코드 생성 (draft)
                const ins = await pool.query(
                    `INSERT INTO dw_creative (campaign_id, concept_id, copy_text, status, created_by)
                     VALUES ($1, $2, '', 'draft', 'ai_guide')
                     RETURNING creative_id`,
                    [id, conceptId]
                );
                creativeId = ins.rows[0].creative_id;
                console.log(`[generateGuide] 새 크리에이티브 생성: ${creativeId} (concept: ${conceptId})`);
            }
        }

        // 크리에이티브 + 연결된 컨셉 정보 조회
        const creativeResult = await pool.query(
            `SELECT cr.*,
                    c.concept_name, c.head_copy, c.copy_type, c.tone, c.format,
                    c.funnel, c.campaign_placement,
                    p.name AS persona_name, p.code AS persona_code,
                    p.profile_json AS persona_profile,
                    d.name AS desire_name, d.code AS desire_code,
                    d.definition AS desire_definition,
                    a.name AS awareness_name, a.code AS awareness_code,
                    a.strategy AS awareness_strategy, a.tone AS awareness_tone
             FROM dw_creative cr
             LEFT JOIN mst_pda_concept c ON cr.concept_id = c.concept_id
             LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
             LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
             LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
             WHERE cr.creative_id = $1`,
            [creativeId]
        );

        if (creativeResult.rows.length === 0) {
            return res.status(404).json({ error: '크리에이티브를 찾을 수 없습니다.' });
        }

        const cr = creativeResult.rows[0];

        // 캠페인 정보 조회
        const campaignResult = await pool.query(
            `SELECT campaign_name, brand_cd, product_name, category, subcategory FROM mst_campaign WHERE campaign_id = $1`,
            [id]
        );
        const campaign = campaignResult.rows[0] || {};

        const guidePrompt = buildProductionGuidePrompt(cr, campaign);

        if (!isGeminiAvailable()) {
            // Gemini 미사용 시 MOCK 응답
            console.log('[generateGuide] Gemini unavailable, returning mock guide');
            const mockGuide = buildMockGuide(cr, campaign);
            // DB에 저장
            await pool.query(
                `UPDATE dw_creative SET production_guide = $1, updated_at = NOW() WHERE creative_id = $2`,
                [JSON.stringify(mockGuide), creativeId]
            );
            return res.json({ success: true, data: mockGuide, creative_id: creativeId });
        }

        const model = getModel();
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: guidePrompt }] }],
            generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 8192 },
        });

        const text = result.response.text();
        let guide;
        try {
            let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const firstBrace = cleaned.indexOf('{');
            if (firstBrace !== -1) cleaned = cleaned.slice(firstBrace);
            const lastBrace = cleaned.lastIndexOf('}');
            if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);
            guide = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[generateGuide] JSON 파싱 실패, MOCK 사용:', parseErr.message);
            guide = buildMockGuide(cr, campaign);
        }

        // DB에 저장
        await pool.query(
            `UPDATE dw_creative SET production_guide = $1, updated_at = NOW() WHERE creative_id = $2`,
            [JSON.stringify(guide), creativeId]
        );

        res.json({ success: true, data: guide, creative_id: creativeId });
    } catch (error) {
        console.error('[generateGuide]', error);
        res.status(500).json({ error: '기획안 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

function buildMockGuide(cr, campaign) {
    const persona = cr.persona_name || '타겟 소비자';
    const desire = cr.desire_name || '아름다운 피부';
    const product = campaign.product_name || '제품';
    const hookType = cr.copy_type || '공감';
    const funnel = cr.funnel || 'TOFU';
    const tone = cr.tone || '공감형';

    const brand = campaign.brand_cd || 'brand';
    const channel = cr.campaign_placement || 'instagram_reels';

    return {
        emotionKeywords: [
            { tag: '#변화감', desc: `${product} 사용 전후의 극적인 차이에서 오는 시각적 쾌감` },
            { tag: '#해방감', desc: `오래된 피부 고민에서 벗어나는 자유로움` },
            { tag: '#자신감', desc: `${persona}가 거울을 볼 때 느끼는 당당한 피부 자신감` },
            { tag: '#신기함', desc: `${product}의 즉각적인 효과에 대한 놀라움` },
            { tag: '#안도감', desc: `드디어 맞는 제품을 찾았다는 안심` },
        ],
        rewardSteps: [
            { num: 1, title: '이게 진짜 내 피부?', sub: '첫 반응', desc: `"${product} 바르자마자 피부결이 달라지는 게 보여요"` },
            { num: 2, title: `${desire} 실현`, sub: '감동 몰입', desc: `"드디어 ${desire}를 찾은 것 같아요"` },
            { num: 3, title: '인생템 등극', sub: '확신', desc: `"이건 진짜 주변에 추천해야 해"` },
        ],
        guideIndex: {
            target: `20-30대 여성, ${desire} 고민 타겟`,
            concept: `${cr.concept_name || product} — ${cr.head_copy || '자연스러운 변화'}`,
            mentionGuide: `인스타그램: @${brand}_official, 유튜브: @${brand}_tube`,
            requiredHashtags: `#광고 #${brand} #${(product || '').replace(/\s/g, '')} #뷰티 #스킨케어`,
        },
        hookingLogic: `${hookType} 유형의 훅을 활용하여 ${persona}의 핵심 Pain Point를 자극합니다. ${tone} 톤으로 ${funnel} 퍼널에 맞는 콘텐츠를 전개합니다.`,
        triggerPoints: [
            `[시각] ${product} 사용 전후 피부 변화를 클로즈업으로 포착`,
            `[소리] 제품 텍스처의 ASMR 효과와 자연스러운 내레이션`,
            `[제스처] 손가락으로 피부 위 제품을 문지르며 텍스처 변화를 보여주는 동작`,
        ],
        focusText: `기능적 스펙 나열보다 ${persona}가 실제 느끼는 '${desire}' 감정에 집중합니다. ${tone} 톤을 유지하며 자연스러운 일상 속 변화를 강조합니다.`,
        visualDirecting: {
            lighting: `Main: 자연광 또는 소프트박스로 피부의 자연스러운 윤기 살림\nFill: 반사판으로 그림자 부드럽게 처리\nRim Light: 제품 패키지 실루엣 강조`,
            miseEnScene: `배경: ${persona}의 일상 공간 (화장대, 욕실, 카페 등)\n소품: ${product}와 어울리는 미니멀한 소품\n의상: ${persona} 페르소나에 맞는 자연스러운 스타일링`,
        },
        copywriting: {
            onScreen: `${cr.head_copy || '변화가 시작되는 순간'}\n${product}로 완성하는 ${desire}\n지금 바로 시작하세요`,
            captionGuide: `첫 줄: ${cr.head_copy || '당신의 피부가 달라집니다'}\n본문: ${persona}를 위한 ${product}의 핵심 가치와 사용 경험\nCTA: 프로필 링크에서 더 알아보기`,
        },
        uploadStrategy: {
            format: `썸네일: Before/After 대비 이미지 + 핵심 카피\n해시태그: #${brand} #${(product || '').replace(/\s/g, '')} #뷰티 #스킨케어\n첫 댓글: 사용 후기와 구매 링크`,
        },
        scenarioTitle: `${cr.head_copy || persona + '의 변화'}, ${product}`,
        scenarioRows: [
            { section: 'HOOK', time: '00-03s', visual: `[Extreme Close-up] ${persona}의 피부 고민 부위 초근접 촬영`, audio: `NAR: "${cr.head_copy || '이거 써봤어요?'}"`, emotion: `#궁금증 #공감\n스크롤을 멈추게 하는 시각적 임팩트` },
            { section: 'Middle', time: '03-09s', visual: `[Full Face Application] ${product} 사용 과정 시연, 텍스처 클로즈업`, audio: `(Effect) 제품 텍스처 ASMR + NAR: 사용감 설명`, emotion: `#기대감 #설렘\n제품 경험에 몰입하게 만드는 감각적 장면` },
            { section: 'Highlight', time: '09-13s', visual: `[Proof & Situation] 사용 후 피부 변화 — After Only 결과 상태`, audio: `NAR: "${desire}가 이렇게 쉬울 줄이야"`, emotion: `#놀라움 #만족\n결과에 대한 확신을 주는 증거` },
            { section: 'CTA', time: '13-15s', visual: `[Product Shot] 제품 패키지 + 브랜드 로고 안정적 구도`, audio: `NAR: "지금 바로 만나보세요"`, emotion: `#행동유도\n구매로 이어지는 직접적 CTA` },
        ],
        techGuide: {
            preProduction: `준비물:\n${product}, 매크로 렌즈(스마트폰용 가능), 자연광 환경 또는 LED 링라이트, 블로팅 페이퍼, 화이트/톤온톤 배경지\n\n체크리스트:\n촬영 전 피부 유분기를 완전히 제거하여 제품 효과가 극대화되도록 준비할 것.\n배경지는 주름 없이 깔끔하게 펴서 고급스러운 무드 연출.`,
            cutEditing: `Hook 구간(00-03s)은 0.5초 단위 빠른 컷 전환으로 시각적 충격, 제품 사용 순간은 0.8배속 슬로모션으로 포착. Middle 구간(03-09s)은 음악 비트에 맞춰 컷 전환하며 리듬감 유지. Highlight(09-13s)는 1초 단위 안정적 컷으로 결과 강조. CTA(13-15s)는 2초간 정지 화면으로 제품·텍스트를 안정적으로 노출.`,
        },
        cautions: [
            { title: '과장 표현 금지', desc: `임상 실험이나 검증되지 않은 수치 언급을 절대 피하고, 실제 사용감 중심으로 촬영할 것.` },
            { title: 'After Only 원칙', desc: `Before/After 직접 비교를 지양하고, 사용 후 자연스러운 결과 상태만을 보여주는 방식으로 연출할 것.` },
            { title: '광고 표시 필수', desc: `영상 시작 또는 캡션 첫 줄에 #광고 #협찬 태그를 반드시 포함하여 법적 요건을 충족할 것.` },
        ],
        directorTip: `${persona}의 실제 일상 톤을 유지하면서 ${product}가 자연스럽게 녹아드는 연출이 핵심입니다. 과도한 연출보다는 '원래 이런 피부였던 것처럼' 보이는 After Only 접근이 알고리즘과 전환율 모두에 효과적입니다.`,
    };
}

// ──────────────────────────────────────────────
// MOCK 데이터 생성 헬퍼 함수
// ──────────────────────────────────────────────

function generateMockCopyText(concept) {
    const copyTemplates = {
        friendly: [
            `${concept.persona_name || '당신'}을 위한 특별한 변화, 지금 시작하세요. ${concept.head_copy || '피부 본연의 아름다움을 되찾는 시간'}`,
            `매일 아침, ${concept.persona_name || '나'}의 피부가 달라지는 걸 느낄 수 있어요. ${concept.head_copy || '자연스러운 광채가 피어나는 순간'}`,
        ],
        premium: [
            `${concept.desire_name || '완벽한 피부'}를 향한 여정, ${concept.head_copy || '과학이 만든 럭셔리 스킨케어'}`,
            `당신이 꿈꾸던 ${concept.desire_name || '빛나는 피부'}, 이제 현실이 됩니다. ${concept.head_copy || '프리미엄 성분의 힘'}`,
        ],
        emotional: [
            `${concept.awareness_name || '새로운 나'}를 만나는 순간, ${concept.head_copy || '진정한 아름다움이 시작됩니다'}`,
            `오늘부터 달라질 ${concept.persona_name || '나'}의 이야기. ${concept.head_copy || '피부에 자신감을 더하세요'}`,
        ],
    };

    const toneKey = (concept.tone || 'friendly').toLowerCase();
    const templates = copyTemplates[toneKey] || copyTemplates.friendly;
    return templates[Math.floor(Math.random() * templates.length)];
}

function generateMockCopyVariants(concept) {
    const tones = ['친근한', '전문적인', '감성적인'];

    return tones.map((tone) => ({
        tone: tone,
        copy_text: `[${tone} 톤] ${concept.persona_name || '고객'}님, ${concept.desire_name || '아름다운 피부'}를 위한 ${concept.head_copy || '특별한 솔루션'}을 만나보세요. ${concept.awareness_name || '첫 단계'}부터 함께합니다.`,
    }));
}

function generateMockScenario(concept) {
    const personaName = concept.persona_name || '모델';
    const desireName = concept.desire_name || '맑은 피부';
    const isReels = (concept.format || '').toLowerCase().includes('reel');

    if (isReels) {
        return [
            {
                step: 1,
                time_range: '0-3s',
                visual: `${personaName}의 일상적인 아침 루틴, 거울 앞에서 피부 고민을 보여주는 클로즈업`,
                audio: '잔잔한 Lo-Fi 비트 시작, "매일 아침 거울 보는 게 고민이었어요"',
                emotion: '공감, 고민',
                cta: '',
            },
            {
                step: 2,
                time_range: '3-8s',
                visual: `제품 언박싱 및 텍스처 클로즈업, ${desireName}를 위한 핵심 성분 자막 오버레이`,
                audio: '"그런데 이 제품을 만나고 나서..." 자연스러운 내레이션',
                emotion: '기대, 설렘',
                cta: '',
            },
            {
                step: 3,
                time_range: '8-13s',
                visual: `${personaName}이 제품을 사용하는 과정, 피부에 밀착되는 텍스처 강조, 비포/애프터 스플릿 화면`,
                audio: '비트 드롭, "확실히 달라진 느낌" 자막 등장',
                emotion: '놀라움, 만족',
                cta: '',
            },
            {
                step: 4,
                time_range: '13-15s',
                visual: `환하게 웃는 ${personaName}의 글로우업 모먼트, 제품 패키지와 함께 로고 노출`,
                audio: '"링크 타고 직접 느껴보세요!" CTA 내레이션',
                emotion: '자신감, 행동 유도',
                cta: '프로필 링크에서 지금 바로 만나보세요',
            },
        ];
    }

    return [
        {
            step: 1,
            time_range: '0-3s',
            visual: `${personaName}의 피부 고민 시각화, 일상 속 스킨케어 루틴의 시작`,
            audio: '부드러운 피아노 인트로, 자연스러운 나레이션 시작',
            emotion: '공감, 일상',
            cta: '',
        },
        {
            step: 2,
            time_range: '3-8s',
            visual: `제품의 핵심 성분과 기술력을 보여주는 인포그래픽 전환, ${desireName} 솔루션 강조`,
            audio: '"피부 과학이 찾은 답" 나레이션, 성분 효과 설명',
            emotion: '신뢰, 기대',
            cta: '',
        },
        {
            step: 3,
            time_range: '8-15s',
            visual: `${personaName}의 Before & After 변화, 피부 결 클로즈업 및 실사용 후기`,
            audio: '밝아지는 BGM, "2주 만에 느낀 확실한 변화" 자막',
            emotion: '놀라움, 확신',
            cta: '',
        },
        {
            step: 4,
            time_range: '15-20s',
            visual: `제품 풀샷과 브랜드 로고, ${personaName}의 자신감 넘치는 마무리 씬`,
            audio: '엔딩 멘트 "지금 바로 경험해보세요", 브랜드 사운드 로고',
            emotion: '자신감, 행동 유도',
            cta: '지금 바로 구매하고 변화를 경험하세요',
        },
    ];
}
