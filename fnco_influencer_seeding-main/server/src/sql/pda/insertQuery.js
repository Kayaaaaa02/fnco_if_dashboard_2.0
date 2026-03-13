// 페르소나 단건 등록
export const insertPersona = (data) => {
    const params = [
        data.campaign_id,
        data.code,
        data.name,
        data.name_eng || null,
        data.name_cn || null,
        data.profile_json ? JSON.stringify(data.profile_json) : null,
        data.sort_order || 0,
    ];

    return {
        insertQuery: `
            INSERT INTO mst_pda_persona (
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
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 욕구 단건 등록
export const insertDesire = (data) => {
    let lp = data.linked_products || null;
    if (lp !== null && typeof lp !== 'string') {
        lp = JSON.stringify(lp);
    } else if (typeof lp === 'string') {
        try { JSON.parse(lp); } catch { lp = JSON.stringify(lp); }
    }
    const params = [
        data.campaign_id,
        data.code,
        data.name,
        data.name_eng || null,
        data.name_cn || null,
        data.definition || null,
        data.emotion_trigger || null,
        lp,
        data.sort_order || 0,
    ];

    return {
        insertQuery: `
            INSERT INTO mst_pda_desire (
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
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 인지단계 단건 등록
export const insertAwareness = (data) => {
    const params = [
        data.campaign_id,
        data.code,
        data.name,
        data.name_eng || null,
        data.name_cn || null,
        data.strategy || null,
        data.funnel || null,
        data.tone || null,
        data.sort_order || 0,
    ];

    return {
        insertQuery: `
            INSERT INTO mst_pda_awareness (
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
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 컨셉 단건 등록
export const insertConcept = (data) => {
    const params = [
        data.campaign_id,
        data.persona_id,
        data.desire_id,
        data.awareness_id,
        data.concept_name,
        data.head_copy || null,
        data.copy_type || null,
        data.tone || null,
        data.format || null,
        data.funnel || null,
        data.campaign_placement || null,
        data.sort_order || 0,
    ];

    return {
        insertQuery: `
            INSERT INTO mst_pda_concept (
                campaign_id,
                persona_id,
                desire_id,
                awareness_id,
                concept_name,
                head_copy,
                copy_type,
                tone,
                format,
                funnel,
                campaign_placement,
                sort_order,
                status,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 페르소나 벌크 등록
export const insertBulkPersonas = (campaignId, personas) => {
    const params = [];
    const valueRows = [];

    personas.forEach((p, idx) => {
        const offset = idx * 6;
        params.push(
            campaignId,
            p.code,
            p.name,
            p.name_eng || null,
            p.name_cn || null,
            p.profile_json ? JSON.stringify(p.profile_json) : null,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, ${p.sort_order || idx + 1}, true, NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO mst_pda_persona (
                campaign_id, code, name, name_eng, name_cn, profile_json, sort_order, is_active, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};

// 욕구 벌크 등록
export const insertBulkDesires = (campaignId, desires) => {
    const params = [];
    const valueRows = [];

    desires.forEach((d, idx) => {
        const offset = idx * 8;
        // linked_products: JSONB 컬럼 — 문자열이면 JSON 문자열로, 배열/객체면 stringify
        let lp = d.linked_products || null;
        if (lp !== null && typeof lp !== 'string') {
            lp = JSON.stringify(lp);
        } else if (typeof lp === 'string') {
            // 일반 문자열이면 JSON 문자열로 감싸기
            try { JSON.parse(lp); } catch { lp = JSON.stringify(lp); }
        }
        params.push(
            campaignId,
            d.code,
            d.name,
            d.name_eng || null,
            d.name_cn || null,
            d.definition || null,
            d.emotion_trigger || null,
            lp,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, ${d.sort_order || idx + 1}, true, NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO mst_pda_desire (
                campaign_id, code, name, name_eng, name_cn, definition, emotion_trigger, linked_products, sort_order, is_active, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};

// 인지단계 벌크 등록
export const insertBulkAwareness = (campaignId, stages) => {
    const params = [];
    const valueRows = [];

    stages.forEach((s, idx) => {
        const offset = idx * 8;
        params.push(
            campaignId,
            s.code,
            s.name,
            s.name_eng || null,
            s.name_cn || null,
            s.strategy || null,
            s.funnel || null,
            s.tone || null,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, ${s.sort_order || idx + 1}, NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO mst_pda_awareness (
                campaign_id, code, name, name_eng, name_cn, strategy, funnel, tone, sort_order, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};

// 컨셉 벌크 등록
export const insertBulkConcepts = (campaignId, concepts) => {
    const params = [];
    const valueRows = [];

    concepts.forEach((c, idx) => {
        const offset = idx * 11;
        params.push(
            campaignId,
            c.persona_id,
            c.desire_id,
            c.awareness_id,
            c.concept_name,
            c.head_copy || null,
            c.copy_type || null,
            c.tone || null,
            c.format || null,
            c.funnel || null,
            c.campaign_placement || null,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, ${c.sort_order || idx + 1}, 'draft', NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO mst_pda_concept (
                campaign_id, persona_id, desire_id, awareness_id, concept_name, head_copy, copy_type, tone, format, funnel, campaign_placement, sort_order, status, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};
