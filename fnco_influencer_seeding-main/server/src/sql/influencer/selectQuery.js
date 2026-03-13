/**
 * 인플루언서 리스트 조회 (is_selected = true)
 * fnco_influencer.mst_influencer + dw_influencer_ai_analysis
 */
export const get_influencer_list_selected_query = () => {
    return {
        selectQuery: `
            SELECT
                A.profile_id,
                A.profile_url,
                A.profile_nm,
                A.profile_img,
                A.is_selected,
                A.follow_count,
                A.post_count,
                A.influencer_type,
                A.platform,
                A.updated_at,
                B.avg_engagement_quick,
                B.content_types,
                B.quick_summary,
                B.quick_summary_eng,
                B.deep_analysis,
                B.deep_analysis_eng,
                B.deep_analysis_cn,
                B.top_content_id,
                B.top_content_url,
                B.top_content_caption,
                B.top_content_type,
                B.top_content_product_type,
                B.top_content_likes,
                B.top_content_comments,
                B.top_content_views,
                B.top_content_shares,
                B.top_content_posted_at,
                B.top_content_thumbnail_s3_url,
                B.recent_posts_count_quick,
                B.avg_views_quick,
                B.recent_posts_count_deep,
                B.video_posts_count_deep,
                B.avg_views_deep,
                B.avg_likes_deep,
                B.avg_comments_deep,
                B.avg_shares_deep,
                B.ad_posts_count_deep,
                B.ad_ratio_deep,
                T.analysis_type,
                T.analyzed_at AS deep_analyzed_at,
                T.crawled_posts_count
            FROM fnco_influencer.mst_influencer A
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            LEFT JOIN fnco_influencer.dw_influencer_analysis_tracking T
                ON A.profile_id = T.profile_id AND T.analysis_type = 'DEEP_ANALYSIS'
            WHERE 1=1
                AND A.is_selected IS TRUE
        `,
    };
};

/**
 * 인플루언서 전체 리스트 조회 (is_selected 조건 없음)
 */
export const get_influencer_list_query = () => {
    return {
        selectQuery: `
            SELECT
                A.profile_id,
                A.profile_url,
                A.profile_nm,
                A.profile_img,
                A.is_selected,
                A.follow_count,
                A.post_count,
                A.influencer_type,
                A.platform,
                A.updated_at,
                B.avg_engagement_quick,
                B.content_types,
                B.quick_summary,
                B.quick_summary_eng,
                B.deep_analysis,
                B.deep_analysis_eng,
                B.deep_analysis_cn,
                B.top_content_id,
                B.top_content_url,
                B.top_content_caption,
                B.top_content_type,
                B.top_content_product_type,
                B.top_content_likes,
                B.top_content_comments,
                B.top_content_views,
                B.top_content_shares,
                B.top_content_posted_at,
                B.top_content_thumbnail_s3_url,
                B.recent_posts_count_quick,
                B.avg_views_quick,
                B.recent_posts_count_deep,
                B.video_posts_count_deep,
                B.avg_views_deep,
                B.avg_likes_deep,
                B.avg_comments_deep,
                B.avg_shares_deep,
                B.ad_posts_count_deep,
                B.ad_ratio_deep,
                T.analysis_type,
                T.analyzed_at AS deep_analyzed_at,
                T.crawled_posts_count
            FROM fnco_influencer.mst_influencer A
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            LEFT JOIN fnco_influencer.dw_influencer_analysis_tracking T
                ON A.profile_id = T.profile_id AND T.analysis_type = 'DEEP_ANALYSIS'
            WHERE 1=1
        `,
    };
};

/**
 * 인플루언서 수 조회 (is_selected = true, list와 동일 조건)
 */
export const get_influencer_count_selected_query = () => {
    return {
        selectQuery: `
            SELECT COUNT(*) AS count
            FROM fnco_influencer.mst_influencer A
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            WHERE 1=1
                AND A.is_selected IS TRUE
        `,
    };
};

/**
 * 인플루언서 전체 수 조회 (is_selected 조건 없음)
 */
export const get_influencer_count_query = () => {
    return {
        selectQuery: `
            SELECT COUNT(*) AS count
            FROM fnco_influencer.mst_influencer A
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            WHERE 1=1
        `,
    };
};

/**
 * 인플루언서 리스트 조회 (PROFILE_URL IN (...)) - 엑셀 업로드 후 수집된 항목
 * @param {{ profile_urls: string[] }} param
 */
export const get_influencer_list_by_urls_query = (profileUrls = []) => {
    if (!Array.isArray(profileUrls) || profileUrls.length === 0) {
        //방어코드
        return {
            selectQuery: `
                SELECT A.profile_id FROM fnco_influencer.mst_influencer A WHERE 1=0
            `,
            params: [],
        };
    }
    const conditions = profileUrls
        .map(
            (_, idx) =>
                `(LOWER($${idx + 1}) LIKE LOWER(A.profile_url) || '%' OR LOWER(A.profile_url) LIKE LOWER($${
                    idx + 1
                }) || '%')`
        )
        .join(' OR ');
    const whereClause = `WHERE ${conditions}`;
    const params = profileUrls;
    return {
        selectQuery: `
            SELECT
                A.profile_id,
                A.profile_url,
                A.profile_nm,
                A.profile_img,
                A.is_selected,
                A.follow_count,
                A.post_count,
                A.influencer_type,
                A.platform,
                A.updated_at,
                B.avg_engagement_quick,
                B.content_types,
                B.quick_summary,
                B.quick_summary_eng,
                B.deep_analysis,
                B.deep_analysis_eng,
                B.deep_analysis_cn,
                B.top_content_id,
                B.top_content_url,
                B.top_content_caption,
                B.top_content_type,
                B.top_content_product_type,
                B.top_content_likes,
                B.top_content_comments,
                B.top_content_views,
                B.top_content_shares,
                B.top_content_posted_at,
                B.top_content_thumbnail_s3_url,
                B.recent_posts_count_quick,
                B.avg_views_quick,
                B.recent_posts_count_deep,
                B.video_posts_count_deep,
                B.avg_views_deep,
                B.avg_likes_deep,
                B.avg_comments_deep,
                B.avg_shares_deep,
                B.ad_posts_count_deep,
                B.ad_ratio_deep
            FROM fnco_influencer.mst_influencer A
            JOIN fnco_influencer.dw_influencer_ai_analysis B
                ON A.profile_id = B.profile_id
            ${whereClause}
        `,
        params,
    };
};

/**
 * AI 추천 기획안 조회 쿼리
 */
export const get_plan_reels_query = `
    SELECT ai_top10_reels_plan 
    FROM fnco_influencer.dw_plan_doc_analysis 
    WHERE plan_doc_id = $1
`;
