import { Button } from '../ui/button.jsx';
import { ArrowLeft } from 'lucide-react';

export function AIPlanResult({ onBack }) {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" onClick={onBack} className="mb-4 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        뒤로가기
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">결과 요약</h1>
                    <p className="text-muted-foreground">AI 기획안의 결과를 요약합니다.</p>
                </div>
                <div className="bg-card rounded-lg border p-6">
                    <p className="text-muted-foreground">결과 요약 내용이 여기에 표시됩니다.</p>
                </div>
            </div>
        </div>
    );
}
