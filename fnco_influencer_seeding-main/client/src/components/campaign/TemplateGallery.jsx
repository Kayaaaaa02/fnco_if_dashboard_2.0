import { useState } from 'react';
import { FileText, Plus, Trash2, Copy, Calendar, Tag } from 'lucide-react';
import { useTemplates, useCreateFromTemplate, useDeleteTemplate } from '@/hooks/useTemplates.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';

const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: '뷰티', label: '뷰티' },
  { value: '패션', label: '패션' },
  { value: '식품', label: '식품' },
  { value: '테크', label: '테크' },
  { value: '라이프스타일', label: '라이프스타일' },
];

const CATEGORY_COLORS = {
  '뷰티': 'bg-pink-100 text-pink-800',
  '패션': 'bg-purple-100 text-purple-800',
  '식품': 'bg-orange-100 text-orange-800',
  '테크': 'bg-blue-100 text-blue-800',
  '라이프스타일': 'bg-green-100 text-green-800',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TemplateGallery({ onSelectTemplate, onClose }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [campaignNameInput, setCampaignNameInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryCategory = categoryFilter === 'all' ? undefined : categoryFilter;
  const { data, isLoading } = useTemplates(queryCategory);
  const createFromTemplate = useCreateFromTemplate();
  const deleteTemplate = useDeleteTemplate();

  const templates = data?.data || [];

  const handleCreateCampaign = async () => {
    if (!previewTemplate) return;
    try {
      const result = await createFromTemplate.mutateAsync({
        templateId: previewTemplate.id,
        campaign_name: campaignNameInput || `${previewTemplate.name} 캠페인`,
      });
      const campaignData = result.data;
      if (onSelectTemplate) {
        onSelectTemplate(campaignData);
      }
      setShowCreateDialog(false);
      setPreviewTemplate(null);
      setCampaignNameInput('');
      if (onClose) onClose();
    } catch (error) {
      // error handled by mutation state
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      if (previewTemplate?.id === deleteTarget.id) {
        setPreviewTemplate(null);
      }
    } catch (error) {
      // error handled by mutation state
    }
  };

  const openCreateDialog = (template) => {
    setCampaignNameInput(`${template.name} 캠페인`);
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-3">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">저장된 템플릿이 없습니다</h3>
          <p className="text-sm text-muted-foreground mt-1">
            캠페인 설정을 템플릿으로 저장하면 여기에 표시됩니다
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setPreviewTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.category && (
                    <Badge
                      variant="secondary"
                      className={CATEGORY_COLORS[template.category] || ''}
                    >
                      {template.category}
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(template.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate && !showCreateDialog} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent style={{ maxWidth: '32rem' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
            {previewTemplate?.description && (
              <DialogDescription>{previewTemplate.description}</DialogDescription>
            )}
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-3 text-sm">
              {previewTemplate.category && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">카테고리:</span>
                  <Badge
                    variant="secondary"
                    className={CATEGORY_COLORS[previewTemplate.category] || ''}
                  >
                    {previewTemplate.category}
                  </Badge>
                </div>
              )}

              {previewTemplate.config && Object.keys(previewTemplate.config).length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium">설정 정보:</span>
                  <div className="bg-muted rounded-lg p-3 space-y-1 text-xs">
                    {previewTemplate.config.brand_cd && (
                      <div><span className="text-muted-foreground">브랜드:</span> {previewTemplate.config.brand_cd}</div>
                    )}
                    {previewTemplate.config.product_name && (
                      <div><span className="text-muted-foreground">제품:</span> {previewTemplate.config.product_name}</div>
                    )}
                    {previewTemplate.config.category && (
                      <div><span className="text-muted-foreground">카테고리:</span> {previewTemplate.config.category}</div>
                    )}
                    {previewTemplate.config.country && (
                      <div><span className="text-muted-foreground">국가:</span> {previewTemplate.config.country}</div>
                    )}
                    {previewTemplate.config.brand_dna && (
                      <div className="mt-2">
                        <div className="text-muted-foreground mb-1">브랜드 DNA:</div>
                        {previewTemplate.config.brand_dna.mission && (
                          <div className="ml-2"><span className="text-muted-foreground">미션:</span> {previewTemplate.config.brand_dna.mission}</div>
                        )}
                        {previewTemplate.config.brand_dna.tone_of_voice && (
                          <div className="ml-2"><span className="text-muted-foreground">톤:</span> {previewTemplate.config.brand_dna.tone_of_voice}</div>
                        )}
                        {previewTemplate.config.brand_dna.visual_style && (
                          <div className="ml-2"><span className="text-muted-foreground">비주얼:</span> {previewTemplate.config.brand_dna.visual_style}</div>
                        )}
                        {previewTemplate.config.brand_dna.key_messages && (
                          <div className="ml-2"><span className="text-muted-foreground">메시지:</span> {previewTemplate.config.brand_dna.key_messages}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>생성일: {formatDate(previewTemplate.created_at)}</span>
                {previewTemplate.created_by && (
                  <span className="ml-2">/ 작성자: {previewTemplate.created_by}</span>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(previewTemplate);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
            <Button
              onClick={() => openCreateDialog(previewTemplate)}
              disabled={createFromTemplate.isPending}
            >
              <Copy className="h-4 w-4 mr-1" />
              이 템플릿으로 캠페인 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent style={{ maxWidth: '28rem' }}>
          <DialogHeader>
            <DialogTitle>템플릿으로 캠페인 생성</DialogTitle>
            <DialogDescription>
              "{previewTemplate?.name}" 템플릿을 기반으로 새 캠페인을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>캠페인 이름</Label>
              <Input
                value={campaignNameInput}
                onChange={(e) => setCampaignNameInput(e.target.value)}
                placeholder="캠페인 이름을 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={createFromTemplate.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              {createFromTemplate.isPending ? '생성 중...' : '캠페인 생성'}
            </Button>
          </DialogFooter>
          {createFromTemplate.isError && (
            <p className="text-sm text-destructive text-center">
              오류: {createFromTemplate.error?.message || '캠페인 생성에 실패했습니다'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent style={{ maxWidth: '24rem' }}>
          <DialogHeader>
            <DialogTitle>템플릿 삭제</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.name}" 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleteTemplate.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
          {deleteTemplate.isError && (
            <p className="text-sm text-destructive text-center">
              오류: {deleteTemplate.error?.message || '삭제에 실패했습니다'}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
