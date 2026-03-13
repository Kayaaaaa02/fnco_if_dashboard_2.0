// 런칭 스케줄 상태 업데이트 (published 시 published_at 자동 설정)
export const updateLaunchStatus = (scheduleId, status) => {
    const params = [status, scheduleId];

    const publishedClause = status === 'published' ? ', published_at = NOW()' : '';

    return {
        updateQuery: `
            UPDATE dw_launch_schedule
            SET
                status = $1,
                updated_at = NOW()
                ${publishedClause}
            WHERE schedule_id = $2
            RETURNING *
        `,
        params,
    };
};

// 런칭 스케줄 승인 처리
export const updateLaunchApproval = (scheduleId, approvedBy) => {
    const params = [approvedBy, scheduleId];

    return {
        updateQuery: `
            UPDATE dw_launch_schedule
            SET
                approved_by = $1,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE schedule_id = $2
            RETURNING *
        `,
        params,
    };
};

// 런칭 스케줄 게시 URL 업데이트
export const updateLaunchUrl = (scheduleId, publishedUrl) => {
    const params = [publishedUrl, scheduleId];

    return {
        updateQuery: `
            UPDATE dw_launch_schedule
            SET
                published_url = $1,
                updated_at = NOW()
            WHERE schedule_id = $2
            RETURNING *
        `,
        params,
    };
};
