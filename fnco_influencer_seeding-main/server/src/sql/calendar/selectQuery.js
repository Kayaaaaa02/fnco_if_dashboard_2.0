// 캠페인 콘텐츠 캘린더 전체 조회 (컨셉명 포함)
export const selectCalendar = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                cal.calendar_id,
                cal.campaign_id,
                cal.concept_id,
                cal.platform,
                cal.scheduled_date,
                cal.content_type,
                cal.title,
                cal.description,
                cal.hashtags,
                cal.status,
                cal.created_at,
                cal.updated_at,
                c.concept_name
            FROM dw_content_calendar cal
            LEFT JOIN mst_pda_concept c ON cal.concept_id = c.concept_id
            WHERE cal.campaign_id = $1
            ORDER BY cal.scheduled_date ASC
        `,
        params,
    };
};

// 캘린더 단건 조회
export const selectCalendarItem = (calendarId) => {
    const params = [calendarId];

    return {
        selectQuery: `
            SELECT
                cal.calendar_id,
                cal.campaign_id,
                cal.concept_id,
                cal.platform,
                cal.scheduled_date,
                cal.content_type,
                cal.title,
                cal.description,
                cal.hashtags,
                cal.status,
                cal.created_at,
                cal.updated_at,
                c.concept_name
            FROM dw_content_calendar cal
            LEFT JOIN mst_pda_concept c ON cal.concept_id = c.concept_id
            WHERE cal.calendar_id = $1
        `,
        params,
    };
};
