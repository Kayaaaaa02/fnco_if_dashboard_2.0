// mst_brand_dna 테이블 생성 (최초 1회)
export const createBrandDnaTable = `
    CREATE TABLE IF NOT EXISTS mst_brand_dna (
        brand_dna_id    VARCHAR(64) PRIMARY KEY,
        brand_name      VARCHAR(200) NOT NULL,
        mission         TEXT,
        tone_of_voice   TEXT,
        visual_style    TEXT,
        key_messages    TEXT,
        created_by      VARCHAR(100),
        updated_by      VARCHAR(100),
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW(),
        is_deleted      BOOLEAN DEFAULT false
    )
`;
