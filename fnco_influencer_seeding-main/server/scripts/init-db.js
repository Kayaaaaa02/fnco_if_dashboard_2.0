import { pool } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDB() {
  console.log('=== 데이터베이스 초기화 시작 ===\n');

  try {
    // schema 폴더의 모든 SQL 파일 실행
    const schemaDir = path.join(__dirname, '../sql/schema');
    const schemaFiles = fs.readdirSync(schemaDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of schemaFiles) {
      console.log(`📄 실행 중: ${file}`);
      const sqlPath = path.join(schemaDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      await pool.query(sql);
      console.log(`✅ 완료: ${file}\n`);
    }

    console.log('=== 데이터베이스 초기화 완료 ===');

  } catch (error) {
    console.error('❌ 초기화 실패:', error.message);
    console.error(error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

initDB();