#!/usr/bin/env python3
"""
scaffold_app.py — 初始化符合 ToB 规范的 Vite + React + TypeScript 前端脚手架

用途：
  快速搭建一个包含 T 型布局、RoleContext、Design Tokens 和 Common 组件库的前端项目框架。
  避免每次新建原型时都从零配置。

使用方式：
  python scripts/scaffold_app.py <project_name> [--output-dir <path>]

前置依赖：
  - Node.js >= 18
  - npm

输出：
  一个可以直接 npm run dev 运行的 Vite 项目。
"""

import argparse
import subprocess
import sys
from pathlib import Path


# ── 模板文件内容 ──────────────────────────────────────

ROLE_CONTEXT_TSX = '''import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'member' | 'manager' | 'approver' | 'admin';

interface RoleContextType {
  currentRole: Role;
  setRole: (role: Role) => void;
  roleLabel: string;
}

const ROLE_LABELS: Record<Role, string> = {
  member: '业务专员',
  manager: '部门负责人',
  approver: '审批人',
  admin: '系统管理员',
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('member');

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setRole: setCurrentRole,
        roleLabel: ROLE_LABELS[currentRole],
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

export { ROLE_LABELS };
'''

SIDEBAR_TSX = '''import React from 'react';

interface NavItem {
  label: string;
  icon?: string;
  path: string;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ items, activePath, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-800">
          [项目名称]
        </h1>
      </div>
      <nav className="flex-1 py-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full text-left px-6 py-2.5 text-sm transition-colors
              ${activePath === item.path
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
'''

TOPBAR_TSX = '''import React from 'react';
import { useRole, ROLE_LABELS, Role } from '../context/RoleContext';

export function Topbar() {
  const { currentRole, setRole, roleLabel } = useRole();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        当前模块
      </div>
      <div className="flex items-center gap-3">
        <select
          value={currentRole}
          onChange={(e) => setRole(e.target.value as Role)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">{roleLabel}</span>
      </div>
    </header>
  );
}
'''

BADGE_TSX = '''import React from 'react';

type BadgeStatus = 'success' | 'warning' | 'error' | 'default' | 'processing';

interface BadgeProps {
  text: string;
  status?: BadgeStatus;
}

const STATUS_STYLES: Record<BadgeStatus, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-orange-50 text-orange-700 border-orange-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  default: 'bg-gray-50 text-gray-600 border-gray-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function Badge({ text, status = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLES[status]}`}>
      {text}
    </span>
  );
}
'''


def check_node():
    """检查 Node.js 是否安装"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()
        print(f"✅ Node.js 版本: {version}")
        return True
    except FileNotFoundError:
        print("❌ 未找到 Node.js，请先安装 Node.js >= 18")
        return False


def create_scaffold(project_name: str, output_dir: Path):
    """创建前端脚手架"""
    project_dir = output_dir / project_name
    
    if project_dir.exists():
        print(f"⚠️  目录已存在: {project_dir}")
        print("   如果需要重新初始化，请先删除该目录")
        return
    
    # 创建目录结构
    dirs = [
        project_dir / "src" / "components" / "common",
        project_dir / "src" / "context",
        project_dir / "src" / "pages",
        project_dir / "src" / "layouts",
        project_dir / "src" / "mock",
        project_dir / "src" / "styles",
        project_dir / "public",
    ]
    
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
    
    # 写入模板文件
    templates = {
        project_dir / "src" / "context" / "RoleContext.tsx": ROLE_CONTEXT_TSX,
        project_dir / "src" / "layouts" / "Sidebar.tsx": SIDEBAR_TSX,
        project_dir / "src" / "layouts" / "Topbar.tsx": TOPBAR_TSX,
        project_dir / "src" / "components" / "common" / "Badge.tsx": BADGE_TSX,
    }
    
    for filepath, content in templates.items():
        filepath.write_text(content.strip() + '\n', encoding='utf-8')
        print(f"  📄 {filepath.relative_to(project_dir)}")
    
    print(f"\n🎉 脚手架已创建: {project_dir}")
    print(f"\n下一步:")
    print(f"  1. cd {project_dir}")
    print(f"  2. npx -y create-vite@latest ./ --template react-ts")
    print(f"  3. npm install")
    print(f"  4. npm install -D tailwindcss @tailwindcss/vite lucide-react")
    print(f"  5. npm run dev")
    print(f"\n  注意: 请将本 skill 的 templates/tob_design_tokens.css 复制到 src/styles/ 目录下")


def main():
    parser = argparse.ArgumentParser(
        description="初始化符合 ToB 规范的前端脚手架"
    )
    parser.add_argument("project_name", help="项目名称")
    parser.add_argument(
        "--output-dir",
        default=".",
        help="输出目录（默认为当前目录）"
    )
    
    args = parser.parse_args()
    
    if not check_node():
        sys.exit(1)
    
    create_scaffold(args.project_name, Path(args.output_dir))


if __name__ == "__main__":
    main()
