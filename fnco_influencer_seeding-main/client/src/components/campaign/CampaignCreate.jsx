import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, FileUp, Save, Check, ChevronsUpDown, Sparkles, Building2 } from 'lucide-react';
import { useCreateCampaign } from '@/hooks/useCampaign.js';
import { useSaveAsTemplate } from '@/hooks/useTemplates.js';
import { useBrandDnaList } from '@/hooks/useBrandDna.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover.jsx';
import CountrySelect from '@/components/CountrySelect.jsx';
import TemplateGallery from '@/components/campaign/TemplateGallery.jsx';
import { tokens } from '@/styles/designTokens.js';

const CATEGORY_MAP = {
  '클렌징': ['클렌징 밤', '클렌징 오일', '클렌징 젤', '클렌징 폼', '필링', '리무버', '클렌징패드', '클렌징 워터'],
  '스킨케어': ['스킨/토너', '에센스/앰플/세럼', '로션/크림', '미스트', '멀티밤', '립 케어', '마스크팩'],
  '베이스 메이크업': ['쿠션', '파운데이션', '컨실러', '프라이머', '톤업 크림', 'CC/BB', '팩트/파우더'],
  '립&페이스메이크업': ['립틴트', '립글로스', '립밤', '립스틱', '블러셔', '하이라이터', '쉐딩', '립오일', '립라이너'],
  '아이메이크업': ['아이섀도우', '아이라이너', '마스카라', '아이브로우/브로우카라'],
  '선케어': ['선크림', '선스틱', '선쿠션'],
  'ETC': ['그 외'],
};

const INITIAL_FORM = {
  campaign_name: '', brand_cd: '', category: '', subcategory: '',
  product_name: '', country: '', scheduled_start: '', scheduled_end: '',
  budget: '',
  brand_dna: { brand_name: '', mission: '', tone_of_voice: '', visual_style: '', key_messages: '' },
};


function SectionCard({ title, children, highlight, headerRight }) {
  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${highlight ? '#a78bfa' : tokens.color.border}`,
      background: tokens.color.surface,
      boxShadow: highlight ? '0 0 0 3px rgba(167,139,250,0.15)' : tokens.shadow.card,
      padding: 20,
      marginBottom: 16,
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>{title}</h2>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

function FieldGroup({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

const inputStyle = { height: 36, borderRadius: 8, borderColor: tokens.color.border, fontSize: 13 };
const textareaStyle = { borderRadius: 8, borderColor: tokens.color.border, fontSize: 13 };

export default function CampaignCreate() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const saveAsTemplate = useSaveAsTemplate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [productFile, setProductFile] = useState(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');

  // Saved brand DNA list from DB (Settings > Brand DNA)
  const { data: savedBrands = [] } = useBrandDnaList();

  // Build lookup map: brand_name → dna object
  const brandDnaMap = {};
  const brandList = savedBrands.map((b) => {
    brandDnaMap[b.brand_name] = b;
    return { name: b.brand_name };
  });

  // Brand combobox state
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [dnaAutoFilled, setDnaAutoFilled] = useState(false);
  const dnaRef = useRef(null);

  // Auto-dismiss DNA feedback after 5 seconds
  useEffect(() => {
    if (!dnaAutoFilled) return;
    const timer = setTimeout(() => setDnaAutoFilled(false), 5000);
    return () => clearTimeout(timer);
  }, [dnaAutoFilled]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === 'brand_cd') {
      const preset = brandDnaMap[value];
      if (preset) {
        setForm((p) => ({ ...p, brand_dna: { ...preset } }));
        setDnaAutoFilled(true);
        setTimeout(() => dnaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      } else {
        setForm((p) => ({ ...p, brand_dna: { ...INITIAL_FORM.brand_dna } }));
        setDnaAutoFilled(false);
      }
    }
  };
  const handleDnaChange = (field, value) => setForm((p) => ({ ...p, brand_dna: { ...p.brand_dna, [field]: value } }));

  const selectBrand = (brandName) => {
    handleChange('brand_cd', brandName);
    setBrandOpen(false);
    setBrandSearch('');
  };

  const handleSelectTemplate = (data) => {
    const newId = data?.campaign_id || data?.id;
    if (newId) navigate(`/campaigns/${newId}`);
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      await saveAsTemplate.mutateAsync({
        name: templateName,
        description: templateDescription,
        category: templateCategory || form.category || null,
        config: { brand_cd: form.brand_cd, category: form.category, subcategory: form.subcategory, product_name: form.product_name, country: form.country, brand_dna: form.brand_dna },
      });
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (productFile) {
        // 파일 포함 시 FormData로 전송
        const fd = new FormData();
        fd.append('campaign_name', form.campaign_name);
        fd.append('brand_cd', form.brand_cd);
        fd.append('category', form.category);
        fd.append('subcategory', form.subcategory);
        fd.append('product_name', form.product_name);
        fd.append('country', form.country);
        fd.append('scheduled_start', form.scheduled_start);
        fd.append('scheduled_end', form.scheduled_end);
        fd.append('budget', form.budget);
        fd.append('brand_dna', JSON.stringify(form.brand_dna));
        fd.append('productFile', productFile);
        result = await createCampaign.mutateAsync(fd);
      } else {
        result = await createCampaign.mutateAsync(form);
      }
      const newId = result.campaign_id || result._id;
      navigate(`/campaigns/${newId}/pda`);
    } catch {}
  };

  // Filter brands for combobox
  const filteredBrands = brandSearch
    ? brandList.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brandList;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.color.text }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>새 캠페인 만들기</h1>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 2 }}>캠페인 기본 정보를 입력합니다</p>
        </div>
      </div>

      {/* Template shortcut */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 12, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surfaceMuted, padding: '12px 16px', marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>템플릿에서 시작</p>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle }}>저장된 템플릿을 사용해 빠르게 캠페인을 생성합니다</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTemplateGallery(true)}
          style={{ height: 32, padding: '0 14px', borderRadius: 8, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, fontSize: 12, fontWeight: 600, color: tokens.color.text, cursor: 'pointer' }}
        >
          템플릿 선택
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <SectionCard title="기본 정보">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldGroup label="캠페인명" required>
              <Input required placeholder="캠페인 이름을 입력하세요" value={form.campaign_name} onChange={(e) => handleChange('campaign_name', e.target.value)} style={inputStyle} />
            </FieldGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Brand Combobox */}
              <FieldGroup label="브랜드명" required>
                <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={brandOpen}
                      style={{
                        height: 36, borderRadius: 8, fontSize: 13,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.surface,
                        padding: '0 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', textAlign: 'left',
                        color: form.brand_cd ? tokens.color.text : '#9ca3af',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        {form.brand_cd ? (
                          <>
                            <Building2 style={{ width: 14, height: 14, flexShrink: 0, color: brandDnaMap[form.brand_cd] ? '#7c3aed' : '#6b7280' }} />
                            <span style={{ color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {form.brand_cd}
                            </span>
                            {brandDnaMap[form.brand_cd] && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, background: '#ede9fe',
                                color: '#7c3aed', padding: '1px 6px', borderRadius: 8, flexShrink: 0,
                              }}>
                                DNA
                              </span>
                            )}
                          </>
                        ) : (
                          '브랜드를 선택하세요'
                        )}
                      </span>
                      <ChevronsUpDown style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    style={{ width: 300, padding: 0, borderRadius: 12, overflow: 'hidden' }}
                  >
                    {/* Search input */}
                    <div style={{ padding: '8px 8px 0' }}>
                      <input
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="브랜드 검색..."
                        autoFocus
                        style={{
                          width: '100%', padding: '7px 10px', fontSize: 13,
                          border: `1px solid ${tokens.color.border}`, borderRadius: 8,
                          outline: 'none', background: tokens.color.surface,
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>

                    {/* Brand list */}
                    <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 4px' }}>
                      {filteredBrands.length > 0 && (
                        <div style={{ padding: '4px 8px 6px', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>
                          등록 브랜드 (DNA 자동 완성)
                        </div>
                      )}
                      {filteredBrands.map((brand) => (
                        <button
                          key={brand.name}
                          type="button"
                          onClick={() => selectBrand(brand.name)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            border: 'none', background: form.brand_cd === brand.name ? '#f3f0ff' : 'transparent',
                            cursor: 'pointer', fontSize: 13, textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { if (form.brand_cd !== brand.name) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={(e) => { if (form.brand_cd !== brand.name) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Building2 style={{ width: 16, height: 16, color: '#7c3aed', flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: tokens.color.text }}>{brand.name}</span>
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, background: '#d1fae5',
                            color: '#065f46', padding: '2px 7px', borderRadius: 8,
                          }}>
                            DNA
                          </span>
                          {form.brand_cd === brand.name && (
                            <Check style={{ width: 14, height: 14, color: '#7c3aed' }} />
                          )}
                        </button>
                      ))}

                      {/* Custom brand entry */}
                      {brandSearch && !brandDnaMap[brandSearch] && (
                        <>
                          <div style={{ height: 1, background: '#e5e7eb', margin: '4px 8px' }} />
                          <button
                            type="button"
                            onClick={() => selectBrand(brandSearch)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '8px 10px', borderRadius: 8,
                              border: 'none', background: 'transparent',
                              cursor: 'pointer', fontSize: 13, textAlign: 'left',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ color: '#6b7280' }}>
                              &ldquo;{brandSearch}&rdquo; 직접 입력
                            </span>
                          </button>
                        </>
                      )}

                      {filteredBrands.length === 0 && !brandSearch && (
                        <div style={{ padding: '16px 10px', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
                          등록된 브랜드가 없습니다. 설정 &gt; 브랜드 DNA에서 추가하세요.
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Hidden input for form validation */}
                <input type="hidden" required value={form.brand_cd} />
              </FieldGroup>
              <FieldGroup label="제품명">
                <Input placeholder="제품명을 입력하세요" value={form.product_name} onChange={(e) => handleChange('product_name', e.target.value)} style={inputStyle} />
              </FieldGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldGroup label="카테고리">
                <Select value={form.category} onValueChange={(val) => { handleChange('category', val); handleChange('subcategory', ''); }}>
                  <SelectTrigger style={inputStyle}><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CATEGORY_MAP).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="서브카테고리">
                <Select value={form.subcategory} onValueChange={(val) => handleChange('subcategory', val)} disabled={!form.category}>
                  <SelectTrigger style={{ ...inputStyle, opacity: form.category ? 1 : 0.5 }}><SelectValue placeholder="서브카테고리 선택" /></SelectTrigger>
                  <SelectContent>
                    {(CATEGORY_MAP[form.category] || []).map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldGroup label="국가">
                <CountrySelect value={form.country} onChange={(val) => handleChange('country', val?.value || '')} />
              </FieldGroup>
              <FieldGroup label="예산">
                <Input type="text" placeholder="예: 50,000,000" value={form.budget} onChange={(e) => handleChange('budget', e.target.value)} style={inputStyle} />
              </FieldGroup>
            </div>
            <FieldGroup label="제품 파일 (선택)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => document.getElementById('product-file-input').click()}
                  style={{ height: 32, padding: '0 12px', borderRadius: 8, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, fontSize: 12, fontWeight: 600, color: tokens.color.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <FileUp style={{ width: 14, height: 14 }} /> 파일 선택
                </button>
                {productFile && <span style={{ fontSize: 12, color: tokens.color.textSubtle }}>{productFile.name}</span>}
                <input id="product-file-input" type="file" accept="image/*,.pdf,.ppt,.pptx" style={{ display: 'none' }} onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
              </div>
              <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginTop: 2 }}>제품 이미지, PDF, PPT 파일을 업로드하면 AI 분석에 활용됩니다</p>
            </FieldGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldGroup label="시작일"><Input type="date" value={form.scheduled_start} onChange={(e) => handleChange('scheduled_start', e.target.value)} style={inputStyle} /></FieldGroup>
              <FieldGroup label="종료일"><Input type="date" value={form.scheduled_end} onChange={(e) => handleChange('scheduled_end', e.target.value)} style={inputStyle} /></FieldGroup>
            </div>
          </div>
        </SectionCard>

        {/* Brand DNA */}
        <div ref={dnaRef}>
          <SectionCard title="브랜드 DNA" highlight={dnaAutoFilled}>
            {/* Auto-fill feedback banner */}
            {dnaAutoFilled && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 16, borderRadius: 10,
                background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)',
                border: '1px solid #c4b5fd',
                animation: 'fadeInSlide 0.4s ease-out',
              }}>
                <Sparkles style={{ width: 16, height: 16, color: '#7c3aed', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>
                  {form.brand_cd} 브랜드 DNA가 자동으로 채워졌습니다
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FieldGroup label="브랜드명"><Input placeholder="브랜드명을 입력하세요 (예: 바닐라코)" value={form.brand_dna.brand_name} onChange={(e) => handleDnaChange('brand_name', e.target.value)} style={inputStyle} /></FieldGroup>
              <FieldGroup label="미션"><Textarea placeholder="브랜드 미션을 입력하세요" value={form.brand_dna.mission} onChange={(e) => handleDnaChange('mission', e.target.value)} rows={3} style={textareaStyle} /></FieldGroup>
              <FieldGroup label="톤 앤 매너"><Textarea placeholder="브랜드 톤 앤 매너를 설명하세요" value={form.brand_dna.tone_of_voice} onChange={(e) => handleDnaChange('tone_of_voice', e.target.value)} rows={3} style={textareaStyle} /></FieldGroup>
              <FieldGroup label="비주얼 스타일"><Textarea placeholder="비주얼 스타일 가이드를 설명하세요" value={form.brand_dna.visual_style} onChange={(e) => handleDnaChange('visual_style', e.target.value)} rows={3} style={textareaStyle} /></FieldGroup>
              <FieldGroup label="핵심 메시지"><Textarea placeholder="핵심 전달 메시지를 입력하세요" value={form.brand_dna.key_messages} onChange={(e) => handleDnaChange('key_messages', e.target.value)} rows={3} style={textareaStyle} /></FieldGroup>
            </div>
          </SectionCard>
        </div>

        {/* Actions */}
        <div style={{ borderTop: `1px solid ${tokens.color.border}`, paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => setShowSaveTemplate(true)} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: tokens.color.textSubtle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save style={{ width: 13, height: 13 }} /> 현재 설정을 템플릿으로 저장
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => navigate('/campaigns')} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, fontSize: 13, fontWeight: 600, color: tokens.color.text, cursor: 'pointer' }}>취소</button>
            <button type="submit" disabled={createCampaign.isPending} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: tokens.color.text, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createCampaign.isPending ? 0.6 : 1 }}>
              {createCampaign.isPending ? '생성 중...' : '캠페인 생성'}
            </button>
          </div>
        </div>

        {createCampaign.isError && (
          <p style={{ fontSize: 12, color: tokens.color.danger, textAlign: 'center', marginTop: 10 }}>
            오류: {createCampaign.error?.message || '캠페인 생성에 실패했습니다'}
          </p>
        )}
      </form>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Template Gallery Dialog */}
      <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
        <DialogContent style={{ maxWidth: '56rem', maxHeight: '80vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>캠페인 템플릿</DialogTitle>
            <DialogDescription>템플릿을 선택하여 캠페인을 생성합니다</DialogDescription>
          </DialogHeader>
          <TemplateGallery onSelectTemplate={handleSelectTemplate} onClose={() => setShowTemplateGallery(false)} />
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent style={{ maxWidth: '28rem' }}>
          <DialogHeader>
            <DialogTitle>템플릿으로 저장</DialogTitle>
            <DialogDescription>현재 캠페인 설정을 템플릿으로 저장합니다</DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldGroup label="템플릿 이름" required><Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="템플릿 이름을 입력하세요" style={inputStyle} /></FieldGroup>
            <FieldGroup label="설명"><Input value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="템플릿 설명 (선택사항)" style={inputStyle} /></FieldGroup>
            <FieldGroup label="카테고리"><Input value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} placeholder="예: 뷰티, 패션, 식품" style={inputStyle} /></FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>취소</Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim() || saveAsTemplate.isPending}>
              <Save className="h-4 w-4 mr-1" />{saveAsTemplate.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
          {saveAsTemplate.isError && <p style={{ fontSize: 12, color: tokens.color.danger, textAlign: 'center' }}>오류: {saveAsTemplate.error?.message || '저장에 실패했습니다'}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
