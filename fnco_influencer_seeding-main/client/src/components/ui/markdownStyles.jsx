// 마크다운 컴포넌트 스타일
export const markdownComponents = {
    strong: ({ children }) => (
        <strong className="font-extrabold text-base text-gray-900 dark:text-gray-100 bg-yellow-200 dark:bg-yellow-900/40 px-1.5 py-0.5 rounded shadow-sm">
            {children}
        </strong>
    ),
    em: ({ children }) => <em className="italic text-base text-gray-700 dark:text-gray-300">{children}</em>,
    code: ({ children }) => <code className="font-bold text-base text-gray-900 dark:text-gray-100">{children}</code>,
    ul: ({ children }) => <ul className="space-y-0 m-0 ml-1">{children}</ul>,
    ol: ({ children }) => <ol className="space-y-0 m-0 ml-1">{children}</ol>,
    li: ({ children }) => (
        <li className="flex items-start gap-2 text-base text-gray-700 dark:text-gray-300">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 flex-shrink-0"></span>
            <span className="flex-1 leading-7">{children}</span>
        </li>
    ),
    p: ({ children }) => <p className="m-0 leading-7 text-base text-gray-800 dark:text-gray-200">{children}</p>,
    h1: ({ children }) => (
        <h1 className="text-base font-bold m-0 leading-7 text-gray-900 dark:text-gray-100">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-base font-bold m-0 leading-7 text-gray-900 dark:text-gray-100">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-base font-semibold m-0 leading-7 text-gray-900 dark:text-gray-100">{children}</h3>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 m-0 italic text-base text-gray-700 dark:text-gray-300 rounded-r leading-7">
            {children}
        </blockquote>
    ),
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 font-medium"
        >
            {children}
        </a>
    ),
    hr: () => <hr className="m-0 border-gray-300 dark:border-gray-600" />,
};
