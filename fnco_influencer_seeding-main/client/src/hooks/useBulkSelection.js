import { useState, useCallback, useMemo } from 'react';

/**
 * 대량 선택 상태 관리 훅
 * @param {Array} items - 선택 가능한 항목 배열 (각 항목에 id 또는 profile_id 필요)
 * @param {string} idKey - 항목의 ID 키 (기본값: 'id')
 */
export function useBulkSelection(items = [], idKey = 'id') {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const itemIds = useMemo(
    () => items.map((item) => String(item[idKey] || item.profile_id || item.id)),
    [items, idKey]
  );

  const isSelected = useCallback(
    (id) => selectedIds.has(String(id)),
    [selectedIds]
  );

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const strId = String(id);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds));
  }, [itemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(
    () => itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id)),
    [itemIds, selectedIds]
  );

  const selectedCount = useMemo(
    () => selectedIds.size,
    [selectedIds]
  );

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  return {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    clearSelection,
    isAllSelected,
    selectedCount,
    toggleAll,
  };
}
