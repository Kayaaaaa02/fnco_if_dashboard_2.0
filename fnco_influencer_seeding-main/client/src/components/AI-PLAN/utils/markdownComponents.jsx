import React from 'react';

// 마크다운 텍스트 전처리: **텍스트**와 헤딩을 HTML로 변환
export const preprocessMarkdown = (text) => {
    if (!text) return text;

    let processed = text;

    // 헤딩 처리: ### 텍스트 -> <h3>텍스트</h3>
    processed = processed.replace(
        /^### (.+)$/gm,
        '<h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 16px; margin-bottom: 8px;">$1</h3>'
    );
    processed = processed.replace(
        /^## (.+)$/gm,
        '<h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-top: 16px; margin-bottom: 8px;">$1</h2>'
    );
    processed = processed.replace(
        /^# (.+)$/gm,
        '<h1 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 16px; margin-bottom: 8px;">$1</h1>'
    );

    // 리스트 항목 처리: * 또는 - 로 시작하는 줄을 <ul><li> 구조로 변환 (볼드체 변환 전에 처리)
    const lines = processed.split('\n');
    const result = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // * 또는 - 뒤에 공백이 하나 이상 오는 패턴 매칭
        const listMatch = line.match(/^[-*]\s+(.+)$/);

        if (listMatch) {
            if (!inList) {
                result.push('<ul style="padding-left: 20px; margin: 8px 0; list-style-type: disc;">');
                inList = true;
            }
            result.push(`<li style="margin-bottom: 4px;">${listMatch[1]}</li>`);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(line);
        }
    }

    if (inList) {
        result.push('</ul>');
    }

    processed = result.join('\n');

    // **텍스트** 패턴을 <strong style="font-weight: 700; color: #111827;">텍스트</strong>로 변환
    // 작은따옴표나 다른 특수문자 안에 있어도 작동하도록 처리
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #111827;">$1</strong>');

    // 텍스트 중간에 남아있는 리스트 마커 제거 (쉼표 뒤의 * 또는 -)
    // 볼드체 태그 뒤나 쉼표 뒤의 * 또는 - 제거
    processed = processed.replace(/(<\/strong>|,)\s*[-*]\s+/g, '$1 ');

    // 리스트 태그 사이의 불필요한 줄바꿈 제거
    processed = processed.replace(/(<\/li>)\s*\n\s*(<li[^>]*>)/g, '$1$2');
    processed = processed.replace(/(<ul[^>]*>)\s*\n\s*(<li[^>]*>)/g, '$1$2');
    processed = processed.replace(/(<\/li>)\s*\n\s*(<\/ul>)/g, '$1$2');

    // 줄바꿈 처리
    processed = processed.replace(/\n\n+/g, '</p><p>');
    processed = processed.replace(/\n/g, '<br />');

    return processed;
};

// 공통 마크다운 컴포넌트 스타일
export const simpleMarkdownComponents = {
    strong: ({ children }) => (
        <strong
            className="font-bold"
            style={{
                fontWeight: 700,
                color: '#111827',
            }}
        >
            {children}
        </strong>
    ),
    em: ({ children }) => (
        <em className="italic" style={{ fontStyle: 'italic' }}>
            {children}
        </em>
    ),
    p: ({ children }) => (
        <p
            className="mb-2 last:mb-0"
            style={{
                lineHeight: '1.6',
                marginBottom: '8px',
            }}
        >
            {children}
        </p>
    ),
    h1: ({ children }) => (
        <h1 className="text-base font-bold mb-2" style={{ fontWeight: 700, marginBottom: '8px' }}>
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-base font-bold mb-2" style={{ fontWeight: 700, marginBottom: '8px' }}>
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold mb-2" style={{ fontWeight: 600, marginBottom: '8px' }}>
            {children}
        </h3>
    ),
    // 리스트 항목도 지원
    ul: ({ children }) => (
        <ul style={{ paddingLeft: '20px', marginBottom: '8px', listStyleType: 'disc' }}>{children}</ul>
    ),
    ol: ({ children }) => (
        <ol style={{ paddingLeft: '20px', marginBottom: '8px', listStyleType: 'decimal' }}>{children}</ol>
    ),
    li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
};
