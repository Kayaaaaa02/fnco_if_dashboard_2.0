import { useState } from 'react';
import { useGenerateImages, useSelectImages } from '@/hooks/useCreatives';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Loader2, ImagePlus, Save, Check } from 'lucide-react';

export default function ImageGenerator({ creative, campaignId }) {
  const creativeId = creative?.id;
  const scenario = creative?.scenario;
  const steps = scenario?.steps || [];
  const images = creative?.generated_images || {};

  const generateImages = useGenerateImages();
  const selectImages = useSelectImages();

  const [activeStep, setActiveStep] = useState(1);
  const [selections, setSelections] = useState(creative?.selected_images || {});

  const stepImages = images[`step_${activeStep}`] || [];

  const handleGenerate = () => {
    if (!campaignId || !creativeId) return;
    generateImages.mutate({ campaignId, creativeId });
  };

  const handleToggleSelect = (imageUrl) => {
    setSelections((prev) => {
      const stepKey = `step_${activeStep}`;
      const current = prev[stepKey] || [];
      const exists = current.includes(imageUrl);
      return {
        ...prev,
        [stepKey]: exists
          ? current.filter((u) => u !== imageUrl)
          : [...current, imageUrl],
      };
    });
  };

  const handleSaveSelections = () => {
    if (!campaignId || !creativeId) return;
    selectImages.mutate({ campaignId, creativeId, selections });
  };

  const isSelected = (imageUrl) => {
    const stepKey = `step_${activeStep}`;
    return (selections[stepKey] || []).includes(imageUrl);
  };

  const stepCount = steps.length || 4;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">AI 이미지 생성</h3>
      </div>

      {/* Step selector tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {Array.from({ length: stepCount }, (_, i) => i + 1).map((stepNum) => (
          <button
            key={stepNum}
            onClick={() => setActiveStep(stepNum)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStep === stepNum
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Step {stepNum}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generateImages.isPending}
        className="w-full"
        variant="outline"
      >
        {generateImages.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        <span>이미지 생성</span>
      </Button>

      {/* Generated images grid */}
      {stepImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {stepImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleToggleSelect(img.url || img)}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                isSelected(img.url || img)
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-transparent hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex h-full w-full items-center justify-center bg-muted/50">
                <img
                  src={img.url || img || '/placeholder-image.png'}
                  alt={`Step ${activeStep} - ${idx + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML =
                      '<div class="flex h-full w-full items-center justify-center text-muted-foreground text-xs">이미지</div>';
                  }}
                />
              </div>
              {isSelected(img.url || img) && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                  <Check className="size-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30"
            >
              <span className="text-xs text-muted-foreground">이미지 {n}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selected count + save */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          선택됨: {(selections[`step_${activeStep}`] || []).length}개
        </span>
        <Button
          variant="default"
          size="sm"
          onClick={handleSaveSelections}
          disabled={selectImages.isPending}
        >
          {selectImages.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          <span>선택 저장</span>
        </Button>
      </div>
    </div>
  );
}
