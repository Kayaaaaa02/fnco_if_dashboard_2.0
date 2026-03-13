import { pool } from '../config/database.js';

// Auto-create tables on first use
const CREATE_UGC_CONTENT_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_ugc_content (
    ugc_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    source_platform VARCHAR(50),
    source_url TEXT,
    creator_handle VARCHAR(100),
    content_text TEXT,
    content_type VARCHAR(30),
    quality_score NUMERIC(3,1),
    sentiment_score NUMERIC(3,2),
    engagement_count INT DEFAULT 0,
    permission_status VARCHAR(20) DEFAULT 'pending',
    amplify_status VARCHAR(20) DEFAULT 'none',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_UGC_CREATOR_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_ugc_creator (
    creator_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    handle VARCHAR(100),
    name VARCHAR(100),
    platform VARCHAR(50),
    ugc_count INT DEFAULT 0,
    avg_quality_score NUMERIC(3,1) DEFAULT 0,
    total_engagement INT DEFAULT 0,
    influencer_potential VARCHAR(20) DEFAULT 'low',
    profile_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

let tableCreated = false;

async function ensureTable() {
  if (!tableCreated) {
    await pool.query(CREATE_UGC_CONTENT_TABLE);
    await pool.query(CREATE_UGC_CREATOR_TABLE);
    tableCreated = true;
  }
}

// UGC 콘텐츠 목록 조회
export const getUGCContent = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_ugc_content WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[getUGCContent]', error);
    res.status(500).json({ error: 'UGC 콘텐츠 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// UGC 수확 (Mock 데이터 생성)
export const harvestUGC = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    // 기존 데이터 삭제
    await pool.query('DELETE FROM fnco_influencer.dw_ugc_content WHERE campaign_id = $1', [campaignId]);
    await pool.query('DELETE FROM fnco_influencer.dw_ugc_creator WHERE campaign_id = $1', [campaignId]);

    const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Blog'];
    const contentTypes = ['image', 'video', 'reel', 'story', 'review'];
    const permissionStatuses = ['pending', 'requested', 'granted', 'denied'];
    const amplifyStatuses = ['none', 'ad_creative', 'detail_page', 'repost'];

    const handles = [
      '@beauty_jin', '@skin_lover22', '@glow_up_mina', '@daily_beauty_',
      '@cosmetic_queen', '@skincare_hana', '@makeup_soyeon', '@beauty_review_kr',
      '@glow_diary_', '@skin_routine_su', '@pretty_log', '@beauty_tip_jy',
    ];

    const names = [
      '김진아', '이수연', '박미나', '최하은',
      '정소희', '한유진', '서연주', '오지영',
      '윤수빈', '임서현', '강예린', '조유나',
    ];

    const contentTexts = [
      '이 세럼 진짜 미쳤어요... 3일 만에 피부결 달라짐 느꼈어요 ㅠㅠ',
      '요즘 매일 아침 이것만 바르는데 촉촉함이 하루종일 유지돼요!',
      '솔직후기) 처음엔 반신반의했는데 지금은 3통째 리피트 중 ㅋㅋ',
      '민감성 피부인데 자극 없이 순하게 흡수되네요 👍',
      '겨울철 건조함 때문에 고민이었는데 이거 하나로 해결됐어요',
      '친구가 추천해줘서 써봤는데 진짜 피부톤 정리되는 느낌!',
      '메이크업 전에 바르면 화장이 훨씬 잘 먹어요 꿀팁!',
      '약사 친구가 성분 좋다고 해서 구매했는데 역시나 대만족',
      '피부과 시술 후 진정용으로 쓰는데 너무 좋아요',
      '남자친구도 같이 쓰는 중... 커플 스킨케어 아이템으로 추천!',
      '여드름 흉터 부위에 집중적으로 발랐더니 확실히 좋아졌어요',
      '아침 루틴에 딱 맞는 제품! 가볍고 흡수 빠름',
      '향이 진짜 좋아서 바를 때마다 기분 좋아져요 🌸',
      '1+1 행사 때 샀는데 벌써 재구매 고민 중',
      '엄마도 쓰시는데 피부가 좋아졌다고 주변에 소문내고 다니심 ㅋㅋ',
      '여행 갈 때 이것만 챙겨가면 끝! 올인원 느낌',
      '블로그에 리뷰 올렸더니 댓글이 폭발했어요',
      '인스타 스토리에 올렸더니 DM이 쏟아짐... 이건 진짜 맛집템',
      '첫 구매인데 앞으로 쭉 쓸 것 같아요. 인생템 등극!',
      '성분표 확인해보니 자연유래 성분 위주라 안심이에요',
      '바르자마자 흡수되는 텍스처가 너무 좋음',
      '유튜브에서 추천 많이 보고 샀는데 후회 없어요',
      '건조한 사무실에서도 하루종일 촉촉하게 유지됨!',
      '가성비 최고... 이 가격에 이 효과는 사기급',
      '파데 전에 이거 바르면 무너짐 없이 하루종일 지속돼요',
    ];

    // 15~25개 UGC 아이템 생성
    const ugcCount = 15 + Math.floor(Math.random() * 11);
    const insertedContent = [];

    for (let i = 0; i < ugcCount; i++) {
      const handleIdx = Math.floor(Math.random() * handles.length);
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const qualityScore = (1.0 + Math.random() * 9.0).toFixed(1);
      const sentimentScore = Math.random().toFixed(2);
      const engagementCount = 50 + Math.floor(Math.random() * 49950);
      const permissionStatus = permissionStatuses[Math.floor(Math.random() * permissionStatuses.length)];
      const amplifyStatus = amplifyStatuses[Math.floor(Math.random() * amplifyStatuses.length)];
      const contentText = contentTexts[i % contentTexts.length];
      const handle = handles[handleIdx];

      const result = await pool.query(
        `INSERT INTO fnco_influencer.dw_ugc_content
         (campaign_id, source_platform, source_url, creator_handle, content_text, content_type,
          quality_score, sentiment_score, engagement_count, permission_status, amplify_status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          campaignId,
          platform,
          `https://${platform.toLowerCase()}.com/p/${Date.now()}_${i}`,
          handle,
          contentText,
          contentType,
          qualityScore,
          sentimentScore,
          engagementCount,
          permissionStatus,
          amplifyStatus,
          JSON.stringify({ harvested_at: new Date().toISOString(), source: 'mock' }),
        ]
      );
      insertedContent.push(result.rows[0]);
    }

    // 크리에이터 집계: creator_handle 기준으로 그룹핑
    const creatorAgg = {};
    for (const item of insertedContent) {
      const h = item.creator_handle;
      if (!creatorAgg[h]) {
        creatorAgg[h] = {
          handle: h,
          platform: item.source_platform,
          ugcCount: 0,
          totalQuality: 0,
          totalEngagement: 0,
        };
      }
      creatorAgg[h].ugcCount += 1;
      creatorAgg[h].totalQuality += parseFloat(item.quality_score);
      creatorAgg[h].totalEngagement += item.engagement_count;
    }

    const insertedCreators = [];
    for (const [handle, agg] of Object.entries(creatorAgg)) {
      const avgQuality = (agg.totalQuality / agg.ugcCount).toFixed(1);
      const handleIdx = handles.indexOf(handle);
      const name = handleIdx >= 0 ? names[handleIdx] : '익명';

      let potential = 'low';
      if (agg.totalEngagement > 20000) potential = 'high';
      else if (agg.totalEngagement > 5000) potential = 'medium';

      const result = await pool.query(
        `INSERT INTO fnco_influencer.dw_ugc_creator
         (campaign_id, handle, name, platform, ugc_count, avg_quality_score, total_engagement, influencer_potential)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [campaignId, handle, name, agg.platform, agg.ugcCount, avgQuality, agg.totalEngagement, potential]
      );
      insertedCreators.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      data: {
        content: insertedContent,
        creators: insertedCreators,
        summary: {
          total_ugc: insertedContent.length,
          total_creators: insertedCreators.length,
        },
      },
    });
  } catch (error) {
    console.error('[harvestUGC]', error);
    res.status(500).json({ error: 'UGC 수확 중 오류가 발생했습니다.', details: error.message });
  }
};

// 권한 상태 업데이트
export const updatePermission = async (req, res) => {
  try {
    await ensureTable();
    const { ugcId } = req.params;
    const { permission_status } = req.body;

    if (!ugcId) {
      return res.status(400).json({ error: 'UGC ID가 필요합니다.' });
    }

    if (!permission_status || !['pending', 'requested', 'granted', 'denied'].includes(permission_status)) {
      return res.status(400).json({ error: "유효한 permission_status가 필요합니다. ('pending', 'requested', 'granted', 'denied')" });
    }

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_ugc_content
       SET permission_status = $1
       WHERE ugc_id = $2
       RETURNING *`,
      [permission_status, ugcId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 UGC 콘텐츠를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[updatePermission]', error);
    res.status(500).json({ error: '권한 상태 업데이트 중 오류가 발생했습니다.', details: error.message });
  }
};

// 증폭 상태 업데이트
export const updateAmplify = async (req, res) => {
  try {
    await ensureTable();
    const { ugcId } = req.params;
    const { amplify_status } = req.body;

    if (!ugcId) {
      return res.status(400).json({ error: 'UGC ID가 필요합니다.' });
    }

    if (!amplify_status || !['none', 'ad_creative', 'detail_page', 'repost'].includes(amplify_status)) {
      return res.status(400).json({ error: "유효한 amplify_status가 필요합니다. ('none', 'ad_creative', 'detail_page', 'repost')" });
    }

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_ugc_content
       SET amplify_status = $1
       WHERE ugc_id = $2
       RETURNING *`,
      [amplify_status, ugcId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 UGC 콘텐츠를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[updateAmplify]', error);
    res.status(500).json({ error: '증폭 상태 업데이트 중 오류가 발생했습니다.', details: error.message });
  }
};

// 크리에이터 목록 조회
export const getCreators = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ error: '캠페인 ID가 필요합니다.' });
    }

    const result = await pool.query(
      'SELECT * FROM fnco_influencer.dw_ugc_creator WHERE campaign_id = $1 ORDER BY total_engagement DESC',
      [campaignId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[getCreators]', error);
    res.status(500).json({ error: '크리에이터 목록 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// 크리에이터 인플루언서 전환
export const convertCreator = async (req, res) => {
  try {
    await ensureTable();
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({ error: '크리에이터 ID가 필요합니다.' });
    }

    const result = await pool.query(
      `UPDATE fnco_influencer.dw_ugc_creator
       SET influencer_potential = 'converted'
       WHERE creator_id = $1
       RETURNING *`,
      [creatorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 크리에이터를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '크리에이터가 인플루언서로 전환되었습니다.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[convertCreator]', error);
    res.status(500).json({ error: '크리에이터 전환 중 오류가 발생했습니다.', details: error.message });
  }
};
