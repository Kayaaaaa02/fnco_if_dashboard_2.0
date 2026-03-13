import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Shield, Users, Plus, Trash2, Search, Key } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import {
  useRoles,
  useRolePermissions,
  useRoleUsers,
  useAvailableUsers,
  useAddUserToRole,
  useRemoveUserFromRole,
} from '@/hooks/useRoles.js';

const PERM_COLORS = {
  read: { bg: '#dbeafe', color: '#2563eb' },
  write: { bg: '#dcfce7', color: '#16a34a' },
  delete: { bg: '#fee2e2', color: '#dc2626' },
  admin: { bg: '#f3e8ff', color: '#7c3aed' },
  manage: { bg: '#fef3c7', color: '#d97706' },
  create: { bg: '#d1fae5', color: '#059669' },
  edit: { bg: '#ccfbf1', color: '#0d9488' },
  view: { bg: '#e0f2fe', color: '#0284c7' },
  approve: { bg: '#e0e7ff', color: '#4f46e5' },
  execute: { bg: '#ffedd5', color: '#ea580c' },
};

function getPermColor(name) {
  const lower = (name || '').toLowerCase();
  for (const [kw, c] of Object.entries(PERM_COLORS)) {
    if (lower.includes(kw)) return c;
  }
  return { bg: '#f1f5f9', color: '#64748b' };
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }); }
  catch { return dateStr; }
}

function PanelCard({ children }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: 16, height: '100%' }}>
      {children}
    </div>
  );
}

function PanelHeader({ icon, title, desc, right }) {
  const Icon = icon;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{title}</span>
        </div>
        {desc && <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginTop: 2 }}>{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/* ── Role List ── */
function RoleListPanel({ roles, isLoading, selectedRoleId, onSelectRole }) {
  const roleList = Array.isArray(roles) ? roles : [];

  return (
    <PanelCard>
      <PanelHeader icon={Shield} title="역할 목록" desc={isLoading ? '로딩 중...' : `${roleList.length}개의 역할`} />
      <div style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          : roleList.length === 0
            ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '40px 0' }}>등록된 역할이 없습니다.</p>
            : roleList.map((role) => {
                const sel = selectedRoleId === role.role_id;
                return (
                  <button
                    key={role.role_id}
                    type="button"
                    onClick={() => onSelectRole(role.role_id)}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      borderRadius: 10,
                      border: `1px solid ${sel ? tokens.color.borderStrong : tokens.color.border}`,
                      background: sel ? tokens.color.surfaceMuted : 'transparent',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{role.role_nm}</p>
                    <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginTop: 2 }}>
                      ID: {role.role_id}{role.created_dt ? ` · ${formatDate(role.created_dt)}` : ''}
                    </p>
                  </button>
                );
              })}
      </div>
    </PanelCard>
  );
}

/* ── Permissions ── */
function PermissionsPanel({ roleId, roleName }) {
  const { data: permissions, isLoading } = useRolePermissions(roleId);

  const grouped = useMemo(() => {
    if (!Array.isArray(permissions)) return {};
    return permissions.reduce((acc, perm) => {
      const key = perm.menu_id || 'unknown';
      if (!acc[key]) acc[key] = { menu_nm: perm.menu_nm || '기타', items: [] };
      acc[key].items.push(perm);
      return acc;
    }, {});
  }, [permissions]);

  const entries = Object.entries(grouped);

  return (
    <PanelCard>
      <PanelHeader icon={Key} title="권한" desc={roleName ? `${roleName}의 메뉴별 권한` : '역할을 선택하세요'} />
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {!roleId
          ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '50px 0' }}>역할을 선택하면 권한이 표시됩니다.</p>
          : isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)
            : entries.length === 0
              ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '50px 0' }}>이 역할에 할당된 권한이 없습니다.</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {entries.map(([menuId, { menu_nm, items }]) => (
                    <div key={menuId} style={{ borderRadius: 10, border: `1px solid ${tokens.color.border}`, padding: '10px 12px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, marginBottom: 6 }}>{menu_nm}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {items.map((perm) => {
                          const c = getPermColor(perm.permission_nm);
                          return (
                            <span
                              key={perm.permission_id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                                background: c.bg,
                                color: c.color,
                              }}
                            >
                              {perm.permission_nm}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
      </div>
    </PanelCard>
  );
}

/* ── Add User Dialog ── */
function AddUserDialog({ open, onOpenChange, roleId, roleName }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const { data: users, isLoading } = useAvailableUsers(roleId);
  const addMutation = useAddUserToRole();

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.name_eng || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.posit_name || '').toLowerCase().includes(q),
    );
  }, [users, search]);

  function toggleUser(userId) {
    setSelected((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  }

  async function handleAdd() {
    const userList = Array.isArray(users) ? users : [];
    for (const userId of selected) {
      const user = userList.find((u) => u.user_id === userId);
      if (user) {
        await addMutation.mutateAsync({
          user_id: user.user_id,
          name: user.name,
          name_eng: user.name_eng || '',
          email: user.email || '',
          team_code: user.team_code || '',
          role_id: roleId,
        });
      }
    }
    setSelected([]);
    setSearch('');
    onOpenChange(false);
  }

  function handleClose() {
    setSelected([]);
    setSearch('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent style={{ maxWidth: '36rem' }}>
        <DialogHeader>
          <DialogTitle>사용자 추가</DialogTitle>
          <DialogDescription>{roleName ? `${roleName} 역할에 사용자를 추가합니다.` : '역할에 사용자를 추가합니다.'}</DialogDescription>
        </DialogHeader>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: tokens.color.textSubtle }} />
          <Input placeholder="이름, 이메일, 직책으로 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30, height: 36, borderRadius: 8, fontSize: 13 }} />
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', border: `1px solid ${tokens.color.border}`, borderRadius: 10 }}>
          {isLoading
            ? <div style={{ padding: 16 }}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)}</div>
            : filteredUsers.length === 0
              ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '40px 0' }}>{search ? '검색 결과가 없습니다.' : '추가할 수 있는 사용자가 없습니다.'}</p>
              : filteredUsers.map((user) => (
                <label key={user.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', borderBottom: `1px solid ${tokens.color.border}` }}>
                  <Checkbox checked={selected.includes(user.user_id)} onCheckedChange={() => toggleUser(user.user_id)} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{user.name}</p>
                    <p style={{ fontSize: 11, color: tokens.color.textSubtle }}>{[user.posit_name, user.email, user.org_name].filter(Boolean).join(' · ')}</p>
                  </div>
                </label>
              ))}
        </div>
        {selected.length > 0 && <p style={{ fontSize: 12, color: tokens.color.textSubtle }}>{selected.length}명 선택됨</p>}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button onClick={handleAdd} disabled={selected.length === 0 || addMutation.isPending} className="gap-2">
            <Plus className="size-4" />{addMutation.isPending ? '추가 중...' : `${selected.length}명 추가`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Remove Dialog ── */
function RemoveConfirmDialog({ open, onOpenChange, user, roleId, onSuccess }) {
  const removeMutation = useRemoveUserFromRole();
  async function handleRemove() {
    if (!user) return;
    await removeMutation.mutateAsync({ roleId, userId: user.user_id });
    onSuccess?.();
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사용자 제거</DialogTitle>
          <DialogDescription><strong>{user?.name}</strong> 님을 이 역할에서 제거하시겠습니까?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button variant="destructive" onClick={handleRemove} disabled={removeMutation.isPending}>{removeMutation.isPending ? '제거 중...' : '제거'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Users Panel ── */
function UsersPanel({ roleId, roleName }) {
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const { data: users, isLoading } = useRoleUsers(roleId);
  const userList = Array.isArray(users) ? users : [];

  return (
    <>
      <PanelCard>
        <PanelHeader
          icon={Users}
          title="사용자"
          desc={roleName ? `${roleName}에 할당된 사용자 ${userList.length}명` : '역할을 선택하세요'}
          right={roleId && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              style={{
                height: 30,
                padding: '0 12px',
                borderRadius: 8,
                border: 'none',
                background: tokens.color.text,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus style={{ width: 13, height: 13 }} /> 사용자 추가
            </button>
          )}
        />
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {!roleId
            ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '50px 0' }}>역할을 선택하면 사용자가 표시됩니다.</p>
            : isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
              : userList.length === 0
                ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '50px 0' }}>이 역할에 할당된 사용자가 없습니다.</p>
                : (
                  <div style={{ borderRadius: 10, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ background: tokens.color.surfaceMuted }}>
                          {['이름','직책','이메일','팀코드','소속','등록일',''].map((h) => (
                            <TableHead key={h} style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userList.map((user) => (
                          <TableRow key={user.user_id} style={{ borderColor: tokens.color.border }}>
                            <TableCell style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{user.name || '-'}</TableCell>
                            <TableCell style={{ fontSize: 12, color: tokens.color.text }}>{user.posit_name || '-'}</TableCell>
                            <TableCell style={{ fontSize: 12, color: tokens.color.textSubtle }}>{user.email || '-'}</TableCell>
                            <TableCell style={{ fontSize: 12, color: tokens.color.text }}>{user.team_code || '-'}</TableCell>
                            <TableCell style={{ fontSize: 12, color: tokens.color.text }}>{user.org_name || '-'}</TableCell>
                            <TableCell style={{ fontSize: 11, color: tokens.color.textSubtle }}>{formatDate(user.create_dt)}</TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => setRemoveTarget(user)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: tokens.color.textSubtle }}
                              >
                                <Trash2 style={{ width: 14, height: 14 }} />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
        </div>
      </PanelCard>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} roleId={roleId} roleName={roleName} />
      <RemoveConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        user={removeTarget}
        roleId={roleId}
      />
    </>
  );
}

/* ── Main ── */
export default function AccessManagement() {
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const { data: roles, isLoading: rolesLoading } = useRoles();

  const selectedRole = useMemo(() => {
    if (!Array.isArray(roles) || !selectedRoleId) return null;
    return roles.find((r) => r.role_id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Shield style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>권한 관리</p>
          <p style={{ fontSize: 11, color: tokens.color.textSubtle }}>역할별 권한을 확인하고 사용자를 관리합니다.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1fr', gap: 14 }}>
        <RoleListPanel roles={roles} isLoading={rolesLoading} selectedRoleId={selectedRoleId} onSelectRole={setSelectedRoleId} />
        <PermissionsPanel roleId={selectedRoleId} roleName={selectedRole?.role_nm} />
        <UsersPanel roleId={selectedRoleId} roleName={selectedRole?.role_nm} />
      </div>
    </div>
  );
}
