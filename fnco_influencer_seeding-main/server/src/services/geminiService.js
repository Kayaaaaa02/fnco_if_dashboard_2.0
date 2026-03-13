import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { getModel, isGeminiAvailable } from '../config/gemini.js';
import {
  SYSTEM_PROMPT,
  PRODUCT_ANALYSIS_PROMPT,
  PERSONA_PROMPT,
  DESIRE_PROMPT,
  AWARENESS_PROMPT,
  CONCEPT_PROMPT,
  buildCampaignContext,
  buildPDAContext,
  buildMasterPDAContext,
} from '../config/pdaPrompts.js';

/**
 * Gemini 응답에서 JSON을 안전하게 파싱
 */
function parseJSON(text) {
  // ```json ... ``` 블록 제거
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // 첫 [ 또는 { 이전의 텍스트 제거
  const firstBracket = Math.min(
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
  );
  if (firstBracket !== Infinity) {
    cleaned = cleaned.slice(firstBracket);
  }
  // 마지막 ] 또는 } 이후의 텍스트 제거
  const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (lastBracket !== -1) {
    cleaned = cleaned.slice(0, lastBracket + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * PPTX 파일에서 슬라이드 텍스트를 추출
 */
function extractPptxText(absPath) {
  try {
    const zip = new AdmZip(absPath);
    const entries = zip.getEntries();
    const slideTexts = [];

    // ppt/slides/slide1.xml, slide2.xml ... 순서대로 추출
    const slideEntries = entries
      .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    for (const entry of slideEntries) {
      const xml = entry.getData().toString('utf8');
      // XML 태그 제거하고 텍스트만 추출
      const texts = [];
      const regex = /<a:t>([^<]*)<\/a:t>/g;
      let match;
      while ((match = regex.exec(xml)) !== null) {
        if (match[1].trim()) texts.push(match[1].trim());
      }
      if (texts.length > 0) {
        const slideNum = entry.entryName.match(/slide(\d+)/)?.[1] || '?';
        slideTexts.push(`[슬라이드 ${slideNum}]\n${texts.join(' ')}`);
      }
    }

    return slideTexts.join('\n\n');
  } catch (err) {
    console.warn('[extractPptxText] PPTX 텍스트 추출 실패:', err.message);
    return '';
  }
}

/**
 * 제품 파일을 Gemini parts 배열로 반환
 * - 이미지/PDF: Base64 inlineData
 * - PPT/PPTX: 텍스트 추출 후 텍스트 part로 반환
 */
function loadProductFileParts(productFilePath) {
  if (!productFilePath) return [];
  try {
    const absPath = path.isAbsolute(productFilePath)
      ? productFilePath
      : path.join(process.cwd(), productFilePath);
    if (!fs.existsSync(absPath)) return [];

    const ext = path.extname(absPath).toLowerCase();

    // PPT/PPTX → 텍스트 추출 후 텍스트 part로 전달
    if (ext === '.ppt' || ext === '.pptx') {
      const extractedText = extractPptxText(absPath);
      if (extractedText) {
        console.log(`[loadProductFileParts] PPTX 텍스트 추출 완료 (${extractedText.length}자)`);
        return [{ text: `\n\n=== 첨부된 제품 기획서 (PPT) 내용 ===\n${extractedText}\n=== 기획서 끝 ===` }];
      }
      console.warn('[loadProductFileParts] PPTX에서 텍스트를 추출할 수 없습니다.');
      return [];
    }

    // 이미지/PDF → Base64 inlineData
    const mimeMap = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
    };
    const mimeType = mimeMap[ext];
    if (!mimeType) {
      console.warn(`[loadProductFileParts] 지원하지 않는 파일 형식 (${ext}), 스킵`);
      return [];
    }
    const data = fs.readFileSync(absPath).toString('base64');
    return [{ inlineData: { mimeType, data } }];
  } catch (err) {
    console.warn('[loadProductFileParts] 파일 로드 실패:', err.message);
    return [];
  }
}

/**
 * Gemini API 호출 래퍼 (텍스트 전용)
 */
async function callGemini(userPrompt) {
  return callGeminiMultimodal(userPrompt, null);
}

/**
 * Gemini API 멀티모달 호출 (텍스트 + 이미지)
 */
async function callGeminiMultimodal(userPrompt, productFilePath) {
  const model = getModel();
  if (!model) throw new Error('Gemini API를 사용할 수 없습니다.');

  const parts = [
    { text: SYSTEM_PROMPT + '\n\n' + userPrompt },
    ...loadProductFileParts(productFilePath),
  ];

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  });

  const text = result.response.text();
  return parseJSON(text);
}

/**
 * 제품 분석 결과 생성
 */
export async function analyzeProduct(campaign, productFilePath, masterPDA) {
  const context = buildCampaignContext(campaign);
  const masterCtx = masterPDA ? buildMasterPDAContext(masterPDA.personas, masterPDA.desires, masterPDA.awareness) : '';
  const imageNote = productFilePath ? '\n\n첨부된 제품 이미지를 함께 분석하여 제품의 패키징, 디자인, 타겟층, 소구점을 시각적으로도 파악하세요.' : '';
  const prompt = `${PRODUCT_ANALYSIS_PROMPT}${imageNote}\n\n=== 캠페인 정보 ===\n${context}${masterCtx ? `\n\n${masterCtx}` : ''}`;
  return callGeminiMultimodal(prompt, productFilePath);
}

/**
 * 페르소나 생성 — 마스터 페르소나 풀 기반 선정
 */
export async function generatePersonas(campaign, productFilePath, masterPDA) {
  const context = buildCampaignContext(campaign);
  const masterCtx = masterPDA ? buildMasterPDAContext(masterPDA.personas, masterPDA.desires, masterPDA.awareness) : '';
  const imageNote = productFilePath ? '\n\n첨부된 제품 이미지를 참고하여 이 제품에 가장 적합한 타겟 페르소나를 선정하세요.' : '';
  const prompt = `${PERSONA_PROMPT}${imageNote}\n\n=== 캠페인 정보 ===\n${context}${masterCtx ? `\n\n${masterCtx}` : ''}`;
  const result = await callGeminiMultimodal(prompt, productFilePath);
  // 안전장치: 정확히 3개로 제한
  return Array.isArray(result) ? result.slice(0, 3) : result;
}

/**
 * 욕구 생성 — 마스터 욕구 풀 기반 선정
 */
export async function generateDesires(campaign, personas, productFilePath, masterPDA) {
  const context = buildCampaignContext(campaign);
  const personaContext = personas
    .map((p) => `${p.code} "${p.name}": ${p.profile_json?.occupation || ''}, 고민=${(p.profile_json?.pain_points || []).join('/')}`)
    .join('\n');
  const masterCtx = masterPDA ? buildMasterPDAContext(null, masterPDA.desires, null) : '';
  const imageNote = productFilePath ? '\n\n첨부된 제품 이미지를 참고하여 이 제품이 충족할 수 있는 욕구를 분석하세요.' : '';
  const prompt = `${DESIRE_PROMPT}${imageNote}\n\n=== 캠페인 정보 ===\n${context}\n\n=== 선정된 페르소나 ===\n${personaContext}${masterCtx ? `\n\n${masterCtx}` : ''}`;
  const result = await callGeminiMultimodal(prompt, productFilePath);
  // 안전장치: 정확히 3개로 제한
  return Array.isArray(result) ? result.slice(0, 3) : result;
}

/**
 * 인지 단계 생성 — 4단계 인지 여정 (선정된 페르소나/욕구 참조)
 */
export async function generateAwareness(campaign, productFilePath, masterPDA, personas, desires) {
  const context = buildCampaignContext(campaign);
  const masterCtx = masterPDA ? buildMasterPDAContext(null, null, masterPDA.awareness) : '';
  const imageNote = productFilePath ? '\n\n첨부된 제품 이미지를 참고하여 인지 단계별 전략을 설계하세요.' : '';

  // 선정된 페르소나/욕구가 있으면 컨텍스트에 포함 (인지 단계 전략이 타겟에 맞춰지도록)
  let pdaRef = '';
  if (personas?.length) {
    const pLines = personas.map((p) => `  ${p.code} "${p.name}": ${p.profile_json?.occupation || ''}, 고민=${(p.profile_json?.pain_points || []).join('/')}`);
    pdaRef += `\n\n=== 선정된 페르소나 ===\n${pLines.join('\n')}`;
  }
  if (desires?.length) {
    const dLines = desires.map((d) => `  ${d.code} "${d.name}": ${d.definition || ''}`);
    pdaRef += `\n\n=== 도출된 욕구 ===\n${dLines.join('\n')}`;
  }

  const prompt = `${AWARENESS_PROMPT}${imageNote}\n\n=== 캠페인 정보 ===\n${context}${masterCtx ? `\n\n${masterCtx}` : ''}${pdaRef}`;
  const result = await callGeminiMultimodal(prompt, productFilePath);
  // 안전장치: 정확히 4개로 제한
  return Array.isArray(result) ? result.slice(0, 4) : result;
}

/**
 * 컨셉 생성 (P×D×A 매트릭스 기반)
 */
export async function generateConceptsAI(campaign, personas, desires, awareness, productFilePath) {
  const context = buildCampaignContext(campaign);
  const pdaContext = buildPDAContext(personas, desires, awareness);
  const imageNote = productFilePath ? '\n\n첨부된 제품 이미지를 참고하여 제품 특성에 맞는 콘텐츠 컨셉을 설계하세요.' : '';

  // 프롬프트 내 {P1},{D1} 등 플레이스홀더를 실제 code로 치환
  const pCodes = personas.map(p => p.code);
  const dCodes = desires.map(d => d.code);
  let conceptPrompt = CONCEPT_PROMPT
    .replace(/\{P1\}/g, pCodes[0] || 'P1').replace(/\{P2\}/g, pCodes[1] || 'P2').replace(/\{P3\}/g, pCodes[2] || 'P3')
    .replace(/\{D1\}/g, dCodes[0] || 'D1').replace(/\{D2\}/g, dCodes[1] || 'D2').replace(/\{D3\}/g, dCodes[2] || 'D3');

  const prompt = `${conceptPrompt}${imageNote}\n\n=== 캠페인 정보 ===\n${context}\n\n${pdaContext}`;
  return callGeminiMultimodal(prompt, productFilePath);
}

export { isGeminiAvailable };
