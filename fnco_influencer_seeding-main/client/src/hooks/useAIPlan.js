import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const V1_BASE = '/api/ai-plan';

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
 * 제품 분석 데이터 조회
 * GET /api/ai-plan/analysis?plan_doc_id=xxx
 * @param {string} planDocId - AI 플랜 문서 ID
 */
export function useProductAnalysis(planDocId) {
  return useQuery({
    queryKey: ['ai-plan', 'analysis', planDocId],
    queryFn: () => v1Fetch(`/analysis?plan_doc_id=${planDocId}`),
    enabled: !!planDocId,
  });
}

/**
 * 제품 업로드 (FormData)
 * POST /api/ai-plan/upload
 * 성공 시 ai-plan 관련 쿼리 무효화
 */
export function useUploadProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      v1Upload('/upload', {
        method: 'POST',
        body: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-plan'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-hub'] });
    },
  });
}

/**
 * 정제된 데이터 조회
 * GET /api/ai-plan/refined?plan_doc_id=xxx
 * @param {string} planDocId - AI 플랜 문서 ID
 */
export function useRefinedData(planDocId) {
  return useQuery({
    queryKey: ['ai-plan', 'refined', planDocId],
    queryFn: () => v1Fetch(`/refined?plan_doc_id=${planDocId}`),
    enabled: !!planDocId,
  });
}

/**
 * 정제된 데이터 업데이트
 * POST /api/ai-plan/update-refined
 * mutationFn 인자: { planDocId, sectionKey, data }
 * 성공 시 ai-plan refined 쿼리 무효화
 */
export function useUpdateRefined() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planDocId, sectionKey, data }) =>
      v1Fetch('/update-refined', {
        method: 'POST',
        body: JSON.stringify({ plan_doc_id: planDocId, section_key: sectionKey, data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-plan', 'refined'] });
    },
  });
}

/**
 * 상위 콘텐츠 조회
 * GET /api/ai-plan/top-content?plan_doc_id=xxx
 * @param {string} planDocId - AI 플랜 문서 ID
 */
export function useTopContent(planDocId) {
  return useQuery({
    queryKey: ['ai-plan', 'top-content', planDocId],
    queryFn: () => v1Fetch(`/top-content?plan_doc_id=${planDocId}`),
    enabled: !!planDocId,
  });
}
