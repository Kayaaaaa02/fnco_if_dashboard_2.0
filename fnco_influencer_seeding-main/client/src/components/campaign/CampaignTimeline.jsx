import { useMemo } from 'react';
import { tokens } from '@/styles/designTokens.js';
import { CalendarRange } from 'lucide-react';

const STATUS_BAR_COLORS = {
  active: { bg: '#3b82f6', light: '#dbeafe' },
  draft: { bg: '#94a3b8', light: '#f1f5f9' },
  completed: { bg: '#10b981', light: '#d1fae5' },
  archived: { bg: '#ef4444', light: '#fee2e2' },
};

/**
 * Build an array of { year, month, weeks } covering [rangeStart, rangeEnd].
 * Each week cell is 7 days wide.
 */
function buildMonthWeeks(rangeStart, rangeEnd) {
  const months = [];
  const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0);

  while (cur <= end) {
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const weekCount = Math.ceil(lastDay / 7);
    months.push({ year, month, weekCount });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function daysBetween(a, b) {
  return (b - a) / 86400000;
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function CampaignTimeline({ campaigns = [] }) {
  const withDates = useMemo(
    () =>
      campaigns
        .filter((c) => c.scheduled_start && c.scheduled_end)
        .map((c) => ({
          ...c,
          _start: new Date(c.scheduled_start),
          _end: new Date(c.scheduled_end),
        }))
        .sort((a, b) => a._start - b._start),
    [campaigns]
  );

  const { months, rangeStart } = useMemo(() => {
    if (withDates.length === 0) return { months: [], rangeStart: new Date() };
    const earliest = new Date(Math.min(...withDates.map((c) => c._start)));
    const latest = new Date(Math.max(...withDates.map((c) => c._end)));
    // Pad 1 month before and after
    const padStart = new Date(earliest.getFullYear(), earliest.getMonth() - 1, 1);
    const padEnd = new Date(latest.getFullYear(), latest.getMonth() + 2, 0);
    const m = buildMonthWeeks(padStart, padEnd);
    return { months: m, rangeStart: padStart };
  }, [withDates]);

  const today = new Date();

  if (withDates.length === 0) return null;

  const LABEL_WIDTH = 180;
  const totalDays = daysBetween(rangeStart, new Date(months[months.length - 1].year, months[months.length - 1].month + 1, 0));

  // percentage-based positioning to fill 100% width
  function dayToPercent(date) {
    const d = daysBetween(rangeStart, date);
    return (d / totalDays) * 100;
  }

  const todayPercent = dayToPercent(today);
  const todayInRange = todayPercent >= 0 && todayPercent <= 100;

  return (
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 'var(--fnco-radius-md)',
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* Section title */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px',
        borderBottom: `1px solid ${tokens.color.border}`,
      }}>
        <CalendarRange style={{ width: 15, height: 15, color: tokens.color.textSubtle }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>캠페인 타임라인</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 999,
          background: tokens.color.surfaceMuted, color: tokens.color.textSubtle,
        }}>
          {withDates.length}개
        </span>
      </div>

      {/* Timeline area - full width */}
      <div>
        <div style={{ display: 'flex' }}>
          {/* Left labels column */}
          <div style={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: `1px solid ${tokens.color.border}` }}>
            {/* Spacer for header rows */}
            <div style={{ height: 44 }} />
            {/* Campaign labels */}
            {withDates.map((c) => (
              <div
                key={c.campaign_id}
                style={{
                  height: 32, display: 'flex', alignItems: 'center',
                  padding: '0 14px', gap: 6,
                  borderTop: `1px solid ${tokens.color.border}`,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: 999, flexShrink: 0,
                  background: (STATUS_BAR_COLORS[c.status] || STATUS_BAR_COLORS.draft).bg,
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 600, color: tokens.color.text, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.campaign_name}
                </span>
              </div>
            ))}
          </div>

          {/* Right: grid area */}
          <div style={{ position: 'relative', flex: 1 }}>
            {/* Month header row */}
            <div style={{ display: 'flex', height: 22 }}>
              {months.map((mo) => (
                <div
                  key={`${mo.year}-${mo.month}`}
                  style={{
                    flex: mo.weekCount,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: tokens.color.text,
                    borderRight: `1px solid ${tokens.color.border}`,
                    borderBottom: `1px solid ${tokens.color.border}`,
                    background: tokens.color.surfaceMuted,
                  }}
                >
                  {mo.month === 0 ? `${mo.year} ` : ''}{MONTH_LABELS[mo.month]}
                </div>
              ))}
            </div>

            {/* Week sub-header row with dates */}
            <div style={{ display: 'flex', height: 22 }}>
              {months.map((mo) =>
                Array.from({ length: mo.weekCount }, (_, wi) => {
                  const weekStartDay = wi * 7 + 1;
                  const lastDay = new Date(mo.year, mo.month + 1, 0).getDate();
                  const weekEndDay = Math.min(weekStartDay + 6, lastDay);
                  return (
                    <div
                      key={`${mo.year}-${mo.month}-w${wi}`}
                      style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 500, color: tokens.color.textSubtle,
                        borderRight: `1px solid ${tokens.color.border}`,
                        borderBottom: `1px solid ${tokens.color.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {weekStartDay}~{weekEndDay}
                    </div>
                  );
                })
              )}
            </div>

            {/* Campaign bar rows */}
            {withDates.map((c) => {
              const barColor = STATUS_BAR_COLORS[c.status] || STATUS_BAR_COLORS.draft;
              const leftPct = Math.max(0, dayToPercent(c._start));
              const rightPct = Math.min(100, dayToPercent(c._end));
              const widthPct = Math.max(0.5, rightPct - leftPct);

              return (
                <div
                  key={c.campaign_id}
                  style={{
                    position: 'relative', height: 32,
                    borderTop: `1px solid ${tokens.color.border}`,
                  }}
                >
                  {/* Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8, height: 16,
                      left: `${leftPct}%`, width: `${widthPct}%`,
                      minWidth: 8,
                      borderRadius: 4,
                      background: barColor.bg,
                      opacity: c.status === 'completed' ? 0.5 : 0.85,
                      transition: 'opacity .15s',
                    }}
                    title={`${c.campaign_name}\n${c.scheduled_start} ~ ${c.scheduled_end}`}
                  />
                </div>
              );
            })}

            {/* Today marker */}
            {todayInRange && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${todayPercent}%`, width: 2,
                background: '#ef4444', opacity: 0.7,
                pointerEvents: 'none', zIndex: 5,
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: -10,
                  fontSize: 8, fontWeight: 700, color: '#fff',
                  background: '#ef4444', borderRadius: 3,
                  padding: '1px 4px', whiteSpace: 'nowrap',
                }}>
                  TODAY
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
