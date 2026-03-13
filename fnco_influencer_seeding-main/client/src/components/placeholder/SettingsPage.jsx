import { useState } from 'react';
import { Settings, Dna, Brain, Shield, Building2 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import GeneralSettings from '@/components/settings/GeneralSettings.jsx';
import BrandDNA from '@/components/settings/BrandDNA.jsx';
import PDAManager from '@/components/settings/PDAManager.jsx';
import AccessManagement from '@/components/settings/AccessManagement.jsx';
import TeamSettings from '@/components/settings/TeamSettings.jsx';

const TABS = [
  { value: 'general', label: '일반', icon: Settings },
  { value: 'brand', label: '브랜드 DNA', icon: Dna },
  { value: 'pda', label: 'P.D.A.', icon: Brain },
  { value: 'access', label: '권한 관리', icon: Shield },
  { value: 'team', label: '팀 관리', icon: Building2 },
];

const TAB_CONTENT = {
  general: GeneralSettings,
  brand: BrandDNA,
  pda: PDAManager,
  access: AccessManagement,
  team: TeamSettings,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const ActiveComponent = TAB_CONTENT[activeTab];

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>설정</h1>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 3 }}>시스템 설정 및 브랜드 관리를 구성합니다.</p>
      </div>

      {/* Underline tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${tokens.color.border}`, marginBottom: 24 }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? tokens.color.text : tokens.color.textSubtle,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${tokens.color.text}` : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color .15s, border-color .15s',
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <ActiveComponent />
    </div>
  );
}
