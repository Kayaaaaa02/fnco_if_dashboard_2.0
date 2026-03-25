import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.join(__dirname, '../../uploads/generated-videos');
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const KLING_ACCESS_KEY = process.env.KLING_API_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_API_SECRET_KEY;
const KLING_BASE = 'https://api.klingai.com';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/* ── Kling JWT 토큰 ── */
function generateKlingToken() {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) return null;
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
        { iss: KLING_ACCESS_KEY, exp: now + 1800, nbf: now - 5, iat: now },
        KLING_SECRET_KEY,
        { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } }
    );
}

function getKlingHeaders() {
    const token = generateKlingToken();
    if (!token) return null;
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/* ── 나레이션 텍스트에서 자막용 순수 텍스트 추출 ── */
function extractSubtitleText(narration) {
    if (!narration || typeof narration !== 'string') return '';
    // (NAR) "텍스트" 패턴 추출
    const narMatches = narration.match(/\(NAR\)\s*"([^"]+)"/g);
    if (narMatches && narMatches.length > 0) {
        return narMatches
            .map((m) => m.replace(/\(NAR\)\s*"/, '').replace(/"$/, '').trim())
            .join(' ');
    }
    // (Effect) 등 태그 제거 후 반환
    let clean = narration
        .replace(/\(Effect\)[^+\n]*/gi, '')
        .replace(/\(NAR\)\s*/gi, '')
        .replace(/["""]/g, '')
        .replace(/\+/g, '')
        .trim();
    return clean || '';
}

/* ── 이미지 URL → 순수 base64 문자열 (data URI prefix 없이) ── */
async function imageUrlToBase64(imgUrl) {
    if (imgUrl.startsWith('http://localhost') || imgUrl.startsWith(process.env.BASE_URL || '')) {
        const urlPath = new URL(imgUrl).pathname;
        const match = urlPath.match(/\/api\/ai-image\/serve\/plan\/([^/]+)\/(.+)/);
        if (match) {
            const srcPath = path.join(__dirname, '../../uploads/plan-ai-images', decodeURIComponent(match[1]), decodeURIComponent(match[2]));
            if (fs.existsSync(srcPath)) {
                const buf = fs.readFileSync(srcPath);
                return buf.toString('base64');
            }
        }
    }
    const res = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(res.data).toString('base64');
}

/* ── URL → 로컬 파일 다운로드 ── */
async function downloadFile(url, destPath, timeout = 120000) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
}

/* ── Kling 단일 이미지 → 영상 생성 + 폴링 ── */
async function klingImageToVideo(headers, imageBase64, prompt, duration) {
    const body = {
        model_name: 'kling-v2-master',
        image: imageBase64,
        mode: 'std',
        duration: String(duration),
        cfg_scale: 0.5,
    };
    if (prompt) body.prompt = prompt;
    body.negative_prompt = 'blurry, distorted face, deformed hands, extra fingers, unnatural movement, jittery, low quality, watermark, text overlay, morphing artifacts, flickering, temporal inconsistency, face morphing, identity change, sudden jump cuts';

    let createRes;
    try {
        createRes = await axios.post(`${KLING_BASE}/v1/videos/image2video`, body, { headers, timeout: 30000 });
    } catch (err) {
        const detail = err.response?.data ? JSON.stringify(err.response.data).slice(0, 300) : err.message;
        console.error(`[Kling] I2V 요청 실패 (${err.response?.status}):`, detail);
        throw new Error(`Kling I2V ${err.response?.status}: ${detail}`);
    }

    const taskId = createRes.data?.data?.task_id;
    if (!taskId) throw new Error('Kling task_id 없음: ' + JSON.stringify(createRes.data).slice(0, 200));

    // 폴링 (최대 10분, 10초 간격)
    for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 10000));
        const statusRes = await axios.get(
            `${KLING_BASE}/v1/videos/image2video/${taskId}`,
            { headers, timeout: 15000 }
        );
        const data = statusRes.data?.data;
        if (data?.task_status === 'succeed') {
            const videos = data?.task_result?.videos || [];
            if (videos.length > 0) return { url: videos[0].url, duration: videos[0].duration, taskId };
            throw new Error('Kling 영상 결과 비어있음');
        }
        if (data?.task_status === 'failed') {
            throw new Error(`Kling 실패: ${data?.task_status_msg || 'unknown'}`);
        }
        if (i % 3 === 0) console.log(`[Kling] task ${taskId} 폴링 ${i + 1}/60 — ${data?.task_status}`);
    }
    throw new Error('Kling 타임아웃 (10분 초과)');
}

/* ══════════════════════════════════════════════════
 * POST /api/v2/video/generate
 *
 * 전체 플로우:
 *  1) STEP별 Kling Image-to-Video 생성 (병렬)
 *  2) STEP별 나레이션 오디오 다운로드
 *  3) Python moviepy concat_video.py 호출 → 최종 1개 MP4
 *
 * body: {
 *   plan_doc_id,
 *   steps: [{ step, image_url, audio_url?, duration?, narration?, subtitle? }],
 *   title?, format?
 * }
 * ══════════════════════════════════════════════════ */
export const generateVideo = async (req, res) => {
    const headers = getKlingHeaders();
    if (!headers) {
        return res.status(500).json({
            error: 'Kling API 키가 설정되지 않았습니다.',
            message: 'KLING_API_ACCESS_KEY, KLING_API_SECRET_KEY 환경 변수를 확인하세요.',
        });
    }

    const { plan_doc_id, steps, title, format } = req.body ?? {};
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: 'steps 배열이 필요합니다.' });
    }

    const validSteps = steps.filter((s) => s.image_url);
    if (validSteps.length === 0) {
        return res.status(400).json({ error: '이미지가 포함된 step이 없습니다.' });
    }

    const planId = plan_doc_id || `video_${Date.now()}`;
    const isShort = !format || format === '15s';
    const tempFiles = []; // 정리 대상

    try {
        console.log(`[Video] 시작 — ${validSteps.length} steps, plan: ${planId}`);

        // ──────── 1) STEP별 Kling 영상 생성 (병렬) ────────
        const klingDuration = isShort ? '5' : '10';
        const klingPromises = validSteps.map(async (step, i) => {
            const imageBase64 = await imageUrlToBase64(step.image_url);
            const prompt = step.narration
                ? `Smooth cinematic motion. ${step.narration}`
                : 'Smooth cinematic camera movement with subtle zoom and natural lighting transition.';

            console.log(`[Kling] STEP ${step.step} 영상 생성 요청...`);
            const result = await klingImageToVideo(headers, imageBase64, prompt, klingDuration);

            // Kling 영상 다운로드
            const videoPath = path.join(tempDir, `kling_${planId}_step${step.step}.mp4`);
            await downloadFile(result.url, videoPath);
            tempFiles.push(videoPath);

            console.log(`[Kling] STEP ${step.step} 완료 — task: ${result.taskId}`);
            return { step: step.step, videoPath, klingDuration: result.duration };
        });

        const klingResults = await Promise.allSettled(klingPromises);

        // 성공한 STEP만 수집
        const succeededSteps = [];
        for (let i = 0; i < klingResults.length; i++) {
            if (klingResults[i].status === 'fulfilled') {
                succeededSteps.push({ ...klingResults[i].value, originalStep: validSteps[i] });
            } else {
                console.error(`[Kling] STEP ${validSteps[i].step} 실패:`, klingResults[i].reason?.message);
            }
        }

        if (succeededSteps.length === 0) {
            return res.status(502).json({
                error: '모든 STEP의 Kling 영상 생성에 실패했습니다.',
                details: klingResults.map((r, i) => ({
                    step: validSteps[i].step,
                    error: r.reason?.message || null,
                })),
            });
        }

        // ──────── 2) STEP별 나레이션 오디오 다운로드 ────────
        const audioFiles = [];
        for (const s of succeededSteps) {
            const orig = s.originalStep;
            if (orig.audio_url) {
                try {
                    const audioPath = path.join(tempDir, `audio_${planId}_step${s.step}.wav`);
                    await downloadFile(orig.audio_url, audioPath);
                    tempFiles.push(audioPath);
                    audioFiles.push({ step: s.step, path: audioPath });
                    console.log(`[Audio] STEP ${s.step} 나레이션 다운로드 완료`);
                } catch (err) {
                    console.warn(`[Audio] STEP ${s.step} 다운로드 실패:`, err.message);
                }
            }
        }

        // ──────── 3) ffmpeg concat (단일 STEP이면 복사만) ────────
        const outputFilename = `final_${planId}_${Date.now()}.mp4`;
        const outputPath = path.join(videosDir, outputFilename);
        const videoPaths = succeededSteps.map((s) => s.videoPath);

        if (videoPaths.length === 1) {
            // 단일 STEP — concat 불필요, 오디오만 합성
            const singleVideo = videoPaths[0];
            const singleAudio = audioFiles[0]?.path;

            if (singleAudio) {
                // 영상 + 나레이션 합성
                console.log(`[ffmpeg] 단일 STEP 영상 + 나레이션 합성`);
                await execFileAsync('ffmpeg', [
                    '-i', singleVideo.replace(/\\/g, '/'),
                    '-i', singleAudio.replace(/\\/g, '/'),
                    '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-shortest',
                    '-y', outputPath.replace(/\\/g, '/'),
                ], { timeout: 120000 });
            } else {
                // 영상만 복사
                fs.copyFileSync(singleVideo, outputPath);
            }
        } else {
            // 여러 STEP — ffmpeg concat demuxer 사용
            const listPath = path.join(tempDir, `filelist_${planId}.txt`);
            const listContent = videoPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n');
            fs.writeFileSync(listPath, listContent);
            tempFiles.push(listPath);

            const concatOutput = path.join(tempDir, `concat_${planId}.mp4`);
            tempFiles.push(concatOutput);

            console.log(`[ffmpeg] ${videoPaths.length} clips concat 시작`);
            await execFileAsync('ffmpeg', [
                '-f', 'concat', '-safe', '0',
                '-i', listPath.replace(/\\/g, '/'),
                '-c', 'copy',
                '-y', concatOutput.replace(/\\/g, '/'),
            ], { timeout: 300000 });

            // 나레이션 오디오가 있으면 합성
            if (audioFiles.length > 0) {
                // 모든 나레이션을 하나로 연결
                const audioListPath = path.join(tempDir, `audiolist_${planId}.txt`);
                const audioListContent = audioFiles.map((a) => `file '${a.path.replace(/\\/g, '/')}'`).join('\n');
                fs.writeFileSync(audioListPath, audioListContent);
                tempFiles.push(audioListPath);

                const concatAudio = path.join(tempDir, `concat_audio_${planId}.wav`);
                tempFiles.push(concatAudio);

                await execFileAsync('ffmpeg', [
                    '-f', 'concat', '-safe', '0',
                    '-i', audioListPath.replace(/\\/g, '/'),
                    '-c', 'copy',
                    '-y', concatAudio.replace(/\\/g, '/'),
                ], { timeout: 120000 });

                // 영상 + 오디오 합성
                await execFileAsync('ffmpeg', [
                    '-i', concatOutput.replace(/\\/g, '/'),
                    '-i', concatAudio.replace(/\\/g, '/'),
                    '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-shortest',
                    '-y', outputPath.replace(/\\/g, '/'),
                ], { timeout: 120000 });
            } else {
                fs.copyFileSync(concatOutput, outputPath);
            }
        }

        // 파일 크기로 duration 추정
        const stat = fs.statSync(outputPath);
        const estimatedDuration = succeededSteps.length * (isShort ? 5 : 10);

        // ──────── 4) 임시 파일 정리 ────────
        for (const f of tempFiles) {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const videoUrl = `${baseUrl}/api/v2/video/serve/${encodeURIComponent(outputFilename)}`;

        console.log(`[Video] 최종 영상 완료 — ${outputFilename}, ${(stat.size / 1024 / 1024).toFixed(1)}MB, ~${estimatedDuration}s`);

        return res.json({
            success: true,
            data: {
                video_url: videoUrl,
                duration: estimatedDuration,
                steps_used: succeededSteps.length,
                filename: outputFilename,
            },
        });

    } catch (error) {
        // 에러 시 임시 파일 정리
        for (const f of tempFiles) {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
        }
        console.error('[Video 생성]', error.message);
        return res.status(500).json({
            error: '영상 생성 중 오류가 발생했습니다.',
            details: error.message,
        });
    }
};

/* ══════════════════════════════════════════════════
 * GET /api/v2/video/status/:taskId
 * Kling 개별 task 상태 조회
 * ══════════════════════════════════════════════════ */
export const getVideoStatus = async (req, res) => {
    try {
        const headers = getKlingHeaders();
        if (!headers) return res.status(500).json({ error: 'Kling API 키 미설정' });

        const { taskId } = req.params;
        if (!taskId) return res.status(400).json({ error: 'taskId가 필요합니다.' });

        const statusRes = await axios.get(
            `${KLING_BASE}/v1/videos/image2video/${taskId}`,
            { headers, timeout: 15000 }
        );

        const taskData = statusRes.data?.data;
        const videos = taskData?.task_result?.videos || [];

        let videoUrl = null;
        let videoDuration = 0;
        if (taskData?.task_status === 'succeed' && videos.length > 0) {
            videoUrl = videos[0].url;
            videoDuration = videos[0].duration || 0;
        }

        return res.json({
            success: true,
            data: {
                task_id: taskId,
                status: taskData?.task_status,
                video_url: videoUrl,
                duration: videoDuration,
                message: taskData?.task_status_msg || null,
            },
        });
    } catch (error) {
        console.error('[Kling Status]', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Kling 상태 조회 오류',
            details: error.response?.data?.message || error.message,
        });
    }
};

/* ══════════════════════════════════════════════════
 * POST /api/v2/video/generate-video-prompt
 * 시나리오 한글 → Gemini → 영어 영상 프롬프트 변환
 * body: { section, visual, camera_preset? }
 * ══════════════════════════════════════════════════ */
export const generateVideoPrompt = async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
        }

        const { section, visual, camera_preset } = req.body ?? {};
        if (!visual || typeof visual !== 'string' || !visual.trim()) {
            return res.status(400).json({ error: 'visual(시나리오 Visual/Action)이 필요합니다.' });
        }

        const sectionLabel = section || 'Middle';
        const camera = camera_preset || '';

        const systemPrompt = `You are an expert at writing Image-to-Video (I2V) motion prompts for KlingAI.
Your job: convert a Korean beauty video scenario description into a concise English I2V motion prompt.

Rules:
1. Output ONLY the English prompt, no explanation.
2. Describe the motion/action of the person and camera naturally — do NOT exaggerate movements.
3. Keep it realistic and grounded in the scene description.
4. Do NOT add slow-motion, dramatic zooms, or cinematic effects unless the scenario explicitly says so.
5. Include the camera angle/movement if provided.
6. Keep the prompt under 150 words.
7. The prompt should work as an I2V motion instruction for an already-generated start frame image.`;

        const userMessage = `Section: ${sectionLabel}
Scenario (Korean): ${visual.trim()}
${camera ? `Camera preset: ${camera}` : ''}

Convert this into an English I2V motion prompt:`;

        console.log(`[Video Prompt] Gemini 호출 — section: ${sectionLabel}, visual: ${visual.slice(0, 50)}...`);

        const response = await axios.post(
            `${GEMINI_BASE}/models/gemini-3.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );

        const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const prompt = generatedText.trim().replace(/^["']|["']$/g, '');

        if (!prompt) {
            return res.status(502).json({ error: 'Gemini에서 프롬프트를 생성하지 못했습니다.' });
        }

        console.log(`[Video Prompt] 완료 — ${prompt.slice(0, 80)}...`);
        return res.json({ success: true, data: { prompt } });
    } catch (error) {
        console.error('[Video Prompt]', error.response?.data || error.message);
        return res.status(500).json({
            error: '영상 프롬프트 생성 중 오류',
            details: error.response?.data?.error?.message || error.message,
        });
    }
};

/* ══════════════════════════════════════════════════
 * POST /api/v2/video/generate-step
 * 단일 STEP I2V 생성 (이미지 + 시나리오 프롬프트 → 영상)
 * body: { image_url, prompt, step, plan_doc_id?, duration? }
 * ══════════════════════════════════════════════════ */
export const generateStep = async (req, res) => {
    const headers = getKlingHeaders();
    if (!headers) {
        return res.status(500).json({ error: 'Kling API 키가 설정되지 않았습니다.' });
    }

    const { image_url, prompt, step, plan_doc_id, duration } = req.body ?? {};
    if (!image_url) return res.status(400).json({ error: 'image_url이 필요합니다.' });
    if (!step) return res.status(400).json({ error: 'step이 필요합니다.' });

    const planId = plan_doc_id || `step_${Date.now()}`;
    // Kling API는 5 또는 10만 허용
    const klingDuration = duration === 10 || duration === '10' ? '10' : '5';
    const motionPrompt = prompt || 'Smooth cinematic camera movement with subtle zoom and natural lighting transition.';

    try {
        console.log(`[Video Step] STEP ${step} I2V 생성 시작 — plan: ${planId}`);
        const imageBase64 = await imageUrlToBase64(image_url);
        const result = await klingImageToVideo(headers, imageBase64, motionPrompt, klingDuration);

        // 영상 다운로드 → 로컬 저장
        const filename = `step_${planId}_s${step}_${Date.now()}.mp4`;
        const filePath = path.join(videosDir, filename);
        await downloadFile(result.url, filePath);

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const videoUrl = `${baseUrl}/api/v2/video/serve/${encodeURIComponent(filename)}`;

        console.log(`[Video Step] STEP ${step} 완료 — ${filename}`);
        return res.json({
            success: true,
            data: { video_url: videoUrl, step, task_id: result.taskId, filename },
        });
    } catch (error) {
        console.error(`[Video Step] STEP ${step} 실패:`, error.message);
        return res.status(500).json({ error: `STEP ${step} 영상 생성 실패`, details: error.message });
    }
};

/* ══════════════════════════════════════════════════
 * POST /api/v2/video/merge
 * 승인된 STEP 영상들 + 나레이션 → 최종 합성
 * body: { steps: [{ video_url, audio_url? }], plan_doc_id? }
 * ══════════════════════════════════════════════════ */
export const mergeVideo = async (req, res) => {
    const { steps: mergeSteps, plan_doc_id } = req.body ?? {};
    if (!mergeSteps || !Array.isArray(mergeSteps) || mergeSteps.length === 0) {
        return res.status(400).json({ error: 'steps 배열이 필요합니다.' });
    }

    const planId = plan_doc_id || `merge_${Date.now()}`;
    const tempFiles = [];

    try {
        // 1) 영상 파일 수집 (URL → 로컬)
        const videoPaths = [];
        const audioPaths = [];

        for (const s of mergeSteps) {
            if (!s.video_url) continue;

            // 로컬 서빙 URL이면 직접 경로 추출
            let vPath;
            const serveMatch = s.video_url.match(/\/api\/v2\/video\/serve\/(.+)/);
            if (serveMatch) {
                vPath = path.join(videosDir, decodeURIComponent(serveMatch[1]));
            } else {
                vPath = path.join(tempDir, `merge_v_${planId}_${videoPaths.length}.mp4`);
                await downloadFile(s.video_url, vPath);
                tempFiles.push(vPath);
            }
            if (fs.existsSync(vPath)) videoPaths.push(vPath);

            if (s.audio_url) {
                try {
                    const aPath = path.join(tempDir, `merge_a_${planId}_${audioPaths.length}.wav`);
                    await downloadFile(s.audio_url, aPath);
                    tempFiles.push(aPath);
                    audioPaths.push(aPath);
                } catch { /* skip */ }
            }
        }

        if (videoPaths.length === 0) {
            return res.status(400).json({ error: '유효한 영상이 없습니다.' });
        }

        const outputFilename = `final_${planId}_${Date.now()}.mp4`;
        const outputPath = path.join(videosDir, outputFilename);

        if (videoPaths.length === 1 && audioPaths.length === 0) {
            // 단일 영상, 오디오 없음 → 복사
            fs.copyFileSync(videoPaths[0], outputPath);
        } else if (videoPaths.length === 1 && audioPaths.length > 0) {
            // 단일 영상 + 오디오
            await execFileAsync('ffmpeg', [
                '-i', videoPaths[0].replace(/\\/g, '/'),
                '-i', audioPaths[0].replace(/\\/g, '/'),
                '-map', '0:v', '-map', '1:a',
                '-c:v', 'copy', '-c:a', 'aac', '-shortest',
                '-y', outputPath.replace(/\\/g, '/'),
            ], { timeout: 120000 });
        } else {
            // 여러 영상 concat
            const listPath = path.join(tempDir, `mergelist_${planId}.txt`);
            fs.writeFileSync(listPath, videoPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
            tempFiles.push(listPath);

            const concatPath = path.join(tempDir, `concat_${planId}.mp4`);
            tempFiles.push(concatPath);

            console.log(`[ffmpeg] concat filelist:\n${fs.readFileSync(listPath, 'utf8')}`);
            try {
                // 먼저 stream copy로 시도 (빠름)
                await execFileAsync('ffmpeg', [
                    '-f', 'concat', '-safe', '0',
                    '-i', listPath.replace(/\\/g, '/'),
                    '-c', 'copy', '-y', concatPath.replace(/\\/g, '/'),
                ], { timeout: 300000 });
            } catch (copyErr) {
                // copy 실패 시 재인코딩으로 폴백
                console.warn('[ffmpeg] concat copy 실패, 재인코딩 시도:', copyErr.message?.slice(0, 100));
                await execFileAsync('ffmpeg', [
                    '-f', 'concat', '-safe', '0',
                    '-i', listPath.replace(/\\/g, '/'),
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
                    '-c:a', 'aac', '-b:a', '128k',
                    '-y', concatPath.replace(/\\/g, '/'),
                ], { timeout: 600000 });
            }

            if (audioPaths.length > 0) {
                // 오디오도 concat
                const aListPath = path.join(tempDir, `amerge_${planId}.txt`);
                fs.writeFileSync(aListPath, audioPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
                tempFiles.push(aListPath);

                const concatAudio = path.join(tempDir, `caudio_${planId}.wav`);
                tempFiles.push(concatAudio);

                await execFileAsync('ffmpeg', [
                    '-f', 'concat', '-safe', '0',
                    '-i', aListPath.replace(/\\/g, '/'),
                    '-c', 'copy', '-y', concatAudio.replace(/\\/g, '/'),
                ], { timeout: 120000 });

                await execFileAsync('ffmpeg', [
                    '-i', concatPath.replace(/\\/g, '/'),
                    '-i', concatAudio.replace(/\\/g, '/'),
                    '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-shortest',
                    '-y', outputPath.replace(/\\/g, '/'),
                ], { timeout: 120000 });
            } else {
                fs.copyFileSync(concatPath, outputPath);
            }
        }

        // 임시 파일 정리
        for (const f of tempFiles) {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const videoUrl = `${baseUrl}/api/v2/video/serve/${encodeURIComponent(outputFilename)}`;

        console.log(`[Video Merge] 최종 합성 완료 — ${outputFilename}`);
        return res.json({
            success: true,
            data: { video_url: videoUrl, steps_used: videoPaths.length, filename: outputFilename },
        });
    } catch (error) {
        for (const f of tempFiles) {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
        }
        console.error('[Video Merge]', error.message, error.stderr?.slice?.(0, 300) || '');
        return res.status(500).json({ error: '영상 합성 중 오류', details: error.message?.slice(0, 300) });
    }
};

/* ══════════════════════════════════════════════════
 * GET /api/v2/video/serve/:filename
 * 로컬 영상 파일 서빙 (Range request 지원)
 * ══════════════════════════════════════════════════ */
export const serveVideo = async (req, res) => {
    try {
        const filename = req.params?.filename;
        if (!filename) return res.status(404).end();

        const safeFile = path.basename(filename);
        const filePath = path.join(videosDir, safeFile);

        if (!path.resolve(filePath).startsWith(path.resolve(videosDir)) || !fs.existsSync(filePath)) {
            return res.status(404).end();
        }

        const stat = fs.statSync(filePath);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');

        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
            res.setHeader('Content-Length', end - start + 1);
            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.setHeader('Content-Length', stat.size);
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (err) {
        console.error('[Video 서빙]', err);
        res.status(500).end();
    }
};
