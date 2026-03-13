// P.D.A. 전체 조회 (페르소나 + 욕구 + 인지단계 + 컨셉)
export const selectPDAFull = (campaignId) => {
    const params = [campaignId];

    const personaQuery = {
        selectQuery: `
            SELECT
                persona_id,
                campaign_id,
                code,
                name,
                name_eng,
                name_cn,
                profile_json,
                sort_order,
                is_active,
                created_at,
                updated_at
            FROM mst_pda_persona
            WHERE campaign_id = $1
              AND is_active = true
            ORDER BY sort_order ASC
        `,
        params,
    };

    const desireQuery = {
        selectQuery: `
            SELECT
                desire_id,
                campaign_id,
                code,
                name,
                name_eng,
                name_cn,
                definition,
                emotion_trigger,
                linked_products,
                sort_order,
                is_active,
                created_at,
                updated_at
            FROM mst_pda_desire
            WHERE campaign_id = $1
              AND is_active = true
            ORDER BY sort_order ASC
        `,
        params,
    };

    const awarenessQuery = {
        selectQuery: `
            SELECT
                awareness_id,
                campaign_id,
                code,
                name,
                name_eng,
                name_cn,
                strategy,
                funnel,
                tone,
                sort_order,
                created_at,
                updated_at
            FROM mst_pda_awareness
            WHERE campaign_id = $1
            ORDER BY sort_order ASC
        `,
        params,
    };

    const conceptQuery = {
        selectQuery: `
            SELECT
                c.concept_id,
                c.campaign_id,
                c.persona_id,
                c.desire_id,
                c.awareness_id,
                c.concept_name,
                c.head_copy,
                c.copy_type,
                c.tone,
                c.format,
                c.funnel,
                c.campaign_placement,
                c.status,
                c.sort_order,
                c.created_at,
                c.updated_at,
                p.name AS persona_name,
                p.code AS persona_code,
                d.name AS desire_name,
                d.code AS desire_code,
                a.name AS awareness_name,
                a.name_eng AS awareness_name_eng,
                a.code AS awareness_code,
                a.funnel AS awareness_funnel
            FROM mst_pda_concept c
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE c.campaign_id = $1
            ORDER BY c.sort_order ASC
        `,
        params,
    };

    return { personaQuery, desireQuery, awarenessQuery, conceptQuery };
};

// 페르소나만 조회
export const selectPersonas = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                persona_id,
                campaign_id,
                code,
                name,
                name_eng,
                name_cn,
                profile_json,
                sort_order,
                is_active,
                created_at,
                updated_at
            FROM mst_pda_persona
            WHERE campaign_id = $1
              AND is_active = true
            ORDER BY sort_order ASC
        `,
        params,
    };
};

// 욕구만 조회
export const selectDesires = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                desire_id,
                campaign_id,
                code,
                name,
                name_eng,
                name_cn,
                definition,
                emotion_trigger,
                linked_products,
                sort_order,
                is_active,
                created_at,
                updated_at
            FROM mst_pda_desire
            WHERE campaign_id = $1
              AND is_active = true
            ORDER BY sort_order ASC
        `,
        params,
    };
};

// 인지단계만 조회
export const selectAwareness = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                awareness_id,
                campaign_id,
                code,
                name,
                name_eng,
                name_cn,
                strategy,
                funnel,
                tone,
                sort_order,
                created_at,
                updated_at
            FROM mst_pda_awareness
            WHERE campaign_id = $1
            ORDER BY sort_order ASC
        `,
        params,
    };
};

// 컨셉 조회 (페르소나/욕구/인지단계 이름 포함)
export const selectConcepts = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                c.concept_id,
                c.campaign_id,
                c.persona_id,
                c.desire_id,
                c.awareness_id,
                c.concept_name,
                c.head_copy,
                c.copy_type,
                c.tone,
                c.format,
                c.funnel,
                c.campaign_placement,
                c.status,
                c.sort_order,
                c.created_at,
                c.updated_at,
                p.name AS persona_name,
                p.code AS persona_code,
                d.name AS desire_name,
                d.code AS desire_code,
                a.name AS awareness_name,
                a.name_eng AS awareness_name_eng,
                a.code AS awareness_code,
                a.funnel AS awareness_funnel
            FROM mst_pda_concept c
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE c.campaign_id = $1
            ORDER BY c.sort_order ASC
        `,
        params,
    };
};
