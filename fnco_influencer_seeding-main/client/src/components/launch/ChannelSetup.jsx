import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useChannelSetup,
  useGenerateChannelSetup,
  useUpdateChannelSetup,
  useDeleteChannelSetup,
} from '@/hooks/useChannelSetup.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  Store,
  Sparkles,
  Loader2,
  Pencil,
  Check,
  X,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PLATFORM_MAP = {
  naver_smartstore: { icon: '\uD83D\uDFE2', label: '\uB124\uC774\uBC84 \uC2A4\uB9C8\uD2B8\uC2A4\uD1A0\uC5B4' },
  coupang: { icon: '\uD83D\uDD35', label: '\uCFE0\uD321' },
  instagram_shop: { icon: '\uD83D\uDCF8', label: '\uC778\uC2A4\uD0C0\uADF8\uB7A8 \uC1FC\uD551' },
};

const STATUS_VARIANT = {
  draft: 'secondary',
  ready: 'default',
  live: 'destructive',
};

const STATUS_LABEL = {
  draft: '\uCD08\uC548',
  ready: '\uC900\uBE44\uC644\uB8CC',
  live: '\uB77C\uC774\uBE0C',
};

function formatPrice(n) {
  if (n == null) return '-';
  return n.toLocaleString('ko-KR') + '\uC6D0';
}

function ChannelCard({ channel, campaignId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const updateSetup = useUpdateChannelSetup();
  const deleteSetup = useDeleteChannelSetup();

  const platform = PLATFORM_MAP[channel.platform] || { icon: '\uD83D\uDCE6', label: channel.platform };
  const config = channel.page_config || {};
  const pricing = channel.pricing || {};

  const startEdit = () => {
    setForm({
      title: config.title || '',
      description: config.description || '',
      features: (config.features || []).join(', '),
      seo_keywords: (config.seo_keywords || config.product_tags || []).join(', '),
      original_price: pricing.original_price || '',
      sale_price: pricing.sale_price || '',
      promo_code: pricing.promo_code || '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    const featuresArr = form.features
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const keywordsArr = form.seo_keywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const origPrice = Number(form.original_price) || 0;
    const salePrice = Number(form.sale_price) || 0;
    const discountRate = origPrice > 0 ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0;

    const keyField = channel.platform === 'instagram_shop' ? 'product_tags' : 'seo_keywords';

    updateSetup.mutate({
      campaignId,
      setupId: channel.setup_id,
      data: {
        page_config: {
          ...config,
          title: form.title,
          description: form.description,
          features: featuresArr,
          [keyField]: keywordsArr,
        },
        pricing: {
          original_price: origPrice,
          sale_price: salePrice,
          discount_rate: discountRate,
          promo_code: form.promo_code,
        },
      },
    });
    setEditing(false);
  };

  const handleDelete = () => {
    deleteSetup.mutate({ campaignId, setupId: channel.setup_id });
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5 space-y-3">
        {/* Platform header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{platform.icon}</span>
            <span className="font-semibold text-sm">{platform.label}</span>
          </div>
          <Badge variant={STATUS_VARIANT[channel.status] || 'secondary'}>
            {STATUS_LABEL[channel.status] || channel.status}
          </Badge>
        </div>

        <Separator />

        {editing ? (
          /* Edit mode */
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{'\uD0C0\uC774\uD2C0'}</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{'\uC124\uBA85'}</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{'\uD2B9\uC9D5 (\uC27C\uD45C \uAD6C\uBD84)'}</label>
              <Input
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder="\uBB34\uB8CC\uBC30\uC1A1, \uC815\uD488\uBCF4\uC99D"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{'\uC815\uAC00'}</label>
                <Input
                  type="number"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{'\uD310\uB9E4\uAC00'}</label>
                <Input
                  type="number"
                  value={form.sale_price}
                  onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{'\uD504\uB85C\uBAA8 \uCF54\uB4DC'}</label>
              <Input
                value={form.promo_code}
                onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {channel.platform === 'instagram_shop' ? '\uC81C\uD488 \uD0DC\uADF8' : 'SEO \uD0A4\uC6CC\uB4DC'} {'\uC27C\uD45C \uAD6C\uBD84'}
              </label>
              <Input
                value={form.seo_keywords}
                onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={updateSetup.isPending}>
                {updateSetup.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{'\uC800\uC7A5'}</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-3.5" />
                <span>{'\uCDE8\uC18C'}</span>
              </Button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="space-y-3">
            {/* Pricing summary */}
            <div className="flex items-center gap-2 flex-wrap">
              {pricing.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(pricing.original_price)}
                </span>
              )}
              {pricing.sale_price && (
                <span className="text-sm font-bold">{formatPrice(pricing.sale_price)}</span>
              )}
              {pricing.discount_rate > 0 && (
                <Badge variant="destructive" className="text-xs">
                  -{pricing.discount_rate}%
                </Badge>
              )}
              {pricing.promo_code && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Tag className="size-3" />
                  {pricing.promo_code}
                </Badge>
              )}
            </div>

            {/* Features */}
            {config.features && config.features.length > 0 && (
              <ul className="space-y-1">
                {config.features.map((feat, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-primary/60 inline-block" />
                    {feat}
                  </li>
                ))}
              </ul>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Pencil className="size-3.5" />
                <span>{'\uD3B8\uC9D1'}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteSetup.isPending}
              >
                {deleteSetup.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                <span>{'\uC0AD\uC81C'}</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ChannelSetup() {
  const { id: campaignId } = useParams();
  const { data, isLoading } = useChannelSetup(campaignId);
  const generateSetup = useGenerateChannelSetup();
  const [open, setOpen] = useState(true);

  const channels = data?.data || [];

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <CardTitle className="text-lg">{'\uCC44\uB110 \uC138\uD305'}</CardTitle>
            {channels.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {channels.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                generateSetup.mutate(campaignId);
              }}
              disabled={generateSetup.isPending}
            >
              {generateSetup.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span>AI {'\uCC44\uB110 \uC0DD\uC131'}</span>
            </Button>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0">
          {isLoading ? (
            <LoadingSkeleton />
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Store className="size-10 mb-3 opacity-30" />
              <p className="text-sm">{'\uCC44\uB110\uC744 \uC124\uC815\uD558\uC5EC \uB860\uCE6D \uC900\uBE44\uB97C \uC644\uB8CC\uD558\uC138\uC694'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {channels.map((ch) => (
                <ChannelCard key={ch.setup_id} channel={ch} campaignId={campaignId} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
