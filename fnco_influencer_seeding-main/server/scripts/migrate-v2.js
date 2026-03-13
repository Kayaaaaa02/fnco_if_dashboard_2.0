import { pool } from '../src/config/database.js';

const tables = [
    {
        name: 'mst_campaign',
        sql: `
            CREATE TABLE IF NOT EXISTS mst_campaign (
                campaign_id VARCHAR(64) PRIMARY KEY,
                campaign_name VARCHAR(200) NOT NULL,
                brand_cd VARCHAR(50),
                category VARCHAR(100),
                subcategory VARCHAR(100),
                product_name VARCHAR(200),
                country VARCHAR(10) DEFAULT 'KR',
                status VARCHAR(20) DEFAULT 'draft',
                current_phase INTEGER DEFAULT 1,
                brand_dna JSONB,
                scheduled_start DATE,
                scheduled_end DATE,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_by VARCHAR(100),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_deleted BOOLEAN DEFAULT FALSE
            )
        `,
    },
    {
        name: 'mst_pda_persona',
        sql: `
            CREATE TABLE IF NOT EXISTS mst_pda_persona (
                persona_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                code VARCHAR(10) NOT NULL,
                name VARCHAR(100) NOT NULL,
                name_eng VARCHAR(100),
                name_cn VARCHAR(100),
                profile_json JSONB,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            )
        `,
    },
    {
        name: 'mst_pda_desire',
        sql: `
            CREATE TABLE IF NOT EXISTS mst_pda_desire (
                desire_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                code VARCHAR(10) NOT NULL,
                name VARCHAR(100) NOT NULL,
                name_eng VARCHAR(100),
                name_cn VARCHAR(100),
                definition TEXT,
                emotion_trigger TEXT,
                linked_products JSONB,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            )
        `,
    },
    {
        name: 'mst_pda_awareness',
        sql: `
            CREATE TABLE IF NOT EXISTS mst_pda_awareness (
                awareness_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                code VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                name_eng VARCHAR(100),
                name_cn VARCHAR(100),
                strategy TEXT,
                funnel VARCHAR(20),
                tone VARCHAR(50),
                sort_order INTEGER DEFAULT 0
            )
        `,
    },
    {
        name: 'mst_pda_concept',
        sql: `
            CREATE TABLE IF NOT EXISTS mst_pda_concept (
                concept_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                persona_id INTEGER REFERENCES mst_pda_persona(persona_id),
                desire_id INTEGER REFERENCES mst_pda_desire(desire_id),
                awareness_id INTEGER REFERENCES mst_pda_awareness(awareness_id),
                concept_name VARCHAR(200),
                head_copy TEXT,
                copy_type VARCHAR(50),
                tone VARCHAR(50),
                format VARCHAR(50),
                funnel VARCHAR(20),
                campaign_placement VARCHAR(100),
                status VARCHAR(20) DEFAULT 'draft',
                performance_score DECIMAL(5,2),
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
    {
        name: 'dw_campaign_strategy',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_campaign_strategy (
                strategy_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                version INTEGER DEFAULT 1,
                strategy_ko JSONB,
                strategy_eng JSONB,
                strategy_cn JSONB,
                status VARCHAR(20) DEFAULT 'draft',
                approved_by VARCHAR(100),
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                created_by VARCHAR(100)
            )
        `,
    },
    {
        name: 'dw_content_calendar',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_content_calendar (
                calendar_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                concept_id INTEGER REFERENCES mst_pda_concept(concept_id),
                platform VARCHAR(20),
                scheduled_date DATE,
                content_type VARCHAR(50),
                status VARCHAR(20) DEFAULT 'planned',
                assigned_to VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
    {
        name: 'dw_creative',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_creative (
                creative_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                concept_id INTEGER REFERENCES mst_pda_concept(concept_id),
                calendar_id INTEGER REFERENCES dw_content_calendar(calendar_id),
                copy_text TEXT,
                copy_variants JSONB,
                scenario JSONB,
                ai_images JSONB,
                version INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                created_by VARCHAR(100)
            )
        `,
    },
    {
        name: 'dw_campaign_influencer',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_campaign_influencer (
                id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                profile_id VARCHAR(200),
                matched_concepts JSONB,
                match_score DECIMAL(5,2),
                match_reason JSONB,
                status VARCHAR(20) DEFAULT 'suggested',
                deep_analysis JSONB,
                selected_by VARCHAR(100),
                selected_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
    {
        name: 'dw_outreach',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_outreach (
                outreach_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                profile_id VARCHAR(200),
                brief_content JSONB,
                brief_version INTEGER DEFAULT 1,
                email_draft JSONB,
                status VARCHAR(20) DEFAULT 'draft',
                contract_amount DECIMAL(12,2),
                contract_note TEXT,
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
    {
        name: 'dw_launch_schedule',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_launch_schedule (
                schedule_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                creative_id INTEGER REFERENCES dw_creative(creative_id),
                profile_id VARCHAR(200),
                platform VARCHAR(20),
                scheduled_at TIMESTAMP,
                status VARCHAR(20) DEFAULT 'scheduled',
                published_url VARCHAR(500),
                approved_by VARCHAR(100),
                approved_at TIMESTAMP,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
    {
        name: 'dw_performance_metric',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_performance_metric (
                metric_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(64) REFERENCES mst_campaign(campaign_id),
                creative_id INTEGER REFERENCES dw_creative(creative_id),
                concept_id INTEGER REFERENCES mst_pda_concept(concept_id),
                date DATE,
                impressions BIGINT DEFAULT 0,
                reach BIGINT DEFAULT 0,
                clicks BIGINT DEFAULT 0,
                ctr DECIMAL(8,4),
                cpa DECIMAL(12,2),
                roas DECIMAL(8,2),
                engaged_views BIGINT DEFAULT 0,
                conversions INTEGER DEFAULT 0,
                fatigue_score DECIMAL(5,2),
                collected_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
    {
        name: 'dw_audit_log',
        sql: `
            CREATE TABLE IF NOT EXISTS dw_audit_log (
                log_id BIGSERIAL PRIMARY KEY,
                campaign_id VARCHAR(64),
                entity_type VARCHAR(50),
                entity_id VARCHAR(100),
                action VARCHAR(20),
                changes JSONB,
                user_id VARCHAR(100),
                user_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `,
    },
];

const viewSql = `
    CREATE OR REPLACE VIEW vw_pda_heatmap AS
    SELECT
        c.campaign_id,
        p.code AS persona_code,
        p.name AS persona_name,
        d.code AS desire_code,
        d.name AS desire_name,
        a.code AS awareness_code,
        a.name AS awareness_name,
        con.concept_name,
        AVG(m.cpa) AS avg_cpa,
        AVG(m.ctr) AS avg_ctr,
        AVG(m.roas) AS avg_roas,
        SUM(m.conversions) AS total_conversions,
        AVG(m.fatigue_score) AS avg_fatigue
    FROM dw_performance_metric m
    JOIN mst_pda_concept con ON m.concept_id = con.concept_id
    JOIN mst_pda_persona p ON con.persona_id = p.persona_id
    JOIN mst_pda_desire d ON con.desire_id = d.desire_id
    JOIN mst_pda_awareness a ON con.awareness_id = a.awareness_id
    JOIN mst_campaign c ON con.campaign_id = c.campaign_id
    GROUP BY c.campaign_id, p.code, p.name, d.code, d.name, a.code, a.name, con.concept_name
`;

// 기존 테이블에 누락된 컬럼 추가
const alterStatements = [
    {
        name: 'dw_creative.production_guide',
        sql: `ALTER TABLE dw_creative ADD COLUMN IF NOT EXISTS production_guide JSONB`,
    },
];

async function migrateV2() {
    console.log('=== V2 마이그레이션 시작 ===\n');

    try {
        // fnco_influencer 스키마에 테이블 생성
        await pool.query('SET search_path TO fnco_influencer, public');
        console.log('✅ search_path → fnco_influencer\n');

        // 테이블 생성
        for (const table of tables) {
            console.log(`📄 테이블 생성 중: ${table.name}`);
            await pool.query(table.sql);
            console.log(`✅ 완료: ${table.name}\n`);
        }

        // 컬럼 추가 (ALTER TABLE)
        for (const alt of alterStatements) {
            console.log(`📄 컬럼 추가 중: ${alt.name}`);
            await pool.query(alt.sql);
            console.log(`✅ 완료: ${alt.name}\n`);
        }

        // 뷰 생성
        console.log('📄 뷰 생성 중: vw_pda_heatmap');
        await pool.query(viewSql);
        console.log('✅ 완료: vw_pda_heatmap\n');

        console.log('=== V2 마이그레이션 완료 ===');
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error.message);
        console.error(error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrateV2();
