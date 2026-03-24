"""
STEP별 Kling 영상 + Typecast 나레이션 + 자막을 moviepy로 합성하여 최종 1개 영상 출력.

config.json:
{
  "steps": [
    {
      "video": "/path/to/step1.mp4",
      "audio": "/path/to/narration1.mp3",
      "duration": 5,
      "subtitle": "아직도 사진 찍을 때 필터 쓰세요?"
    }
  ]
}
"""

import argparse
import json
import sys
import os
import platform

# moviepy의 dotenv 파싱 에러 방지 — load_dotenv를 no-op으로 패치
try:
    import dotenv
    dotenv.load_dotenv = lambda *a, **kw: None
except ImportError:
    pass

try:
    from moviepy import (
        VideoFileClip, AudioFileClip, TextClip,
        concatenate_videoclips, CompositeVideoClip, CompositeAudioClip,
        vfx, afx,
    )
except ImportError:
    try:
        from moviepy.editor import (
            VideoFileClip, AudioFileClip, TextClip,
            concatenate_videoclips, CompositeVideoClip, CompositeAudioClip,
        )
        from moviepy.video import fx as vfx
        from moviepy.audio import fx as afx
    except ImportError:
        print(json.dumps({"error": "moviepy 미설치. pip install moviepy"}))
        sys.exit(1)


def find_korean_font():
    """한글 지원 폰트 경로 탐색"""
    candidates = []
    if platform.system() == 'Windows':
        fonts_dir = 'C:/Windows/Fonts'
        candidates = [
            os.path.join(fonts_dir, 'malgunbd.ttf'),   # 맑은 고딕 Bold
            os.path.join(fonts_dir, 'malgun.ttf'),      # 맑은 고딕
            os.path.join(fonts_dir, 'NanumGothicBold.ttf'),
        ]
    else:
        candidates = [
            '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf',
            '/usr/share/fonts/nanum/NanumGothicBold.ttf',
            '/System/Library/Fonts/AppleSDGothicNeo.ttc',
        ]
    for f in candidates:
        if os.path.exists(f):
            return f
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    # moviepy는 모듈 레벨에서 이미 import 완료

    try:
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"config 로드 실패: {e}"}))
        sys.exit(1)

    steps = config.get('steps', [])
    if not steps:
        print(json.dumps({"error": "steps가 비어있습니다."}))
        sys.exit(1)

    font_path = find_korean_font()
    if not font_path:
        print("[WARN] 한글 폰트를 찾을 수 없습니다. 자막이 깨질 수 있습니다.", file=sys.stderr)

    clips = []

    for i, step in enumerate(steps):
        video_path = step.get('video')
        audio_path = step.get('audio')
        target_duration = step.get('duration')
        subtitle_text = step.get('subtitle', '').strip()

        if not video_path or not os.path.exists(video_path):
            print(f"[WARN] STEP {i+1}: 영상 없음 — {video_path}", file=sys.stderr)
            continue

        try:
            clip = VideoFileClip(video_path)

            # 목표 지속시간에 맞게 조정
            if target_duration and target_duration > 0:
                if clip.duration > target_duration:
                    clip = clip.subclipped(0, target_duration)
                elif clip.duration < target_duration:
                    loop_count = int(target_duration / clip.duration) + 1
                    clip = clip.with_effects([vfx.Loop(loop_count)])
                    clip = clip.subclipped(0, target_duration)

            # 나레이션 오디오 오버레이
            if audio_path and os.path.exists(audio_path):
                try:
                    narration = AudioFileClip(audio_path)
                    if narration.duration > clip.duration:
                        narration = narration.subclipped(0, clip.duration)

                    if clip.audio is not None:
                        original_audio = clip.audio.with_effects([afx.MultiplyVolume(0.3)])
                        mixed = CompositeAudioClip([original_audio, narration])
                        clip = clip.with_audio(mixed)
                    else:
                        clip = clip.with_audio(narration)

                    print(f"[INFO] STEP {i+1}: 나레이션 오버레이 ({narration.duration:.1f}s)", file=sys.stderr)
                except Exception as audio_err:
                    print(f"[WARN] STEP {i+1}: 나레이션 실패 — {audio_err}", file=sys.stderr)

            # 9:16 리사이즈
            if clip.w != 1080 or clip.h != 1920:
                clip = clip.resized((1080, 1920))

            # ── 자막 오버레이 ──
            if subtitle_text:
                try:
                    # 긴 자막을 여러 줄로 나누기 (한 줄 최대 ~18자)
                    max_chars = 18
                    lines = []
                    for line in subtitle_text.split('\n'):
                        while len(line) > max_chars:
                            # 공백 기준 줄바꿈
                            split_pos = line.rfind(' ', 0, max_chars)
                            if split_pos == -1:
                                split_pos = max_chars
                            lines.append(line[:split_pos].strip())
                            line = line[split_pos:].strip()
                        if line:
                            lines.append(line)
                    wrapped_text = '\n'.join(lines)

                    txt_kwargs = {
                        'text': wrapped_text,
                        'font_size': 42,
                        'color': 'white',
                        'stroke_color': 'black',
                        'stroke_width': 3,
                        'size': (1000, None),
                        'method': 'caption',
                        'text_align': 'center',
                        'duration': clip.duration,
                    }
                    if font_path:
                        txt_kwargs['font'] = font_path

                    txt_clip = TextClip(**txt_kwargs)

                    # 하단 중앙 배치 (바닥에서 120px 위)
                    txt_clip = txt_clip.with_position(('center', 1920 - txt_clip.h - 120))

                    # 페이드 인/아웃 효과
                    txt_clip = txt_clip.with_effects([
                        vfx.CrossFadeIn(0.3),
                        vfx.CrossFadeOut(0.3),
                    ])

                    clip = CompositeVideoClip([clip, txt_clip])
                    print(f"[INFO] STEP {i+1}: 자막 추가 — \"{wrapped_text[:30]}...\"", file=sys.stderr)

                except Exception as sub_err:
                    print(f"[WARN] STEP {i+1}: 자막 추가 실패 — {sub_err}", file=sys.stderr)

            clips.append(clip)
            print(f"[INFO] STEP {i+1}: 완료 ({clip.duration:.1f}s)", file=sys.stderr)

        except Exception as e:
            print(f"[WARN] STEP {i+1}: 처리 실패 — {e}", file=sys.stderr)
            continue

    if not clips:
        print(json.dumps({"error": "합성할 클립이 없습니다."}))
        sys.exit(1)

    try:
        final = concatenate_videoclips(clips, method="compose")
        final.write_videofile(
            args.output,
            codec='libx264',
            audio_codec='aac',
            fps=30,
            preset='medium',
            bitrate='5000k',
            logger=None,
        )

        total_duration = final.duration
        final.close()
        for c in clips:
            c.close()

        print(json.dumps({
            "success": True,
            "output": args.output,
            "duration": round(total_duration, 2),
            "steps_count": len(clips),
        }))

    except Exception as e:
        print(json.dumps({"error": f"합성 실패: {e}"}))
        sys.exit(1)


if __name__ == '__main__':
    main()
