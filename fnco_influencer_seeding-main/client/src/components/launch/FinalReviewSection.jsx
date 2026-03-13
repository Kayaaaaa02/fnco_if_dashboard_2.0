import { useState } from 'react';
import { useProductAnalysis, useRefinedData } from '@/hooks/useAIPlan';
import { useAIImages } from '@/hooks/useAIImage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import {
  ClipboardCheck,
  FileDown,
  Loader2,
  Package,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

export default function FinalReviewSection({ planDocId, campaignId }) {
  const { data: analysisData } = useProductAnalysis(planDocId);
  const { data: refinedData } = useRefinedData(planDocId);
  const { data: imageData } = useAIImages(planDocId);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  if (!planDocId) return null;

  // 분석 요약 텍스트 (100자 제한)
  const summaryText = analysisData?.summary || '';
  const truncatedSummary =
    summaryText.length > 100 ? summaryText.slice(0, 100) + '...' : summaryText;

  // 완료된 섹션 수
  const refinedSections = refinedData?.data || {};
  const sectionCount = Object.keys(refinedSections).filter(
    (key) => refinedSections[key] != null && refinedSections[key] !== '',
  ).length;

  // 생성된 이미지 수
  const images = Array.isArray(imageData?.images || imageData)
    ? (imageData?.images || imageData)
    : [];
  const imageCount = images.length;

  const handleExportPPT = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();

      // 타이틀 슬라이드
      const titleSlide = pptx.addSlide();
      titleSlide.addText(`AI Plan - 캠페인 #${campaignId}`, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 2,
        fontSize: 28,
        bold: true,
        align: 'center',
        color: '333333',
      });
      titleSlide.addText('AI 플랜 최종 리뷰', {
        x: 1,
        y: 3.5,
        w: 8,
        h: 1,
        fontSize: 16,
        align: 'center',
        color: '666666',
      });

      // 분석 슬라이드
      if (summaryText) {
        const analysisSlide = pptx.addSlide();
        analysisSlide.addText('제품 분석 요약', {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 20,
          bold: true,
          color: '333333',
        });
        analysisSlide.addText(summaryText, {
          x: 0.5,
          y: 1.3,
          w: 9,
          h: 4,
          fontSize: 12,
          color: '555555',
          valign: 'top',
        });
      }

      // 정제 섹션 슬라이드
      const sectionKeys = Object.keys(refinedSections);
      for (const key of sectionKeys) {
        const value = refinedSections[key];
        if (value == null || value === '') continue;
        const sectionSlide = pptx.addSlide();
        sectionSlide.addText(key, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 20,
          bold: true,
          color: '333333',
        });
        const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        sectionSlide.addText(text, {
          x: 0.5,
          y: 1.3,
          w: 9,
          h: 4,
          fontSize: 11,
          color: '555555',
          valign: 'top',
        });
      }

      // 이미지 슬라이드
      for (const img of images) {
        const imgSlide = pptx.addSlide();
        const imgUrl = img.imageUrl || img.url;
        const label = img.step || '이미지';
        imgSlide.addText(label, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 18,
          bold: true,
          color: '333333',
        });
        if (imgUrl) {
          try {
            imgSlide.addImage({
              path: imgUrl,
              x: 1,
              y: 1.5,
              w: 8,
              h: 4,
            });
          } catch {
            imgSlide.addText('이미지를 불러올 수 없습니다', {
              x: 1,
              y: 2.5,
              w: 8,
              h: 1,
              fontSize: 12,
              color: '999999',
              align: 'center',
            });
          }
        }
      }

      await pptx.writeFile({ fileName: `AI-Plan-${campaignId}.pptx` });
    } catch (err) {
      console.error('PPT export failed:', err);
      setExportError('PPT 내보내기에 실패했습니다');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-green-600" />
          AI 플랜 최종 리뷰
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 3열 요약 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-dashed">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                제품 분석
              </div>
              <p className="text-sm">
                {truncatedSummary || '분석 데이터 없음'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                콘텐츠 전략
              </div>
              <p className="text-sm">
                <Badge variant="secondary">{sectionCount}</Badge>
                <span className="ml-1">개 섹션 완료</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                이미지 생성
              </div>
              <p className="text-sm">
                <Badge variant="secondary">{imageCount}</Badge>
                <span className="ml-1">장 생성됨</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* PPT 내보내기 */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleExportPPT}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            {exporting ? '내보내는 중...' : 'PPT 내보내기'}
          </Button>

          {exportError && (
            <p className="text-sm text-destructive">{exportError}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          최종 검토 후 론칭을 진행하세요
        </p>
      </CardContent>
    </Card>
  );
}
