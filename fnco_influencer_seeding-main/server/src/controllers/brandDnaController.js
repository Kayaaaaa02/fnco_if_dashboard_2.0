import { pool } from '../config/database.js';
import { createBrandDnaTable } from '../sql/brandDna/initTable.js';
import { selectBrandDnaList, selectBrandDnaById } from '../sql/brandDna/selectQuery.js';
import { insertBrandDna } from '../sql/brandDna/insertQuery.js';
import { updateBrandDna as updateBrandDnaQuery } from '../sql/brandDna/updateQuery.js';
import { softDeleteBrandDna } from '../sql/brandDna/deleteQuery.js';

// 테이블 자동 생성 (서버 기동 시 1회)
(async () => {
    try {
        await pool.query(createBrandDnaTable);
    } catch (err) {
        console.error('[mst_brand_dna] 테이블 생성 실패:', err.message);
    }
})();

// 목록 조회
export const getBrandDnaList = async (req, res) => {
    try {
        const sqlSet = selectBrandDnaList();
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('[getBrandDnaList]', error);
        res.status(500).json({ error: '브랜드 DNA 목록 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 단건 조회
export const getBrandDnaById = async (req, res) => {
    try {
        const { id } = req.params;
        const sqlSet = selectBrandDnaById(id);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '브랜드 DNA를 찾을 수 없습니다.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[getBrandDnaById]', error);
        res.status(500).json({ error: '브랜드 DNA 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 생성
export const createBrandDna = async (req, res) => {
    try {
        const { brand_name, mission, tone_of_voice, visual_style, key_messages, created_by } = req.body;
        if (!brand_name) {
            return res.status(400).json({ error: 'brand_name이 필요합니다.' });
        }
        const brand_dna_id = `BDNA_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const sqlSet = insertBrandDna({ brand_dna_id, brand_name, mission, tone_of_voice, visual_style, key_messages, created_by });
        const result = await pool.query(sqlSet.insertQuery, sqlSet.params);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[createBrandDna]', error);
        res.status(500).json({ error: '브랜드 DNA 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 수정
export const updateBrandDna = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (!id) return res.status(400).json({ error: 'brand_dna_id가 필요합니다.' });
        if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: '업데이트할 필드가 필요합니다.' });

        const sqlSet = updateBrandDnaQuery(id, data);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);
        if (result.rows.length === 0) return res.status(404).json({ error: '브랜드 DNA를 찾을 수 없습니다.' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[updateBrandDna]', error);
        res.status(500).json({ error: '브랜드 DNA 수정 중 오류가 발생했습니다.', details: error.message });
    }
};

// 삭제 (소프트)
export const deleteBrandDna = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'brand_dna_id가 필요합니다.' });

        const sqlSet = softDeleteBrandDna(id);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);
        if (result.rows.length === 0) return res.status(404).json({ error: '브랜드 DNA를 찾을 수 없습니다.' });
        res.json({ success: true, message: '브랜드 DNA가 삭제되었습니다.', brand_dna_id: id });
    } catch (error) {
        console.error('[deleteBrandDna]', error);
        res.status(500).json({ error: '브랜드 DNA 삭제 중 오류가 발생했습니다.', details: error.message });
    }
};
