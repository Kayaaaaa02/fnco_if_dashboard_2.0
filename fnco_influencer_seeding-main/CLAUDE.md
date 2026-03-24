# Project Rules

## 기존 화면/컴포넌트 보호 규칙 (절대 준수)

1. **기존 구현된 화면(컴포넌트, 페이지)을 절대 삭제하거나 기능을 제거하지 않는다.**
   - 새 기능 추가 시 기존 컴포넌트의 JSX 구조, 로직, 스타일을 임의로 변경/삭제하지 않는다.
   - 리팩토링이 필요한 경우 반드시 사용자에게 확인을 받은 후 진행한다.

2. **파일 삭제 금지**: `client/src/components/`, `client/src/pages/` 하위의 기존 파일을 삭제하지 않는다.

3. **기존 라우트 보호**: 이미 등록된 라우트 경로를 제거하거나 변경하지 않는다.

4. **기존 API 엔드포인트 보호**: `server/src/routes/`, `server/src/controllers/` 하위의 기존 엔드포인트를 삭제하거나 동작을 변경하지 않는다.

5. **변경이 필요한 경우**: 기존 화면이나 로직을 수정해야 할 때는 반드시 사용자에게 "이 화면/로직을 수정해도 되겠습니까?"라고 확인을 받고 나서 진행한다.

## PDA 프레임워크 설정 화면 — 수정 금지 (사용자 확정)

아래 파일들은 완성된 화면으로, 사용자가 명시적으로 수정 금지를 지시했다. **어떤 이유로든 수정하지 않는다.**

- `client/src/components/pda/PDASetup.jsx`
- `client/src/components/pda/ConceptGrid.jsx`
- `client/src/components/pda/PDAMatrix.jsx`
- `client/src/components/pda/ProductBrief.jsx`
- `client/src/components/pda/PersonaEditor.jsx`
- `client/src/components/pda/DesireEditor.jsx`
- `client/src/components/pda/ConceptCard.jsx`
- `client/src/hooks/usePDA.js`
- `server/src/routes/pda.js`
- `server/src/controllers/pdaController.js`

## 영상 생성 (KlingAI I2V) 지침

> 참조 문서: `뷰티영상_beauty-video/` (SKILL.md, kling-reference.md 등)
> 참조 코드: `beauty_video/` (Python — config.py, client.py, generator.py, pipeline.py 등)

### 핵심 규칙

1. **영상은 항상 무음 생성** (`enable_audio=False`) — TTS/BGM은 후처리에서 추가
2. **비디오 생성은 KlingAI I2V** — JWT 인증 (HS256, 30분 TTL)
3. **CDN URL은 즉시 다운로드** — Kling CDN URL ~30일 만료

### KlingAI API (서버: `server/src/controllers/videoController.js`)

| 항목 | 값 |
|------|------|
| Base URL | `https://api.klingai.com` |
| 인증 | JWT (HS256) — `KLING_API_ACCESS_KEY`, `KLING_API_SECRET_KEY` |
| 엔드포인트 | `POST /v1/videos/image2video` (I2V), `GET /v1/videos/image2video/{taskId}` (폴링) |
| 기본 모델 | `kling-v2-master` |
| 폴링 | 5초 간격, 최대 5분 (60회) |
| 비율 | 9:16 (릴스/숏폼) |

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
| Timeout (5분) | No | poll_timeout 증가 |

### 파이프라인 흐름 (6 Phase)

```
Phase 1:   스타트프레임 이미지 생성 (Gemini gemini-3-pro-image-preview)
Phase 1.5: 자막 이미지 베이킹 (subtitle 필드 있는 컷만)
Phase 2:   I2V 영상 생성 (KlingAI, 병렬, 무음)
Phase 3:   최종 연결 (moviepy concatenate)
Phase 4:   TTS 나레이션 (Typecast / ElevenLabs / OpenAI GPT TTS)
Phase 5:   BGM 생성 + 오버레이 (Suno API)
Phase 6:   싱크 자막 오버레이
```

### TTS (현재 프로젝트: Typecast)

| 항목 | 값 |
|------|------|
| API | `https://api.typecast.ai/v1/text-to-speech` |
| 인증 | `X-API-KEY` 헤더 |
| 모델 | `ssfm-v30` |
| 감정 | preset: normal, happy, sad, angry, whisper, toneup, tonedown |
| 응답 | wav 바이너리 직접 반환 (동기) |

### 비용 참고 (4컷 기준)

| 항목 | 단가 | 4컷 |
|------|------|------|
| 스타트프레임 (Gemini 2K) | 190원 | 760원 |
| I2V (Kling 5초 std) | ~122원 | ~488원 |
| TTS (Typecast ~200자) | 무료등급 내 | - |
| **합계** | | **~1,248원** |

## 고정 목데이터 보호 규칙

1. **'쉬어 벨벳 베일 틴트' 캠페인 목데이터**(`MOCK_VELVET_TINT_ID`, `mockVelvetTintCampaign`, `mockVelvetTintHub`, `mockVelvetTintPDA`)는 로직 확인용 고정 데이터이므로 수정/삭제하지 않는다.

2. 해당 캠페인에 연결된 화면이나 로직도 변형하지 않는다.
