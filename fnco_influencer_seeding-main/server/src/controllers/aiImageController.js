import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { pool } from '../config/database.js';
import { update_plan_ai_image_selected_query } from '../sql/aiImage/updateQuery.js';
import { get_plan_ai_images_query } from '../sql/aiImage/selectQuery.js';
import { insert_plan_ai_image_query } from '../sql/aiImage/insertQuery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planImagesUploadDir = path.join(__dirname, '../../uploads/plan-ai-images');
if (!fs.existsSync(planImagesUploadDir)) {
    fs.mkdirSync(planImagesUploadDir, { recursive: true });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/* ──────────────────────────────────────────────
 * Helper: 생성된 이미지 base64 → 디스크 저장 → URL 반환
 * ────────────────────────────────────────────── */
function saveBase64Image(base64Data, planDocId, step, index) {
    const planDir = path.join(planImagesUploadDir, planDocId || 'default');
    if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });

    const filename = `gen_${step}_${Date.now()}_${index}.png`;
    const filePath = path.join(planDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/ai-image/serve/plan/${encodeURIComponent(planDocId || 'default')}/${encodeURIComponent(filename)}`;
}

/* ──────────────────────────────────────────────
 * POST /api/ai-image/generate-prompt
 * Gemini를 사용하여 시나리오 기반 이미지 생성용 프롬프트 자동 생성
 * ────────────────────────────────────────────── */
export const generatePrompt = async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
        }

        // multipart payload 파싱
        let payload = req.body?.payload;
        if (payload != null && Buffer.isBuffer(payload)) payload = payload.toString('utf8');
        const payloadFile = req.files?.payload?.[0];
        if ((payload == null || typeof payload !== 'string') && payloadFile?.buffer) {
            payload = payloadFile.buffer.toString('utf8');
        }
        if (payload == null || typeof payload !== 'string') {
            return res.status(400).json({ error: 'payload가 필요합니다.' });
        }

        let parsed;
        try { parsed = JSON.parse(payload); } catch { return res.status(400).json({ error: 'payload JSON 파싱 실패' }); }

        const { product, step, style } = parsed;
        const productName = product?.product_name || '제품';
        const category = product?.category || '';
        const subcategory = product?.subcategory || '';
        const stepNumber = step?.step_number || 1;
        const stepLabel = step?.step_label || '';
        const visual = step?.visual_action || '';
        const audio = step?.audio_narration || '';
        const emotion = step?.emotion_note || '';
        const selectedStyle = style || '친근함';

        // 업로드된 참고 이미지(제품/모델) 처리
        const uploadedImages = req.files?.images || [];
        const imageParts = [];
        for (const file of uploadedImages) {
            if (file.buffer && file.mimetype?.startsWith('image/')) {
                imageParts.push({
                    inlineData: {
                        mimeType: file.mimetype,
                        data: file.buffer.toString('base64'),
                    },
                });
            }
        }

        const hasImages = imageParts.length > 0;
        const imageContext = hasImages
            ? `\n8. 첨부된 ${imageParts.length}장의 참고 이미지(제품 사진, 모델 사진 등)를 반드시 분석하여 제품 외형, 색상, 질감, 모델 외모/스타일을 프롬프트에 구체적으로 반영`
            : '';

        // Gemini에게 이미지 생성용 프롬프트 작성 요청
        const systemPrompt = `당신은 뷰티/라이프스타일 제품의 SNS 숏폼 영상에 사용할 AI 이미지 생성 프롬프트를 작성하는 전문가입니다.
사용자가 제공하는 제품 정보, 시나리오 STEP, 스타일을 기반으로 영어로 된 상세한 이미지 생성 프롬프트를 작성해주세요.

프롬프트 작성 규칙:
1. 반드시 영어로 작성
2. 스마트폰 셀피/리뷰 영상의 한 장면을 캡처한 듯한 자연스러운 이미지
3. 9:16 세로 비율 (Reels/Shorts 최적화)
4. 제품이 자연스럽게 노출되도록
5. 조명, 배경, 인물 표정, 카메라 앵글을 구체적으로 명시
6. 스타일에 맞는 톤앤무드 반영
7. 프롬프트만 반환 (설명이나 주석 없이)${imageContext}`;

        const userMessage = `제품 정보:
- 카테고리: ${category} > ${subcategory}
- 제품명: ${productName}

시나리오 STEP:
- ${stepLabel} (STEP ${stepNumber})
- Visual/Action: ${visual}
- Audio/Narration: ${audio}
- Emotion/Note: ${emotion}

스타일: ${selectedStyle}
${hasImages ? `\n첨부된 참고 이미지 ${imageParts.length}장을 분석하여 제품 디자인, 모델 외모/스타일을 프롬프트에 반영해주세요.` : ''}
위 정보를 기반으로, 이 STEP에 최적화된 AI 이미지 생성 프롬프트를 영어로 작성해주세요.`;

        const userParts = [...imageParts, { text: systemPrompt + '\n\n' + userMessage }];

        const response = await axios.post(
            `${GEMINI_BASE}/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    { role: 'user', parts: userParts },
                ],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1024,
                },
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );

        const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const prompt = generatedText.trim().replace(/^["']|["']$/g, '');

        if (!prompt) {
            return res.status(502).json({ error: 'Gemini에서 프롬프트를 생성하지 못했습니다.' });
        }

        console.log(`[AI 프롬프트 생성] STEP ${stepNumber}, style: ${selectedStyle}, prompt: ${prompt.slice(0, 80)}...`);
        return res.json({ prompt, prompt_text: prompt });

    } catch (error) {
        console.error('[AI 프롬프트 생성]', error.response?.data || error.message);
        return res.status(500).json({
            error: 'AI 프롬프트 생성 중 오류가 발생했습니다.',
            details: error.response?.data?.error?.message || error.message,
        });
    }
};

/* ──────────────────────────────────────────────
 * POST /api/ai-image/generate-image
 * Gemini 3 Pro Image Preview 로 이미지 생성
 * body: { prompt, step_number, num_images?, plan_doc_id?, created_by? }
 * ────────────────────────────────────────────── */
export const generateImage = async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
        }

        // multipart 또는 JSON 양쪽 지원
        let body = req.body ?? {};
        // multipart인 경우 payload 필드에서 JSON 파싱
        if (body.payload) {
            let raw = body.payload;
            if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
            try { body = { ...body, ...JSON.parse(raw) }; } catch { /* keep body as-is */ }
        }

        const { prompt, step_number, num_images, plan_doc_id, created_by } = body;
        const parsedStepNumber = typeof step_number === 'string' ? Number(step_number) : step_number;
        const parsedNumImages = typeof num_images === 'string' ? Number(num_images) : num_images;

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ error: 'prompt가 필요합니다.' });
        }
        if (parsedStepNumber == null || parsedStepNumber < 1 || parsedStepNumber > 4) {
            return res.status(400).json({ error: 'step_number가 필요합니다 (1~4).' });
        }

        const count = typeof parsedNumImages === 'number' && parsedNumImages > 0 ? Math.min(parsedNumImages, 4) : 4;
        const planDocId = plan_doc_id ? String(plan_doc_id).trim() : `plan_${Date.now()}`;

        // 업로드된 참고 이미지(제품/모델) 처리
        const uploadedImages = req.files?.images || [];
        const refImageParts = [];
        for (const file of uploadedImages) {
            if (file.buffer && file.mimetype?.startsWith('image/')) {
                refImageParts.push({
                    inlineData: {
                        mimeType: file.mimetype,
                        data: file.buffer.toString('base64'),
                    },
                });
            }
        }

        const hasRefImages = refImageParts.length > 0;
        console.log(`[AI 이미지 생성] STEP ${parsedStepNumber}, count: ${count}, refImages: ${refImageParts.length}, prompt: ${prompt.slice(0, 80)}...`);

        // Gemini 3 Pro Image Preview — 이미지 생성
        const refImageNote = hasRefImages
            ? `\n\nREFERENCE IMAGES: ${refImageParts.length} reference image(s) are attached (product photos, model photos). You MUST closely match the product appearance (shape, color, packaging, texture) and model appearance (face, hairstyle, skin tone, style) shown in these references.`
            : '';
        const imagePrompt = `Generate a high-quality vertical (9:16 aspect ratio) photograph for a beauty/lifestyle social media short-form video. The image should look like a real smartphone camera capture, not AI-generated.\n\n${prompt.trim()}${refImageNote}\n\nIMPORTANT: Generate exactly one photorealistic image. Vertical 9:16 ratio. No text overlay. No watermarks.`;

        const images = [];
        const errors = [];

        // 병렬로 count개 이미지 생성 요청
        const userParts = [...refImageParts, { text: imagePrompt }];
        const promises = Array.from({ length: count }, (_, i) =>
            axios.post(
                `${GEMINI_BASE}/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [{ role: 'user', parts: userParts }],
                    generationConfig: {
                        responseModalities: ['IMAGE', 'TEXT'],
                        temperature: 1.0,
                    },
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 180000,
                }
            ).then(async (response) => {
                const parts = response.data?.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                    if (part.inlineData?.mimeType?.startsWith('image/')) {
                        const url = saveBase64Image(part.inlineData.data, planDocId, parsedStepNumber, i);
                        images.push({ id: `img_${parsedStepNumber}_${i}_${Date.now()}`, url, step: parsedStepNumber });

                        // DB에 저장
                        try {
                            const { insertQuery, params } = insert_plan_ai_image_query({
                                plan_doc_id: planDocId,
                                step: parsedStepNumber,
                                img_url: url,
                                created_by: created_by || null,
                            });
                            if (insertQuery && params.length) {
                                await pool.query(insertQuery, params);
                            }
                        } catch (dbErr) {
                            console.warn('[AI 이미지 DB 저장]', dbErr.message);
                        }
                        return;
                    }
                }
                errors.push(`Image ${i}: 이미지 데이터가 응답에 없습니다.`);
            }).catch((err) => {
                console.error(`[AI 이미지 생성 ${i}]`, err.response?.data?.error?.message || err.message);
                errors.push(`Image ${i}: ${err.response?.data?.error?.message || err.message}`);
            })
        );

        await Promise.all(promises);

        if (images.length === 0) {
            return res.status(502).json({
                error: 'AI 이미지 생성에 실패했습니다.',
                details: errors.join('; '),
            });
        }

        console.log(`[AI 이미지 생성] 완료 — ${images.length}개 생성`);
        return res.json({ success: true, images });

    } catch (error) {
        console.error('[AI 이미지 생성]', error.message);
        return res.status(500).json({
            error: 'AI 이미지 생성 중 오류가 발생했습니다.',
            details: error.response?.data?.error?.message || error.message,
        });
    }
};

/* ──────────────────────────────────────────────
 * PATCH /api/ai-image/image/select
 * ────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────
 * GET /api/ai-image/images?plan_doc_id=xxx
 * ────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────
 * POST /api/ai-image/upload
 * ────────────────────────────────────────────── */
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

        if (fastApiUrl) {
            try {
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
                if (response?.status === 200 && response?.data && typeof response.data.url === 'string') {
                    imgUrl = response.data.url.trim();
                }
            } catch (fastApiErr) {
                console.warn('[시나리오 이미지] FastAPI 업로드 실패, 디스크 폴백:', fastApiErr.message);
            }
        }

        if (!imgUrl) {
            const ext = path.extname(file.originalname || '') || '.jpg';
            const safeName = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
            const planDir = path.join(planImagesUploadDir, planDocId);
            if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
            const filePath = path.join(planDir, safeName);
            fs.writeFileSync(filePath, file.buffer);
            const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
            imgUrl = `${baseUrl}/api/ai-image/serve/plan/${encodeURIComponent(planDocId)}/${encodeURIComponent(safeName)}`;
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
        await pool.query(insertQuery, params);

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

/* ──────────────────────────────────────────────
 * GET /api/ai-image/serve/plan/:plan_doc_id/:filename
 * ────────────────────────────────────────────── */
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
