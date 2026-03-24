# Mock 데이터 추가

개발/데모용 Mock 데이터를 프로젝트 패턴에 맞게 추가합니다.

## 입력
- $ARGUMENTS: Mock 데이터 대상 (예: "신규 캠페인 3개", "인플루언서 50명 풀" 등)

## 수행 작업

1. **Mock 데이터 파일** 확장:
   - `client/src/mocks/data.js` — 기본 목데이터
   - `client/src/mocks/demoData.js` — 데모용 확장 데이터
   - 또는 새 파일: `client/src/mocks/{domain}Data.js`

2. **데이터 구조**: 기존 DB 스키마와 일치하는 필드명 사용
   - campaign_id, campaign_name, status, brand_cd, country 등
   - created_at, updated_at 타임스탬프 포함
   - 한국어 + 영어 혼합 데이터

3. **InstallDemo** (필요 시): `client/src/mocks/installDemo.js` 확장

## 주의사항 (절대 준수)
- **'쉬어 벨벳 베일 틴트' 캠페인 목데이터 수정/삭제 금지**
  - `MOCK_VELVET_TINT_ID`
  - `mockVelvetTintCampaign`
  - `mockVelvetTintHub`
  - `mockVelvetTintPDA`
- 해당 캠페인에 연결된 화면이나 로직도 변형 금지

## 규칙
- 기존 Mock 데이터를 삭제하지 않고 추가만 한다
- ID는 고유하게 생성 (prefix + timestamp 패턴)
- 현실적인 한국 뷰티/패션 브랜드 데이터 사용
