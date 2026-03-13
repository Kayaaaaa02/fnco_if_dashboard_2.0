import html2pdf from 'html2pdf.js';

export async function exportToPDF(element, filename = 'report') {
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(opt).from(element).save();
}

export async function exportSectionToPDF(sectionId, filename) {
  const element = document.getElementById(sectionId);
  if (!element) {
    console.error(`[ExportPDF] Section not found: ${sectionId}`);
    return;
  }
  await exportToPDF(element, filename);
}
