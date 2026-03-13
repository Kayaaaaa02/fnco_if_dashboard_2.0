import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_channel_setup (
    setup_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50),
    page_config JSONB DEFAULT '{}',
    pricing JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
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

// 채널 설정 목록 조회
export const getChannelSetups = async (req, res) => {
  try {
    await ensureTable();
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_channel_setup WHERE campaign_id = $1 ORDER BY created_at ASC',
      [campaignId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[getChannelSetups]', error);
    res.status(500).json({ error: '채널 설정 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// AI 채널 자동 생성 (Mock)
export const generateChannelSetup = async (req, res) => {
  try {
    await ensureTable();
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    // Delete existing setups for this campaign before generating new ones
    await pool.query(
      'DELETE FROM fnco_influencer.dw_channel_setup WHERE campaign_id = $1',
      [campaignId]
    );

    const channels = [
      {
        campaign_id: campaignId,
        channel_type: 'ecommerce',
        platform: 'naver_smartstore',
        page_config: {
          title: '[브랜드] 공식 스마트스토어',
          description: '공식 스마트스토어에서 정품을 만나보세요. 빠른 배송과 특별한 혜택을 제공합니다.',
          features: ['무료배송', '정품보증', '오늘출발'],
          seo_keywords: ['뷰티', '스킨케어', 'K-Beauty'],
        },
        pricing: {
          original_price: 39000,
          sale_price: 29900,
          discount_rate: 23,
          promo_code: 'LAUNCH20',
        },
        status: 'draft',
        created_by: 'ai_generator',
      },
      {
        campaign_id: campaignId,
        channel_type: 'ecommerce',
        platform: 'coupang',
        page_config: {
          title: '[브랜드] 쿠팡 공식관',
          description: '쿠팡 로켓배송으로 빠르게 받아보세요. 공식 판매 채널입니다.',
          features: ['로켓배송', '무료반품', '쿠팡 최저가'],
          seo_keywords: ['뷰티', '화장품', '로켓배송'],
        },
        pricing: {
          original_price: 39000,
          sale_price: 31200,
          discount_rate: 20,
          promo_code: 'CPLAUNCH',
        },
        status: 'draft',
        created_by: 'ai_generator',
      },
      {
        campaign_id: campaignId,
        channel_type: 'social',
        platform: 'instagram_shop',
        page_config: {
          title: '[브랜드] 인스타그램 쇼핑',
          description: '인스타그램에서 바로 구매하세요. 인플루언서 추천 제품을 쉽게 만나보세요.',
          features: ['바로구매', '제품태그', '스토리 연동'],
          product_tags: ['#뷰티', '#스킨케어', '#추천템'],
        },
        pricing: {
          original_price: 39000,
          sale_price: 35100,
          discount_rate: 10,
          promo_code: 'INSTA10',
        },
        status: 'draft',
        created_by: 'ai_generator',
      },
    ];

    const inserted = [];
    for (const ch of channels) {
      const result = await pool.query(
        `INSERT INTO fnco_influencer.dw_channel_setup
         (campaign_id, channel_type, platform, page_config, pricing, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          ch.campaign_id,
          ch.channel_type,
          ch.platform,
          JSON.stringify(ch.page_config),
          JSON.stringify(ch.pricing),
          ch.status,
          ch.created_by,
        ]
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      data: inserted,
    });
  } catch (error) {
    console.error('[generateChannelSetup]', error);
    res.status(500).json({ error: '채널 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// 채널 설정 수정
export const updateChannelSetup = async (req, res) => {
  try {
    await ensureTable();
    const { setupId } = req.params;
    const { page_config, pricing, status } = req.body;

    if (!setupId) {
      return res.status(400).json({ error: '설정 ID가 필요합니다.' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (page_config !== undefined) {
      fields.push(`page_config = $${idx++}`);
      values.push(JSON.stringify(page_config));
    }
    if (pricing !== undefined) {
      fields.push(`pricing = $${idx++}`);
      values.push(JSON.stringify(pricing));
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: '수정할 필드가 없습니다.' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(setupId);

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_channel_setup SET ${fields.join(', ')} WHERE setup_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '채널 설정을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[updateChannelSetup]', error);
    res.status(500).json({ error: '채널 설정 수정 중 오류가 발생했습니다.', details: error.message });
  }
};

// 채널 설정 삭제
export const deleteChannelSetup = async (req, res) => {
  try {
    await ensureTable();
    const { setupId } = req.params;

    if (!setupId) {
      return res.status(400).json({ error: '설정 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'DELETE FROM fnco_influencer.dw_channel_setup WHERE setup_id = $1 RETURNING *',
      [setupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '삭제할 채널 설정을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '채널 설정이 삭제되었습니다.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[deleteChannelSetup]', error);
    res.status(500).json({ error: '채널 설정 삭제 중 오류가 발생했습니다.', details: error.message });
  }
};
