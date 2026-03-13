import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const V1_BASE = '/api/contents';

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
 * 영상 분석 결과 조회 (전체 또는 post_id 필터)
 * GET /api/contents/videoAnalysis?post_id=xxx
 * @param {string} postId - 포스트 ID (optional — 없으면 전체 조회)
 */
export function useVideoAnalysis(postId) {
  return useQuery({
    queryKey: ['video-analysis', postId],
    queryFn: () => v1Fetch(`/videoAnalysis${postId ? `?post_id=${postId}` : ''}`),
    enabled: !!postId,
  });
}

/**
 * 다중 포스트의 영상 분석 상태 폴링 조회 (5초 간격)
 * POST /api/contents/videoAnalysis/statuses
 * @param {string[]} postIds - 포스트 ID 배열
 */
export function useVideoAnalysisStatuses(postIds) {
  return useQuery({
    queryKey: ['video-analysis-statuses', postIds],
    queryFn: () =>
      v1Fetch('/videoAnalysis/statuses', {
        method: 'POST',
        body: JSON.stringify({ postIds }),
      }),
    enabled: postIds?.length > 0,
    refetchInterval: 5000,
  });
}

/**
 * 영상 업로드 (FormData — 영상 파일 + 메타데이터)
 * POST /api/contents/preview/individual
 * 서버에서 multer로 파일 처리 후 프리뷰 콘텐츠 생성
 * 성공 시 video-analysis 쿼리 무효화
 */
export function useUploadVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      v1Upload('/preview/individual', {
        method: 'POST',
        body: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['content-library', 'preview'] });
    },
  });
}
