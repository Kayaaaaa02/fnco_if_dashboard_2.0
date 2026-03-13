import { pool } from '../config/database.js';
import { selectMetrics, selectPDAHeatmap, selectFatigueReport, selectMetricsSummary } from '../sql/monitor/selectQuery.js';
import { insertBulkMetrics } from '../sql/monitor/insertQuery.js';

// 모니터링 대시보드 조회 (요약 + 최근 지표)
export const getMonitorDashboard = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const summarySql = selectMetricsSummary(campaignId);
        const metricsSql = selectMetrics(campaignId);

        const [summaryResult, metricsResult] = await Promise.all([
            pool.query(summarySql.selectQuery, summarySql.params),
            pool.query(metricsSql.selectQuery, metricsSql.params),
        ]);

        const summary = summaryResult.rows[0] || {};
        const rows = metricsResult.rows;

        // 날짜별 트렌드 집계
        const trendMap = {};
        for (const row of rows) {
            const d = row.date ? new Date(row.date).toISOString().split('T')[0] : null;
            if (!d) continue;
            if (!trendMap[d]) {
                trendMap[d] = { date: d, views_sum: 0, likes_sum: 0, contents_sum: 0, count: 0 };
            }
            trendMap[d].views_sum += (row.impressions || 0);
            trendMap[d].likes_sum += (row.likes || 0);
            trendMap[d].contents_sum += (row.contents_count || 0);
            trendMap[d].count += 1;
        }
        const trend = Object.values(trendMap)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(t => ({
                date: t.date,
                avg_views: Math.round(t.views_sum / t.count),
                avg_likes: Math.round(t.likes_sum / t.count),
                contents_count: t.contents_sum,
            }));

        res.json({
            success: true,
            data: {
                summary: {
                    avg_views: Math.round(parseFloat(summary.avg_views) || 0),
                    avg_engagement_rate: parseFloat(summary.avg_engagement_rate) || 0,
                    avg_likes: Math.round(parseFloat(summary.avg_likes) || 0),
                    total_contents_count: parseInt(summary.total_contents_count, 10) || 0,
                    total_impressions: parseInt(summary.total_impressions, 10) || 0,
                },
                metrics: rows,
                trend,
                metric_count: rows.length,
            },
        });
    } catch (error) {
        console.error('[getMonitorDashboard]', error);
        res.status(500).json({ error: '모니터링 대시보드 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// PDA 히트맵 조회
export const getPDAHeatmap = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectPDAHeatmap(campaignId);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getPDAHeatmap]', error);
        res.status(500).json({ error: 'PDA 히트맵 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 피로도 리포트 조회
export const getFatigueReport = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectFatigueReport(campaignId);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getFatigueReport]', error);
        res.status(500).json({ error: '피로도 리포트 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// Mock 성과 지표 생성
export const generateMockMetrics = async (req, res) => {
    try {
        const campaignId = req.params.id;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 1. 크리에이티브 + 컨셉 조회
        const creativesResult = await pool.query(
            `SELECT c.*, con.concept_id, con.persona_id, con.desire_id, con.awareness_id
             FROM dw_creative c
             JOIN mst_pda_concept con ON c.concept_id = con.concept_id
             WHERE c.campaign_id = $1`,
            [campaignId]
        );

        const creatives = creativesResult.rows;

        if (creatives.length === 0) {
            return res.status(400).json({ error: 'Mock 지표를 생성할 크리에이티브가 없습니다.' });
        }

        // 2. 크리에이티브별 7일간 Mock 지표 생성
        const metrics = [];
        const today = new Date();

        for (const creative of creatives) {
            for (let day = 0; day < 7; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() - day);
                const dateStr = date.toISOString().split('T')[0];

                // 오래된 날짜일수록 피로도 높음
                const baseFatigue = Math.floor((day / 7) * 30);

                // 새 KPI 기준: 평균 조회수 ~116K-140K, 인게이지먼트율 ~2-3%, 평균 좋아요 ~845-1014, 컨텐츠 수 ~2-4
                metrics.push({
                    creative_id: creative.creative_id,
                    concept_id: creative.concept_id,
                    date: dateStr,
                    impressions: Math.floor(Math.random() * 40000) + 100000,        // 조회수: 100K~140K
                    reach: Math.floor(Math.random() * 30000) + 50000,               // reach
                    clicks: Math.floor(Math.random() * 400) + 700,                  // 좋아요 수: 700~1100
                    ctr: parseFloat((Math.random() * 1.5 + 1.8).toFixed(2)),        // 인게이지먼트율: 1.8~3.3%
                    cpa: parseFloat((Math.random() * 2000 + 500).toFixed(0)),       // cpa (unused)
                    roas: parseFloat((Math.random() * 5.0 + 1.0).toFixed(2)),       // roas (unused)
                    engaged_views: Math.floor(Math.random() * 15000) + 5000,        // engaged_views
                    conversions: Math.floor(Math.random() * 3) + 2,                 // 컨텐츠 수: 2~4건
                    fatigue_score: Math.floor(Math.random() * 10) + baseFatigue,
                });
            }
        }

        // 3. 벌크 INSERT
        const sqlSet = insertBulkMetrics(campaignId, metrics);
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.status(201).json({
            success: true,
            message: 'Mock 성과 지표가 생성되었습니다.',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[generateMockMetrics]', error);
        res.status(500).json({ error: 'Mock 성과 지표 생성 중 오류가 발생했습니다.', details: error.message });
    }
};
