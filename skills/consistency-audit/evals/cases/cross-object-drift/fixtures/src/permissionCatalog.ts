export const PERMISSION_CATALOG = [
  { code: 'member.view', name: '查看成员' },
  { code: 'member.invite', name: '邀请成员' },
  { code: 'member.manage', name: '管理成员' },
  { code: 'link.create', name: '创建共享链接' },
  { code: 'workspace.settings', name: '工作区设置' },
] as const;

export type PermissionCode = (typeof PERMISSION_CATALOG)[number]['code'];
