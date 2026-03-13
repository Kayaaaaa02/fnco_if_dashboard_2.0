import { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks.js';
import { Button } from '../../ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.jsx';
import { Input } from '../../ui/input.jsx';
import { Textarea } from '../../ui/textarea.jsx';
import { ArrowRight, Plus, Upload, X, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { Toast } from '../modify/Toast.jsx';
import { useTranslation, useLanguage } from '../../../hooks/useTranslation.js';
import { AnalysisLoadingDialog } from '../AnalysisLoadingDialog.jsx';

// 헤더/대시보드 언어 선택(한국어·영어·中文)과 동일한 값 → FastAPI target_lang (한국 선택 시 번역 스킵)
const LANGUAGE_TO_TARGET_LANG = { ko: 'ko', en: 'eng', zh: 'cn' };

export function UploadForm({ onNavigate, onSetPendingUploadData }) {
    const t = useTranslation();
    const currentLanguage = useLanguage(); // 'ko' | 'en' | 'zh' (LanguageRegionSelect와 동일한 Redux i18n.language)
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [toast, setToast] = useState({
        isVisible: false,
        message: '',
        type: 'info',
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // Redux에서 userState 가져오기
    const userState = useAppSelector((state) => state.user);

    // 카테고리별 서브카테고리 매핑 (value는 한국어 키 유지, 표시는 번역)
    const subCategories = {
        클렌징: ['클렌징 밤', '클렌징 오일', '클렌징 젤', '클렌징 폼', '필링', '리무버'],
        스킨케어: ['스킨/토너', '에센스/앰플/세럼', '로션/크림', '미스트', '멀티', '립 케어', '마스크팩'],
        '베이스 메이크업': ['쿠션', '파운데이션', '컨실러', '프라이머', '톤업 크림', 'CC/BB', '팩트/파우더'],
        '립&페이스메이크업': ['립틴트', '립글로스', '립밤', '립스틱', '블러셔', '하이라이터', '쉐딩'],
        아이메이크업: ['아이섀도우', '아이라이너', '마스카라', '아이브로우/브로우카라'],
        선케어: ['선크림', '선스틱', '선쿠션'],
        ETC: ['그 외'],
    };

    // 서브카테고리 한국어 키를 번역 키로 매핑
    const subCategoryTranslationKeys = {
        '클렌징 밤': 'cleansingBalm',
        '클렌징 오일': 'cleansingOil',
        '클렌징 젤': 'cleansingGel',
        '클렌징 폼': 'cleansingFoam',
        필링: 'peeling',
        리무버: 'remover',
        '스킨/토너': 'skinToner',
        '에센스/앰플/세럼': 'essenceAmpouleSerum',
        '로션/크림': 'lotionCream',
        미스트: 'mist',
        멀티: 'multi',
        '립 케어': 'lipCare',
        마스크팩: 'maskPack',
        쿠션: 'cushion',
        파운데이션: 'foundation',
        컨실러: 'concealer',
        프라이머: 'primer',
        '톤업 크림': 'toneupCream',
        'CC/BB': 'ccBb',
        '팩트/파우더': 'pactPowder',
        립틴트: 'lipTint',
        립글로스: 'lipGloss',
        립밤: 'lipBalm',
        립스틱: 'lipstick',
        블러셔: 'blusher',
        하이라이터: 'highlighter',
        쉐딩: 'shading',
        아이섀도우: 'eyeshadow',
        아이라이너: 'eyeliner',
        마스카라: 'mascara',
        '아이브로우/브로우카라': 'eyebrowBrowcara',
        선크림: 'sunscreen',
        선스틱: 'sunStick',
        선쿠션: 'sunCushion',
        '그 외': 'others',
    };

    // Form 데이터 상태
    const [formData, setFormData] = useState({
        country: '',
        brand: '',
        category: '',
        subcategory: '',
        productName: '',
        marketingKeywords: '',
        promotionContent: '',
    });

    const fileInputRef = useRef(null);
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    // 컴포넌트 마운트 시 localStorage 정리 (새 분석 시작)
    useEffect(() => {
        const oldPlanDocId = localStorage.getItem('current_plan_doc_id');
        if (oldPlanDocId) {
            localStorage.removeItem('current_plan_doc_id');
            localStorage.removeItem(`product_analysis_saved_${oldPlanDocId}`);
            localStorage.removeItem('current_plan_category');
        }
    }, []);

    const navigateToPage = (page) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    // Toast 표시 함수
    const showToast = (message, type = 'info') => {
        setToast({
            isVisible: true,
            message,
            type,
        });
    };

    // Toast 닫기 함수
    const hideToast = () => {
        setToast((prev) => ({ ...prev, isVisible: false }));
    };

    // 파일 선택 핸들러
    const handleFileSelect = (file) => {
        if (!file) return;

        // 파일 타입 검증 (Mac에서 MIME 타입이 다를 수 있으므로 확장자 기반으로 우선 검증)
        const allowedExtensions = ['.pdf', '.ppt', '.pptx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        // 확장자 검증 (Mac에서 파일 타입이 빈 문자열이거나 다를 수 있음)
        if (!allowedExtensions.includes(fileExtension)) {
            setUploadError(t('aiPlan.uploadForm.errors.invalidFileType'));
            return;
        }

        // MIME 타입 검증 (확장자가 맞으면 MIME 타입은 선택적 검증)
        const allowedTypes = [
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '', // Mac에서 빈 문자열일 수 있음
        ];

        // MIME 타입이 있고, 허용된 타입이 아니면 경고만 (확장자는 이미 통과)
        if (file.type && !allowedTypes.includes(file.type)) {
            console.warn('파일 MIME 타입이 예상과 다릅니다:', file.type, '확장자:', fileExtension);
            // Mac에서 MIME 타입이 다를 수 있으므로 확장자만으로도 허용
        }

        // 파일 크기 검증 (200MB)
        if (file.size > 200 * 1024 * 1024) {
            setUploadError(t('aiPlan.uploadForm.errors.fileTooLarge'));
            return;
        }

        setSelectedFile(file);
        setUploadError(null);
    };

    // 다음 단계로 이동 (Toast 표시 후 API 호출, 응답 받은 후 페이지 이동)
    // 다음 단계로 이동 (Toast 표시 후 API 호출, 응답 받은 후 페이지 이동)
    const handleNextStep = async () => {
        if (!selectedFile) {
            setUploadError(t('aiPlan.uploadForm.errors.selectFile'));
            return;
        }

        // 필수 필드 검증
        if (
            !formData.country ||
            !formData.brand ||
            !formData.category ||
            !formData.subcategory ||
            !formData.productName
        ) {
            setUploadError(t('aiPlan.uploadForm.errors.requiredFields'));
            return;
        }

        // API URL 검증
        if (!apiBase || apiBase === 'undefined') {
            setUploadError(t('aiPlan.uploadForm.errors.apiUrlNotSet'));
            return;
        }

        // user_nm 생성
        const userNm =
            userState.name && userState.name_eng
                ? `${userState.name}(${
                      userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
                  })`
                : userState.name || null;

        // API 호출 시작
        setIsProcessing(true);

        const requestId = `REQ_${Date.now()}`;

        try {
            // ⭐ 순차적 시도: 실패하면 다음 시도 진행, 진행 중이면 다음 시도 시작하지 않음
            const uploadAttempt = async (attemptNumber) => {
                const formDataToSend = new FormData();
                formDataToSend.append('file', selectedFile);
                formDataToSend.append('original_filename', selectedFile.name);
                formDataToSend.append('country', formData.country);
                formDataToSend.append('brand', formData.brand);
                formDataToSend.append('category', formData.category);
                formDataToSend.append('subcategory', formData.subcategory);
                formDataToSend.append('productName', formData.productName);
                formDataToSend.append('marketingKeywords', formData.marketingKeywords || '');
                formDataToSend.append('promotionContent', formData.promotionContent || '');
                formDataToSend.append('attempt', attemptNumber.toString());
                formDataToSend.append('timestamp', Date.now().toString());
                const targetLang = LANGUAGE_TO_TARGET_LANG[currentLanguage] ?? 'ko';
                formDataToSend.append('target_lang', targetLang);
                if (userNm) {
                    formDataToSend.append('user_nm', userNm);
                }

                const response = await fetch(`${apiBase}/ai-plan/upload`, {
                    method: 'POST',
                    body: formDataToSend,
                });

                if (!response.ok) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: t('aiPlan.uploadForm.errors.uploadFailed') }));
                    throw new Error(errorData.error || t('aiPlan.uploadForm.errors.uploadFailed'));
                }

                const result = await response.json();
                return result;
            };

            let result = null;
            let hasSuccess = false;
            const maxAttempts = 8;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    result = await uploadAttempt(attempt);
                    hasSuccess = true;
                    break; // 성공하면 루프 종료
                } catch (error) {
                    // 마지막 시도가 아니면 다음 시도 진행
                    if (attempt < maxAttempts) {
                        // 다음 시도 전 짧은 대기 (선택사항)
                        await new Promise((resolve) => setTimeout(resolve, 500));
                    } else {
                        // 모든 시도 실패
                        throw error;
                    }
                }
            }

            // 성공 처리
            if (hasSuccess && result && result.success && result.data) {
                const uploadData = {
                    country: formData.country,
                    brand: formData.brand,
                    category: formData.category,
                    subcategory: formData.subcategory,
                    productName: formData.productName,
                    marketingKeywords: formData.marketingKeywords || '',
                    promotionContent: formData.promotionContent || '',
                    user_nm: userNm,
                    file: selectedFile,
                };

                const parsedData = {
                    productName: formData.productName,
                    subcategory: formData.subcategory,
                    ...result.data,
                };

                if (onSetPendingUploadData) {
                    onSetPendingUploadData({ ...uploadData, parsedData });
                }

                hideToast();
                navigateToPage('ProductAnalysis');
                // 페이지 전환 시 상단으로 스크롤 (약간의 지연을 두어 페이지 전환 후 실행)
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            } else {
                throw new Error(t('aiPlan.uploadForm.errors.uploadFailed'));
            }
        } catch (error) {
            hideToast();

            let errorMessage = t('aiPlan.uploadForm.errors.uploadFailed');

            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                if (isMac) {
                    errorMessage = t('aiPlan.uploadForm.errors.uploadFailed');
                } else {
                    errorMessage = t('aiPlan.uploadForm.errors.networkError');
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            showToast(errorMessage, 'error');
            setUploadError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    // 드래그 앤 드롭 핸들러
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // 파일 제거 핸들러
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 다시 업로드 핸들러
    const handleReset = () => {
        setSelectedFile(null);
        setUploadError(null);
        setFormData({
            country: '',
            brand: '',
            category: '',
            subcategory: '',
            productName: '',
            marketingKeywords: '',
            promotionContent: '',
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold mb-2 text-center flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" style={{ color: '#B9A8FF' }} />
                {t('aiPlan.uploadForm.title')}
            </h2>
            <p className="text-gray-600 mb-6 text-center" style={{ marginBottom: '14px', color: '#6b7280' }}>
                {t('aiPlan.uploadForm.description')
                    .split('\n')
                    .map((line, i, arr) => (
                        <span key={i}>
                            {line}
                            {i < arr.length - 1 && <br />}
                        </span>
                    ))}
            </p>

            {/* File Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-12 mb-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging
                        ? 'border-[#B9A8FF] bg-[#F3F0FF]'
                        : selectedFile
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-[#B9A8FF]'
                }`}
                style={{
                    backgroundColor: isDragging ? '#F3F0FF' : selectedFile ? '#F0FDF4' : '#f9fafb',
                    minHeight: '300px',
                }}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
                {selectedFile ? (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                            style={{ backgroundColor: '#10B981' }}
                        >
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-700 font-medium mb-1">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#FFFFFF',
                                color: '#DC2626',
                                border: '2px solid #FEE2E2',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEF2F2';
                                e.currentTarget.style.borderColor = '#FECACA';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#FEE2E2';
                            }}
                        >
                            <X className="w-4 h-4" />
                            {t('aiPlan.uploadForm.removeFile')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: '#B9A8FF' }}
                        >
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-600 mb-2">{t('aiPlan.uploadForm.dragOrClick')}</p>
                        <p className="text-sm text-gray-500 mb-4" style={{ color: '#6b7280' }}>
                            {t('aiPlan.uploadForm.supportedFormats')}
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#FFFFFF',
                                color: '#7C3AED',
                                border: '2px solidrgb(196, 195, 199)',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(185, 168, 255, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(185, 168, 255, 0.4)';
                                e.currentTarget.style.borderColor = '#9F7AEA';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(185, 168, 255, 0.3)';
                                e.currentTarget.style.borderColor = '#B9A8FF';
                            }}
                        >
                            {t('aiPlan.uploadForm.selectFile')}
                        </button>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',

                                borderRadius: '8px',
                                padding: '12px 16px',
                                marginTop: '16px',
                                marginBottom: '16px',
                            }}
                        >
                            <AlertTriangle
                                size={20}
                                style={{
                                    color: '#D97706',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                }}
                            />
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#92400E',
                                    lineHeight: '1.5',
                                    margin: 0,
                                }}
                            >
                                <strong style={{ fontWeight: '600' }}>{t('aiPlan.uploadForm.warning.title')}:</strong>{' '}
                                {t('aiPlan.uploadForm.warning.message')}
                            </p>
                        </div>
                    </>
                )}
                <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            handleFileSelect(file);
                        }
                    }}
                />
                {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {uploadError}
                    </div>
                )}
            </div>

            {/* Input Fields */}
            <div className="space-y-4 mb-4" style={{ marginTop: '20px' }}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.country')}
                    </label>
                    <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                        <SelectTrigger className="border border-gray-300 bg-white" style={{ height: '48px' }}>
                            <SelectValue placeholder={t('aiPlan.uploadForm.placeholders.selectCountry')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="kr">{t('aiPlan.uploadForm.countries.korea')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.brand')}
                    </label>
                    <Select
                        value={formData.brand}
                        onValueChange={(value) => setFormData({ ...formData, brand: value })}
                    >
                        <SelectTrigger className="border border-gray-300 bg-white h-12" style={{ height: '48px' }}>
                            <SelectValue placeholder={t('aiPlan.uploadForm.placeholders.selectBrand')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="바닐라코">{t('aiPlan.uploadForm.brands.vanillaco')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.category')}
                    </label>
                    <Select
                        value={formData.category}
                        onValueChange={(value) => {
                            setFormData({ ...formData, category: value, subcategory: '' }); // 카테고리 변경 시 서브카테고리 초기화
                        }}
                    >
                        <SelectTrigger className="border border-gray-300 bg-white h-12" style={{ height: '48px' }}>
                            <SelectValue placeholder={t('aiPlan.uploadForm.placeholders.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="클렌징">{t('aiPlan.uploadForm.categories.cleansing')}</SelectItem>
                            <SelectItem value="스킨케어">{t('aiPlan.uploadForm.categories.skincare')}</SelectItem>
                            <SelectItem value="베이스 메이크업">
                                {t('aiPlan.uploadForm.categories.baseMakeup')}
                            </SelectItem>
                            <SelectItem value="립&페이스메이크업">
                                {t('aiPlan.uploadForm.categories.lipFaceMakeup')}
                            </SelectItem>
                            <SelectItem value="아이메이크업">{t('aiPlan.uploadForm.categories.eyeMakeup')}</SelectItem>
                            <SelectItem value="선케어">{t('aiPlan.uploadForm.categories.suncare')}</SelectItem>
                            <SelectItem value="ETC">{t('aiPlan.uploadForm.categories.etc')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.subcategory')}
                    </label>
                    <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                        disabled={!formData.category}
                    >
                        <SelectTrigger
                            className="border border-gray-300 bg-white h-12"
                            style={{ height: '48px' }}
                            disabled={!formData.category}
                        >
                            <SelectValue
                                placeholder={
                                    formData.category
                                        ? t('aiPlan.uploadForm.placeholders.selectSubcategory')
                                        : t('aiPlan.uploadForm.placeholders.selectCategoryFirst')
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {formData.category && subCategories[formData.category]
                                ? subCategories[formData.category].map((subCat) => {
                                      const translationKey = subCategoryTranslationKeys[subCat];
                                      return (
                                          <SelectItem key={subCat} value={subCat}>
                                              {translationKey
                                                  ? t(`aiPlan.uploadForm.subcategories.${translationKey}`)
                                                  : subCat}
                                          </SelectItem>
                                      );
                                  })
                                : null}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.productName')}
                    </label>
                    <Input
                        placeholder={t('aiPlan.uploadForm.placeholders.productName')}
                        className="border border-gray-300 bg-white h-12"
                        style={{ height: '48px' }}
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.marketingKeywords')}
                    </label>
                    <Input
                        placeholder={t('aiPlan.uploadForm.placeholders.marketingKeywords')}
                        className="border border-gray-300 bg-white h-12"
                        style={{ height: '48px' }}
                        value={formData.marketingKeywords}
                        onChange={(e) => setFormData({ ...formData, marketingKeywords: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('aiPlan.uploadForm.labels.promotionContent')}
                    </label>
                    <Textarea
                        placeholder={t('aiPlan.uploadForm.placeholders.promotionContent')}
                        rows={3}
                        className="resize-none border border-gray-300 bg-white py-3"
                        style={{ height: '120px' }}
                        value={formData.promotionContent}
                        onChange={(e) => setFormData({ ...formData, promotionContent: e.target.value })}
                    />
                </div>
                <div className="flex justify-between items-center mt-6 mb-8">
                    <button
                        onClick={handleReset}
                        disabled={isUploading}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#FFFFFF',
                            color: isUploading ? '#9CA3AF' : '#6B7280',
                            border: isUploading ? '2px solid #E5E7EB' : '2px solid #D1D5DB',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            opacity: isUploading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isUploading) {
                                e.currentTarget.style.borderColor = '#9CA3AF';
                                e.currentTarget.style.color = '#374151';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isUploading) {
                                e.currentTarget.style.borderColor = '#D1D5DB';
                                e.currentTarget.style.color = '#6B7280';
                            }
                        }}
                    >
                        {t('aiPlan.uploadForm.reset')}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNextStep}
                            disabled={
                                isProcessing ||
                                !selectedFile ||
                                !formData.country ||
                                !formData.brand ||
                                !formData.category ||
                                !formData.subcategory ||
                                !formData.productName
                            }
                            style={{
                                width: '100%',
                                padding: '12px 20px',
                                backgroundColor: '#FFFFFF',
                                color:
                                    isProcessing ||
                                    !selectedFile ||
                                    !formData.country ||
                                    !formData.brand ||
                                    !formData.category ||
                                    !formData.subcategory ||
                                    !formData.productName
                                        ? '#9CA3AF'
                                        : '#7C3AED',
                                border:
                                    isProcessing ||
                                    !selectedFile ||
                                    !formData.country ||
                                    !formData.brand ||
                                    !formData.category ||
                                    !formData.subcategory ||
                                    !formData.productName
                                        ? '2px solid #E5E7EB'
                                        : '2px solid #B9A8FF',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor:
                                    isProcessing ||
                                    !selectedFile ||
                                    !formData.country ||
                                    !formData.brand ||
                                    !formData.category ||
                                    !formData.subcategory ||
                                    !formData.productName
                                        ? 'not-allowed'
                                        : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                boxShadow:
                                    isProcessing ||
                                    !selectedFile ||
                                    !formData.country ||
                                    !formData.brand ||
                                    !formData.category ||
                                    !formData.subcategory ||
                                    !formData.productName
                                        ? 'none'
                                        : '0 2px 8px rgba(185, 168, 255, 0.3)',
                                opacity:
                                    isProcessing ||
                                    !selectedFile ||
                                    !formData.country ||
                                    !formData.brand ||
                                    !formData.category ||
                                    !formData.subcategory ||
                                    !formData.productName
                                        ? 0.6
                                        : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (
                                    !isProcessing &&
                                    selectedFile &&
                                    formData.country &&
                                    formData.brand &&
                                    formData.category &&
                                    formData.subcategory &&
                                    formData.productName
                                ) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(185, 168, 255, 0.4)';
                                    e.currentTarget.style.borderColor = '#9F7AEA';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (
                                    !isProcessing &&
                                    selectedFile &&
                                    formData.country &&
                                    formData.brand &&
                                    formData.category &&
                                    formData.subcategory &&
                                    formData.productName
                                ) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(185, 168, 255, 0.3)';
                                    e.currentTarget.style.borderColor = '#B9A8FF';
                                }
                            }}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t('aiPlan.uploadForm.analyzing')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('aiPlan.uploadForm.nextStep')}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
                duration={0}
            />

            {/* AI 제품 분석 진행 중 팝업 */}
            <AnalysisLoadingDialog
                open={isProcessing}
                title={t('aiPlan.uploadForm.analyzingProgress')}
                description={t('aiPlan.uploadForm.analyzingProgressDescription')}
            />
        </div>
    );
}
