import { useState } from 'react';
import { useAIImages, useGenerateImage, useSaveImage } from '@/hooks/useAIImage';
import { STEP_TIME_RANGES } from '@/lib/aiPlanConstants';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Image as ImageIcon, ImagePlus, Loader2, Save, Wand2 } from 'lucide-react';

export default function TimelineImageGenerator({ planDocId }) {
  const { data: imageData } = useAIImages(planDocId);
  const generateImage = useGenerateImage();
  const saveImage = useSaveImage();
  const [prompts, setPrompts] = useState({
    HOOK: '',
    MIDDLE: '',
    HIGHLIGHT: '',
    CTA: '',
  });
  const [selectedStep, setSelectedStep] = useState(null);

  if (!planDocId) return null;

  const images = imageData?.images || imageData || [];

  const getImageForStep = (stepKey) => {
    if (Array.isArray(images)) {
      return images.find((img) => img.step === stepKey);
    }
    return images[stepKey] || null;
  };

  const handlePromptChange = (stepKey, value) => {
    setPrompts((prev) => ({ ...prev, [stepKey]: value }));
  };

  const handleGenerate = (stepKey) => {
    generateImage.mutate({
      planDocId,
      step: stepKey,
      prompt: prompts[stepKey],
    });
  };

  const handleSave = (stepKey, imageUrl) => {
    saveImage.mutate({ planDocId, step: stepKey, imageUrl });
  };

  const selectedStepData = selectedStep
    ? STEP_TIME_RANGES.find((s) => s.key === selectedStep)
    : null;
  const selectedImage = selectedStep ? getImageForStep(selectedStep) : null;

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-blue-500" />
        <h3 className="text-base font-semibold">타임라인 이미지 생성</h3>
      </div>

      {/* 4-step 수평 타임라인 */}
      <div className="grid grid-cols-4 gap-2">
        {STEP_TIME_RANGES.map((step) => {
          const stepImage = getImageForStep(step.key);
          const isActive = selectedStep === step.key;

          return (
            <Card
              key={step.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() =>
                setSelectedStep(isActive ? null : step.key)
              }
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {step.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {step.range}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>

                {/* 이미지 프리뷰 또는 플레이스홀더 */}
                {stepImage?.imageUrl || stepImage?.url ? (
                  <img
                    src={stepImage.imageUrl || stepImage.url}
                    alt={step.label}
                    className="h-20 w-full object-cover rounded"
                  />
                ) : (
                  <div className="h-20 w-full flex items-center justify-center rounded border-2 border-dashed border-muted-foreground/25">
                    <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 선택된 스텝 상세 */}
      {selectedStepData && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge>{selectedStepData.label}</Badge>
              <span className="text-sm text-muted-foreground">
                {selectedStepData.range}
              </span>
            </div>

            <Textarea
              value={prompts[selectedStep]}
              onChange={(e) =>
                handlePromptChange(selectedStep, e.target.value)
              }
              placeholder="이미지 생성 프롬프트를 입력하세요..."
              rows={3}
              className="resize-y text-sm"
            />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleGenerate(selectedStep)}
                disabled={
                  !prompts[selectedStep]?.trim() ||
                  generateImage.isPending
                }
              >
                {generateImage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                이미지 생성
              </Button>

              {(selectedImage?.imageUrl || selectedImage?.url) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleSave(
                      selectedStep,
                      selectedImage.imageUrl || selectedImage.url,
                    )
                  }
                  disabled={saveImage.isPending}
                >
                  {saveImage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  저장
                </Button>
              )}
            </div>

            {/* 생성된 이미지 프리뷰 */}
            {(selectedImage?.imageUrl || selectedImage?.url) && (
              <div className="mt-2">
                <img
                  src={selectedImage.imageUrl || selectedImage.url}
                  alt={`${selectedStepData.label} 생성 이미지`}
                  className="w-full max-h-64 object-contain rounded-md border"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
