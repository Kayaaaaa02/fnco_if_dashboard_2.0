import { useRegion } from '../hooks/useTranslation.js';
import { setRegion } from '../store/slices/i18nSlice.js';
import { useAppDispatch } from '../store/hooks.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import koreaFlag from '../assets/images/flags/korea.jpg';

export function LanguageRegionSelect({ className, style }) {
    const dispatch = useAppDispatch();
    const currentRegion = useRegion();

    return (
        <Select value={currentRegion} onValueChange={(value) => dispatch(setRegion(value))}>
            <SelectTrigger className={className} style={style}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        {currentRegion === 'global' && (
                            <>
                                <img
                                    src="https://flagcdn.com/w20/us.png"
                                    alt="US"
                                    style={{ width: '16px', height: '12px' }}
                                />
                                <span>English</span>
                            </>
                        )}
                        {currentRegion === 'korea' && (
                            <>
                                <img
                                    src={koreaFlag}
                                    alt="Korea"
                                    style={{
                                        width: '16px',
                                        height: '12px',
                                        objectFit: 'cover',
                                    }}
                                />
                                <span>한국어</span>
                            </>
                        )}
                        {currentRegion === 'china' && (
                            <>
                                <img
                                    src="https://flagcdn.com/w20/cn.png"
                                    alt="China"
                                    style={{ width: '16px', height: '12px' }}
                                />
                                <span>中文</span>
                            </>
                        )}
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="global">
                    <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/us.png" alt="US" style={{ width: '16px', height: '12px' }} />
                        <span>English</span>
                    </div>
                </SelectItem>
                <SelectItem value="korea">
                    <div className="flex items-center gap-2">
                        <img
                            src={koreaFlag}
                            alt="Korea"
                            style={{ width: '16px', height: '12px', objectFit: 'cover' }}
                        />
                        <span>한국어</span>
                    </div>
                </SelectItem>
                <SelectItem value="china">
                    <div className="flex items-center gap-2">
                        <img
                            src="https://flagcdn.com/w20/cn.png"
                            alt="China"
                            style={{ width: '16px', height: '12px' }}
                        />
                        <span>中文</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
