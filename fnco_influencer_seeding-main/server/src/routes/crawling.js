import express from "express";
import {
  batchCrawlingController,
  crawlingController,
  crawlingAPIController,
} from "../controllers/crawlingController.js";

const router = express.Router();

// GET /api/crawling/
router.post("/", crawlingAPIController);

// 새로운 배치 크롤링
router.post("/batch", batchCrawlingController);

export default router;
