// 페르소나 삭제 (하드 삭제)
export const deletePersona = (personaId) => {
    const params = [personaId];

    return {
        deleteQuery: `
            DELETE FROM mst_pda_persona
            WHERE persona_id = $1
            RETURNING persona_id
        `,
        params,
    };
};

// 욕구 삭제 (하드 삭제)
export const deleteDesire = (desireId) => {
    const params = [desireId];

    return {
        deleteQuery: `
            DELETE FROM mst_pda_desire
            WHERE desire_id = $1
            RETURNING desire_id
        `,
        params,
    };
};

// 컨셉 삭제 (하드 삭제)
export const deleteConcept = (conceptId) => {
    const params = [conceptId];

    return {
        deleteQuery: `
            DELETE FROM mst_pda_concept
            WHERE concept_id = $1
            RETURNING concept_id
        `,
        params,
    };
};

// 캠페인의 P.D.A. 전체 삭제 (재생성용, 올바른 순서)
// 컨셉 → 인지단계 → 욕구 → 페르소나 순서로 삭제 (FK 참조 순서)
export const deleteAllPDA = (campaignId) => {
    const params = [campaignId];

    return {
        deleteConceptsQuery: {
            deleteQuery: `
                DELETE FROM mst_pda_concept
                WHERE campaign_id = $1
            `,
            params,
        },
        deleteAwarenessQuery: {
            deleteQuery: `
                DELETE FROM mst_pda_awareness
                WHERE campaign_id = $1
            `,
            params,
        },
        deleteDesiresQuery: {
            deleteQuery: `
                DELETE FROM mst_pda_desire
                WHERE campaign_id = $1
            `,
            params,
        },
        deletePersonasQuery: {
            deleteQuery: `
                DELETE FROM mst_pda_persona
                WHERE campaign_id = $1
            `,
            params,
        },
    };
};
