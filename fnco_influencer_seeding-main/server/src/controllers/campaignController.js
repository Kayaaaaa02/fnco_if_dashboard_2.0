import { pool } from '../config/database.js';

// mst_campaign에 plan_doc_id 컬럼 자동 추가 (1회)
(async () => {
    try {
        await pool.query(`
            ALTER TABLE mst_campaign ADD COLUMN IF NOT EXISTS plan_doc_id VARCHAR(100)
        `);
    } catch (err) {
        // 이미 존재하거나 권한 문제 시 무시
    }
})();

import { selectCampaigns, selectCampaignById, selectCampaignHub } from '../sql/campaign/selectQuery.js';
import { insertCampaign } from '../sql/campaign/insertQuery.js';
import { updateCampaign as updateCampaignQuery } from '../sql/campaign/updateQuery.js';
import { softDeleteCampaign } from '../sql/campaign/deleteQuery.js';

// 캠페인 목록 조회
export const getCampaigns = async (req, res) => {
    try {
        const { status, brand_cd, brand, country } = req.query;
        const filters = {};

        if (status) filters.status = status;
        if (brand_cd || brand) filters.brand = brand_cd || brand;
        if (country) filters.country = country;

        // Team isolation: if req.teamCode is set, filter by team
        if (req.teamCode) {
            filters.team_code = req.teamCode;
        }

        const sqlSet = selectCampaigns(filters);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getCampaigns]', error);
        res.status(500).json({ error: '캠페인 목록 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 단건 조회
export const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectCampaignById(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[getCampaignById]', error);
        res.status(500).json({ error: '캠페인 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 허브 조회 (캠페인 + 페이즈별 요약)
export const getCampaignHub = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectCampaignHub(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        const row = result.rows[0];

        res.json({
            success: true,
            data: {
                campaign_id: row.campaign_id,
                campaign_name: row.campaign_name,
                brand: row.brand,
                brand_cd: row.brand,
                category: row.category,
                subcategory: row.subcategory,
                product_name: row.product_name,
                country: row.country,
                status: row.status,
                current_phase: row.current_phase,
                brand_dna: row.brand_dna,
                plan_doc_id: row.plan_doc_id,
                scheduled_start: row.scheduled_start,
                scheduled_end: row.scheduled_end,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_by: row.updated_by,
                updated_at: row.updated_at,
                phase_summary: {
                    persona_count: parseInt(row.persona_count, 10),
                    desire_count: parseInt(row.desire_count, 10),
                    awareness_count: parseInt(row.awareness_count, 10),
                    concept_count: parseInt(row.concept_count, 10),
                    strategy_count: parseInt(row.strategy_count, 10),
                    strategy_status: row.strategy_status || null,
                    calendar_count: parseInt(row.calendar_count, 10),
                    creative_count: parseInt(row.creative_count, 10),
                    influencer_count: parseInt(row.influencer_count, 10),
                    outreach_count: parseInt(row.outreach_count, 10),
                    schedule_count: parseInt(row.schedule_count, 10),
                    metric_count: parseInt(row.metric_count, 10),
                },
            },
        });
    } catch (error) {
        console.error('[getCampaignHub]', error);
        res.status(500).json({ error: '캠페인 허브 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 생성 (제품 파일 업로드 지원)
export const createCampaign = async (req, res) => {
    try {
        // multipart/form-data인 경우 JSON 필드가 문자열로 올 수 있음
        let body = req.body;
        if (typeof body.brand_dna === 'string') {
            try { body.brand_dna = JSON.parse(body.brand_dna); } catch {}
        }

        const {
            campaign_name,
            brand_cd, brand,
            category,
            subcategory,
            product_name,
            country,
            brand_dna,
            scheduled_start,
            scheduled_end,
            created_by,
        } = body;

        if (!campaign_name) {
            return res.status(400).json({ error: 'campaign_name이 필요합니다.' });
        }

        const campaign_id = `CAMP_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        // 업로드된 제품 파일 경로 저장 (brand_dna JSONB에 포함)
        let finalBrandDna = brand_dna || {};
        if (req.file) {
            finalBrandDna = { ...finalBrandDna, product_file_path: req.file.path.replace(/\\/g, '/') };
            console.log('[createCampaign] 제품 파일 업로드됨:', req.file.path);
        }

        const sqlSet = insertCampaign({
            campaign_id,
            campaign_name,
            brand: brand || brand_cd,
            category,
            subcategory,
            product_name,
            country,
            brand_dna: finalBrandDna,
            scheduled_start,
            scheduled_end,
            created_by,
        });

        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);

        res.status(201).json({
            success: true,
            message: '캠페인이 성공적으로 생성되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[createCampaign]', error);
        res.status(500).json({ error: '캠페인 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 업데이트
export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: '업데이트할 필드가 필요합니다.' });
        }

        const sqlSet = updateCampaignQuery(id, data);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '캠페인이 성공적으로 업데이트되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[updateCampaign]', error);
        res.status(500).json({ error: '캠페인 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 캠페인 아카이브 (소프트 삭제)
export const archiveCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = softDeleteCampaign(id);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '캠페인이 성공적으로 아카이브되었습니다.',
            campaign_id: result.rows[0].campaign_id,
        });
    } catch (error) {
        console.error('[archiveCampaign]', error);
        res.status(500).json({ error: '캠페인 아카이브 중 오류가 발생했습니다.', details: error.message });
    }
};
