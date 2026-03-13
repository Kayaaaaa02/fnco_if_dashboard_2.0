import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks.js';

/**
 * 등록된 콘텐츠(시딩/가편/UGC/성과)에서 사용된 캠페인명 목록을 수집해
 * 캠페인명 입력 필드의 자동완성(datalist) 옵션으로 사용
 */
export function useCampaignNameOptions() {
    const { seedingContents, previewContents, ugcContents, performanceContents } = useAppSelector(
        (state) => state.crawl
    );

    return useMemo(() => {
        const set = new Set();
        const collect = (list) => {
            if (!Array.isArray(list)) return;
            list.forEach((item) => {
                const name = item?.campaign_name;
                if (name != null && String(name).trim() !== '') set.add(String(name).trim());
            });
        };
        collect(seedingContents);
        collect(previewContents);
        collect(ugcContents);
        collect(performanceContents);
        return [...set].sort();
    }, [seedingContents, previewContents, ugcContents, performanceContents]);
}
