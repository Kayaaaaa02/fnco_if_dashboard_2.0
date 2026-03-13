const apiBase = import.meta.env.VITE_API_BASE_URL;
import { setSeedingContents, setPreviewContents, setUgcContents } from '../store/slices/crawlSlice';

// dispatch를 파라미터로 받도록 수정
export const reloadingSeedingContents = async (dispatch, userState) => {
    try {
        // 권한 스코프 결정 (App.jsx와 동일 로직)
        const access = userState?.menu_access?.seedingDashboard || [];
        let scope = 'read_self';
        if (access.includes('read_all')) scope = 'read_all';
        else if (access.includes('read_team')) scope = 'read_team';

        const params = new URLSearchParams();
        params.set('scope', scope);
        if (scope === 'read_team' && userState?.team_codes?.length > 0) {
            params.set('team_codes', userState.team_codes.join(','));
        }
        if (scope === 'read_self' && userState?.user_id) {
            params.set('user_id', userState.user_id);
        }

        const response = await fetch(`${apiBase}/contents/seeding?${params.toString()}`);
        const data = await response.json();
        dispatch(setSeedingContents(data));
    } catch (error) {
        console.error('시딩 콘텐츠 조회 실패:', error);
    }
};

// dispatch를 파라미터로 받도록 수정
export const reloadingPreviewContents = async (dispatch, userState) => {
    try {
        // 권한 스코프 결정 (App.jsx와 동일 로직)
        const access = userState?.menu_access?.seedingDashboard || [];
        let scope = 'read_self';
        if (access.includes('read_all')) scope = 'read_all';
        else if (access.includes('read_team')) scope = 'read_team';

        const params = new URLSearchParams();
        params.set('scope', scope);
        if (scope === 'read_team' && userState?.team_codes?.length > 0) {
            params.set('team_codes', userState.team_codes.join(','));
        }
        if (scope === 'read_self' && userState?.user_id) {
            params.set('user_id', userState.user_id);
        }

        const response = await fetch(`${apiBase}/contents/preview?${params.toString()}`);
        const data = await response.json();

        dispatch(setPreviewContents(data));
    } catch (error) {
        console.error('가편 콘텐츠 조회 실패:', error);
    }
};

// dispatch를 파라미터로 받도록 수정
export const reloadingUGCContents = async (dispatch, userState) => {
    try {
        const access = userState?.menu_access?.seedingDashboard || [];
        let scope = 'read_self';
        if (access.includes('read_all')) scope = 'read_all';
        else if (access.includes('read_team')) scope = 'read_team';

        const params = new URLSearchParams();
        params.set('scope', scope);
        if (scope === 'read_team' && userState?.team_codes?.length > 0) {
            params.set('team_codes', userState.team_codes.join(','));
        }
        if (scope === 'read_self' && userState?.user_id) {
            params.set('user_id', userState.user_id);
        }

        const response = await fetch(`${apiBase}/contents/ugc?${params.toString()}`);
        const data = await response.json();
        dispatch(setUgcContents(data));
    } catch (error) {
        console.error('UGC 콘텐츠 조회 실패:', error);
    }
};
