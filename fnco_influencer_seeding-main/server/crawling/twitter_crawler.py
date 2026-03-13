#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
트위터 API 사용 예시
.env 파일에서 API 키를 읽어와서 트위터 API를 사용합니다.
"""

import os
import re
import json
import requests
import tweepy
import logging
import sys
from dotenv import load_dotenv
from urllib.parse import urlparse
from pathlib import Path
import time
from datetime import datetime

# .env 파일 로드
load_dotenv()

class TwitterAPI:
    """트위터 API 클래스"""
    
    def __init__(self):
        """API 키로 트위터 클라이언트 초기화"""
        # self.url = 'https://x.com/seolmyeong47421/status/1963734054445920748' # sys.argv[1]
        self.url = sys.argv[1]
        self.shortcode = self.url.split("/")[-1].split("?")[0]
        # .env 파일에서 API 키 읽기
        self.download_path = Path(f'''{os.path.dirname(os.path.abspath(__file__))}/result''')
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        self.access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
        self.bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        
        # OAuth 2.0 Client 정보
        self.client_id = os.getenv('TWITTER_CLIENT_ID')
        self.client_secret = os.getenv('TWITTER_CLIENT_SECRET')
        
        # API 연결 상태
        self.is_connected = False
        self.api = None
        self.client = None

        self.logging_config = self.setup_logging()

    def setup_logging(self):
        """로깅 설정"""
        log_file = self.download_path / 'twitter_crawler.log'
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stderr)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        try:
            # Bearer Token만 사용하는 경우
            if self.bearer_token and not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
                self.logger.info("🔑 Bearer Token만 사용하여 API v2 클라이언트를 초기화합니다...")
                self.client = tweepy.Client(bearer_token=self.bearer_token, wait_on_rate_limit=True)
                self.api = None  # API v1.1 사용 안함
            else:
                # OAuth 1.0a 인증 (사용자 컨텍스트)
                self.auth = tweepy.OAuth1UserHandler(
                    consumer_key=self.api_key,
                    consumer_secret=self.api_secret,
                    access_token=self.access_token,
                    access_token_secret=self.access_token_secret
                )
                
                # API v1.1 클라이언트
                self.api = tweepy.API(self.auth, wait_on_rate_limit=True)
            
            # API v2 클라이언트 (Bearer Token 또는 Client ID/Secret 사용)
            if self.bearer_token:
                self.client = tweepy.Client(
                    bearer_token=self.bearer_token,
                    consumer_key=self.api_key,
                    consumer_secret=self.api_secret,
                    access_token=self.access_token,
                    access_token_secret=self.access_token_secret,
                    wait_on_rate_limit=True
                )
            elif self.client_id and self.client_secret:
                # OAuth 2.0 Client ID/Secret 사용
                self.client = tweepy.Client(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    wait_on_rate_limit=True
                )
            else:
                self.client = None
            
            # 연결 테스트
            if self.api:
                self.api.verify_credentials()
            elif self.client:
                # API v2 연결 테스트
                try:
                    self.client.get_me()
                except:
                    pass  # Bearer Token만으로는 get_me() 사용 불가
            
            self.is_connected = True
            self.logger.info("✅ 트위터 API 연결 성공!")
            
        except Exception as e:
            self.logger.error(f"❌ 트위터 API 연결 실패: {e}")
            self.is_connected = False
            self.api = None
            self.client = None
    
    def get_user_info(self, username):
        """사용자 정보 가져오기"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return None
        try:
            user = self.api.get_user(screen_name=username)
            return {
                'id': user.id,
                'name': user.name,
                'screen_name': user.screen_name,
                'followers_count': user.followers_count,
                'friends_count': user.friends_count,
                'statuses_count': user.statuses_count,
                'description': user.description,
                'location': user.location,
                'created_at': user.created_at
            }
        except Exception as e:
            self.logger.error(f"사용자 정보를 가져오는데 실패했습니다: {e}")
            return None
    
    def get_user_tweets(self, username, count=10):
        """사용자의 최근 트윗 가져오기"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return []
        try:
            tweets = self.api.user_timeline(screen_name=username, count=count, tweet_mode='extended')
            return [{
                'id': tweet.id,
                'text': tweet.full_text,
                'created_at': tweet.created_at,
                'retweet_count': tweet.retweet_count,
                'favorite_count': tweet.favorite_count,
                'reply_count': tweet.reply_count
            } for tweet in tweets]
        except Exception as e:
            self.logger.error(f"트윗을 가져오는데 실패했습니다: {e}")
            return []
    
    def extract_tweet_id_from_url(self, url):
        """트위터 URL에서 트윗 ID 추출"""
        patterns = [
            r'twitter\.com/\w+/status/(\d+)',
            r't\.co/\w+',  # 단축 URL의 경우
            r'x\.com/\w+/status/(\d+)',  # X.com URL
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def get_tweet_by_url(self, url):
        """URL로 특정 트윗 정보 가져오기"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return None
            
        tweet_id = self.extract_tweet_id_from_url(url)
        if not tweet_id:
            self.logger.error("❌ 유효한 트위터 URL이 아닙니다!")
            return None
        
        try:
            # 직접 REST API 호출로 트윗 정보 가져오기
            if self.bearer_token:
                self.logger.info(f"🔍 REST API로 트윗 ID {tweet_id} 조회 중...")
                
                # API v2 REST 엔드포인트
                url = f"https://api.x.com/2/tweets/{tweet_id}"
                
                # 쿼리 파라미터 설정
                params = {
                    'tweet.fields': 'created_at,author_id,public_metrics,text,attachments,entities,context_annotations,conversation_id,reply_settings,source',
                    'user.fields': 'name,username,public_metrics,verified',
                    'media.fields': 'type,url,variants,width,height',
                    'expansions': 'author_id,attachments.media_keys'
                }
                
                # 헤더 설정
                headers = {
                    'Authorization': f'Bearer {self.bearer_token}',
                    'Content-Type': 'application/json'
                }
                
                self.logger.info(f"🔍 요청 URL: {url}")
                self.logger.info(f"🔍 쿼리 파라미터: {params}")
                
                # API 호출
                response = requests.get(url, headers=headers, params=params)
                
                self.logger.info(f"🔍 응답 상태 코드: {response.status_code}")
                self.logger.info(f"🔍 응답 헤더: {dict(response.headers)}")
                
                if response.status_code == 200:
                    data = response.json()
                    self.logger.info(f"🔍 API 응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
                    
                    if 'data' in data and data['data']:
                        tweet_data = data['data']
                        
                        # 사용자 정보 추출
                        user_data = None
                        if 'includes' in data and 'users' in data['includes']:
                            user_data = data['includes']['users'][0]
                        else:
                            # 별도로 사용자 정보 조회
                            self.logger.info("🔍 사용자 정보를 별도로 조회합니다...")
                            user_url = f"https://api.x.com/2/users/{tweet_data['author_id']}"
                            user_params = {
                                'user.fields': 'name,username,public_metrics,verified'
                            }
                            user_response = requests.get(user_url, headers=headers, params=user_params)
                            
                            if user_response.status_code == 200:
                                user_data = user_response.json()['data']
                                self.logger.info(f"🔍 사용자 데이터: {user_data}")
                            else:
                                self.logger.error(f"❌ 사용자 정보 조회 실패: {user_response.status_code}")
                                return None
                        
                        if not user_data:
                            self.logger.error("❌ 사용자 정보를 찾을 수 없습니다!")
                            return None
                        
                        # 미디어 정보 추출
                        media_info = []
                        if 'attachments' in tweet_data and 'media_keys' in tweet_data['attachments']:
                            if 'includes' in data and 'media' in data['includes']:
                                for media in data['includes']['media']:
                                    media_info.append({
                                        'type': media['type'],
                                        'url': media.get('url'),
                                        'video_info': media.get('variants')
                                    })
                        
                        return {
                            'id': tweet_data['id'],
                            'text': tweet_data['text'],
                            'created_at': tweet_data['created_at'],
                            'user_name': user_data['name'],
                            'user_screen_name': user_data['username'],
                            'user_followers_count': user_data['public_metrics']['followers_count'],
                            'retweet_count': tweet_data['public_metrics']['retweet_count'],
                            'favorite_count': tweet_data['public_metrics']['like_count'],
                            'reply_count': tweet_data['public_metrics']['reply_count'],
                            'bookmark_count': tweet_data['public_metrics'].get('bookmark_count', 0),  # 저장 수
                            'impression_count': tweet_data['public_metrics'].get('impression_count', 0),  # 조회수 추가
                            'is_retweet': False,  # API v2에서는 별도 확인 필요
                            'is_quote': False,    # API v2에서는 별도 확인 필요
                            'url': f"https://twitter.com/{user_data['username']}/status/{tweet_data['id']}",
                            'media': media_info,
                            'entities': tweet_data.get('entities'),
                            'extended_entities': None
                        }
                    else:
                        self.logger.error("❌ 트윗 데이터가 없습니다!")
                        return None
                else:
                    self.logger.error(f"❌ API 호출 실패: {response.status_code}")
                    self.logger.error(f"❌ 응답 내용: {response.text}")
                    return None
            else:
                # API v1.1 사용 (기존 방식)
                tweet = self.api.get_status(tweet_id, tweet_mode='extended', include_entities=True)
                
                # 미디어 정보 추출
                media_info = []
                if hasattr(tweet, 'entities') and hasattr(tweet.entities, 'media'):
                    for media in tweet.entities.media:
                        media_info.append({
                            'type': media.type,
                            'url': media.media_url_https,
                            'video_info': getattr(media, 'video_info', None)
                        })
                
                return {
                    'id': tweet.id,
                    'text': tweet.full_text,
                    'created_at': tweet.created_at,
                    'user_name': tweet.user.name,
                    'user_screen_name': tweet.user.screen_name,
                    'user_followers_count': tweet.user.followers_count,
                    'retweet_count': tweet.retweet_count,
                    'favorite_count': tweet.favorite_count,
                    'reply_count': tweet.reply_count,
                    'is_retweet': hasattr(tweet, 'retweeted_status'),
                    'is_quote': hasattr(tweet, 'quoted_status'),
                    'url': f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}",
                    'media': media_info,
                    'entities': tweet.entities.__dict__ if hasattr(tweet, 'entities') else None,
                    'extended_entities': tweet.extended_entities.__dict__ if hasattr(tweet, 'extended_entities') else None
                }
        except Exception as e:
            self.logger.error(f"트윗 정보를 가져오는데 실패했습니다: {e}")
            return None
    
    def get_tweet_thread(self, url):
        """트윗 스레드(대화) 가져오기 - 개선된 버전"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return []
            
        tweet_id = self.extract_tweet_id_from_url(url)
        if not tweet_id:
            self.logger.error("❌ 유효한 트위터 URL이 아닙니다!")
            return []
        
        try:
            self.logger.info("🔍 원본 트윗을 분석하는 중...")
            # 원본 트윗 가져오기
            original_tweet = self.api.get_status(tweet_id, tweet_mode='extended')
            thread = [original_tweet]
            
            self.logger.info("🔍 답글들을 수집하는 중...")
            # 답글들 가져오기 - 더 정확한 방법
            replies = []
            
            # 방법 1: search_tweets로 답글 검색
            try:
                search_replies = tweepy.Cursor(
                    self.api.search_tweets,
                    q=f"to:{original_tweet.user.screen_name}",
                    since_id=tweet_id,
                    tweet_mode='extended',
                    result_type='recent'
                ).items(50)  # 더 많은 답글 수집
                
                for reply in search_replies:
                    if (hasattr(reply, 'in_reply_to_status_id') and 
                        reply.in_reply_to_status_id == int(tweet_id)):
                        replies.append(reply)
            except Exception as e:
                self.logger.error(f"답글 검색 중 오류: {e}")
            
            # 방법 2: 사용자 타임라인에서 답글 찾기
            try:
                user_timeline = tweepy.Cursor(
                    self.api.user_timeline,
                    screen_name=original_tweet.user.screen_name,
                    since_id=tweet_id,
                    tweet_mode='extended'
                ).items(100)
                
                for tweet in user_timeline:
                    if (hasattr(tweet, 'in_reply_to_status_id') and 
                        tweet.in_reply_to_status_id == int(tweet_id)):
                        # 중복 제거
                        if not any(r.id == tweet.id for r in replies):
                            replies.append(tweet)
            except Exception as e:
                self.logger.error(f"사용자 타임라인 검색 중 오류: {e}")
            
            # 답글들을 시간순으로 정렬
            replies.sort(key=lambda x: x.created_at)
            thread.extend(replies)
            
            # 전체 스레드를 시간순으로 정렬
            thread.sort(key=lambda x: x.created_at)
            
            self.logger.info(f"✅ 총 {len(thread)}개의 트윗을 수집했습니다.")
            
            return [{
                'id': tweet.id,
                'text': tweet.full_text,
                'created_at': tweet.created_at,
                'user_name': tweet.user.name,
                'user_screen_name': tweet.user.screen_name,
                'user_followers_count': tweet.user.followers_count,
                'is_reply': hasattr(tweet, 'in_reply_to_status_id'),
                'reply_to_id': getattr(tweet, 'in_reply_to_status_id', None),
                'retweet_count': tweet.retweet_count,
                'favorite_count': tweet.favorite_count,
                'reply_count': tweet.reply_count,
                'url': f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}",
                'is_retweet': hasattr(tweet, 'retweeted_status'),
                'is_quote': hasattr(tweet, 'quoted_status')
            } for tweet in thread]
            
        except Exception as e:
            self.logger.error(f"트윗 스레드를 가져오는데 실패했습니다: {e}")
            return []
    
    def get_tweet_mentions(self, url):
        """트윗에 대한 멘션들 가져오기"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return []
            
        tweet_id = self.extract_tweet_id_from_url(url)
        if not tweet_id:
            self.logger.error("❌ 유효한 트위터 URL이 아닙니다!")
            return []
        
        try:
            # 원본 트윗 정보 가져오기
            original_tweet = self.api.get_status(tweet_id, tweet_mode='extended')
            
            self.logger.info("🔍 멘션들을 수집하는 중...")
            # 멘션 검색
            mentions = tweepy.Cursor(
                self.api.search_tweets,
                q=f"@{original_tweet.user.screen_name}",
                since_id=tweet_id,
                tweet_mode='extended',
                result_type='recent'
            ).items(30)
            
            mention_list = []
            for mention in mentions:
                # 원본 트윗과 관련된 멘션만 필터링
                if (mention.text and 
                    f"status/{tweet_id}" in mention.text or
                    f"twitter.com/{original_tweet.user.screen_name}/status/{tweet_id}" in mention.text):
                    mention_list.append(mention)
            
            # 시간순 정렬
            mention_list.sort(key=lambda x: x.created_at)
            
            self.logger.info(f"✅ 총 {len(mention_list)}개의 멘션을 수집했습니다.")
            
            return [{
                'id': mention.id,
                'text': mention.full_text,
                'created_at': mention.created_at,
                'user_name': mention.user.name,
                'user_screen_name': mention.user.screen_name,
                'user_followers_count': mention.user.followers_count,
                'retweet_count': mention.retweet_count,
                'favorite_count': mention.favorite_count,
                'url': f"https://twitter.com/{mention.user.screen_name}/status/{mention.id}"
            } for mention in mention_list]
            
        except Exception as e:
            self.logger.error(f"멘션을 가져오는데 실패했습니다: {e}")
            return []
    
    def get_tweet_quotes(self, url):
        """트윗을 인용한 트윗들 가져오기"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return []
            
        tweet_id = self.extract_tweet_id_from_url(url)
        if not tweet_id:
            self.logger.error("❌ 유효한 트위터 URL이 아닙니다!")
            return []
        
        try:
            self.logger.info("🔍 인용 트윗들을 수집하는 중...")
            # 인용 트윗 검색
            quotes = tweepy.Cursor(
                self.api.search_tweets,
                q=f"url:twitter.com/status/{tweet_id}",
                tweet_mode='extended',
                result_type='recent'
            ).items(20)
            
            quote_list = []
            for quote in quotes:
                if hasattr(quote, 'quoted_status') and quote.quoted_status.id == int(tweet_id):
                    quote_list.append(quote)
            
            # 시간순 정렬
            quote_list.sort(key=lambda x: x.created_at)
            
            self.logger.info(f"✅ 총 {len(quote_list)}개의 인용 트윗을 수집했습니다.")
            
            return [{
                'id': quote.id,
                'text': quote.full_text,
                'created_at': quote.created_at,
                'user_name': quote.user.name,
                'user_screen_name': quote.user.screen_name,
                'user_followers_count': quote.user.followers_count,
                'retweet_count': quote.retweet_count,
                'favorite_count': quote.favorite_count,
                'url': f"https://twitter.com/{quote.user.screen_name}/status/{quote.id}"
            } for quote in quote_list]
            
        except Exception as e:
            self.logger.error(f"인용 트윗을 가져오는데 실패했습니다: {e}")
            return []
    
    def search_tweets(self, query, count=10):
        """트윗 검색 (API v2 사용)"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return []
            
        if not self.client:
            self.logger.error("Bearer Token이 설정되지 않아 검색 기능을 사용할 수 없습니다.")
            return []
        
        try:
            tweets = self.client.search_recent_tweets(
                query=query,
                max_results=count,
                tweet_fields=['created_at', 'public_metrics', 'author_id']
            )
            
            if tweets.data:
                return [{
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at,
                    'retweet_count': tweet.public_metrics['retweet_count'],
                    'like_count': tweet.public_metrics['like_count'],
                    'reply_count': tweet.public_metrics['reply_count']
                } for tweet in tweets.data]
            return []
        except Exception as e:
            self.logger.error(f"트윗 검색에 실패했습니다: {e}")
            return []
    
    def download_media(self, tweet_data):
        """트윗의 미디어(이미지만) 다운로드"""
        if not self.is_connected:
            self.logger.error("❌ API가 연결되지 않았습니다!")
            return []
        
        try:
            # 다운로드 폴더 생성
            download_dir = self.download_path
            
            # 트윗별 폴더 생성
            tweet_id = tweet_data.get('id', 'unknown')
            user_name = tweet_data.get('user_screen_name', 'unknown')
            tweet_folder = self.download_path
            
            downloaded_files = []
            
            # 미디어 정보가 있는 경우 이미지만 다운로드
            if tweet_data.get('media'):
                for i, media in enumerate(tweet_data['media']):
                    media_type = media.get('type', '')
                    media_url = media.get('url', '')
                    
                    # 이미지와 비디오 다운로드
                    if media_type == 'photo':
                        # 이미지 다운로드
                        filename = f"twitter_{self.shortcode}_{i+1}.jpg"
                        file_path = tweet_folder / filename
                        
                        self.logger.info(f"📸 이미지 다운로드 중: {filename}")
                        if self._download_file(media_url, file_path):
                            downloaded_files.append(str(file_path))
                    elif media_type == 'video':
                        # 비디오 다운로드 (가장 높은 품질)
                        video_info = media.get('video_info', [])
                        if video_info:
                            # 가장 높은 비트레이트 찾기
                            best_video = None
                            for variant in video_info:
                                if variant.get('content_type') == 'video/mp4':
                                    if not best_video or variant.get('bit_rate', 0) > best_video.get('bit_rate', 0):
                                        best_video = variant
                            
                            if best_video and best_video.get('url'):
                                video_url = best_video['url']
                                filename = f"twitter_{self.shortcode}_{i+1}.mp4"
                                file_path = tweet_folder / filename
                                
                                self.logger.info(f"🎥 비디오 다운로드 중: {filename}")
                                if self._download_file(video_url, file_path):
                                    downloaded_files.append(str(file_path))
                    else:
                        self.logger.error(f"⚠️ {media_type} 타입은 지원하지 않습니다")
            
            if downloaded_files:
                self.logger.info(f"✅ {len(downloaded_files)}개 미디어 파일 다운로드 완료!")
                self.logger.info(f"📁 저장 위치: {tweet_folder}")
            else:
                self.logger.info("📷 이 트윗에는 미디어가 없습니다.")
            
            return downloaded_files
            
        except Exception as e:
            self.logger.error(f"❌ 이미지 다운로드 실패: {e}")
            return []
    
    def _download_file(self, url, file_path):
        """파일 다운로드 헬퍼 함수"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, stream=True)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ 파일 다운로드 실패 ({url}): {e}")
            return False
    
    def save_to_json(self, data, filename):
        """데이터를 JSON 파일로 저장"""
        try:
            # 저장 디렉토리 생성
            save_dir = self.download_path
            
            # 파일 경로 생성
            file_path = save_dir / f"twitter_{filename}.json"
            
            # JSON 파일로 저장
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            
            self.logger.info(f"💾 JSON 파일 저장 완료: {file_path}")
            return str(file_path)
            
        except Exception as e:
            self.logger.error(f"❌ JSON 파일 저장 실패: {e}")
            return None

def main():
    """메인 실행 함수"""
    
    # 트위터 API 초기화
    twitter = TwitterAPI()
    # print("=== 트위터 URL 기반 콘텐츠 데이터 수집기 ===")
    
    # API 연결 상태 확인
    if not twitter.is_connected:
        # print("\n❌ 트위터 API가 연결되지 않았습니다!")
        # print("\n🔧 해결 방법:")
        # print("1. .env 파일을 생성하고 API 키를 설정하세요")
        # print("2. Twitter Developer Portal에서 API 키를 발급받으세요")
        # print("3. 필요한 환경변수:")
        # print("   - TWITTER_API_KEY")
        # print("   - TWITTER_API_SECRET")
        # print("   - TWITTER_ACCESS_TOKEN")
        # print("   - TWITTER_ACCESS_TOKEN_SECRET")
        # print("   - TWITTER_BEARER_TOKEN (선택사항)")
        
        # 대안 제시
        # print("\n💡 대안:")
        # print("- 웹 스크래핑 도구 사용")
        # print("- 다른 소셜 미디어 플랫폼 사용")
        # print("- API 키 설정 후 다시 실행")
        
        return
    
    # print("\n✅ 트위터 API 연결 성공! 🐦")
    
    try:
        # ========================================
        # 🔧 여기에 테스트할 URL들을 입력하세요!
        # ========================================
        # twitter_url = 'https://x.com/seolmyeong47421/status/1963734054445920748'
        twitter_url = sys.argv[1]
        TARGET_URLS = [
            
            twitter_url,
            # "https://x.com/whygg03/status/1969754161961955536",  # 주석 처리
        ]
        
        # 전체 실행 결과를 저장할 리스트
        all_results = []
        
        # 각 URL에 대해 데이터 수집
        for i, url in enumerate(TARGET_URLS, 1):
            # print(f"\n{'='*60}")
            # print(f"🎯 URL {i}/{len(TARGET_URLS)}: {url}")
            # print(f"{'='*60}")
            
            # URL 처리 함수 호출
            result = process_single_url(twitter, url, twitter_url.split("/")[-1].split("?")[0])
            if result:
                all_results.append(result)
            
            # 마지막 URL이 아니면 잠시 대기
            if i < len(TARGET_URLS):
                # print(f"\n⏳ 다음 URL 처리 전 5분 대기...")
                import time
                time.sleep(300)  # 5분 대기
        
        # 모든 데이터를 하나의 JSON 파일로 저장
        if all_results:
            # print(f"\n📊 전체 실행 결과 요약:")
            # print("=" * 60)
            # print(f"🎯 처리된 URL: {len(all_results)}개")
            # print(f"📁 미디어 파일: 다운로드 완료")
            
            # # 통합 데이터 구조 생성
            # integrated_data = {
            #     "collection_info": {
            #         "execution_time": datetime.now().isoformat(),
            #         "total_urls": len(TARGET_URLS),
            #         "processed_urls": len(all_results),
            #         "success_rate": f"{(len(all_results)/len(TARGET_URLS)*100):.1f}%",
            #         "collection_date": datetime.now().strftime("%Y-%m-%d"),
            #         "collection_time": datetime.now().strftime("%H:%M:%S")
            #     },
            #     "tweets": all_results
            # }
            
            # 통합 JSON 파일 저장
            # print(f"\n💾 모든 데이터를 통합 JSON 파일로 저장 중...")
            json_file_path = twitter.save_to_json(all_results, twitter_url.split("/")[-1].split("?")[0])
            
            if json_file_path:
                # print(f"✅ 통합 JSON 저장 완료: {json_file_path}")
                # print(f"📊 총 {len(all_results)}개 트윗 데이터가 하나의 파일에 저장되었습니다.")
                error = f"✅ 통합 JSON 저장 완료: {json_file_path}"
                # json.dumps(error, ensure_ascii=False, indent=2)
            else:
                # print("❌ JSON 저장 실패")
                error = f"❌ JSON 저장 실패"
                # json.dumps(error, ensure_ascii=False, indent=2)
        else:
            # print("❌ 처리된 데이터가 없습니다.")
            error = f"❌ 처리된 데이터가 없습니다."
            # json.dumps(error, ensure_ascii=False, indent=2)
        
        return json.dumps(all_results, ensure_ascii=False, indent=2)
        
    except Exception as e:
        # print(f"❌ 실행 중 오류 발생: {e}")
        return json.dumps({"error": str(e)}, ensure_ascii=False, indent=2)
def process_single_url(twitter, url, file_name):
    """단일 URL 처리 함수"""
    try:
        # print(f"\n트윗 정보를 가져오는 중...")
        tweet_info = twitter.get_tweet_by_url(url)
        
        if tweet_info:
            # 구조화된 트윗 데이터 생성
            tweet_data = {
                "기본 정보": {
                "게시글 고유 ID": tweet_info.get('id'),
                "업로드 시간": str(tweet_info.get('created_at')),
                "제목": tweet_info.get('text'),
                "설명": tweet_info.get('text'),
                "해시태그 리스트": "",
                "멘션된 계정 리스트": "",
                "조회수": tweet_info.get('impression_count', 0),
                "저장 수": tweet_info.get("bookmark_count", 0),
                "댓글 수": tweet_info.get("reply_count", 0),
            },
            "작성자": {
                "작성자 계정명": tweet_info.get('user_screen_name'),
                "작성자 고유 ID": str(tweet_info.get("id")),
                "작성자 이름": tweet_info.get("user_name"),
                "인증 여부": True
            },
            "좋아요/댓글": {
                "좋아요 수": tweet_info.get("favorite_count", 0),
                "댓글 수": tweet_info.get("reply_count", 0),
            },
            "미디어 관련": {
                "비디오 여부": True,
                "단일 비디오 URL": "", # tweet_info.get("media")[0].get("url"),
                "미디어 URL 리스트": [f'twitter_{file_name}_1.mp4'],
            }
            }
            # print(f"\n📝 트윗 콘텐츠 정보:")
            # print("=" * 50)
            # print(f"🔗 URL: {tweet_info['url']}")
            # print(f"📅 작성일: {tweet_info['created_at']}")
            # print(f"👤 작성자: {tweet_info['user_name']} (@{tweet_info['user_screen_name']})")
            # print(f"👥 팔로워: {tweet_info['user_followers_count']:,}")
            # print(f"📊 좋아요: {tweet_info['favorite_count']:,}")
            # print(f"🔄 리트윗: {tweet_info['retweet_count']:,}")
            # print(f"💬 답글: {tweet_info['reply_count']:,}")
            # print(f"🔖 저장: {tweet_info.get('bookmark_count', 0):,}")
            # print(f"👁️ 조회수: {tweet_info.get('impression_count', 0):,}")
            
            # if tweet_info['is_retweet']:
                # print("🔄 리트윗입니다")
            # if tweet_info['is_quote']:
                # print("💬 인용 트윗입니다")
            
            # print(f"\n📄 트윗 내용:")
            # print("-" * 50)
            # print(tweet_info['text'])
            # print("-" * 50)
            
            # 미디어 정보 표시 및 다운로드
            if tweet_info.get('media'):
                # print(f"\n📷 미디어 정보:")
                # print("-" * 50)
                media_count = 0
                for i, media in enumerate(tweet_info['media'], 1):
                    media_type = media.get('type', 'unknown')
                    # print(f"{i}. 타입: {media_type}")
                    if media_type == 'photo':
                        # print(f"   URL: {media.get('url', 'N/A')}")
                        media_count += 1
                    elif media_type == 'video':
                        # print(f"   비디오 품질: {len(media.get('video_info', []))}개")
                        if media.get('video_info'):
                            best_video = max(media['video_info'], key=lambda x: x.get('bit_rate', 0))
                            # print(f"   최고 품질 URL: {best_video.get('url', 'N/A')[:50]}...")
                        media_count += 1
                    else:
                        # print(f"   ⚠️ 지원하지 않는 타입")
                        error = f"❌ 지원하지 않는 타입"
                        # json.dumps(error, ensure_ascii=False, indent=2)
                
                if media_count > 0:
                    # print(f"\n💾 {media_count}개 미디어 다운로드 중...")
                    downloaded_files = twitter.download_media(tweet_info)
                    if downloaded_files:
                        # print(f"✅ 다운로드된 미디어 파일들:")
                        # for file_path in downloaded_files:
                            # print(f"   📁 {file_path}")
                        file_path = f"twitter_{file_name}_{i+1}.mp4"
                        tweet_data["downloaded_files"] = [file_path]
                    else:
                        # print(f"❌ 다운로드 실패")
                        error = f"❌ 다운로드 실패"
                        # json.dumps(error, ensure_ascii=False, indent=2)
                else:
                    # print(f"\n📷 이 트윗에는 지원하는 미디어가 없습니다.")
                    error = f"❌ 다운로드 실패"
                    # json.dumps(error, ensure_ascii=False, indent=2)
            else:
                # print(f"\n📷 이 트윗에는 미디어가 없습니다.")
                error = f"❌ 다운로드 실패"
                # json.dumps(error, ensure_ascii=False, indent=2)
            
            # 자동으로 모든 관련 데이터 수집
            # print(f"\n🚀 모든 관련 데이터를 자동 수집합니다...")
            
            # 답글들 (스레드)
            # print(f"\n1️⃣ 답글들 수집 중...")
            thread = twitter.get_tweet_thread(url)
            if thread:
                # 스레드 데이터 구조화
                thread_data = []
                for i, tweet in enumerate(thread):
                    thread_data.append({
                        "order": i + 1,
                        "tweet_id": str(tweet['id']),
                        "text": tweet['text'],
                        "created_at": str(tweet['created_at']),
                        "author": {
                            "name": tweet['user_name'],
                            "username": tweet['user_screen_name'],
                            "followers_count": tweet['user_followers_count']
                        },
                        "engagement": {
                            "likes": tweet['favorite_count'],
                            "retweets": tweet['retweet_count'],
                            "replies": tweet['reply_count']
                        },
                        "is_reply": tweet['is_reply'],
                        "is_retweet": tweet['is_retweet'],
                        "is_quote": tweet['is_quote'],
                        "url": tweet['url']
                    })
                tweet_data["thread"] = thread_data
            
            # 멘션들
            # print(f"\n2️⃣ 멘션들 수집 중...")
            mentions = twitter.get_tweet_mentions(url)
            if mentions:
                # 멘션 데이터 구조화
                mention_data = []
                for mention in mentions:
                    mention_data.append({
                        "tweet_id": str(mention['id']),
                        "text": mention['text'],
                        "created_at": str(mention['created_at']),
                        "author": {
                            "name": mention['user_name'],
                            "username": mention['user_screen_name'],
                            "followers_count": mention['user_followers_count']
                        },
                        "engagement": {
                            "likes": mention['favorite_count'],
                            "retweets": mention['retweet_count']
                        },
                        "url": mention['url']
                    })
                tweet_data["mentions"] = mention_data
            
            # 인용 트윗들
            # print(f"\n3️⃣ 인용 트윗들 수집 중...")
            quotes = twitter.get_tweet_quotes(url)
            if quotes:
                # 인용 트윗 데이터 구조화
                quote_data = []
                for quote in quotes:
                    quote_data.append({
                        "tweet_id": str(quote['id']),
                        "text": quote['text'],
                        "created_at": str(quote['created_at']),
                        "author": {
                            "name": quote['user_name'],
                            "username": quote['user_screen_name'],
                            "followers_count": quote['user_followers_count']
                        },
                        "engagement": {
                            "likes": quote['favorite_count'],
                            "retweets": quote['retweet_count']
                        },
                        "url": quote['url']
                    })
                tweet_data["quotes"] = quote_data
            
            # 결과 출력
            # print(f"\n📊 수집 완료!")
            # print("=" * 60)
            # print(f"📝 원본 트윗: 1개")
            # print(f"💬 답글: {len(thread)-1 if thread else 0}개")
            # print(f"💬 멘션: {len(mentions)}개")
            # print(f"💬 인용: {len(quotes)}개")
            # print(f"📊 총 관련 트윗: {len(thread)-1 + len(mentions) + len(quotes)}개")
            
            # 답글들 출력
            if thread and len(thread) > 1:
                # print(f"\n🧵 답글들:")
                # print("-" * 40)
                for i, tweet in enumerate(thread[1:], 1):  # 원본 제외
                    # print(f"{i}. @{tweet['user_screen_name']}: {tweet['text'][:50]}...")
                    tweet = f"{i}. @{tweet['user_screen_name']}: {tweet['text'][:50]}..."
                    # json.dumps(tweet, ensure_ascii=False, indent=2)
            
            # 멘션들 출력
            if mentions:
                # print(f"\n💬 멘션들:")
                # print("-" * 40)
                for i, mention in enumerate(mentions[:5], 1):  # 상위 5개만
                    # print(f"{i}. @{mention['user_screen_name']}: {mention['text'][:50]}...")
                    mention = f"{i}. @{mention['user_screen_name']}: {mention['text'][:50]}..."
                    # json.dumps(mention, ensure_ascii=False, indent=2)
            
            # 인용 트윗들 출력
            if quotes:
                # print(f"\n💬 인용 트윗들:")
                # print("-" * 40)
                for i, quote in enumerate(quotes[:5], 1):  # 상위 5개만
                    # print(f"{i}. @{quote['user_screen_name']}: {quote['text'][:50]}...")
                    quote = f"{i}. @{quote['user_screen_name']}: {quote['text'][:50]}..."
                    # json.dumps(quote, ensure_ascii=False, indent=2)
            
            return tweet_data
            
        else:
            # print("❌ 트윗 정보를 가져올 수 없습니다. URL을 확인해주세요.")
            return None
        
    except Exception as e:
        # print(f"❌ URL 처리 중 오류 발생: {e}")
        # print(f"URL: {url}")
        return None

if __name__ == "__main__":
    result = main()
    print(result, flush=True)
