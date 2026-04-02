/** 허브 대상 확정 — UPSERT */
export const upsertConfirmedInfluencer = `
    INSERT INTO fnco_influencer.mst_influencer (
        profile_id, platform, profile_nm, display_name, profile_url,
        bio, is_selected, profile_img, follow_count, post_count,
        influencer_type, engagement_rate, created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11, $12, $12)
    ON CONFLICT (profile_id)
    DO UPDATE SET
        is_selected = true,
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        follow_count = EXCLUDED.follow_count,
        post_count = EXCLUDED.post_count,
        influencer_type = EXCLUDED.influencer_type,
        engagement_rate = EXCLUDED.engagement_rate,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
`;

/** 확정 인원 조회 */
export const selectConfirmedInfluencers = `
    SELECT id, profile_id, platform, profile_nm, display_name,
           profile_url, bio, profile_img, follow_count, post_count,
           influencer_type, engagement_rate, is_selected, created_at, created_by
    FROM fnco_influencer.mst_influencer
    WHERE is_selected = true
    ORDER BY created_at DESC
`;

/** 확정 인원 수 */
export const countConfirmedInfluencers = `
    SELECT COUNT(*) AS count
    FROM fnco_influencer.mst_influencer
    WHERE is_selected = true
`;

/** 확정 취소 (단건) */
export const updateIsSelected = `
    UPDATE fnco_influencer.mst_influencer
    SET is_selected = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE profile_id = $3 AND platform = $4
`;

/** 확정 취소 (벌크) — profile_id 배열로 일괄 취소 */
export const bulkCancelConfirmed = `
    UPDATE fnco_influencer.mst_influencer
    SET is_selected = false, updated_at = CURRENT_TIMESTAMP, updated_by = $1
    WHERE profile_id = ANY($2::text[])
`;
