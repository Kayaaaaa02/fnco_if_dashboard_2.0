import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useOptimizations, useGenerateOptimizations, useApplyOptimization } from '@/hooks/useOptimization.js';
import CreativeRotation from '@/components/monitor/CreativeRotation.jsx';
import ChannelRebalance from '@/components/monitor/ChannelRebalance.jsx';
import MessagePivot from '@/components/monitor/MessagePivot.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible.jsx';
import { Zap, Sparkles, Loader2, RefreshCw, BarChart3, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function OptimizationPanel() {
  const { id: campaignId } = useParams();
  const { data: result, isLoading } = useOptimizations(campaignId);
  const generateMut = useGenerateOptimizations();
  const applyMut = useApplyOptimization();

  const [openSections, setOpenSections] = useState({
    creative: true,
    channel: true,
    message: true,
  });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const actions = result?.data || [];

  // Group actions by type
  const grouped = useMemo(() => {
    const creative = actions.filter((a) => a.action_type === 'creative_rotation');
    const channel = actions.find((a) => a.action_type === 'channel_rebalance') || null;
    const message = actions.find((a) => a.action_type === 'message_pivot') || null;
    return { creative, channel, message };
  }, [actions]);

  // Pending counts
  const pendingCounts = useMemo(() => ({
    creative: grouped.creative.filter((a) => a.status === 'pending').length,
    channel: grouped.channel?.status === 'pending' ? 1 : 0,
    message: grouped.message?.status === 'pending' ? 1 : 0,
  }), [grouped]);

  const handleGenerate = () => {
    generateMut.mutate(campaignId);
  };

  const handleApply = (actionId) => {
    applyMut.mutate({ campaignId, actionId, status: 'applied', applied_by: 'user' });
  };

  const handleDismiss = (actionId) => {
    applyMut.mutate({ campaignId, actionId, status: 'dismissed', applied_by: 'user' });
  };

  const sections = [
    {
      key: 'creative',
      icon: RefreshCw,
      label: '콘텐츠 교체',
      count: pendingCounts.creative,
      content: (
        <CreativeRotation
          actions={grouped.creative}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      ),
    },
    {
      key: 'channel',
      icon: BarChart3,
      label: '채널 리밸런싱',
      count: pendingCounts.channel,
      content: (
        <ChannelRebalance
          action={grouped.channel}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      ),
    },
    {
      key: 'message',
      icon: MessageSquare,
      label: '메시지 피봇',
      count: pendingCounts.message,
      content: (
        <MessagePivot
          action={grouped.message}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      ),
    },
  ];

  const hasAnyActions = actions.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-amber-500" />
            <CardTitle className="text-base">실시간 최적화</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMut.isPending}
          >
            {generateMut.isPending ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="size-4 mr-1" />
            )}
            최적화 추천 생성
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasAnyActions ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Zap className="size-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">최적화 추천을 생성하여 캠페인 성과를 개선하세요</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              const isOpen = openSections[section.key];

              return (
                <div key={section.key}>
                  {idx > 0 && <Separator className="my-2" />}
                  <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.key)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-1 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{section.label}</span>
                        {section.count > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {section.count}
                          </Badge>
                        )}
                      </div>
                      {isOpen ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 pb-1">
                      {section.content}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
