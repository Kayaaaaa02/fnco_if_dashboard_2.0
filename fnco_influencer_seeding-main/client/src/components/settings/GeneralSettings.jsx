import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Globe, Palette, Save } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

function SectionCard({ icon, title, desc, children }) {
  const Icon = icon;
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon style={{ width: 15, height: 15, color: tokens.color.textSubtle }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{title}</span>
      </div>
      {desc && <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginBottom: 16 }}>{desc}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginTop: 1 }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export default function GeneralSettings() {
  const [language, setLanguage] = useState('ko');
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div>
      <SectionCard icon={Globe} title="언어 및 지역" desc="인터페이스 언어와 지역 설정을 변경합니다.">
        <SettingRow label="언어">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger style={{ width: 180, height: 36, borderRadius: 8, borderColor: tokens.color.border, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SectionCard>

      <SectionCard icon={Palette} title="화면 설정" desc="테마와 표시 옵션을 설정합니다.">
        <SettingRow label="다크 모드" desc="어두운 색상 테마를 사용합니다">
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </SettingRow>
        <SettingRow label="컴팩트 모드" desc="더 많은 정보를 화면에 표시합니다">
          <Switch checked={compactMode} onCheckedChange={setCompactMode} />
        </SettingRow>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          style={{
            height: 36,
            padding: '0 18px',
            borderRadius: 8,
            border: 'none',
            background: tokens.color.text,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Save style={{ width: 14, height: 14 }} />
          설정 저장
        </button>
      </div>
    </div>
  );
}
