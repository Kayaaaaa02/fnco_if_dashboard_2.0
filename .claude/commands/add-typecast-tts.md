# Typecast TTS 나레이션 추가

Typecast AI TTS (Text-to-Speech) 나레이션 기능을 확장합니다.

## 입력
- $ARGUMENTS: TTS 요구사항 (예: "새 목소리 프리셋 추가", "다국어 나레이션 지원" 등)

## 현재 Typecast API (2026-03 기준, 신규 API)

### API 사양

| 항목 | 값 |
|------|------|
| Base URL | `https://api.typecast.ai` |
| 인증 | `X-API-KEY` 헤더 (Bearer 아님!) |
| TTS 엔드포인트 | `POST /v1/text-to-speech` |
| Voice 목록 | `GET /v2/voices?model=ssfm-v30` |
| 모델 | `ssfm-v30` (최신) |
| 응답 형식 | **wav 바이너리 직접 반환 (동기)** — 폴링 불필요 |

### 요청 Body

```json
{
  "model": "ssfm-v30",
  "text": "나레이션 텍스트",
  "voice_id": "tc_675a74035ff33c1eeff6255f",
  "prompt": {
    "emotion_type": "preset",
    "emotion_preset": "normal"
  }
}
```

- `emotion_type`: `"preset"` | `"smart"` | `"embedding"` (preset 사용)
- `emotion_preset`: normal, happy, sad, angry, whisper, toneup, tonedown

### Server 구조

- `server/src/controllers/typecastController.js`
  - 성별+톤 → voice_id 매핑 (VOICE_MAP)
  - 감정 프리셋 → emotion_preset 매핑 (EMOTION_MAP)
  - **동기 호출** → wav 바이너리 → 디스크 저장 → URL 반환
  - 오디오 서빙: `GET /api/v2/tts/serve/:filename`
- `server/src/routes/typecast.js` — TTS 라우트
- 오디오 저장: `server/uploads/tts-audio/`

### Client 구조

- `client/src/hooks/useTypecast.js` — mutation Hook (`POST /api/v2/tts/generate`)
- `client/src/components/creative/AIImageEditor.jsx` — 나레이션 UI (STEP별)

### Voice 매핑 (현재)

| 키 | voice_id | 설명 |
|------|----------|------|
| female_bright | tc_675a74035ff33c1eeff6255f | Wonkyung - TikTok/Reels/Shorts |
| female_calm | tc_6763bef751dc3fb17792acaf | Suyoon - Documentary |

### 플로우

1. 클라이언트에서 텍스트 + 성별/톤/감정 선택
2. 서버에서 Typecast API로 **동기** TTS 요청
3. wav 바이너리를 `uploads/tts-audio/`에 저장
4. 서빙 URL 반환 → 클라이언트 재생

## 참조 문서

- `뷰티영상_beauty-video/tts-reference.md` — 대체 TTS 엔진(ElevenLabs, OpenAI GPT TTS) 상세
- `뷰티영상_beauty-video/SKILL.md` — Phase 4 TTS 파이프라인

## 수행 작업

1. 새 voice 프리셋 추가 (GET /v2/voices로 조회)
2. UI 컴포넌트 확장 (재생기, 프리셋 선택)
3. 필요 시 배치 합성 지원

## 규칙

- Typecast API 키는 환경변수 (TYPECAST_API_KEY)
- **X-API-KEY 헤더 사용** (Bearer 아님)
- 응답은 wav 바이너리 — responseType: 'arraybuffer'로 받아 디스크 저장
- 오디오 파일은 `uploads/tts-audio/`에 저장, 서빙 API로 접근
