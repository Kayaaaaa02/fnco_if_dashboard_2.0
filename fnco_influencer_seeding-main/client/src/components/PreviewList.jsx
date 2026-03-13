import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks.js';
import { formatDate as formatDateUtil, getCountryName } from '../utils/contentUtils.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { ExternalLink, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input.jsx';
import { Switch } from './ui/switch.jsx';
import CountrySelect from './CountrySelect.jsx';
import { useTranslation } from '../hooks/useTranslation.js';

export function PreviewList({ contents, onEdit, onRefresh }) {
    const [editingRowId, setEditingRowId] = useState(null);
    const userState = useAppSelector((state) => state.user);
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');
    const t = useTranslation();

    // 시딩 비용 조회 권한 스코프 확인
    const getSeedingCostViewScope = () => {
        const perms = userState.menu_access?.seedingDashboard_seedingCost || [];
        if (perms.includes('read_all')) return 'read_all';
        if (perms.includes('read_team')) return 'read_team';
        if (perms.includes('read_self')) return 'read_self';
        return null;
    };

    // 특정 콘텐츠의 시딩 비용을 볼 수 있는지 확인
    const canViewSeedingCost = (content) => {
        const scope = getSeedingCostViewScope();
        if (scope === 'read_all') return true;
        if (scope === 'read_team') {
            return Array.isArray(userState.team_codes) && userState.team_codes.includes(content.team_code);
        }
        if (scope === 'read_self') {
            return String(userState.user_id) === String(content.user_id);
        }
        return false;
    };

    // 특정 콘텐츠의 시딩 비용을 수정할 수 있는지 확인
    const canEditSeedingCost = (content) => {
        const viewScope = getSeedingCostViewScope();
        const updateScope = getPreviewUpdateScope();

        if (!canViewSeedingCost(content)) return false;

        if (updateScope === 'update_all') return true;
        if (updateScope === 'update_team') {
            return Array.isArray(userState.team_codes) && userState.team_codes.includes(content.team_code);
        }
        if (updateScope === 'update_self') {
            return String(userState.user_id) === String(content.user_id);
        }
        return false;
    };

    const [editedData, setEditedData] = useState({
        id: '',
        user_nm: '',
        seeding_product: '',
        keyword: '',
        seeding_cost: 0,
        agency_nm: '',
        seeding_cntry: 'KR',
        is_fnco_edit: false,
        content_summary: '',
        scheduled_date: '',
    });

    const apiBase = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        setEditingRowId(editedData.id);
    }, [editedData]);

    const handleEditStart = (content) => {
        setEditedData({
            id: content.id,
            user_nm: content.user_nm || '',
            seeding_product: content.seeding_product || '',
            keyword: content.keyword || '',
            seeding_cost: content.seeding_cost || 0,
            agency_nm: content.agency_nm || '',
            seeding_cntry: content.seeding_cntry || '',
            is_fnco_edit: content.is_fnco_edit || false,
            content_summary: content.content_summary || '',
            scheduled_date: content.scheduled_date ? new Date(content.scheduled_date).toISOString().split('T')[0] : '',
        });
    };

    const handleDelete = async (content) => {
        if (!window.confirm(t('previewList.messages.deleteConfirm'))) {
            return;
        }

        const deletePara = content.id;
        const res = await fetch(`${apiBase}/contents/preview`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deletePara, post_id: content.post_id }),
        });

        if (res.ok) {
            toast.success(t('previewList.messages.deleteSuccess'));
            onRefresh();
        }
    };

    const handleEditComplete = async (content) => {
        try {
            const updatePara = {
                ...content,
                ...editedData,
            };

            const res = await fetch(`${apiBase}/contents/preview`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updatePara }),
            });

            if (res.ok) {
                toast.success(t('previewList.messages.editSuccess'));

                // 서버에서 최신 데이터 다시 가져오기
                if (onRefresh) {
                    await onRefresh();
                }

                // 수정 모드 종료
                setEditingRowId(null);
                setEditedData({
                    id: '',
                    user_nm: '',
                    seeding_product: '',
                    keyword: '',
                    seeding_cost: 0,
                    agency_nm: '',
                    seeding_cntry: '',
                    is_fnco_edit: false,
                    content_summary: '',
                    scheduled_date: '',
                });
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('수정 실패:', res.status, errorData);
                toast.error(`${t('previewList.messages.editFailed')}: ${errorData.error || res.statusText}`);
            }
        } catch (error) {
            console.error('수정 중 오류:', error);
            toast.error(`${t('previewList.messages.editError')}: ${error.message}`);
        }
    };

    const handleInputChange = (field, value) => {
        setEditedData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const formatDate = (date) => {
        return formatDateUtil(date, currentLanguage);
    };

    const formatCurrency = (amount, content) => {
        if (!content || !canViewSeedingCost(content)) {
            return t('previewList.noPermission');
        }

        if (amount === 0 || !amount) return '-';

        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const truncateText = (text = '', maxLength = 50) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const getPlatformLabel = (platform) => {
        switch (platform) {
            case 'youtube':
                return 'Youtube';
            case 'tiktok':
                return 'TikTok';
            case 'instagram':
                return 'Instagram';
            case 'x':
                return 'X';
            case 'google_drive':
                return 'Google Drive';
            default:
                return platform;
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform) {
            case 'youtube':
                return 'bg-red-100 text-red-700';
            case 'tiktok':
                return 'bg-gray-100 text-gray-700';
            case 'instagram':
                return 'bg-pink-100 text-pink-700';
            case 'x':
                return 'bg-blue-100 text-blue-700';
            case 'google_drive':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getCountryNameLocal = (countryCode) => {
        return getCountryName(countryCode, currentLanguage);
    };

    const getPreviewUpdateScope = () => {
        const perms = userState.menu_access?.seedingDashboard || [];
        if (perms.includes('update_all')) return 'update_all';
        if (perms.includes('update_team')) return 'update_team';
        if (perms.includes('update_self')) return 'update_self';
        return null;
    };

    const canEditOrDelete = (content) => {
        const scope = getPreviewUpdateScope();
        if (scope === 'update_all') return true;
        if (scope === 'update_team') {
            return Array.isArray(userState.team_codes) && userState.team_codes.includes(content.team_code);
        }
        if (scope === 'update_self') {
            return String(userState.user_id) === String(content.user_id);
        }
        return false;
    };

    if (contents.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t('previewList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">{t('previewList.empty')}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('previewList.titleWithCount', { count: contents.length })}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{t('previewList.description')}</p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table className="min-w-[1800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">{t('previewList.table.previewContent')}</TableHead>
                                    <TableHead className="w-[100px]">{t('previewList.table.platform')}</TableHead>
                                    <TableHead className="w-[150px]">{t('previewList.table.seedingProduct')}</TableHead>
                                    <TableHead className="w-[200px]">{t('previewList.table.keyword')}</TableHead>
                                    <TableHead className="w-[120px]">{t('previewList.table.seedingCost')}</TableHead>
                                    <TableHead className="w-[150px]">{t('previewList.table.agency')}</TableHead>
                                    <TableHead className="w-[120px]">{t('previewList.table.editStatus')}</TableHead>
                                    <TableHead className="w-[120px]">{t('previewList.table.seedingCountry')}</TableHead>
                                    <TableHead className="w-[280px]">{t('previewList.table.contentSummary')}</TableHead>
                                    <TableHead className="w-[120px]">{t('previewList.table.registrant')}</TableHead>
                                    <TableHead className="w-[80px] text-right">
                                        {t('previewList.table.action')}
                                    </TableHead>
                                    <TableHead className="w-[80px] text-right">
                                        {t('previewList.table.delete')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contents.map((content) => (
                                    <TableRow key={content.id}>
                                        {/* 가편 콘텐츠 */}
                                        <TableCell className="w-[200px]">
                                            <div className="space-y-2">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-muted-foreground">
                                                        {t('previewList.scheduledDate')}
                                                    </div>
                                                    {editingRowId === content.id ? (
                                                        <Input
                                                            type="date"
                                                            value={editedData.scheduled_date}
                                                            onChange={(e) =>
                                                                handleInputChange('scheduled_date', e.target.value)
                                                            }
                                                            className="h-8 w-20"
                                                            placeholder={t('previewList.scheduledDate')}
                                                        />
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatDate(content.scheduled_date)}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer h-auto p-0 text-blue-600 hover:text-blue-800 text-xs"
                                                    onClick={() => window.open(content.post_url, '_blank')}
                                                >
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    {t('previewList.viewContent')}
                                                </Button>
                                            </div>
                                        </TableCell>

                                        {/* 플랫폼 */}
                                        <TableCell className="w-[100px]">
                                            <Badge className={getPlatformColor(content.platform)}>
                                                {getPlatformLabel(content.platform)}
                                            </Badge>
                                        </TableCell>

                                        {/* 시딩 품목 */}
                                        <TableCell className="w-[150px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.seeding_product}
                                                    onChange={(e) =>
                                                        handleInputChange('seeding_product', e.target.value)
                                                    }
                                                    className="h-8"
                                                    placeholder={t('previewList.placeholders.seedingProduct')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {truncateText(content.seeding_product || '', 20)}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* 영상 키워드 */}
                                        <TableCell className="w-[200px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.keyword}
                                                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                                                    className="h-8"
                                                    placeholder={t('previewList.placeholders.keyword')}
                                                />
                                            ) : content.keyword ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {content.keyword
                                                        .split(',')
                                                        .slice(0, 3)
                                                        .map((keyword, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {keyword.trim()}
                                                            </Badge>
                                                        ))}
                                                    {content.keyword.split(',').length > 3 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{content.keyword.split(',').length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>

                                        {/* 시딩 비용 */}
                                        <TableCell className="w-[120px]">
                                            {editingRowId === content.id ? (
                                                canEditSeedingCost(content) ? (
                                                    <Input
                                                        type="number"
                                                        value={editedData.seeding_cost}
                                                        onChange={(e) =>
                                                            handleInputChange('seeding_cost', e.target.value)
                                                        }
                                                        className="h-8"
                                                        placeholder="시딩 비용"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        {t('previewList.noEditPermission')}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-sm">
                                                    {formatCurrency(content.seeding_cost, content)}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* 에이전시 */}
                                        <TableCell className="w-[150px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.agency_nm}
                                                    onChange={(e) => handleInputChange('agency_nm', e.target.value)}
                                                    className="h-8"
                                                    placeholder={t('previewList.placeholders.agency')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {content.agency_nm ? (
                                                        <div className="space-y-1">
                                                            <div className="text-sm">
                                                                {truncateText(content.agency_nm || '', 20)}
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs bg-purple-50 text-purple-700"
                                                            >
                                                                {t('previewList.agency')}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">
                                                            {t('previewList.directManagement')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* 편집 여부 */}
                                        <TableCell className="w-[120px]">
                                            {editingRowId === content.id ? (
                                                <Switch
                                                    checked={editedData.is_fnco_edit}
                                                    onCheckedChange={(checked) =>
                                                        handleInputChange('is_fnco_edit', checked)
                                                    }
                                                />
                                            ) : (
                                                <Badge variant={content.is_fnco_edit ? 'default' : 'secondary'}>
                                                    {content.is_fnco_edit
                                                        ? t('previewList.fncoEdit')
                                                        : t('previewList.original')}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* 시딩 국가 */}
                                        <TableCell className="w-[120px]">
                                            {editingRowId === content.id ? (
                                                <CountrySelect
                                                    value={editedData.seeding_cntry}
                                                    onChange={(value) => handleInputChange('seeding_cntry', value)}
                                                    placeholder={t('previewList.placeholders.selectCountry')}
                                                />
                                            ) : (
                                                <div className="text-sm">
                                                    {getCountryNameLocal(content.seeding_cntry)}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* 콘텐츠 내용 */}
                                        <TableCell className="w-[280px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.content_summary}
                                                    onChange={(e) =>
                                                        handleInputChange('content_summary', e.target.value)
                                                    }
                                                    className="h-8"
                                                    placeholder={t('previewList.placeholders.contentSummary')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {content.content_summary ? (
                                                        truncateText(content.content_summary || '', 45)
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {t('previewList.noContent')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* 등록 담당자 */}
                                        <TableCell className="w-[120px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.user_nm}
                                                    onChange={(e) => handleInputChange('user_nm', e.target.value)}
                                                    className="h-8"
                                                    placeholder={t('previewList.placeholders.registrant')}
                                                />
                                            ) : (
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {content.user_nm || t('previewList.noRegistrant')}
                                                    </Badge>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* 작업 */}
                                        <TableCell className="w-[80px] text-right">
                                            {editingRowId === content.id ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    cursor="pointer"
                                                    onClick={() => handleEditComplete({ ...content, ...editedData })}
                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                >
                                                    <Badge>{t('previewList.complete')}</Badge>
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditStart(content)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    disabled={!canEditOrDelete(content)}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>

                                        {/* 삭제 */}
                                        <TableCell className="w-[80px] text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(content)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                disabled={!canEditOrDelete(content)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
