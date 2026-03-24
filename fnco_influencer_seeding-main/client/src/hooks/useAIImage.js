import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const V1_BASE = '/api/ai-image';

/**
 * V1 API JSON 요청 헬퍼
 */
async function v1Fetch(path, options = {}) {
  const url = `${V1_BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * V1 API FormData 업로드 헬퍼 (Content-Type 헤더 미설정 — 브라우저가 multipart boundary 자동 설정)
 */
async function v1Upload(path, options = {}) {
  const url = `${V1_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * AI 생성 이미지 목록 조회
 * GET /api/ai-image/images?plan_doc_id=xxx
 * @param {string} planDocId - AI 플랜 문서 ID
 */
export function useAIImages(planDocId) {
  return useQuery({
    queryKey: ['ai-image', planDocId],
    queryFn: () => v1Fetch(`/images?plan_doc_id=${planDocId}`),
    enabled: !!planDocId,
  });
}

/**
 * AI 이미지 생성
 * POST /api/ai-image/generate-image (JSON body)
 * POST /api/ai-image/generate-prompt (FormData — productImage가 File일 때)
 * mutationFn 인자: { planDocId, step, prompt, style, productImage }
 * 성공 시 ai-image 쿼리 무효화
 */
export function useGenerateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planDocId, step, prompt, style, productImage }) => {
      if (productImage instanceof File) {
        const formData = new FormData();
        const payload = JSON.stringify({
          plan_doc_id: planDocId,
          step_number: step,
          prompt,
          style: style || '',
        });
        formData.append('payload', payload);
        formData.append('images', productImage);
        return v1Upload('/generate-prompt', {
          method: 'POST',
          body: formData,
        });
      }
      return v1Fetch('/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          plan_doc_id: planDocId,
          step_number: step,
          prompt,
          style: style || '',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-image'] });
    },
  });
}

/**
 * AI 프롬프트 생성
 * POST /api/ai-image/generate-prompt (FormData)
 * mutationFn 인자: { product, step, style, productImages }
 *   product: { category, subcategory, product_name }
 *   step: { step_number, step_label, visual_action, audio_narration, emotion_note }
 *   style: string
 *   productImages: File[] (선택)
 * 성공 시 생성된 프롬프트 텍스트 반환
 */
export function useGeneratePrompt() {
  return useMutation({
    mutationFn: ({ product, step, style, productImages, modelImages }) => {
      const payload = JSON.stringify({ product, step, style });
      const formData = new FormData();
      formData.append('payload', payload);
      if (Array.isArray(productImages)) {
        productImages.forEach((file) => formData.append('images', file));
      }
      if (Array.isArray(modelImages)) {
        modelImages.forEach((file) => formData.append('images', file));
      }
      return v1Upload('/generate-prompt', {
        method: 'POST',
        body: formData,
      });
    },
  });
}

/**
 * AI 이미지 생성 (num_images 파라미터 포함)
 * POST /api/ai-image/generate-image (JSON body)
 * mutationFn 인자: { prompt, step_number, num_images, plan_doc_id, created_by }
 * 성공 시 ai-image 쿼리 무효화
 */
export function useGenerateImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prompt, step_number, num_images = 4, plan_doc_id, created_by, productImages, modelImages }) => {
      const hasFiles = (Array.isArray(productImages) && productImages.length > 0)
        || (Array.isArray(modelImages) && modelImages.length > 0);

      if (hasFiles) {
        const formData = new FormData();
        const payload = JSON.stringify({ prompt, step_number, num_images, plan_doc_id, created_by });
        formData.append('payload', payload);
        if (Array.isArray(productImages)) {
          productImages.forEach((file) => formData.append('images', file));
        }
        if (Array.isArray(modelImages)) {
          modelImages.forEach((file) => formData.append('images', file));
        }
        return v1Upload('/generate-image', {
          method: 'POST',
          body: formData,
        });
      }

      return v1Fetch('/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt, step_number, num_images, plan_doc_id, created_by }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-image'] });
    },
  });
}

/**
 * AI 이미지 선택/저장
 * PATCH /api/ai-image/image/select
 * mutationFn 인자: { planDocId, step, imageUrl }
 * 성공 시 ai-image 쿼리 무효화
 */
export function useSaveImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planDocId, step, imageUrl }) =>
      v1Fetch('/image/select', {
        method: 'PATCH',
        body: JSON.stringify({
          plan_doc_id: planDocId,
          step,
          img_url: imageUrl,
          is_selected: true,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-image'] });
    },
  });
}
