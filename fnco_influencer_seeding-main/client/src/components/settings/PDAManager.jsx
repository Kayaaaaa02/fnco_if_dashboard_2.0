import { useState, useEffect } from 'react';
import { Brain, Users, Heart, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import { api } from '@/services/api.js';

const FUNNEL_COLOR = {
  TOFU: { bg: '#dbeafe', color: '#1d4ed8' },
  MOFU: { bg: '#fef3c7', color: '#b45309' },
  BOFU: { bg: '#fce7f3', color: '#be185d' },
};

function Badge({ label, bg, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 6, background: bg, color,
    }}>
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, count, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: color + '18',
      }}>
        <Icon style={{ width: 14, height: 14, color }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{title}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>{count}개</span>
    </div>
  );
}

/* ── 페르소나 카드 ── */
function PersonaCard({ p }) {
  const [open, setOpen] = useState(false);
  const pj = p.profile_json || {};
  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${tokens.color.border}`,
      background: '#fff', overflow: 'hidden', transition: 'box-shadow .15s',
    }}>
      <button
        type="button" onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#7c3aed',
          }}>
            {p.code}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{p.name}</div>
            <div style={{ fontSize: 11, color: tokens.color.textSubtle }}>
              {pj.age} · {pj.gender} · {pj.occupation}
            </div>
          </div>
        </div>
        {open ? <ChevronUp style={{ width: 14, height: 14, color: '#9ca3af' }} /> : <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af' }} />}
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow label="관심사" value={pj.interests} />
          <InfoRow label="고민" value={pj.pain_points} />
          <InfoRow label="미디어" value={pj.media_usage} />
          <InfoRow label="시즌" value={pj.month} />
          <InfoRow label="이벤트" value={pj.event} />
        </div>
      )}
    </div>
  );
}

/* ── 욕구 카드 ── */
function DesireCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${tokens.color.border}`,
      background: '#fff', overflow: 'hidden',
    }}>
      <button
        type="button" onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#fce7f3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#db2777',
          }}>
            {d.code}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{d.name}</div>
        </div>
        {open ? <ChevronUp style={{ width: 14, height: 14, color: '#9ca3af' }} /> : <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af' }} />}
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow label="정의" value={d.definition} />
          <InfoRow label="감정 트리거" value={d.emotion_trigger} />
          <InfoRow label="연결 제품군" value={d.linked_products} />
        </div>
      )}
    </div>
  );
}

/* ── 인지단계 카드 ── */
function AwarenessCard({ a }) {
  const fc = FUNNEL_COLOR[a.funnel] || { bg: '#f1f5f9', color: '#475569' };
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${tokens.color.border}`,
      background: '#fff', overflow: 'hidden',
    }}>
      <button
        type="button" onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#2563eb',
          }}>
            {a.code}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{a.name}</div>
          <Badge label={a.funnel} bg={fc.bg} color={fc.color} />
        </div>
        {open ? <ChevronUp style={{ width: 14, height: 14, color: '#9ca3af' }} /> : <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af' }} />}
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow label="톤" value={a.tone} />
          <InfoRow label="전략" value={a.strategy} />
          <InfoRow label="추천 Hook" value={a.recommended_hooks} />
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 600, color: tokens.color.textSubtle, marginRight: 6 }}>{label}</span>
      {value}
    </div>
  );
}

export default function PDAManager() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/master-pda')
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.textSubtle, fontSize: 13 }}>
        P.D.A. 마스터 데이터 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.danger, fontSize: 13 }}>
        데이터 로드 실패: {error}
      </div>
    );
  }

  const { personas = [], desires = [], awareness = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Brain style={{ width: 15, height: 15, color: tokens.color.textSubtle }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>P.D.A. 프레임워크 마스터 데이터</span>
        </div>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, margin: 0 }}>
          Persona × Desire × Awareness 프레임워크의 마스터 데이터입니다. 캠페인 생성 시 이 데이터를 기반으로 AI가 분석합니다.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <StatBadge label="페르소나" count={personas.length} bg="#ede9fe" color="#7c3aed" />
          <StatBadge label="욕구" count={desires.length} bg="#fce7f3" color="#db2777" />
          <StatBadge label="인지단계" count={awareness.length} bg="#dbeafe" color="#2563eb" />
        </div>
      </div>

      {/* ── Persona ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: 20,
      }}>
        <SectionHeader icon={Users} title="Persona (페르소나)" count={personas.length} color="#7c3aed" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {personas.map((p) => <PersonaCard key={p.code} p={p} />)}
        </div>
      </div>

      {/* ── Desire ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: 20,
      }}>
        <SectionHeader icon={Heart} title="Desire (욕구)" count={desires.length} color="#db2777" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {desires.map((d) => <DesireCard key={d.code} d={d} />)}
        </div>
      </div>

      {/* ── Awareness ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: 20,
      }}>
        <SectionHeader icon={Eye} title="Awareness (인지단계)" count={awareness.length} color="#2563eb" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {awareness.map((a) => <AwarenessCard key={a.code} a={a} />)}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, count, bg, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 8, background: bg,
    }}>
      <span style={{ fontSize: 16, fontWeight: 800, color }}>{count}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}
