import { pool } from '../config/database.js';
import { selectOutreach, selectOutreachById } from '../sql/outreach/selectQuery.js';
import { insertBulkOutreach } from '../sql/outreach/insertQuery.js';
import { updateOutreach as updateOutreachQuery, updateOutreachStatus } from '../sql/outreach/updateQuery.js';
import { sendEmail } from '../lib/mailer.js';

// 아웃리치 목록 조회
export const getOutreach = async (req, res) => {
    try {
        const { id: campaignId } = req.params;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        const sqlSet = selectOutreach(campaignId);
        const result = await pool.query(sqlSet.selectQuery, sqlSet.params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('[getOutreach]', error);
        res.status(500).json({ error: '아웃리치 목록 조회 중 오류가 발생했습니다.', details: error.message });
    }
};

// 아웃리치 브리프 생성 (MOCK AI)
export const generateOutreach = async (req, res) => {
    try {
        const { id: campaignId } = req.params;

        if (!campaignId) {
            return res.status(400).json({ error: 'campaign_id가 필요합니다.' });
        }

        // 1. 선정된/확정된 인플루언서 조회
        const influencerResult = await pool.query(
            `SELECT ci.*, i.username, i.platform, i.bio
             FROM dw_campaign_influencer ci
             LEFT JOIN mst_influencer i ON ci.profile_id = i.profile_id
             WHERE ci.campaign_id = $1
               AND ci.status IN ('selected', 'confirmed')`,
            [campaignId]
        );
        const influencers = influencerResult.rows;

        if (influencers.length === 0) {
            return res.status(400).json({ error: '선정된 인플루언서가 없습니다. 먼저 인플루언서를 선정해주세요.' });
        }

        // 2. 캠페인 정보 조회
        const campaignResult = await pool.query(
            'SELECT * FROM mst_campaign WHERE campaign_id = $1',
            [campaignId]
        );

        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });
        }

        const campaign = campaignResult.rows[0];
        const brandDna = campaign.brand_dna || {};

        // 3. 각 인플루언서에 대해 MOCK 브리프 생성
        const outreachItems = influencers.map((inf) => {
            const influencerName = inf.username || '인플루언서';
            const campaignName = campaign.campaign_name || '캠페인';
            const productName = campaign.product_name || '제품';
            const brandName = brandDna.brand_name || campaign.brand_cd || '브랜드';

            const briefContent = {
                subject: `[${campaignName}] 협업 제안`,
                body: `안녕하세요 ${influencerName}님,\n\n${brandName} ${productName} 캠페인에 참여 제안드립니다.\n\n저희는 ${influencerName}님의 콘텐츠 스타일과 팔로워 특성이 이번 캠페인의 목표 오디언스와 높은 일치도를 보인다고 판단하여 연락드리게 되었습니다.\n\n캠페인 개요:\n- 캠페인명: ${campaignName}\n- 제품: ${productName}\n- 기간: ${campaign.scheduled_start || 'TBD'} ~ ${campaign.scheduled_end || 'TBD'}\n\n자세한 내용은 첨부된 브리프를 참고해주시기 바랍니다.\n\n감사합니다.`,
                attachments: [],
                brand_guidelines: brandDna,
            };

            const emailDraft = {
                to: '',
                subject: `[${brandName}] ${campaignName} 협업 제안 - ${influencerName}님`,
                body_html: `<p>안녕하세요 ${influencerName}님,</p><p>${brandName} ${productName} 캠페인에 참여를 제안드립니다.</p><p>저희 브랜드와 ${influencerName}님의 콘텐츠가 잘 어울린다고 생각하여 연락드리게 되었습니다.</p><p>자세한 사항은 아래 브리프를 확인해주세요.</p><p>감사합니다.<br/>${brandName} 마케팅팀</p>`,
                status: 'draft',
            };

            return {
                profile_id: inf.profile_id,
                brief_content: briefContent,
                email_draft: emailDraft,
            };
        });

        // 4. 기존 아웃리치 삭제 후 새로 등록
        await pool.query(
            'DELETE FROM dw_outreach WHERE campaign_id = $1',
            [campaignId]
        );

        const sqlSet = insertBulkOutreach(campaignId, outreachItems);
        await pool.query(sqlSet.insertQuery, sqlSet.params);

        // 5. 생성된 아웃리치 목록 반환
        const resultSqlSet = selectOutreach(campaignId);
        const finalResult = await pool.query(resultSqlSet.selectQuery, resultSqlSet.params);

        res.status(201).json({
            success: true,
            message: '아웃리치 브리프가 생성되었습니다.',
            data: finalResult.rows,
            count: finalResult.rows.length,
        });
    } catch (error) {
        console.error('[generateOutreach]', error);
        res.status(500).json({ error: '아웃리치 생성 중 오류가 발생했습니다.', details: error.message });
    }
};

// 아웃리치 업데이트
export const updateOutreach = async (req, res) => {
    try {
        const { oId } = req.params;
        const data = req.body;

        if (!oId) {
            return res.status(400).json({ error: 'outreach_id가 필요합니다.' });
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: '업데이트할 필드가 필요합니다.' });
        }

        const sqlSet = updateOutreachQuery(oId, data);
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '아웃리치를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            message: '아웃리치가 업데이트되었습니다.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('[updateOutreach]', error);
        res.status(500).json({ error: '아웃리치 업데이트 중 오류가 발생했습니다.', details: error.message });
    }
};

// 아웃리치 발송 (MOCK)
export const sendOutreach = async (req, res) => {
    try {
        const { oId } = req.params;

        if (!oId) {
            return res.status(400).json({ error: 'outreach_id가 필요합니다.' });
        }

        // 아웃리치 존재 확인
        const checkSqlSet = selectOutreachById(oId);
        const checkResult = await pool.query(checkSqlSet.selectQuery, checkSqlSet.params);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: '아웃리치를 찾을 수 없습니다.' });
        }

        const outreach = checkResult.rows[0];

        if (outreach.status === 'sent') {
            return res.status(400).json({ error: '이미 발송된 아웃리치입니다.' });
        }

        // 실제 이메일 발송 (SMTP 미설정 시 MOCK)
        const emailDraft = outreach.email_draft || {};
        const emailTo = emailDraft.to || req.body.to;

        let sendResult = { mock: true };
        if (emailTo) {
            try {
                sendResult = await sendEmail({
                    to: emailTo,
                    subject: emailDraft.subject || outreach.brief_content?.subject || '협업 제안',
                    html: emailDraft.body_html || `<p>${outreach.brief_content?.body || ''}</p>`,
                });
            } catch (emailErr) {
                console.error('[sendOutreach] Email send failed:', emailErr.message);
                return res.status(500).json({
                    error: '이메일 발송에 실패했습니다.',
                    details: emailErr.message,
                });
            }
        }

        // 상태를 'sent'로 업데이트 + sent_at 설정
        const sqlSet = updateOutreachQuery(oId, { status: 'sent', sent_at: new Date().toISOString() });
        const result = await pool.query(sqlSet.updateQuery, sqlSet.params);

        res.json({
            success: true,
            message: sendResult.mock ? '아웃리치가 발송되었습니다. (MOCK - SMTP 미설정)' : '아웃리치가 발송되었습니다.',
            data: result.rows[0],
            emailResult: { messageId: sendResult.messageId, mock: !!sendResult.mock },
        });
    } catch (error) {
        console.error('[sendOutreach]', error);
        res.status(500).json({ error: '아웃리치 발송 중 오류가 발생했습니다.', details: error.message });
    }
};
