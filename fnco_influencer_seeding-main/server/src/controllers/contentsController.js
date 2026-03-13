import { pool } from '../config/database.js';
import { select_data_query } from '../sql/seeding/selectQuery.js';
import { insert_data_query } from '../sql/seeding/insertQuery.js';
import { update_data_query } from '../sql/seeding/updateQuery.js';
import { delete_data_query } from '../sql/seeding/deleteQuery.js';
import { select_data_query as select_data_ugc_query } from '../sql/ugc/selectQuery.js';
import { update_data_query as update_data_ugc_query } from '../sql/ugc/updateQuery.js';
import { delete_data_query as delete_data_ugc_query } from '../sql/ugc/deleteQuery.js';
import { insert_data_query as insert_ugc_data_query } from '../sql/ugc/insertQuery.js';
import {
    select_data_query as select_data_performance_query,
    check_post_exists_query,
} from '../sql/performance/selectQuery.js';
import { select_data_query as select_data_preview_query } from '../sql/preview/selectQuery.js';
import { update_data_query as update_data_preview_query } from '../sql/preview/updateQuery.js';
import { delete_data_query as delete_data_preview_query } from '../sql/preview/deleteQuery.js';
import { insert_data_query as insert_preview_data_query } from '../sql/preview/insertQuery.js';
import { get_plan_issue_top_content_query } from '../sql/aiPlan/selectQuery.js';
import { parseUrl } from '../../../common/utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 동영상 파일 업로드를 위한 임시 디렉토리
const videoUploadDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(videoUploadDir)) {
    fs.mkdirSync(videoUploadDir, { recursive: true });
}

// 동영상 파일용 Multer 설정
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videoUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
        const safeFilename = `video-${uniqueSuffix}${ext}`;
        cb(null, safeFilename);
    },
});

// 동영상 파일 필터: MP4, MOV, AVI, WMV만 허용
const videoFileFilter = (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.wmv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('MP4, MOV, AVI, WMV 파일만 업로드 가능합니다.'), false);
    }
};

// 동영상 업로드 미들웨어
export const uploadVideoMiddleware = multer({
    storage: videoStorage,
    fileFilter: videoFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
    },
}).single('video');

// 시딩 콘텐츠 전체 조회
export const getAllSeedingContents = async (req, res) => {
    try {
        // scope: 'read_all' | 'read_team' | 'read_self'
        const { scope, team_codes, team_code, user_id } = req.query;
        // team_codes는 CSV("A,B,C") 또는 다중 쿼리스트링을 배열로 수신 가능
        let teamCodesArr = [];
        if (Array.isArray(team_codes)) {
            teamCodesArr = team_codes.filter(Boolean);
        } else if (typeof team_codes === 'string' && team_codes.trim().length > 0) {
            teamCodesArr = team_codes
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (typeof team_code === 'string' && team_code.trim().length > 0) {
            // 하위호환: team_code 단일이 오면 1개 배열로 처리
            teamCodesArr = [team_code.trim()];
        }

        const sqlSet = select_data_query({ scope, team_codes: teamCodesArr, user_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        res.json(result.rows);
    } catch (error) {
        console.error('시딩 콘텐츠 조회 실패:', error);
        res.status(500).json({ error: 'Failed to fetch Seeding contents' });
    }
};

// 콘텐츠 생성
export const createSeedingContent = async (req, res) => {
    try {
        const param = req.body.insertPara;
        const sqlSet = insert_data_query([param]);
        const result = await pool.query(sqlSet.insertQuery);

        // INSERT 쿼리가 반환하는 행이 없을 수 있으므로, 성공 메시지 반환
        if (result.rows && result.rows.length > 0) {
            res.status(201).json(result.rows[0]);
        } else {
            res.status(201).json({
                message: 'success',
                post_id: param?.post_id,
                rowCount: result.rowCount,
            });
        }
    } catch (error) {
        console.error('Seeding 등록 실패:', {
            error: error.message,
            stack: error.stack,
            param: req.body.insertPara,
        });
        res.status(500).json({ error: 'Failed to create Seeding content', message: error.message });
    }
};

// Seeding 콘텐츠 수정
export const updateSeedingContent = async (req, res) => {
    try {
        const { updatePara } = req.body;
        const sqlSet = update_data_query(updatePara);
        await pool.query(sqlSet.updateQuery);

        res.status(201).json({ message: 'success' });
    } catch (error) {
        console.error('Seeding 수정 실패:', error);
        res.status(500).json({ error: 'Failed to update Seeding content' });
    }
};

// Seeding 콘텐츠 삭제
export const deleteSeedingContent = async (req, res) => {
    try {
        const { deletePara } = req.body;
        const sqlSet = delete_data_query(deletePara);
        const result = {
            mstDeleteQuery: await pool.query(sqlSet.mstDeleteQuery),
            dwDdeleteQuery: await pool.query(sqlSet.dwDdeleteQuery),
        };

        if (result.mstDeleteQuery.rowCount === 0 || result.dwDdeleteQuery.rowCount === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ message: 'Content deleted successfully', id: deletePara });
    } catch (error) {
        console.error('Seeding 삭제 실패:', error);
        res.status(500).json({ error: 'Failed to delete Seeding content' });
    }
};
// ---------------------------------------------
// UGC 전체 조회
export const getAllUGCContents = async (req, res) => {
    try {
        const { scope, team_codes, team_code, user_id } = req.query;
        let teamCodesArr = [];
        if (Array.isArray(team_codes)) {
            teamCodesArr = team_codes.filter(Boolean);
        } else if (typeof team_codes === 'string' && team_codes.trim().length > 0) {
            teamCodesArr = team_codes
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (typeof team_code === 'string' && team_code.trim().length > 0) {
            teamCodesArr = [team_code.trim()];
        }

        const sqlSet = select_data_ugc_query({ scope, team_codes: teamCodesArr, user_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        res.json(result.rows);
    } catch (error) {
        console.error('시딩 콘텐츠 조회 실패:', error);
        res.status(500).json({ error: 'Failed to fetch UGC contents' });
    }
};

// 콘텐츠 생성
export const createUGCContent = async (req, res) => {
    try {
        const param = req.body.insertPara;
        const sqlSet = insert_ugc_data_query([param]);
        const result = await pool.query(sqlSet.insertQuery);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('UGC 등록 실패:', error);
        res.status(500).json({ error: 'Failed to create UGC content' });
    }
};

// UGC 콘텐츠 수정
export const updateUGCContent = async (req, res) => {
    try {
        const { updatePara } = req.body;
        const sqlSet = update_data_ugc_query(updatePara);
        await pool.query(sqlSet.updateQuery);

        res.status(201).json({ message: 'success' });
    } catch (error) {
        console.error('UGC 수정 실패:', error);
        res.status(500).json({ error: 'Failed to update UGC content' });
    }
};

// UGC 콘텐츠 삭제
export const deleteUGCContent = async (req, res) => {
    try {
        const { deletePara } = req.body;
        const sqlSet = delete_data_ugc_query(deletePara);
        const result = {
            mstDeleteQuery: await pool.query(sqlSet.mstDeleteQuery),
            dwDdeleteQuery: await pool.query(sqlSet.dwDdeleteQuery),
        };

        if (result.mstDeleteQuery.rowCount === 0 || result.dwDdeleteQuery.rowCount === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ message: 'Content deleted successfully', id: deletePara });
    } catch (error) {
        console.error('UGC 삭제 실패:', error);
        res.status(500).json({ error: 'Failed to delete UGC content' });
    }
};

// Preview 콘텐츠 전체 조회
export const getAllPreviewContents = async (req, res) => {
    try {
        const { scope, team_codes, team_code, user_id } = req.query;
        let teamCodesArr = [];
        if (Array.isArray(team_codes)) {
            teamCodesArr = team_codes.filter(Boolean);
        } else if (typeof team_codes === 'string' && team_codes.trim().length > 0) {
            teamCodesArr = team_codes
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (typeof team_code === 'string' && team_code.trim().length > 0) {
            teamCodesArr = [team_code.trim()];
        }

        const sqlSet = select_data_preview_query({ scope, team_codes: teamCodesArr, user_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        res.json(result.rows);
    } catch (error) {
        console.error('Preview 콘텐츠 조회 실패:', error);
        res.status(500).json({ error: 'Failed to fetch Preview contents' });
    }
};

// Preview 콘텐츠 생성 - FastAPI로 전달 후 DB 저장
export const createPreviewContentBulk = async (req, res) => {
    try {
        const { insertPara, url } = req.body || {};
        let param = insertPara || req.body || {};

        if (!insertPara && url) {
            const match = parseUrl(url);
            param = {
                ...param,
                post_url: url,
                post_id: param.post_id || match?.id || null,
                platform: param.platform || match?.platform || null,
            };
        }

        if (!param.platform && param.post_url) {
            const matchFromPostUrl = parseUrl(param.post_url);
            if (matchFromPostUrl?.platform) {
                param.platform = matchFromPostUrl.platform;
                if (!param.post_id) {
                    param.post_id = matchFromPostUrl.id || param.post_id;
                }
            }
        }

        if (!param.platform) {
            return res.status(400).json({ error: 'platform이 필요합니다.' });
        }

        if (!param || Object.keys(param).length === 0) {
            return res.status(400).json({ error: 'insertPara가 비어 있습니다.' });
        }

        const fastApiUrl = process.env.API_URL;
        const fastApiPayload = {
            url: param.post_url || param.url,
            platform: param.platform,
            user_id: param.user_id,
            user_nm: param.user_nm,
            post_id: param.post_id,
            seeding_product: param.seeding_product,
        };

        const response = await fetch(`${fastApiUrl}/preview/bulk`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fastApiPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ FastAPI 에러:', errorData);
            return res.status(response.status).json(errorData);
        }

        const fastApiResult = await response.json();

        const insertParam = {
            ...param,
            post_id: fastApiResult.data?.post_id || param.post_id,
            analysis_status: fastApiResult.data?.analysis_status,
            analyzed_at: fastApiResult.data?.analyzed_at,
        };

        const sqlSet = insert_preview_data_query([insertParam]);
        await pool.query(sqlSet.insertQuery);

        res.status(201).json({
            success: true,
            message: '가편 영상이 성공적으로 등록되었습니다.',
            data: {
                ...fastApiResult.data,
                db_inserted: true,
            },
        });
    } catch (error) {
        console.error('❌ Preview 등록 실패 (Node.js):', error);

        // PostgreSQL 중복 키 에러 처리
        if (error.code === '23505') {
            return res.status(409).json({
                error: '이미 등록된 구글 드라이브 파일입니다.',
                duplicate: true,
            });
        }

        res.status(500).json({
            error: 'Failed to create Preview content',
            details: error.message,
        });
    }
};

// Preview 콘텐츠 생성 - 개별 등록 (동영상 파일 직접 업로드)
export const createPreviewContentIndividual = async (req, res) => {
    const fastApiUrl = process.env.API_URL;

    try {
        if (!req.file) {
            return res.status(400).json({ error: '동영상 파일이 업로드되지 않았습니다.' });
        }
        let metadata = {};
        try {
            if (req.body.metadata) {
                metadata = JSON.parse(req.body.metadata);
            } else {
                // metadata가 없으면 req.body에서 직접 가져오기
                metadata = {
                    platform: req.body.platform,
                    seeding_product: req.body.seeding_product,
                    keyword: req.body.keyword || '',
                    seeding_cost: req.body.seeding_cost || 0,
                    agency_nm: req.body.agency_nm || '',
                    is_fnco_edit: req.body.is_fnco_edit === 'true' || req.body.is_fnco_edit === true,
                    content_summary: req.body.content_summary || '',
                    scheduled_date: req.body.scheduled_date || '',
                    seeding_cntry: req.body.seeding_cntry || 'KR',
                    user_id: req.body.user_id,
                    user_nm: req.body.user_nm,
                };
            }

            delete metadata.filePath;
            delete metadata.path;
            delete metadata.file_path;
        } catch (parseError) {
            console.error('메타데이터 파싱 오류:', parseError);
            // 파일 삭제
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: '메타데이터 형식이 올바르지 않습니다.' });
        }

        if (!metadata.platform || !metadata.seeding_product || !metadata.scheduled_date) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                error: '플랫폼, 시딩 품목, 예상 업로드 일정은 필수 입력 항목입니다.',
            });
        }

        if (!fastApiUrl) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ error: 'FastAPI 서버 URL이 설정되지 않았습니다.' });
        }
        const axios = (await import('axios')).default;
        const FormData = (await import('form-data')).default;
        const formDataForFastAPI = new FormData();

        // 파일 존재 여부 확인
        if (!fs.existsSync(req.file.path)) {
            return res.status(400).json({ error: '업로드된 파일을 찾을 수 없습니다.' });
        }

        // 파일 크기 확인
        const fileStats = fs.statSync(req.file.path);
        if (fileStats.size === 0) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: '업로드된 파일이 비어있습니다.' });
        }

        const fileExt = path.extname(req.file.originalname).toLowerCase() || '.mp4';
        const safeFilename = `upload-${Date.now()}${fileExt}`;

        formDataForFastAPI.append('file', fs.createReadStream(req.file.path), {
            filename: safeFilename,
            contentType: req.file.mimetype || 'video/mp4',
        });

        formDataForFastAPI.append('platform', metadata.platform || '');
        formDataForFastAPI.append('user_id', metadata.user_id || '');
        formDataForFastAPI.append('user_nm', metadata.user_nm || '');
        formDataForFastAPI.append('seeding_product', metadata.seeding_product || '');
        if (metadata.keyword) {
            formDataForFastAPI.append('keyword', metadata.keyword);
        }
        if (metadata.seeding_cost !== undefined) {
            formDataForFastAPI.append('seeding_cost', String(metadata.seeding_cost));
        }
        if (metadata.agency_nm) {
            formDataForFastAPI.append('agency_nm', metadata.agency_nm);
        }
        if (metadata.is_fnco_edit !== undefined) {
            formDataForFastAPI.append('is_fnco_edit', String(metadata.is_fnco_edit));
        }
        if (metadata.content_summary) {
            formDataForFastAPI.append('content_summary', metadata.content_summary);
        }
        if (metadata.scheduled_date) {
            formDataForFastAPI.append('scheduled_date', metadata.scheduled_date);
        }
        if (metadata.seeding_cntry) {
            formDataForFastAPI.append('seeding_cntry', metadata.seeding_cntry);
        }
        if (metadata.campaign_name) {
            formDataForFastAPI.append('campaign_name', metadata.campaign_name);
        }

        formDataForFastAPI.append('original_filename', req.file.originalname);
        formDataForFastAPI.append(
            'original_filename_base64',
            Buffer.from(req.file.originalname, 'utf8').toString('base64')
        );
        let response;
        try {
            const requestHeaders = formDataForFastAPI.getHeaders();
            response = await axios.post(`${fastApiUrl}/preview/individual`, formDataForFastAPI, {
                headers: requestHeaders,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 600000,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        if (percentCompleted % 25 === 0) {
                            // upload progress (optional: log to monitoring)
                        }
                    }
                },
            });
        } catch (axiosError) {
            throw axiosError;
        }

        if (!response || response.status !== 200) {
            throw new Error(`FastAPI 응답 오류: ${response?.status || 'unknown'}`);
        }

        const fastApiResult = response.data;

        const postId = fastApiResult.data?.post_id;
        if (!postId) {
            throw new Error('FastAPI 응답에 post_id가 없습니다.');
        }

        const s3VideoUrlArray = fastApiResult.data?.s3_video_url;
        const s3VideoUrl = Array.isArray(s3VideoUrlArray) && s3VideoUrlArray.length > 0 ? s3VideoUrlArray[0] : null;

        if (!s3VideoUrl) {
            console.warn('⚠️ FastAPI 응답에 s3_video_url이 없습니다. S3 업로드가 실패했을 수 있습니다.');
            console.warn('⚠️ FastAPI warnings:', fastApiResult.warnings || []);
        }
        const insertParam = {
            post_id: postId,
            post_url: null,
            platform: metadata.platform,
            seeding_product: metadata.seeding_product,
            keyword: metadata.keyword || '',
            scheduled_date: metadata.scheduled_date || '',
            seeding_cost: metadata.seeding_cost || 0,
            agency_nm: metadata.agency_nm || '',
            is_fnco_edit: metadata.is_fnco_edit || false,
            content_summary: metadata.content_summary || '',
            user_id: metadata.user_id,
            seeding_cntry: metadata.seeding_cntry || 'KR',
            user_nm: metadata.user_nm,
            campaign_name: metadata.campaign_name || null,
        };

        const sqlSet = insert_preview_data_query([insertParam]);
        await pool.query(sqlSet.insertQuery);

        // DB 저장 성공 후 임시 파일 삭제
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json({
            success: true,
            message: '가편 영상 개별 등록이 성공적으로 완료되었습니다.',
            data: {
                post_id: postId,
                video_url: s3VideoUrl,
                s3_video_url: s3VideoUrlArray,
                ...fastApiResult.data,
                db_inserted: true,
                warnings: fastApiResult.warnings || [],
            },
        });
    } catch (error) {
        console.error('❌ Preview 개별 등록 실패 (Node.js):', error);

        // 임시 파일 삭제
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        // PostgreSQL 중복 키 에러 처리
        if (error.code === '23505') {
            return res.status(409).json({
                error: '이미 등록된 동영상 파일입니다.',
                duplicate: true,
            });
        }

        if (error.response) {
            let errorData = error.response.data;
            const errorStatus = error.response.status || 500;

            if (typeof errorData === 'string') {
                try {
                    errorData = JSON.parse(errorData);
                } catch {
                    errorData = { message: errorData, raw: errorData };
                }
            }

            console.error('❌ FastAPI 서버 에러 상세:', {
                status: errorStatus,
                statusText: error.response.statusText,
                data: errorData,
                requestUrl: fastApiUrl ? `${fastApiUrl}/preview/individual` : 'unknown',
                fileName: req.file?.originalname,
                fileSize: req.file?.size,
            });

            const userMessage =
                errorData?.message || errorData?.error || errorData?.raw || 'FastAPI 서버에서 오류가 발생했습니다.';

            return res.status(errorStatus).json({
                error: 'FastAPI 서버 오류',
                message: userMessage,
                details: errorData,
                status: errorStatus,
                suggestion: 'FastAPI 서버 로그를 확인해주세요.',
            });
        }

        res.status(500).json({
            error: 'Failed to create Preview content (individual)',
            details: error.message,
        });
    }
};

// Preview 콘텐츠 수정
export const updatePreviewContent = async (req, res) => {
    try {
        const { updatePara } = req.body;
        const sqlSet = update_data_preview_query(updatePara);
        await pool.query(sqlSet.updateQuery);

        res.status(201).json({ message: 'success' });
    } catch (error) {
        console.error('Preview 수정 실패:', error);
        res.status(500).json({ error: 'Failed to update Preview content' });
    }
};

// Preview 콘텐츠 삭제
export const deletePreviewContent = async (req, res) => {
    try {
        const { deletePara } = req.body;
        const sqlSet = delete_data_preview_query(deletePara);
        const result = {
            mstDeleteQuery: await pool.query(sqlSet.mstDeleteQuery),
            dwDdeleteQuery: await pool.query(sqlSet.dwDdeleteQuery),
        };

        if (result.mstDeleteQuery.rowCount === 0 || result.dwDdeleteQuery.rowCount === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ message: 'Content deleted successfully', id: deletePara });
    } catch (error) {
        console.error('Preview 삭제 실패:', error);
        res.status(500).json({ error: 'Failed to delete Preview content' });
    }
};

// ---------------------------------------------
// 성과 우수 콘텐츠 전체 조회 (read-only)
export const getAllPerformanceContents = async (req, res) => {
    try {
        const { scope, team_codes, team_code, user_id } = req.query;
        let teamCodesArr = [];
        if (Array.isArray(team_codes)) {
            teamCodesArr = team_codes.filter(Boolean);
        } else if (typeof team_codes === 'string' && team_codes.trim().length > 0) {
            teamCodesArr = team_codes
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (typeof team_code === 'string' && team_code.trim().length > 0) {
            teamCodesArr = [team_code.trim()];
        }

        const sqlSet = select_data_performance_query({ scope, team_codes: teamCodesArr, user_id });
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);
        res.json(result.rows);
    } catch (error) {
        console.error('성과 우수 콘텐츠 조회 실패:', error);
        res.status(500).json({ error: 'Failed to fetch Performance contents' });
    }
};

/**
 * post_id(shortcode)가 fnco_influencer.vw_mst_post_performance에 존재하는지 확인
 * Query Parameters:
 * - post_id: 단일 post_id (string)
 * - post_ids: 쉼표로 구분된 여러 post_id (string) 예: "id1,id2,id3"
 *
 * Response:
 * - 단일 조회: { exists: true/false, post_id: string }
 * - 다중 조회: { results: [{ post_id: string, exists: true/false }] }
 */
export const checkPostExistsInPerformance = async (req, res) => {
    try {
        const { post_id, post_ids } = req.query;

        if (!post_id && !post_ids) {
            return res.status(400).json({
                error: 'post_id 또는 post_ids 파라미터가 필요합니다.',
            });
        }

        // 다중 post_id 처리
        if (post_ids) {
            const postIdsArray = post_ids
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean);

            if (postIdsArray.length === 0) {
                return res.status(400).json({
                    error: '유효한 post_ids가 없습니다.',
                });
            }

            const sqlSet = check_post_exists_query(postIdsArray);
            const result = await pool.query(sqlSet.checkQuery, sqlSet.params);

            // 조회된 post_id 목록
            const existingPostIds = result.rows.map((row) => row.post_id);

            // 각 post_id에 대해 존재 여부 체크
            const results = postIdsArray.map((id) => ({
                post_id: id,
                exists: existingPostIds.includes(id),
            }));

            return res.json({ results });
        }

        // 단일 post_id 처리
        const sqlSet = check_post_exists_query(post_id);
        const result = await pool.query(sqlSet.checkQuery, sqlSet.params);

        const exists = result.rows.length > 0;

        res.json({
            exists,
            post_id,
            message: exists
                ? 'post_id가 vw_mst_post_performance에 존재합니다.'
                : 'post_id가 vw_mst_post_performance에 존재하지 않습니다.',
        });
    } catch (error) {
        console.error('post_id 존재 여부 확인 실패:', error);
        res.status(500).json({ error: 'Failed to check post existence in performance view' });
    }
};

/**
 * 성과 우수 콘텐츠 감지 시 메일 서버로 알림 전송
 * Body:
 * - post_id: 콘텐츠 post_id (string)
 * - post_url: 콘텐츠 URL (string)
 * - created_at: 감지 시점 (string/Date)
 * - user_id: 등록한 사용자 ID (string)
 * - user_nm: 등록한 사용자명 (string)
 */
export const logPerformanceContentDetection = async (req, res) => {
    try {
        const { post_id, post_url, created_at, user_id, user_nm } = req.body;

        // 필수 파라미터 검증
        if (!post_id || !post_url || !created_at || !user_id || !user_nm) {
            return res.status(400).json({
                error: 'post_id, post_url, created_at, user_id, user_nm은 필수 파라미터입니다.',
            });
        }

        // 메일 서버 URL (환경변수 사용)
        const mailServerUrl = process.env.API_URL;
        const mailApiEndpoint = `${mailServerUrl}/api/mail/performance-alert`;

        // 메일 서버로 알림 전송
        try {
            const mailResponse = await fetch(mailApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    post_id,
                    post_url,
                    user_id,
                    user_nm,
                    detected_at: created_at,
                }),
            });

            if (!mailResponse.ok) {
                const errorText = await mailResponse.text();
                console.error('메일 서버 응답 오류:', mailResponse.status, errorText);
                throw new Error(`Mail server error: ${mailResponse.status}`);
            }

            const mailResult = await mailResponse.json();

            res.status(201).json({
                success: true,
                message: '성과 우수 콘텐츠 알림이 메일 서버로 전송되었습니다.',
                data: {
                    post_id,
                    post_url,
                    user_id,
                    user_nm,
                    mail_sent: true,
                },
            });
        } catch (mailError) {
            // 메일 발송 실패 시에도 200 응답 (클라이언트에는 성공으로 보이게)
            console.error('메일 서버 전송 실패:', mailError);
            res.status(201).json({
                success: true,
                message: '성과 우수 콘텐츠 감지가 완료되었습니다.',
                data: {
                    post_id,
                    post_url,
                    user_id,
                    user_nm,
                    mail_sent: false,
                    error: mailError.message,
                },
            });
        }
    } catch (error) {
        console.error('성과 우수 콘텐츠 알림 처리 실패:', error);
        res.status(500).json({ error: 'Failed to send performance content alert' });
    }
};

/**
 * UGC 뷰티 카테고리별 인사이트 조회
 * mst_plan_issue_top_content 테이블에서 카테고리별 TOP 콘텐츠 + AI 인사이트 반환
 * Query Parameters:
 * - platform: (optional) 플랫폼 필터 (youtube, tiktok, instagram)
 */
export const getUGCCategoryInsights = async (req, res) => {
    try {
        const { platform } = req.query;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (platform) {
            params.push(platform.toLowerCase());
            whereClause += ` AND LOWER(platform) = $${params.length}`;
        }

        const query = `
            SELECT
                category,
                subcategory,
                id,
                post_id,
                rank_no,
                post_url,
                platform,
                keyword,
                ai_post_summary,
                ai_post_summary_cn,
                ai_post_summary_eng,
                ai_channel_summary,
                ai_channel_summary_cn,
                ai_channel_summary_eng,
                created_dt,
                media_url,
                author_nm,
                view_count,
                title
            FROM fnco_influencer.mst_plan_issue_top_content
            ${whereClause}
            ORDER BY category, subcategory, rank_no ASC
        `;

        const result = await pool.query(query, params);

        // JSON 필드 파싱 + 카테고리별 그룹핑
        const categoryMap = {};
        for (const row of result.rows) {
            const key = row.subcategory || row.category || 'etc';

            // JSON 파싱 헬퍼
            const tryParse = (val) => {
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch { return val; }
                }
                return val;
            };

            const parsed = {
                ...row,
                keyword: tryParse(row.keyword),
                media_url: tryParse(row.media_url),
                ai_post_summary: tryParse(row.ai_post_summary),
                ai_post_summary_cn: tryParse(row.ai_post_summary_cn),
                ai_post_summary_eng: tryParse(row.ai_post_summary_eng),
                ai_channel_summary: tryParse(row.ai_channel_summary),
                ai_channel_summary_cn: tryParse(row.ai_channel_summary_cn),
                ai_channel_summary_eng: tryParse(row.ai_channel_summary_eng),
                platform: row.platform ? row.platform.toLowerCase() : row.platform,
            };

            if (!categoryMap[key]) {
                categoryMap[key] = {
                    category: row.category,
                    subcategory: row.subcategory,
                    contents: [],
                };
            }
            categoryMap[key].contents.push(parsed);
        }

        const categories = Object.values(categoryMap);

        res.json({
            success: true,
            data: categories,
            totalCategories: categories.length,
            totalContents: result.rows.length,
        });
    } catch (error) {
        console.error('UGC 카테고리 인사이트 조회 실패:', error);
        res.status(500).json({ error: 'Failed to fetch UGC category insights', details: error.message });
    }
};
