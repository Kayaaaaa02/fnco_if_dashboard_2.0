import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import iconv from 'iconv-lite';
import { pool } from '../config/database.js';
import { insert_data_query } from '../sql/aiPlan/insertQuery.js';
import {
    get_plan_doc_count_query,
    get_completed_plan_doc_count_query,
    get_completed_plan_doc_count_simple_query,
    get_completed_plan_doc_list_query,
    get_uploaded_plan_doc_count_query,
    get_uploaded_plan_doc_list_query,
    get_plan_doc_analysis_query,
    get_plan_issue_top_content_query,
    get_refined_s3_prefix_query,
    get_plan_product_query,
} from '../sql/aiPlan/selectQuery.js';
import {
    update_product_analyzed_status_query,
    update_target_platform_query,
    update_scheduled_dates_query,
    unmark_plan_doc_selected_query,
} from '../sql/aiPlan/updateQuery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 파일명 인코딩 정규화 함수
 * 여러 인코딩(UTF-8, CP949)을 시도하여 올바른 인코딩을 찾습니다.
 * @param {string} filename - 정규화할 파일명
 * @returns {string} - 정규화된 파일명
 */
function normalizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return filename;

    // mojibake 패턴: 잘못된 인코딩으로 인한 깨진 문자 패턴
    // 한글이 깨져서 나타나는 특정 바이트 조합
    const mojibakePattern = /[Ã¡Ã©Ã­Ã³ÃºÃ±Ã§Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã·Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿Â©Â¯]/;

    // 이미 정상적인 UTF-8 문자열인지 확인
    const hasKorean = /[가-힣]/.test(filename);
    if (hasKorean) {
        // 한글이 정상적으로 보이면 그대로 반환
        // 깨진 문자가 섞여있는지 확인
        const hasMojibake = mojibakePattern.test(filename);
        if (!hasMojibake) {
            return filename;
        }
    }

    // 원본 바이트를 얻기 위해 latin1 인코딩 사용 (1바이트 = 1문자)
    // 주의: multer가 이미 잘못 디코딩했다면 원본 복원 불가
    const buffer = Buffer.from(filename, 'latin1');

    // 1. UTF-8로 디코딩 시도
    try {
        const utf8Decoded = buffer.toString('utf8');
        if (/[가-힣]/.test(utf8Decoded) && utf8Decoded !== filename) {
            // 한글이 정상적으로 보이면 반환
            if (!mojibakePattern.test(utf8Decoded)) {
                return utf8Decoded;
            }
        }
    } catch (e) {
        // 디코딩 실패
    }

    // 2. CP949 (EUC-KR)로 디코딩 시도
    try {
        const cp949Decoded = iconv.decode(buffer, 'cp949');
        if (/[가-힣]/.test(cp949Decoded) && cp949Decoded !== filename) {
            // 한글이 정상적으로 보이면 반환
            if (!mojibakePattern.test(cp949Decoded)) {
                return cp949Decoded;
            }
        }
    } catch (e) {
        // 디코딩 실패
    }

    // 모든 시도 실패 시 원본 반환
    return filename;
}

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads/ai-plan');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 파일명 길이 제한 문제 해결: 짧은 고유 파일명 사용
        // 원본 파일명은 DB에 저장하고, 실제 파일은 짧은 이름으로 저장
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase() || '.tmp';

        // 파일명 길이 제한: 최대 100자 (확장자 포함)
        // Linux 파일 시스템 제한(255바이트)을 고려하여 안전하게 설정
        const safeFilename = `file-${uniqueSuffix}${ext}`;
        cb(null, safeFilename);
    },
});

// 파일 필터: PDF, PPT, PPTX만 허용
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('PDF, PPT, PPTX 파일만 업로드 가능합니다.'), false);
    }
};

// Multer 미들웨어 생성
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
    },
});

// AI 플랜 파일 업로드 및 FastAPI 전달 컨트롤러
// contentsController.js의 createPreviewContent 패턴을 따름
export const uploadProductPlan = async (req, res) => {
    try {
        // 1️⃣ 파일 검증
        if (!req.file) {
            return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
        }

        const file = req.file;
        const {
            country,
            brand,
            category,
            subcategory,
            productName,
            marketingKeywords,
            promotionContent,
            user_nm,
            original_filename,
            target_lang,
        } = req.body;

        // FastAPI 서버 URL
        const fastApiUrl = process.env.API_URL;

        if (!fastApiUrl) {
            // 파일 삭제
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(500).json({ error: 'FastAPI 서버 URL이 설정되지 않았습니다.' });
        }

        // 파일명 인코딩 처리
        // 1순위: 클라이언트에서 명시적으로 보낸 original_filename 사용 (UTF-8로 보장됨)
        // 2순위: multer가 받은 파일명을 여러 인코딩으로 시도하여 정규화
        let originalFilename = original_filename || normalizeFilename(file.originalname);

        // 파일명이 깨져있거나 비정상적인 경우 처리
        // 맥북에서 올 때 깨진 문자 패턴 감지
        const mojibakePattern = /[Ã¡Ã©Ã­Ã³ÃºÃ±Ã§Ã£Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã°Ã±Ã²Ã³Ã´ÃµÃ¶Ã·Ã¸Ã¹ÃºÃ»Ã¼Ã½Ã¾Ã¿Â©Â¯]/;
        if (originalFilename && mojibakePattern.test(originalFilename)) {
            // 깨진 문자가 있으면 다시 정규화 시도
            originalFilename = normalizeFilename(originalFilename);
        }

        // 여전히 깨져있거나 비어있으면 기본값 사용
        if (!originalFilename || originalFilename.length === 0 || mojibakePattern.test(originalFilename)) {
            originalFilename = original_filename || 'uploaded_file' + path.extname(file.originalname || '');
        }

        // plan_doc_id 미리 생성 (FastAPI로 전달하기 전)
        const planDocId = `PLAN_${Date.now()}_${Math.round(Math.random() * 1e9)}`;

        // 2️⃣ FastAPI로 파일 전달
        // axios를 사용하여 multipart/form-data 전송
        const axios = (await import('axios')).default;
        const FormData = (await import('form-data')).default;
        const formDataForFastAPI = new FormData();

        // 파일 스트림 추가
        // 원본 파일명을 FastAPI로 전달 (파일 시스템 저장명이 아닌 원본 파일명)
        // 파일 시스템에는 짧은 이름으로 저장했지만, FastAPI에는 원본 파일명 전달
        formDataForFastAPI.append('file', fs.createReadStream(file.path), {
            filename: originalFilename, // 원본 파일명 그대로 전달
            contentType: file.mimetype || 'application/octet-stream',
        });

        // plan_doc_id를 FastAPI로 전달
        formDataForFastAPI.append('plan_doc_id', planDocId);

        if (country) formDataForFastAPI.append('country', country);
        if (brand) formDataForFastAPI.append('brand', brand);
        if (category) formDataForFastAPI.append('category', category);
        if (subcategory) formDataForFastAPI.append('subcategory', subcategory);
        if (productName) formDataForFastAPI.append('product_name', productName);
        if (marketingKeywords) formDataForFastAPI.append('marketing_keywords', marketingKeywords);
        if (promotionContent) formDataForFastAPI.append('promotion_content', promotionContent);
        // 클라이언트 언어 필터 → FastAPI target_lang (ko | eng | cn, 한국 선택 시 번역 스킵)
        formDataForFastAPI.append('target_lang', target_lang || 'ko');

        const requestStartTime = Date.now();

        // FastAPI로 파일 전달
        const response = await axios.post(`${fastApiUrl}/ai-plan/upload`, formDataForFastAPI, {
            headers: {
                ...formDataForFastAPI.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 600000, // 600초(10분) 타임아웃 - Gemini API 분석에 시간이 오래 걸릴 수 있음
            // 요청 진행 상황 추적
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
                    // upload progress
                }
            },
        });

        const requestDuration = ((Date.now() - requestStartTime) / 1000).toFixed(2);

        // FastAPI 응답 확인
        if (!response || response.status !== 200) {
            const errorData = response?.data || { error: 'FastAPI 서버 오류' };

            console.error('[FastAPI 호출 실패]', {
                status: response?.status || 'unknown',
                error: errorData,
                planDocId,
                timestamp: new Date().toISOString(),
            });

            // 파일 삭제
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            return res.status(response?.status || 500).json(errorData);
        }

        const fastApiResult = response.data;

        // 3️⃣ FastAPI 응답 데이터로 DB INSERT 파라미터 구성
        // 파일명 길이 제한 (varchar(50)이므로 최대 50자)
        // 원본 파일명 우선 사용
        let fileName = fastApiResult.data?.filename || fastApiResult.data?.original_filename || originalFilename;
        if (fileName && fileName.length > 50) {
            const ext = path.extname(fileName);
            const nameWithoutExt = path.basename(fileName, ext);
            fileName = nameWithoutExt.substring(0, 50 - ext.length) + ext;
        }

        const insertParam = {
            plan_doc_id: planDocId,
            status: 'uploaded', // 업로드 완료 상태
            file_name: fileName || null,
            file_path: null,
            cntry: country || null,
            brand_cd: brand || null,
            category: category || null,
            subcategory: subcategory || null,
            product_name: productName || null,
            keyword: marketingKeywords || null,
            promotion_text: promotionContent || null,
            user_nm: user_nm || null,
        };

        // DB에 저장
        try {
            const sqlSet = insert_data_query([insertParam]);
            const dbResult = await pool.query(sqlSet.insertQuery);
        } catch (dbError) {
            // DB 저장 실패해도 FastAPI 업로드는 성공했으므로 경고만 출력
            // 필요시 에러를 throw하여 전체 롤백 가능
        }

        // 성공 시 임시 파일 삭제
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // 캠페인에 plan_doc_id 연결
        const campaignId = req.body.campaignId;
        if (campaignId) {
            try {
                await pool.query(
                    `UPDATE mst_campaign SET plan_doc_id = $1, updated_at = NOW() WHERE campaign_id = $2 AND is_deleted = false`,
                    [planDocId, campaignId]
                );
            } catch (linkErr) {
                console.error('[uploadProduct] 캠페인 plan_doc_id 연결 실패:', linkErr.message);
            }
        }

        // 4️⃣ 클라이언트에 응답
        const responseData = {
            success: true,
            message: '파일이 성공적으로 업로드되었습니다.',
            data: {
                ...(fastApiResult?.data || {}),
                plan_doc_id: planDocId,
                productName: productName || null,
                db_inserted: true,
                uploaded_at: new Date().toISOString(),
            },
        };

        res.status(200).json(responseData);
    } catch (error) {
        // 업로드된 파일이 있으면 삭제
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                // 파일 삭제 실패 무시
            }
        }

        // axios 에러 처리
        if (error.response) {
            // FastAPI로부터 에러 응답을 받은 경우
            console.error('[FastAPI 에러 응답]', {
                status: error.response.status,
                data: error.response.data,
                planDocId: req.body?.plan_doc_id || 'unknown',
                timestamp: new Date().toISOString(),
            });
            const errorData = error.response.data || { error: 'FastAPI 서버 오류' };
            return res.status(error.response.status).json(errorData);
        }

        // 네트워크 에러 또는 타임아웃
        if (error.code === 'ECONNABORTED') {
            const requestDuration = error.config?.timeout ? `${error.config.timeout / 1000}초` : 'unknown';
            console.error('[FastAPI 타임아웃]', {
                code: error.code,
                message: error.message,
                planDocId: req.body?.plan_doc_id || planDocId || 'unknown',
                fastApiUrl: `${fastApiUrl}/ai-plan/upload`,
                timeout: requestDuration,
                timestamp: new Date().toISOString(),
                errorDetails: {
                    config: error.config
                        ? {
                              url: error.config.url,
                              method: error.config.method,
                              timeout: error.config.timeout,
                          }
                        : null,
                },
            });
            return res.status(504).json({
                error: 'FastAPI 서버 응답 시간이 초과되었습니다.',
                details: '파일 처리에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.',
                timeout: requestDuration,
            });
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.error('[FastAPI 연결 실패]', {
                code: error.code,
                message: error.message,
                fastApiUrl: process.env.API_URL,
                targetUrl: `${fastApiUrl}/ai-plan/upload`,
                planDocId: req.body?.plan_doc_id || planDocId || 'unknown',
                timestamp: new Date().toISOString(),
                errorDetails: {
                    address: error.address,
                    port: error.port,
                    syscall: error.syscall,
                },
            });
            return res.status(503).json({
                error: 'FastAPI 서버에 연결할 수 없습니다.',
                details: '서버가 실행 중인지 확인해주세요.',
                fastApiUrl: process.env.API_URL,
            });
        }

        // 기타 에러
        console.error('[FastAPI 기타 에러]', {
            error: error.message,
            code: error.code,
            stack: error.stack,
            planDocId: req.body?.plan_doc_id || 'unknown',
            timestamp: new Date().toISOString(),
        });

        res.status(500).json({
            error: '파일 업로드 중 오류가 발생했습니다.',
            details: error.message,
        });
    }
};

// AI 플랜 문서 카운트 조회
export const getPlanDocCount = async (req, res) => {
    try {
        const sqlSet = get_plan_doc_count_query();
        const result = await pool.query(sqlSet.selectQuery);
        const count = result.rows[0]?.count || 0;
        res.json({ count: parseInt(count, 10) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch plan doc count' });
    }
};

// 완료된 기획안 카운트 조회 (기존 공식: sum(refined_ver_no)-count)
export const getCompletedPlanDocCount = async (req, res) => {
    try {
        const sqlSet = get_completed_plan_doc_count_query();
        const result = await pool.query(sqlSet.selectQuery);
        const count = result.rows[0]?.count || 0;
        res.json({ count: parseInt(count, 10) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch completed plan doc count' });
    }
};

// 업로드 완료(status=uploaded) 기획안 건수 (KPI용)
export const getUploadedPlanDocCount = async (req, res) => {
    try {
        const sqlSet = get_uploaded_plan_doc_count_query();
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params || []);
        const count = result.rows[0]?.count || 0;
        res.json({ count: parseInt(count, 10) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch uploaded plan doc count' });
    }
};

// 완료(status=compleate) 기획안 건수 - 단순 COUNT (KPI용)
export const getCompletedPlanDocCountSimple = async (req, res) => {
    try {
        const sqlSet = get_completed_plan_doc_count_simple_query();
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params || []);
        const count = result.rows[0]?.count || 0;
        res.json({ count: parseInt(count, 10) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch completed plan doc count (simple)' });
    }
};

// 업로드 완료(status=uploaded) 기획안 목록 조회 (모달 목록용)
export const getUploadedPlanDocList = async (req, res) => {
    try {
        const sqlSet = get_uploaded_plan_doc_list_query();
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params || []);
        res.json(result.rows || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch uploaded plan doc list' });
    }
};

// 완료된 기획안(status=compleate) 목록 조회 (최종 기획안 완료 건 모달용)
export const getCompletedPlanDocList = async (req, res) => {
    try {
        const sqlSet = get_completed_plan_doc_list_query();
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params || []);
        res.json(result.rows || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch completed plan doc list' });
    }
};

// plan_doc_id로 생성 제품 정보 조회 (category, subcategory, product_name)
export const getPlanProduct = async (req, res) => {
    try {
        const { plan_doc_id } = req.query;

        if (!plan_doc_id) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }

        const sqlSet = get_plan_product_query({ plan_doc_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '제품 정보를 찾을 수 없습니다.' });
        }

        const row = result.rows[0];
        res.json({
            category: row.category ?? row.CATEGORY ?? '',
            subcategory: row.subcategory ?? row.SUBCATEGORY ?? '',
            product_name: row.product_name ?? row.PRODUCT_NAME ?? '',
            target_platform: row.target_platform ?? row.TARGET_PLATFORM ?? 'instagram',
            promotion_text: row.promotion_text ?? row.PROMOTION_TEXT ?? '',
            scheduled_start_date: row.scheduled_start_date ?? row.SCHEDULED_START_DATE ?? null,
            scheduled_end_date: row.scheduled_end_date ?? row.SCHEDULED_END_DATE ?? null,
        });
    } catch (error) {
        console.error('[getPlanProduct]', error);
        res.status(500).json({ error: '제품 정보 조회 중 오류가 발생했습니다.' });
    }
};

// plan_doc_id로 제품 분석 데이터 조회
export const getPlanDocAnalysis = async (req, res) => {
    try {
        const { plan_doc_id } = req.query;

        if (!plan_doc_id) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }

        const sqlSet = get_plan_doc_analysis_query({ plan_doc_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '분석 데이터를 찾을 수 없습니다.' });
        }

        const row = result.rows[0];

        let aiProductInsightAnalysis = null;
        let aiProductInsightAnalysisCn = null;
        let aiProductInsightAnalysisEng = null;
        let aiTop10ReelsPlan = null;
        let aiTop10ReelsPlanCn = null;
        let aiTop10ReelsPlanEng = null;
        let aiContentFormatStrategy = null;
        let aiContentFormatStrategyCn = null;
        let aiContentFormatStrategyEng = null;
        const promotionText = row.promotion_text || null;
        const createdDt = row.created_dt || null;

        // JSON 컬럼 파싱 - ai_product_insight_analysis (한국어)
        if (row.ai_product_insight_analysis) {
            if (typeof row.ai_product_insight_analysis === 'string') {
                aiProductInsightAnalysis = JSON.parse(row.ai_product_insight_analysis);
            } else {
                aiProductInsightAnalysis = row.ai_product_insight_analysis;
            }
        }

        // JSON 컬럼 파싱 - ai_product_insight_analysis_cn (중문)
        if (row.ai_product_insight_analysis_cn) {
            if (typeof row.ai_product_insight_analysis_cn === 'string') {
                aiProductInsightAnalysisCn = JSON.parse(row.ai_product_insight_analysis_cn);
            } else {
                aiProductInsightAnalysisCn = row.ai_product_insight_analysis_cn;
            }
        }

        // JSON 컬럼 파싱 - ai_product_insight_analysis_eng (영문)
        if (row.ai_product_insight_analysis_eng) {
            if (typeof row.ai_product_insight_analysis_eng === 'string') {
                aiProductInsightAnalysisEng = JSON.parse(row.ai_product_insight_analysis_eng);
            } else {
                aiProductInsightAnalysisEng = row.ai_product_insight_analysis_eng;
            }
        }

        // JSON 컬럼 파싱 - ai_top10_reels_plan
        if (row.ai_top10_reels_plan) {
            if (typeof row.ai_top10_reels_plan === 'string') {
                aiTop10ReelsPlan = JSON.parse(row.ai_top10_reels_plan);
            } else {
                aiTop10ReelsPlan = row.ai_top10_reels_plan;
            }
        }

        // JSON 컬럼 파싱 - ai_top10_reels_plan_cn
        if (row.ai_top10_reels_plan_cn) {
            if (typeof row.ai_top10_reels_plan_cn === 'string') {
                aiTop10ReelsPlanCn = JSON.parse(row.ai_top10_reels_plan_cn);
            } else {
                aiTop10ReelsPlanCn = row.ai_top10_reels_plan_cn;
            }
        }

        // JSON 컬럼 파싱 - ai_top10_reels_plan_eng
        if (row.ai_top10_reels_plan_eng) {
            if (typeof row.ai_top10_reels_plan_eng === 'string') {
                aiTop10ReelsPlanEng = JSON.parse(row.ai_top10_reels_plan_eng);
            } else {
                aiTop10ReelsPlanEng = row.ai_top10_reels_plan_eng;
            }
        }

        // JSON 컬럼 파싱 - ai_content_format_strategy
        if (row.ai_content_format_strategy) {
            if (typeof row.ai_content_format_strategy === 'string') {
                aiContentFormatStrategy = JSON.parse(row.ai_content_format_strategy);
            } else {
                aiContentFormatStrategy = row.ai_content_format_strategy;
            }
        }

        // JSON 컬럼 파싱 - ai_content_format_strategy_cn
        if (row.ai_content_format_strategy_cn) {
            if (typeof row.ai_content_format_strategy_cn === 'string') {
                aiContentFormatStrategyCn = JSON.parse(row.ai_content_format_strategy_cn);
            } else {
                aiContentFormatStrategyCn = row.ai_content_format_strategy_cn;
            }
        }

        // JSON 컬럼 파싱 - ai_content_format_strategy_eng
        if (row.ai_content_format_strategy_eng) {
            if (typeof row.ai_content_format_strategy_eng === 'string') {
                aiContentFormatStrategyEng = JSON.parse(row.ai_content_format_strategy_eng);
            } else {
                aiContentFormatStrategyEng = row.ai_content_format_strategy_eng;
            }
        }

        res.json({
            success: true,
            data: {
                plan_doc_id: row.plan_doc_id,
                product_name: row.product_name,
                ai_product_insight_analysis: aiProductInsightAnalysis,
                ai_product_insight_analysis_cn: aiProductInsightAnalysisCn,
                ai_product_insight_analysis_eng: aiProductInsightAnalysisEng,
                ai_top10_reels_plan: aiTop10ReelsPlan,
                ai_top10_reels_plan_cn: aiTop10ReelsPlanCn,
                ai_top10_reels_plan_eng: aiTop10ReelsPlanEng,
                ai_content_format_strategy: aiContentFormatStrategy,
                ai_content_format_strategy_cn: aiContentFormatStrategyCn,
                ai_content_format_strategy_eng: aiContentFormatStrategyEng,
                created_dt: createdDt,
                promotion_text: promotionText,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch plan doc analysis', details: error.message });
    }
};

// plan_doc_id로 refined 데이터 조회 (S3에서 parsed.json 읽기)
export const getRefinedPlanData = async (req, res) => {
    try {
        const { plan_doc_id } = req.query;

        if (!plan_doc_id) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }

        // 1. DB에서 refined_s3_prefix 조회
        const sqlSet = get_refined_s3_prefix_query({ plan_doc_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Refined 데이터를 찾을 수 없습니다.' });
        }

        const refinedS3Prefix = result.rows[0].refined_s3_prefix;

        if (!refinedS3Prefix) {
            return res.status(404).json({ error: 'Refined S3 prefix가 없습니다.' });
        }

        // 2. S3에서 parsed.json 파일 읽기
        const s3BaseUrl = 'https://svc-fnco-influencer-s3.s3.ap-northeast-2.amazonaws.com';
        const s3Url = `${s3BaseUrl}/${refinedS3Prefix}parsed.json`;

        const axios = (await import('axios')).default;
        const response = await axios.get(s3Url, {
            timeout: 30000,
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response || response.status !== 200) {
            throw new Error(`S3 파일 읽기 실패: ${response?.status || 'unknown'}`);
        }

        const parsedData = response.data;

        // 예전 형식으로 통일: { parser_ver, plan_doc_id, generated_at, sections }
        res.json({
            success: true,
            data: parsedData,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch refined plan data',
            details: error.message,
        });
    }
};

// AI 기획안 수정을 위한 FastAPI 호출
export const modifyPlanDocument = async (req, res) => {
    try {
        const { plan_doc_id, selected_plan, promotion_text, channel_insights } = req.body;

        if (!plan_doc_id) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }

        if (!selected_plan) {
            return res.status(400).json({ error: 'selected_plan이 필요합니다.' });
        }

        const fastApiUrl = process.env.API_URL;
        if (!fastApiUrl) {
            return res.status(500).json({ error: 'FastAPI URL이 설정되지 않았습니다.' });
        }

        // FastAPI로 데이터 전달
        const fastApiPayload = {
            plan_doc_id,
            selected_plan,
            promotion_text: promotion_text || null,
            channel_insights: channel_insights || {},
        };

        const axios = (await import('axios')).default;
        const response = await axios.post(`${fastApiUrl}/ai-plan/modify`, fastApiPayload, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 180000, // 180초(3분) 타임아웃
        });

        if (!response || response.status !== 200) {
            throw new Error(`FastAPI 응답 오류: ${response?.status || 'unknown'}`);
        }

        res.json({
            success: true,
            data: response.data,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to modify plan document',
            details: error.message,
        });
    }
};

// plan_doc_id와 platform으로 TOP 콘텐츠 조회
export const getPlanIssueTopContent = async (req, res) => {
    try {
        const { plan_doc_id, platform } = req.query;

        if (!plan_doc_id) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }

        if (!platform) {
            return res.status(400).json({ error: 'platform이 필요합니다.' });
        }

        const sqlSet = get_plan_issue_top_content_query({ plan_doc_id, platform });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        // keyword가 JSON인 경우 파싱, platform은 소문자로 정규화, media_url도 JSON 파싱
        const contents = result.rows.map((row) => {
            let keyword = row.keyword;
            if (typeof keyword === 'string') {
                try {
                    keyword = JSON.parse(keyword);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            let mediaUrl = row.media_url;
            if (typeof mediaUrl === 'string') {
                try {
                    mediaUrl = JSON.parse(mediaUrl);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            // ai_post_summary가 JSON인 경우 파싱
            let aiPostSummary = row.ai_post_summary;
            if (typeof aiPostSummary === 'string') {
                try {
                    aiPostSummary = JSON.parse(aiPostSummary);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            // ai_post_summary_cn이 JSON인 경우 파싱
            let aiPostSummaryCn = row.ai_post_summary_cn;
            if (typeof aiPostSummaryCn === 'string') {
                try {
                    aiPostSummaryCn = JSON.parse(aiPostSummaryCn);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            // ai_post_summary_eng가 JSON인 경우 파싱
            let aiPostSummaryEng = row.ai_post_summary_eng;
            if (typeof aiPostSummaryEng === 'string') {
                try {
                    aiPostSummaryEng = JSON.parse(aiPostSummaryEng);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            // ai_channel_summary가 JSON인 경우 파싱
            let aiChannelSummary = row.ai_channel_summary;
            if (typeof aiChannelSummary === 'string') {
                try {
                    aiChannelSummary = JSON.parse(aiChannelSummary);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            // ai_channel_summary_cn이 JSON인 경우 파싱
            let aiChannelSummaryCn = row.ai_channel_summary_cn;
            if (typeof aiChannelSummaryCn === 'string') {
                try {
                    aiChannelSummaryCn = JSON.parse(aiChannelSummaryCn);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            // ai_channel_summary_eng가 JSON인 경우 파싱
            let aiChannelSummaryEng = row.ai_channel_summary_eng;
            if (typeof aiChannelSummaryEng === 'string') {
                try {
                    aiChannelSummaryEng = JSON.parse(aiChannelSummaryEng);
                } catch (e) {
                    // JSON 파싱 실패 시 그대로 사용
                }
            }

            return {
                ...row,
                keyword: keyword,
                media_url: mediaUrl,
                ai_post_summary: aiPostSummary,
                ai_post_summary_cn: aiPostSummaryCn,
                ai_post_summary_eng: aiPostSummaryEng,
                ai_channel_summary: aiChannelSummary,
                ai_channel_summary_cn: aiChannelSummaryCn,
                ai_channel_summary_eng: aiChannelSummaryEng,
                platform: row.platform ? row.platform.toLowerCase() : row.platform, // platform을 소문자로 정규화
            };
        });

        res.json({
            success: true,
            data: contents,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch plan issue top content', details: error.message });
    }
};

/**
 * Refined 기획안 데이터 업데이트 (수정된 데이터 S3에 저장 + DB 버전 업데이트)
 * POST /api/ai-plan/update-refined
 */
export const updateRefinedPlanData = async (req, res) => {
    try {
        const { plan_doc_id, sections, refined_plan, set_complete } = req.body;
        // set_complete === true: 최종 검수에서 저장 → status = 'compleate' 로 업데이트
        // set_complete !== true: 기획안 수정에서 저장 → status 는 변경하지 않음

        if (!plan_doc_id) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }

        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ error: 'sections 데이터가 필요합니다.' });
        }

        // 1. 현재 버전 조회
        const versionQuery = `
            SELECT refined_ver_no, refined_s3_prefix
            FROM fnco_influencer.mst_plan_doc
            WHERE plan_doc_id = $1
        `;
        const versionResult = await pool.query(versionQuery, [plan_doc_id]);

        if (versionResult.rows.length === 0) {
            return res.status(404).json({ error: 'plan_doc_id를 찾을 수 없습니다.' });
        }

        const currentVersion = versionResult.rows[0].refined_ver_no || 0;
        const s3Prefix = versionResult.rows[0].refined_s3_prefix;
        const newVersion = currentVersion + 1;

        if (!s3Prefix) {
            return res.status(404).json({ error: 'refined_s3_prefix가 없습니다.' });
        }

        // 2. 새 버전의 S3 prefix 생성
        const basePath = s3Prefix.replace(/\/v\d{4}\/$/, '');
        const newS3Prefix = `${basePath}/v${String(newVersion).padStart(4, '0')}/`;

        // 3. 데이터 병합 - 예전 형식으로 통일
        const updatedParsedData = {
            parser_ver: `v${String(newVersion).padStart(4, '0')}`,
            plan_doc_id: plan_doc_id,
            generated_at: new Date().toISOString(),
            sections: sections,
        };

        // 4. S3에 업로드 (FastAPI에 요청)
        const fastApiUrl = process.env.API_URL;
        if (!fastApiUrl) {
            return res.status(500).json({ error: 'FastAPI URL이 설정되지 않았습니다.' });
        }

        const axios = (await import('axios')).default;
        const uploadResponse = await axios.post(
            `${fastApiUrl}/ai-plan/upload-parsed`,
            {
                plan_doc_id: plan_doc_id,
                s3_prefix: newS3Prefix,
                parsed_data: updatedParsedData,
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000,
            }
        );

        if (uploadResponse.status !== 200) {
            throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
        }

        // 5. DB 업데이트 (최종 검수에서만 status = 'compleate' 반영)
        const setStatusClause = set_complete === true ? `, status = 'compleate'` : '';
        const updateQuery = `
            UPDATE fnco_influencer.mst_plan_doc
            SET 
                refined_ver_no = $1,
                refined_s3_prefix = $2,
                refined_updated_at = NOW(),
                ai_status = 'modified'
                ${setStatusClause}
            WHERE plan_doc_id = $3
        `;

        await pool.query(updateQuery, [newVersion, newS3Prefix, plan_doc_id]);

        res.json({
            success: true,
            message: 'Refined 데이터가 성공적으로 업데이트되었습니다.',
            version: newVersion,
            timestamp: Date.now(), // 프론트엔드에서 사용할 타임스탬프
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update refined plan data',
            details: error.message,
        });
    }
};

// AI 제품 분석 & 기획안 저장 완료 상태로 업데이트
export const updateProductAnalyzedStatus = async (req, res) => {
    try {
        const { plan_doc_id } = req.body;

        if (!plan_doc_id) {
            return res.status(400).json({
                error: 'plan_doc_id is required',
            });
        }

        // status를 'product_analyzed'로 업데이트
        const queryData = update_product_analyzed_status_query({ plan_doc_id });
        await pool.query(queryData.updateQuery, queryData.params);

        res.json({
            success: true,
            message: '성공적으로 저장되었습니다.',
            plan_doc_id,
            status: 'product_analyzed',
        });
    } catch (error) {
        console.error('[updateProductAnalyzedStatus 오류]', error);
        res.status(500).json({
            error: 'Failed to update product analyzed status',
            details: error.message,
        });
    }
};

// target_platform 업데이트
export const updateTargetPlatform = async (req, res) => {
    try {
        const { plan_doc_id, target_platform } = req.body;

        if (!plan_doc_id || !target_platform) {
            return res.status(400).json({
                error: 'plan_doc_id and target_platform are required',
            });
        }

        // target_platform 업데이트
        const queryData = update_target_platform_query({ plan_doc_id, target_platform });
        await pool.query(queryData.updateQuery, queryData.params);

        res.json({
            success: true,
            message: '타겟 플랫폼이 성공적으로 업데이트되었습니다.',
            plan_doc_id,
            target_platform,
        });
    } catch (error) {
        console.error('[updateTargetPlatform 오류]', error);
        res.status(500).json({
            error: 'Failed to update target platform',
            details: error.message,
        });
    }
};

// scheduled_start_date, scheduled_end_date 업데이트
export const updateScheduledDates = async (req, res) => {
    try {
        const { plan_doc_id, scheduled_start_date, scheduled_end_date } = req.body;

        if (!plan_doc_id || !scheduled_start_date || !scheduled_end_date) {
            return res.status(400).json({
                error: 'plan_doc_id, scheduled_start_date, and scheduled_end_date are required',
            });
        }

        // 날짜 업데이트
        const queryData = update_scheduled_dates_query({ plan_doc_id, scheduled_start_date, scheduled_end_date });
        await pool.query(queryData.updateQuery, queryData.params);

        res.json({
            success: true,
            message: '게시 기간이 성공적으로 업데이트되었습니다.',
            plan_doc_id,
            scheduled_start_date,
            scheduled_end_date,
        });
    } catch (error) {
        console.error('[updateScheduledDates 오류]', error);
        res.status(500).json({
            error: 'Failed to update scheduled dates',
            details: error.message,
        });
    }
};

// 기획안 삭제 (is_selected를 false로 업데이트)
export const unmarkPlanDocSelected = async (req, res) => {
    try {
        const { plan_doc_id } = req.body;

        if (!plan_doc_id) {
            return res.status(400).json({
                error: 'plan_doc_id is required',
            });
        }

        // is_selected를 false로 업데이트
        const queryData = unmark_plan_doc_selected_query({ plan_doc_id });

        await pool.query(queryData.updateQuery, queryData.params);

        res.json({
            success: true,
            message: '기획안이 성공적으로 삭제되었습니다.',
            plan_doc_id,
        });
    } catch (error) {
        console.error('[unmarkPlanDocSelected 오류]', error);
        res.status(500).json({
            error: 'Failed to unmark plan doc selected',
            details: error.message,
        });
    }
};
