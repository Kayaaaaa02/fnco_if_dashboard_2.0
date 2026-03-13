import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { formatCompactNumber, tokens } from '@/styles/designTokens.js';

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

function HorizontalBar({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: tokens.color.textSubtle }}>{label}</span>
        <span className="font-medium" style={{ color: tokens.color.text }}>
          {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: tokens.color.surfaceMuted }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color || tokens.color.primary }}
        />
      </div>
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, idx) => (
        <span
          key={idx}
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: tokens.color.primarySoft, color: tokens.color.primary }}
        >
          {typeof item === 'string' ? item : item.label ?? item.name}
        </span>
      ))}
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

export default function ContentAnalysisTab({ data }) {
  const themes = data?.contentThemes ?? data?.themeDistribution ?? null;
  const shootingStyle = data?.shootingStyle ?? null;
  const editingStyle = data?.editingStyle ?? null;
  const recentContent = data?.recentContent ?? data?.recentPosts ?? null;
  const seedingPoints = data?.seedingPoints ?? data?.campaignApplicationPoints ?? null;

  const THEME_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#ef4444', '#14b8a6', '#f97316',
  ];

  return (
    <div className="space-y-4">
      {/* 1. \uCF58\uD150\uCE20 \uD14C\uB9C8 \uBD84\uD3EC */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uCF58\uD150\uCE20 \uD14C\uB9C8 \uBD84\uD3EC
          </CardTitle>
        </CardHeader>
        <CardContent>
          {themes && (Array.isArray(themes) ? themes.length > 0 : Object.keys(themes).length > 0) ? (
            <div className="space-y-2.5">
              {(Array.isArray(themes) ? themes : Object.entries(themes).map(([k, v]) => ({ label: k, value: v }))).map(
                (item, idx) => {
                  const label = item.label ?? item.theme ?? item.name ?? '';
                  const value = item.value ?? item.pct ?? item.percentage ?? 0;
                  return (
                    <HorizontalBar
                      key={idx}
                      label={label}
                      value={value}
                      maxValue={100}
                      color={THEME_COLORS[idx % THEME_COLORS.length]}
                    />
                  );
                }
              )}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 2. \uCD2C\uC601 \uC2A4\uD0C0\uC77C \uBD84\uC11D */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uCD2C\uC601 \uC2A4\uD0C0\uC77C \uBD84\uC11D
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shootingStyle ? (
            <div className="space-y-0.5">
              {shootingStyle.location && <StatRow label="\uC2E4\uB0B4/\uC57C\uC678" value={shootingStyle.location} />}
              {shootingStyle.lighting && <StatRow label="\uC870\uBA85" value={shootingStyle.lighting} />}
              {shootingStyle.cameraAngle && <StatRow label="\uCE74\uBA54\uB77C \uC571\uAE00" value={shootingStyle.cameraAngle} />}
              {shootingStyle.background && <StatRow label="\uBC30\uACBD" value={shootingStyle.background} />}
              {shootingStyle.tags && <div className="pt-2"><TagList items={shootingStyle.tags} /></div>}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 3. \uD3B8\uC9D1 \uC2A4\uD0C0\uC77C \uBD84\uC11D */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uD3B8\uC9D1 \uC2A4\uD0C0\uC77C \uBD84\uC11D
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingStyle ? (
            <div className="space-y-0.5">
              {editingStyle.cutCount != null && <StatRow label="\uCEF7 \uC218 (\uD3C9\uADE0)" value={editingStyle.cutCount} />}
              {editingStyle.transitionEffect && <StatRow label="\uC804\uD658 \uD6A8\uACFC" value={editingStyle.transitionEffect} />}
              {editingStyle.musicUsage && <StatRow label="\uC74C\uC545 \uC0AC\uC6A9" value={editingStyle.musicUsage} />}
              {editingStyle.textOverlay && <StatRow label="\uD14D\uC2A4\uD2B8 \uC624\uBC84\uB808\uC774" value={editingStyle.textOverlay} />}
              {editingStyle.avgDuration && <StatRow label="\uD3C9\uADE0 \uC601\uC0C1 \uAE38\uC774" value={editingStyle.avgDuration} />}
              {editingStyle.tags && <div className="pt-2"><TagList items={editingStyle.tags} /></div>}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 4. \uCD5C\uADFC 30\uC77C \uCF58\uD150\uCE20 \uC694\uC57D */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uCD5C\uADFC 30\uC77C \uCF58\uD150\uCE20 \uC694\uC57D
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentContent && Array.isArray(recentContent) && recentContent.length > 0 ? (
            <div className="space-y-2">
              {recentContent.slice(0, 5).map((post, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{ borderColor: tokens.color.border }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: tokens.color.text }}>
                      {post.title ?? post.caption ?? `\uAC8C\uC2DC\uBB3C ${idx + 1}`}
                    </p>
                    {post.date && (
                      <p className="text-xs" style={{ color: tokens.color.textSubtle }}>{post.date}</p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-3 text-xs" style={{ color: tokens.color.textSubtle }}>
                    {post.views != null && <span>\uC870\uD68C {formatCompactNumber(post.views)}</span>}
                    {post.likes != null && <span>\uC88B\uC544\uC694 {formatCompactNumber(post.likes)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>

      {/* 5. \uC2DC\uB529 \uCEA0\uD398\uC778 \uC801\uC6A9 \uD3EC\uC778\uD2B8 */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uC2DC\uB529 \uCEA0\uD398\uC778 \uC801\uC6A9 \uD3EC\uC778\uD2B8
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seedingPoints && (Array.isArray(seedingPoints) ? seedingPoints.length > 0 : Object.keys(seedingPoints).length > 0) ? (
            <div className="space-y-2">
              {(Array.isArray(seedingPoints) ? seedingPoints : Object.entries(seedingPoints).map(([k, v]) => ({ title: k, description: v }))).map(
                (point, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: tokens.color.border, background: tokens.color.surfaceMuted }}
                  >
                    <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                      {point.title ?? point.label ?? point.name ?? `\uD3EC\uC778\uD2B8 ${idx + 1}`}
                    </p>
                    {point.description && (
                      <p className="mt-0.5 text-xs" style={{ color: tokens.color.textSubtle }}>
                        {point.description}
                      </p>
                    )}
                  </div>
                )
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
