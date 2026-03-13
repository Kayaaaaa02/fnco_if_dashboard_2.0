export function NoAccessPage() {
    return (
        <>
            <div
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        padding: '2rem',
                        maxWidth: '28rem',
                        width: '100%',
                    }}
                >
                    {/* 아이콘 */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '4rem',
                                height: '4rem',
                                backgroundColor: '#fef2f2',
                                borderRadius: '50%',
                            }}
                        >
                            <svg
                                style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* 제목과 설명 */}
                    <div style={{ textAlign: 'center' }}>
                        <h2
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                color: '#1e293b',
                                marginBottom: '1rem',
                            }}
                        >
                            접근 권한이 없습니다
                        </h2>
                        <p
                            style={{
                                color: '#64748b',
                                lineHeight: '1.5',
                                marginBottom: '1rem',
                            }}
                        >
                            인플루언서 시딩 관리 시스템 접근 권한이 없습니다.
                        </p>
                        <div
                            style={{
                                color: '#64748b',
                                lineHeight: '1.6',
                                fontSize: '0.9rem',
                            }}
                        >
                            <p style={{ marginBottom: '0.25rem', fontWeight: '500' }}>
                                권한 문의는 아래 담당자에게 문의 부탁드립니다.
                            </p>
                            <p style={{ marginBottom: '0.2rem' }}>AX팀 김효은 대리</p>
                            <p>AI Engineering팀 김병우 담당</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default NoAccessPage;

