import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { tokens } from '@/styles/designTokens.js';

const CONTENT_TYPE_TO_HOOKS = {
  grwm: { label: 'GRWM', hooks: ['\uC544\uCE68 \uB8E8\uD2F4 \uACF5\uAC1C', '\uACA8\uC6B8 \uBA54\uC774\uD06C\uC5C5 \uB8E8\uD2F4', '\uCD9C\uADFC \uC804 5\uBD84 \uB8E8\uD2F4'] },
  routine: { label: '\uB8E8\uD2F4', hooks: ['\uC7A0\uB4E4\uAE30 \uC804 \uC2A4\uD0A8\uCF00\uC5B4', '\uC8FC\uB9D0 \uD648\uCF00\uC5B4 \uB8E8\uD2F4'] },
  daily: { label: '\uC77C\uC0C1/\uBE0C\uC774\uB85C\uADF8', hooks: ['\uD3C9\uBC94\uD55C \uD558\uB8E8\uC5D0 \uCC3E\uC740 \uAFB8\uD15C', '\uC77C\uC0C1 \uC18D \uBDF0\uD2F0 \uB8E8\uD2F4'] },
  review: { label: '\uB9AC\uBDF0/\uD29C\uD1A0\uB9AC\uC5BC', hooks: ['\uC194\uC9C1 \uD6C4\uAE30', '\uD55C \uB2EC \uC0AC\uC6A9\uAE30', '\uBE44\uD3EC \uC560\uD504\uD130'] },
  info: { label: '\uC815\uBCF4\uD615', hooks: ['\uD53C\uBD80\uACFC \uC758\uC0AC\uAC00 \uB9D0\uD558\uB294', '\uC131\uBD84 \uBD84\uC11D', '\uC774\uAC74 \uBAB0\uB790\uC9C0?'] },
  asmr: { label: 'ASMR', hooks: ['\uC18D\uC0AD\uC784 \uB9AC\uBDF0', '\uC81C\uD488 \uC18C\uB9AC ASMR'] },
  recommend: { label: '\uCD94\uCC9C\uD15C', hooks: ['\uC774\uB2EC\uC758 \uD53D', '\uAC13\uC131\uBE44 \uCD94\uCC9C', '\uC9C1\uC811 \uC368\uBCF8 TOP 5'] },
  haul: { label: '\uD558\uC6B8/\uC5B8\uBC15\uC2F1', hooks: ['\uD0DD\uBC30 \uC654\uC5B4\uC694', '\uC62C\uC601 \uD558\uC6B8', '\uC5ED\uB300\uAE09 \uC5B8\uBC15\uC2F1'] },
  beforeafter: { label: '\uBE44\uD3EC\uC564\uC560\uD504\uD130', hooks: ['2\uC8FC \uD6C4 \uACB0\uACFC', '\uC9C4\uC9DC \uB2EC\uB77C\uC84C\uB2E4', '\uBCC0\uD654 \uACFC\uC815 \uACF5\uAC1C'] },
};

const EMPTY_PLACEHOLDER = 'AI \uC2EC\uCE35 \uBD84\uC11D\uC744 \uC2E4\uD589\uD558\uBA74 \uCD5C\uC801\uC758 \uAE30\uD68D\uC548\uC774 \uCD94\uCC9C\uB429\uB2C8\uB2E4';

function EmptySection({ message }) {
  return (
    <div
      className="rounded-lg border border-dashed px-4 py-8 text-center text-sm"
      style={{ borderColor: tokens.color.border, color: tokens.color.textSubtle }}
    >
      {message || EMPTY_PLACEHOLDER}
    </div>
  );
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  const numScore = Number(score);
  const color = numScore >= 80 ? tokens.color.success
    : numScore >= 60 ? tokens.color.warning
    : tokens.color.danger;
  const bg = numScore >= 80 ? tokens.color.successSoft
    : numScore >= 60 ? tokens.color.warningSoft
    : tokens.color.dangerSoft;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {numScore}\uC810
    </span>
  );
}

export default function BestPlanTab({ data }) {
  const pdaScore = data?.pdaMatchingScore ?? data?.pdaScore ?? null;
  const recommendedTypes = data?.recommendedContentTypes ?? data?.recommendedTypes ?? null;
  const plans = data?.bestPlans ?? data?.recommendations ?? null;

  return (
    <div className="space-y-4">
      {/* PDA \uB9E4\uCE6D \uC810\uC218 */}
      {pdaScore != null && (
        <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
              PDA \uB9E4\uCE6D \uC810\uC218
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold"
                style={{
                  background: Number(pdaScore) >= 80 ? tokens.color.successSoft
                    : Number(pdaScore) >= 60 ? tokens.color.warningSoft
                    : tokens.color.dangerSoft,
                  color: Number(pdaScore) >= 80 ? tokens.color.success
                    : Number(pdaScore) >= 60 ? tokens.color.warning
                    : tokens.color.danger,
                }}
              >
                {pdaScore}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                  {Number(pdaScore) >= 80 ? '\uB192\uC740 \uB9E4\uCE6D\uB3C4' : Number(pdaScore) >= 60 ? '\uBCF4\uD1B5 \uB9E4\uCE6D\uB3C4' : '\uB0AE\uC740 \uB9E4\uCE6D\uB3C4'}
                </p>
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                  \uCE21\uC815\uB41C P.D.A. \uD504\uB808\uC784\uC6CC\uD06C \uAE30\uBC18 \uB9E4\uCE6D \uC810\uC218
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* \uCD94\uCC9C \uCF58\uD150\uCE20 \uC720\uD615 + \uD6C5 */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            \uCD94\uCC9C \uCF58\uD150\uCE20 \uC720\uD615
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendedTypes && Array.isArray(recommendedTypes) && recommendedTypes.length > 0 ? (
            <div className="space-y-3">
              {recommendedTypes.map((type, idx) => {
                const key = typeof type === 'string' ? type : type.type ?? type.key ?? '';
                const hookData = CONTENT_TYPE_TO_HOOKS[key.toLowerCase()];
                const label = hookData?.label ?? (typeof type === 'string' ? type : type.label ?? key);
                const hooks = hookData?.hooks ?? [];
                const matchScore = typeof type === 'object' ? type.score ?? type.matchScore : null;

                return (
                  <div
                    key={idx}
                    className="rounded-lg border px-3 py-2.5"
                    style={{ borderColor: tokens.color.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                        {label}
                      </span>
                      {matchScore != null && <ScoreBadge score={matchScore} />}
                    </div>
                    {hooks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {hooks.map((hook, hIdx) => (
                          <Badge
                            key={hIdx}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {hook}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uCF58\uD150\uCE20 \uC720\uD615 \uBC0F \uD6C5 \uB808\uD37C\uB7F0\uC2A4
              </p>
              {Object.entries(CONTENT_TYPE_TO_HOOKS).map(([key, { label, hooks }]) => (
                <div
                  key={key}
                  className="rounded-lg border px-3 py-2.5"
                  style={{ borderColor: tokens.color.border, background: tokens.color.surfaceMuted }}
                >
                  <span className="text-sm font-medium" style={{ color: tokens.color.text }}>{label}</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {hooks.map((hook, hIdx) => (
                      <Badge
                        key={hIdx}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {hook}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best \uAE30\uD68D\uC548 \uBAA9\uB85D */}
      <Card style={{ borderColor: tokens.color.border, background: tokens.color.surface }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            Best \uAE30\uD68D\uC548
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plans && Array.isArray(plans) && plans.length > 0 ? (
            <div className="space-y-3">
              {plans.map((plan, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border p-3"
                  style={{ borderColor: tokens.color.border }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                        {plan.name ?? plan.title ?? `\uAE30\uD68D\uC548 ${idx + 1}`}
                      </p>
                      {plan.reason && (
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: tokens.color.textSubtle }}>
                          {plan.reason}
                        </p>
                      )}
                      {plan.summary && (
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: tokens.color.textSubtle }}>
                          {plan.summary}
                        </p>
                      )}
                    </div>
                    <ScoreBadge score={plan.score ?? plan.matchScore} />
                  </div>

                  {plan.contentType && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {CONTENT_TYPE_TO_HOOKS[plan.contentType.toLowerCase()]?.label ?? plan.contentType}
                      </Badge>
                    </div>
                  )}

                  {plan.hooks && Array.isArray(plan.hooks) && plan.hooks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {plan.hooks.map((hook, hIdx) => (
                        <span
                          key={hIdx}
                          className="rounded-full px-2 py-0.5 text-[11px]"
                          style={{ background: tokens.color.primarySoft, color: tokens.color.primary }}
                        >
                          {hook}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptySection />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
