import { useState } from 'react';
import { useAppSelector } from '../store/hooks.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Switch } from './ui/switch.jsx';
import { Label } from './ui/label.jsx';
import { ExternalLink, Trash2, Edit3, Check } from 'lucide-react';
// UGCContent type imported from UGCForm
import { toast } from 'sonner@2.0.3';
import countries from 'i18n-iso-countries';
import CountrySelect from './CountrySelect.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { getCountryName, formatDate as formatDateUtil } from '../utils/contentUtils.js';

// Props: { contents, onEdit, onDelete, loading }

export function UGCList({ contents, onEdit, onDelete, loading }) {
    const [editingRowId, setEditingRowId] = useState(null);
    const [editedData, setEditedData] = useState({
        id: '',
        author_nm: '',
        seeding_product: '',
        seeding_cntry: 'KR',
        content_summary: '',
        crawling_start_dt: '',
        crawling_end_dt: '',
    });
    const userState = useAppSelector((state) => state.user);
    const t = useTranslation();
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    const apiBase = import.meta.env.VITE_API_BASE_URL;

    const handleEditStart = (content) => {
        setEditingRowId(content.id);
        setEditedData({
            id: content.id,
            author_nm: content.author_nm || '',
            seeding_product: content.seeding_product || '',
            seeding_cntry: content.seeding_cntry || 'KR',
            content_summary: content.content_summary || '',
            crawling_start_dt: content.crawling_start_dt
                ? new Date(content.crawling_start_dt).toISOString().split('T')[0]
                : '',
            crawling_end_dt: content.crawling_end_dt
                ? new Date(content.crawling_end_dt).toISOString().split('T')[0]
                : '',
        });
    };

    const handleDelete = async (content) => {
        if (window.confirm(t('dashboard.ugcList.deleteConfirm', { product: content.seeding_product }))) {
            try {
                const res = await fetch(`${apiBase}/contents/ugc`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deletePara: content.id }),
                });

                if (res.ok) {
                    toast.success(t('dashboard.ugcList.messages.deleteSuccess'));
                    onDelete(content.id);
                } else {
                    toast.error(t('dashboard.ugcList.messages.deleteFailed'));
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(t('dashboard.ugcList.messages.deleteError'));
            }
        }
    };

    const handleEditComplete = async (content) => {
        try {
            const updatePara = {
                ...content,
                ...editedData,
            };

            const res = await fetch(`${apiBase}/contents/ugc`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updatePara }),
            });

            if (res.ok) {
                toast.success(t('dashboard.ugcList.messages.editSuccess'));
                if (onEdit) {
                    onEdit(updatePara);
                }
                setEditingRowId(null);
                setEditedData({
                    id: '',
                    author_nm: '',
                    seeding_product: '',
                    seeding_cntry: 'KR',
                    content_summary: '',
                    crawling_start_dt: '',
                    crawling_end_dt: '',
                });
            } else {
                toast.error(t('dashboard.ugcList.messages.editFailed'));
            }
        } catch (error) {
            console.error('Edit error:', error);
            toast.error(t('dashboard.ugcList.messages.editError'));
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

    const formatSecondaryUsagePeriod = (startDate, endDate) => {
        if (!startDate && !endDate) return '-';
        if (startDate && !endDate) return `${formatDate(startDate)} ~ `;
        if (!startDate && endDate) return `~ ${formatDate(endDate)}`;
        return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    };

    const truncateText = (text = '', maxLength = 50) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const getPlatformLabel = (platform) => {
        switch (platform) {
            case 'youtube':
                return 'YouTube';
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

    // 권한 체크 함수
    const getUgcUpdateScope = () => {
        const perms = userState.menu_access?.seedingDashboard || [];
        if (perms.includes('update_all')) return 'update_all';
        if (perms.includes('update_team')) return 'update_team';
        if (perms.includes('update_self')) return 'update_self';
        return null;
    };
    const canEditOrDelete = (content) => {
        const scope = getUgcUpdateScope();
        if (scope === 'update_all') return true;
        if (scope === 'update_team') {
            return Array.isArray(userState.team_codes) && userState.team_codes.includes(content.team_code);
        }
        if (scope === 'update_self') {
            return String(userState.user_id) === String(content.user_id);
        }
        return false;
    };

    // 로딩 중일 때
    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t('dashboard.ugcList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                            <p>{t('dashboard.ugcList.loading')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (contents.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t('dashboard.ugcList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">{t('dashboard.ugcList.empty')}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('dashboard.ugcList.titleWithCount', { count: contents.length })}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{t('dashboard.ugcList.description')}</p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table className="min-w-[1800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">
                                        {t('dashboard.ugcList.table.accountName')}
                                    </TableHead>
                                    <TableHead className="w-[100px]">{t('dashboard.ugcList.table.platform')}</TableHead>
                                    <TableHead className="w-[150px]">
                                        {t('dashboard.ugcList.table.seedingProduct')}
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        {t('dashboard.ugcList.table.seedingCountry')}
                                    </TableHead>
                                    <TableHead className="w-[280px]">
                                        {t('dashboard.ugcList.table.contentSummary')}
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        {t('dashboard.ugcList.table.uploadDate')}
                                    </TableHead>
                                    <TableHead className="w-[80px] text-right">
                                        {t('dashboard.ugcList.table.edit')}
                                    </TableHead>
                                    <TableHead className="w-[80px] text-right">
                                        {t('dashboard.ugcList.table.delete')}
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
                                                        {t('dashboard.ugcList.collectionPeriod')}
                                                    </div>
                                                    {editingRowId === content.id ? (
                                                        <div className="space-y-2">
                                                            <Input
                                                                type="date"
                                                                value={
                                                                    content.crawling_start_dt
                                                                        ? new Date(content.crawling_start_dt)
                                                                              .toISOString()
                                                                              .split('T')[0]
                                                                        : ''
                                                                }
                                                                readOnly
                                                                className="h-8 w-20"
                                                                placeholder={t('dashboard.ugcList.startDate')}
                                                            />
                                                            <Input
                                                                type="date"
                                                                value={editedData.crawling_end_dt}
                                                                onChange={(e) =>
                                                                    handleInputChange('crawling_end_dt', e.target.value)
                                                                }
                                                                className="h-8 w-20"
                                                                placeholder={t('dashboard.ugcList.endDate')}
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
                                                    {t('dashboard.ugcList.viewContent')}
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
                                                    placeholder={t('dashboard.ugcList.placeholders.seedingProduct')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {truncateText(content.seeding_product || '', 20)}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[120px]">
                                            {editingRowId === content.id ? (
                                                <CountrySelect
                                                    value={editedData.seeding_cntry || 'KR'}
                                                    onChange={(value) => handleInputChange('seeding_cntry', value)}
                                                    placeholder={t('dashboard.ugcList.placeholders.seedingCountry')}
                                                />
                                            ) : (
                                                <div className="text-sm">
                                                    {getCountryName(content.seeding_cntry, currentLanguage)}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[280px]">
                                            {editingRowId === content.id ? (
                                                <Input
                                                    value={editedData.content_summary}
                                                    onChange={(e) =>
                                                        handleInputChange('content_summary', e.target.value)
                                                    }
                                                    className="h-8"
                                                    placeholder={t('dashboard.ugcList.placeholders.contentSummary')}
                                                />
                                            ) : (
                                                <div className="break-words">
                                                    {content.content_summary ? (
                                                        truncateText(content.content_summary || '', 45)
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {t('dashboard.ugcList.noContent')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="w-[120px]">
                                            <div className="text-sm">{formatDate(content.upload_dt)}</div>
                                        </TableCell>

                                        <TableCell className="w-[80px] text-right">
                                            {editingRowId === content.id ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    cursor="pointer"
                                                    onClick={() => handleEditComplete({ ...content, ...editedData })}
                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                    disabled={!canEditOrDelete(content)}
                                                >
                                                    <Check className="w-4 h-4" />
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
