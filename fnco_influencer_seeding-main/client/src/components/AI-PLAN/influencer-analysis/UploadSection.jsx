import { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '../../ui/button.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';
import { useAppSelector } from '../../../store/hooks.js';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog.jsx';

// URL 검증 및 플랫폼 추출 함수
function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return { valid: false, platform: null, error: 'Invalid URL format' };
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        return { valid: false, platform: null, error: 'Empty URL' };
    }

    // URL 형식 검증
    try {
        const urlObj = new URL(trimmedUrl);
        const hostname = urlObj.hostname.toLowerCase();

        // Instagram 검증
        if (hostname.includes('instagram.com')) {
            const path = urlObj.pathname;
            // 프로필 URL: /username, /username/, /username/reels/, /username/posts/ 등 하위 경로 포함
            const profileMatch = path.match(/^\/([^\/]+)(?:\/.*)?\/?$/);
            if (profileMatch) {
                const username = profileMatch[1];
                if (username && username.length > 0) {
                    const normalizedUrl = `https://www.instagram.com/${username}/`;
                    return { valid: true, platform: 'instagram', url: normalizedUrl };
                }
            }
            return { valid: false, platform: null, error: 'Invalid Instagram profile URL' };
        }

        // TikTok 검증
        if (hostname.includes('tiktok.com')) {
            const path = urlObj.pathname;
            // TikTok 프로필 URL 패턴: /@username
            if (path.match(/^\/@[^\/]+\/?$/)) {
                return { valid: true, platform: 'tiktok', url: trimmedUrl };
            }
            return { valid: false, platform: null, error: 'Invalid TikTok profile URL' };
        }

        // YouTube 검증
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            const path = urlObj.pathname;
            // YouTube 프로필 URL 패턴:
            // /@username, /@username/shorts, /@username/videos 등 (하위 경로 포함)
            // /c/channelname, /c/channelname/shorts 등
            // /user/username, /user/username/videos 등
            // /channel/channelid, /channel/channelid/videos 등
            if (
                path.match(/^\/@[^\/]+(\/.*)?$/) ||
                path.match(/^\/c\/[^\/]+(\/.*)?$/) ||
                path.match(/^\/user\/[^\/]+(\/.*)?$/) ||
                path.match(/^\/channel\/[^\/]+(\/.*)?$/)
            ) {
                return { valid: true, platform: 'youtube', url: trimmedUrl };
            }
            return { valid: false, platform: null, error: 'Invalid YouTube profile URL' };
        }

        return {
            valid: false,
            platform: null,
            error: 'Unsupported platform. Only Instagram, TikTok, and YouTube are supported.',
        };
    } catch (error) {
        return { valid: false, platform: null, error: 'Invalid URL format' };
    }
}

export function UploadSection({ user, onAnalysisStarted, onRefetchList }) {
    const t = useTranslation();
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [validatedUrls, setValidatedUrls] = useState([]);
    const [invalidUrls, setInvalidUrls] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const [showEngagementTooltip, setShowEngagementTooltip] = useState(false);
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    const userState = useAppSelector((state) => state.user);
    // 유저명 (서버/FastAPI에 전달)
    const userNm =
        userState?.name && userState?.name_eng
            ? `${userState.name}(${
                  userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
              })`
            : userState?.name || user?.name || null;

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 파일 형식 검증
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            setUploadError(t('aiPlan.influencerAnalysis.invalidFileType'));
            return;
        }

        setSelectedFile(file);
        setUploadError(null);
        setIsProcessing(true);
        setValidatedUrls([]);
        setInvalidUrls([]);

        try {
            // 엑셀 파일 읽기
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 헤더 행 찾기
            const headerRow = data[0] || [];
            const urlColumnIndex = headerRow.findIndex(
                (cell) => cell && cell.toString().toLowerCase().trim() === 'url'
            );

            if (urlColumnIndex === -1) {
                setUploadError(t('aiPlan.influencerAnalysis.urlColumnNotFound'));
                setIsProcessing(false);
                return;
            }

            // URL 추출 및 검증
            const validUrls = [];
            const invalidUrlsList = [];

            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const urlValue = row[urlColumnIndex];

                if (!urlValue) continue; // 빈 셀 건너뛰기

                const validation = validateUrl(urlValue.toString());
                if (validation.valid) {
                    validUrls.push({
                        url: validation.url,
                        platform: validation.platform,
                    });
                } else {
                    invalidUrlsList.push({
                        url: urlValue.toString(),
                        error: validation.error,
                        row: i + 1,
                    });
                }
            }

            setValidatedUrls(validUrls);
            setInvalidUrls(invalidUrlsList);

            if (validUrls.length === 0) {
                setUploadError(t('aiPlan.influencerAnalysis.noValidUrls'));
            }
        } catch (error) {
            console.error('File processing error:', error);
            setUploadError(t('aiPlan.influencerAnalysis.fileProcessingError'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartAnalysis = async () => {
        // 유효한 URL이 없으면 실행하지 않음
        if (validatedUrls.length === 0) {
            setUploadError(t('aiPlan.influencerAnalysis.noValidUrls'));
            return;
        }

        setIsAnalyzing(true);
        setUploadError(null);

        try {
            // 유효한 URL만 추출 (유효하지 않은 URL은 제외)
            const validProfileUrls = validatedUrls.map((item) => item.url);

            const response = await fetch(`${apiBase}/influencer/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profile_url: validProfileUrls,
                    user_nm: userNm,
                }),
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    // 응답 본문을 텍스트로 먼저 읽기 (한 번만 읽기)
                    const errorText = await response.text();
                    // JSON 형식인지 확인하고 파싱 시도
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error || errorData.details || errorMessage;
                    } catch (parseError) {
                        // JSON이 아니면 텍스트 그대로 사용
                        errorMessage = errorText || errorMessage;
                    }
                } catch (e) {
                    // 텍스트 읽기 실패 시 기본 메시지 사용
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            const urls = validatedUrls.map((item) => item.url);
            if (typeof onAnalysisStarted === 'function') {
                onAnalysisStarted(urls);
            }

            setSuccessCount(validatedUrls.length);
            // 수집 완료 창을 트리거로 list-by-urls SQL 조회 실행 후 다이얼로그 표시
            if (typeof onRefetchList === 'function') {
                onRefetchList(urls);
            }
            setShowSuccessDialog(true);
        } catch (error) {
            console.error('[인플루언서 분석] 에러:', error);
            setUploadError(error.message || t('aiPlan.influencerAnalysis.analysisError'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setValidatedUrls([]);
        setInvalidUrls([]);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCloseSuccessDialog = () => {
        if (typeof onRefetchList === 'function') onRefetchList();
        setShowSuccessDialog(false);
    };

    const handleDownloadTemplate = () => {
        // 예시 URL 데이터
        const exampleUrls = [
            { url: 'https://www.instagram.com/cocacola1shot/' },
            { url: 'https://www.youtube.com/@HIIZ.beauty/shorts' },
            { url: 'https://www.tiktok.com/@guilty_as_skin' },
        ];

        // 워크북 생성
        const workbook = XLSX.utils.book_new();

        // 워크시트 데이터 생성 (헤더 + 예시 데이터)
        const worksheetData = [
            ['url'], // 헤더
            ...exampleUrls.map((item) => [item.url]), // 데이터
        ];

        // 워크시트 생성
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // 컬럼 너비 설정
        worksheet['!cols'] = [{ wch: 50 }]; // url 컬럼 너비

        // 워크북에 워크시트 추가
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Influencer URLs');

        // 파일 다운로드
        XLSX.writeFile(workbook, 'influencer_url_template.xlsx');
    };

    return (
        <>
            <div
                className="mb-10"
                style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    padding: '17px',
                    marginBottom: '20px',
                }}
            >
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" style={{ color: '#B9A8FF' }} />
                            <h3
                                className="text-xl font-bold"
                                style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}
                            >
                                {t('aiPlan.influencerAnalysis.uploadTitle')}
                            </h3>
                        </div>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            style={{
                                fontSize: '14px',
                                height: '40px',
                                borderRadius: '10px',
                                fontWeight: '500',
                            }}
                            onClick={handleDownloadTemplate}
                        >
                            <Download className="w-4 h-4" />
                            {t('aiPlan.influencerAnalysis.downloadTemplate')}
                        </Button>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                        {t('aiPlan.influencerAnalysis.uploadDescriptionBefore')}
                        <span
                            style={{
                                position: 'relative',
                                textDecoration: 'underline',
                                textDecorationStyle: 'dotted',
                                cursor: 'help',
                                display: 'inline-block',
                            }}
                            onMouseEnter={() => setShowEngagementTooltip(true)}
                            onMouseLeave={() => setShowEngagementTooltip(false)}
                        >
                            {t('aiPlan.influencerAnalysis.engagement')}
                            {showEngagementTooltip && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        marginBottom: '8px',
                                        backgroundColor: '#374151',
                                        color: '#FFFFFF',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        whiteSpace: 'nowrap',
                                        zIndex: 1000,
                                        boxShadow:
                                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    }}
                                >
                                    {t('aiPlan.influencerAnalysis.engagementFormula')}
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '0',
                                            height: '0',
                                            borderLeft: '6px solid transparent',
                                            borderRight: '6px solid transparent',
                                            borderTop: '6px solid #374151',
                                        }}
                                    />
                                </span>
                            )}
                        </span>
                        {t('aiPlan.influencerAnalysis.uploadDescriptionAfter')}
                    </p>
                </div>

                {/* 파일 업로드 영역 */}
                {!selectedFile ? (
                    <div
                        className="border-2 border-dashed rounded-lg text-center transition-all"
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#D1D5DB',
                            padding: '48px 20px',
                            cursor: 'pointer',
                        }}
                        onClick={handleFileSelect}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#B9A8FF';
                            e.currentTarget.style.backgroundColor = '#F5F3FF';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#D1D5DB';
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        {isProcessing ? (
                            <>
                                <Loader2
                                    className="mx-auto mb-4 animate-spin"
                                    style={{ color: '#B9A8FF', width: '50px', height: '50px' }}
                                />
                                <p style={{ fontSize: '16px', color: '#374151' }}>
                                    {t('aiPlan.influencerAnalysis.processingFile')}
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload
                                    className="mx-auto mb-4"
                                    style={{ color: '#9CA3AF', width: '50px', height: '50px' }}
                                />
                                <p style={{ fontSize: '16px', color: '#374151', marginBottom: '4px' }}>
                                    {t('aiPlan.influencerAnalysis.uploadClick')}
                                </p>
                                <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                                    {t('aiPlan.influencerAnalysis.uploadFormats')}
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* 선택된 파일 표시 */}
                        <div
                            style={{
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#F9FAFB',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" style={{ color: '#B9A8FF' }} />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                        {selectedFile.name}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                                        {validatedUrls.length > 0
                                            ? t('aiPlan.influencerAnalysis.urlsValidated', {
                                                  count: validatedUrls.length,
                                              })
                                            : t('aiPlan.influencerAnalysis.fileSelected')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleRemoveFile} style={{ padding: '4px 8px' }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* 검증 결과 표시 */}
                        {validatedUrls.length > 0 && (
                            <div
                                style={{
                                    border: '1px solid #D1FAE5',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    backgroundColor: '#F0FDF4',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                                        {t('aiPlan.influencerAnalysis.totalUrlsUploaded', {
                                            count: validatedUrls.length,
                                        })}
                                    </p>
                                </div>

                                {/* 플랫폼별 통계 */}
                                <div className="flex gap-4 mb-4" style={{ fontSize: '14px', color: '#6B7280' }}>
                                    {['instagram', 'tiktok', 'youtube'].map((platform) => {
                                        const count = validatedUrls.filter((u) => u.platform === platform).length;
                                        if (count === 0) return null;
                                        return (
                                            <span key={platform}>
                                                {t(`aiPlan.influencerAnalysis.platform.${platform}`)}: {count}
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* 분석 시작 버튼 */}
                                <Button
                                    onClick={handleStartAnalysis}
                                    disabled={isAnalyzing}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#B9A8FF',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAnalyzing) {
                                            e.target.style.backgroundColor = '#A08FFF';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isAnalyzing) {
                                            e.target.style.backgroundColor = '#B9A8FF';
                                        }
                                    }}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('aiPlan.influencerAnalysis.startingAnalysis')}
                                        </>
                                    ) : (
                                        t('aiPlan.influencerAnalysis.startProfileDataCollection')
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* 유효하지 않은 URL 표시 */}
                        {invalidUrls.length > 0 && (
                            <div
                                style={{
                                    border: '1px solid #FEE2E2',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    backgroundColor: '#FEF2F2',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
                                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                        {t('aiPlan.influencerAnalysis.invalidUrls', { count: invalidUrls.length })}
                                    </p>
                                </div>
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {invalidUrls.slice(0, 10).map((item, index) => (
                                        <p
                                            key={index}
                                            style={{
                                                fontSize: '12px',
                                                color: '#6B7280',
                                                marginBottom: '4px',
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {t('aiPlan.influencerAnalysis.row')} {item.row}: {item.url} ({item.error})
                                        </p>
                                    ))}
                                    {invalidUrls.length > 10 && (
                                        <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
                                            {t('aiPlan.influencerAnalysis.moreInvalidUrls', {
                                                count: invalidUrls.length - 10,
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 에러 메시지 */}
                        {uploadError && (
                            <div
                                style={{
                                    border: '1px solid #FEE2E2',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    backgroundColor: '#FEF2F2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
                                <p style={{ fontSize: '14px', color: '#DC2626' }}>{uploadError}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 프로필 수집 완료 다이얼로그 (이 창 띄울 때 list-by-urls 조회 트리거) */}
            <Dialog
                open={showSuccessDialog}
                onOpenChange={(open) => {
                    if (!open) handleCloseSuccessDialog();
                }}
            >
                <DialogContent
                    className="sm:max-w-sm"
                    style={{
                        padding: '20px 18px',
                        borderRadius: '12px',
                        border: '1px solid #E9D5FF',
                        boxShadow: '0 12px 28px rgba(124, 58, 237, 0.1)',
                        maxWidth: '320px',
                    }}
                >
                    <DialogHeader style={{ alignItems: 'center', textAlign: 'center' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                backgroundColor: '#F5F3FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px',
                            }}
                        >
                            <CheckCircle className="w-6 h-6" style={{ color: '#7C3AED' }} />
                        </div>
                        <DialogTitle
                            style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#111827',
                                marginBottom: '6px',
                            }}
                        >
                            {t('aiPlan.influencerAnalysis.analysisStartedTitle') || '수집 완료'}
                        </DialogTitle>
                        <DialogDescription
                            style={{
                                fontSize: '13px',
                                color: '#6B7280',
                                lineHeight: '1.5',
                            }}
                        >
                            {t('aiPlan.influencerAnalysis.analysisStarted', { count: successCount })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter style={{ justifyContent: 'center', marginTop: '4px' }}>
                        <Button
                            onClick={handleCloseSuccessDialog}
                            style={{
                                minWidth: '96px',
                                padding: '8px 16px',
                                fontSize: '14px',
                                backgroundColor: '#7C3AED',
                                color: '#FFFFFF',
                                fontWeight: '600',
                                borderRadius: '8px',
                            }}
                        >
                            {t('aiPlan.influencerAnalysis.confirm') || '확인'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
