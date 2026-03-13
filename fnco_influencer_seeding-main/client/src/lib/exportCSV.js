import * as XLSX from 'xlsx';

export function exportToExcel(data, filename = 'data', sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV(data, filename = 'data') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
}

export function exportInfluencersToExcel(influencers, campaignName) {
  const data = influencers.map((inf) => ({
    '이름': inf.profile_name || inf.name || '-',
    '플랫폼': inf.platform || '-',
    '팔로워': inf.followers || 0,
    '매칭점수': inf.match_score || 0,
    '상태': inf.status || '-',
    'P.D.A. 점수': inf.pda_score || '-',
    '카테고리': inf.category || '-',
  }));

  exportToExcel(data, `influencers-${campaignName || 'list'}`, '인플루언서');
}

export function exportMetricsToExcel(metrics, trend, campaignName) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  if (metrics) {
    const summaryData = [
      { '지표': '노출수', '값': metrics.impressions || 0 },
      { '지표': 'CTR', '값': metrics.ctr ? `${(metrics.ctr * 100).toFixed(2)}%` : '-' },
      { '지표': 'CPA', '값': metrics.cpa || 0 },
      { '지표': 'ROAS', '값': metrics.roas ? `${metrics.roas.toFixed(1)}x` : '-' },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, '요약');
  }

  // Trend sheet
  if (Array.isArray(trend) && trend.length > 0) {
    const trendWs = XLSX.utils.json_to_sheet(trend);
    XLSX.utils.book_append_sheet(wb, trendWs, '추이');
  }

  XLSX.writeFile(wb, `metrics-${campaignName || 'report'}.xlsx`);
}
