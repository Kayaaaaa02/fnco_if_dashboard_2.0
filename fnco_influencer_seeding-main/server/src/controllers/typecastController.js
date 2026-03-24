import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TYPECAST_API_KEY = process.env.TYPECAST_API_KEY;
const TYPECAST_API_BASE = 'https://api.typecast.ai';

// 오디오 파일 저장 디렉토리
const audioUploadDir = path.join(__dirname, '../../uploads/tts-audio');
if (!fs.existsSync(audioUploadDir)) {
    fs.mkdirSync(audioUploadDir, { recursive: true });
}

// 성별+톤 → voice_id 매핑 (ssfm-v30 모델)
const VOICE_MAP = {
  'female_bright': 'tc_62e8f21e979b3860fe2f6a24', // Hyelee - TikTok/Reels/Shorts, 광고
  'female_calm':   'tc_6763bef751dc3fb17792acaf', // Suyoon - Documentary, 차분한 톤
  'male_bright':   'tc_68662745779b66ba84fc4d84', // Seheon - Conversational, Radio/Podcast
  'male_calm':     'tc_67b6985d4d5d632d97478263', // Aaron - Documentary, 설명, 광고
};

// 감정 프리셋 매핑 (새 API의 emotion_preset 값)
const EMOTION_MAP = {
  normal:   'normal',
  happy:    'happy',
  sad:      'sad',
  angry:    'angry',
  whisper:  'whisper',
  toneup:   'toneup',
  tonedown: 'tonedown',
};

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': TYPECAST_API_KEY,
  };
}

/**
 * POST /api/v2/tts/generate
 * body: { text, gender, tone, emotion, speed? }
 * returns: { success, data: { audio_url, duration, voice_id, emotion } }
 *
 * 새 Typecast API (api.typecast.ai):
 *  - POST /v1/text-to-speech → wav 바이너리 직접 반환
 *  - 인증: X-API-KEY 헤더
 *  - model: ssfm-v30
 *  - prompt.emotion_type: 'preset' | 'smart' | 'embedding'
 */
export const generateTTS = async (req, res) => {
  try {
    if (!TYPECAST_API_KEY) {
      return res.status(500).json({ error: 'TYPECAST_API_KEY가 설정되지 않았습니다.' });
    }

    const { text, gender = 'female', tone = 'bright', emotion = 'normal', speed = 1.0 } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '나레이션 텍스트가 필요합니다.' });
    }

    const voiceKey = `${gender}_${tone}`;
    const voiceId = VOICE_MAP[voiceKey] || VOICE_MAP['female_bright'];
    const emotionPreset = EMOTION_MAP[emotion] || EMOTION_MAP['normal'];

    console.log(`[Typecast] TTS 요청 — voice: ${voiceId}, emotion: ${emotionPreset}, text: ${text.slice(0, 50)}...`);

    // POST /v1/text-to-speech → wav 바이너리 응답
    const ttsRes = await axios.post(
      `${TYPECAST_API_BASE}/v1/text-to-speech`,
      {
        model: 'ssfm-v30',
        text: text.trim(),
        voice_id: voiceId,
        prompt: {
          emotion_type: 'preset',
          emotion_preset: emotionPreset,
        },
      },
      {
        headers: getHeaders(),
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );

    if (ttsRes.status !== 200 || !ttsRes.data || ttsRes.data.byteLength === 0) {
      console.error('[Typecast] 빈 응답 또는 에러:', ttsRes.status);
      return res.status(502).json({ error: 'Typecast 음성 생성 실패 (빈 응답)' });
    }

    // wav 바이너리를 디스크에 저장
    const filename = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.wav`;
    const filePath = path.join(audioUploadDir, filename);
    fs.writeFileSync(filePath, Buffer.from(ttsRes.data));

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const audioUrl = `${baseUrl}/api/v2/tts/serve/${encodeURIComponent(filename)}`;

    // wav 파일 크기로 대략적인 duration 추정 (16bit, 24kHz mono 기준)
    const byteLength = ttsRes.data.byteLength;
    const estimatedDuration = Math.round((byteLength / (24000 * 2)) * 10) / 10;

    console.log(`[Typecast] TTS 완료 — voice: ${voiceId}, emotion: ${emotionPreset}, size: ${byteLength}B, ~${estimatedDuration}s`);

    res.json({
      success: true,
      data: { audio_url: audioUrl, duration: estimatedDuration, voice_id: voiceId, emotion },
    });
  } catch (error) {
    console.error('[Typecast] 오류:', error.response?.status, error.response?.data ? Buffer.from(error.response.data).toString('utf8').slice(0, 300) : error.message);
    const detail = error.response?.data
      ? (() => { try { return JSON.parse(Buffer.from(error.response.data).toString('utf8')); } catch { return error.message; } })()
      : error.message;
    res.status(500).json({
      error: 'TTS 생성 중 오류가 발생했습니다.',
      details: typeof detail === 'object' ? detail.message || detail : detail,
    });
  }
};

/**
 * GET /api/tts/serve/:filename
 * 생성된 TTS 오디오 파일 서빙
 */
export const serveTTSAudio = async (req, res) => {
  try {
    const filename = req.params?.filename;
    if (!filename) return res.status(404).end();
    const safeFile = path.basename(filename);
    const filePath = path.join(audioUploadDir, safeFile);
    if (!path.resolve(filePath).startsWith(path.resolve(audioUploadDir)) || !fs.existsSync(filePath)) {
      return res.status(404).end();
    }
    res.setHeader('Content-Type', 'audio/wav');
    res.sendFile(filePath);
  } catch (err) {
    console.error('[TTS 오디오 서빙]', err);
    res.status(500).end();
  }
};

/**
 * GET /api/v2/tts/actors
 * Typecast 계정에서 사용 가능한 보이스 목록 조회
 */
export const getActors = async (req, res) => {
  try {
    if (!TYPECAST_API_KEY) {
      return res.json({
        success: true,
        data: {
          voices: Object.entries(VOICE_MAP).map(([key, voiceId]) => {
            const [gender, tone] = key.split('_');
            return { voice_id: voiceId, gender, tone };
          }),
          emotions: Object.keys(EMOTION_MAP),
        },
      });
    }

    // 새 API: GET /v2/voices
    const voicesRes = await axios.get(`${TYPECAST_API_BASE}/v2/voices`, {
      headers: { 'X-API-KEY': TYPECAST_API_KEY },
      params: { model: 'ssfm-v30' },
      timeout: 10000,
    });

    console.log('[Typecast] voices 조회 완료:', Array.isArray(voicesRes.data) ? voicesRes.data.length : 0, '개');

    res.json({
      success: true,
      data: {
        voices: voicesRes.data || [],
        current_map: VOICE_MAP,
        emotions: Object.keys(EMOTION_MAP),
      },
    });
  } catch (error) {
    console.error('[Typecast] voices 조회 오류:', error.response?.data || error.message);
    res.json({
      success: true,
      data: {
        voices: Object.entries(VOICE_MAP).map(([key, voiceId]) => {
          const [gender, tone] = key.split('_');
          return { voice_id: voiceId, gender, tone };
        }),
        emotions: Object.keys(EMOTION_MAP),
      },
    });
  }
};
