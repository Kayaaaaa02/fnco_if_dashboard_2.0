import { InfluencerCard } from './InfluencerCard.jsx';
import { Users, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function InfluencerList({ influencers, selectedInfluencers, onToggle, getCategoryColor }) {
    const t = useTranslation();

    return (
        <div
            style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                padding: '20px',
            }}
        >
            {influencers.length === 0 ? (
                <div
                    className="text-center rounded-lg"
                    style={{
                        padding: '60px 20px',
                        backgroundColor: '#F9FAFB',
                        border: '1px dashed #E5E7EB',
                    }}
                >
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#FEF3C7' }}
                    >
                        <AlertCircle className="w-8 h-8" style={{ color: '#F59E0B' }} />
                    </div>
                    <p style={{ fontSize: '15px', color: '#6B7280', fontWeight: '500' }}>
                        {t('aiPlan.influencerAnalysis.noInfluencersFound')}
                    </p>
                    <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>
                        {t('aiPlan.influencerAnalysis.noInfluencersDescription')}
                    </p>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            marginBottom: '12px',
                            padding: '8px 12px',
                            backgroundColor: '#F9FAFB',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <Users size={16} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                            {t('aiPlan.influencerAnalysis.totalInfluencers', { count: influencers.length })}
                        </span>
                    </div>
                    <div
                        style={{
                            maxHeight: '800px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            paddingRight: '4px',
                        }}
                        className="custom-scrollbar"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {influencers.map((influencer) => (
                                <InfluencerCard
                                    key={influencer.id}
                                    influencer={influencer}
                                    isSelected={selectedInfluencers.includes(influencer.id)}
                                    isSaved={influencer.isSaved === true}
                                    onToggle={() => onToggle(influencer.id)}
                                    getCategoryColor={getCategoryColor}
                                />
                            ))}
                        </div>
                    </div>
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #F3F4F6;
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #D1D5DB;
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #9CA3AF;
                        }
                    `}</style>
                </>
            )}
        </div>
    );
}
