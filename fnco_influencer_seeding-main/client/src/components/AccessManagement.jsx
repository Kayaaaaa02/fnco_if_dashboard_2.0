import { useState, useEffect } from 'react';
import { Button } from './ui/button.jsx';
import { ArrowLeft, Plus, Check, Search, ChevronUp, Trash2 } from 'lucide-react';
import { Input } from './ui/input.jsx';
import { DataGridPremium } from '@mui/x-data-grid-premium';
import { Box } from '@mui/material';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx';
import { Label } from './ui/label.jsx';
import { toast } from 'sonner';
import NoAccessPage from './NoAccessPage.jsx';
import { useAppSelector } from '../store/hooks.js';

export function AccessManagement({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [menusLoading, setMenusLoading] = useState(true);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [menus, setMenus] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [users, setUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [availableUsersLoading, setAvailableUsersLoading] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddUserPanelOpen, setIsAddUserPanelOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const user = useAppSelector((state) => state.user);

    useEffect(() => {
        // 권한 관리 페이지 로드 시 role 목록 가져오기
        const fetchRoles = async () => {
            try {
                setRolesLoading(true);
                const response = await fetch(`${apiBase}/roles`);
                if (!response.ok) {
                    throw new Error('role 목록을 가져오는데 실패했습니다.');
                }
                const data = await response.json();
                setRoles(data);
            } catch (error) {
                console.error('role 목록 조회 실패:', error);
            } finally {
                setRolesLoading(false);
            }
        };

        const fetchAll = async () => {
            setLoading(true);
            await Promise.all([fetchRoles()]);
            setLoading(false);
        };

        fetchAll();
    }, [apiBase]);

    // role 선택 시 권한과 사용자 목록 가져오기
    const handleRoleSelect = async (roleId) => {
        setSelectedRole(roleId);
        setSelectedUserIds([]); // 사용자 선택 초기화
        setIsAddUserPanelOpen(false); // 사용자 추가 패널 닫기
        setUserSearchQuery(''); // 검색어 초기화

        // 권한 가져오기
        try {
            setPermissionsLoading(true);
            const response = await fetch(`${apiBase}/roles/${encodeURIComponent(roleId)}/permissions`);
            if (!response.ok) {
                throw new Error('권한 정보를 가져오는데 실패했습니다.');
            }
            const data = await response.json();
            setPermissions(data);
        } catch (error) {
            console.error('권한 정보 조회 실패:', error);
            setPermissions([]);
        } finally {
            setPermissionsLoading(false);
        }

        // 사용자 목록 가져오기
        try {
            setUsersLoading(true);
            const response = await fetch(`${apiBase}/roles/${encodeURIComponent(roleId)}/users`);
            if (!response.ok) {
                throw new Error('사용자 목록을 가져오는데 실패했습니다.');
            }
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('사용자 목록 조회 실패:', error);
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }

        // 사용 가능한 사용자 목록 가져오기 (이 role에 할당되지 않은 사용자)
        fetchAvailableUsers(roleId);
    };

    // 사용 가능한 사용자 목록 가져오기
    const fetchAvailableUsers = async (roleId) => {
        try {
            setAvailableUsersLoading(true);
            const response = await fetch(`${apiBase}/users?excludeRoleId=${encodeURIComponent(roleId)}`);
            if (!response.ok) {
                throw new Error('사용 가능한 사용자 목록을 가져오는데 실패했습니다.');
            }
            const data = await response.json();
            setAvailableUsers(data);
        } catch (error) {
            console.error('사용 가능한 사용자 목록 조회 실패:', error);
            setAvailableUsers([]);
        } finally {
            setAvailableUsersLoading(false);
        }
    };

    // 권한을 메뉴별로 그룹화
    const groupPermissionsByMenu = (perms) => {
        const grouped = {};
        perms.forEach((perm) => {
            const menuId = perm.menu_id;
            if (!grouped[menuId]) {
                grouped[menuId] = {
                    menu_id: menuId,
                    menu_nm: perm.menu_nm || menuId,
                    permissions: [],
                };
            }
            grouped[menuId].permissions.push({
                permission_id: perm.permission_id,
                permission_nm: perm.permission_nm || perm.permission_id,
            });
        });
        return Object.values(grouped);
    };

    // 인원 추가
    const handleAddUser = async () => {
        if (!selectedRole) {
            toast.error('역할을 먼저 선택해주세요.');
            return;
        }

        if (!selectedUserIds || selectedUserIds.length === 0) {
            toast.error('사용자를 선택해주세요.');
            return;
        }

        try {
            setIsSubmitting(true);

            // 여러 사용자를 한 번에 추가
            const addPromises = selectedUserIds.map(async (userId) => {
                const selectedUser = availableUsers.find((u) => u.user_id === userId);

                const response = await fetch(`${apiBase}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        name: selectedUser?.name || '',
                        name_eng: selectedUser?.name_eng || '',
                        email: selectedUser?.email || '',
                        team_code: selectedUser?.team_code || '',
                        role_id: selectedRole,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || `사용자 ${userId} 추가에 실패했습니다.`);
                }

                return await response.json();
            });

            await Promise.all(addPromises);

            toast.success(`${selectedUserIds.length}명의 인원이 추가되었습니다.`);

            // 페이지 새로고침
            window.location.reload();
        } catch (error) {
            console.error('인원 추가 실패:', error);
            toast.error(error.message || '인원 추가에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 사용자 삭제 (role에서 제거)
    const handleDeleteUser = async (userId) => {
        if (!selectedRole) {
            toast.error('역할을 먼저 선택해주세요.');
            return;
        }

        if (!confirm(`${userId} 사용자를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const response = await fetch(
                `${apiBase}/roles/${encodeURIComponent(selectedRole)}/users/${encodeURIComponent(userId)}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '사용자 삭제에 실패했습니다.');
            }

            toast.success('사용자가 성공적으로 삭제되었습니다.');

            // 페이지 새로고침
            window.location.reload();
        } catch (error) {
            console.error('사용자 삭제 실패:', error);
            toast.error(error.message || '사용자 삭제에 실패했습니다.');
        }
    };

    // 사용자 선택 토글
    const toggleUserSelection = (userId) => {
        setSelectedUserIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    // 전체 선택/해제
    const toggleSelectAll = () => {
        const filteredUsers = getFilteredUsers();
        if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
            // 필터링된 사용자 중 선택된 것들만 해제
            setSelectedUserIds((prev) => prev.filter((id) => !filteredUsers.some((u) => u.user_id === id)));
        } else {
            // 필터링된 사용자 모두 선택
            const filteredIds = filteredUsers.map((u) => u.user_id);
            setSelectedUserIds((prev) => {
                const newIds = [...prev];
                filteredIds.forEach((id) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id);
                    }
                });
                return newIds;
            });
        }
    };

    // 검색어로 사용자 필터링 및 선택된 사용자를 맨 위로 정렬
    const getFilteredUsers = () => {
        let filtered = availableUsers;

        // 검색어가 있으면 필터링
        if (userSearchQuery.trim()) {
            const query = userSearchQuery.toLowerCase();
            filtered = availableUsers.filter((user) => {
                const name = (user.name || '').toLowerCase();
                const userId = (user.user_id || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const positName = (user.posit_name || '').toLowerCase();
                const orgName = (user.org_name || '').toLowerCase();
                return (
                    name.includes(query) ||
                    userId.includes(query) ||
                    email.includes(query) ||
                    positName.includes(query) ||
                    orgName.includes(query)
                );
            });
        }

        // 선택된 사용자를 맨 위로 정렬
        return filtered.sort((a, b) => {
            const aSelected = selectedUserIds.includes(a.user_id);
            const bSelected = selectedUserIds.includes(b.user_id);

            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0; // 둘 다 선택되었거나 둘 다 선택되지 않은 경우 원래 순서 유지
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        date.setHours(date.getHours() - 9);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    if (!user.menu_access?.accessManagement?.includes('read_all')) {
        return <NoAccessPage />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">권한 관리</h1>
                        <p className="text-sm text-muted-foreground">역할별 권한 및 사용자 관리</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        뒤로가기
                    </Button>
                </div>

                {/* 권한 관리 콘텐츠 */}
                <div className="space-y-6">
                    {/* Role 목록과 권한 정보 */}
                    <div className="flex gap-4">
                        {/* Role 목록 */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-semibold">역할 목록</CardTitle>
                                <CardDescription>
                                    {rolesLoading ? '로딩 중...' : `총 ${roles.length}개의 역할`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {rolesLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <Box sx={{ height: '100%', width: '100%' }}>
                                        <DataGridPremium
                                            rows={roles.map((role, index) => ({
                                                id: role.role_id,
                                                rownum: index + 1,
                                                role_id: role.role_id,
                                                role_nm: role.role_nm,
                                            }))}
                                            columns={[
                                                {
                                                    field: 'rownum',
                                                    headerName: '번호',
                                                    width: 80,
                                                    align: 'center',
                                                    headerAlign: 'center',
                                                },
                                                {
                                                    field: 'role_id',
                                                    headerName: '역할',
                                                    width: 200,
                                                    flex: 0,
                                                },
                                                {
                                                    field: 'role_nm',
                                                    headerName: '역할명',
                                                    flex: 1,
                                                },
                                            ]}
                                            loading={rolesLoading}
                                            onRowClick={(params) => handleRoleSelect(params.row.role_id)}
                                            disableRowSelectionOnClick
                                            hideFooter
                                            getRowHeight={() => 40}
                                            getRowClassName={(params) => {
                                                return params.row.role_id === selectedRole ? 'selected-row' : '';
                                            }}
                                            sx={{
                                                '& .MuiDataGrid-cell:focus': {
                                                    outline: 'none',
                                                },
                                                '& .MuiDataGrid-cell:focus-within': {
                                                    outline: 'none',
                                                },
                                                '& .MuiDataGrid-row:hover': {
                                                    backgroundColor: 'rgba(3, 2, 19, 0.05)',
                                                    cursor: 'pointer',
                                                },
                                                '& .MuiDataGrid-row.selected-row': {
                                                    backgroundColor: 'rgba(165, 185, 234, 0.15) !important',
                                                    borderLeft: '4px solid rgb(52, 45, 249)',
                                                },
                                            }}
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* 선택된 Role의 권한 정보 */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-semibold">권한 정보</CardTitle>
                                <CardDescription>
                                    {selectedRole
                                        ? `${selectedRole}의 메뉴별 권한`
                                        : '역할을 선택하면 권한 정보가 표시됩니다'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!selectedRole ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                            <svg
                                                className="w-8 h-8"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium">역할을 선택해주세요</p>
                                    </div>
                                ) : permissionsLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : permissions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-muted/30">
                                        <span className="text-sm">권한이 없습니다.</span>
                                    </div>
                                ) : (
                                    <Box sx={{ height: '100%', width: '100%' }}>
                                        <DataGridPremium
                                            rows={groupPermissionsByMenu(permissions).map((menuGroup, index) => ({
                                                id: menuGroup.menu_id,
                                                rownum: index + 1,
                                                menu_nm: menuGroup.menu_nm,
                                                permissions: menuGroup.permissions,
                                            }))}
                                            columns={[
                                                {
                                                    field: 'rownum',
                                                    headerName: '번호',
                                                    width: 80,
                                                    align: 'center',
                                                    headerAlign: 'center',
                                                },
                                                {
                                                    field: 'menu_nm',
                                                    headerName: '메뉴명',
                                                    width: 250,
                                                    flex: 0,
                                                },
                                                {
                                                    field: 'permissions',
                                                    headerName: '권한',
                                                    flex: 1,
                                                    renderCell: (params) => (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '8px',
                                                                padding: '6px 0',
                                                            }}
                                                        >
                                                            {params.value.map((perm) => (
                                                                <span
                                                                    key={perm.permission_id}
                                                                    style={{
                                                                        display: 'inherit',
                                                                        alignItems: 'center',
                                                                        padding: '0px 6px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '11px',
                                                                        height: '25px',
                                                                        backgroundColor: 'rgba(3, 2, 19, 0.05)',
                                                                    }}
                                                                >
                                                                    {perm.permission_nm}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ),
                                                },
                                            ]}
                                            loading={permissionsLoading}
                                            hideFooter
                                            getRowHeight={() => 40}
                                            disableRowSelectionOnClick
                                            sx={{
                                                '& .MuiDataGrid-cell:focus': {
                                                    outline: 'none !important',
                                                },
                                                '& .MuiDataGrid-cell:focus-within': {
                                                    outline: 'none !important',
                                                },
                                            }}
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 사용자 목록 */}
                    <Card className="w-full">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-semibold" style={{ marginBottom: '8px' }}>
                                        사용자 관리
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedRole
                                            ? usersLoading
                                                ? '로딩 중...'
                                                : `총 ${users.length}명의 사용자가 ${selectedRole}에 할당되어 있습니다`
                                            : '역할을 선택하면 사용자 정보가 표시됩니다'}
                                    </CardDescription>
                                </div>
                                {selectedRole && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAddUserPanelOpen(!isAddUserPanelOpen)}
                                        className="flex items-center gap-2"
                                    >
                                        {isAddUserPanelOpen ? (
                                            <>
                                                <ChevronUp className="w-4 h-4" />
                                                접기
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                사용자 추가
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!selectedRole ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium">역할을 선택해주세요</p>
                                </div>
                            ) : (
                                <>
                                    {/* 인원 추가 폼 */}
                                    <div
                                        style={{
                                            overflow: 'hidden',
                                            maxHeight: isAddUserPanelOpen ? '1000px' : '0',
                                            opacity: isAddUserPanelOpen ? 1 : 0,
                                            marginBottom: isAddUserPanelOpen ? '1rem' : '0',
                                            transition:
                                                'max-height 500ms ease-in-out, opacity 500ms ease-in-out, margin-bottom 500ms ease-in-out',
                                            pointerEvents: isAddUserPanelOpen ? 'auto' : 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                padding: '1rem',
                                                border: '1px solid oklch(.967 .003 264.542)',
                                                borderRadius: '0.5rem',
                                                // background: 'linear-gradient(to right, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.03))',
                                                opacity: isAddUserPanelOpen ? 1 : 0,
                                                transform: isAddUserPanelOpen ? 'translateY(0)' : 'translateY(-0.5rem)',
                                                transition: 'opacity 500ms ease-in-out, transform 500ms ease-in-out',
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">사용자 선택</Label>
                                                {getFilteredUsers().length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={toggleSelectAll}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        {(() => {
                                                            const filtered = getFilteredUsers();
                                                            const allFilteredSelected =
                                                                filtered.length > 0 &&
                                                                filtered.every((u) =>
                                                                    selectedUserIds.includes(u.user_id)
                                                                );
                                                            return allFilteredSelected ? '전체 해제' : '전체 선택';
                                                        })()}
                                                    </button>
                                                )}
                                            </div>
                                            {/* 검색 입력 필드 */}
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    placeholder="사용자 검색 (이름, ID, 이메일, 직급, 조직명)"
                                                    value={userSearchQuery}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                            {availableUsersLoading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                </div>
                                            ) : availableUsers.length === 0 ? (
                                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                    <span className="text-sm">추가할 사용자가 없습니다</span>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const filteredUsers = getFilteredUsers();
                                                    return filteredUsers.length === 0 ? (
                                                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                            <span className="text-sm">검색 결과가 없습니다</span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="max-h-80 overflow-y-auto overflow-x-hidden border rounded-md p-2 space-y-1"
                                                            style={{
                                                                scrollbarWidth: 'thin',
                                                                scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
                                                                height: '300px',
                                                            }}
                                                        >
                                                            {filteredUsers.map((user) => (
                                                                <div
                                                                    key={user.user_id}
                                                                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                                                    onClick={() => toggleUserSelection(user.user_id)}
                                                                >
                                                                    <div
                                                                        className={`flex items-center justify-center h-4 w-4 shrink-0 rounded-sm border cursor-pointer transition-colors ${
                                                                            selectedUserIds.includes(user.user_id)
                                                                                ? ''
                                                                                : 'bg-background border-primary'
                                                                        }`}
                                                                        style={
                                                                            selectedUserIds.includes(user.user_id)
                                                                                ? {
                                                                                      backgroundColor:
                                                                                          'rgb(107, 114, 128)',
                                                                                      borderColor: 'rgb(107, 114, 128)',
                                                                                  }
                                                                                : {}
                                                                        }
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleUserSelection(user.user_id);
                                                                        }}
                                                                    >
                                                                        {selectedUserIds.includes(user.user_id) && (
                                                                            <Check
                                                                                className="h-3 w-3"
                                                                                style={{ color: 'white' }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs text-muted-foreground">
                                                                            <span>{user.name || user.user_id} </span>
                                                                            {user.email && (
                                                                                <span className="ml-2">
                                                                                    {user.org_name || user.posit_name
                                                                                        ? `(${user.email})`
                                                                                        : user.email}
                                                                                </span>
                                                                            )}
                                                                            {user.posit_name && (
                                                                                <span> {user.posit_name}</span>
                                                                            )}
                                                                            {user.org_name && user.posit_name && (
                                                                                <span> / </span>
                                                                            )}
                                                                            {user.org_name && (
                                                                                <span>{user.org_name}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleAddUser}
                                                    disabled={
                                                        selectedUserIds.length === 0 ||
                                                        isSubmitting ||
                                                        availableUsersLoading
                                                    }
                                                    className="flex items-center gap-2"
                                                    style={{ backgroundColor: 'rgb(52, 45, 249)', color: 'white' }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {isSubmitting ? '추가 중...' : `추가 (${selectedUserIds.length}명)`}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 사용자 테이블 */}
                                    {usersLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
                                            <span className="text-sm">인원이 없습니다.</span>
                                        </div>
                                    ) : (
                                        <Box sx={{ height: 400, width: '100%' }}>
                                            <DataGridPremium
                                                rows={users.map((user) => ({
                                                    id: user.user_id,
                                                    user_id: user.user_id,
                                                    name: user.name || '-',
                                                    posit_name: user.posit_name || '-',
                                                    email: user.email || '-',
                                                    team_code: user.team_code || '-',
                                                    org_name: user.org_name || '-',
                                                    create_dt: user.create_dt || '-',
                                                }))}
                                                columns={[
                                                    {
                                                        field: 'user_id',
                                                        headerName: 'ID',
                                                        width: 120,
                                                        flex: 0,
                                                    },
                                                    {
                                                        field: 'name',
                                                        headerName: '이름',
                                                        width: 120,
                                                        flex: 0,
                                                    },
                                                    {
                                                        field: 'posit_name',
                                                        headerName: '직급',
                                                        width: 100,
                                                        flex: 0,
                                                    },
                                                    {
                                                        field: 'email',
                                                        headerName: '이메일',
                                                        width: 200,
                                                        flex: 0,
                                                    },
                                                    {
                                                        field: 'team_code',
                                                        headerName: '팀 코드',
                                                        width: 120,
                                                        flex: 0,
                                                    },
                                                    {
                                                        field: 'org_name',
                                                        headerName: '조직명',
                                                        width: 180,
                                                        flex: 0,
                                                    },
                                                    {
                                                        field: 'create_dt',
                                                        headerName: '생성일시',
                                                        width: 250,
                                                        flex: 0,
                                                        renderCell: (params) => (
                                                            <span style={{ color: '#717182', fontSize: '14px' }}>
                                                                {formatDate(params.value)}
                                                            </span>
                                                        ),
                                                    },
                                                    {
                                                        field: 'delete',
                                                        headerName: '삭제',
                                                        width: 100,
                                                        flex: 0,
                                                        align: 'center',
                                                        headerAlign: 'center',
                                                        sortable: false,
                                                        renderCell: (params) => (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteUser(params.row.user_id);
                                                                }}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    cursor: 'pointer',
                                                                    border: 'none',
                                                                    color: '#ef4444',
                                                                    borderRadius: '4px',
                                                                    transition: 'background-color 0.2s',
                                                                    height: '25px',
                                                                }}
                                                            >
                                                                X
                                                            </button>
                                                        ),
                                                    },
                                                ]}
                                                loading={usersLoading}
                                                hideFooter
                                                getRowHeight={() => 40}
                                                disableRowSelectionOnClick
                                                sx={{
                                                    '& .MuiDataGrid-cell:focus': {
                                                        outline: 'none !important',
                                                    },
                                                    '& .MuiDataGrid-cell:focus-within': {
                                                        outline: 'none !important',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
