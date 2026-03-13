// 페르소나 업데이트 (동적 필드)
export const updatePersona = (personaId, data) => {
    const allowedFields = [
        'code',
        'name',
        'name_eng',
        'name_cn',
        'profile_json',
        'sort_order',
        'is_active',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(field === 'profile_json' && typeof data[field] === 'object'
                ? JSON.stringify(data[field])
                : data[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    setClauses.push('updated_at = NOW()');
    params.push(personaId);

    return {
        updateQuery: `
            UPDATE mst_pda_persona
            SET ${setClauses.join(', ')}
            WHERE persona_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};

// 욕구 업데이트 (동적 필드)
export const updateDesire = (desireId, data) => {
    const allowedFields = [
        'code',
        'name',
        'name_eng',
        'name_cn',
        'definition',
        'emotion_trigger',
        'linked_products',
        'sort_order',
        'is_active',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(data[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    setClauses.push('updated_at = NOW()');
    params.push(desireId);

    return {
        updateQuery: `
            UPDATE mst_pda_desire
            SET ${setClauses.join(', ')}
            WHERE desire_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};

// 컨셉 업데이트 (동적 필드)
export const updateConcept = (conceptId, data) => {
    const allowedFields = [
        'persona_id',
        'desire_id',
        'awareness_id',
        'concept_name',
        'head_copy',
        'copy_type',
        'tone',
        'format',
        'funnel',
        'campaign_placement',
        'status',
        'sort_order',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(data[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    setClauses.push('updated_at = NOW()');
    params.push(conceptId);

    return {
        updateQuery: `
            UPDATE mst_pda_concept
            SET ${setClauses.join(', ')}
            WHERE concept_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};

// 컨셉 상태만 업데이트
export const updateConceptStatus = (conceptId, status) => {
    const params = [status, conceptId];

    return {
        updateQuery: `
            UPDATE mst_pda_concept
            SET
                status = $1,
                updated_at = NOW()
            WHERE concept_id = $2
            RETURNING *
        `,
        params,
    };
};
