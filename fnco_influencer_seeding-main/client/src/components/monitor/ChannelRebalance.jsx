import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Check, X } from 'lucide-react';

const channelColors = {
  'Instagram Reels': { bar: 'bg-pink-500', text: 'text-pink-700' },
  'YouTube Shorts': { bar: 'bg-red-500', text: 'text-red-700' },
  'TikTok': { bar: 'bg-gray-600', text: 'text-gray-700' },
  'Blog': { bar: 'bg-green-500', text: 'text-green-700' },
};

function getChannelColor(channel) {
  return channelColors[channel] || { bar: 'bg-blue-500', text: 'text-blue-700' };
}

export default function ChannelRebalance({ action, onApply, onDismiss }) {
  if (!action) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p className="text-sm">채널 리밸런싱 추천이 없습니다</p>
      </div>
    );
  }

  const rec = action.recommendation || {};
  const channels = rec.channels || [];
  const isResolved = action.status !== 'pending';

  return (
    <div className={`space-y-4 ${isResolved ? 'opacity-50' : ''}`}>
      {isResolved && (
        <Badge variant="secondary" className="text-xs">
          {action.status === 'applied' ? '적용됨' : '무시됨'}
        </Badge>
      )}

      {/* Stacked bar comparison header */}
      <div className="grid grid-cols-[140px_1fr_1fr_60px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>채널</span>
        <span>현재 배분</span>
        <span>추천 배분</span>
        <span className="text-right">ROI</span>
      </div>

      {/* Channel rows */}
      {channels.map((ch) => {
        const color = getChannelColor(ch.channel);
        const diff = ch.recommended_pct - ch.current_pct;

        return (
          <div key={ch.channel} className="space-y-1">
            <div className="grid grid-cols-[140px_1fr_1fr_60px] gap-2 items-center">
              {/* Channel name */}
              <span className={`text-sm font-medium ${color.text}`}>{ch.channel}</span>

              {/* Current bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-sm transition-all"
                    style={{ width: `${ch.current_pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{ch.current_pct}%</span>
              </div>

              {/* Recommended bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${color.bar} rounded-sm transition-all`}
                    style={{ width: `${ch.recommended_pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {ch.recommended_pct}%
                </span>
              </div>

              {/* ROI badge */}
              <div className="text-right">
                <Badge variant="outline" className="text-xs">
                  {ch.roi_score}
                </Badge>
              </div>
            </div>

            {/* Reason + diff */}
            <div className="flex items-center gap-2 pl-[140px]">
              <span className="text-xs text-muted-foreground">{ch.reason}</span>
              {diff !== 0 && (
                <span className={`text-xs font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({diff > 0 ? '+' : ''}{diff}%p)
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Horizontal stacked bar comparison */}
      <div className="space-y-2 pt-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">현재 배분</p>
          <div className="flex h-6 rounded-md overflow-hidden">
            {channels.map((ch) => (
              <div
                key={ch.channel}
                className="h-full bg-gray-400 border-r border-white last:border-r-0 flex items-center justify-center"
                style={{ width: `${ch.current_pct}%` }}
              >
                {ch.current_pct >= 15 && (
                  <span className="text-[10px] text-white font-medium">{ch.current_pct}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">추천 배분</p>
          <div className="flex h-6 rounded-md overflow-hidden">
            {channels.map((ch) => {
              const color = getChannelColor(ch.channel);
              return (
                <div
                  key={ch.channel}
                  className={`h-full ${color.bar} border-r border-white last:border-r-0 flex items-center justify-center`}
                  style={{ width: `${ch.recommended_pct}%` }}
                >
                  {ch.recommended_pct >= 15 && (
                    <span className="text-[10px] text-white font-medium">{ch.recommended_pct}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onApply?.(action.action_id)}
          >
            <Check className="size-3.5 mr-1" />
            리밸런싱 적용
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDismiss?.(action.action_id)}
          >
            <X className="size-3.5 mr-1" />
            무시
          </Button>
        </div>
      )}
    </div>
  );
}
