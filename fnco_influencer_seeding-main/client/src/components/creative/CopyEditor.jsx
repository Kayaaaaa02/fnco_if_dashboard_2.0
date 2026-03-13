import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Copy, RefreshCw } from 'lucide-react';

const TONE_COLORS = {
  casual: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  emotional: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  humorous: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  informative: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export default function CopyEditor({ creative, onUpdate }) {
  const [copyText, setCopyText] = useState(creative?.copy_text || '');

  const variants = creative?.copy_variants || [];

  const handleCopyChange = (value) => {
    setCopyText(value);
    onUpdate?.({ copy_text: value });
  };

  const handleSelectVariant = (variantText) => {
    setCopyText(variantText);
    onUpdate?.({ copy_text: variantText });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">카피 편집</h3>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          <Copy className="size-3.5" />
          <span>복사</span>
        </Button>
      </div>

      {/* Main copy textarea */}
      <Textarea
        value={copyText}
        onChange={(e) => handleCopyChange(e.target.value)}
        placeholder="메인 카피를 작성해주세요..."
        className="min-h-[160px] text-sm leading-relaxed"
      />

      {/* AI Variants */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">AI 변형</h4>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" disabled>
              <RefreshCw className="size-3.5" />
              <span>변형 더 생성</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {variants.map((variant, idx) => (
              <Card
                key={idx}
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
                onClick={() => handleSelectVariant(variant.text)}
              >
                <CardContent className="py-3 px-4 space-y-2">
                  <p className="text-xs leading-relaxed text-foreground line-clamp-3">
                    {variant.text}
                  </p>
                  {variant.tone && (
                    <Badge className={`border-transparent text-[10px] ${TONE_COLORS[variant.tone] || 'bg-muted text-muted-foreground'}`}>
                      {variant.tone}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
