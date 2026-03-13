import { pool } from '../src/config/database.js';

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fnco_influencer.dw_influencer_ai_collection_posts_test (
        id BIGSERIAL PRIMARY KEY,
        profile_id VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        post_id VARCHAR(255),
        post_url TEXT,
        post_type VARCHAR(50),
        posted_at TIMESTAMPTZ,
        caption TEXT,
        hashtags JSONB DEFAULT '[]',
        like_count BIGINT DEFAULT 0,
        comment_count BIGINT DEFAULT 0,
        view_count BIGINT DEFAULT 0,
        share_count BIGINT DEFAULT 0,
        thumbnail_url TEXT,
        is_ad BOOLEAN DEFAULT false,
        collected_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_collection_posts_test UNIQUE (profile_id, post_id)
      )
    `);
    console.log('테이블 생성 완료');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_collection_posts_test_profile ON fnco_influencer.dw_influencer_ai_collection_posts_test (profile_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_collection_posts_test_posted ON fnco_influencer.dw_influencer_ai_collection_posts_test (posted_at)');
    console.log('인덱스 생성 완료');

    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='fnco_influencer' AND table_name='dw_influencer_ai_collection_posts_test' ORDER BY ordinal_position");
    console.log('컬럼:');
    cols.rows.forEach(r => console.log(' ', r.column_name, '|', r.data_type));
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}

main();
