import { useState } from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Plus, Trash2, GripVertical } from 'lucide-react';

function createEmptyStep(number) {
  return {
    step: number,
    time_range: '',
    visual: '',
    audio: '',
    emotion: '',
    cta: '',
  };
}

export default function ScenarioEditor({ creative, onUpdate }) {
  const initialSteps = creative?.scenario?.steps?.length
    ? creative.scenario.steps
    : [createEmptyStep(1)];

  const [steps, setSteps] = useState(initialSteps);

  const updateSteps = (newSteps) => {
    setSteps(newSteps);
    onUpdate?.({ scenario: { ...creative?.scenario, steps: newSteps } });
  };

  const handleStepChange = (index, field, value) => {
    const updated = steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    updateSteps(updated);
  };

  const addStep = () => {
    const newStep = createEmptyStep(steps.length + 1);
    updateSteps([...steps, newStep]);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) return;
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step: i + 1 }));
    updateSteps(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">시나리오 편집</h3>
        <Button variant="outline" size="sm" onClick={addStep}>
          <Plus className="size-3.5" />
          <span>단계 추가</span>
        </Button>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div
              key={idx}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              {/* Step header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="size-4 text-muted-foreground/50" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.step}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    단계 {step.step}
                  </span>
                </div>
                {steps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeStep(idx)}
                  >
                    <Trash2 className="size-3.5" />
                    <span>삭제</span>
                  </Button>
                )}
              </div>

              {/* Step fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Time range */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">시간 범위</label>
                  <Input
                    value={step.time_range}
                    onChange={(e) => handleStepChange(idx, 'time_range', e.target.value)}
                    placeholder="예: 0-3s"
                    className="text-sm"
                  />
                </div>

                {/* Emotion */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">감정</label>
                  <Input
                    value={step.emotion}
                    onChange={(e) => handleStepChange(idx, 'emotion', e.target.value)}
                    placeholder="예: 호기심, 기대감"
                    className="text-sm"
                  />
                </div>

                {/* Visual description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">영상 설명</label>
                  <Textarea
                    value={step.visual}
                    onChange={(e) => handleStepChange(idx, 'visual', e.target.value)}
                    placeholder="이 단계의 비주얼을 설명해주세요..."
                    className="min-h-[60px] text-sm"
                  />
                </div>

                {/* Audio description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">오디오 / 나레이션</label>
                  <Textarea
                    value={step.audio}
                    onChange={(e) => handleStepChange(idx, 'audio', e.target.value)}
                    placeholder="이 단계의 오디오 / 나레이션을 설명해주세요..."
                    className="min-h-[60px] text-sm"
                  />
                </div>

                {/* CTA - only last step */}
                {isLast && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">CTA (행동 유도)</label>
                    <Input
                      value={step.cta}
                      onChange={(e) => handleStepChange(idx, 'cta', e.target.value)}
                      placeholder="예: 지금 바로 구매하기"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
