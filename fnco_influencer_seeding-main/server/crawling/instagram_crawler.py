#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instagram Video Downloader using yt-dlp
인스타그램 영상 다운로더

Author: AI Assistant
Date: 2025-09-12
"""

import os
import sys
import json
import logging
from datetime import datetime
import requests
from typing import Optional, Dict, Any
from pathlib import Path

try:
    import yt_dlp
except ImportError:
    sys.exit(1)

try:
    import instaloader
except ImportError:
    sys.exit(1)


class InstagramCrawler:
    """인스타그램 영상 다운로더 클래스"""
    
    def __init__(self, download_path: str = f'''{os.path.dirname(os.path.abspath(__file__))}/result'''):
        """
        초기화
        
        Args:
            download_path (str): 다운로드할 폴더 경로
        """
        self.download_path = Path(download_path)
        self.shortcode = 'DOBBXP7E9F-' # sys.argv[1] if len(sys.argv) > 1 else None
        # 로깅 설정
        self.setup_logging()
        
    def setup_logging(self):
        """로깅 설정"""
        log_file = self.download_path / 'instagram_crawler.log'
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stderr)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def download_video(self, url: str, custom_filename: Optional[str] = None) -> bool:
        """
        영상 다운로드
        
        Args:
            url (str): 인스타그램 URL
            custom_filename (str, optional): 사용자 정의 파일명
            
        Returns:
            bool: 다운로드 성공 여부
        """
        
        try:
            L = instaloader.Instaloader(download_pictures=True, download_videos=True)

            shortcode = self.shortcode # if self.shortcode else info.get('webpage_url_basename', 'N/A')  # URL 마지막 부분
            post = instaloader.Post.from_shortcode(L.context, shortcode)

            media_urls = []
            json_urls = []

            if post.typename == "GraphSidecar":
                for node in post.get_sidecar_nodes():
                    if node.is_video:
                        media_urls.append(node.video_url + '.mp4' )
                    else:
                        media_urls.append(node.display_url)
            else:
                media_urls.append(post.video_url + '.mp4'if post.is_video else post.url)
            # 3. 로컬에 저장
            for idx, url in enumerate(media_urls, start=1):
                ext = "mp4" if url.endswith("mp4") else "jpg"  # 단순 확장자 판별
                filename = f"{self.download_path}/{shortcode}_{idx}.{ext}"
                json_urls.append(f"{shortcode}_{idx}.{ext}")
                resp = requests.get(url, stream=True)
                with open(filename, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
            data = {
                "기본 정보": {
                    "게시글 고유 ID": shortcode,
                    "업로드 시간": str(post.date_utc),
                    "제목": post.caption,
                    "설명": post.caption,
                    "해시태그 리스트": list(post.caption_hashtags),
                    "멘션된 계정 리스트": list(post.caption_mentions),
                },
                "작성자": {
                    "작성자 계정명": post.owner_username,
                    "작성자 고유 ID": str(post.owner_profile.userid),
                    "작성자 이름": post.owner_profile.full_name,
                    "인증 여부": post.owner_profile.is_verified,
                },
                "좋아요/댓글": {
                    "좋아요 수": post.likes,
                    "댓글 수": post.comments,
                },
                "미디어 관련": {
                    "비디오 여부": post.is_video,
                    "단일 비디오 URL": post.video_url if post.is_video else None,
                    "미디어 URL 리스트": json_urls,
                }
            }
            # JSON 파일로 저장
            with open(f"{self.download_path}/{shortcode}_post_info.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return data

        except Exception as e:
            self.logger.error(f"다운로드 실패 - URL: {url}, 에러: {e}")
            return False
    
    def download_multiple_videos(self) -> Dict[str, bool]:
        """
        여러 영상 일괄 다운로드
        
        Args:
            urls (list): 인스타그램 URL 리스트
            custom_filenames (list, optional): 사용자 정의 파일명 리스트
            
        Returns:
            Dict[str, bool]: URL별 다운로드 성공 여부
        """
        results = []
        
        # for i, url in enumerate(urls):
        #     custom_name = None
        #     if custom_filenames and i < len(custom_filenames):
        #         custom_name = custom_filenames[i]
            
        result = self.download_video(self.shortcode)
        if result:  # 성공한 경우
            # result['기본 정보']['콘텐츠URL'] = url
            results.append(result)
        else:  # 실패한 경우
            results.append({"error": "Download failed", "url": self.shortcode})
        
        return results
    

def main():
    """메인 함수 - 자동으로 instagram_urls.txt 파일을 읽어서 다운로드"""
    
    # 다운로더 초기화
    downloader = InstagramCrawler()
    
    # 파일에서 URL 읽기
    try:
        # with open(url_file, 'r', encoding='utf-8') as f:
        #     urls = []
        #     for line in f:
        #         line = line.strip()
        #         # 빈 줄이나 주석(#으로 시작)은 무시
        #         if line and not line.startswith('#'):
        #             urls.append(line)
        
    
        # results = downloader.print_video_info(urls)
        results = downloader.download_multiple_videos()
        # 결과 출력
        # success_count = sum(results.values())
        # # 상세 결과
        # for url, success in results.items():
        #     status = "✅" if success else "❌"
        #     # print(f"{status} {url}")
        
        return json.dumps(results, ensure_ascii=False, indent=2)
        
    except FileNotFoundError:
        error_msg = f"❌ {url_file} 파일을 찾을 수 없습니다."
        # print(error_msg, file=sys.stderr)
        return json.dumps({"error": "File not found", "message": error_msg})
    except Exception as e:
        error_msg = f"❌ 파일 처리 중 오류 발생: {e}"
        # print(error_msg, file=sys.stderr)
        return json.dumps({"error": "Processing error", "message": error_msg})


if __name__ == "__main__":
    result = main()
    print(result)
