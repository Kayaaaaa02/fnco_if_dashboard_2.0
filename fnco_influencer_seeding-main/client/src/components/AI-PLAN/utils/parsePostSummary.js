/**
 * ai_post_summary 텍스트를 파싱하여 구조화된 데이터로 변환
 * 한국어, 중국어, 영어 모두 지원
 * @param {string} summaryText - ai_post_summary 원본 텍스트
 * @returns {Object|null} 파싱된 결과 객체 또는 null
 */
export const parsePostSummary = (summaryText) => {
    if (!summaryText) return null;

    const result = {
        핵심내용알고리즘진단: null, // 3. 주목할 점 / 值得关注的点 / Notable Points
        핵심메시지: null, // 1. 핵심 내용 / 核心内容 / Core Content
        타겟오디언스: null, // 2. 타겟 오디언스 / 目标受众 / Target Audience
        콘텐츠스타일: null, // 4. 콘텐츠 스타일 / 内容风格 / Content Style
        톤앤무드: null, // 5. 톤앤무드 / 语调与氛围 / Tone & Mood
        콘텐츠특징: null, // 6. 콘텐츠 특징 / 内容特征 / Content Features
        벤치마킹요소: null, // 벤치마킹 요소 (추가 정보)
        적용제안: null, // 적용 제안 (추가 정보)
        초반3초후킹: null, // 초반 3초 후킹 (추가 정보)
        킬링포인트: null, // 킬링 포인트 (추가 정보)
    };

    // 헬퍼 함수: 마크다운 bold 제거 및 정리
    const cleanText = (text) => {
        if (!text) return null;
        return text.trim().replace(/\*\*(.+?)\*\*/g, '$1');
    };

    // 헬퍼 함수: 섹션 추출 (다양한 형식 지원)
    const extractSection = (text, patterns) => {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return cleanText(match[1]);
            }
        }
        return null;
    };

    // 1. 핵심 내용 / 核心内容 / Core Content 추출
    const 핵심내용Patterns = [
        // 한국어
        /(?:^|\n+)\s*(?:\*\*)?\s*1\.\s*(?:\*\*)?핵심\s+내용(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[2-9]\.|$)/s,
        // 중국어
        /(?:^|\n+)\s*(?:\*\*)?\s*1\.\s*(?:\*\*)?核心内容(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[2-9]\.|$)/s,
        // 영어
        /(?:^|\n+)\s*(?:\*\*)?\s*(?:\*\*)?\s*1\.\s*(?:\*\*)?\s*Core\s+Content(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[2-9]\.|$)/s,
    ];
    result.핵심메시지 = extractSection(summaryText, 핵심내용Patterns);

    // 2. 타겟 오디언스 / 目标受众 / Target Audience 추출
    const 타겟오디언스Patterns = [
        // 한국어
        /(?:^|\n+)\s*(?:\*\*)?\s*2\.\s*(?:\*\*)?타겟\s+오디언스(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[3-9]\.|$)/s,
        // 중국어
        /(?:^|\n+)\s*(?:\*\*)?\s*2\.\s*(?:\*\*)?目标受众(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[3-9]\.|$)/s,
        // 영어
        /(?:^|\n+)\s*(?:\*\*)?\s*(?:\*\*)?\s*2\.\s*(?:\*\*)?\s*Target\s+Audience(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[3-9]\.|$)/s,
    ];
    result.타겟오디언스 = extractSection(summaryText, 타겟오디언스Patterns);

    // 3. 주목할 점 / 值得关注的点 / Notable Points 추출
    const 주목할점Patterns = [
        // 한국어
        /(?:^|\n+)\s*(?:\*\*)?\s*3\.\s*(?:\*\*)?주목할\s+점(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[4-9]\.|$)/s,
        // 중국어
        /(?:^|\n+)\s*(?:\*\*)?\s*3\.\s*(?:\*\*)?值得关注的点(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[4-9]\.|$)/s,
        // 영어
        /(?:^|\n+)\s*(?:\*\*)?\s*(?:\*\*)?\s*3\.\s*(?:\*\*)?\s*Notable\s+Points(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[4-9]\.|$)/s,
    ];
    result.핵심내용알고리즘진단 = extractSection(summaryText, 주목할점Patterns);

    // 4. 콘텐츠 스타일 / 内容风格 / Content Style 추출
    const 콘텐츠스타일Patterns = [
        // 한국어
        /(?:^|\n+)\s*(?:\*\*)?\s*4\.\s*(?:\*\*)?콘텐츠\s+스타일(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[5-9]\.|\s*(?:\*\*)?\s*[5-9]\.|$)/s,
        // 중국어
        /(?:^|\n+)\s*(?:\*\*)?\s*4\.\s*(?:\*\*)?内容风格(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[5-9]\.|\s*(?:\*\*)?\s*[5-9]\.|$)/s,
        // 영어
        /(?:^|\n+)\s*(?:\*\*)?\s*(?:\*\*)?\s*4\.\s*(?:\*\*)?\s*Content\s+Style(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*[5-9]\.|\s*(?:\*\*)?\s*[5-9]\.|$)/s,
    ];
    result.콘텐츠스타일 = extractSection(summaryText, 콘텐츠스타일Patterns);

    // 5. 톤앤무드 / 语调与氛围 / Tone & Mood 추출
    const 톤앤무드Patterns = [
        // 한국어
        /(?:^|\n+)\s*(?:\*\*)?\s*5\.\s*(?:\*\*)?톤앤무드(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*6\.|\s*(?:\*\*)?\s*6\.|$)/s,
        // 중국어
        /(?:^|\n+)\s*(?:\*\*)?\s*5\.\s*(?:\*\*)?语调与氛围(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*6\.|\s*(?:\*\*)?\s*6\.|$)/s,
        // 영어
        /(?:^|\n+)\s*(?:\*\*)?\s*(?:\*\*)?\s*5\.\s*(?:\*\*)?\s*Tone\s*&\s*Mood(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+\s*(?:\*\*)?\s*6\.|\s*(?:\*\*)?\s*6\.|$)/s,
    ];
    result.톤앤무드 = extractSection(summaryText, 톤앤무드Patterns);

    // 6. 콘텐츠 특징 / 内容特征 / Content Features 추출
    const 콘텐츠특징Patterns = [
        // 한국어
        /(?:^|\n+)\s*(?:\*\*)?\s*6\.\s*(?:\*\*)?콘텐츠\s+특징(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+|$)/s,
        // 중국어
        /(?:^|\n+)\s*(?:\*\*)?\s*6\.\s*(?:\*\*)?内容特征(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+|$)/s,
        // 영어
        /(?:^|\n+)\s*(?:\*\*)?\s*(?:\*\*)?\s*6\.\s*(?:\*\*)?\s*Content\s+Features(?:\*\*)?[^\n]*(?::\s*)?\s*\n+(.+?)(?=\n\n+|$)/s,
    ];
    result.콘텐츠특징 = extractSection(summaryText, 콘텐츠특징Patterns);

    return result;
};
