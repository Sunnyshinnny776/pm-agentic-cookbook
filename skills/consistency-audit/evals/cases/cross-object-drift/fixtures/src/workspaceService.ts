export type Role = 'owner' | 'manager' | 'editor' | 'guest';
export type MemberStatus = 'active' | 'disabled';

export interface Member {
  id: string;
  email: string;
  role: Role;
  status: MemberStatus;
}

export interface Invite {
  token: string;
  createdAt: number;
}

export interface ShareLink {
  id: string;
  creatorId: string;
  active: boolean;
}

export interface Workspace {
  members: Member[];
  invites: Invite[];
  links: ShareLink[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const INVITE_TTL_MS = 7 * DAY_MS;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function activeOwners(ws: Workspace): Member[] {
  return ws.members.filter(m => m.role === 'owner' && m.status === 'active');
}

export function createInvite(ws: Workspace, now: number): Invite {
  const invite = { token: Math.random().toString(36).slice(2), createdAt: now };
  ws.invites.push(invite);
  return invite;
}

export function acceptInvite(ws: Workspace, token: string, email: string, now: number): Result<Member> {
  const invite = ws.invites.find(i => i.token === token);
  if (!invite) return { ok: false, error: '邀请不存在' };
  if (now - invite.createdAt > INVITE_TTL_MS) return { ok: false, error: '邀请已过期' };
  if (email.includes('+')) return { ok: false, error: '不支持带别名的邮箱' };
  const member: Member = { id: `m-${ws.members.length + 1}`, email, role: 'guest', status: 'active' };
  ws.members.push(member);
  return { ok: true, data: member };
}

export function disableMember(ws: Workspace, memberId: string): Result<Member> {
  const target = ws.members.find(m => m.id === memberId);
  if (!target) return { ok: false, error: '成员不存在' };
  if (target.role === 'owner' && target.status === 'active' && activeOwners(ws).length <= 1) {
    return { ok: false, error: '工作区至少保留一名所有者' };
  }
  target.status = 'disabled';
  return { ok: true, data: target };
}

export function changeRole(ws: Workspace, memberId: string, role: Role): Result<Member> {
  const target = ws.members.find(m => m.id === memberId);
  if (!target) return { ok: false, error: '成员不存在' };
  target.role = role;
  return { ok: true, data: target };
}

export function removeMember(ws: Workspace, memberId: string): Result<Member> {
  const target = ws.members.find(m => m.id === memberId);
  if (!target) return { ok: false, error: '成员不存在' };
  if (target.role === 'owner' && target.status === 'active' && activeOwners(ws).length <= 1) {
    return { ok: false, error: '工作区至少保留一名所有者' };
  }
  ws.members = ws.members.filter(m => m.id !== memberId);
  return { ok: true, data: target };
}
