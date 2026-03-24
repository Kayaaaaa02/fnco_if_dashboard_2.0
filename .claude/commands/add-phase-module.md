# 9-Phase 파이프라인 모듈 추가

캠페인 9-Phase 파이프라인에 새 Phase 하위 모듈을 추가합니다.

## 입력
- $ARGUMENTS: Phase 번호와 모듈 설명 (예: "Phase 3 콘텐츠 A/B 테스트", "Phase 8 실시간 알림 위젯" 등)

## 9-Phase 구조
```
Phase 1: P.D.A. Setup (수정 금지)
Phase 2: Strategy Design
Phase 3: Content Planning
Phase 4: Creative Production
Phase 5: Influencer Matching
Phase 6: Outreach Comms
Phase 7: Launch Deploy
Phase 8: Monitor Track
Phase 9: Optimize Iterate
```

## 수행 작업 (풀스택)

1. **Backend** — 해당 Phase의 기존 패턴을 따라:
   - SQL 모듈: `server/src/sql/{phase도메인}/` 하위
   - Controller 함수 추가: `server/src/controllers/{phase}Controller.js`
   - Route 추가: `server/src/routes/{phase}.js`

2. **Frontend** — 해당 Phase의 기존 컴포넌트 디렉토리에:
   - 컴포넌트: `client/src/components/{phase-dir}/{ModuleName}.jsx`
   - Hook 확장: `client/src/hooks/use{Phase}.js`에 새 쿼리/뮤테이션 추가

3. **캠페인 허브 연동**: 필요 시 Hub에서 해당 Phase 요약 표시

## Phase별 컴포넌트 디렉토리 매핑
- Phase 1 (PDA): `components/pda/` — **수정 금지**
- Phase 4 (Creative): `components/creative/`
- Phase 5 (Influencer): `components/influencer/`
- Phase 6 (Outreach): `components/outreach/`
- Phase 7 (Launch): `components/launch/`
- Phase 8 (Monitor): `components/monitor/`
- Phase 9 (Optimize): `components/monitor/` (OptimizationPanel 등)

## 규칙
- Phase 1 (PDA) 관련 파일은 절대 수정하지 않는다
- 기존 Phase 컴포넌트를 삭제/변경하지 않고 **추가**만 한다
- campaign_id 기반 데이터 연결 필수
