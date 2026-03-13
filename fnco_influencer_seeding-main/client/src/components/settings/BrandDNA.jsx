import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Dna, Save, Plus, Trash2, Building2, Check } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import { useBrandDnaList, useCreateBrandDna, useUpdateBrandDna, useDeleteBrandDna } from '@/hooks/useBrandDna.js';

const EMPTY_DNA = { brand_name: '', mission: '', tone_of_voice: '', visual_style: '', key_messages: '' };

function FieldGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { height: 36, borderRadius: 8, borderColor: tokens.color.border, fontSize: 13 };
const textareaStyle = { borderRadius: 8, borderColor: tokens.color.border, fontSize: 13 };

export default function BrandDNA() {
  const { data: list = [], isLoading } = useBrandDnaList();
  const createMutation = useCreateBrandDna();
  const updateMutation = useUpdateBrandDna();
  const deleteMutation = useDeleteBrandDna();

  const [selectedId, setSelectedId] = useState(null);
  const [dna, setDna] = useState({ ...EMPTY_DNA });
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 최초 로드 시 1회만 첫 항목 자동 선택
  useEffect(() => {
    if (!initialized && !isLoading && list.length > 0) {
      setSelectedId(list[0].brand_dna_id);
      setDna({
        brand_name: list[0].brand_name || '',
        mission: list[0].mission || '',
        tone_of_voice: list[0].tone_of_voice || '',
        visual_style: list[0].visual_style || '',
        key_messages: list[0].key_messages || '',
      });
      setInitialized(true);
    }
    if (!initialized && !isLoading && list.length === 0) {
      setInitialized(true);
    }
  }, [list, isLoading, initialized]);

  const handleChange = (field, value) => {
    setDna((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSelect = (item) => {
    setSelectedId(item.brand_dna_id);
    setDna({
      brand_name: item.brand_name || '',
      mission: item.mission || '',
      tone_of_voice: item.tone_of_voice || '',
      visual_style: item.visual_style || '',
      key_messages: item.key_messages || '',
    });
    setSaved(false);
  };

  const handleNew = () => {
    setSelectedId(null);
    setDna({ ...EMPTY_DNA });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!dna.brand_name.trim()) return;
    try {
      if (selectedId) {
        await updateMutation.mutateAsync({ id: selectedId, ...dna });
      } else {
        const result = await createMutation.mutateAsync(dna);
        if (result?.brand_dna_id) setSelectedId(result.brand_dna_id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[BrandDNA] 저장 실패:', err);
    }
  };

  const handleDelete = async (item, e) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(item.brand_dna_id);
      if (selectedId === item.brand_dna_id) {
        setSelectedId(null);
        setDna({ ...EMPTY_DNA });
      }
    } catch (err) {
      console.error('[BrandDNA] 삭제 실패:', err);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* ── Saved brand list ── */}
      <div style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dna style={{ width: 15, height: 15, color: tokens.color.textSubtle }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>저장된 브랜드</span>
            {list.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>
                {list.length}개
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
              color: tokens.color.text, cursor: 'pointer',
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            새 브랜드
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: tokens.color.textSubtle, fontSize: 13 }}>
            로딩 중...
          </div>
        ) : list.length === 0 ? (
          <div style={{
            padding: '24px 16px', borderRadius: 10,
            border: `2px dashed ${tokens.color.border}`,
            textAlign: 'center', color: tokens.color.textSubtle, fontSize: 13,
          }}>
            저장된 브랜드가 없습니다. 아래에서 브랜드 DNA를 작성하고 저장하세요.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {list.map((item) => {
              const isActive = selectedId === item.brand_dna_id;
              return (
                <div
                  key={item.brand_dna_id}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: isActive ? '2px solid #7c3aed' : `1px solid ${tokens.color.border}`,
                    background: isActive ? '#f5f3ff' : '#fff',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: isActive ? '#7c3aed' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isActive
                        ? <Check style={{ width: 14, height: 14, color: '#fff' }} />
                        : <Building2 style={{ width: 14, height: 14, color: '#94a3b8' }} />}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{
                        fontSize: 13, fontWeight: 700, margin: 0,
                        color: isActive ? '#7c3aed' : tokens.color.text,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.brand_name || '이름 없음'}
                      </p>
                      <p style={{
                        fontSize: 10, color: tokens.color.textSubtle, margin: 0,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.mission?.split('\n')[0]?.slice(0, 30) || '미션 미입력'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item, e)}
                    disabled={deleteMutation.isPending}
                    style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      border: 'none', background: 'transparent',
                      color: '#94a3b8', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Editor form ── */}
      <div style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Dna style={{ width: 15, height: 15, color: tokens.color.textSubtle }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>
            {selectedId ? '브랜드 DNA 편집' : '새 브랜드 DNA 작성'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginBottom: 18 }}>
          브랜드의 핵심 정체성을 정의합니다. AI 생성에 활용됩니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FieldGroup label="브랜드명">
            <Input
              value={dna.brand_name}
              onChange={(e) => handleChange('brand_name', e.target.value)}
              placeholder="브랜드명을 입력하세요 (예: 바닐라코)"
              style={inputStyle}
            />
          </FieldGroup>
          <FieldGroup label="미션">
            <Textarea
              value={dna.mission}
              onChange={(e) => handleChange('mission', e.target.value)}
              placeholder="브랜드 미션을 입력하세요"
              rows={3}
              style={textareaStyle}
            />
          </FieldGroup>
          <FieldGroup label="톤 앤 매너">
            <Textarea
              value={dna.tone_of_voice}
              onChange={(e) => handleChange('tone_of_voice', e.target.value)}
              placeholder="브랜드 톤 앤 매너를 설명하세요"
              rows={3}
              style={textareaStyle}
            />
          </FieldGroup>
          <FieldGroup label="비주얼 스타일">
            <Textarea
              value={dna.visual_style}
              onChange={(e) => handleChange('visual_style', e.target.value)}
              placeholder="비주얼 스타일 가이드를 설명하세요"
              rows={3}
              style={textareaStyle}
            />
          </FieldGroup>
          <FieldGroup label="핵심 메시지">
            <Textarea
              value={dna.key_messages}
              onChange={(e) => handleChange('key_messages', e.target.value)}
              placeholder="핵심 전달 메시지를 입력하세요"
              rows={3}
              style={textareaStyle}
            />
          </FieldGroup>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        {saved && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
            저장되었습니다
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dna.brand_name.trim() || isSaving}
          style={{
            height: 36, padding: '0 18px', borderRadius: 8,
            border: 'none', background: dna.brand_name.trim() && !isSaving ? tokens.color.text : '#d1d5db',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: dna.brand_name.trim() && !isSaving ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Save style={{ width: 14, height: 14 }} />
          {isSaving ? '저장 중...' : selectedId ? '수정 저장' : '새 브랜드 저장'}
        </button>
      </div>
    </div>
  );
}
