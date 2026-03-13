import requests
import json
import os
import sys
from datetime import datetime
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class TikTokCrawler:
    def __init__(self, download_path: str = f'''{os.path.dirname(os.path.abspath(__file__))}/result'''):
        self.download_path = Path(download_path)
        self.url = sys.argv[1]
        self.shortcode = self.url.split("/")[-1].split("?")[0]

        # 로깅 설정
        self.setup_logging()

    def setup_logging(self):
        """로깅 설정"""
        log_file = self.download_path / 'tiktok_crawler.log'
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stderr)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def get_video_info_and_downlaod_video(self):
        tiktok_scraper_url = os.getenv('TIKTOK_SCRAPER_URL')

        querystring = {"url":self.url,"hd":"1"}

        headers = {
            "x-rapidapi-key": os.getenv('TIKTOK_SCRAPER_API_KEY'),
            "x-rapidapi-host": os.getenv('TIKTOK_SCRAPER_API_HOST')
        }

        filename = f"{self.shortcode}.mp4"

        response = requests.get(tiktok_scraper_url, headers=headers, params=querystring)
        post = response.json().get("data")
        post_user = post.get("author")
        data = {
            "기본 정보": {
                "게시글 고유 ID": self.shortcode,
                "업로드 시간": datetime.fromtimestamp(post.get("create_time")).strftime('%Y-%m-%d %H:%M:%S'),
                "제목": post.get("title"),
                "설명": post.get("title"),
                "해시태그 리스트": "",
                "멘션된 계정 리스트": "",
                "조회수": post.get("play_count"),
                "저장 수": post.get("collect_count"),
                "댓글 수": post.get("share_count"),
            },
            "작성자": {
                "작성자 계정명": post_user.get("unique_id"),
                "작성자 고유 ID": str(post_user.get("id")),
                "작성자 이름": post_user.get("nickname"),
                "인증 여부": True
            },
            "좋아요/댓글": {
                "좋아요 수": post.get("digg_count"),
                "댓글 수": post.get("comment_count"),
            },
            "미디어 관련": {
                "비디오 여부": True,
                "단일 비디오 URL": post.get("hdplay"),
                "미디어 URL 리스트": [filename],
            }
        }

        self.download_video(post.get("hdplay"), filename)
        self.download_video_info(data, filename)

        return json.dumps([data], ensure_ascii=False, indent=2)

    def download_video(self, video_url, filename):
        save_dir = self.download_path         # 원하는 폴더
        save_path = os.path.join(save_dir, filename)
        # 저장
        video_resp = requests.get(video_url, stream=True)
        with open(save_path, "wb") as f:
            for chunk in video_resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return 

    def download_video_info(self, data, filename):
        with open(f"{self.download_path}/{filename}_post_info.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return

def main():
    """ 메인 함수 - 틱톡 정보 + 영상 다운로드 """
    crawler = TikTokCrawler()
    try: 
        result = crawler.get_video_info_and_downlaod_video()
        return result
    
    except FileNotFoundError:
        error_msg = f"❌ {sys.argv[1]} 파일을 찾을 수 없습니다."
        # print(error_msg, file=sys.stderr)
        return json.dumps({"error": "File not found", "message": error_msg})    
    except Exception as e:
        error_msg = f"❌ 파일 처리 중 오류 발생: {e}"
        # print(error_msg, file=sys.stderr)
        return json.dumps({"error": "Processing error", "message": error_msg})
    
if __name__ == "__main__":
    result = main()
    print(result)