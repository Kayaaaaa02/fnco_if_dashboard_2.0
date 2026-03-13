import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { formatCompactNumber, getPlatformMeta, tokens } from '@/styles/designTokens.js';

const EMPTY_PLACEHOLDER = 'AI \uC2EC\uCE35 \uBD84\uC11D\uC744 \uC2E4\uD589\uD558\uBA74 \uB370\uC774\uD130\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4';

function EmptySection() {
  return (
    <div
      className="rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      style={{ borderColor: tokens.color.border, color: tokens.color.textSubtle }}
    >
      {EMPTY_PLACEHOLDER}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm" style={{ color: tokens.color.textSubtle }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: tokens.color.text }}>{value ?? '-'}</span>
    </div>
  );
}

function SimpleBar({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: tokens.color.textSubtle }}>{label}</span>
        <span className="font-medium" style={{ color: tokens.color.text }}>{typeof value === 'number' ? value.toFixed(1) : value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: tokens.color.surfaceMuted }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color || tokens.color.primary }}
        />
      </div>
    </div>
  );
}

export default function OverviewTab({ data, creator }) {
  const platform = creator ? getPlatformMeta(creator.platform) : null;

  const profile = data?.profile ?? data?.profileSummary ?? null;
  const demographics = data?.demographics ?? null;
  const postingFrequency = data?.postingFrequency ?? null;
  const engagementTrend = data?.engagementTrend ?? null;
  const audienceGrowth = data?.audienceGrowth ?? data?.followerGrowth ?? null;

  return (
    <div className="space-y-4">
      {/* 1. \uD504\uB85C\uD544 \uC694\uC57D */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uD504\uB85C\uD544 \uC694\uC57D
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile || creator ? (
            <div className="space-y-0.5">
              <StatRow label="\uC774\uB984" value={profile?.name ?? creator?.name} />
              <StatRow label="\uD578\uB4E4" value={profile?.handle ?? creator?.handle} />
              <StatRow
                label="\uD50C\uB7AB\uD3FC"
                value={
                  <span style={{ color: platform?.color }}>
                    {platform?.label ?? creator?.platform}
                  </span>
                }
              />
              <StatRow label="\uD314\uB85C\uC6CC" value={formatCompactNumber(profile?.followers ?? creator?.followers)} />
              <StatRow label="\uAC8C\uC2DC\uBB3C \uC218" value={profile?.posts != null ? formatCompactNumber(profile.posts) : '-'} />
              <StatRow
                label="\uCC38\uC5EC\uC728"
                value={profile?.engagementRate != null ? `${profile.engagementRate}%` : '-'}
              />
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 2. \uC778\uAD6C\uD1B5\uACC4 */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uC778\uAD6C\uD1B5\uACC4
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demographics ? (
            <div className="space-y-3">
              {demographics.ageRange && (
                <div>
                  <p className="mb-1.5 text-xs font-medium" style={{ color: tokens.color.textSubtle }}>\uC5F0\uB839\uB300 \uBD84\uD3EC</p>
                  <div className="space-y-1.5">
                    {Object.entries(demographics.ageRange).map(([range, pct]) => (
                      <SimpleBar key={range} label={range} value={pct} maxValue={100} color={tokens.color.primary} />
                    ))}
                  </div>
                </div>
              )}
              {demographics.genderSplit && (
                <div>
                  <p className="mb-1.5 text-xs font-medium" style={{ color: tokens.color.textSubtle }}>\uC131\uBCC4 \uBE44\uC728</p>
                  <div className="flex gap-4">
                    {Object.entries(demographics.genderSplit).map(([gender, pct]) => (
                      <div key={gender} className="flex items-center gap-2 text-sm">
                        <span style={{ color: tokens.color.textSubtle }}>{gender}</span>
                        <span className="font-semibold" style={{ color: tokens.color.text }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {demographics.topCountries && (
                <div>
                  <p className="mb-1.5 text-xs font-medium" style={{ color: tokens.color.textSubtle }}>\uC0C1\uC704 \uAD6D\uAC00</p>
                  <div className="flex flex-wrap gap-2">
                    {demographics.topCountries.map((c) => (
                      <span
                        key={typeof c === 'string' ? c : c.country}
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: tokens.color.primarySoft, color: tokens.color.primary }}
                      >
                        {typeof c === 'string' ? c : `${c.country} ${c.pct ?? ''}%`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 3. \uAC8C\uC2DC \uBE48\uB3C4 */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uAC8C\uC2DC \uBE48\uB3C4
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postingFrequency ? (
            <div className="space-y-0.5">
              <StatRow label="\uC8FC\uAC04 \uAC8C\uC2DC \uC218" value={postingFrequency.postsPerWeek ?? '-'} />
              <StatRow label="\uC77C\uAD00\uC131 \uC810\uC218" value={postingFrequency.consistencyScore != null ? `${postingFrequency.consistencyScore}/100` : '-'} />
              {postingFrequency.bestDay && <StatRow label="\uCD5C\uC801 \uC694\uC77C" value={postingFrequency.bestDay} />}
              {postingFrequency.bestTime && <StatRow label="\uCD5C\uC801 \uC2DC\uAC04" value={postingFrequency.bestTime} />}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 4. \uCC38\uC5EC\uC728 \uD2B8\uB80C\uB4DC */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uCC38\uC5EC\uC728 \uD2B8\uB80C\uB4DC
          </CardTitle>
        </CardHeader>
        <CardContent>
          {engagementTrend && Array.isArray(engagementTrend) && engagementTrend.length > 0 ? (
            <div className="space-y-2">
              {(() => {
                const maxVal = Math.max(...engagementTrend.map((d) => d.rate ?? d.value ?? 0));
                return engagementTrend.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs" style={{ color: tokens.color.textSubtle }}>
                      {item.period ?? item.label ?? `W${idx + 1}`}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded" style={{ background: tokens.color.surfaceMuted }}>
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${maxVal > 0 ? ((item.rate ?? item.value ?? 0) / maxVal) * 100 : 0}%`,
                          background: tokens.color.primary,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium" style={{ color: tokens.color.text }}>
                      {(item.rate ?? item.value ?? 0).toFixed(1)}%
                    </span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 5. \uC624\uB514\uC5B8\uC2A4 \uC131\uC7A5 */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uC624\uB514\uC5B8\uC2A4 \uC131\uC7A5
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audienceGrowth ? (
            <div className="space-y-0.5">
              {audienceGrowth.monthlyGrowthRate != null && (
                <StatRow label="\uC6D4\uAC04 \uC131\uC7A5\uB960" value={`${audienceGrowth.monthlyGrowthRate}%`} />
              )}
              {audienceGrowth.last30d != null && (
                <StatRow label="\uCD5C\uADFC 30\uC77C \uBCC0\uD654" value={`${audienceGrowth.last30d > 0 ? '+' : ''}${formatCompactNumber(audienceGrowth.last30d)}`} />
              )}
              {audienceGrowth.trend && (
                <StatRow
                  label="\uCD94\uC138"
                  value={
                    <span style={{
                      color: audienceGrowth.trend === 'up' ? tokens.color.success
                        : audienceGrowth.trend === 'down' ? tokens.color.danger
                        : tokens.color.textSubtle
                    }}>
                      {audienceGrowth.trend === 'up' ? '\u2191 \uC131\uC7A5\uC911' : audienceGrowth.trend === 'down' ? '\u2193 \uAC10\uC18C\uC911' : '\u2192 \uC720\uC9C0'}
                    </span>
                  }
                />
              )}
              {audienceGrowth.totalGrowth6m != null && (
                <StatRow label="6\uAC1C\uC6D4 \uB204\uC801 \uC131\uC7A5" value={formatCompactNumber(audienceGrowth.totalGrowth6m)} />
              )}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
