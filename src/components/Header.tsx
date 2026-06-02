import React from 'react';
import { Menu, Layers, Database, UserCheck, HardDrive, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenMembers: () => void;
  onRefreshData: () => void;
  userEmail: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenMembers, onRefreshData, userEmail }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        {/* Left Side: Hamburger Menu & Brand Logo */}
        <div className="flex items-center space-x-3">
          {/* Hamburger Menu Toggle Button */}
          <button
            id="btn-hamburger"
            onClick={onToggleSidebar}
            title="메뉴 열기"
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-slate-150"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-1 rounded-md flex items-center justify-center shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
                HRD사업팀 운영관리
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                  PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Desktop Only: Dynamic Active Module Indicator */}
          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-250">
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-150">
              운영 관리
            </span>
          </div>
        </div>

        {/* Database connectivity and Management handles */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Supabase Status Indicator */}
          <div 
            title={isSupabaseConfigured ? '실제 Supabase DB에 연결되어 연동 중입니다.' : '환경변수 미충족으로 고유 브라우저 로컬 저장소 모드가 실행 중입니다.'}
            className={`flex items-center space-x-2 px-2.5 py-1 rounded-full border ${
              isSupabaseConfigured 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isSupabaseConfigured ? (
              <>
                <Database className="h-3 w-3 text-emerald-600 animate-pulse" />
                <span className="font-medium text-[10px]">Supabase 연동중</span>
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3 text-amber-600" />
                <span className="font-medium text-[10px]">로컬샌드박스 오프라인</span>
              </>
            )}
          </div>

          {/* User Marker */}
          <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="font-mono text-[10px] tracking-tight">{userEmail}</span>
          </div>

          {/* Staff registry manager Button */}
          <button
            id="btn-manage-members"
            onClick={onOpenMembers}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-950 text-white rounded-md font-medium text-xs transition shadow-sm cursor-pointer"
          >
            <UserCheck className="h-3 w-3" />
            <span>팀원 관리</span>
          </button>

          {/* Force Refresh */}
          <button
            onClick={onRefreshData}
            title="데이터 새로고침"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
