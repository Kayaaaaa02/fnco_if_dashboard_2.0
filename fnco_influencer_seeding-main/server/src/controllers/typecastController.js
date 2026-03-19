import axios from 'axios';

const TYPECAST_API_KEY = process.env.TYPECAST_API_KEY;
const TYPECAST_BASE = 'https://typecast.ai/api';

// 성별+톤 → Typecast actor_id 매핑
const ACTOR_MAP = {
  'female_bright': 'vhyeri',
  'female_calm': 'vjieun',
  'male_bright': 'vdaehan',
  'male_calm': 'vminsu',
};

// 감정 프리셋 → Typecast emotion 매핑
const EMOTION_MAP = {
  normal: { emotion: 'normal', emotion_tone: 'normal' },
  happy: { emotion: 'happy', emotion_tone: 'normal' },
  sad: { emotion: 'sad', emotion_tone: 'normal' },
  angry: { emotion: 'angry', emotion_tone: 'normal' },
  whisper: { emotion: 'normal', emotion_tone: 'whisper' },
  toneup: { emotion: 'normal', emotion_tone: 'bright' },
  tonedown: { emotion: 'normal', emotion_tone: 'calm' },
};

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TYPECAST_API_KEY}`,
  };
}

/**
 * POST /api/tts/generate
 * body: { text, gender, tone, emotion, speed? }
 * returns: { success, data: { audio_url, duration } }
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

    const actorKey = `${gender}_${tone}`;
    const actorId = ACTOR_MAP[actorKey] || ACTOR_MAP['female_bright'];
    const emotionConfig = EMOTION_MAP[emotion] || EMOTION_MAP['normal'];

    // Step 1: 음성 합성 요청
    const speakRes = await axios.post(`${TYPECAST_BASE}/speak`, {
      actor_id: actorId,
      text: text.trim(),
      lang: 'auto',
      xapi_hd: true,
      model_version: 'latest',
      ...emotionConfig,
      speed,
    }, {
      headers: getHeaders(),
      timeout: 30000,
    });

    const speakId = speakRes.data?.result?.speak_v2_id || speakRes.data?.result?.speak_id;
    if (!speakId) {
      console.error('[Typecast] speak 응답:', JSON.stringify(speakRes.data));
      return res.status(502).json({ error: 'Typecast 음성 생성 요청 실패' });
    }

    // Step 2: 폴링으로 결과 대기
    let audioUrl = null;
    let duration = 0;
    const maxRetries = 30;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      const statusRes = await axios.get(`${TYPECAST_BASE}/speak/v2/${speakId}`, {
        headers: getHeaders(),
        timeout: 10000,
      });

      const result = statusRes.data?.result;
      if (result?.status === 'done') {
        audioUrl = result.audio?.url || result.audio_download_url;
        duration = result.audio?.duration || result.duration || 0;
        break;
      } else if (result?.status === 'failed') {
        return res.status(502).json({ error: 'Typecast 음성 생성 실패' });
      }
    }

    if (!audioUrl) {
      return res.status(504).json({ error: 'Typecast 음성 생성 타임아웃' });
    }

    console.log(`[Typecast] TTS 생성 완료 — actor: ${actorId}, emotion: ${emotion}, duration: ${duration}s`);

    res.json({
      success: true,
      data: { audio_url: audioUrl, duration, actor_id: actorId, emotion },
    });
  } catch (error) {
    console.error('[Typecast] 오류:', error.response?.data || error.message);
    res.status(500).json({
      error: 'TTS 생성 중 오류가 발생했습니다.',
      details: error.response?.data?.message || error.message,
    });
  }
};

/**
 * GET /api/tts/actors
 * 사용 가능한 보이스 목록 반환
 */
export const getActors = async (req, res) => {
  res.json({
    success: true,
    data: {
      actors: Object.entries(ACTOR_MAP).map(([key, actorId]) => {
        const [gender, tone] = key.split('_');
        return { actor_id: actorId, gender, tone };
      }),
      emotions: Object.keys(EMOTION_MAP),
    },
  });
};
