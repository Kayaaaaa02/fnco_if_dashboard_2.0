/**
 * 두 API 응답을 공통 포맷으로 정규화
 *
 * creator_type: 'fnco' (collaborators) | 'excluded' (brand-collabs)
 * profile_id: SHA-256(platform:username) 앞 12자리
 */

/** platform:username → SHA-256 해시 앞 12자리 */
async function generateProfileId(platform, username) {
    const data = new TextEncoder().encode(`${platform}:${username}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
}

/** 동기 버전 (간단한 해시 — crypto.subtle 없는 환경 대비) */
function generateProfileIdSync(platform, username) {
    const str = `${platform}:${username}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // 추가 엔트로피: 문자열 뒤쪽 해시
    let hash2 = 0;
    for (let i = str.length - 1; i >= 0; i--) {
        const char = str.charCodeAt(i);
        hash2 = ((hash2 << 5) - hash2) + char;
        hash2 = hash2 & hash2;
    }
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
    return (hex + hex2).substring(0, 12);
}

/** 타브랜드 인플루언서 → 공통 포맷 */
export function normalizeBrandCollab(item) {
    const platform = item.platform || 'instagram';
    return {
        id: generateProfileIdSync(platform, item.username),
        username: item.username,
        displayName: item.fullName || item.username,
        biography: item.biography || '',
        profileImage: '',
        profileUrl: item.url || '',
        platform,
        followers: Number(item.followers) || 0,
        posts: Number(item.posts) || 0,
        engagementRate: item.engagementRate ?? null,
        isPrivate: item.isPrivate || false,
        isVerified: false,
        isHiddenGem: item.isHiddenGem || false,
        country: item.estimatedCountry || '',
        targetMarkets: item.targetMarkets || [],
        postUrls: item.recentLinks || [],
        creator_type: 'excluded',
        brandPostCount: item.brandPostCount || 0,
        workedWithUs: item.workedWithUs || false,
        hashtags: item.hashtags || [],
        mentions: item.mentions || [],
    };
}

/** FNCO 인플루언서 → 공통 포맷 */
export function normalizeCollaborator(item) {
    const platform = item.platform || 'instagram';
    const countries = item.estimatedCountries || [];
    return {
        id: generateProfileIdSync(platform, item.username),
        username: item.username,
        displayName: item.fullName || item.username,
        biography: item.biography || '',
        profileImage: '',
        profileUrl: '',
        platform,
        followers: Number(item.followersCount) || 0,
        posts: Number(item.postsCount) || 0,
        engagementRate: item.engagementRate ?? null,
        isPrivate: item.isPrivate || false,
        isVerified: item.isVerified || false,
        isHiddenGem: item.isHiddenGem || false,
        country: countries[0] || '',
        targetMarkets: item.targetMarkets || [],
        postUrls: item.postUrls || [],
        creator_type: 'fnco',
        source: item.source || '',
        isBusiness: item.isBusiness || false,
        ingestedAt: item.ingestedAt || '',
    };
}

/** 서버에서도 동일한 해시를 생성할 수 있도록 export */
export { generateProfileIdSync };
