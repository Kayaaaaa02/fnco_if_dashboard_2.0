import { pool } from '../config/database.js';
import { selectLaunchSchedule, selectLaunchById } from '../sql/launch/selectQuery.js';
import { insertBulkLaunch } from '../sql/launch/insertQuery.js';

// 런칭 스케줄 전체 조회
export const getLaunchSchedule = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectLaunchSchedule(campaignId);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getLaunchSchedule]', error);
        res.status(500).json({ error: '런칭 스케줄 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 런칭 스케줄 자동 생성 (MOCK)
export const createSchedule = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 1. 승인된 크리에이티브 조회
        let creativesResult = await pool.query(
            `SELECT * FROM dw_creative WHERE campaign_id = $1 AND status = 'approved'`,
            [campaignId]
        );

        // 승인된 크리에이티브가 없으면 draft 아닌 전체 크리에이티브 사용
        if (creativesResult.rows.length === 0) {
            creativesResult = await pool.query(
                `SELECT * FROM dw_creative WHERE campaign_id = $1 AND status != 'draft'`,
                [campaignId]
            );
        }

        const creatives = creativesResult.rows;

        if (creatives.length === 0) {
            return res.status(400).json({ error: '스케줄 생성 가능한 크리에이티브가 없습니다.' });
        }

        // 2. 캠페인 일정 조회
        const campaignResult = await pool.query(
            `SELECT scheduled_start, scheduled_end FROM mst_campaign WHERE campaign_id = $1`,
            [campaignId]
        );

        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        const { scheduled_start, scheduled_end } = campaignResult.rows[0];
        const startDate = scheduled_start ? new Date(scheduled_start) : new Date();
        const endDate = scheduled_end ? new Date(scheduled_end) : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

        // 3. 확정된 인플루언서 조회
        const influencerResult = await pool.query(
            `SELECT * FROM dw_campaign_influencer WHERE campaign_id = $1 AND status = 'confirmed'`,
            [campaignId]
        );

        const influencers = influencerResult.rows;
        const platforms = ['instagram', 'tiktok', 'youtube'];
        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        const scheduleItems = [];
        let dayIndex = 0;

        // 4. 크리에이티브 x 인플루언서 매칭으로 스케줄 아이템 생성
        for (const creative of creatives) {
            // 인플루언서별 스케줄
            for (const influencer of influencers) {
                for (const platform of platforms) {
                    const scheduledDate = new Date(startDate.getTime() + (dayIndex % totalDays) * 24 * 60 * 60 * 1000);
                    scheduledDate.setHours(9 + Math.floor(Math.random() * 12), 0, 0, 0);

                    scheduleItems.push({
                        creative_id: creative.creative_id,
                        profile_id: influencer.profile_id || influencer.influencer_id,
                        platform,
                        scheduled_at: scheduledDate.toISOString(),
                    });
                    dayIndex++;
                }
            }

            // 5. 자체 채널 스케줄 (profile_id = NULL)
            for (const platform of platforms) {
                const scheduledDate = new Date(startDate.getTime() + (dayIndex % totalDays) * 24 * 60 * 60 * 1000);
                scheduledDate.setHours(10, 0, 0, 0);

                scheduleItems.push({
                    creative_id: creative.creative_id,
                    profile_id: null,
                    platform,
                    scheduled_at: scheduledDate.toISOString(),
                });
                dayIndex++;
            }
        }

        // 벌크 INSERT
        const sqlSet = insertBulkLaunch(campaignId, scheduleItems);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.status(201).json({
            success: true,
            message: '런칭 스케줄이 성공적으로 생성되었습니다.',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[createSchedule]', error);
        res.status(500).json({ error: '런칭 스케줄 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 런칭 스케줄 일괄 승인
export const approveLaunch = async (req, res) => {
    try {
        const campaignId = req.params.id;
        const { approved_by } = req.body;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const result = await pool.query(
            `UPDATE dw_launch_schedule
             SET approved_by = $1, approved_at = NOW(), updated_at = NOW()
             WHERE campaign_id = $2 AND status = 'scheduled'
             RETURNING *`,
            [approved_by || 'system', campaignId]
        );

        res.json({
            success: true,
            message: '런칭 스케줄이 일괄 승인되었습니다.',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[approveLaunch]', error);
        res.status(500).json({ error: '런칭 스케줄 승인 중 오류가 발생했습니다.', details: error.message });
    }
};

// 런칭 실행 (MOCK)
export const executeLaunch = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 승인된 scheduled 아이템만 실행
        const result = await pool.query(
            `UPDATE dw_launch_schedule
             SET status = 'published',
                 published_at = NOW(),
                 published_url = CONCAT('https://mock-publish.fnco.co.kr/', schedule_id),
                 updated_at = NOW()
             WHERE campaign_id = $1
               AND status = 'scheduled'
               AND approved_by IS NOT NULL
             RETURNING *`,
            [campaignId]
        );

        res.json({
            success: true,
            message: '런칭이 실행되었습니다 (MOCK).',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[executeLaunch]', error);
        res.status(500).json({ error: '런칭 실행 중 오류가 발생했습니다.', details: error.message });
    }
};
