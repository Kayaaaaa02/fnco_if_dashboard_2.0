import { useState } from 'react';
import { useUpdateOutreach, useSendOutreach } from '@/hooks/useOutreach';
import EmailPreview from '@/components/outreach/EmailPreview.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Save, Eye, Send, Loader2, Paperclip } from 'lucide-react';

export default function BriefEditor({ outreach, campaignId, brandDna, onClose }) {
  const updateOutreach = useUpdateOutreach();
  const sendOutreach = useSendOutreach();

  const [subject, setSubject] = useState(outreach?.subject || '');
  const [body, setBody] = useState(outreach?.body || '');
  const [showPreview, setShowPreview] = useState(false);

  const outreachId = outreach?.id;

  const handleSave = () => {
    if (!campaignId || !outreachId) return;
    updateOutreach.mutate({
      campaignId,
      outreachId,
      data: { subject, body },
    });
  };

  const handleSend = () => {
    if (!campaignId || !outreachId) return;
    sendOutreach.mutate({ campaignId, outreachId });
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Subject */}
      <div className="space-y-2">
        <label className="text-sm font-medium">제목</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="이메일 제목을 입력해주세요"
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <label className="text-sm font-medium">본문</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="이메일 본문을 작성해주세요..."
          className="min-h-[240px] text-sm leading-relaxed"
        />
      </div>

      {/* Brand guidelines (read-only) */}
      {brandDna && (
        <>
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">브랜드 가이드라인</label>
            <Card className="bg-muted/30">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {typeof brandDna === 'string'
                    ? brandDna
                    : brandDna.guidelines || brandDna.tone || JSON.stringify(brandDna, null, 2)}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Attachments placeholder */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">첨부파일</label>
        <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-4">
          <Paperclip className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            첨부파일 기능은 준비 중입니다
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="size-4" />
            <span>미리보기</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={updateOutreach.isPending}
          >
            {updateOutreach.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>저장</span>
          </Button>
          <Button
            onClick={() => setShowPreview(true)}
            disabled={sendOutreach.isPending}
          >
            <Send className="size-4" />
            <span>발송</span>
          </Button>
        </div>
      </div>

      {/* Email Preview Dialog */}
      <EmailPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        outreach={{
          ...outreach,
          subject,
          body,
        }}
        onSend={handleSend}
        isSending={sendOutreach.isPending}
      />
    </div>
  );
}
