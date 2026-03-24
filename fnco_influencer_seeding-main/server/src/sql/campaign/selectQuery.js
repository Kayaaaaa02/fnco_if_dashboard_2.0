// 캠페인 목록 조회 (필터 지원)
export const selectCampaigns = (filters = {}) => {
    const params = [];
    let whereClause = 'WHERE is_deleted = false';

    if (filters.status) {
        params.push(filters.status);
        whereClause += ` AND status = $${params.length}`;
    }

    if (filters.brand) {
        params.push(filters.brand);
        whereClause += ` AND brand = $${params.length}`;
    }

    if (filters.country) {
        params.push(filters.country);
        whereClause += ` AND country = $${params.length}`;
    }

    if (filters.team_code) {
        params.push(filters.team_code);
        whereClause += ` AND team_code = $${params.length}`;
    }

    return {
        selectQuery: `
            SELECT
                campaign_id,
                campaign_name,
                brand,
                category,
                subcategory,
                product_name,
                country,
                status,
                current_phase,
                brand_dna,
                plan_doc_id,
                scheduled_start,
                scheduled_end,
                created_by,
                created_at,
                updated_by,
                updated_at
            FROM mst_campaign
            ${whereClause}
            ORDER BY updated_at DESC
        `,
        params,
    };
};

// 캠페인 단건 조회
export const selectCampaignById = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                campaign_id,
                campaign_name,
                brand,
                category,
                subcategory,
                product_name,
                country,
                status,
                current_phase,
                brand_dna,
                plan_doc_id,
                scheduled_start,
                scheduled_end,
                created_by,
                created_at,
                updated_by,
                updated_at
            FROM mst_campaign
            WHERE campaign_id = $1
              AND is_deleted = false
        `,
        params,
    };
};

// 캠페인 허브 조회 (캠페인 정보 + 각 페이즈별 항목 수)
export const selectCampaignHub = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                c.campaign_id,
                c.campaign_name,
                c.brand,
                c.category,
                c.subcategory,
                c.product_name,
                c.country,
                c.status,
                c.current_phase,
                c.brand_dna,
                c.plan_doc_id,
                c.scheduled_start,
                c.scheduled_end,
                c.created_by,
                c.created_at,
                c.updated_by,
                c.updated_at,
                COALESCE(persona_cnt.cnt, 0) AS persona_count,
                COALESCE(desire_cnt.cnt, 0) AS desire_count,
                COALESCE(awareness_cnt.cnt, 0) AS awareness_count,
                COALESCE(concept_cnt.cnt, 0) AS concept_count,
                COALESCE(strategy_cnt.cnt, 0) AS strategy_count,
                strategy_status_latest.status AS strategy_status,
                COALESCE(calendar_cnt.cnt, 0) AS calendar_count,
                COALESCE(creative_cnt.cnt, 0) AS creative_count,
                COALESCE(influencer_cnt.cnt, 0) AS influencer_count,
                COALESCE(outreach_cnt.cnt, 0) AS outreach_count,
                COALESCE(schedule_cnt.cnt, 0) AS schedule_count,
                COALESCE(metric_cnt.cnt, 0) AS metric_count
            FROM mst_campaign c
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM mst_pda_persona WHERE is_active = true GROUP BY campaign_id) persona_cnt ON c.campaign_id = persona_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM mst_pda_desire WHERE is_active = true GROUP BY campaign_id) desire_cnt ON c.campaign_id = desire_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM mst_pda_awareness GROUP BY campaign_id) awareness_cnt ON c.campaign_id = awareness_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM mst_pda_concept GROUP BY campaign_id) concept_cnt ON c.campaign_id = concept_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_campaign_strategy GROUP BY campaign_id) strategy_cnt ON c.campaign_id = strategy_cnt.campaign_id
            LEFT JOIN LATERAL (SELECT status FROM dw_campaign_strategy WHERE campaign_id = c.campaign_id ORDER BY version DESC LIMIT 1) strategy_status_latest ON true
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_content_calendar GROUP BY campaign_id) calendar_cnt ON c.campaign_id = calendar_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_creative GROUP BY campaign_id) creative_cnt ON c.campaign_id = creative_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_campaign_influencer GROUP BY campaign_id) influencer_cnt ON c.campaign_id = influencer_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_outreach GROUP BY campaign_id) outreach_cnt ON c.campaign_id = outreach_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_launch_schedule GROUP BY campaign_id) schedule_cnt ON c.campaign_id = schedule_cnt.campaign_id
            LEFT JOIN (SELECT campaign_id, COUNT(*) AS cnt FROM dw_performance_metric GROUP BY campaign_id) metric_cnt ON c.campaign_id = metric_cnt.campaign_id
            WHERE c.campaign_id = $1
              AND c.is_deleted = false
        `,
        params,
    };
};
