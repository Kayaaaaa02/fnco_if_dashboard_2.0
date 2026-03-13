import runPython from '../utils/pythonRunner.js';
import { parseUrl } from '../../../common/utils.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 원하는 경로 지정
dotenv.config({ path: path.join(__dirname, '../.env') });

export const crawlingController = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const platform_python = {
            instagram: 'crawling/instagram_crawler.py',
            youtube: 'crawling/youtube_crawler.py',
            tiktok: 'crawling/tiktok_crawler.py',
            x: 'crawling/twitter_crawler.py',
        };

        // URL에서 shortcode 추출
        const match = parseUrl(url);
        const platform = match.platform;

        const platform_match = {
            instagram: match['id'],
            youtube: match['id'],
            tiktok: url,
            x: url,
        };
        if (!match) return res.status(400).json({ error: 'Invalid URL' });
        const shortcode = platform_match[platform];

        // Python 실행
        const data = await runPython(platform_python[platform], [shortcode]);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Crawling failed' });
    }
};

export const crawlingAPIController = async (req, res) => {
    try {
        const { url, is_seeding = true, max_concurrent = 5 } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const platform_python = {
            instagram: `${process.env.API_URL}/instagram`,
            youtube: `${process.env.API_URL}/youtube`,
            tiktok: `${process.env.API_URL}/tiktok`,
            x: `${process.env.API_URL}/twitter`,
        };

        // 배열 처리 지원
        const isArray = Array.isArray(url);

        // 단일 URL인 경우 기존 로직
        if (!isArray) {
            const match = parseUrl(url);
            const platform = match?.platform;

            if (!match || !platform) {
                return res.status(400).json({ error: 'Invalid URL' });
            }

            const requestBody = {
                url: url,
                is_seeding: is_seeding,
                max_concurrent: max_concurrent,
            };

            const response = await fetch(`${platform_python[platform]}`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(900000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`External API error: ${response.status}`, errorText);
                throw new Error(`External API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            return res.json(data);
        }

        // 배열인 경우 플랫폼별로 분류
        const urlsByPlatform = {
            instagram: [],
            youtube: [],
            tiktok: [],
            x: [],
        };

        // URL을 플랫폼별로 분류
        url.forEach((singleUrl) => {
            const match = parseUrl(singleUrl);
            if (match && match.platform && urlsByPlatform[match.platform]) {
                urlsByPlatform[match.platform].push(singleUrl);
            }
        });

        // 각 플랫폼별로 배치 처리 (10개씩 나눠서 요청)
        const BATCH_SIZE = 10;

        const platformRequests = Object.entries(urlsByPlatform)
            .filter(([platform, urls]) => urls.length > 0)
            .map(async ([platform, urls]) => {
                try {
                    // URL을 10개씩 나눠서 배치 생성 (병렬 처리)
                    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);
                    const batchPromises = [];

                    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
                        const batch = urls.slice(i, i + BATCH_SIZE);
                        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

                        // 각 배치를 병렬로 실행
                        const batchPromise = (async () => {
                            const requestBody = {
                                url: batch,
                                is_seeding: is_seeding,
                                max_concurrent: max_concurrent,
                            };

                            try {
                                const response = await fetch(`${platform_python[platform]}`, {
                                    method: 'POST',
                                    headers: {
                                        accept: 'application/json',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                    signal: AbortSignal.timeout(900000),
                                });

                                if (!response.ok) {
                                    const errorText = await response.text();
                                    console.error(`  ❌ ${platform} 배치 ${batchNum} API error: ${response.status}`);
                                    return { success: false, data: [], batchNum };
                                }

                                const data = await response.json();
                                const batchResults = Array.isArray(data) ? data : [data];

                                return { success: true, data: batchResults, batchNum };
                            } catch (error) {
                                console.error(`  ❌ ${platform} 배치 ${batchNum} 실패:`, error.message);
                                return { success: false, data: [], batchNum };
                            }
                        })();

                        batchPromises.push(batchPromise);
                    }

                    // 모든 배치가 병렬로 실행되고, 완료되는 대로 결과 수집
                    const batchResults = await Promise.allSettled(batchPromises);
                    const allBatchData = [];

                    batchResults.forEach((result) => {
                        if (result.status === 'fulfilled' && result.value.success) {
                            allBatchData.push(...result.value.data);
                        }
                    });

                    return {
                        platform,
                        success: allBatchData.length > 0,
                        data: allBatchData,
                        total: urls.length,
                        succeeded: allBatchData.length,
                    };
                } catch (error) {
                    console.error(`❌ ${platform} 전체 실패:`, error);
                    return {
                        platform,
                        success: false,
                        error: error.message,
                        data: [],
                        total: urls.length,
                        succeeded: 0,
                    };
                }
            });

        // 모든 플랫폼 요청 완료 대기 (일부 실패해도 성공한 것은 받음)
        const settledResults = await Promise.allSettled(platformRequests);

        // settled 결과를 기존 형식으로 변환
        const results = settledResults.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error('❌ Promise rejected:', result.reason);
                return {
                    platform: 'unknown',
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                    data: [],
                    total: 0,
                    succeeded: 0,
                };
            }
        });

        // 모든 결과 합치기
        const allData = [];
        const summary = {
            total: url.length,
            byPlatform: {},
        };

        results.forEach((result) => {
            summary.byPlatform[result.platform] = {
                success: result.success,
                count: result.data.length,
                total: result.total || result.data.length,
                succeeded: result.succeeded || result.data.length,
            };
            allData.push(...result.data);
        });

        res.json(allData);
    } catch (err) {
        console.error('❌ 크롤링 컨트롤러 에러:', err);
        res.status(500).json({ error: 'Crawling failed', details: err.message });
    }
};

export const batchCrawlingController = async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const results = [];
        const batchSize = 3; // 3개씩 동시 처리
        const delayBetweenBatches = 5000; // 5초 대기

        // 배치별로 처리
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);

            // 배치 내에서 병렬 처리
            const batchPromises = batch.map(async (url) => {
                try {
                    const platform_python = {
                        instagram: 'crawling/instagram_crawler.py',
                        youtube: 'crawling/youtube_crawler.py',
                        tiktok: 'crawling/tiktok_crawler.py',
                        x: 'crawling/twitter_crawler.py',
                    };

                    const match = parseUrl(url);
                    const platform = match.platform;

                    const platform_match = {
                        instagram: match['id'],
                        youtube: match['id'],
                        tiktok: url,
                        x: url,
                    };

                    const shortcode = platform_match[platform];

                    // Python 실행
                    const data = await runPython(platform_python[platform], [shortcode]);

                    return {
                        success: true,
                        url: url,
                        data: data,
                        platform: platform,
                    };
                } catch (error) {
                    console.error(`URL ${url} 크롤링 실패:`, error);
                    return {
                        success: false,
                        url: url,
                        error: error.message,
                    };
                }
            });

            // 배치 완료 대기
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Python 프로세스 정리 (가비지 컬렉션 강제 실행)
            if (global.gc) {
                global.gc();
            }

            // 마지막 배치가 아니면 지연
            if (i + batchSize < urls.length) {
                await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
            }
        }

        res.json({
            success: true,
            total: urls.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results: results,
        });
    } catch (err) {
        console.error('배치 크롤링 실패:', err);
        res.status(500).json({ error: 'Batch crawling failed' });
    }
};
