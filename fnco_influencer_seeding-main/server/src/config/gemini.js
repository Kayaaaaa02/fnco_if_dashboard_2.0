import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY가 .env에 설정되지 않았습니다. AI 기능이 MOCK으로 동작합니다.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Gemini 모델 인스턴스를 반환합니다.
 * @param {string} modelName - 기본: gemini-2.5-flash-preview-05-20
 */
export function getModel(modelName = 'gemini-3-flash-preview') {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Gemini API가 사용 가능한지 여부
 */
export function isGeminiAvailable() {
  return !!genAI;
}

export default genAI;
