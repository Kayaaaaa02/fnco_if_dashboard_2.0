import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

// linked_products가 문자열/배열 어느 형태든 배열로 정규화
function normalizeLinkedProducts(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export default function DesireEditor({ desire, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const handleStartEdit = () => {
    setDraft({
      name: desire.name || '',
      definition: desire.definition || '',
      emotion_trigger: desire.emotion_trigger || '',
      linked_products: normalizeLinkedProducts(desire.linked_products),
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate?.({ ...desire, ...draft });
    setIsEditing(false);
    setDraft(null);
  };

  const handleLinkedProductsChange = (value) => {
    setDraft((prev) => ({
      ...prev,
      linked_products: value.split(',').map((s) => s.trim()).filter(Boolean),
    }));
  };

  const data = isEditing ? draft : desire;

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
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#d97706', color: '#fff', flexShrink: 0 }}>
            {desire.code || 'D?'}
          </span>
          {isEditing ? (
            <Input
              value={draft?.name || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              className="h-7 text-xs font-semibold"
              style={{ maxWidth: 130 }}
              placeholder="욕구 이름"
            />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {desire.name}
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
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete?.(desire)}>
                <Trash2 style={{ width: 13, height: 13, color: '#dc2626' }} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Definition */}
        <div>
          <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginBottom: 2 }}>정의</p>
          {isEditing ? (
            <Textarea
              value={data?.definition || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, definition: e.target.value }))}
              className="text-xs min-h-12"
              placeholder="욕구에 대한 정의"
            />
          ) : (
            <p style={{ fontSize: 11, fontWeight: 500, color: tokens.color.text, lineHeight: 1.5, wordBreak: 'break-word' }}>{data?.definition || '-'}</p>
          )}
        </div>

        {/* Emotion Trigger */}
        <div>
          <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginBottom: 2 }}>감정 트리거</p>
          {isEditing ? (
            <Input
              value={data?.emotion_trigger || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, emotion_trigger: e.target.value }))}
              className="h-6 text-xs"
              placeholder="감정 트리거"
            />
          ) : (
            <p style={{ fontSize: 11, fontWeight: 500, color: tokens.color.text, wordBreak: 'break-word' }}>{data?.emotion_trigger || '-'}</p>
          )}
        </div>

        {/* Linked Products */}
        <div>
          <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginBottom: 3 }}>연관 제품</p>
          {isEditing ? (
            <Input
              value={normalizeLinkedProducts(data?.linked_products).join(', ')}
              onChange={(e) => handleLinkedProductsChange(e.target.value)}
              className="h-6 text-xs"
              placeholder="콤마로 구분 (예: 세럼, 크림)"
            />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {normalizeLinkedProducts(data?.linked_products).map((product, idx) => (
                <span
                  key={idx}
                  style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 999, background: '#fef3c7', color: '#92400e' }}
                >
                  {product}
                </span>
              ))}
              {(!data?.linked_products || data.linked_products.length === 0) && (
                <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>-</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
