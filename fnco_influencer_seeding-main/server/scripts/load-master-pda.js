import { pool } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

async function run() {
  try {
    // ── Persona 적재 ──
    const personas = JSON.parse(fs.readFileSync(path.join(uploadsDir, 'persona.json'), 'utf-8'));
    for (const p of personas) {
      await pool.query(
        `INSERT INTO fnco_influencer.mst_persona (code, name, profile_json)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name=$2, profile_json=$3, updated_at=NOW()`,
        [p.persona_id, p.name, JSON.stringify(p.profile_json)]
      );
    }
    console.log('Persona', personas.length, '건 적재 완료');

    // ── Desire 적재 ──
    const desires = JSON.parse(fs.readFileSync(path.join(uploadsDir, 'Desire.json'), 'utf-8'));
    for (const d of desires) {
      const linked = Array.isArray(d['연결_제품군']) ? d['연결_제품군'].join(', ') : (d['연결_제품군'] || null);
      await pool.query(
        `INSERT INTO fnco_influencer.mst_desire (code, name, definition, emotion_trigger, linked_products)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET name=$2, definition=$3, emotion_trigger=$4, linked_products=$5, updated_at=NOW()`,
        [d['코드'], d['욕구명'], d['욕구_정의'], d['감정_트리거'], linked]
      );
    }
    console.log('Desire', desires.length, '건 적재 완료');

    // ── Awareness 적재 ──
    const awareness = JSON.parse(fs.readFileSync(path.join(uploadsDir, 'Awareness.json'), 'utf-8'));
    for (const a of awareness) {
      const hooks = Array.isArray(a['매칭_추천_Hook']) ? a['매칭_추천_Hook'].join(', ') : (a['매칭_추천_Hook'] || null);
      await pool.query(
        `INSERT INTO fnco_influencer.mst_awareness (code, name, funnel, tone, strategy, recommended_hooks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO UPDATE SET name=$2, funnel=$3, tone=$4, strategy=EXCLUDED.strategy, recommended_hooks=$6, updated_at=NOW()`,
        [a['코드'], a['단계명'], a['퍼널'], a['권장_톤'], a['설명'], hooks]
      );
    }
    console.log('Awareness', awareness.length, '건 적재 완료');

    // ── 확인 ──
    const pCnt = await pool.query('SELECT count(*) FROM fnco_influencer.mst_persona');
    const dCnt = await pool.query('SELECT count(*) FROM fnco_influencer.mst_desire');
    const aCnt = await pool.query('SELECT count(*) FROM fnco_influencer.mst_awareness');
    console.log('--- 적재 결과 ---');
    console.log('mst_persona:', pCnt.rows[0].count, '건');
    console.log('mst_desire:', dCnt.rows[0].count, '건');
    console.log('mst_awareness:', aCnt.rows[0].count, '건');
  } catch (err) {
    console.error('오류:', err.message);
  } finally {
    await pool.end();
  }
}

run();
