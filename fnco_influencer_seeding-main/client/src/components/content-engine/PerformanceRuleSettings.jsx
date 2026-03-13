/**
 * 성과 콘텐츠 자동 감지 룰 설정 패널
 * BF Score (퍼널 정합 / Hook 적합 / 시장 반응) + GEO Ready 복합 점수 설정
 * 상단: 요약 + 구조 설명 (읽기 전용)  /  하단: 설정 수정 탭 (편집 + 저장)
 * localStorage 기반 저장
 */
import { useState, useEffect, useCallback } from 'react';
import { Save, Target, Zap, TrendingUp, Globe2, AlertTriangle, CheckCircle2, Settings2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { tokens } from '@/styles/designTokens.js';

const STORAGE_KEY = 'fnco-performance-rules';

const DEFAULT_RULES = {
  autoDetectEnabled: true,
  engagementThreshold: 2,
  viewCountThreshold: 100000,
  geoReadyRequired: false,
  bfGradeA: 80,
  bfGradeB: 50,
  geoGradeReady: 80,
  geoGradePotential: 50,
  geoSigPerformance: 20,
  geoSigPlatform: 20,
  geoSigKeyword: 20,
  geoSigFncoEdit: 20,
  geoSigGlobalSeeding: 20,
  geoViewThreshold: 100000,
  geoEngagementThreshold: 2,
};

function loadRules() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_RULES, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_RULES };
}

function saveRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    return true;
  } catch { return false; }
}

/* ── 등급 게이지 바 ── */
function GradeGauge({ highLabel, highColor, highThreshold, midLabel, midColor, midThreshold, lowLabel, lowColor }) {
  return (
    <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div style={{ flex: 100 - highThreshold, background: highColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{highLabel} ≥{highThreshold}</span>
      </div>
      <div style={{ flex: highThreshold - midThreshold, background: midColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{midLabel} ≥{midThreshold}</span>
      </div>
      <div style={{ flex: midThreshold, background: lowColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{lowLabel}</span>
      </div>
    </div>
  );
}

/* ── 등급 슬라이더 행 ── */
function GradeRow({ badge, badgeColor, label, value, onChange, min, max, textColor }) {
  return (
    <div style={{ padding: '12px 16px', borderRadius: 8, background: `${badgeColor}08`, border: `1px solid ${badgeColor}25` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: badgeColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: '#fff',
          }}>{badge}</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: textColor || '#334155' }}>{label}</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 900, color: badgeColor }}>≥ {value}점</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={5} />
    </div>
  );
}

export default function PerformanceRuleSettings() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [saved, setSaved] = useState(false);
  const [settingsTab, setSettingsTab] = useState('bf');

  useEffect(() => { setRules(loadRules()); }, []);

  const setField = useCallback((field, value) => {
    setRules((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    if (saveRules(rules)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [rules]);

  const handleReset = useCallback(() => {
    setRules({ ...DEFAULT_RULES });
    setSaved(false);
  }, []);

  const geoTotal = rules.geoSigPerformance + rules.geoSigPlatform + rules.geoSigKeyword + rules.geoSigFncoEdit + rules.geoSigGlobalSeeding;
  const geoOk = geoTotal === 100;

  const bfSummary = rules.autoDetectEnabled
    ? `BF-1 ≥ ${rules.bfGradeA}점 · BF-2 ≥ ${rules.bfGradeB}점`
    : '자동 감지 비활성화';
  const geoSummary = `Ready ≥ ${rules.geoGradeReady}점 · Potential ≥ ${rules.geoGradePotential}점`;

  /* ── GEO 시그널 목록 (설정 탭용) ── */
  const geoSignals = [
    { key: 'geoSigPerformance', num: '①', title: '성과 임계치', desc: '조회수·참여율 기준 달성', color: '#0ea5e9' },
    { key: 'geoSigPlatform', num: '②', title: '플랫폼 도달력', desc: `YT ${rules.geoSigPlatform}pt / TT ${Math.round(rules.geoSigPlatform * 0.75)}pt / IG ${Math.round(rules.geoSigPlatform * 0.5)}pt`, color: '#0284c7' },
    { key: 'geoSigKeyword', num: '③', title: '비언어 콘텐츠', desc: 'ASMR, tutorial, demo, unboxing 등 글로벌 키워드', color: '#0369a1' },
    { key: 'geoSigFncoEdit', num: '④', title: 'FNCO 편집본', desc: '자체 편집을 거쳐 현지화 가능성 확보', color: '#075985' },
    { key: 'geoSigGlobalSeeding', num: '⑤', title: '글로벌 시딩 이력', desc: '동일 제품 2개국 이상 시딩', color: '#0c4a6e' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-5">

      {/* ═══════════════════════════════════════════════════════
          상단: 요약 대시보드
      ═══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* BF 요약 */}
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed10, #fff)',
          border: '1px solid #7c3aed20',
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <Target style={{ width: 16, height: 16, color: '#7c3aed' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>BF Score</span>
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{bfSummary}</span>
          </div>
          <GradeGauge
            highLabel="BF-1" highColor="#10b981" highThreshold={rules.bfGradeA}
            midLabel="BF-2" midColor="#f59e0b" midThreshold={rules.bfGradeB}
            lowLabel="BF-3" lowColor="#ef4444"
          />
        </div>
        {/* GEO 요약 */}
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'linear-gradient(135deg, #0ea5e910, #fff)',
          border: '1px solid #0ea5e920',
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <Globe2 style={{ width: 16, height: 16, color: '#0ea5e9' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0ea5e9' }}>GEO Ready</span>
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{geoSummary}</span>
          </div>
          <GradeGauge
            highLabel="Ready" highColor="#0ea5e9" highThreshold={rules.geoGradeReady}
            midLabel="Potential" midColor="#f59e0b" midThreshold={rules.geoGradePotential}
            lowLabel="Local" lowColor="#94a3b8"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          중단: BF / GEO 구조 설명 (읽기 전용)
      ═══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* BF 3축 */}
        <Card style={{ border: '1px solid #7c3aed20', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #7c3aed10, #7c3aed04)',
            borderBottom: '2px solid #7c3aed',
          }}>
            <div className="flex items-center gap-2">
              <Target style={{ width: 15, height: 15, color: '#7c3aed' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: tokens.color.text }}>Best Fit 스코어 산출 기준</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>100점 만점</span>
            </div>
          </div>
          <CardContent style={{ padding: '16px 20px' }} className="space-y-3">
            {[
              { icon: Target, color: '#6366f1', num: '①', title: '퍼널 정합성', pct: '30%', desc: '기획된 Funnel(TOFU/MOFU/BOFU)로 맞는 콘텐츠로 생성되었는지 판별' },
              { icon: Zap, color: '#8b5cf6', num: '②', title: 'Hook 정합성', pct: '30%', desc: '기획된 12가지 Hook이 구현되어 3초 이탈 방지에 성공했는지 판별' },
              { icon: TrendingUp, color: '#a78bfa', num: '③', title: '콘텐츠 반응', pct: '40%', desc: '조회수 및 참여율이 우수 콘텐츠 기준을 상회하는 수치인지 판별' },
            ].map(({ icon: Icon, color, num, title, pct, desc }) => (
              <div key={num} style={{
                padding: '12px 14px', borderRadius: 8,
                background: `${color}06`, border: `1px solid ${color}18`,
                borderLeft: `3px solid ${color}`,
              }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 12, height: 12, color: '#fff' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text }}>{num} {title}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color, marginLeft: 'auto' }}>{pct}</span>
                </div>
                <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6, margin: 0, paddingLeft: 30 }}>{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GEO 5시그널 */}
        <Card style={{ border: '1px solid #0ea5e920', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #0ea5e910, #0ea5e904)',
            borderBottom: '2px solid #0ea5e9',
          }}>
            <div className="flex items-center gap-2">
              <Globe2 style={{ width: 15, height: 15, color: '#0ea5e9' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: tokens.color.text }}>GEO Ready — 5 시그널 평가</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 'auto',
                background: geoOk ? '#0ea5e9' : '#f59e0b', color: '#fff',
              }}>{geoTotal}점 만점</span>
            </div>
          </div>
          <CardContent style={{ padding: '16px 20px' }} className="space-y-2">
            {geoSignals.map(({ key, num, title, desc, color }) => (
              <div key={key} style={{
                padding: '10px 14px', borderRadius: 8,
                background: `${color}06`, border: `1px solid ${color}18`,
                borderLeft: `3px solid ${color}`,
              }}>
                <div className="flex items-center gap-2">
                  <span style={{
                    width: 20, height: 20, borderRadius: 5, background: color,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0,
                  }}>{num.replace(/[①②③④⑤]/, (m) => '①②③④⑤'.indexOf(m) + 1)}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text }}>{title}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color, marginLeft: 'auto' }}>{rules[key]}pt</span>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0', paddingLeft: 28 }}>{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════
          하단: 설정 수정 탭
      ═══════════════════════════════════════════════════════ */}
      <Card style={{ border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* 탭 헤더 */}
        <div style={{
          padding: '0 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 0,
        }}>
          <div className="flex items-center gap-2" style={{ padding: '14px 0', marginRight: 24 }}>
            <Settings2 style={{ width: 16, height: 16, color: tokens.color.text }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: tokens.color.text }}>설정 수정</span>
          </div>
          {[
            { key: 'bf', label: 'BF Score 설정', color: '#7c3aed' },
            { key: 'geo', label: 'GEO Ready 설정', color: '#0ea5e9' },
          ].map(({ key, label, color }) => {
            const active = settingsTab === key;
            return (
              <button
                key={key}
                onClick={() => setSettingsTab(key)}
                style={{
                  padding: '14px 20px',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? color : '#64748b',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
          {/* 우측: 저장 / 초기화 버튼 */}
          <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-1.5 h-8 px-3"
              style={{ fontSize: 12, fontWeight: 600, borderRadius: 6, color: '#64748b', borderColor: '#e2e8f0' }}
            >
              <RotateCcw className="h-3 w-3" />초기화
            </Button>
            <Button
              onClick={handleSave}
              className="gap-1.5 h-8 px-5"
              style={{
                fontSize: 12, fontWeight: 700, borderRadius: 6,
                background: saved ? '#10b981' : tokens.color.primary, color: '#fff',
                transition: 'background 0.2s',
              }}
            >
              {saved ? <CheckCircle2 className="h-3 w-3" /> : <Save className="h-3 w-3" />}
              {saved ? '저장 완료' : '저장'}
            </Button>
          </div>
        </div>

        {/* 탭 본문 */}
        <CardContent style={{ padding: '20px 24px' }}>
          {/* ── BF Score 설정 ── */}
          {settingsTab === 'bf' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* 왼쪽: 자동 감지 + 시장 반응 기준 */}
              <div className="space-y-4">
                <div style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text, marginBottom: 4 }}>자동 감지 & 시장 반응 기준</div>

                {/* 자동 감지 토글 */}
                <div className="flex items-center justify-between" style={{
                  padding: '14px 16px', borderRadius: 8,
                  background: rules.autoDetectEnabled ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${rules.autoDetectEnabled ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  <div>
                    <Label className="text-sm font-bold" style={{ color: rules.autoDetectEnabled ? '#166534' : '#991b1b' }}>
                      자동 감지 {rules.autoDetectEnabled ? 'ON' : 'OFF'}
                    </Label>
                    <p style={{ fontSize: 11, color: rules.autoDetectEnabled ? '#15803d' : '#b91c1c', margin: '2px 0 0' }}>
                      {rules.autoDetectEnabled ? '성과 콘텐츠를 자동으로 분류합니다.' : '수동으로만 성과 콘텐츠를 지정합니다.'}
                    </p>
                  </div>
                  <Switch checked={rules.autoDetectEnabled} onCheckedChange={(v) => setField('autoDetectEnabled', v)} />
                </div>

                {/* 참여율 기준 */}
                <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <Label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>참여율 기준 (③ 시장 반응)</Label>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{rules.engagementThreshold}%</span>
                  </div>
                  <Slider value={[rules.engagementThreshold]} onValueChange={([v]) => setField('engagementThreshold', v)} min={0.5} max={10} step={0.5} />
                </div>

                {/* 조회수 기준 */}
                <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <Label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>조회수 기준 (③ 시장 반응)</Label>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{rules.viewCountThreshold.toLocaleString()}회</span>
                  </div>
                  <Input
                    type="number"
                    value={rules.viewCountThreshold}
                    onChange={(e) => setField('viewCountThreshold', Number(e.target.value) || 0)}
                    min={0} step={10000}
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* 오른쪽: 등급 기준 슬라이더 */}
              <div className="space-y-4">
                <div style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text, marginBottom: 4 }}>BF 등급 커트라인</div>

                <GradeRow badge="1" badgeColor="#10b981" label="BF-1 기획 부합" value={rules.bfGradeA}
                  onChange={(v) => setField('bfGradeA', v)} min={50} max={100} textColor="#166534" />

                <GradeRow badge="2" badgeColor="#f59e0b" label="BF-2 부분 부합" value={rules.bfGradeB}
                  onChange={(v) => setField('bfGradeB', v)} min={20} max={rules.bfGradeA - 5} textColor="#92400e" />

                <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f208', border: '1px solid #ef444420' }}>
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900, color: '#fff',
                    }}>3</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>BF-3 기획 재검토 — {rules.bfGradeB}점 미만</span>
                  </div>
                </div>

                {/* 미리보기 게이지 */}
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>등급 분포 미리보기</p>
                  <GradeGauge
                    highLabel="BF-1" highColor="#10b981" highThreshold={rules.bfGradeA}
                    midLabel="BF-2" midColor="#f59e0b" midThreshold={rules.bfGradeB}
                    lowLabel="BF-3" lowColor="#ef4444"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── GEO Ready 설정 ── */}
          {settingsTab === 'geo' && (
            <div className="space-y-5">
              {/* 배점 합산 상태 */}
              <div className="flex items-center gap-2" style={{
                padding: '10px 16px', borderRadius: 8,
                background: geoOk ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${geoOk ? '#bbf7d0' : '#fde68a'}`,
              }}>
                {geoOk
                  ? <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
                  : <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
                }
                <span style={{ fontSize: 13, fontWeight: 700, color: geoOk ? '#166534' : '#92400e' }}>
                  시그널 배점 합산: {geoTotal}점 / 100점
                  {!geoOk && ' — 100점이 되도록 조정하세요'}
                </span>
              </div>

              {/* 2열: 시그널 배점 + 등급 & 임계치 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* 왼쪽: 5시그널 배점 슬라이더 */}
                <div className="space-y-3">
                  <div style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text }}>시그널 배점 (합산 100점)</div>
                  {geoSignals.map(({ key, num, title, color }) => (
                    <div key={key} style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: `${color}05`, border: `1px solid ${color}18`,
                      borderLeft: `3px solid ${color}`,
                    }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <div className="flex items-center gap-2">
                          <span style={{
                            width: 20, height: 20, borderRadius: 5, background: color,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 900, color: '#fff',
                          }}>{num.replace(/[①②③④⑤]/, (m) => '①②③④⑤'.indexOf(m) + 1)}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{title}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{rules[key]}pt</span>
                      </div>
                      <Slider
                        value={[rules[key]]}
                        onValueChange={([v]) => setField(key, v)}
                        min={0} max={40} step={5}
                      />
                    </div>
                  ))}
                </div>

                {/* 오른쪽: 등급 커트라인 + 성과 임계치 */}
                <div className="space-y-4">
                  <div style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text }}>GEO 등급 커트라인</div>

                  {/* Ready */}
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#0ea5e9', color: '#fff', padding: '2px 8px', borderRadius: 5 }}>Ready</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0c4a6e' }}>글로벌 확장 가능</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#0ea5e9' }}>≥ {rules.geoGradeReady}점</span>
                    </div>
                    <Slider value={[rules.geoGradeReady]} onValueChange={([v]) => setField('geoGradeReady', v)} min={50} max={100} step={5} />
                  </div>

                  {/* Potential */}
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 5 }}>Potential</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>잠재 가능성</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>≥ {rules.geoGradePotential}점</span>
                    </div>
                    <Slider value={[rules.geoGradePotential]} onValueChange={([v]) => setField('geoGradePotential', v)} min={20} max={rules.geoGradeReady - 5} step={5} />
                  </div>

                  {/* Local */}
                  <div style={{ padding: '10px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, fontWeight: 800, background: '#94a3b8', color: '#fff', padding: '2px 8px', borderRadius: 5 }}>Local</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>시딩 국가 한정 — {rules.geoGradePotential}점 미만</span>
                    </div>
                  </div>

                  {/* 등급 미리보기 */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>등급 분포 미리보기</p>
                    <GradeGauge
                      highLabel="Ready" highColor="#0ea5e9" highThreshold={rules.geoGradeReady}
                      midLabel="Potential" midColor="#f59e0b" midThreshold={rules.geoGradePotential}
                      lowLabel="Local" lowColor="#94a3b8"
                    />
                  </div>

                  {/* 구분선 */}
                  <div style={{ height: 1, background: '#e2e8f0' }} />

                  {/* ① 시그널 성과 임계치 세부 설정 */}
                  <div style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text }}>① 성과 임계치 세부 설정</div>

                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>조회수 기준</Label>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0ea5e9' }}>{rules.geoViewThreshold.toLocaleString()}회</span>
                    </div>
                    <Input
                      type="number"
                      value={rules.geoViewThreshold}
                      onChange={(e) => setField('geoViewThreshold', Number(e.target.value) || 0)}
                      min={0} step={10000}
                      style={{ height: 34, fontSize: 13 }}
                    />
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>참여율 기준</Label>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0ea5e9' }}>{rules.geoEngagementThreshold}%</span>
                    </div>
                    <Slider value={[rules.geoEngagementThreshold]} onValueChange={([v]) => setField('geoEngagementThreshold', v)} min={0.5} max={10} step={0.5} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
