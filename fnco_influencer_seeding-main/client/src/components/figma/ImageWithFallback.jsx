const apiBase = import.meta.env.VITE_API_BASE_URL;
import React, { useState } from 'react';
import 'tailwindcss';
import { useAppSelector } from '../../store/hooks.js';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

export function ImageWithFallback(props) {
  const [didError, setDidError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { seedingContents } = useAppSelector((state) => state.crawl);
  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, imageList, ...rest } = props;

  const imageLength = imageList?.length || 1;
  const imageItem = imageList?.[currentImageIndex];
  const isVideo = imageItem?.endsWith('.mp4') || false;

  // imageList에 이미 S3 전체 URL이 들어있는지 확인
  const isFullUrl = imageItem?.startsWith('http');

  // S3 URL이면 그대로 사용, 아니면 로컬 서버 경로 사용
  let currentImage;
  if (imageItem) {
    currentImage = isFullUrl ? imageItem : `${apiBase}/images/${imageItem}`;
  } else if (src && src !== 'undefined') {
    currentImage = src;
  } else {
    currentImage = ERROR_IMG_SRC;
  }

  const thumbnail = currentImage?.replace(/\.mp4$/i, '.jpg') || '';

  return (
    <div className='relative'>
      {/* 이미지 카운터 */}
      {imageLength > 1 && (
        <div
          className='absolute bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm z-10'
          style={{
            top: '10px',
            right: '45px',
            backgroundColor: '#99999980',
            borderRadius: '10px',
          }}
        >
          {currentImageIndex + 1}/{imageLength}
        </div>
      )}
      {isVideo ? (
        <video
          controls
          autoPlay
          loop
          muted
          poster={thumbnail}
          className={`w-full h-full object-cover ${className || ''}`}
          style={style}
          {...rest}
        >
          <source src={currentImage} type='video/mp4' />
          브라우저가 video 태그를 지원하지 않습니다.
        </video>
      ) : (
        <img
          src={currentImage}
          alt={alt}
          className={`w-full h-full object-cover ${className || ''}`}
          style={style}
          {...rest}
          onError={handleError}
        />
      )}

      {/* 좌우 화살표 */}
      {imageLength > 1 && (
        <>
          {currentImageIndex !== 0 && (
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))}
              className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 z-10'
              style={{
                width: '30px',
                height: '30px',
                top: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#cccccc90',
                borderRadius: '50%',
              }}
            >
              ←
            </button>
          )}
          {currentImageIndex !== imageList.length - 1 && (
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))}
              className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 z-10'
              style={{
                width: '30px',
                height: '30px',
                top: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#cccccc90',
                borderRadius: '50%',
              }}
            >
              →
            </button>
          )}
        </>
      )}
    </div>
  );
}
