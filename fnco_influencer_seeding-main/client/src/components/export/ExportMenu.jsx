import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';

export default function ExportMenu({ onExportPDF, onExportPPT, onExportCSV, showPPT = false }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type, handler) => {
    if (!handler) return;
    setExporting(type);
    try {
      await handler();
    } catch (err) {
      console.error(`[Export] ${type} failed:`, err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!!exporting}>
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span>내보내기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportPDF && (
          <DropdownMenuItem onClick={() => handleExport('pdf', onExportPDF)}>
            <FileText className="size-4 mr-2 text-red-500" />
            PDF 다운로드
          </DropdownMenuItem>
        )}
        {showPPT && onExportPPT && (
          <DropdownMenuItem onClick={() => handleExport('ppt', onExportPPT)}>
            <Presentation className="size-4 mr-2 text-orange-500" />
            PPT 다운로드
          </DropdownMenuItem>
        )}
        {onExportCSV && (
          <DropdownMenuItem onClick={() => handleExport('csv', onExportCSV)}>
            <FileSpreadsheet className="size-4 mr-2 text-green-500" />
            Excel 다운로드
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
