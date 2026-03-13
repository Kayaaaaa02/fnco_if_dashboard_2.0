import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.mst_campaign_template (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    config JSONB NOT NULL DEFAULT '{}',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

let tableCreated = false;

async function ensureTable() {
  if (!tableCreated) {
    await pool.query(CREATE_TABLE);
    tableCreated = true;
  }
}

// 템플릿 목록 조회
export const getTemplates = async (req, res) => {
  try {
    await ensureTable();
    const { category } = req.query;

    let query = 'SELECT * FROM fnco_influencer.mst_campaign_template ORDER BY created_at DESC';
    const params = [];

    if (category) {
      query = 'SELECT * FROM fnco_influencer.mst_campaign_template WHERE category = $1 ORDER BY created_at DESC';
      params.push(category);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[getTemplates]', error);
    res.status(500).json({ error: '템플릿 목록 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// 템플릿 단건 조회
export const getTemplate = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: '템플릿 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'SELECT * FROM fnco_influencer.mst_campaign_template WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[getTemplate]', error);
    res.status(500).json({ error: '템플릿 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// 템플릿 생성 (캠페인 설정 스냅샷 저장)
export const createTemplate = async (req, res) => {
  try {
    await ensureTable();
    const { name, description, category, config, created_by } = req.body;

    if (!name) {
      return res.status(400).json({ error: '템플릿 이름은 필수입니다.' });
    }

    const result = await pool.query(
      `INSERT INTO fnco_influencer.mst_campaign_template (name, description, category, config, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, category || null, JSON.stringify(config || {}), created_by || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[createTemplate]', error);
    res.status(500).json({ error: '템플릿 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// 템플릿으로 캠페인 생성
export const createCampaignFromTemplate = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { campaign_name } = req.body;

    // 템플릿 조회
    const templateResult = await pool.query(
      'SELECT * FROM fnco_influencer.mst_campaign_template WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
    }

    const template = templateResult.rows[0];
    const config = template.config || {};

    // 캠페인 생성 데이터 구성
    const campaignData = {
      campaign_name: campaign_name || `${template.name} 캠페인`,
      brand_cd: config.brand_cd || '',
      category: config.category || template.category || '',
      subcategory: config.subcategory || '',
      product_name: config.product_name || '',
      country: config.country || '',
      brand_dna: config.brand_dna || {},
      status: 'draft',
    };

    // V2 캠페인 테이블에 직접 삽입
    const insertResult = await pool.query(
      `INSERT INTO mst_campaign
       (campaign_name, brand_cd, category, subcategory, product_name, country, brand_dna, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        campaignData.campaign_name,
        campaignData.brand_cd,
        campaignData.category,
        campaignData.subcategory,
        campaignData.product_name,
        campaignData.country,
        JSON.stringify(campaignData.brand_dna),
        campaignData.status,
      ]
    );

    res.status(201).json({
      success: true,
      data: insertResult.rows[0],
      template_id: template.id,
    });
  } catch (error) {
    console.error('[createCampaignFromTemplate]', error);
    res.status(500).json({ error: '템플릿으로 캠페인 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// 템플릿 삭제
export const deleteTemplate = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: '템플릿 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'DELETE FROM fnco_influencer.mst_campaign_template WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '삭제할 템플릿을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '템플릿이 삭제되었습니다.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[deleteTemplate]', error);
    res.status(500).json({ error: '템플릿 삭제 중 오류가 발생했습니다.', details: error.message });
  }
};
