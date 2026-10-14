import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Mic,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Database,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenTour: () => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/analysis', label: 'Financial Analysis', icon: LineChart },
  { path: '/transactions', label: 'Transactions', icon: ReceiptText },
  { path: '/risk', label: 'Risk Assessment', icon: ShieldAlert },
  { path: '/decisions', label: 'Verified Decisions', icon: ShieldCheck },
  { path: '/voice', label: 'Voice Assistant', icon: Mic },
  { path: '/audit', label: 'Audit Trail', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onOpenTour }) => {
  return (
    <aside
      className={`relative flex flex-col border-r border-[#E6E0D6] bg-white transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-[#E6E0D6] justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Geometric Custom Emblem */}
          <div className="w-9 h-9 rounded-lg bg-[#244A3D] text-[#E8DCCB] flex items-center justify-center shrink-0 shadow-xs border border-[#1B382E]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 6L7 9V15L12 18L17 15V9L12 6Z"
                fill="#244A3D"
                stroke="#C77758"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2" fill="#E8DCCB" />
            </svg>
          </div>

          {!collapsed && (
            <div className="leading-tight truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-[#244A3D] font-serif">FINOVA</span>
                <span className="text-[10px] bg-[#E8DCCB] text-[#244A3D] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                  Core
                </span>
              </div>
              <p className="text-[10px] text-[#77766F] truncate mt-0.5">Financial Intelligence Network</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#F7F4EE] transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#244A3D] text-white shadow-xs'
                    : 'text-[#292D2B] hover:bg-[#F7F4EE] hover:text-[#244A3D]'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Presentation Tour Button */}
      <div className="p-3 border-t border-[#E6E0D6] bg-[#FAF8F5]">
        <button
          onClick={onOpenTour}
          className={`w-full flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF0ED] border border-[#F2D0C5] text-[#C77758] hover:bg-[#f6e6e1] transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="12-Step Presentation Guide"
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <div className="text-left text-xs leading-tight">
              <span className="font-semibold block">Academic Tour</span>
              <span className="text-[10px] text-[#77766F]">12-Step Presentation Flow</span>
            </div>
          )}
        </button>

        {!collapsed && (
          <div className="mt-3 pt-3 border-t border-[#E6E0D6] flex items-center justify-between text-[11px] text-[#77766F]">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#2E6F40]" />
              SQLite Persistent
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#2E6F40] animate-pulse-subtle" />
          </div>
        )}
      </div>
    </aside>
  );
};
