import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, graphConfig } from '../authConfig.js';

// MSAL 인스턴스 생성
export const msalInstance = new PublicClientApplication(msalConfig);

// MSAL 인스턴스 초기화
msalInstance
    .initialize()
    .then(() => {})
    .catch((error) => {
        console.error('MSAL 인스턴스 초기화 실패:', error);
    });

// Microsoft Graph API 호출을 위한 헬퍼 함수
export const callMsGraph = async (accessToken) => {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append('Authorization', bearer);

    const options = {
        method: 'GET',
        headers: headers,
    };

    try {
        const response = await fetch(graphConfig.graphMeEndpoint, options);
        const profile = await response.json();

        if (response.ok) {
            return profile;
        } else {
            throw new Error(`Graph API 호출 실패: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Graph API 호출 중 오류:', error);
        throw error;
    }
};

// 로그인 함수
export const login = async () => {
    try {
        const response = await msalInstance.loginRedirect(loginRequest);
        return response;
    } catch (error) {
        console.error('로그인 중 오류:', error);
        throw error;
    }
};

// 로그아웃 함수
export const logout = async () => {
    try {
        await msalInstance.logoutRedirect();
    } catch (error) {
        console.error('로그아웃 중 오류:', error);
        throw error;
    }
};

// 액세스 토큰 획득 함수
export const getAccessToken = async () => {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            throw new Error('로그인된 계정이 없습니다.');
        }

        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
        });

        return response.accessToken;
    } catch (error) {
        console.error('토큰 획득 중 오류:', error);
        throw error;
    }
};

// 사용자 프로필 정보 가져오기
export const getUserProfile = async () => {
    try {
        const accessToken = await getAccessToken();
        const profile = await callMsGraph(accessToken);
        return profile;
    } catch (error) {
        console.error('사용자 프로필 가져오기 중 오류:', error);
        throw error;
    }
};

// 리다이렉트 후 토큰 처리
export const handleRedirectPromise = async () => {
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            return response;
        }
        return null;
    } catch (error) {
        console.error('리다이렉트 처리 중 오류:', error);
        throw error;
    }
};
