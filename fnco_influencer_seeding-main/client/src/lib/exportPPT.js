import PptxGenJS from 'pptxgenjs';

export function exportToPPT(slides, filename = 'presentation') {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'FNCO Platform';

  slides.forEach((slideData) => {
    const slide = pptx.addSlide();

    if (slideData.title) {
      slide.addText(slideData.title, {
        x: 0.5, y: 0.3, w: '90%',
        fontSize: 24, bold: true, color: '1a1a2e',
      });
    }

    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: 0.5, y: 0.9, w: '90%',
        fontSize: 14, color: '666666',
      });
    }

    if (slideData.bullets) {
      slide.addText(
        slideData.bullets.map((b) => ({ text: b, options: { bullet: true } })),
        {
          x: 0.5, y: 1.5, w: '90%', h: 4,
          fontSize: 14, color: '333333', lineSpacing: 28,
        }
      );
    }

    if (slideData.table) {
      const rows = slideData.table;
      slide.addTable(rows, {
        x: 0.5, y: slideData.title ? 1.5 : 0.5,
        w: 9,
        fontSize: 10,
        border: { pt: 0.5, color: 'CCCCCC' },
        colW: slideData.colWidths || undefined,
        autoPage: true,
      });
    }

    if (slideData.image) {
      slide.addImage({
        data: slideData.image,
        x: 0.5, y: 1.5, w: 9, h: 5,
      });
    }
  });

  return pptx.writeFile({ fileName: `${filename}.pptx` });
}

export function createStrategyPPT(strategyData, campaignName) {
  const slides = [
    {
      title: campaignName || '캠페인 전략',
      subtitle: '인플루언서 시딩 전략 보고서',
    },
  ];

  if (strategyData?.strategy_text) {
    slides.push({
      title: '전략 개요',
      bullets: strategyData.strategy_text.split('\n').filter(Boolean).slice(0, 8),
    });
  }

  return exportToPPT(slides, `strategy-${campaignName || 'report'}`);
}
