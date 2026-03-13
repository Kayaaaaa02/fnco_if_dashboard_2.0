// 아웃리치 필드 업데이트 (동적 필드)
export const updateOutreach = (outreachId, data) => {
    const allowedFields = [
        'brief_content',
        'brief_version',
        'email_draft',
        'status',
        'contract_amount',
        'contract_note',
        'sent_at',
    ];

    const jsonFields = ['brief_content', 'email_draft'];
    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(
                jsonFields.includes(field) && typeof data[field] === 'object'
                    ? JSON.stringify(data[field])
                    : data[field]
            );
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    // updated_at은 항상 갱신
    setClauses.push('updated_at = NOW()');

    params.push(outreachId);

    return {
        updateQuery: `
            UPDATE dw_outreach
            SET ${setClauses.join(', ')}
            WHERE outreach_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};

// 아웃리치 상태만 업데이트
export const updateOutreachStatus = (outreachId, status) => {
    const params = [status, outreachId];

    return {
        updateQuery: `
            UPDATE dw_outreach
            SET
                status = $1,
                updated_at = NOW()
            WHERE outreach_id = $2
            RETURNING *
        `,
        params,
    };
};
