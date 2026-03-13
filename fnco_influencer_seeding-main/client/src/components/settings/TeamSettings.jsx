import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Building2, Users, Search, Hash } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

async function fetchUsers() {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('사용자 목록을 불러올 수 없습니다.');
  return res.json();
}

function groupByTeam(users) {
  const groups = {};
  for (const user of users) {
    const code = user.team_code || '미지정';
    if (!groups[code]) groups[code] = [];
    groups[code].push(user);
  }
  return groups;
}

const TEAM_BADGE_COLORS = [
  { bg: '#dbeafe', color: '#2563eb' },
  { bg: '#dcfce7', color: '#16a34a' },
  { bg: '#f3e8ff', color: '#7c3aed' },
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#ccfbf1', color: '#0d9488' },
  { bg: '#fce7f3', color: '#db2777' },
  { bg: '#e0e7ff', color: '#4f46e5' },
  { bg: '#ffedd5', color: '#ea580c' },
];

function PanelCard({ children }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: 16, height: '100%' }}>
      {children}
    </div>
  );
}

/* ── Team Card ── */
function TeamCard({ teamCode, count, colorIdx, isSelected, onClick }) {
  const c = TEAM_BADGE_COLORS[colorIdx % TEAM_BADGE_COLORS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 10,
        border: `1px solid ${isSelected ? tokens.color.borderStrong : tokens.color.border}`,
        background: isSelected ? tokens.color.surfaceMuted : 'transparent',
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Building2 style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{teamCode}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 999, background: c.bg, color: c.color }}>{count}명</span>
    </button>
  );
}

/* ── Members Table ── */
function MembersTable({ members, teamCode }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.name_eng || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.posit_name || '').toLowerCase().includes(q),
    );
  }, [members, search]);

  return (
    <PanelCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Users style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>팀 멤버</span>
      </div>
      <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginBottom: 12 }}>{teamCode} 팀의 멤버 {members.length}명</p>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: tokens.color.textSubtle }} />
        <Input placeholder="이름, 이메일, 직책으로 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30, height: 36, borderRadius: 8, borderColor: tokens.color.border, fontSize: 13 }} />
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '40px 0' }}>{search ? '검색 결과가 없습니다.' : '멤버가 없습니다.'}</p>
          : (
            <div style={{ borderRadius: 10, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: tokens.color.surfaceMuted }}>
                    {['이름','영문명','직책','이메일','소속'].map((h) => (
                      <TableHead key={h} style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.user_id} style={{ borderColor: tokens.color.border }}>
                      <TableCell style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{user.name || '-'}</TableCell>
                      <TableCell style={{ fontSize: 12, color: tokens.color.textSubtle }}>{user.name_eng || '-'}</TableCell>
                      <TableCell style={{ fontSize: 12, color: tokens.color.text }}>{user.posit_name || '-'}</TableCell>
                      <TableCell style={{ fontSize: 12, color: tokens.color.textSubtle }}>{user.email || '-'}</TableCell>
                      <TableCell style={{ fontSize: 12, color: tokens.color.text }}>{user.org_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>
    </PanelCard>
  );
}

/* ── Main ── */
export default function TeamSettings() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { data: users, isLoading, isError } = useQuery({ queryKey: ['team-users'], queryFn: fetchUsers, staleTime: 60_000 });

  const teamGroups = useMemo(() => {
    if (!Array.isArray(users)) return {};
    return groupByTeam(users);
  }, [users]);

  const teamCodes = useMemo(() => Object.keys(teamGroups).sort(), [teamGroups]);
  const selectedMembers = selectedTeam ? (teamGroups[selectedTeam] || []) : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Building2 style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>팀 관리</p>
          <p style={{ fontSize: 11, color: tokens.color.textSubtle }}>팀별 멤버 구성을 확인합니다. 팀 격리가 활성화되면 각 팀은 자신의 캠페인만 볼 수 있습니다.</p>
        </div>
      </div>

      {/* Info banner */}
      <div
        style={{
          borderRadius: 10,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surfaceMuted,
          padding: '10px 14px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Hash style={{ width: 14, height: 14, color: tokens.color.textSubtle, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5 }}>
          <strong>팀 격리 헤더:</strong>{' '}
          <code style={{ background: tokens.color.canvas, padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>x-team-code</code>{' '}
          요청 헤더로 팀 코드를 전달하면 해당 팀의 캠페인만 조회됩니다.{' '}
          <code style={{ background: tokens.color.canvas, padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>x-user-role: admin</code>{' '}
          일 경우 모든 팀의 데이터에 접근 가능합니다.
        </p>
      </div>

      {isError ? (
        <div style={{ borderRadius: 14, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, padding: '40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle }}>사용자 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
          {/* Left: Team list */}
          <PanelCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Building2 style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>팀 목록</span>
            </div>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginBottom: 12 }}>{teamCodes.length}개의 팀</p>

            <div style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                : teamCodes.length === 0
                  ? <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '40px 0' }}>등록된 팀이 없습니다.</p>
                  : teamCodes.map((code, idx) => (
                    <TeamCard
                      key={code}
                      teamCode={code}
                      count={teamGroups[code].length}
                      colorIdx={idx}
                      isSelected={selectedTeam === code}
                      onClick={() => setSelectedTeam(code)}
                    />
                  ))}
            </div>
          </PanelCard>

          {/* Right: Members */}
          {selectedTeam ? (
            <MembersTable members={selectedMembers} teamCode={selectedTeam} />
          ) : (
            <PanelCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Users style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>팀 멤버</span>
              </div>
              <p style={{ fontSize: 12, color: tokens.color.textSubtle, textAlign: 'center', padding: '50px 0' }}>팀을 선택하면 멤버가 표시됩니다.</p>
            </PanelCard>
          )}
        </div>
      )}
    </div>
  );
}
