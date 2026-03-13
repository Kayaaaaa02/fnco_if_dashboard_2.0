/**
 * Recursive JSON diff utility for comparing two objects.
 * Returns an array of changes with path, type, old/new values.
 */

/**
 * Compare two JSON objects and return a diff
 * @param {any} oldObj - Previous version
 * @param {any} newObj - Current version
 * @param {string} parentPath - Internal: dot-separated path prefix
 * @returns {Array<{path: string, type: 'added'|'removed'|'changed', oldValue: any, newValue: any}>}
 */
export function computeDiff(oldObj, newObj, parentPath = '') {
  const changes = [];

  // Both null/undefined — no change
  if (oldObj === newObj) return changes;

  // Handle null/undefined edges
  if (oldObj == null && newObj == null) return changes;
  if (oldObj == null) {
    changes.push({ path: parentPath || '(root)', type: 'added', oldValue: undefined, newValue: newObj });
    return changes;
  }
  if (newObj == null) {
    changes.push({ path: parentPath || '(root)', type: 'removed', oldValue: oldObj, newValue: undefined });
    return changes;
  }

  // Primitives (string, number, boolean)
  if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
    if (oldObj !== newObj) {
      changes.push({ path: parentPath || '(root)', type: 'changed', oldValue: oldObj, newValue: newObj });
    }
    return changes;
  }

  // Arrays
  if (Array.isArray(oldObj) || Array.isArray(newObj)) {
    if (!Array.isArray(oldObj) || !Array.isArray(newObj)) {
      changes.push({ path: parentPath || '(root)', type: 'changed', oldValue: oldObj, newValue: newObj });
      return changes;
    }
    const maxLen = Math.max(oldObj.length, newObj.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = parentPath ? `${parentPath}[${i}]` : `[${i}]`;
      if (i >= oldObj.length) {
        changes.push({ path: itemPath, type: 'added', oldValue: undefined, newValue: newObj[i] });
      } else if (i >= newObj.length) {
        changes.push({ path: itemPath, type: 'removed', oldValue: oldObj[i], newValue: undefined });
      } else {
        changes.push(...computeDiff(oldObj[i], newObj[i], itemPath));
      }
    }
    return changes;
  }

  // Objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    const childPath = parentPath ? `${parentPath}.${key}` : key;
    if (!(key in oldObj)) {
      changes.push({ path: childPath, type: 'added', oldValue: undefined, newValue: newObj[key] });
    } else if (!(key in newObj)) {
      changes.push({ path: childPath, type: 'removed', oldValue: oldObj[key], newValue: undefined });
    } else {
      changes.push(...computeDiff(oldObj[key], newObj[key], childPath));
    }
  }

  return changes;
}

/**
 * Korean label map for common strategy/creative field paths
 */
const LABEL_MAP = {
  strategy: '전략',
  target_audience: '대상 청중',
  age_range: '연령대',
  gender: '성별',
  interests: '관심사',
  channels: '채널',
  messaging: '메시징',
  key_messages: '핵심 메시지',
  tone: '톤',
  kpis: 'KPI',
  metrics: '지표',
  target: '목표',
  budget: '예산',
  timeline: '타임라인',
  start_date: '시작일',
  end_date: '종료일',
  status: '상태',
  version: '버전',
  name: '이름',
  description: '설명',
  concept_name: '컨셉명',
  copy_title: '카피 제목',
  copy_body: '카피 본문',
  scenario: '시나리오',
  scenes: '장면',
  hook: '훅',
  cta: 'CTA',
  pain_point: '페인포인트',
  desire: '욕구',
  awareness_stage: '인지 단계',
  content_type: '콘텐츠 유형',
  platform: '플랫폼',
  hashtags: '해시태그',
  keywords: '키워드',
  items: '항목',
  unit: '단위',
  goal: '목표',
  channel: '채널',
  message: '메시지',
  text: '텍스트',
  image_prompt: '이미지 프롬프트',
  image_url: '이미지 URL',
};

/**
 * Get human-readable Korean label for a diff path
 * Converts 'strategy.target_audience.age_range' to '전략 > 대상 청중 > 연령대'
 * @param {string} path - Dot-separated path with optional array indices
 * @returns {string} Human-readable Korean label
 */
export function getPathLabel(path) {
  if (!path) return '';
  // Split on dots and bracket notation
  const segments = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((seg) => {
      // If it's a number (array index), format as Korean index
      if (/^\d+$/.test(seg)) {
        return `${Number(seg) + 1}번째`;
      }
      return LABEL_MAP[seg] || seg;
    });
  return segments.join(' > ');
}

/**
 * Summarize diff changes into counts
 * @param {Array} changes - Output of computeDiff
 * @returns {{ added: number, changed: number, removed: number }}
 */
export function summarizeDiff(changes) {
  return changes.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    },
    { added: 0, changed: 0, removed: 0 }
  );
}

/**
 * Group changes by their top-level key
 * @param {Array} changes - Output of computeDiff
 * @returns {Map<string, Array>} Grouped changes
 */
export function groupChangesByRoot(changes) {
  const groups = new Map();
  for (const change of changes) {
    const rootKey = change.path.split('.')[0].replace(/\[\d+\]/, '');
    if (!groups.has(rootKey)) {
      groups.set(rootKey, []);
    }
    groups.get(rootKey).push(change);
  }
  return groups;
}
