import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 원하는 경로 지정
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    ssl: {
        rejectUnauthorized: false,
    },
});

// fnco_influencer 스키마를 기본으로 사용
pool.on('connect', (client) => {
    client.query('SET search_path TO fnco_influencer, public');
});

// 연결 테스트
export const testConnection = async () => {
    try {
        const client = await pool.connect();
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};
