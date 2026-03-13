import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Loader2 } from 'lucide-react';
import { useInfluencerDeepAnalysis } from '@/hooks/useInfluencerPool.js';
import { formatCompactNumber, getPlatformMeta, tokens } from '@/styles/designTokens.js';
import OverviewTab from './OverviewTab.jsx';
import ContentAnalysisTab from './ContentAnalysisTab.jsx';
import BestPlanTab from './BestPlanTab.jsx';

export default function CreatorDeepAnalysis({ creator, open, onOpenChange }) {
  const profileId = creator?.id ?? creator?.profile_id ?? null;
  const { data: analysisResponse, isLoading, isError } = useInfluencerDeepAnalysis(profileId);

  const analysisData = analysisResponse?.data ?? analysisResponse?.analysis ?? analysisResponse ?? null;
  const platform = creator ? getPlatformMeta(creator.platform) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:w-[700px] !max-w-[700px] flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b px-5 py-4" style={{ borderColor: tokens.color.border }}>
          {creator ? (
            <>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg" style={{ color: tokens.color.text }}>
                    {creator.name}
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 flex items-center gap-2">
                    <span style={{ color: tokens.color.textSubtle }}>{creator.handle}</span>
                    {platform && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: platform.soft, color: platform.color }}
                      >
                        {platform.label}
                      </span>
                    )}
                  </SheetDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                    {formatCompactNumber(creator.followers)}
                  </p>
                  <p className="text-xs" style={{ color: tokens.color.textSubtle }}>\uD314\uB85C\uC6CC</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <SheetTitle style={{ color: tokens.color.text }}>\uC2EC\uCE35 \uBD84\uC11D</SheetTitle>
              <SheetDescription>\uD06C\uB9AC\uC5D0\uC774\uD130\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694</SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: tokens.color.primary }} />
              <p className="text-sm" style={{ color: tokens.color.textSubtle }}>
                \uC2EC\uCE35 \uBD84\uC11D \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...
              </p>
            </div>
          ) : isError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
              <p className="text-sm font-medium" style={{ color: tokens.color.danger }}>
                \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4
              </p>
              <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                AI \uC2EC\uCE35 \uBD84\uC11D\uC744 \uC2E4\uD589\uD55C \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694
              </p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="flex h-full flex-col">
              <TabsList className="mx-5 mt-3 shrink-0">
                <TabsTrigger value="overview">\uAC1C\uC694</TabsTrigger>
                <TabsTrigger value="content">\uCF58\uD150\uCE20 \uBD84\uC11D</TabsTrigger>
                <TabsTrigger value="plan">Best \uAE30\uD68D\uC548</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="px-5 py-4">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab data={analysisData} creator={creator} />
                  </TabsContent>
                  <TabsContent value="content" className="mt-0">
                    <ContentAnalysisTab data={analysisData} creator={creator} />
                  </TabsContent>
                  <TabsContent value="plan" className="mt-0">
                    <BestPlanTab data={analysisData} creator={creator} />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
