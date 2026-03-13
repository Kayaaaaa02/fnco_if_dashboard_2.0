import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const PROFILE_FIELDS = [
  { key: 'age', label: '연령대' },
  { key: 'gender', label: '성별' },
  { key: 'occupation', label: '직업' },
  { key: 'interests', label: '관심사', isArray: true },
  { key: 'pain_points', label: '고민', isArray: true },
  { key: 'media_usage', label: '주 이용 미디어', isArray: true },
  { key: 'purchase_behavior', label: '구매 행동' },
];

export default function PersonaEditor({ persona, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const handleStartEdit = () => {
    setDraft({
      name: persona.name || '',
      profile_json: { ...persona.profile_json },
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate?.({ ...persona, ...draft });
    setIsEditing(false);
    setDraft(null);
  };

  const handleProfileChange = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      profile_json: { ...prev.profile_json, [key]: value },
    }));
  };

  const profile = isEditing ? draft?.profile_json : persona.profile_json || {};

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#7c3aed', color: '#fff', flexShrink: 0 }}>
            {persona.code || 'P?'}
          </span>
          {isEditing ? (
            <Input
              value={draft?.name || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              className="h-7 text-xs font-semibold"
              style={{ maxWidth: 130 }}
              placeholder="페르소나 이름"
            />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {persona.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
                <Check style={{ width: 13, height: 13, color: '#16a34a' }} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
                <X style={{ width: 13, height: 13, color: tokens.color.textSubtle }} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleStartEdit}>
                <Pencil style={{ width: 13, height: 13, color: tokens.color.textSubtle }} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete?.(persona)}>
                <Trash2 style={{ width: 13, height: 13, color: '#dc2626' }} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PROFILE_FIELDS.map(({ key, label, isArray }) => {
          const raw = profile[key];
          const displayValue = isArray
            ? (Array.isArray(raw) ? raw.join(', ') : (raw || ''))
            : (raw || '');
          return (
            <div key={key} style={{ display: 'flex', alignItems: isArray ? 'flex-start' : 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: tokens.color.textSubtle, width: 80, flexShrink: 0, paddingTop: isArray ? 2 : 0 }}>{label}</span>
              {isEditing ? (
                <Input
                  value={displayValue}
                  onChange={(e) => {
                    const val = isArray
                      ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      : e.target.value;
                    handleProfileChange(key, val);
                  }}
                  className="h-6 text-xs flex-1"
                  placeholder={isArray ? `콤마로 구분 (예: 항목1, 항목2)` : label}
                />
              ) : (
                <span style={{ fontSize: 11, fontWeight: 500, color: tokens.color.text, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {displayValue || '-'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
