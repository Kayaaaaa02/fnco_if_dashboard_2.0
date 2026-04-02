/**
 * 심층 분석 API 호출 함수
 * Express → DB 직접 조회 (GET)
 * Express → FastAPI 프록시 (POST)
 *
 * JSON 구조는 docs/external-specs/deep_prompts.py의 최종 출력 형식과 동일
 */

import { api } from '@/services/api.js';

/**
 * 심층 분석 결과 조회 (DB에서)
 * @param {string} profileId
 * @param {string} platform
 * @returns {Promise<object>}
 */
export async function fetchDeepAnalysisResult(profileId, platform) {
    return api.get(`/influencer-pool/deep-analysis/${profileId}`, { platform });
}

/**
 * 심층 분석 요청 (FastAPI로 프록시)
 * @param {object} params - { profile_id, platform, username, display_name, profile_url, followers_count }
 * @returns {Promise<{ status: string }>}
 */
export async function requestDeepAnalysis(params) {
    return api.post('/influencer-pool/deep-analysis', params);
}

/**
 * 완료된 분석 ID 목록 + 통계 조회 (DB에서)
 * @returns {Promise<{ completedIds: string[], statsMap: Record<string, { avg_views: number }> }>}
 */
export async function fetchCompletedData() {
    try {
        const res = await api.get('/influencer-pool/deep-analysis/status');
        return {
            completedIds: res.completedIds || [],
            processingIds: res.processingIds || [],
            statsMap: res.statsMap || {},
        };
    } catch {
        return { completedIds: [], processingIds: [], statsMap: {} };
    }
}

/**
 * 특정 ID들의 분석 상태 조회 (폴링용, DB에서)
 * @param {string[]} profileIds
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchAnalysisStatuses(profileIds) {
    try {
        const res = await api.get('/influencer-pool/deep-analysis/status', {
            profile_ids: profileIds.join(','),
        });
        return res.statuses || {};
    } catch {
        return {};
    }
}
