import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Send, X } from 'lucide-react';

export default function EmailPreview({ open, onOpenChange, outreach, onSend, isSending }) {
  const [confirmSend, setConfirmSend] = useState(false);

  const handleSend = () => {
    if (!confirmSend) {
      setConfirmSend(true);
      return;
    }
    setConfirmSend(false);
    onSend?.();
  };

  const handleOpenChange = (value) => {
    if (!value) setConfirmSend(false);
    onOpenChange(value);
  };

  if (!outreach) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>이메일 미리보기</DialogTitle>
          <DialogDescription>발송 전 내용을 확인해주세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">받는 사람</span>
            <p className="text-sm">
              {outreach.influencer_name || '인플루언서'}{' '}
              {outreach.influencer_email && (
                <span className="text-muted-foreground">
                  &lt;{outreach.influencer_email}&gt;
                </span>
              )}
            </p>
          </div>

          <Separator />

          {/* Subject */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">제목</span>
            <p className="text-sm font-semibold">
              {outreach.subject || '(제목 없음)'}
            </p>
          </div>

          <Separator />

          {/* Body */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">본문</span>
            <div className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {outreach.body || '(본문 없음)'}
            </div>
          </div>

          {/* Attachments */}
          {outreach.attachments?.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">첨부파일</span>
                <div className="flex flex-wrap gap-2">
                  {outreach.attachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-muted px-2 py-1 text-xs"
                    >
                      {att.name || att}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
            <span>닫기</span>
          </Button>
          <Button onClick={handleSend} disabled={isSending} variant={confirmSend ? 'destructive' : 'default'}>
            <Send className="size-4" />
            <span>{confirmSend ? '발송 확인' : '발송'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
