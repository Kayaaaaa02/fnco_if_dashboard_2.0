import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import crawlingRoutes from './routes/crawling.js';
import contentsRoutes from './routes/contents.js';
import userRoutes from './routes/user.js';
import aiPlanRoutes from './routes/aiPlan.js';
import aiImageRoutes from './routes/aiImage.js';
import influencerRoutes from './routes/influencer.js';
import campaignRoutes from './routes/campaign.js';
import pdaRoutes from './routes/pda.js';
import strategyRoutes from './routes/strategy.js';
import calendarRoutes from './routes/calendar.js';
import campaignInfluencerRoutes from './routes/campaignInfluencer.js';
import outreachRoutes from './routes/outreach.js';
import launchRoutes from './routes/launch.js';
import creativeRoutes from './routes/creative.js';
import monitorRoutes from './routes/monitor.js';
import auditRoutes from './routes/auditRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import narrativeArcRoutes from './routes/narrativeArc.js';
import alignmentRoutes from './routes/alignment.js';
import hookBankRoutes from './routes/hookBank.js';
import channelSetupRoutes from './routes/channelSetup.js';
import dropCoordinationRoutes from './routes/dropCoordination.js';
import earlySignalRoutes from './routes/earlySignal.js';
import optimizationRoutes from './routes/optimization.js';
import ugcFlywheelRoutes from './routes/ugcFlywheel.js';
import masterPdaRoutes from './routes/masterPda.js';
import brandDnaRoutes from './routes/brandDna.js';
import typecastRoutes from './routes/typecast.js';
import videoRoutes from './routes/video.js';
import auditLog from './middleware/auditLog.js';
import teamIsolation from './middleware/teamIsolation.js';
import { pool, testConnection } from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { initSentry, setupSentryErrorHandler } from './lib/sentry.js';
import { initSocketIO } from './lib/socketManager.js';

dotenv.config();

// HTTP/HTTPS 글로벌 타임아웃 설정
http.globalAgent.timeout = 900000;
https.globalAgent.timeout = 900000;

const PORT = process.env.PORT || 5000;
const IMAGE_PATH = process.env.IMAGE_PATH;
const app = express();

// Sentry initialization (must be before other middleware)
initSentry(app);

// 1. 신뢰할 수 있는 프록시 설정
app.set('trust proxy', 1);

// 2. OPTIONS 처리는 Nginx에서 하므로 여기서는 제거!
// (Nginx가 더 빠르게 처리합니다)

// 3. CORS 미들웨어 (실제 GET, POST 등의 요청용)
app.use(
    cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Team-Code', 'X-User-Role'],
        exposedHeaders: ['Content-Length', 'Content-Type'],
    })
);

// 4. JSON/URL-encoded 파서
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.disable('x-powered-by');

// 5. Helmet 보안 설정
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.set({
            'Access-Control-Allow-Origin': req.headers.origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
            'Access-Control-Max-Age': '86400',
        });
        return res.status(204).end();
    }
    next();
});

// 6. 요청 로깅
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 5000) {
            // slow request (optional: log to monitoring)
        }
    });
    next();
});

// 헬스체크
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// FastAPI 헬스체크
app.get('/api/health/fastapi', async (req, res) => {
    const fastApiUrl = process.env.API_URL;

    if (!fastApiUrl) {
        return res.status(500).json({
            status: 'error',
            message: 'API_URL 환경 변수가 설정되지 않았습니다.',
        });
    }

    try {
        const axios = (await import('axios')).default;
        const response = await axios.get(`${fastApiUrl}/health`, {
            timeout: 5000,
        });

        res.status(200).json({
            status: 'ok',
            fastApiUrl,
            fastApiStatus: response.status,
            fastApiResponse: response.data,
        });
    } catch (error) {
        console.error('[FastAPI 헬스체크 실패]', error.message);
        res.status(503).json({
            status: 'error',
            message: 'FastAPI 서버에 연결할 수 없습니다.',
            error: error.message,
        });
    }
});

// 감사 로그 미들웨어 (라우트 등록 전)
app.use(auditLog);

// 팀 격리 미들웨어 (V2 캠페인 라우트에 team_code 컨텍스트 추가)
app.use(teamIsolation);

// 라우트 등록
app.use('/api/crawling', crawlingRoutes);
app.use('/api/influencer', influencerRoutes);
app.use('/api/contents', contentsRoutes);
app.use('/api', userRoutes);
app.use('/api/ai-plan', aiPlanRoutes);
app.use('/api/ai-image', aiImageRoutes);
app.use('/api/v2/campaigns', campaignRoutes);
app.use('/api/v2/campaigns/:id/pda', pdaRoutes);
app.use('/api/v2/campaigns/:id/strategy', strategyRoutes);
app.use('/api/v2/campaigns/:id/calendar', calendarRoutes);
app.use('/api/v2/campaigns/:id/creatives', creativeRoutes);
app.use('/api/v2/campaigns/:id/influencers', campaignInfluencerRoutes);
app.use('/api/v2/campaigns/:id/outreach', outreachRoutes);
app.use('/api/v2/campaigns/:id/launch', launchRoutes);
app.use('/api/v2/campaigns/:id/monitor', monitorRoutes);
app.use('/api/v2/campaigns/:id/audit', auditRoutes);
app.use('/api/v2/campaigns/:id/narrative-arc', narrativeArcRoutes);
app.use('/api/v2/campaigns/:id/alignment', alignmentRoutes);
app.use('/api/v2/campaigns/:id/hook-bank', hookBankRoutes);
app.use('/api/v2/campaigns/:id/channel-setup', channelSetupRoutes);
app.use('/api/v2/campaigns/:id/drops', dropCoordinationRoutes);
app.use('/api/v2/campaigns/:id/signals', earlySignalRoutes);
app.use('/api/v2/campaigns/:id/optimization', optimizationRoutes);
app.use('/api/v2/campaigns/:id/ugc-flywheel', ugcFlywheelRoutes);
app.use('/api/v2/notifications', notificationRoutes);
app.use('/api/v2/templates', templateRoutes);
app.use('/api/v2/master-pda', masterPdaRoutes);
app.use('/api/v2/brand-dna', brandDnaRoutes);
app.use('/api/v2/tts', typecastRoutes);
app.use('/api/v2/video', videoRoutes);

app.get('/api/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), IMAGE_PATH, filename);
    res.sendFile(imagePath);
});

// Sentry error handler (must be before other error middleware)
setupSentryErrorHandler(app);

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error('[서버 에러]', {
        error: err.message,
        path: req.path,
        method: req.method,
    });

    res.status(err.status || 500).json({
        error: err.message || '서버 오류가 발생했습니다.',
    });
});

// 서버 시작 (Socket.IO 연결을 위해 http.createServer 사용)
const server = http.createServer(app);
initSocketIO(server);

server.listen(PORT, async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    await testConnection();

    // 누락된 컬럼 자동 추가
    try {
        await pool.query('ALTER TABLE dw_creative ADD COLUMN IF NOT EXISTS production_guide JSONB');
        console.log('✅ dw_creative.production_guide 컬럼 확인 완료');
    } catch (e) {
        console.warn('⚠️ production_guide 컬럼 추가 실패 (이미 존재할 수 있음):', e.message);
    }

    // 메모리 모니터링
    setInterval(() => {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
        if (heapUsedMB > 800) {
            console.warn(`⚠️ 메모리 사용량 높음: ${heapUsedMB}MB`);
        }
    }, 30000);
});

// 타임아웃 설정
server.timeout = 900000; // 15분
server.keepAliveTimeout = 910000;
server.headersTimeout = 920000;

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM 신호 수신, 서버 종료 중...');
    server.close(() => {
        console.log('서버 종료 완료');
        process.exit(0);
    });
});
