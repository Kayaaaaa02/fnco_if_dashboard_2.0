# 소셜 미디어 크롤러 추가

Python 기반 소셜 미디어 크롤러를 프로젝트 패턴에 맞게 생성합니다.

## 입력
- $ARGUMENTS: 플랫폼명 또는 크롤링 대상 (예: "threads", "pinterest", "네이버 블로그" 등)

## 수행 작업

1. **Python 크롤러** 생성: `server/crawling/{platform}_crawler.py`
   - 패턴 참고: `server/crawling/instagram_crawler.py`
   - 클래스 기반 구조: `{Platform}Crawler`
   - `__init__`: download_path 설정 (result/ 디렉토리)
   - 다운로드/메타데이터 추출 메서드
   - JSON 형태 결과 반환
   - 에러 핸들링 + 로깅 (logging 모듈)
   - yt-dlp 또는 적절한 라이브러리 사용

2. **Node.js 연동** (필요 시):
   - `server/src/controllers/crawlingController.js`에 새 핸들러 추가
   - `server/src/utils/pythonRunner.js` 활용하여 Python 스크립트 실행
   - `server/src/routes/crawling.js`에 라우트 추가

3. **의존성**: `server/requirements.txt`에 필요한 Python 패키지 추가

## 기존 크롤러 목록
- `instagram_crawler.py` — yt-dlp + instaloader
- `youtube_crawler.py`
- `twitter_crawler.py`
- `tiktok_crawler.py`

## 규칙
- 기존 크롤러 파일을 수정하지 않는다
- rate limiting / delay 적용 필수
- 인증 정보는 환경변수로 관리
- 결과는 JSON stdout으로 Node.js에 전달
