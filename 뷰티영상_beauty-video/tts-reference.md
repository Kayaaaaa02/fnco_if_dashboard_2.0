# TTS 나레이션 참조

> SKILL.md에서 참조하는 서포트 파일. TTS 엔진별 보이스 프리셋, 사용법, 감정/톤 제어 상세.
> ElevenLabs 코드: `core/beauty_video/tts.py`
> OpenAI GPT TTS 코드: `core/beauty_video/tts_openai.py`

## 엔진 선택 가이드

| 엔진 | 모델 | 장점 | 단점 | 추천 상황 |
|------|------|------|------|----------|
| **ElevenLabs** (기본) | eleven_multilingual_v2 | ASMR/감정 태그, 타임스탬프, 자연스러운 한국어 | 비용 높음 | ASMR/속삭임, 자막 싱크 필요 시 |
| **OpenAI GPT TTS** | gpt-4o-mini-tts | instructions로 톤/감정 자유 제어, 13 보이스, 저렴 | 타임스탬프 미지원 | 다양한 톤 실험, 비용 절감 |

---

# Part 1: ElevenLabs TTS

## 규칙

1. **ElevenLabs TTS로 나레이션 생성** — 영상 자체는 무음, TTS는 후처리 Phase에서 추가
2. **기본 보이스**: nicole (soft, whisper-like ASMR)
3. **eleven_multilingual_v2 모델** 사용 (한국어 지원)
4. **MP3 → WAV 변환**: ffmpeg pcm_s16le, 44100Hz, mono
5. **속도 조절**: 영상 길이에 맞게 atempo 필터 자동 적용

## 보이스 프리셋

| 이름 | voice_id | 설명 | 기본 |
|------|----------|------|------|
| `nicole` | `piTKgcLEGmPE4e6mEKli` | Female, soft, whisper-like ASMR | **O** |
| `rachel` | `21m00Tcm4TlvDq8ikWAM` | Female, clear, warm narration | |
| `sarah` | `EXAVITQu4vr4xnSDxMaL` | Young female, soft, warm | |
| `charlotte` | `XB0fDUnXU5powFXDhCwa` | Female, youthful, Swedish-English | |
| `alice` | `Xb7hH8MSUJpSbSDYk0k2` | Female, confident, middle-aged | |
| `jessica` | `cgSgspJ2msm6clMCkdW9` | Young female, playful, bright, warm | |
| `matilda` | `XrExE9yKIg1WjnnlVkGX` | Female, knowledgeable, professional | |
| `lily` | `pFZP5JQG7iQjIQuC4Bku` | Female, velvety actress | |
| `hanna` | (Voice Library) | Korean female, natural and clear | |

> hanna voice_id는 ElevenLabs Voice Library에서 복사 필요 (현재 빈 값)

## 사용법

```python
from core.beauty_video.tts import (
    generate_tts,
    generate_tts_for_voice_preset,
    speed_adjust_tts,
    overlay_tts_on_video,
    VOICE_PRESETS,
)

# 프리셋으로 TTS 생성 (기본: nicole)
wav_path = generate_tts_for_voice_preset(
    preset_name="nicole",
    text="아침에 바른 이 광채, 밤까지 가면 믿으시겠어요?",
    output_path="output/tts_nicole.wav",
)

# voice_id 직접 사용
wav_path = generate_tts(
    voice_id="YA32deq2ptJFAupM9cWf",
    text="내 피부 톤에 맞는 광채를 찾으세요.",
    output_path="output/tts_raw.wav",
    stability=0.5,
    similarity_boost=0.75,
)

# 영상 길이에 맞게 속도 조절
adjusted = speed_adjust_tts(
    input_path="output/tts_raw.wav",
    target_duration=20.0,
    output_path="output/tts_adjusted.wav",
)

# 영상에 TTS 오버레이 (기존 BGM 볼륨 30%로 축소)
overlay_tts_on_video(
    video_path="output/video.mp4",
    tts_path="output/tts_adjusted.wav",
    output_path="output/video_with_tts.mp4",
    bgm_vol=0.3,
    tts_delay_ms=300,
)
```

## ElevenLabs v3 감정 태그

v3 모델(`model="eleven_v3"`)은 오디오 태그로 감정 표현 가능:

| 태그 | 설명 | 예시 |
|------|------|------|
| `[laughing]` | 웃음 | `[laughing] 진짜요?` |
| `[sad]` | 슬픔 | `[sad] 아쉽지만...` |
| `[excited]` | 흥분 | `[excited] 대박이에요!` |
| `[whisper]` | 속삭임 | `[whisper] 비밀인데요` |
| `[sigh]` | 한숨 | `[sigh] 피곤해요` |

## 비용

| 항목 | 단가 |
|------|------|
| ElevenLabs TTS (Creator plan) | ~$0.10 / 1,000자 |
| 4컷 나레이션 (~200자) | ~$0.02 (~30원) |

---

# Part 2: OpenAI GPT TTS

## 규칙

1. **OpenAI GPT TTS로 나레이션 생성** — ElevenLabs 대안, `instructions` 파라미터로 톤/감정 자유 제어
2. **기본 보이스**: nova (warm, engaging female)
3. **gpt-4o-mini-tts 모델** 사용 (90+ 언어 지원, 한국어 포함)
4. **출력 포맷**: wav 권장 (후처리 편의), mp3/opus/aac/flac/pcm 지원
5. **속도 조절**: `speed` 파라미터 (0.25~4.0, 기본 1.0) 또는 ffmpeg atempo 후처리

## 모델

| 모델 | 설명 | 용도 |
|------|------|------|
| `gpt-4o-mini-tts` | **추천** — 감정/톤 instructions 지원, 최신 | 뷰티 영상 나레이션 |
| `tts-1` | 저지연, 스트리밍 최적화 | 실시간 미리듣기 |
| `tts-1-hd` | 고품질 | 최종 결과물 |

## 보이스 프리셋 (13종)

| 이름 | 성별 | 설명 | 뷰티 추천 |
|------|------|------|----------|
| `alloy` | 중성 | Balanced, versatile | |
| `ash` | 남성 | Warm, conversational | |
| `ballad` | 중성 | Gentle, soothing | O (ASMR) |
| `coral` | 여성 | Clear, expressive | O |
| `echo` | 남성 | Smooth, resonant | |
| `fable` | 중성 | Storytelling, animated | |
| `nova` | 여성 | Warm, engaging | **O (기본)** |
| `onyx` | 남성 | Deep, authoritative | |
| `sage` | 중성 | Calm, wise | O (스킨케어) |
| `shimmer` | 여성 | Bright, energetic | O |
| `verse` | 중성 | Expressive, dynamic | |
| `marin` | 여성 | Soft, natural | O (내추럴) |
| `cedar` | 남성 | Rich, warm | |

> 뷰티 영상 추천: **nova** (기본), **ballad** (ASMR), **coral** (밝은 톤), **sage** (차분한 스킨케어)

## instructions 파라미터

GPT TTS의 핵심 차별점. 텍스트로 톤/감정/스타일을 자유롭게 지시.

### 뷰티 영상용 instructions 예시

| 시나리오 | instructions |
|----------|-------------|
| ASMR 속삭임 | `"Speak in a soft, intimate Korean ASMR whisper. Gentle and soothing, as if sharing a beauty secret."` |
| 밝은 리뷰 | `"Speak with cheerful, natural Korean. Like a friend excitedly recommending a product."` |
| 차분한 스킨케어 | `"Speak in calm, measured Korean. Professional dermatologist tone. Reassuring and knowledgeable."` |
| 럭셔리 브랜드 | `"Speak in elegant, refined Korean. Sophisticated and luxurious tone, like a high-end brand narrator."` |
| 언박싱 | `"Speak with building excitement in Korean. Start calm, crescendo with each reveal."` |

### instructions 작성 팁

1. **언어 명시** — `"Speak in Korean"` 반드시 포함
2. **톤 구체적** — `"soft"`, `"whisper"`, `"cheerful"` 등 형용사 활용
3. **비유 활용** — `"like a friend"`, `"as if sharing a secret"` 등 상황 묘사
4. **감정 변화** — `"Start calm, build excitement"` 등 흐름 지시 가능

## 사용법

```python
from core.beauty_video.tts_openai import (
    generate_gpt_tts,
    GPT_TTS_VOICES,
    GPT_TTS_MODELS,
    BEAUTY_INSTRUCTIONS,
)

# 기본 사용 (nova 보이스, ASMR 톤)
wav_path = generate_gpt_tts(
    text="아침에 바른 이 광채, 밤까지 가면 믿으시겠어요?",
    output_path="output/tts_nova.wav",
    voice="nova",
    model="gpt-4o-mini-tts",
    instructions="Speak in a soft, warm Korean ASMR tone. Whisper gently.",
    response_format="wav",
)

# 뷰티 프리셋 instructions 사용
wav_path = generate_gpt_tts(
    text="피부 장벽을 지키는 세라마이드 앰플이에요.",
    output_path="output/tts_skincare.wav",
    voice="sage",
    instructions=BEAUTY_INSTRUCTIONS["skincare"],
)

# 속도 조절 (0.25~4.0)
wav_path = generate_gpt_tts(
    text="촉촉함이 밤새 유지돼요.",
    output_path="output/tts_slow.wav",
    voice="ballad",
    speed=0.85,  # 약간 느리게
    instructions="Gentle Korean whisper, ASMR style.",
)

# 영상에 오버레이 (ElevenLabs와 동일한 후처리)
from core.beauty_video.tts import speed_adjust_tts, overlay_tts_on_video

adjusted = speed_adjust_tts(
    input_path="output/tts_nova.wav",
    target_duration=20.0,
    output_path="output/tts_adjusted.wav",
)

overlay_tts_on_video(
    video_path="output/video.mp4",
    tts_path="output/tts_adjusted.wav",
    output_path="output/video_with_tts.mp4",
    bgm_vol=0.3,
    tts_delay_ms=300,
)
```

## 출력 포맷

| 포맷 | 확장자 | 용도 |
|------|--------|------|
| `wav` | .wav | **추천** — 후처리(ffmpeg) 호환 최적 |
| `mp3` | .mp3 | 범용, 파일 크기 작음 |
| `opus` | .opus | 웹 스트리밍 최적 |
| `aac` | .aac | Apple 기기 호환 |
| `flac` | .flac | 무손실 |
| `pcm` | .pcm | Raw audio, 후처리 전용 |

## 비용

| 항목 | 단가 |
|------|------|
| gpt-4o-mini-tts | ~$0.015 / 1,000자 |
| tts-1 / tts-1-hd | ~$0.015 / 1,000자 |
| 4컷 나레이션 (~200자) | ~$0.003 (~4원) |

> ElevenLabs 대비 약 **7배 저렴** (동일 200자 기준: EL ~30원 vs GPT ~4원)

## 스트리밍 지원

실시간 미리듣기에 활용 가능:

```python
from openai import OpenAI

client = OpenAI()

# 스트리밍 TTS (실시간 재생/미리듣기용)
with client.audio.speech.with_streaming_response.create(
    model="gpt-4o-mini-tts",
    voice="nova",
    input="피부 톤이 한 단계 밝아졌어요.",
    instructions="Soft Korean whisper.",
    response_format="pcm",
) as response:
    for chunk in response.iter_bytes(1024):
        # 실시간 오디오 처리
        pass
```

## ElevenLabs vs OpenAI GPT TTS 비교

| 항목 | ElevenLabs | OpenAI GPT TTS |
|------|-----------|----------------|
| 모델 | eleven_multilingual_v2 | gpt-4o-mini-tts |
| 보이스 수 | 8 프리셋 + Library | 13 내장 |
| 한국어 | O | O (90+ 언어) |
| 톤/감정 제어 | v3 태그 ([whisper] 등) | instructions 자유 텍스트 |
| 타임스탬프 | O (자막 싱크) | X |
| 스트리밍 | O | O |
| 비용/200자 | ~30원 | ~4원 |
| ASMR 적합도 | 매우 높음 (nicole) | 높음 (ballad + instructions) |
| 추천 | ASMR/자막싱크 중시 | 비용/다양한 톤 실험 |
