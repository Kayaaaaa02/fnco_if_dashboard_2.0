import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'fnco_confirmed_concepts';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * 캠페인별 확정·잠금 컨셉 관리 훅
 * - confirmed: 콘텐츠 기획에서 체크된 컨셉 (아직 편집 가능)
 * - locked: 콘텐츠 제작으로 넘어간 컨셉 (편집 불가)
 */
export function useConfirmedConcepts(campaignId) {
  const key = campaignId || 'default';

  const [store, setStore] = useState(() => {
    const all = readStore();
    return all[key] || { confirmed: [], locked: [] };
  });

  const persist = useCallback((next) => {
    setStore(next);
    const all = readStore();
    all[key] = next;
    writeStore(all);
  }, [key]);

  // 확정 토글 (잠금 아닌 것만)
  const toggleConfirm = useCallback((conceptId) => {
    if (!conceptId) return;
    setStore((prev) => {
      if (prev.locked.includes(conceptId)) return prev; // 잠금된 건 변경 불가
      const confirmed = prev.confirmed.includes(conceptId)
        ? prev.confirmed.filter((id) => id !== conceptId)
        : [...prev.confirmed, conceptId];
      const next = { ...prev, confirmed };
      const all = readStore(); all[key] = next; writeStore(all);
      return next;
    });
  }, [key]);

  // 전체 확정
  const confirmAll = useCallback((conceptIds) => {
    setStore((prev) => {
      const newIds = conceptIds.filter((id) => !prev.locked.includes(id));
      const merged = [...new Set([...prev.confirmed, ...newIds])];
      const next = { ...prev, confirmed: merged };
      const all = readStore(); all[key] = next; writeStore(all);
      return next;
    });
  }, [key]);

  // 전체 해제 (잠금 아닌 것만)
  const clearConfirmed = useCallback(() => {
    setStore((prev) => {
      const next = { ...prev, confirmed: [] };
      const all = readStore(); all[key] = next; writeStore(all);
      return next;
    });
  }, [key]);

  // 확정된 컨셉을 잠금 (콘텐츠 제작으로 넘기기)
  const lockConfirmed = useCallback(() => {
    setStore((prev) => {
      const newLocked = [...new Set([...prev.locked, ...prev.confirmed])];
      const next = { confirmed: [], locked: newLocked };
      const all = readStore(); all[key] = next; writeStore(all);
      return next;
    });
  }, [key]);

  // 개별 잠금 해제 (콘텐츠 제작에서 삭제)
  const unlockConcept = useCallback((conceptId) => {
    if (!conceptId) return;
    setStore((prev) => {
      const locked = prev.locked.filter((id) => id !== conceptId);
      const next = { ...prev, locked };
      const all = readStore(); all[key] = next; writeStore(all);
      return next;
    });
  }, [key]);

  const isConfirmed = useCallback((conceptId) => {
    return store.confirmed.includes(conceptId) || store.locked.includes(conceptId);
  }, [store]);

  const isLocked = useCallback((conceptId) => {
    return store.locked.includes(conceptId);
  }, [store]);

  const confirmedCount = store.confirmed.length + store.locked.length;
  const lockedCount = store.locked.length;
  const confirmedIds = useMemo(() => new Set([...store.confirmed, ...store.locked]), [store]);
  const lockedIds = useMemo(() => new Set(store.locked), [store]);

  return {
    confirmedIds,
    lockedIds,
    confirmedCount,
    lockedCount,
    isConfirmed,
    isLocked,
    toggleConfirm,
    confirmAll,
    clearConfirmed,
    lockConfirmed,
    unlockConcept,
  };
}
