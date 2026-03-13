// 캘린더 아이템 업데이트 (동적 필드)
export const updateCalendarItem = (calendarId, data) => {
    const allowedFields = [
        'concept_id',
        'platform',
        'scheduled_date',
        'content_type',
        'title',
        'description',
        'hashtags',
        'status',
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
    params.push(calendarId);

    return {
        updateQuery: `
            UPDATE dw_content_calendar
            SET ${setClauses.join(', ')}
            WHERE calendar_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};
