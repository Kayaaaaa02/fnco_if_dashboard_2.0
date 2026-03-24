# 내보내기 기능 추가

PDF, PPT, CSV, Excel 등 새로운 내보내기 형식을 추가합니다.

## 입력
- $ARGUMENTS: 내보내기 대상과 형식 (예: "인플루언서 목록 Excel", "캠페인 리포트 PPT" 등)

## 수행 작업

1. **Export 유틸리티** 생성/확장: `client/src/lib/export{Format}.js`
   - 패턴 참고:
     - `client/src/lib/exportPDF.js` — html2pdf.js 기반
     - `client/src/lib/exportPPT.js` — pptxgenjs 기반
     - `client/src/lib/exportCSV.js` — CSV 생성

2. **ExportMenu 컴포넌트 확장** (필요 시):
   - `client/src/components/export/ExportMenu.jsx`에 새 형식 옵션 추가

3. **서버사이드 내보내기** (대용량 데이터 시):
   - Controller에 export 핸들러 추가
   - Content-Type 헤더 설정 (application/octet-stream 등)
   - 스트리밍 응답 고려

## 기존 Export 패턴
```js
// PDF: html2pdf.js
import html2pdf from 'html2pdf.js';
export async function exportToPDF(element, filename) { ... }

// PPT: pptxgenjs
import PptxGenJS from 'pptxgenjs';

// CSV: 직접 생성
export function exportToCSV(data, headers, filename) { ... }
```

## 규칙
- 기존 export 유틸리티를 수정하지 않는다
- 파일명에 날짜 포함 권장 (`{name}_YYYYMMDD.{ext}`)
- 대용량 데이터는 서버사이드 처리
- 한국어 인코딩 처리 (BOM 추가 등)
