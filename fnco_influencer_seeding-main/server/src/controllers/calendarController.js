import { pool } from '../config/database.js';
import { selectCalendar, selectCalendarItem } from '../sql/calendar/selectQuery.js';
import { insertBulkCalendar } from '../sql/calendar/insertQuery.js';
import { updateCalendarItem as updateCalendarItemQuery } from '../sql/calendar/updateQuery.js';
import { selectConcepts } from '../sql/pda/selectQuery.js';
import { selectCampaignById } from '../sql/campaign/selectQuery.js';

// 콘텐츠 캘린더 전체 조회
export const getCalendar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectCalendar(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getCalendar]', error);
        res.status(500).json({ error: '콘텐츠 캘린더 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 콘텐츠 캘린더 AI 생성 (MOCK - 기존 컨셉 기반)
export const generateCalendar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 캠페인 정보 조회 (날짜 범위 확인)
        const campaignSql = selectCampaignById(id);
        const campaignResult = await pool.query(campaignSql.selectQuery, campaignSql.params);

        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        const campaign = campaignResult.rows[0];

        // 컨셉 조회
        const conceptSql = selectConcepts(id);
        const conceptResult = await pool.query(conceptSql.selectQuery, conceptSql.params);

        if (conceptResult.rows.length === 0) {
            return res.status(400).json({ error: '캘린더 생성을 위한 컨셉 데이터가 부족합니다. 먼저 컨셉을 생성해주세요.' });
        }

        // 기존 캘린더 삭제
        await pool.query('DELETE FROM dw_content_calendar WHERE campaign_id = $1', [id]);

        const concepts = conceptResult.rows;

        // 캠페인 날짜 범위 기반으로 날짜 분배
        const startDate = campaign.scheduled_start
            ? new Date(campaign.scheduled_start)
            : new Date();
        const endDate = campaign.scheduled_end
            ? new Date(campaign.scheduled_end)
            : new Date(startDate.getTime() + 42 * 24 * 60 * 60 * 1000); // 기본 6주

        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        // 플랫폼 매핑
        const platformMap = {
            instagram_reels: 'instagram',
            instagram_feed: 'instagram',
            instagram_stories: 'instagram',
            tiktok: 'tiktok',
            youtube: 'youtube',
            naver_blog: 'naver_blog',
        };

        // 각 컨셉에 대해 1-2개의 캘린더 항목 생성
        const calendarItems = [];
        const contentTypeMap = {
            short_video: '숏폼 영상',
            long_video: '롱폼 영상',
            carousel: '카루셀 이미지',
            story: '스토리',
            blog_post: '블로그 포스트',
            infographic: '인포그래픽',
        };

        concepts.forEach((concept, idx) => {
            // 주요 플랫폼 캘린더 항목
            const primaryPlatform = platformMap[concept.campaign_placement] || 'instagram';
            const dayOffset = Math.floor((idx / concepts.length) * totalDays);
            const scheduledDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

            calendarItems.push({
                concept_id: concept.concept_id,
                platform: primaryPlatform,
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                content_type: contentTypeMap[concept.format] || '콘텐츠',
                title: `[${concept.persona_code || 'P'}x${concept.desire_code || 'D'}] ${concept.concept_name}`,
                description: `${concept.head_copy} | 톤: ${concept.tone} | 퍼널: ${concept.funnel}`,
                hashtags: null,
            });

            // 일부 컨셉은 크로스 플랫폼 항목 추가
            if (idx % 3 === 0) {
                const crossPlatform = primaryPlatform === 'instagram' ? 'tiktok' : 'instagram';
                const crossDate = new Date(scheduledDate.getTime() + 2 * 24 * 60 * 60 * 1000);

                calendarItems.push({
                    concept_id: concept.concept_id,
                    platform: crossPlatform,
                    scheduled_date: crossDate.toISOString().split('T')[0],
                    content_type: '숏폼 영상 (크로스포스팅)',
                    title: `[크로스] ${concept.concept_name}`,
                    description: `${concept.head_copy} | ${crossPlatform}용 리사이징`,
                    hashtags: null,
                });
            }
        });

        const sqlSet = insertBulkCalendar(id, calendarItems);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.status(201).json({
            success: true,
            message: '콘텐츠 캘린더가 성공적으로 생성되었습니다.',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[generateCalendar]', error);
        res.status(500).json({ error: '콘텐츠 캘린더 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캘린더 아이템 단건 업데이트
export const updateCalendarItem = async (req, res) => {
    try {
        const { calId } = req.params;
        const data = req.body;

        if (!calId) {
            return res.status(400).json({ error: 'calendar_id가 필요합니다.' });
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: '업데이트할 필드가 필요합니다.' });
        }

        const sqlSet = updateCalendarItemQuery(calId, data);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '캘린더 아이템을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '캘린더 아이템이 성공적으로 업데이트되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[updateCalendarItem]', error);
        res.status(500).json({ error: '캘린더 아이템 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};
