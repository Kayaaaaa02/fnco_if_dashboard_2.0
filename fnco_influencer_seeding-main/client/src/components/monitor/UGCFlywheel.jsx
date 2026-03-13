import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Sparkles, ArrowRight, Loader2, Sprout, Eye, Zap, Award, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  useUGCContent,
  useUGCCreators,
  useHarvestUGC,
  useUpdatePermission,
  useUpdateAmplify,
  useConvertCreator,
} from '@/hooks/useUGCFlywheel';
import UGCHarvest from './UGCHarvest.jsx';
import UGCCuration from './UGCCuration.jsx';
import UGCAmplify from './UGCAmplify.jsx';
import UGCCreatorTable from './UGCCreatorTable.jsx';
import { tokens } from '@/styles/designTokens.js';

const STAGES = [
  {
    key: 'harvest',
    label: '수확',
    icon: Sprout,
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    desc: '캠페인 관련 UGC를 자동 수집',
  },
  {
    key: 'curation',
    label: '큐레이션',
    icon: Eye,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
    desc: '품질 평가 및 사용 권한 요청',
  },
  {
    key: 'amplify',
    label: '증폭',
    icon: Zap,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    desc: '허가된 콘텐츠를 광고·상세페이지에 활용',
  },
  {
    key: 'convert',
    label: '전환',
    icon: Award,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    desc: '우수 UGC 크리에이터를 인플루언서로 전환',
  },
];

export default function UGCFlywheel() {
  const { id: campaignId } = useParams();
  const { data: contentData, isLoading: contentLoading } = useUGCContent(campaignId);
  const { data: creatorsData, isLoading: creatorsLoading } = useUGCCreators(campaignId);
  const harvestUGC = useHarvestUGC();
  const updatePermission = useUpdatePermission();
  const updateAmplify = useUpdateAmplify();
  const convertCreator = useConvertCreator();

  const [activeStage, setActiveStage] = useState('harvest');
  const [showGuide, setShowGuide] = useState(false);

  const content = contentData?.data || [];
  const creators = creatorsData?.data || [];

  const stageCounts = useMemo(() => {
    const harvestCount = content.length;
    const curationCount = content.filter((i) => i.permission_status === 'granted').length;
    const amplifyCount = content.filter((i) => i.amplify_status && i.amplify_status !== 'none').length;
    const convertCount = creators.filter((c) => c.influencer_potential === 'converted').length;
    return { harvest: harvestCount, curation: curationCount, amplify: amplifyCount, convert: convertCount };
  }, [content, creators]);

  const handleHarvest = () => { harvestUGC.mutate(campaignId); };
  const handleUpdatePermission = ({ ugcId, permission_status }) => { updatePermission.mutate({ campaignId, ugcId, permission_status }); };
  const handleUpdateAmplify = ({ ugcId, amplify_status }) => { updateAmplify.mutate({ campaignId, ugcId, amplify_status }); };
  const handleConvert = (creatorId) => { convertCreator.mutate({ campaignId, creatorId }); };

  const renderTabContent = () => {
    switch (activeStage) {
      case 'harvest': return <UGCHarvest content={content} isLoading={contentLoading} />;
      case 'curation': return <UGCCuration content={content} onUpdatePermission={handleUpdatePermission} />;
      case 'amplify': return <UGCAmplify content={content} onUpdateAmplify={handleUpdateAmplify} />;
      case 'convert': return <UGCCreatorTable creators={creators} onConvert={handleConvert} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 50%, #ecfdf5 100%)',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>UGC 플라이휠</h2>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              고객 생성 콘텐츠를 수확 → 큐레이션 → 증폭 → 전환하는 선순환 마케팅 엔진
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
                fontSize: 11, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}
            >
              <Info style={{ width: 13, height: 13 }} />
              가이드
              {showGuide ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
            </button>
            <Button
              onClick={handleHarvest}
              disabled={harvestUGC.isPending}
              size="sm"
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, height: 34 }}
            >
              {harvestUGC.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sprout className="size-4" />
              )}
              <span>UGC 수확</span>
            </Button>
          </div>
        </div>

        {/* ── Guide Panel ── */}
        {showGuide && (
          <div style={{
            padding: '16px 22px',
            background: '#fefce8',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>UGC 플라이휠이란?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {STAGES.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} style={{
                    borderRadius: 10, padding: '12px 14px',
                    background: '#fff', border: `1px solid ${s.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 999,
                        background: s.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800,
                      }}>{idx + 1}</span>
                      <Icon style={{ width: 13, height: 13, color: s.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fff', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6, margin: 0 }}>
                <strong>선순환 구조:</strong> UGC 크리에이터가 인플루언서로 전환되면 시딩 캠페인에 재투입되어 더 많은 UGC를 유발합니다.
                이를 통해 광고 소재 비용을 절감하고, 진정성 있는 고객 후기를 활용하여 전환율을 높일 수 있습니다.
                일반적으로 UGC 기반 광고 소재는 브랜드 제작 소재 대비 <strong>CTR 2~4배, CPA 30~50% 절감</strong> 효과가 보고됩니다.
              </p>
            </div>
          </div>
        )}

        {/* ── 4-Stage Flow Diagram ── */}
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const count = stageCounts[stage.key];
              const isActive = activeStage === stage.key;

              return (
                <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <button
                    onClick={() => setActiveStage(stage.key)}
                    style={{
                      flex: 1, cursor: 'pointer', border: 'none',
                      borderRadius: 12,
                      padding: '16px 14px',
                      background: isActive ? stage.bg : 'transparent',
                      outline: isActive ? `2px solid ${stage.color}` : `1px solid transparent`,
                      transition: 'all .2s ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    }}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isActive ? stage.color : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                    }}>
                      <Icon style={{ width: 20, height: 20, color: isActive ? '#fff' : '#94a3b8' }} />
                    </div>
                    {/* Label */}
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? stage.color : '#64748b',
                    }}>{stage.label}</span>
                    {/* Count badge */}
                    <span style={{
                      fontSize: 20, fontWeight: 800, lineHeight: 1,
                      color: isActive ? '#1e293b' : '#94a3b8',
                    }}>{count}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>건</span>
                  </button>

                  {/* Arrow connector */}
                  {idx < STAGES.length - 1 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, flexShrink: 0,
                    }}>
                      <ArrowRight style={{ width: 16, height: 16, color: '#d1d5db' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card,
        overflow: 'hidden',
      }}>
        {/* Tab header */}
        <div style={{
          padding: '10px 22px',
          borderBottom: `1px solid ${tokens.color.border}`,
          background: tokens.color.surfaceMuted,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {(() => { const s = STAGES.find(s => s.key === activeStage); const Icon = s.icon; return (
            <>
              <Icon style={{ width: 15, height: 15, color: s.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{s.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: s.bg, color: s.color,
              }}>{stageCounts[activeStage]}건</span>
            </>
          ); })()}
        </div>

        {/* Content */}
        <div style={{ padding: '18px 22px' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
