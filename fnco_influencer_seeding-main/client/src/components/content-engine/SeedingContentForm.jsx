/**
 * 시딩 콘텐츠 등록 다이얼로그
 * URL 입력 시 크롤링으로 자동 채움, 수동 필드 입력 후 등록
 */
import { useState, useCallback } from 'react';
import { Loader2, Link2, Sparkles, Package, MapPin, Tag, DollarSign, Building2, Megaphone, FileText, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import { useCrawlUrl } from '@/hooks/useCrawling.js';
import { useCreateSeedingContent } from '@/hooks/useContentLibrary.js';
import { tokens } from '@/styles/designTokens.js';

const COUNTRY_OPTIONS = [
  { value: 'KR', label: '한국 (KR)' },
  { value: 'US', label: '미국 (US)' },
  { value: 'JP', label: '일본 (JP)' },
  { value: 'CN', label: '중국 (CN)' },
  { value: 'GLOBAL', label: '글로벌 (GLOBAL)' },
];

const INITIAL_FORM = {
  url: '',
  platform: '',
  author_nm: '',
  thumbnail_url: '',
  seeding_item: '',
  seeding_cntry: 'KR',
  video_keywords: '',
  seeding_cost: '',
  agency_name: '',
  campaign_name: '',
  content_summary: '',
  start_date: '',
  end_date: '',
};

/** 섹션 구분 헤더 */
function SectionLabel({ icon: Icon, color, children }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: 12, height: 12, color: '#fff' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{children}</span>
    </div>
  );
}

/** 필드 라벨 */
function FieldLabel({ icon: Icon, required, children }) {
  return (
    <Label className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
      {Icon && <Icon style={{ width: 12, height: 12, color: '#94a3b8' }} />}
      {children}
      {required && <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>}
    </Label>
  );
}

const inputStyle = {
  height: 38, fontSize: 13, borderRadius: 8,
  border: `1px solid ${tokens.color.border}`,
  transition: 'border-color 0.15s',
};

const selectStyle = {
  height: 38, width: '100%', borderRadius: 8, padding: '0 12px',
  fontSize: 13, border: `1px solid ${tokens.color.border}`,
  background: tokens.color.surface, color: tokens.color.text,
  outline: 'none',
};

export default function SeedingContentForm({ open, onOpenChange }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const crawl = useCrawlUrl();
  const createSeeding = useCreateSeedingContent();

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleUrlBlur = useCallback(() => {
    const trimmedUrl = form.url.trim();
    if (!trimmedUrl) return;
    crawl.mutate(
      { url: trimmedUrl },
      {
        onSuccess: (data) => {
          setForm((prev) => ({
            ...prev,
            platform: data.platform || prev.platform,
            author_nm: data.author || data.author_nm || prev.author_nm,
            thumbnail_url: data.thumbnail || data.thumbnail_url || prev.thumbnail_url,
          }));
        },
      },
    );
  }, [form.url, crawl]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const payload = {
        post_url: form.url,
        platform: form.platform,
        author_nm: form.author_nm,
        thumbnail_url: form.thumbnail_url,
        seeding_item: form.seeding_item,
        seeding_cntry: form.seeding_cntry,
        video_keywords: form.video_keywords,
        seeding_cost: form.seeding_cost ? Number(form.seeding_cost) : null,
        agency_name: form.agency_name || null,
        campaign_name: form.campaign_name || null,
        content_summary: form.content_summary,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      createSeeding.mutate(payload, {
        onSuccess: () => {
          setForm(INITIAL_FORM);
          onOpenChange(false);
        },
      });
    },
    [form, createSeeding, onOpenChange],
  );

  const handleOpenChange = useCallback(
    (nextOpen) => {
      if (!nextOpen) setForm(INITIAL_FORM);
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const hasCrawlResult = !!(form.platform || form.author_nm);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent style={{ maxWidth: 680, padding: 0 }} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* 헤더 */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <DialogHeader style={{ padding: 0 }}>
            <DialogTitle style={{ fontSize: 17, fontWeight: 800, color: tokens.color.text }}>시딩 콘텐츠 등록</DialogTitle>
            <DialogDescription style={{ fontSize: 12, color: '#64748b' }}>URL을 입력하면 플랫폼, 작성자, 썸네일이 자동으로 채워집니다.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }} className="space-y-5">

          {/* ── 섹션 1: URL 입력 ── */}
          <div style={{
            padding: '16px 18px', borderRadius: 10,
            background: '#f0f9ff', border: '1px solid #bae6fd',
          }}>
            <SectionLabel icon={Link2} color="#0ea5e9">콘텐츠 URL</SectionLabel>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 10px', paddingLeft: 30 }}>
              YouTube, Instagram, TikTok 링크를 붙여넣으세요.
            </p>
            <div className="flex gap-2">
              <Input
                value={form.url}
                onChange={(e) => setField('url', e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://youtube.com/watch?v=... 또는 instagram.com/reels/..."
                className="flex-1"
                style={inputStyle}
              />
              {crawl.isPending && <Loader2 className="h-5 w-5 animate-spin self-center" style={{ color: '#0ea5e9' }} />}
              {hasCrawlResult && !crawl.isPending && <CheckCircle2 className="h-5 w-5 self-center" style={{ color: '#10b981' }} />}
            </div>
            {crawl.isError && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>크롤링 실패: {crawl.error?.message}</p>
            )}
          </div>

          {/* ── 섹션 2: 자동 감지 결과 ── */}
          {hasCrawlResult && (
            <div style={{
              padding: '16px 18px', borderRadius: 10,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
            }}>
              <SectionLabel icon={Sparkles} color="#10b981">자동 감지 결과</SectionLabel>
              <div className="grid grid-cols-2 gap-3" style={{ marginTop: 10 }}>
                <div className="space-y-1.5">
                  <FieldLabel>플랫폼</FieldLabel>
                  <Input value={form.platform} readOnly style={{ ...inputStyle, background: '#fff', color: '#10b981', fontWeight: 700 }} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>작성자</FieldLabel>
                  <Input value={form.author_nm} readOnly style={{ ...inputStyle, background: '#fff', color: '#10b981', fontWeight: 700 }} />
                </div>
              </div>
              {form.thumbnail_url && (
                <div style={{ marginTop: 12 }}>
                  <FieldLabel>썸네일</FieldLabel>
                  <img
                    src={form.thumbnail_url}
                    alt="thumbnail"
                    style={{ height: 120, width: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 6 }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── 섹션 3: 시딩 정보 (필수) ── */}
          <div style={{
            padding: '16px 18px', borderRadius: 10,
            background: '#faf5ff', border: '1px solid #e9d5ff',
          }}>
            <SectionLabel icon={Package} color="#7c3aed">시딩 정보</SectionLabel>
            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 10 }}>
              <div className="space-y-1.5">
                <FieldLabel icon={Package} required>시딩 품목</FieldLabel>
                <Input
                  value={form.seeding_item}
                  onChange={(e) => setField('seeding_item', e.target.value)}
                  placeholder="예: 클렌징밤"
                  required
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel icon={MapPin} required>시딩 국가</FieldLabel>
                <select
                  value={form.seeding_cntry}
                  onChange={(e) => setField('seeding_cntry', e.target.value)}
                  style={selectStyle}
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }} className="space-y-1.5">
              <FieldLabel icon={Tag}>영상 키워드 (쉼표 구분)</FieldLabel>
              <Input
                value={form.video_keywords}
                onChange={(e) => setField('video_keywords', e.target.value)}
                placeholder="예: 뷰티, 스킨케어, 리뷰, ASMR"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── 섹션 4: 캠페인 & 비용 ── */}
          <div style={{
            padding: '16px 18px', borderRadius: 10,
            background: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            <SectionLabel icon={Megaphone} color="#64748b">캠페인 & 비용</SectionLabel>
            <div className="grid grid-cols-3 gap-3" style={{ marginTop: 10 }}>
              <div className="space-y-1.5">
                <FieldLabel icon={Megaphone}>캠페인명</FieldLabel>
                <Input
                  value={form.campaign_name}
                  onChange={(e) => setField('campaign_name', e.target.value)}
                  placeholder="캠페인명"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel icon={DollarSign}>시딩 비용</FieldLabel>
                <Input
                  type="number"
                  value={form.seeding_cost}
                  onChange={(e) => setField('seeding_cost', e.target.value)}
                  placeholder="0"
                  min={0}
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel icon={Building2}>에이전시명</FieldLabel>
                <Input
                  value={form.agency_name}
                  onChange={(e) => setField('agency_name', e.target.value)}
                  placeholder="선택 사항"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* ── 섹션 5: 콘텐츠 설명 + 수집 기간 ── */}
          <div style={{
            padding: '16px 18px', borderRadius: 10,
            background: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            <SectionLabel icon={FileText} color="#64748b">콘텐츠 설명 & 수집 기간</SectionLabel>
            <div style={{ marginTop: 10 }} className="space-y-3">
              <div className="space-y-1.5">
                <FieldLabel icon={FileText}>콘텐츠 간략 내용</FieldLabel>
                <Textarea
                  value={form.content_summary}
                  onChange={(e) => setField('content_summary', e.target.value)}
                  placeholder="콘텐츠에 대한 간략한 설명을 작성해주세요."
                  rows={3}
                  style={{ fontSize: 13, borderRadius: 8, border: `1px solid ${tokens.color.border}` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel icon={CalendarDays}>수집 시작일</FieldLabel>
                  <Input type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel icon={CalendarDays}>수집 종료일</FieldLabel>
                  <Input type="date" value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 푸터 ── */}
          <div className="flex items-center justify-end gap-3" style={{ paddingTop: 4 }}>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}
              style={{ height: 40, borderRadius: 8, fontSize: 13, fontWeight: 600, padding: '0 20px' }}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={createSeeding.isPending || !form.url.trim() || !form.seeding_item.trim()}
              style={{
                height: 40, borderRadius: 8, fontSize: 13, fontWeight: 700, padding: '0 24px',
                background: tokens.color.primary, color: '#fff',
              }}
            >
              {createSeeding.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</>
              ) : (
                '등록하기'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
