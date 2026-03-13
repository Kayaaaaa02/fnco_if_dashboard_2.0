import { useState, useRef } from 'react';
import { useUploadProduct } from '@/hooks/useAIPlan';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Upload, X, Loader2, FileUp } from 'lucide-react';

export default function ProductUploadDialog({ open, onOpenChange, campaignId }) {
  const [file, setFile] = useState(null);
  const [productUrl, setProductUrl] = useState('');
  const fileInputRef = useRef(null);
  const uploadProduct = useUploadProduct();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] || null;
    setFile(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (productUrl.trim()) formData.append('productUrl', productUrl.trim());
    if (campaignId) formData.append('campaignId', campaignId);

    uploadProduct.mutate(formData, {
      onSuccess: () => {
        setFile(null);
        setProductUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onOpenChange(false);
      },
    });
  };

  const canSubmit = (file || productUrl.trim()) && !uploadProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            제품 분석용 파일 업로드
          </DialogTitle>
          <DialogDescription>
            제품 이미지, 상세페이지 캡처, 또는 제품 URL을 입력하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 파일 드롭 영역 */}
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {file ? (
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  파일을 드래그하거나 클릭하여 선택
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* URL 입력 */}
          <div className="space-y-2">
            <Label htmlFor="product-url">또는 제품 URL 입력</Label>
            <Input
              id="product-url"
              type="url"
              placeholder="https://..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadProduct.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {uploadProduct.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                분석 중...
              </>
            ) : (
              '분석 시작'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
