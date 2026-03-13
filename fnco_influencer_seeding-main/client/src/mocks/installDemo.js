/**
 * DEMO_MODE 초기화 — main.jsx보다 먼저 import되어 fetch 인터셉터를 설치한다.
 * 사용법: VITE_DEMO_MODE=true npx vite
 */
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

if (DEMO_MODE) {
  const { installDemoFetchInterceptor } = await import('./demoData.js');
  installDemoFetchInterceptor();
  console.log('%c[DEMO_MODE] 모든 API 요청이 목업 데이터로 대체됩니다', 'color: #FF6B9D; font-weight: bold; font-size: 14px;');
}

export { DEMO_MODE };
