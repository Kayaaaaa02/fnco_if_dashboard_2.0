import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api.js';

/**
 * Kling AI 영상 생성 훅
 * mutate({ plan_doc_id, steps, title?, format?, mode? })
 * steps: [{ step, image_url, audio_url?, duration?, narration? }]
 * mode: 'single' (대표 이미지 1장) | 'multi' (STEP별 개별)
 * returns { video_url, task_id, duration, steps_used, mode }
 */
export function useGenerateVideo() {
  return useMutation({
    mutationFn: ({ plan_doc_id, steps, title, format, mode }) =>
      api.post('/video/generate', { plan_doc_id, steps, title, format, mode }),
  });
}

/**
 * 시나리오 한글 → Gemini 영어 영상 프롬프트 변환
 * mutate({ section, visual, camera_preset? })
 * returns { prompt }
 */
export function useGenerateVideoPrompt() {
  return useMutation({
    mutationFn: ({ section, visual, camera_preset }) =>
      api.post('/video/generate-video-prompt', { section, visual, camera_preset }),
  });
}

/**
 * 단일 STEP I2V 생성
 * mutate({ image_url, prompt, step, plan_doc_id?, duration? })
 * returns { video_url, step, task_id, filename }
 */
export function useGenerateStep() {
  return useMutation({
    mutationFn: ({ image_url, prompt, step, plan_doc_id, duration }) =>
      api.post('/video/generate-step', { image_url, prompt, step, plan_doc_id, duration }),
  });
}

/**
 * 승인된 STEP 영상들 최종 합성
 * mutate({ steps: [{ video_url, audio_url? }], plan_doc_id? })
 * returns { video_url, steps_used, filename }
 */
export function useMergeVideo() {
  return useMutation({
    mutationFn: ({ steps, plan_doc_id }) =>
      api.post('/video/merge', { steps, plan_doc_id }),
  });
}

/**
 * Kling 영상 생성 상태 폴링 훅
 * taskId가 있고 status가 'succeed'/'failed'가 아닐 때 5초 간격 폴링
 * returns { task_id, status, video_url, duration, message }
 */
export function useVideoStatus(taskId, enabled = false) {
  return useQuery({
    queryKey: ['video-status', taskId],
    queryFn: () => api.get(`/video/status/${taskId}`),
    enabled: !!taskId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'succeed' || status === 'failed') return false;
      return 5000; // 5초 간격 폴링
    },
  });
}
