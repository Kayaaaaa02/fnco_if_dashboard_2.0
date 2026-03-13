import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// 마스터 페르소나 전체 조회
router.get('/personas', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM fnco_influencer.mst_persona WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[masterPda/personas]', err);
        res.status(500).json({ error: err.message });
    }
});

// 마스터 욕구 전체 조회
router.get('/desires', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM fnco_influencer.mst_desire WHERE is_active = true ORDER BY code'
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[masterPda/desires]', err);
        res.status(500).json({ error: err.message });
    }
});

// 마스터 인지단계 전체 조회
router.get('/awareness', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM fnco_influencer.mst_awareness WHERE is_active = true ORDER BY code'
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[masterPda/awareness]', err);
        res.status(500).json({ error: err.message });
    }
});

// 전체 조회 (한 번에)
router.get('/', async (req, res) => {
    try {
        const [personas, desires, awareness] = await Promise.all([
            pool.query(`SELECT * FROM fnco_influencer.mst_persona WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`),
            pool.query(`SELECT * FROM fnco_influencer.mst_desire WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`),
            pool.query(`SELECT * FROM fnco_influencer.mst_awareness WHERE is_active = true ORDER BY CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)`),
        ]);
        res.json({
            success: true,
            data: {
                personas: personas.rows,
                desires: desires.rows,
                awareness: awareness.rows,
            },
        });
    } catch (err) {
        console.error('[masterPda]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
