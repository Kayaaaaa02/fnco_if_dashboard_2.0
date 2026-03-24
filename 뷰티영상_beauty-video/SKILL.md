---
name: beauty-video
description: 뷰티 영상 워크플로 - Gemini 이미지 + KlingAI I2V + TTS + BGM + 자막
user-invocable: true
---

# 뷰티 영상 워크플로 (Beauty Video)

> Banila Co 뷰티 릴스 End-to-End 파이프라인.
> 모든 코드: `core/beauty_video/`

## 절대 규칙

1. **이미지 생성은 Gemini `gemini-3-pro-image-preview`만 사용** (`from core.config import IMAGE_MODEL`)
2. **비디오 생성은 KlingAI** — 모델/키는 `core/beauty_video/config.py`에서 import
3. **영상은 항상 무음 생성** (`enable_audio=False`), TTS/BGM은 후처리 Phase에서 추가
4. **나레이션은 ElevenLabs 또는 OpenAI GPT TTS**, **BGM은 Suno API** — gTTS 등 저품질 TTS 금지
5. **항상 병렬/배치 처리** (`asyncio.gather`)
6. **비디오 URL은 즉시 다운로드** (CDN URL ~30일 만료)

## 모듈 구조

| 파일 | 역할 |
|------|------|
| `config.py` | VideoGenerationConfig + KLING_* 설정 |
| `client.py` | KlingAI API 클라이언트 (JWT 인증, 30분 TTL) |
| `generator.py` | T2V/I2V 고수준 생성 함수 |
| `pipeline.py` | 뷰티 릴스 End-to-End 파이프라인 (6 Phase) |
| `startframe.py` | Gemini 스타트프레임 이미지 자동 생성 (Phase 1) |
| `subtitle_style.py` | 숏폼 자막 이미지 베이킹 (Phase 1.5) |
| `video_subtitle.py` | 싱크 자막 영상 오버레이 (Phase 6) |
| `tts.py` | ElevenLabs TTS 나레이션 (Phase 4) |
| `tts_openai.py` | OpenAI GPT TTS 나레이션 (Phase 4 대안) |
| `bgm.py` | Suno API BGM 음악 (Phase 5) |
| `presets.py` | 뷰티 카메라/컷 프리셋 |
| `prompt_builder.py` | 패션 비디오 프롬프트 빌더 |

---

## 파이프라인

```
Phase 1:   스타트프레임 이미지 자동 생성 (Gemini, 병렬)
    ↓ image_path 없는 컷만 → asyncio.gather
Phase 1.5: 자막 이미지 베이킹 (subtitle 필드 있는 컷만)
    ↓
Phase 2:   I2V 영상 생성 (KlingAI, 병렬, 무음)
    ↓ enable_audio=False
Phase 3:   최종 연결 (moviepy concatenate)
    ↓
Phase 4:   TTS 나레이션 (ElevenLabs) + 속도 조절
    ↓
Phase 5:   BGM 생성 + 오버레이 (Suno API)
    ↓
Phase 6:   싱크 자막 오버레이 (reels/broadcast 스타일)
    ↓ 모든 컷에 싱크 자막 표시 (이미지 자막과 위치/역할이 다르므로 공존)
Final:     릴스 MP4 출력
```

---

## 대화형 워크플로

> 원칙: 사용자 입력 먼저 → 옵션 → 비용 → 실행
> 브랜드는 **Banila Co 고정** — 브랜드 선택 질문 불필요

### Step 1: 사용자 입력 수집

3가지를 한번에 확인:

1. **시나리오** — 제품/컷별 구성
2. **모델 얼굴 참조 이미지** — 인물 동일성 유지용 (최대 3장)
3. **제품 이미지** — 제품 정확도 유지용 (최대 3장)

```
Q1: "어떤 Banila Co 제품의 릴스를 만들까요? 시나리오가 있으면 함께 알려주세요."
Q2: "모델 얼굴 참조 이미지가 있나요?"
Q3: "제품 이미지가 있나요?"
```

### Step 2: 옵션 선택

| 옵션 | 선택지 | 기본값 |
|------|--------|--------|
| 비율 | 9:16, 16:9, 1:1 | 9:16 |
| 길이 | 5초 | 5초 (고정) |
| 비디오 모드 | Standard, Pro | Pro |
| 이미지 해상도 | 1K, 2K | 2K |

### Step 3: 비용 안내

> Kling I2V: **0.168 USD/초** (5초 = 0.84 USD). 환율은 당일 기준 계산.

| 항목 | 단가 | 4컷 기준 |
|------|------|----------|
| 스타트프레임 (Gemini 2K) | 190원/장 | 760원 |
| I2V (Kling 5초) | ~1,231원 | ~4,924원 |
| **합계** | | **~5,684원** |

> 전체 비용 테이블: [pricing.md](./pricing.md) 참조

### Step 4: 생성 실행

```python
from core.beauty_video import generate_beauty_reels, VideoGenerationConfig

# scenario에 visual_style 포함 (선택, 기본: "clean_bright")
scenario = {
    "brand": "Banila Co",
    "visual_style": "clean_bright",  # clean_bright | warm_natural | cool_editorial | soft_pink
    "cuts": [...],
    ...
}

result = await generate_beauty_reels(
    scenario=scenario,
    source_images={"face": [...], "product": [...]},
    output_dir=output_dir,
    video_config=VideoGenerationConfig(
        model_name="kling-v2-6",
        mode="pro",
        duration="5",
        aspect_ratio="9:16",
    ),
    enable_audio=False,
    concat=True,
)
```

---

## 시나리오 구조

```json
{
  "brand": "Banila Co",
  "product": "B. Highlighter",
  "description": "highlighter_reels",
  "visual_style": "clean_bright",
  "narration": {
    "cut01_hook": "아침에 바른 이 광채, 밤까지 가면 믿으시겠어요?",
    "cut02_apply": "프라이머 명가답게 모공 부각 0."
  },
  "phrases": [
    ["아침에 바른 이 광채,", "밤까지 가면", "믿으시겠어요?"],
    ["프라이머 명가답게", "모공 부각 0."]
  ],
  "cuts": [
    {
      "id": "cut01_hook",
      "name": "Hook",
      "type": "hook",
      "scene_description": "Korean beauty influencer holding highlighter...",
      "motion_prompt": "The woman holds up the compact toward camera...",
      "subtitle": {
        "style": "thumbnail",
        "texts": {
          "subtitle": "압도적 빔력;;",
          "main": ["하이라이터", "5종 비교"],
          "brand": "BANILA CO",
          "price": "16,000원"
        }
      }
    }
  ]
}
```

**소스 이미지:**
```python
source_images = {
    "face": ["face1.jpg", "face2.jpg"],     # 최대 3장, 인물 동일성
    "product": ["product.jpg"],               # 최대 3장, 제품 정확도
}
```

---

## Phase 1: 스타트프레임 자동 생성

`image_path`가 없는 컷에 대해 Gemini로 자동 생성.

```python
from core.beauty_video.startframe import generate_startframes

frame_paths = await generate_startframes(
    scenario=scenario,
    source_images={"face": ["face.jpg"], "product": ["product.jpg"]},
    output_dir="outputs/startframes",
    aspect_ratio="9:16",
    resolution="2K",
    visual_style="clean_bright",  # [선택] 기본값: clean_bright
)
```

- 컷 타입별 프롬프트 자동 생성 (`BEAUTY_CUT_TYPES` 참조)
- 커스텀 프롬프트: 컷에 `image_prompt` 필드가 있으면 사용
- 재시도: 429/503 → `(attempt+1)*5`초 대기, 최대 3회
- `visual_style`: 전체 컷에 걸쳐 톤 일관성을 보장하는 조명/색감 프리셋

### visual_style 프리셋

| 프리셋 | 조명 | 색보정 | 피부톤 | 배경톤 | 용도 |
|--------|------|--------|--------|--------|------|
| `clean_bright` (기본) | 소프트박스, 고르고 밝음 | 쿨 뉴트럴 | 밝고 깨끗한 피부 | 흰색/밝은 회색 | K-뷰티 스튜디오 |
| `warm_natural` | 은은한 자연광 | 살짝 웜 | 황금빛 건강한 피부 | 크림/아이보리 | 라이프스타일/일상 |
| `cool_editorial` | 사이드 림 + 하이키 | 콜드 블루쉬 | 도자기 피부 | 순백/차가운 회색 | 에디토리얼/하이엔드 |
| `soft_pink` | 확산 핑크젤 | 로즈 틴트 | 복숭아빛 피부 | 블러쉬/로즈핑크 | 여성스러움/핑크 무드 |

시나리오의 `"visual_style"` 필드(선택, 기본 `"clean_bright"`)로도 지정 가능:

---

## Phase 1.5: 자막 이미지 베이킹

컷에 `subtitle` 필드가 있으면 스타트프레임에 자막을 베이킹 → I2V 후 영상 첫 프레임부터 자막 표시.

- `thumbnail` 스타일: 유튜브 썸네일 (G마켓 산스 볼드, 이탤릭, 강조색 팔레트)
- `broadcast` 스타일: 방송 자막 바 (흰색 반투명 바 + 검정 텍스트)

> 스타일 상세 사양: [subtitle-styles.md](./subtitle-styles.md) 참조

---

## Phase 4: TTS 나레이션

**2가지 TTS 엔진 중 선택** — ElevenLabs (기본) 또는 OpenAI GPT TTS.

| 엔진 | 모델 | 장점 | 한국어 | 기본 보이스 |
|------|------|------|--------|------------|
| **ElevenLabs** (기본) | eleven_multilingual_v2 | ASMR/감정 태그, 타임스탬프 | O | nicole |
| **OpenAI GPT TTS** | gpt-4o-mini-tts | instructions로 톤/감정 제어, 13 보이스 | O (90+언어) | nova |

파이프라인은 **타임스탬프 반환 함수**를 사용해 Phase 6의 정밀 자막 싱크에 활용한다.

### ElevenLabs (기본)

```python
from core.beauty_video.tts import (
    generate_tts_for_voice_preset,
    generate_tts_for_voice_preset_with_timestamps,
    overlay_tts_on_video,
)

# 타임스탬프 포함 (Phase 6 자막 싱크용, 권장)
result = generate_tts_for_voice_preset_with_timestamps("nicole", text, "output/tts.wav")
# result = {"wav_path": str, "alignment": dict or None}

overlay_tts_on_video("video.mp4", result["wav_path"], "output/with_tts.mp4", bgm_vol=0.3)
```

### OpenAI GPT TTS

```python
from core.beauty_video.tts_openai import generate_gpt_tts, GPT_TTS_VOICES

wav_path = generate_gpt_tts(
    text="아침에 바른 이 광채, 밤까지 가면 믿으시겠어요?",
    output_path="output/tts.wav",
    voice="nova",           # alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar
    model="gpt-4o-mini-tts",
    instructions="Speak in a soft, warm Korean ASMR tone. Whisper gently.",  # 톤/감정 자유 제어
    response_format="wav",
)
```

> 보이스 프리셋/사용법 상세: [tts-reference.md](./tts-reference.md) 참조

---

## Phase 5: BGM 생성

Suno API로 인스트루멘탈 BGM 생성. 기본 모델: V4_5.

```python
from core.beauty_video.bgm import generate_bgm_for_preset, overlay_bgm_on_video

bgm = generate_bgm_for_preset("beauty_lofi", "output/bgm.mp3")
overlay_bgm_on_video("video.mp4", bgm, "output/final.mp4", bgm_vol=0.15)
```

> BGM 프리셋/사용법 상세: [bgm-reference.md](./bgm-reference.md) 참조

---

## Phase 6: 싱크 자막

TTS에 맞춰 실시간 싱크 자막 오버레이. 모든 컷에 싱크 자막을 표시한다 (이미지 자막=상단 프로모션, 싱크 자막=하단 나레이션 → 역할/위치가 달라 겹치지 않음).

| 스타일 | 외관 |
|--------|------|
| `reels` | 흰색 글씨 + 아웃라인 + 그림자 (인스타 릴스) |
| `broadcast` | 흰색 반투명 바 + 검정 글씨 (방송 뉴스) |

### 자막 타이밍 산출 방식

Phase 4에서 `alignment` 데이터(문자 단위 타임스탬프)를 받은 경우 정밀 싱크를 사용하고, 없으면 자동 폴백한다.

```python
from core.beauty_video.video_subtitle import calculate_phrase_timings_from_alignment

# alignment 있을 때: ElevenLabs 타임스탬프 기반 정밀 싱크
if alignment:
    timings = calculate_phrase_timings_from_alignment(
        phrases_per_cut=scenario["phrases"],
        alignment=alignment,         # TTS 반환 alignment dict
        combined_text=combined_text, # 전체 나레이션 텍스트
        speed_factor=1.0,
    )
else:
    # 폴백: 글자 수 비례 타이밍 자동 계산
    timings = calculate_phrase_timings_proportional(...)
```

**video_subtitle.py 신규 함수:**

| 함수 | 설명 |
|------|------|
| `calculate_phrase_timings_from_alignment(phrases_per_cut, alignment, combined_text, speed_factor)` | ElevenLabs alignment 기반 정밀 타이밍. alignment 없으면 None 반환 → 폴백 사용 |

> 싱크 자막 상세: [subtitle-styles.md](./subtitle-styles.md) 참조

---

## 단독 T2V/I2V

파이프라인 없이 단독으로 비디오 생성할 때는 [kling-reference.md](./kling-reference.md) 참조.

---

## 뷰티 프리셋

```python
from core.beauty_video.presets import (
    BEAUTY_CAMERA_MOVES,     # selfie_zoom, product_pan, mirror_static 등
    BEAUTY_NEGATIVE_PROMPT,  # 공통 네거티브 프롬프트
    BEAUTY_CUT_TYPES,        # hook, apply, proof, cta 컷 타입
)
```

---

## 출력 폴더 구조

```
Fnf_studio_outputs/beauty_video/
└── {YYYYMMDD_HHMMSS}_{description}/
    ├── startframes/              # Phase 1 생성 이미지
    ├── cut01_hook/
    │   ├── images/
    │   │   └── input_source_01.jpg
    │   ├── videos/
    │   │   └── output_001.mp4
    │   ├── prompt.json
    │   └── config.json
    ├── cut02_apply/
    ├── cut03_proof/
    ├── cut04_cta/
    ├── tts/                      # Phase 4 TTS 오디오
    ├── final_reels.mp4           # 최종 릴스
    └── summary.json
```

---

## .env 설정

```bash
# KlingAI (비디오 생성)
KLING_ACCESS_KEY=your_access_key_here
KLING_SECRET_KEY=your_secret_key_here

# ElevenLabs (TTS 나레이션 - 옵션 1)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# OpenAI (GPT TTS 나레이션 - 옵션 2)
OPENAI_API_KEY=your_openai_api_key_here

# Suno (BGM 생성)
SUNO_API_KEY=your_suno_api_key_here

# Gemini (이미지 생성) - CLAUDE.md에서 공통 관리
GEMINI_API_KEY=key1,key2,key3
```

---

## 서포트 파일

| 파일 | 내용 |
|------|------|
| [subtitle-styles.md](./subtitle-styles.md) | 자막 스타일 상세 (thumbnail/broadcast, 싱크 자막) |
| [tts-reference.md](./tts-reference.md) | TTS 보이스 프리셋, 사용법, v3 감정 태그 |
| [bgm-reference.md](./bgm-reference.md) | BGM Suno 모델, 프리셋, 사용법 |
| [kling-reference.md](./kling-reference.md) | 단독 T2V/I2V 사용법, 에러 핸들링 |
| [pricing.md](./pricing.md) | 전체 비용 테이블 (Kling, Veo 3.1, Gemini, TTS, BGM) |

---

## 버전

| 버전 | 날짜 | 변경 |
|------|------|------|
| v1.0 | 2026-03-10 | 초기 버전 - Banila Co 하이라이터 캠페인으로 검증 |
| v2.0 | 2026-03-11 | T2V/I2V + 숏폼자막 + 파이프라인 통합 |
| v3.0 | 2026-03-11 | TTS + BGM 추가, 7 Phase 확장 |
| v4.0 | 2026-03-11 | Phase 1 스타트프레임 + Phase 7 싱크 자막 + 이미지 구운 자막 스킵 |
| v5.0 | 2026-03-12 | V2A 제거 (무음 영상), Banila Co 고정, 대화형 4단계, USD 가격 |
| v6.0 | 2026-03-12 | SKILL.md 간소화 (906→~280줄), 상세 참조를 서포트 파일 5개로 분리 |
| v7.0 | 2026-03-12 | visual_style 프리셋 (Phase 1), 타임스탬프 TTS (Phase 4), alignment 기반 자막 싱크 (Phase 6) |
| v7.1 | 2026-03-12 | Phase 6 자막 필터링 제거 (모든 컷 싱크 자막 표시), 제품 참조 EXACT MATCH 강화 |
| v8.0 | 2026-03-12 | OpenAI GPT TTS (gpt-4o-mini-tts) 옵션 추가 — ElevenLabs와 선택 가능 |
