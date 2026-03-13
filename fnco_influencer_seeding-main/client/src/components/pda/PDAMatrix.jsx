import { useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

// 4단계 인지 여정 (code 기반)
const AWARENESS_STAGES = [
  { code: 'A1', name: '문제 인지', eng: 'Problem Aware', funnel: 'TOFU', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  { code: 'A2', name: '해결책 인지', eng: 'Solution Aware', funnel: 'MOFU', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  { code: 'A3', name: '제품 인지', eng: 'Product Aware', funnel: 'MOFU', color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' },
  { code: 'A4', name: '구매 유도', eng: 'Most Aware', funnel: 'BOFU', color: '#10b981', bg: '#d1fae5', text: '#065f46' },
];

const FUNNEL_COLORS = {
  TOFU: '#0284c7',
  MOFU: '#7c3aed',
  BOFU: '#059669',
};

export default function PDAMatrix({ personas = [], desires = [], awareness = [], concepts = [], onCellClick }) {
  // P×D 매트릭스 + 각 셀에 awareness별 컨셉 분류
  const matrix = useMemo(() => {
    const m = {};
    for (const p of personas) {
      m[p.code] = {};
      for (const d of desires) {
        const matching = concepts.filter(
          (c) => c.persona_code === p.code && c.desire_code === d.code
        );
        // awareness_code별 그룹
        const byAwareness = {};
        for (const stage of AWARENESS_STAGES) {
          byAwareness[stage.code] = matching.filter(
            (c) => c.awareness_code === stage.code
          );
        }
        m[p.code][d.code] = { total: matching.length, byAwareness, concepts: matching };
      }
    }
    return m;
  }, [personas, desires, concepts]);

  if (personas.length === 0 || desires.length === 0) {
    return (
      <div style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 12,
        padding: '40px 20px',
        textAlign: 'center',
        color: tokens.color.textSubtle,
      }}>
        <Grid3X3 style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4 }} />
        <p style={{ fontSize: 13 }}>페르소나와 욕구를 먼저 생성해주세요</p>
      </div>
    );
  }

  return (
    <div style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${tokens.color.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Grid3X3 style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>
          P.D.A. 매트릭스
        </span>
        <span style={{
          fontSize: 11, background: tokens.color.surfaceMuted, color: tokens.color.textSubtle,
          padding: '2px 8px', borderRadius: 10, fontWeight: 600,
        }}>
          {personas.length}P × {desires.length}D × {AWARENESS_STAGES.length}A = {concepts.length}컨셉
        </span>
      </div>

      {/* Table */}
      <div style={{ padding: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                padding: '8px 12px', fontSize: 11, fontWeight: 500, color: tokens.color.textSubtle,
                textAlign: 'left', borderBottom: `2px solid ${tokens.color.border}`, whiteSpace: 'nowrap',
              }}>
                P \ D
              </th>
              {desires.map((d) => (
                <th key={d.code} style={{
                  padding: '8px 12px', textAlign: 'center',
                  borderBottom: `2px solid ${tokens.color.border}`, minWidth: 180,
                }}>
                  <span style={{
                    display: 'inline-block', background: '#d97706', color: '#fff',
                    fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                  }}>
                    {d.code}
                  </span>
                  <div style={{
                    fontSize: 11, color: tokens.color.textSubtle, marginTop: 2,
                    fontWeight: 400, lineHeight: 1.3, wordBreak: 'keep-all',
                  }}>
                    {d.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.code}>
                <td style={{
                  padding: '8px 12px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  whiteSpace: 'nowrap', verticalAlign: 'middle',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block', background: '#7c3aed', color: '#fff',
                      fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                    }}>
                      {p.code}
                    </span>
                    <span style={{ fontSize: 12, color: tokens.color.textSubtle, lineHeight: 1.3, wordBreak: 'keep-all' }}>
                      {p.name}
                    </span>
                  </div>
                </td>
                {desires.map((d) => {
                  const cell = matrix[p.code]?.[d.code] || { total: 0, byAwareness: {} };
                  const isEmpty = cell.total === 0;

                  // 인지 단계별 카운트
                  const stageCounts = AWARENESS_STAGES.map((stage) => ({
                    ...stage,
                    count: (cell.byAwareness[stage.code] || []).length,
                  }));
                  const totalInCell = stageCounts.reduce((acc, s) => acc + s.count, 0);

                  return (
                    <td key={d.code} style={{
                      padding: 6,
                      borderBottom: `1px solid ${tokens.color.border}`,
                      verticalAlign: 'top',
                    }}>
                      <div
                        onClick={() => onCellClick?.({ persona: p, desire: d, concepts: cell.concepts })}
                        style={{
                          minHeight: isEmpty ? 72 : 'auto',
                          padding: isEmpty ? 0 : '10px 12px',
                          borderRadius: 10,
                          border: isEmpty ? `1.5px dashed ${tokens.color.border}` : `1px solid ${tokens.color.border}`,
                          background: isEmpty ? tokens.color.surfaceMuted : tokens.color.surface,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {!isEmpty && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Awareness Stage Badges */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              {stageCounts.map((stage) => (
                                stage.count > 0 && (
                                  <span key={stage.code} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 2,
                                    fontSize: 10, fontWeight: 700, color: '#fff',
                                    background: stage.color, padding: '2px 7px', borderRadius: 999,
                                  }}>
                                    {stage.code}
                                    <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.9 }}>{stage.count}</span>
                                  </span>
                                )
                              ))}
                            </div>

                            {/* Total count */}
                            <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>
                              {totalInCell}개
                            </span>

                            {/* Awareness color bar */}
                            <div style={{
                              display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden',
                              background: '#e5e7eb',
                            }}>
                              {stageCounts.map((stage) => {
                                if (stage.count === 0 || totalInCell === 0) return null;
                                const pct = (stage.count / totalInCell) * 100;
                                return (
                                  <div
                                    key={stage.code}
                                    style={{
                                      width: `${pct}%`,
                                      background: stage.color,
                                      transition: 'width .3s',
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Awareness Stage Legend */}
      <div style={{
        padding: '10px 18px',
        borderTop: `1px solid ${tokens.color.border}`,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: tokens.color.textSubtle, fontWeight: 600 }}>인지 여정:</span>
        {AWARENESS_STAGES.map((stage) => (
          <div key={stage.code} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2, background: stage.color, display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, color: tokens.color.text, fontWeight: 500 }}>
              {stage.code} {stage.name}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600, color: FUNNEL_COLORS[stage.funnel],
              padding: '0px 5px', borderRadius: 4, background: tokens.color.surfaceMuted,
            }}>
              {stage.funnel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
