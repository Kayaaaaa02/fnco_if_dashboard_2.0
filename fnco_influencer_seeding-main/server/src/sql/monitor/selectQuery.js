// 캠페인별 성과 지표 전체 조회
export const selectMetrics = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                metric_id,
                campaign_id,
                creative_id,
                concept_id,
                date,
                impressions,
                reach,
                clicks AS likes,
                ctr AS engagement_rate,
                cpa,
                roas,
                engaged_views,
                conversions AS contents_count,
                fatigue_score,
                created_at
            FROM dw_performance_metric
            WHERE campaign_id = $1
            ORDER BY date DESC
        `,
        params,
    };
};

// PDA 히트맵 조회
export const selectPDAHeatmap = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT *
            FROM vw_pda_heatmap
            WHERE campaign_id = $1
        `,
        params,
    };
};

// 피로도 리포트 조회 (fatigue_score > 0, 크리에이티브 + 컨셉 정보 포함)
export const selectFatigueReport = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                m.metric_id,
                m.campaign_id,
                m.creative_id,
                m.concept_id,
                m.date,
                m.impressions,
                m.reach,
                m.clicks,
                m.ctr,
                m.cpa,
                m.roas,
                m.engaged_views,
                m.conversions,
                m.fatigue_score,
                cr.copy_text,
                cr.status AS creative_status,
                c.concept_name,
                p.code AS persona_code,
                p.name AS persona_name,
                d.code AS desire_code,
                d.name AS desire_name,
                a.code AS awareness_code,
                a.name AS awareness_name
            FROM dw_performance_metric m
            LEFT JOIN dw_creative cr ON m.creative_id = cr.creative_id
            LEFT JOIN mst_pda_concept c ON m.concept_id = c.concept_id
            LEFT JOIN mst_pda_persona p ON c.persona_id = p.persona_id
            LEFT JOIN mst_pda_desire d ON c.desire_id = d.desire_id
            LEFT JOIN mst_pda_awareness a ON c.awareness_id = a.awareness_id
            WHERE m.campaign_id = $1
              AND m.fatigue_score > 0
            ORDER BY m.fatigue_score DESC
        `,
        params,
    };
};

// 성과 지표 요약 (집계)
export const selectMetricsSummary = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                AVG(impressions) AS avg_views,
                AVG(ctr) AS avg_engagement_rate,
                AVG(clicks) AS avg_likes,
                SUM(conversions) AS total_contents_count,
                SUM(impressions) AS total_impressions,
                SUM(reach) AS total_reach,
                SUM(engaged_views) AS total_engaged_views
            FROM dw_performance_metric
            WHERE campaign_id = $1
        `,
        params,
    };
};
