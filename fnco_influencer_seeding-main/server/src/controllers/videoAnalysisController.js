import { pool } from '../config/database.js';
import { select_data_query } from '../sql/videoAnalysis/selectQuery.js';
import { select_status_query } from '../sql/videoAnalysis/selectStatusQuery.js';

// 섹션 추출 함수
const buildStartPattern = (letter) => {
    const l = String(letter || '')
        .toLowerCase()
        .trim()
        .replace(/\)\s*$/, ''); // <- 끝의 ')' 있으면 제거 (방어)
    // 제목 라인 전체를 매칭하도록 .*$ 추가
    return '^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?' + l + '\\)\\s+.*$';
};

// ====== 섹션 추출 함수 ======
const extract_section = (text, startPattern, nextLetter) => {
    if (!text) return null;

    // startPattern이 문자열이면 RegExp로 변환
    const startRegex = startPattern instanceof RegExp ? startPattern : new RegExp(startPattern, 'im');

    const startMatch = text.match(startRegex);
    if (!startMatch) return null;

    const startIndex = startMatch.index + startMatch[0].length;

    let endIndex = text.length;
    if (nextLetter) {
        // nextLetter는 'c)' 형태 (괄호 포함)라고 가정
        // 정규식 특수문자를 이스케이프 처리
        const escapedLetter = nextLetter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const endRegex = new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?${escapedLetter}\\s+`, 'm');
        const remainingText = text.substring(startIndex);
        const endMatch = remainingText.match(endRegex);
        if (endMatch) endIndex = startIndex + endMatch.index;
    }

    let section = text.substring(startIndex, endIndex).trim();

    // Priority 관련 텍스트 제거 (모든 언어)
    section = section.replace(/###?\s*[🔴🟡🟢]\s*.*?Priority.*?(?:\(.*?\))?\s*\n*/gim, '').trim();
    section = section.replace(/[🔴🟡🟢]\s*.*?Priority.*?(?:\(.*?\))?\s*\n*/gim, '').trim();

    // 한국어 텍스트 제거
    section = section.replace(/^\s*#?\s*\(개선 권장\)\s*\n*/gim, '').trim();
    section = section.replace(/^\s*#?\s*\(선택적 개선\)\s*\n*/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(개선 권장\)\s*$/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(선택적 개선\)\s*$/gim, '').trim();
    section = section.replace(/\s*#?\s*\(개선 권장\)\s*/gim, ' ').trim();
    section = section.replace(/\s*#?\s*\(선택적 개선\)\s*/gim, ' ').trim();

    // 중국어 텍스트 제거
    section = section.replace(/^\s*#?\s*\(建议改进\)\s*\n*/gim, '').trim();
    section = section.replace(/^\s*#?\s*\(可选改进\)\s*\n*/gim, '').trim();
    section = section.replace(/^\s*#?\s*\(推荐改进\)\s*\n*/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(建议改进\)\s*$/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(可选改进\)\s*$/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(推荐改进\)\s*$/gim, '').trim();
    section = section.replace(/\s*#?\s*\(建议改进\)\s*/gim, ' ').trim();
    section = section.replace(/\s*#?\s*\(可选改进\)\s*/gim, ' ').trim();
    section = section.replace(/\s*#?\s*\(推荐改进\)\s*/gim, ' ').trim();

    // 영어 텍스트 제거
    section = section.replace(/^\s*#?\s*\(Recommended\s+Improvement\)\s*\n*/gim, '').trim();
    section = section.replace(/^\s*#?\s*\(Optional\s+Improvement\)\s*\n*/gim, '').trim();
    section = section.replace(/^\s*#?\s*\(Suggested\s+Improvement\)\s*\n*/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(Recommended\s+Improvement\)\s*$/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(Optional\s+Improvement\)\s*$/gim, '').trim();
    section = section.replace(/\n\s*#?\s*\(Suggested\s+Improvement\)\s*$/gim, '').trim();
    section = section.replace(/\s*#?\s*\(Recommended\s+Improvement\)\s*/gim, ' ').trim();
    section = section.replace(/\s*#?\s*\(Optional\s+Improvement\)\s*/gim, ' ').trim();
    section = section.replace(/\s*#?\s*\(Suggested\s+Improvement\)\s*/gim, ' ').trim();

    // 기타 제거
    section = section.replace(/^\[.+?\]\s*\n*/i, '').trim();

    // 각 줄의 앞쪽 들여쓰기 제거 (공백 4개 이하만)
    section = section
        .split('\n')
        .map((line) => line.replace(/^[ ]{1,4}/, ''))
        .join('\n')
        .trim();

    return section || null;
};

// ====== 영상 분석 결과 파싱 함수 ======
const parseVideoAnalysis = (original_analysis) => {
    if (!original_analysis) {
        return {
            analysis_high_a: null,
            analysis_high_b: null,
            analysis_high_c: null,
            analysis_medium_d: null,
            analysis_medium_e: null,
            analysis_low_f: null,
            analysis_low_g: null,
            analysis_low_h: null,
        };
    }

    // 1) 본문에서 실제 존재하는 섹션 헤더 스캔 (괄호까지 캡처: 'a)')
    const headerScanRegex = new RegExp('^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?([a-h]\\))\\s+.*$', 'gim');

    const presentLetters = [];
    let m;
    while ((m = headerScanRegex.exec(original_analysis)) !== null) {
        presentLetters.push((m[1] || '').toLowerCase()); // 예: ['a)', 'c)', 'f)']
    }

    // 2) 현재 섹션의 "다음에 실제로 존재하는 섹션 키('b)')"를 구함
    const nextExisting = (letterWithParen /* 'a)' 형태 */) => {
        const idx = presentLetters.indexOf(letterWithParen);
        if (idx === -1) return null;
        return presentLetters[idx + 1] || null; // 없으면 null
    };

    return {
        // a) Hook 최적화
        analysis_high_a: extract_section(original_analysis, buildStartPattern('a'), nextExisting('a)')),

        // b) 스토리텔링 및 감정 전달
        analysis_high_b: extract_section(original_analysis, buildStartPattern('b'), nextExisting('b)')),

        // c) 플랫폼 최적화
        analysis_high_c: extract_section(original_analysis, buildStartPattern('c'), nextExisting('c)')),

        // d) 제품 노출 최적화
        analysis_medium_d: extract_section(original_analysis, buildStartPattern('d'), nextExisting('d)')),

        // e) 오디오 품질
        analysis_medium_e: extract_section(original_analysis, buildStartPattern('e'), nextExisting('e)')),

        // f) 경쟁력 분석
        analysis_low_f: extract_section(original_analysis, buildStartPattern('f'), nextExisting('f)')),

        // g) 전환율 최적화
        analysis_low_g: extract_section(original_analysis, buildStartPattern('g'), nextExisting('g)')),

        // h) A/B 테스트 제안 (마지막: 끝까지)
        analysis_low_h: extract_section(
            original_analysis,
            buildStartPattern('h')
            // nextLetter 없음 → 끝까지
        ),
    };
};
// 영상 분석 결과 전체 조회
export const getAllVideoAnalysisResults = async (req, res) => {
    try {
        const { post_id, language } = req.query; // language: 'ko', 'zh', 'en'
        const sqlSet = select_data_query({ post_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        // 언어에 따라 사용할 필드 결정 (데이터가 없으면 한국어로 폴백)
        const getAnalysisField = (row) => {
            if (language === 'zh') {
                // 중국어 요청 시: 중국어 데이터가 있으면 사용, 없으면 한국어로 폴백
                return row.ai_improvement_suggestions_cn || row.ai_improvement_suggestions || null;
            } else if (language === 'en') {
                // 영어 요청 시: 영어 데이터가 있으면 사용, 없으면 한국어로 폴백
                return row.ai_improvement_suggestions_eng || row.ai_improvement_suggestions || null;
            } else {
                // 한국어 또는 기본값: 한국어 데이터 사용
                return row.ai_improvement_suggestions || null;
            }
        };

        // 각 행의 분석 결과를 모든 언어별로 파싱하여 섹션별로 분리
        const parsedResults = result.rows.map((row) => {
            // 언어에 따라 사용할 필드 결정 (클라이언트에서 요청한 언어)
            const analysisText = getAnalysisField(row);

            // 한국어 파싱
            const parsedAnalysisKo = parseVideoAnalysis(row.ai_improvement_suggestions);

            // 중국어 파싱
            const parsedAnalysisCn = parseVideoAnalysis(row.ai_improvement_suggestions_cn);

            // 영어 파싱
            const parsedAnalysisEng = parseVideoAnalysis(row.ai_improvement_suggestions_eng);

            // 요청한 언어의 파싱 결과 (기본값으로 사용)
            // analysisText가 null이면 모든 섹션이 null인 객체 반환
            const parsedAnalysis = analysisText
                ? parseVideoAnalysis(analysisText)
                : {
                      analysis_high_a: null,
                      analysis_high_b: null,
                      analysis_high_c: null,
                      analysis_medium_d: null,
                      analysis_medium_e: null,
                      analysis_low_f: null,
                      analysis_low_g: null,
                      analysis_low_h: null,
                  };

            const parsedResult = {
                post_id: row.post_id,
                original_analysis: analysisText, // 선택된 언어의 원본 데이터 (없으면 null)
                original_analysis_ko: row.ai_improvement_suggestions || null,
                original_analysis_cn: row.ai_improvement_suggestions_cn || null,
                original_analysis_eng: row.ai_improvement_suggestions_eng || null,
                // 요청한 언어의 파싱 결과 (기본) - 데이터가 없으면 모든 섹션이 null
                ...parsedAnalysis,
                // 모든 언어의 파싱 결과 (선택적 사용)
                analysis_ko: parsedAnalysisKo,
                analysis_cn: parsedAnalysisCn,
                analysis_eng: parsedAnalysisEng,
            };

            return parsedResult;
        });

        res.json(parsedResults);
    } catch (error) {
        console.error('영상 분석 결과 조회 실패:', error);
        res.status(500).json({ error: 'Failed to fetch video analysis results' });
    }
};

// 여러 post_id의 영상 분석 상태 조회 (DB + EC2 FastAPI 서버)
export const getVideoAnalysisStatuses = async (req, res) => {
    try {
        // GET 또는 POST 둘 다 지원 (대량 요청은 POST 권장)
        const post_ids = req.method === 'POST' ? req.body.post_ids : req.query.post_ids;

        let postIdsArray = [];
        if (Array.isArray(post_ids)) {
            postIdsArray = post_ids.filter(Boolean);
        } else if (typeof post_ids === 'string') {
            postIdsArray = post_ids
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean);
        }

        if (postIdsArray.length === 0) {
            return res.json({});
        }

        // 1️⃣ DB에서 completed/failed 상태 조회
        const sqlSet = select_status_query({ post_ids: postIdsArray });

        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        const statusMap = {};
        result.rows.forEach((row) => {
            statusMap[row.post_id] = row.video_analysis_status;
        });

        // 2️⃣ DB에 없는 post_id는 EC2 FastAPI 서버에서 pending 상태 확인
        // EC2 서버: /home/ec2-user/crawling/result/{post_id}.json 파일 확인
        const EC2_FASTAPI_URL = process.env.API_URL;
        const missingPostIds = postIdsArray.filter((post_id) => !statusMap[post_id]);

        if (missingPostIds.length > 0) {
            // EC2 서버에 병렬로 요청
            const ec2Promises = missingPostIds.map(async (post_id) => {
                try {
                    const ec2Url = `${EC2_FASTAPI_URL}/analysis-status/_?post_id=${encodeURIComponent(post_id)}`;

                    const response = await fetch(ec2Url, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(3000), // 3초 타임아웃
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const status = data.status?.toLowerCase();

                        if (status === 'pending' || status === 'completed' || status === 'failed') {
                            return { post_id, status };
                        } else if (status === 'unknown') {
                            // EC2에 파일 없음 → pending으로 처리 (파일 생성 대기)
                            return { post_id, status: 'pending' };
                        }
                    } else if (response.status === 404) {
                        // 404: JSON 파일 아직 생성 안 됨 → pending으로 처리 (계속 체크)
                        return { post_id, status: 'pending' };
                    } else {
                        // 기타 에러 (500 등)
                        console.warn(`❌ EC2 응답 실패 (${post_id}): ${response.status}`);
                        return { post_id, status: 'pending' }; // 일단 pending으로 계속 체크
                    }
                } catch (error) {
                    console.error(`❌ EC2 요청 에러 (${post_id}):`, error.name, error.message);
                    // EC2 서버 연결 실패 → pending으로 처리 (계속 체크)
                    return { post_id, status: 'pending' };
                }
                return null;
            });

            const ec2Results = await Promise.all(ec2Promises);

            // EC2에서 받은 상태를 statusMap에 추가
            ec2Results.forEach((result) => {
                if (result) {
                    statusMap[result.post_id] = result.status;
                }
            });
        }

        res.json(statusMap);
    } catch (error) {
        console.error('영상 분석 상태 조회 실패:', error);
        res.status(500).json({
            error: 'Failed to fetch video analysis statuses',
            details: error.message,
        });
    }
};
