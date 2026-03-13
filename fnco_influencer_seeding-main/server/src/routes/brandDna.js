import express from 'express';
import {
    getBrandDnaList,
    getBrandDnaById,
    createBrandDna,
    updateBrandDna,
    deleteBrandDna,
} from '../controllers/brandDnaController.js';

const router = express.Router();

router.get('/', getBrandDnaList);
router.get('/:id', getBrandDnaById);
router.post('/', createBrandDna);
router.put('/:id', updateBrandDna);
router.delete('/:id', deleteBrandDna);

export default router;
