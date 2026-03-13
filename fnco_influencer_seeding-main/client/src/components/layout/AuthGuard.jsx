import { Outlet } from 'react-router-dom';

export default function AuthGuard() {
  // DEV: 인증 우회 — 바로 진입
  return <Outlet />;
}
