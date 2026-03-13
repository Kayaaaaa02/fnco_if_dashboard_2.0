// 캠페인별 런칭 스케줄 전체 조회 (크리에이티브 + PDA 컨셉 정보 포함)
export const selectLaunchSchedule = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                ls.schedule_id,
                ls.campaign_id,
                ls.creative_id,
                ls.profile_id,
                ls.platform,
                ls.scheduled_at,
                ls.status,
                ls.approved_by,
                ls.approved_at,
                ls.published_at,
                ls.published_url,
                ls.created_at,
                ls.updated_at,
                cr.copy_text,
                cr.copy_variants,
                cr.scenario,
                cr.ai_images,
                cr.format AS content_type,
                cr.status AS creative_status,
                c.concept_name,
                p.code AS persona_code,
                p.name AS persona_name,
                d.code AS desire_code,
                d.name AS desire_name,
                a.code AS awareness_code,
                a.name AS awareness_name,
                ci.name AS influencer_name
            FROM dw_launch_schedule ls
            LEFT JOIN dw_creative cr ON ls.creative_id = cr.creative_id
            LEFT JOIN mst_pda_concept c ON cr.concept_id = c.concept_id
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            LEFT JOIN dw_campaign_influencer ci ON ls.profile_id = ci.profile_id AND ls.campaign_id = ci.campaign_id
            WHERE ls.campaign_id = $1
            ORDER BY ls.scheduled_at ASC
        `,
        params,
    };
};

// 런칭 스케줄 단건 조회
export const selectLaunchById = (scheduleId) => {
    const params = [scheduleId];

    return {
        selectQuery: `
            SELECT
                ls.schedule_id,
                ls.campaign_id,
                ls.creative_id,
                ls.profile_id,
                ls.platform,
                ls.scheduled_at,
                ls.status,
                ls.approved_by,
                ls.approved_at,
                ls.published_at,
                ls.published_url,
                ls.created_at,
                ls.updated_at,
                cr.copy_text,
                cr.copy_variants,
                cr.scenario,
                cr.ai_images,
                cr.status AS creative_status,
                c.concept_name,
                p.code AS persona_code,
                p.name AS persona_name,
                d.code AS desire_code,
                d.name AS desire_name,
                a.code AS awareness_code,
                a.name AS awareness_name
            FROM dw_launch_schedule ls
            LEFT JOIN dw_creative cr ON ls.creative_id = cr.creative_id
            LEFT JOIN mst_pda_concept c ON cr.concept_id = c.concept_id
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE ls.schedule_id = $1
        `,
        params,
    };
};
