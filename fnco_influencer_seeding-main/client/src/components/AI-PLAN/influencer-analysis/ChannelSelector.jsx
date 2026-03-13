import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function ChannelSelector({ selectedChannel, onChannelChange }) {
    const t = useTranslation();

    return (
        <div
            className="mb-8"
            style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                padding: '12px',
            }}
        >
            <label
                className="block text-sm font-semibold mb-3"
                style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '10px',
                    marginLeft: '8px',
                }}
            >
                {t('aiPlan.influencerAnalysis.snsChannel')}
            </label>
            <Select value={selectedChannel || 'instagram'} onValueChange={(v) => onChannelChange(v || 'instagram')}>
                <SelectTrigger
                    style={{
                        width: '100%',
                        height: '44px',
                        fontSize: '15px',
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        marginBottom: '10px',
                    }}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
