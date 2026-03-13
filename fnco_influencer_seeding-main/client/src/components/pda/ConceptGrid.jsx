import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LayoutGrid, Lightbulb, X, CheckSquare, Save, Loader2 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import ConceptCard from '@/components/pda/ConceptCard.jsx';

const FUNNEL_ORDER = ['TOFU', 'MOFU', 'BOFU'];
const FUNNEL_CONFIG = {
  TOFU: { label: 'TOFU', long: '인지 (TOFU)', color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
  MOFU: { label: 'MOFU', long: '고려 (MOFU)', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  BOFU: { label: 'BOFU', long: '전환 (BOFU)', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
};

function ChipGroup({ label, items, value, onChange }) {
  const chipBase = {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all .15s',
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, minWidth: 48 }}>
        {label}
      </span>
      {items.map((item) => {
        const isActive = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(isActive && item.value !== 'all' ? 'all' : item.value)}
            style={{
              ...chipBase,
              background: isActive ? (item.activeBg || tokens.color.text) : tokens.color.surfaceMuted,
              color: isActive ? (item.activeColor || '#fff') : tokens.color.textSubtle,
              border: isActive ? `1px solid ${item.activeBorder || tokens.color.text}` : `1px solid ${tokens.color.border}`,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ConceptGrid({ concepts = [], personas = [], desires = [], onConceptClick, onSaveConfirmed, isSaving, onToggleStatus }) {
  const [filterPersona, setFilterPersona] = useState('all');
  const [filterDesire, setFilterDesire] = useState('all');
  const [filterFunnel, setFilterFunnel] = useState('all');

  // status === 'confirmed' 인 컨셉을 초기 체크 상태로
  const [checkedIds, setCheckedIds] = useState(() => {
    const initial = new Set();
    concepts.forEach((c) => {
      if (c.status === 'confirmed') {
        initial.add(c.concept_id ?? c.id);
      }
    });
    return initial;
  });

  // concepts가 서버에서 새로 로드될 때 confirmed 상태 동기화
  const prevConceptIdsRef = useRef('');
  useEffect(() => {
    const key = concepts.map((c) => `${c.concept_id ?? c.id}:${c.status}`).join(',');
    if (key !== prevConceptIdsRef.current && concepts.length > 0) {
      prevConceptIdsRef.current = key;
      const confirmed = new Set();
      concepts.forEach((c) => {
        if (c.status === 'confirmed') {
          confirmed.add(c.concept_id ?? c.id);
        }
      });
      setCheckedIds(confirmed);
    }
  }, [concepts]);

  const toggleCheck = useCallback((id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      const willConfirm = !next.has(id);
      if (willConfirm) next.add(id);
      else next.delete(id);
      // DB에 상태 즉시 저장
      onToggleStatus?.([id], willConfirm ? 'confirmed' : 'draft');
      return next;
    });
  }, [onToggleStatus]);

  const checkedCount = checkedIds.size;
  const totalCount = concepts.length;

  const personaMap = useMemo(() => {
    const m = {};
    personas.forEach((p) => { if (p.code) m[p.code] = p.name; });
    return m;
  }, [personas]);

  const desireMap = useMemo(() => {
    const m = {};
    desires.forEach((d) => { if (d.code) m[d.code] = d.name; });
    return m;
  }, [desires]);

  const personaCodes = useMemo(
    () => [...new Set(concepts.map((c) => c.persona_code).filter(Boolean))].sort(),
    [concepts]
  );
  const desireCodes = useMemo(
    () => [...new Set(concepts.map((c) => c.desire_code).filter(Boolean))].sort(),
    [concepts]
  );

  const filtered = useMemo(() => {
    return concepts.filter((c) => {
      if (filterPersona !== 'all' && c.persona_code !== filterPersona) return false;
      if (filterDesire !== 'all' && c.desire_code !== filterDesire) return false;
      if (filterFunnel !== 'all' && c.funnel !== filterFunnel) return false;
      return true;
    });
  }, [concepts, filterPersona, filterDesire, filterFunnel]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const funnel of FUNNEL_ORDER) {
      groups[funnel] = filtered.filter((c) => (c.funnel || 'TOFU') === funnel);
    }
    return groups;
  }, [filtered]);

  const hasActiveFilters = filterPersona !== 'all' || filterDesire !== 'all' || filterFunnel !== 'all';

  const personaItems = [
    { value: 'all', label: '전체', activeBg: tokens.color.text, activeColor: '#fff', activeBorder: tokens.color.text },
    ...personaCodes.map((code) => ({
      value: code,
      label: code,
      activeBg: '#7c3aed',
      activeColor: '#fff',
      activeBorder: '#7c3aed',
    })),
  ];

  const desireItems = [
    { value: 'all', label: '전체', activeBg: tokens.color.text, activeColor: '#fff', activeBorder: tokens.color.text },
    ...desireCodes.map((code) => ({
      value: code,
      label: code,
      activeBg: '#d97706',
      activeColor: '#fff',
      activeBorder: '#d97706',
    })),
  ];

  const funnelItems = [
    { value: 'all', label: '전체', activeBg: tokens.color.text, activeColor: '#fff', activeBorder: tokens.color.text },
    ...FUNNEL_ORDER.map((f) => ({
      value: f,
      label: f,
      activeBg: FUNNEL_CONFIG[f].color,
      activeColor: '#fff',
      activeBorder: FUNNEL_CONFIG[f].color,
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LayoutGrid style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>컨셉 목록</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
            background: tokens.color.surfaceMuted, color: tokens.color.textSubtle,
          }}>
            {filtered.length}개
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setFilterPersona('all'); setFilterDesire('all'); setFilterFunnel('all'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle,
              padding: '3px 10px', borderRadius: 999,
              border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
              cursor: 'pointer',
            }}
          >
            <X style={{ width: 12, height: 12 }} />
            필터 초기화
          </button>
        )}
      </div>

      {/* Horizontal Chip Filters */}
      <div style={{
        display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        padding: '10px 14px', borderRadius: 12,
        background: tokens.color.surfaceMuted,
        border: `1px solid ${tokens.color.border}`,
      }}>
        <ChipGroup label="페르소나" items={personaItems} value={filterPersona} onChange={setFilterPersona} />
        <div style={{ width: 1, height: 24, background: tokens.color.border }} />
        <ChipGroup label="욕구" items={desireItems} value={filterDesire} onChange={setFilterDesire} />
        <div style={{ width: 1, height: 24, background: tokens.color.border }} />
        <ChipGroup label="퍼널" items={funnelItems} value={filterFunnel} onChange={setFilterFunnel} />
      </div>

      {/* Progress Summary */}
      {concepts.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10,
          background: checkedCount > 0 ? '#f0fdf4' : tokens.color.surfaceMuted,
          border: `1px solid ${checkedCount > 0 ? '#bbf7d0' : tokens.color.border}`,
          transition: 'all .2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare style={{ width: 15, height: 15, color: checkedCount > 0 ? '#10b981' : tokens.color.textSubtle }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>
              진행 확정
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: checkedCount > 0 ? '#10b981' : tokens.color.textSubtle,
            }}>
              {checkedCount} / {totalCount}
            </span>
            {/* Mini progress bar */}
            <div style={{
              width: 80, height: 6, borderRadius: 3,
              background: '#e5e7eb', overflow: 'hidden',
            }}>
              <div style={{
                width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%',
                height: '100%', borderRadius: 3,
                background: '#10b981',
                transition: 'width .3s ease',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                const allFiltered = filtered.map((c) => c.concept_id ?? c.id);
                const allChecked = allFiltered.every((id) => checkedIds.has(id));
                setCheckedIds((prev) => {
                  const next = new Set(prev);
                  allFiltered.forEach((id) => allChecked ? next.delete(id) : next.add(id));
                  return next;
                });
                // DB에 상태 즉시 저장
                onToggleStatus?.(allFiltered, allChecked ? 'draft' : 'confirmed');
              }}
              style={{
                fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle,
                padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
                cursor: 'pointer',
              }}
            >
              {filtered.length > 0 && filtered.every((c) => checkedIds.has(c.concept_id ?? c.id))
                ? '전체 해제' : '전체 선택'}
            </button>
            <button
              type="button"
              disabled={checkedCount === 0 || isSaving}
              onClick={() => {
                const ids = [...checkedIds];
                onSaveConfirmed?.(ids);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, color: checkedCount > 0 ? '#fff' : tokens.color.textSubtle,
                padding: '4px 12px', borderRadius: 6,
                border: 'none',
                background: checkedCount > 0 ? '#10b981' : '#e5e7eb',
                cursor: checkedCount > 0 && !isSaving ? 'pointer' : 'not-allowed',
                opacity: checkedCount > 0 && !isSaving ? 1 : 0.6,
                transition: 'all .15s',
              }}
            >
              {isSaving ? (
                <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save style={{ width: 12, height: 12 }} />
              )}
              {isSaving ? '전략 생성 중...' : '저장 → 전략 생성'}
            </button>
          </div>
        </div>
      )}

      {/* Concept List */}
      {filtered.length === 0 ? (
        <div style={{ borderRadius: 14, border: `2px dashed ${tokens.color.border}`, padding: '40px 20px', textAlign: 'center' }}>
          <Lightbulb style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4, color: tokens.color.textSubtle }} />
          <p style={{ fontSize: 14, color: tokens.color.textSubtle, margin: 0 }}>생성된 컨셉이 없습니다</p>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>위의 "컨셉 자동 생성" 버튼을 클릭하세요</p>
        </div>
      ) : (
        FUNNEL_ORDER.map((funnel) => {
          const items = grouped[funnel];
          if (items.length === 0) return null;
          const cfg = FUNNEL_CONFIG[funnel];
          return (
            <div key={funnel} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Funnel Section Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', marginBottom: 4,
                borderRadius: 10,
                background: cfg.bg,
                borderLeft: `3px solid ${cfg.color}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, letterSpacing: '0.03em' }}>
                  {cfg.long}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                  background: cfg.color, color: '#fff',
                }}>
                  {items.length}
                </span>
              </div>
              {/* List Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map((concept, idx) => {
                  const cid = concept.concept_id ?? concept.id ?? idx;
                  return (
                    <ConceptCard
                      key={cid}
                      concept={concept}
                      isLast={idx === items.length - 1}
                      checked={checkedIds.has(cid)}
                      onToggleCheck={toggleCheck}
                      personaMap={personaMap}
                      desireMap={desireMap}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
