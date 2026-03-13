import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { update_plan_ai_image_selected_query } from '../sql/aiImage/updateQuery.js';
import { get_plan_ai_images_query } from '../sql/aiImage/selectQuery.js';
import { insert_plan_ai_image_query } from '../sql/aiImage/insertQuery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planImagesUploadDir = path.join(__dirname, '../../uploads/plan-ai-images');
if (!fs.existsSync(planImagesUploadDir)) {
    fs.mkdirSync(planImagesUploadDir, { recursive: true });
}

/**
 * AI 프롬프트 생성: 클라이언트 multipart 요청을 FastAPI로 전달
 * POST /api/ai-image/generate-prompt
 * body: multipart { payload: string (JSON), images?: File[] }
 * → FastAPI POST /ai-image/generate-prompt
 */
export const generatePrompt = async (req, res) => {
    try {
        const fastApiUrl = process.env.API_URL;
        if (!fastApiUrl) {
            return res.status(500).json({
                error: 'FastAPI URL이 설정되지 않았습니다.',
                message: 'API_URL 환경 변수를 확인하세요.',
            });
        }

        // multer: 텍스트 필드는 req.body.payload, 일부 환경에서는 buffer로 올 수 있음
        let payload = req.body?.payload;
        if (payload != null && Buffer.isBuffer(payload)) payload = payload.toString('utf8');
        const payloadFile = req.files?.payload?.[0];
        if ((payload == null || typeof payload !== 'string') && payloadFile?.buffer) {
            payload = payloadFile.buffer.toString('utf8');
        }
        if (payload == null || typeof payload !== 'string') {
            return res.status(400).json({
                error: 'payload가 필요합니다.',
                message: 'multipart 필드 "payload" (JSON 문자열)를 보내주세요.',
            });
        }

        const formData = new FormData();
        formData.append('payload', payload);

        const imageFiles = req.files?.images;
        if (Array.isArray(imageFiles) && imageFiles.length > 0) {
            for (const file of imageFiles) {
                formData.append('images', file.buffer, {
                    filename: file.originalname || 'image',
                    contentType: file.mimetype || 'application/octet-stream',
                });
            }
        }

        const axios = (await import('axios')).default;
        const response = await axios.post(`${fastApiUrl}/ai-image/generate-prompt`, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000, // 2분
        });

        if (!response || response.status !== 200) {
            throw new Error(`FastAPI 응답 오류: ${response?.status || 'unknown'}`);
        }

        return res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
        console.error('[AI 이미지 프롬프트 생성]', error.message);
        return res.status(status >= 400 ? status : 500).json({
            error: 'AI 프롬프트 생성 중 오류가 발생했습니다.',
            details: message,
        });
    }
};

/**
 * AI 이미지 생성: 프롬프트 전달 → FastAPI(Imagen) → 이미지 URL 배열 반환
 * POST /api/ai-image/generate-image
 * body: JSON { prompt, step_number, num_images? }
 * → FastAPI POST /ai-image/generate-image
 */
export const generateImage = async (req, res) => {
    try {
        const fastApiUrl = process.env.API_URL;
        if (!fastApiUrl) {
            return res.status(500).json({
                error: 'FastAPI URL이 설정되지 않았습니다.',
                message: 'API_URL 환경 변수를 확인하세요.',
            });
        }

        const { prompt, step_number, num_images, plan_doc_id, created_by } = req.body ?? {};
        if (prompt == null || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({
                error: 'prompt가 필요합니다.',
                message: '프롬프트 문자열을 보내주세요.',
            });
        }
        if (step_number == null || typeof step_number !== 'number' || step_number < 1 || step_number > 4) {
            return res.status(400).json({
                error: 'step_number가 필요합니다 (1~4).',
            });
        }

        // FastAPI로 보낼 JSON body
        const payload = {
            prompt: prompt.trim(),
            step_number,
            num_images: typeof num_images === 'number' && num_images > 0 ? num_images : 4,
            ...(plan_doc_id != null && String(plan_doc_id).trim() ? { plan_doc_id: String(plan_doc_id).trim() } : {}),
            ...(created_by != null && String(created_by).trim() ? { created_by: String(created_by).trim() } : {}),
        };
        // POST body 예: { "prompt": "...", "step_number": 1, "num_images": 4, "plan_doc_id": "...", "created_by": "..." }

        const axios = (await import('axios')).default;
        const response = await axios.post(`${fastApiUrl}/ai-image/generate-image`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 180000, // 3분 (이미지 생성 시간 고려)
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        if (!response || response.status !== 200) {
            throw new Error(`FastAPI 응답 오류: ${response?.status || 'unknown'}`);
        }

        return res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
        console.error('[AI 이미지 생성]', error.message);
        return res.status(status >= 400 ? status : 500).json({
            error: 'AI 이미지 생성 중 오류가 발생했습니다.',
            details: message,
        });
    }
};

/**
 * 생성된 이미지 선택/해제 → dw_plan_ai_image.is_selected 업데이트
 * PATCH /api/ai-image/image/select
 * body: { img_url, is_selected, plan_doc_id?, step? }
 * 이미지 구별: image.url (S3 URL) = DB img_url
 */
export const updateImageSelected = async (req, res) => {
    try {
        const { img_url, is_selected, plan_doc_id, step } = req.body ?? {};
        if (!img_url || typeof img_url !== 'string' || !img_url.trim()) {
            return res.status(400).json({ error: 'img_url이 필요합니다.' });
        }
        const { updateQuery, params } = update_plan_ai_image_selected_query({
            img_url: img_url.trim(),
            is_selected: is_selected === true,
            plan_doc_id: plan_doc_id != null ? String(plan_doc_id) : undefined,
            step: step != null ? Number(step) : undefined,
        });
        if (!updateQuery || !params.length) {
            return res.status(400).json({ error: 'img_url이 유효하지 않습니다.' });
        }
        const result = await pool.query(updateQuery, params);
        return res.json({
            success: true,
            updated: (result.rowCount ?? 0) > 0,
            img_url: img_url.trim(),
        });
    } catch (err) {
        console.error('[AI 이미지 선택 업데이트]', err);
        return res.status(500).json({
            error: '이미지 선택 상태 업데이트 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * plan_doc_id별 STEP(1~4) 이미지 목록 조회 (최종 검수 시나리오 이미지 표시용)
 * GET /api/ai-image/images?plan_doc_id=xxx
 * 응답: { success, data: { 1: [{ url, is_selected }], 2: [], 3: [], 4: [] } }
 */
export const getPlanAiImages = async (req, res) => {
    try {
        const planDocId = req.query?.plan_doc_id;
        if (!planDocId || typeof planDocId !== 'string' || !planDocId.trim()) {
            return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        }
        const { selectQuery, params } = get_plan_ai_images_query({ plan_doc_id: planDocId.trim() });
        if (!selectQuery || !params.length) {
            return res.status(400).json({ error: 'plan_doc_id가 유효하지 않습니다.' });
        }
        const result = await pool.query(selectQuery, params);
        const byStep = { 1: [], 2: [], 3: [], 4: [] };
        (result.rows || []).forEach((row) => {
            const step = row.step;
            if (step >= 1 && step <= 4 && row.img_url) {
                byStep[step].push({ url: row.img_url, is_selected: !!row.is_selected });
            }
        });
        return res.json({ success: true, data: byStep });
    } catch (err) {
        console.error('[AI 이미지 목록 조회]', err);
        return res.status(500).json({
            error: '이미지 목록 조회 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 시나리오 이미지 업로드: FastAPI로 파일 전달 → S3 업로드 → URL 수신 → DB INSERT (is_selected=TRUE)
 * POST /api/ai-image/upload
 * multipart: file (이미지), plan_doc_id, step (1~4), created_by (선택)
 *
 * 플로우: Node가 클라이언트에서 받은 파일을 FastAPI POST /ai-image/upload-image 로 전달
 *         → FastAPI에서 S3 업로드 후 { url } 반환 (구조 통일)
 *         → Node는 반환된 URL로 dw_plan_ai_image INSERT만 수행
 * FastAPI 미구현/실패 시: 서버 디스크 저장 + 기존 serve URL로 폴백
 */
export const uploadPlanImage = async (req, res) => {
    try {
        const file = req.file;
        if (!file || !file.buffer) {
            return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
        }
        const planDocId = (req.body?.plan_doc_id ?? req.body?.plan_doc_id?.[0])?.trim?.() || '';
        const stepRaw = req.body?.step ?? req.body?.step?.[0];
        const step = stepRaw != null ? Number(stepRaw) : NaN;
        const createdBy = (req.body?.created_by ?? req.body?.created_by?.[0])?.trim?.() || null;

        if (!planDocId) return res.status(400).json({ error: 'plan_doc_id가 필요합니다.' });
        if (!Number.isInteger(step) || step < 1 || step > 4) {
            return res.status(400).json({ error: 'step은 1~4 사이 숫자여야 합니다.' });
        }

        let imgUrl = null;
        const fastApiUrl = process.env.API_URL;

        // 1) FastAPI에서 S3 업로드 처리 (구조 통일: 업로드는 FastAPI 담당)
        if (fastApiUrl) {
            try {
                const axios = (await import('axios')).default;
                const form = new FormData();
                form.append('file', file.buffer, {
                    filename: file.originalname || `image_${step}_${Date.now()}.jpg`,
                    contentType: file.mimetype || 'image/jpeg',
                });
                form.append('plan_doc_id', planDocId);
                form.append('step', String(step));
                if (createdBy) form.append('created_by', createdBy);

                const response = await axios.post(`${fastApiUrl}/ai-image/upload-image`, form, {
                    headers: form.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 60000,
                });
                // FastAPI 성공(200): Body = { "url": "https://...s3.../..." } → response.data.url 사용
                if (response?.status === 200 && response?.data && typeof response.data.url === 'string') {
                    imgUrl = response.data.url.trim();
                }
            } catch (fastApiErr) {
                console.warn('[시나리오 이미지] FastAPI 업로드 실패, 디스크 폴백:', fastApiErr.message);
            }
        }

        // 2) FastAPI 미사용/실패 시: 서버 디스크 저장 후 serve URL 사용 (폴백)
        if (!imgUrl) {
            const ext = path.extname(file.originalname || '') || '.jpg';
            const safeName = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
            const planDir = path.join(planImagesUploadDir, planDocId);
            if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
            const filePath = path.join(planDir, safeName);
            fs.writeFileSync(filePath, file.buffer);
            const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
            imgUrl = `${baseUrl}/api/ai-image/serve/plan/${encodeURIComponent(planDocId)}/${encodeURIComponent(
                safeName
            )}`;
        }

        const { insertQuery, params } = insert_plan_ai_image_query({
            plan_doc_id: planDocId,
            step,
            img_url: imgUrl,
            created_by: createdBy,
        });
        if (!insertQuery || !params.length) {
            return res.status(400).json({ error: 'DB INSERT 파라미터가 유효하지 않습니다.' });
        }
        const insertResult = await pool.query(insertQuery, params);

        return res.status(201).json({
            success: true,
            url: imgUrl,
            step,
            plan_doc_id: planDocId,
        });
    } catch (err) {
        console.error('[시나리오 이미지 업로드]', err);
        return res.status(500).json({
            error: '이미지 업로드 중 오류가 발생했습니다.',
            details: err.message,
        });
    }
};

/**
 * 업로드된 시나리오 이미지 파일 서빙
 * GET /api/ai-image/serve/plan/:plan_doc_id/:filename
 */
export const servePlanImage = async (req, res) => {
    try {
        const planDocId = req.params?.plan_doc_id;
        const filename = req.params?.filename;
        if (!planDocId || !filename) {
            return res.status(404).end();
        }
        const safePlan = path.basename(planDocId);
        const safeFile = path.basename(filename);
        const filePath = path.join(planImagesUploadDir, safePlan, safeFile);
        if (!path.resolve(filePath).startsWith(path.resolve(planImagesUploadDir)) || !fs.existsSync(filePath)) {
            return res.status(404).end();
        }
        res.sendFile(filePath);
    } catch (err) {
        console.error('[시나리오 이미지 서빙]', err);
        res.status(500).end();
    }
};
