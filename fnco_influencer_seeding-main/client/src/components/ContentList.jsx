import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { ExternalLink, Trash2, Edit3, Edit2 } from 'lucide-react';
// InfluencerContent type imported from InfluencerContentForm
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input.jsx';
import { Switch } from './ui/switch.jsx';
import { Label } from './ui/label.jsx';
import CountrySelect from './CountrySelect.jsx';
import countries from 'i18n-iso-countries';
import { formatDateTime, formatDate as formatDateUtil, getCountryName } from '../utils/contentUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';

// Props: { contents, onEdit, onRefresh, userRole }

export function ContentList({ contents, onEdit, onRefresh }) {
    // 시딩 비용 열람 권한 체크 (팀장/관리자만 실제 금액 확인 가능)
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
            // Array check, team_code 비교
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
        const updateScope = getSeedingUpdateScope();

        // 조회 권한이 없으면 수정도 불가
        if (!canViewSeedingCost(content)) return false;

        // 수정 권한 체크
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
        crawling_end_dt: '',
        second_crawling_start_dt: '',
        second_crawling_end_dt: '',
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
            crawling_end_dt: new Date(content.crawling_end_dt).toISOString().split('T')[0] || '',
            second_crawling_start_dt:
                (!!content.second_crawling_start_dt &&
                    new Date(content.second_crawling_start_dt).toISOString().split('T')[0]) ||
                '',
            second_crawling_end_dt:
                (!!content.second_crawling_end_dt &&
                    new Date(content.second_crawling_end_dt).toISOString().split('T')[0]) ||
                '',
        });
    };

    const handleDelete = async (content) => {
        if (!window.confirm(t('contentList.messages.deleteConfirm'))) {
            return;
        }

        const deletePara = content.id;
        const res = await fetch(`${apiBase}/contents/seeding`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deletePara }),
        });

        if (res.ok) {
            toast.success(t('contentList.messages.deleteSuccess'));
            onRefresh();
        }
    };

    const handleEditComplete = async (content) => {
        try {
            const updatePara = {
                ...content,
                ...editedData,
            };

            const res = await fetch(`${apiBase}/contents/seeding`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updatePara }),
            });

            if (res.ok) {
                toast.success(t('contentList.messages.editSuccess'));

                // 방법 1: 로컬 state 업데이트 (즉시 반영)
                if (onEdit) {
                    onEdit(updatePara);
                }

                // 방법 2: 서버에서 다시 fetch (선택사항, 필요시 주석 해제)
                // if (onRefresh) {
                //   await onRefresh();
                // }

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
                    crawling_end_dt: '',
                    second_crawling_start_dt: '',
                    second_crawling_end_dt: '',
                });
            } else {
                toast.error(t('contentList.messages.editFailed'));
            }
        } catch (error) {
            toast.error(t('contentList.messages.editError'));
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

    const formatUploadDate = (date) => {
        const today = new Date();
        const uploadDate = new Date(date);
        const diffTime = uploadDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return t('contentList.dateFormat.daysAgo', { days: Math.abs(diffDays) });
        } else if (diffDays === 0) {
            return t('contentList.dateFormat.today');
        } else {
            return t('contentList.dateFormat.daysLater', { days: diffDays });
        }
    };

    const formatCurrency = (amount, content) => {
        // 권한이 없으면 "권한없음" 표시
        if (!content || !canViewSeedingCost(content)) {
            return t('contentList.noPermission');
        }

        // 권한이 있으면 시딩 비용 표시
        if (amount === 0 || !amount) return '-';

        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatSecondaryUsagePeriod = (startDate, endDate) => {
        // 기본값인 경우 (빈 날짜)
        if (!!startDate && !endDate) {
            return `${startDate} ~ `;
        }
        if (!!endDate && !startDate) {
            startDate = endDate;
            return `${startDate} ~ ${endDate}`;
        }
        if (!startDate && !endDate) {
            return '-';
        }

        const start = formatDate(startDate);
        const end = formatDate(endDate);
        return `${start} ~ ${end}`;
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
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getCountryNameLocal = (countryCode) => {
        if (!countryCode) return '-';
        return getCountryName(countryCode, currentLanguage);
    };

    const getSeedingUpdateScope = () => {
        const perms = userState.menu_access?.seedingDashboard || [];
        if (perms.includes('update_all')) return 'update_all';
        if (perms.includes('update_team')) return 'update_team';
        if (perms.includes('update_self')) return 'update_self';
        return null;
    };

    const canEditOrDelete = (content) => {
        const scope = getSeedingUpdateScope();
        if (scope === 'update_all') return true;
        if (scope === 'update_team') {
            // Array check, team_code 비교
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
                    <CardTitle>{t('contentList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">{t('contentList.empty')}</div>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('contentList.titleWithCount', { count: contents.length })}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{t('contentList.description')}</p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table className="min-w-[2150px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">{t('contentList.table.influencer')}</TableHead>
                                    <TableHead className="w-[100px]">{t('contentList.table.platform')}</TableHead>
                                    <TableHead className="w-[150px]">{t('contentList.table.seedingProduct')}</TableHead>
                                    <TableHead className="w-[280px]">{t('contentList.table.title')}</TableHead>
                                    <TableHead className="w-[200px]">{t('contentList.table.keyword')}</TableHead>
                                    <TableHead className="w-[120px]">{t('contentList.table.seedingCost')}</TableHead>
                                    {/* {canViewActualCost(userRole) && ( */}
                                    <TableHead className="w-[150px]">{t('contentList.table.agency')}</TableHead>
                                    {/* )} */}
                                    <TableHead className="w-[220px]">
                                        {t('contentList.table.secondaryUsagePeriod')}
                                    </TableHead>
                                    <TableHead className="w-[120px]">{t('contentList.table.editStatus')}</TableHead>
                                    <TableHead className="w-[200px]">{t('contentList.table.seedingCountry')}</TableHead>
                                    <TableHead className="w-[180px]">{t('contentList.table.lastUpdateDate')}</TableHead>
                                    <TableHead className="w-[280px]">{t('contentList.table.contentSummary')}</TableHead>
                                    <TableHead className="w-[120px]">{t('contentList.table.uploadDate')}</TableHead>
                                    <TableHead className="w-[120px]">{t('contentList.table.registrant')}</TableHead>
                                    <TableHead className="w-[80px] text-right">
                                        {t('contentList.table.action')}
                                    </TableHead>
                                    <TableHead className="w-[80px] text-right">
                                        {t('contentList.table.delete')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contents.map((content) => (
                                    <TableRow key={content.id}>
                                        <TableCell className="w-[200px]">
                                            <div className="space-y-2">
                                                <div className="break-words">
                                                    @{truncateText(content.author_nm || '-', 25)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm text-muted-foreground">
                                                        {t('contentList.collectionPeriod')}
                                                    </div>
                                                    {editingRowId === content.id ? (
                                                        <div className="space-y-2">
                                                            <Input
                                                                type="date"
                                                                value={
                                                                    new Date(content.crawling_start_dt)
                                                                        .toISOString()
                                                                        .split('T')[0]
                                                                }
                                                                onChange={(e) =>
                                                                    handleInputChange(
                                                                        'crawling_start_dt',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                readOnly
                                                                className="h-8 w-20"
                                                                placeholder={t('contentList.placeholders.startDate')}
                                                            />
                                                            <Input
                                                                type="date"
                                                                value={editedData.crawling_end_dt}
                                                                onChange={(e) =>
                                                                    handleInputChange('crawling_end_dt', e.target.value)
                                                                }
                                                                className="h-8 w-20"
                                                                placeholder={t('contentList.placeholders.endDate')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                new Date(content.crawling_start_dt) < new Date()
                                                                    ? 'destructive'
                                                                    : new Date(
                                                                          content.crawling_start_dt
                                                                      ).toDateString() === new Date().toDateString()
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {formatSecondaryUsagePeriod(
                                                                content.crawling_start_dt,
                                                                content.crawling_end_dt
                                                            )}
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
                                                    {t('contentList.viewContent')}
                                                </Button>
                                            </div>
                                        </TableCell>

                                        <TableCell className="w-[100px]">
                                            <Badge className={getPlatformColor(content.platform)}>
                                                {getPlatformLabel(content.platform)}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="w-[150px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.seeding_product}
                                                    onChange={(e) =>
                                                        handleInputChange('seeding_product', e.target.value)
                                                    }
                                                    className="h-8"
                                                    placeholder={t('contentList.placeholders.seedingProduct')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {truncateText(content.seeding_product || '', 20)}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[280px]">
                                            <div className="break-words">{truncateText(content.title || '', 45)}</div>
                                        </TableCell>

                                        <TableCell className="w-[200px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.keyword}
                                                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                                                    className="h-8"
                                                    placeholder={t('contentList.placeholders.keyword')}
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
                                                        placeholder={t('contentList.placeholders.seedingCost')}
                                                    />
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        {t('contentList.noEditPermission')}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-sm">
                                                    {formatCurrency(content.seeding_cost, content)}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* {canViewActualCost(userRole) && ( */}
                                        <TableCell className="w-[150px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.agency_nm}
                                                    onChange={(e) => handleInputChange('agency_nm', e.target.value)}
                                                    className="h-8"
                                                    placeholder={t('contentList.placeholders.agency')}
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
                                                                {t('contentList.agency')}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">
                                                            {t('contentList.directManagement')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        {/* )} */}

                                        <TableCell className="w-[220px]">
                                            {editingRowId === content.id ? (
                                                <div className="space-y-2">
                                                    <Input
                                                        type="date"
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={editedData.second_crawling_start_dt}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                'second_crawling_start_dt',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-8 w-20"
                                                        placeholder={t('contentList.placeholders.startDate')}
                                                    />
                                                    <Input
                                                        type="date"
                                                        min={
                                                            editedData.second_crawling_start_dt ||
                                                            new Date().toISOString().split('T')[0]
                                                        }
                                                        value={editedData.second_crawling_end_dt}
                                                        onChange={(e) =>
                                                            handleInputChange('second_crawling_end_dt', e.target.value)
                                                        }
                                                        className="h-8 w-20"
                                                        placeholder={t('contentList.placeholders.endDate')}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="text-sm break-words">
                                                        {formatSecondaryUsagePeriod(
                                                            content.second_crawling_start_dt,
                                                            content.second_crawling_end_dt
                                                        )}
                                                    </div>
                                                    {content.second_crawling_start_dt &&
                                                        content.second_crawling_end_dt &&
                                                        new Date(content.second_crawling_start_dt).getTime() !==
                                                            new Date(content.second_crawling_end_dt).getTime() && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {t('contentList.available')}
                                                            </Badge>
                                                        )}
                                                </div>
                                            )}
                                        </TableCell>

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
                                                        ? t('contentList.fncoEdit')
                                                        : t('contentList.original')}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[200px]">
                                            {editingRowId === content.id ? (
                                                <CountrySelect
                                                    value={editedData.seeding_cntry}
                                                    onChange={(value) => handleInputChange('seeding_cntry', value)}
                                                    placeholder={t('contentList.placeholders.selectCountry')}
                                                />
                                            ) : (
                                                <div className="text-sm">
                                                    {getCountryNameLocal(content.seeding_cntry)}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[180px]">
                                            <div className="text-sm">{formatDateTime(content.created_dt)}</div>
                                        </TableCell>

                                        <TableCell className="w-[280px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.content_summary}
                                                    onChange={(e) =>
                                                        handleInputChange('content_summary', e.target.value)
                                                    }
                                                    className="h-8"
                                                    placeholder={t('contentList.placeholders.contentSummary')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {content.content_summary ? (
                                                        truncateText(content.content_summary || '', 45)
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {t('contentList.noContent')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[120px]">
                                            <div className="text-sm">{formatDate(content.upload_dt)}</div>
                                        </TableCell>

                                        <TableCell className="w-[120px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.user_nm}
                                                    onChange={(e) => handleInputChange('user_nm', e.target.value)}
                                                    className="h-8"
                                                    placeholder={t('contentList.placeholders.registrant')}
                                                />
                                            ) : (
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {content.user_nm || t('contentList.noRegistrant')}
                                                    </Badge>
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[80px] text-right">
                                            {editingRowId === content.id ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    cursor="pointer"
                                                    onClick={() => handleEditComplete({ ...content, ...editedData })}
                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                >
                                                    <Badge>{t('contentList.complete')}</Badge>
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
