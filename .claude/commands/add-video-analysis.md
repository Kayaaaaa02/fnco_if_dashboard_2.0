# 영상 분석/생성 기능 추가

AI 기반 영상 콘텐츠 분석 및 KlingAI I2V 영상 생성 기능을 확장합니다.

## 입력
- $ARGUMENTS: 요구사항 (예: "썸네일 분석 추가", "Kling 모델 변경", "영상 품질 개선" 등)

## KlingAI I2V 영상 생성 (현재 구조)

### API 사양

| 항목 | 값 |
|------|------|
| Base URL | `https://api.klingai.com` |
| 인증 | JWT (HS256) — `KLING_API_ACCESS_KEY`, `KLING_API_SECRET_KEY` |
| I2V 생성 | `POST /v1/videos/image2video` |
| 상태 폴링 | `GET /v1/videos/image2video/{taskId}` |
| 기본 모델 | `kling-v2-master` |
| 폴링 | 5초 간격, 최대 5분 (60회) |

### JWT 토큰 생성

```javascript
jwt.sign(
  { iss: ACCESS_KEY, exp: now + 1800, nbf: now - 5, iat: now },
  SECRET_KEY,
  { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } }
);
```

### I2V 요청 Body

```json
{
  "model_name": "kling-v2-master",
  "image": "data:image/png;base64,{...}",
  "prompt": "Smooth cinematic motion...",
  "negative_prompt": "blur, distortion, low quality, watermark, text overlay",
  "cfg_scale": 0.5,
  "mode": "std",
  "duration": "5",
  "aspect_ratio": "9:16"
}
```

### I2V 옵션

| 옵션 | 선택지 | 기본값 |
|------|--------|--------|
| 모델 | kling-v1-6, kling-v2-0, kling-v2-5, kling-v2-master | kling-v2-master |
| 비율 | 16:9, 9:16, 1:1 | 9:16 |
| 길이 | 5초, 10초 | 5초 |
| 모드 | std, pro | std |
| CFG Scale | 0.0~1.0 | 0.5 |

### 에러 핸들링

| 에러 | 재시도 | 복구 |
|------|--------|------|
| 429 Rate Limit | Yes (60초 대기) | 자동 재시도 |
| 503 Server Overloaded | Yes (exponential backoff) | 자동 재시도 |
| 500 Server Error | Yes (exponential backoff) | 자동 재시도 |
| 401 Unauthorized | No | API 키/JWT 확인 |
| Task Failed | No | 프롬프트 수정 후 재시도 |

### Server 구조

- `server/src/controllers/videoController.js`
  - `generateKlingToken()` — JWT 생성 (30분 TTL)
  - `klingImageToVideo()` — I2V 생성 + 폴링
  - `generateVideo()` — 전체 파이프라인 (I2V → concat → 최종 MP4)
  - `getVideoStatus()` — 개별 task 상태 조회
  - `serveVideo()` — 로컬 영상 파일 서빙 (Range request 지원)
- `server/src/routes/video.js` — 영상 라우트
- `server/scripts/concat_video.py` — moviepy 기반 영상 합성

### Client 구조

- `client/src/hooks/useVideo.js` — mutation/query Hook
- `client/src/components/creative/AIImageEditor.jsx` — 영상 생성 UI

### 파이프라인 흐름

```
1) STEP별 Kling I2V 생성 (병렬) — 이미지 base64 → 영상
2) STEP별 나레이션 오디오 다운로드
3) Python moviepy concat_video.py → 최종 MP4
4) 임시 파일 정리
5) 서빙 URL 반환
```

## 영상 분석 (기존)

### Server
- `server/src/controllers/videoAnalysisController.js` — AI 마크다운 파싱, 섹션 추출
- `server/src/sql/videoAnalysis/selectQuery.js` — 분석 결과 조회

### Client
- `client/src/hooks/useVideoAnalysis.js` — TanStack Query Hook
- `client/src/components/content-engine/VideoAnalysisPanel.jsx` — 분석 패널

## 참조 문서

- `뷰티영상_beauty-video/kling-reference.md` — KlingAI T2V/I2V 상세, 에러 핸들링
- `뷰티영상_beauty-video/SKILL.md` — 6 Phase 뷰티 영상 파이프라인
- `뷰티영상_beauty-video/pricing.md` — 비용 테이블
- `beauty_video/config.py` — VideoGenerationConfig, 비용 계산
- `beauty_video/client.py` — KlingAI API 클라이언트 (JWT, 폴링)
- `beauty_video/generator.py` — T2V/I2V 고수준 함수

## 규칙

- 영상은 **항상 무음 생성** (enable_audio=False) — TTS/BGM은 후처리
- Kling CDN URL은 **즉시 다운로드** (~30일 만료)
- 기존 videoController 에러 핸들링 패턴 유지
- 비동기 생성 → 상태 폴링 패턴
