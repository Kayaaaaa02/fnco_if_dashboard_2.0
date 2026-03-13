// 캠페인별 크리에이티브 전체 조회 (컨셉 + PDA 정보 포함)
export const selectCreatives = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                cr.creative_id,
                cr.campaign_id,
                cr.concept_id,
                cr.calendar_id,
                cr.copy_text,
                cr.copy_variants,
                cr.scenario,
                cr.ai_images,
                cr.version,
                cr.status,
                cr.created_by,
                cr.created_at,
                cr.updated_at,
                c.concept_name,
                p.code AS persona_code,
                p.name AS persona_name,
                d.code AS desire_code,
                d.name AS desire_name,
                a.code AS awareness_code,
                a.name AS awareness_name,
                c.format,
                c.funnel,
                c.campaign_placement,
                cr.production_guide
            FROM dw_creative cr
            LEFT JOIN mst_pda_concept c ON cr.concept_id = c.concept_id
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE cr.campaign_id = $1
            ORDER BY cr.creative_id DESC
        `,
        params,
    };
};

// 크리에이티브 단건 조회 (컨셉 + PDA 상세 정보 포함)
export const selectCreativeById = (creativeId) => {
    const params = [creativeId];

    return {
        selectQuery: `
            SELECT
                cr.creative_id,
                cr.campaign_id,
                cr.concept_id,
                cr.calendar_id,
                cr.copy_text,
                cr.copy_variants,
                cr.scenario,
                cr.ai_images,
                cr.version,
                cr.status,
                cr.created_by,
                cr.created_at,
                cr.updated_at,
                cr.production_guide,
                c.concept_name,
                c.head_copy,
                c.copy_type,
                c.tone AS concept_tone,
                c.format AS concept_format,
                c.funnel AS concept_funnel,
                c.campaign_placement,
                p.code AS persona_code,
                p.name AS persona_name,
                p.profile_json AS persona_profile,
                d.code AS desire_code,
                d.name AS desire_name,
                d.definition AS desire_definition,
                d.emotion_trigger AS desire_emotion_trigger,
                a.code AS awareness_code,
                a.name AS awareness_name,
                a.strategy AS awareness_strategy,
                a.tone AS awareness_tone
            FROM dw_creative cr
            LEFT JOIN mst_pda_concept c ON cr.concept_id = c.concept_id
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE cr.creative_id = $1
        `,
        params,
    };
};

// 특정 컨셉의 크리에이티브 조회
export const selectCreativesByConceptId = (conceptId) => {
    const params = [conceptId];

    return {
        selectQuery: `
            SELECT
                cr.creative_id,
                cr.campaign_id,
                cr.concept_id,
                cr.calendar_id,
                cr.copy_text,
                cr.copy_variants,
                cr.scenario,
                cr.ai_images,
                cr.version,
                cr.status,
                cr.created_by,
                cr.created_at,
                cr.updated_at,
                c.concept_name,
                p.code AS persona_code,
                p.name AS persona_name,
                d.code AS desire_code,
                d.name AS desire_name,
                a.code AS awareness_code,
                a.name AS awareness_name
            FROM dw_creative cr
            LEFT JOIN mst_pda_concept c ON cr.concept_id = c.concept_id
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE cr.concept_id = $1
            ORDER BY cr.creative_id DESC
        `,
        params,
    };
};
