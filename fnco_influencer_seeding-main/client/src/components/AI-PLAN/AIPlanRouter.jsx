import { AIPlanDashboard } from './Dashboard.jsx';
import { AIPlanConfirm } from './Confirm.jsx';
import { AIPlanResult } from './Result.jsx';
import { ProductAnalysis } from './ProductAnalysis.jsx';
import { InfluencerAnalysis } from './InfluencerAnalysis.jsx';
import { Modify } from './Modify.jsx';
import { AIImageGeneration } from './ai-image-generation/AIImageGeneration.jsx';
import { FinalReview } from './FinalReview.jsx';

export function AIPlanRouter({
    currentPath,
    onNavigate,
    onBack,
    user,
    onLogout,
    completionStatus,
    parsedData,
    onParsingComplete,
    pendingUploadData,
    onSetPendingUploadData,
}) {
    // /AI-PLAN/Dashboard
    if (currentPath === '/AI-PLAN/Dashboard' || currentPath === '/AI-PLAN') {
        return (
            <AIPlanDashboard
                onBack={onBack}
                onNavigate={onNavigate}
                user={user}
                onLogout={onLogout}
                completionStatus={completionStatus || {}}
                pendingUploadData={pendingUploadData}
                onSetPendingUploadData={onSetPendingUploadData}
            />
        );
    }

    // /AI-PLAN/ProductAnalysis
    if (currentPath === '/AI-PLAN/ProductAnalysis' || currentPath === 'ProductAnalysis') {
        return (
            <ProductAnalysis
                navigateToPage={onNavigate}
                onParsingComplete={onParsingComplete}
                parsedData={parsedData}
                completionStatus={completionStatus || {}}
                user={user}
                onLogout={onLogout}
                onBack={onBack}
                pendingUploadData={pendingUploadData}
                onSetPendingUploadData={onSetPendingUploadData}
            />
        );
    }

    // /AI-PLAN/InfluencerAnalysis
    if (currentPath === '/AI-PLAN/InfluencerAnalysis' || currentPath === 'InfluencerAnalysis') {
        return (
            <InfluencerAnalysis
                navigateToPage={onNavigate}
                completionStatus={completionStatus || {}}
                user={user}
                onLogout={onLogout}
                onBack={onBack}
            />
        );
    }

    // /AI-PLAN/Modify
    if (currentPath === '/AI-PLAN/Modify' || currentPath === 'Modify') {
        return (
            <Modify
                navigateToPage={onNavigate}
                completionStatus={completionStatus || {}}
                user={user}
                onLogout={onLogout}
                onBack={onBack}
            />
        );
    }

    // /AI-PLAN/AIImageGeneration
    if (currentPath === '/AI-PLAN/AIImageGeneration' || currentPath === 'AIImageGeneration') {
        return (
            <AIImageGeneration
                navigateToPage={onNavigate}
                completionStatus={completionStatus || {}}
                user={user}
                onLogout={onLogout}
                onBack={onBack}
            />
        );
    }

    // /AI-PLAN/FinalReview
    if (currentPath === '/AI-PLAN/FinalReview' || currentPath === 'FinalReview') {
        return (
            <FinalReview
                navigateToPage={onNavigate}
                completionStatus={completionStatus || {}}
                user={user}
                onLogout={onLogout}
                onBack={onBack}
            />
        );
    }

    // /AI-PLAN/Confirm
    if (currentPath === '/AI-PLAN/Confirm') {
        return <AIPlanConfirm onBack={onBack} onNavigate={onNavigate} />;
    }

    // /AI-PLAN/Result
    if (currentPath === '/AI-PLAN/Result') {
        return <AIPlanResult onBack={onBack} onNavigate={onNavigate} />;
    }

    // 기본값: Dashboard로 리다이렉트
    return <AIPlanDashboard onBack={onBack} onNavigate={onNavigate} />;
}
