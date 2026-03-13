"""
YouTube 댓글 분석기
YouTube URL을 입력하면 해당 동영상의 댓글 개수와 모든 댓글 내용을 가져옵니다.
"""

import re
import sys
import requests
import json
from datetime import datetime
from typing import List, Dict, Optional
import os
from pathlib import Path
import yt_dlp
import contextlib
import logging
from dotenv import load_dotenv

load_dotenv()

class YoutubeCrawler:
    def __init__(self, api_key: str):
        """
        YouTube Data API 키로 초기화
        
        Args:
            api_key (str): Google Cloud Console에서 발급받은 YouTube Data API 키
        """
        self.download_path = Path(f'''{os.path.dirname(os.path.abspath(__file__))}/result''')
        self.api_key = api_key
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.shortcode = sys.argv[1]
        self.ydl_opts = {
            'outtmpl': str(self.download_path / '%(id)s_1.%(ext)s'),
            'format': 'best[height<=1080]/best[height<=720]/best',  # 여러 포맷 옵션 제공
            'writeinfojson': False,  # 메타데이터 저장
            'writethumbnail': True,  # 썸네일 저장
            'writesubtitles': False,  # 자막은 인스타그램에 없음
            'ignoreerrors': False,  # 에러를 표시하도록 변경
            'no_warnings': False,
            'extractaudio': False,
            'verbose': False,  # 상세 로그 출력
            'no_warnings': True,
            'quiet': True,
            # Instagram 특화 설정
            'cookiefile': None,  # 쿠키 파일 사용하지 않음 (필요시 설정)
        }
        # 로깅 설정
        self.setup_logging()
        
    def setup_logging(self):
        """로깅 설정"""
        log_file = self.download_path / 'youtube_crawler.log'
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stderr)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def get_video_info(self) -> Dict:
        """
        비디오 기본 정보를 가져옵니다.
        
        Args:
            video_id (str): YouTube 비디오 ID
            
        Returns:
            Dict: 비디오 정보
        """
        url = f"{self.base_url}/videos"
        params = {
            'part': 'snippet,statistics',
            'id': self.shortcode,
            'key': self.api_key
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()

        if not data.get('items'):
            raise ValueError("비디오를 찾을 수 없습니다.")

        ydl_opts = {
            "quiet": True,
            "skip_download": True,   # 파일 다운로드하지 않고 메타데이터만
            "extract_flat": False,   # sidecar 안까지 들어가도록
        }
        media_urls = [f'{self.shortcode}_1.mp4']
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl_data = ydl.extract_info(self.shortcode, download=False)

        video_info = data['items'][0]
        result = {
            "기본 정보" : {
                "제목": video_info['snippet'].get('title', ''),
                "게시글 고유 ID": self.shortcode,
                "설명": video_info['snippet'].get('description', ''),
                "해시태그 리스트": video_info['snippet'].get('tags', []),
                "업로드 시간": str(video_info['snippet'].get('publishedAt', '')),
                "조회수": int(video_info['statistics'].get('viewCount', 0)),
            },
            "작성자": {
                "작성자 계정명": video_info['snippet'].get('channelTitle', ''), # 채널명
                "작성자 고유 ID": video_info['snippet'].get('channelId', ''),
                "작성자 이름": ydl_data.get('uploader_id', ''),
            },
            "좋아요/댓글": {
                "좋아요 수": int(video_info['statistics'].get('likeCount', 0)),
                "댓글 수": int(video_info['statistics'].get('commentCount', 0)),
            },
            "미디어 관련": {
                "비디오 여부": True,
                "단일 비디오 URL": ydl_data.get('url', ''),
                "미디어 URL 리스트": media_urls,
            }
        }

        return result
    
    def get_all_comments(self, max_results: int = 100) -> List[Dict]:
        """
        동영상의 모든 댓글을 가져옵니다.
        
        Args:
            video_id (str): YouTube 비디오 ID
            max_results (int): 한 번에 가져올 최대 댓글 수 (기본값: 100)
            
        Returns:
            List[Dict]: 댓글 목록
        """
        all_comments = []
        next_page_token = None
        
        while True:
            url = f"{self.base_url}/commentThreads"
            params = {
                'part': 'snippet,replies',
                'videoId': self.shortcode,
                'maxResults': min(max_results, 100),  # API 제한: 최대 100개
                'order': 'relevance',  # 관련성 순으로 정렬
                'key': self.api_key
            }
            
            if next_page_token:
                params['pageToken'] = next_page_token
            
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                for item in data.get('items', []):
                    # 최상위 댓글
                    top_comment = item['snippet']['topLevelComment']['snippet']
                    comment_data = {
                        'comment_id': item['snippet']['topLevelComment']['id'],
                        'author': top_comment['authorDisplayName'],
                        'author_channel_url': top_comment.get('authorChannelUrl', ''),
                        'text': top_comment['textDisplay'],
                        'text_original': top_comment['textOriginal'],
                        'like_count': top_comment.get('likeCount', 0),
                        'published_at': top_comment['publishedAt'],
                        'updated_at': top_comment.get('updatedAt', top_comment['publishedAt']),
                        'reply_count': item['snippet'].get('totalReplyCount', 0),
                        'replies': []
                    }
                    
                    # 답글이 있는 경우
                    if 'replies' in item:
                        for reply in item['replies']['comments']:
                            reply_snippet = reply['snippet']
                            reply_data = {
                                'reply_id': reply['id'],
                                'author': reply_snippet['authorDisplayName'],
                                'author_channel_url': reply_snippet.get('authorChannelUrl', ''),
                                'text': reply_snippet['textDisplay'],
                                'text_original': reply_snippet['textOriginal'],
                                'like_count': reply_snippet.get('likeCount', 0),
                                'published_at': reply_snippet['publishedAt'],
                                'updated_at': reply_snippet.get('updatedAt', reply_snippet['publishedAt'])
                            }
                            comment_data['replies'].append(reply_data)
                    
                    all_comments.append(comment_data)
                
                next_page_token = data.get('nextPageToken')
                if not next_page_token:
                    break
                    
                # print(f"현재까지 {len(all_comments)}개의 댓글을 가져왔습니다...")
                
            except requests.exceptions.RequestException as e:
                # print(f"API 요청 중 오류가 발생했습니다: {e}")
                break
        
        return all_comments
    
    def save_info_to_file(self, comments: List[Dict], video_info: Dict, filename: str = None) -> str:
        """
        댓글을 파일로 저장합니다.
        
        Args:
            comments (List[Dict]): 댓글 목록
            video_info (Dict): 비디오 정보
            filename (str): 저장할 파일명 (기본값: 자동 생성)
            
        Returns:
            str: 저장된 파일명
        """
        
        output_data = {
            **video_info,
            "comments": comments
        }
        
        with open(f"{self.download_path}/{self.shortcode}_youtube_info.json", "w", encoding="utf-8") as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        return output_data

    def download_video(self):
        """
        비디오를 다운로드합니다.
        """

        video_id = self.shortcode
        # print('video_id: ', video_id)
        # with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
        #     ydl.download([video_id])
        with contextlib.redirect_stdout(sys.stderr):   # 👈 stdout → stderr로 강제
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                ydl.download([video_id])
            # return True
        for file_path in Path(self.download_path).glob(f"{video_id}_1.*"):
            if file_path.suffix != '.mp4' and file_path.suffix != '.json':
                file_path.rename(file_path.with_suffix('.jpg'))

def main():
    """메인 실행 함수"""
    # print("YouTube 댓글 분석기")
    # print("=" * 50)
    
    api_key = os.getenv('YOUTUBE_API_KEY')
    
    
    try:
        # 분석기 초기화
        analyzer = YoutubeCrawler(api_key)
        # 비디오 다운로드
        analyzer.download_video()
        # 비디오 정보 가져오기
        video_info = analyzer.get_video_info()
        # 댓글 가져오기
        comments = analyzer.get_all_comments(max_results=100)
        # JSON 파일로 저장
        result = analyzer.save_info_to_file(comments, video_info)
        
        return json.dumps([video_info], ensure_ascii=False, indent=2)

    except ValueError as e:
        error_result = {"error": f"값 오류: {e}"}
        return json.dumps(error_result, ensure_ascii=False, indent=2)
    except requests.exceptions.HTTPError as e:
        error_result = {"error": f"HTTP 오류: {e}"}
        return json.dumps(error_result, ensure_ascii=False, indent=2)
    except Exception as e:
        error_result = {"error": f"예상치 못한 오류가 발생했습니다: {e}"}
        return json.dumps(error_result, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    result = main()
    print(result, flush=True)
