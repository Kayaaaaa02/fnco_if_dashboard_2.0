import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  ShieldCheck,
  X,
  Loader2,
  GitCompare,
  Megaphone,
  MessageSquare,
  Target,
  PieChart,
  Film,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import DiffViewer from '@/components/diff/DiffViewer.jsx';

function generateMockPreviousVersion(current) {
  if (!current) return null;
  const prev = JSON.parse(JSON.stringify(current));
  prev.version = (prev.version || 1) - 1;
  if (prev.channels) {
    const ch = prev.channels?.items || prev.channels;
    if (Array.isArray(ch) && ch.length > 1) {
      if (prev.channels.items) prev.channels.items = ch.slice(0, -1);
      else prev.channels = ch.slice(0, -1);
    }
  }
  if (prev.messaging) {
    const msgs = prev.messaging?.key_messages || prev.messaging?.messages;
    if (Array.isArray(msgs) && msgs.length > 0) {
      const firstMsg = msgs[0];
      if (typeof firstMsg === 'string') msgs[0] = firstMsg + ' (이전)';
      else if (firstMsg?.message) firstMsg.message = firstMsg.message + ' (이전)';
    }
  }
  if (prev.kpis) {
    const kpiList = prev.kpis?.items || prev.kpis?.metrics;
    if (Array.isArray(kpiList) && kpiList.length > 0) {
      const first = kpiList[0];
      if (first.target) first.target = Math.round(first.target * 0.8);
      if (first.goal) first.goal = Math.round(first.goal * 0.8);
    }
  }
  return prev;
}

/* ── KPI 단위 포맷 ── */
function fmtKpi(value, unit) {
  if (!value && value !== 0) return '-';
  const v = Number(value);
  if (unit === '원') return `${v.toLocaleString()}원`;
  if (unit === '%') return `${v}%`;
  if (unit === 'x') return `${v}x`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
}

const KPI_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const KPI_NAME_MAP = { '도달': '조회수', 'UGC 수': '컨텐츠 수' };

/* ── 채널 메타 (전략 페이지와 동일) ── */
const CHANNEL_META = {
  YouTube: { color: '#dc2626', ratio: 40, role: 'BOFU 주력', strengths: ['긴 시청 시간', '전문 리뷰·교육', '높은 신뢰도'] },
  Instagram: { color: '#db2777', ratio: 32, role: 'MOFU 주력', strengths: ['높은 참여율', 'Reels/Carousel', '비주얼 브랜딩'] },
  TikTok: { color: '#0f172a', ratio: 28, role: 'TOFU 주력', strengths: ['바이럴 도달력', '숏폼 공감', 'Z세대 접점'] },
};

/* ── 서사 아크 메타 ── */
const ARC_META = {
  tease: { label: '티징', subtitle: '문제 인지', funnel: 'TOFU', color: '#8b5cf6' },
  reveal: { label: '공개', subtitle: '해결책 인지', funnel: 'MOFU', color: '#3b82f6' },
  validate: { label: '검증', subtitle: '제품 인지', funnel: 'MOFU', color: '#10b981' },
  amplify: { label: '확산', subtitle: '구매 유도', funnel: 'BOFU', color: '#f59e0b' },
};

/* ── 시딩 비중 메타 ── */
const SEEDING_META = [
  { channel: 'YouTube', ratio: 40, color: '#dc2626' },
  { channel: 'Instagram', ratio: 32, color: '#db2777' },
  { channel: 'TikTok', ratio: 28, color: '#0f172a' },
];

export default function StrategyApproval({ open, onOpenChange, strategy, narrativeArc, onApprove, isPending }) {
  const [showDiff, setShowDiff] = useState(false);

  if (!strategy) return null;

  const rawKpis = strategy.kpis?.items || strategy.kpis?.metrics || [];
  const kpis = rawKpis
    .map((k) => ({ ...k, name: KPI_NAME_MAP[k.name] || k.name }))
    .filter((k) => k.name !== 'ROAS');
  const messages = strategy.messaging?.key_messages || strategy.messaging?.messages || [];
  const arcPhases = narrativeArc?.phases || [];
  const currentVersion = strategy.version || 1;
  const hasPreviousVersion = currentVersion > 1;
  const mockPrevious = hasPreviousVersion ? generateMockPreviousVersion(strategy) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setShowDiff(false); onOpenChange(v); }}>
      <DialogContent
        style={{
          maxWidth: showDiff ? 680 : 580,
          padding: 0,
          borderRadius: 16,
          overflow: 'hidden',
          border: 'none',
          boxShadow: '0 25px 60px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05)',
        }}
      >
        {/* ── Green top accent bar ── */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)' }} />

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 0' }}>
          <DialogHeader style={{ marginBottom: 0, padding: 0 }}>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 800, margin: 0 }}>
              {showDiff ? (
                <>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 10,
                    background: '#dbeafe', color: '#2563eb',
                  }}>
                    <GitCompare style={{ width: 20, height: 20 }} />
                  </span>
                  이전 버전과 비교
                </>
              ) : (
                <>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    color: '#15803d',
                  }}>
                    <ShieldCheck style={{ width: 20, height: 20 }} />
                  </span>
                  <span>전략 승인</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                  }}>
                    v{currentVersion}
                  </span>
                </>
              )}
            </DialogTitle>
            <DialogDescription style={{
              fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 1.5,
            }}>
              {showDiff
                ? `v${currentVersion - 1}과 v${currentVersion} 사이의 변경사항을 확인합니다.`
                : '승인하면 전략이 확정되며 이후 수정할 수 없습니다. 아래 요약을 꼼꼼히 검토하세요.'
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 24px 20px', maxHeight: 480, overflowY: 'auto' }}>
          {showDiff ? (
            <DiffViewer
              oldData={mockPrevious}
              newData={strategy}
              oldLabel={`v${currentVersion - 1}`}
              newLabel={`v${currentVersion}`}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── ① KPI 목표 ── */}
              {Array.isArray(kpis) && kpis.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Target style={{ width: 14, height: 14, color: '#ef4444' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>KPI 목표</span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)`,
                    gap: 8,
                  }}>
                    {kpis.slice(0, 5).map((kpi, idx) => {
                      const color = KPI_COLORS[idx % KPI_COLORS.length];
                      return (
                        <div key={idx} style={{
                          borderRadius: 10, padding: '10px 8px',
                          background: '#fff', border: '1px solid #e2e8f0',
                          borderTop: `3px solid ${color}`,
                          textAlign: 'center',
                        }}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 3 }}>
                            {kpi.name || kpi.metric}
                          </p>
                          <p style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1, marginBottom: 2 }}>
                            {fmtKpi(kpi.target || kpi.goal, kpi.unit)}
                          </p>
                          {kpi.unit && (
                            <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{kpi.unit}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── ② 채널 전략 (스코어링 기반) ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Megaphone style={{ width: 14, height: 14, color: '#6366f1' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>채널 전략</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['YouTube', 'Instagram', 'TikTok'].map((ch) => {
                    const meta = CHANNEL_META[ch];
                    return (
                      <div key={ch} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8,
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: meta.color, minWidth: 70 }}>{ch}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 999,
                          background: meta.color, color: '#fff',
                        }}>{meta.ratio}%</span>
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{meta.role}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                          {meta.strengths.map((s, i) => (
                            <span key={i} style={{
                              fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 999,
                              background: '#fff', color: '#94a3b8', border: '1px solid #e2e8f0',
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── ③ 핵심 메시지 ── */}
              {messages.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MessageSquare style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>핵심 메시지</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{messages.length}개</span>
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                    borderRadius: 10, background: '#faf5ff', border: '1px solid #e9d5ff',
                    padding: '10px 14px',
                  }}>
                    {messages.slice(0, 3).map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 18, height: 18, borderRadius: 999, flexShrink: 0, marginTop: 1,
                          background: '#8b5cf6', color: '#fff', fontSize: 9, fontWeight: 800,
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{
                          fontSize: 12, color: '#334155', lineHeight: 1.5, fontWeight: 500,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {typeof msg === 'string' ? msg : msg.message || msg.text}
                        </span>
                      </div>
                    ))}
                    {messages.length > 3 && (
                      <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, paddingLeft: 26 }}>
                        +{messages.length - 3}개 더
                      </span>
                    )}
                  </div>
                </section>
              )}

              {/* ── ④ 론칭 서사 아크 ── */}
              {arcPhases.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Film style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>론칭 서사 아크</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{arcPhases.length}단계</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {arcPhases.map((phase, idx) => {
                      const meta = ARC_META[phase.phase] || { label: phase.phase, subtitle: '', funnel: '', color: '#8b5cf6' };
                      return (
                        <div key={idx} style={{
                          flex: 1, borderRadius: 8, padding: '8px 10px',
                          background: '#f8fafc', border: '1px solid #e2e8f0',
                          borderTop: `3px solid ${meta.color}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>{meta.label}</span>
                            <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8' }}>{meta.subtitle}</span>
                          </div>
                          <span style={{
                            fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                            background: meta.color + '15', color: meta.color,
                          }}>{meta.funnel}</span>
                          {phase.concepts?.length > 0 && (
                            <p style={{ fontSize: 8, color: '#94a3b8', margin: '3px 0 0', fontWeight: 600 }}>
                              컨셉 {phase.concepts.length}개
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── ⑤ 채널별 시딩 비중 ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <PieChart style={{ width: 14, height: 14, color: '#d97706' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>채널별 시딩 비중</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SEEDING_META.map((s) => (
                    <div key={s.channel} style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 10px', borderRadius: 8,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{s.channel}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: s.color, marginLeft: 'auto' }}>{s.ratio}%</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── 승인 경고 배너 ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: '#fffbeb', border: '1px solid #fde68a',
              }}>
                <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: 0, lineHeight: 1.3 }}>
                    승인 후 전략 수정이 불가합니다
                  </p>
                  <p style={{ fontSize: 11, color: '#a16207', margin: '2px 0 0', lineHeight: 1.4 }}>
                    채널, 메시지, KPI, 서사 아크 등 모든 항목을 최종 확인한 후 승인하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}>
          {showDiff ? (
            <Button
              variant="outline"
              onClick={() => setShowDiff(false)}
              style={{ borderRadius: 8, fontSize: 13 }}
            >
              <X className="h-4 w-4 mr-1" />
              비교 닫기
            </Button>
          ) : (
            <>
              {hasPreviousVersion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiff(true)}
                  style={{
                    marginRight: 'auto', borderRadius: 8, fontSize: 12,
                    color: '#2563eb', borderColor: '#bfdbfe',
                  }}
                >
                  <GitCompare className="h-3.5 w-3.5 mr-1" />
                  이전 버전과 비교
                </Button>
              )}
              <div style={{ marginLeft: hasPreviousVersion ? 0 : 'auto', display: 'flex', gap: 8 }}>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  style={{ borderRadius: 8, fontSize: 13, height: 38 }}
                >
                  취소
                </Button>
                <Button
                  onClick={onApprove}
                  disabled={isPending}
                  style={{
                    borderRadius: 8, fontSize: 13, fontWeight: 700, height: 38,
                    padding: '0 20px',
                    background: isPending ? '#86efac' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff', border: 'none',
                    boxShadow: isPending ? 'none' : '0 2px 8px rgba(16,185,129,.35)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: isPending ? 'wait' : 'pointer',
                  }}
                >
                  {isPending ? (
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <CheckCircle2 style={{ width: 16, height: 16 }} />
                  )}
                  {isPending ? '승인 처리 중...' : '전략 승인'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
