import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api.js';

/**
 * Typecast TTS 생성 훅
 * mutate({ text, gender, tone, emotion, speed })
 * returns { audio_url, duration, actor_id, emotion }
 */
export function useGenerateNarration() {
  return useMutation({
    mutationFn: ({ text, gender = 'female', tone = 'bright', emotion = 'normal', speed = 1.0 }) =>
      api.post('/tts/generate', { text, gender, tone, emotion, speed }),
  });
}
