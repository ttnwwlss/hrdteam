import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Layers, LayoutGrid, Calendar, UserCheck, History, 
  Users, Coins, FolderClosed, BarChart3, Lock, ChevronRight, Home
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'hub' | 'kanban' | 'timeline' | 'rr';
  onSelectTab: (tab: 'hub' | 'kanban' | 'timeline' | 'rr') => void;
  onOpenMembers: () => void;
  userEmail: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenMembers,
  userEmail,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 flex flex-col border-r border-slate-200"
          >
            {/* Sidebar Top Branding Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-md flex items-center justify-center shadow-xs">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 tracking-tight">HRI 통합 관리 시스템</h2>
                  <p className="text-[9px] text-slate-400 font-medium">Hyundai Research Institute</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              
              {/* CORE DASHBOARD PORTAL */}
              <div className="space-y-1.5">
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    메인 시스템 (Portal Hub)
                  </span>
                </div>

                <button
                  id="sidebar-link-home"
                  onClick={() => {
                    onSelectTab('hub');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'hub'
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-2.5'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Home className={`h-4 w-4 ${activeTab === 'hub' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>HRI 통합 스마트 홈 포털</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* CURRENT: Operation Management Module */}
              <div className="space-y-1.5">
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    운영 관리 (Operations)
                  </span>
                </div>

                <button
                  onClick={() => {
                    onSelectTab('kanban');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'kanban'
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-2.5'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutGrid className={`h-4 w-4 ${activeTab === 'kanban' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>단계별 보드 (Kanban)</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onSelectTab('timeline');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'timeline'
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-2.5'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Calendar className={`h-4 w-4 ${activeTab === 'timeline' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>운영 일정 타임라인</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onSelectTab('rr');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'rr'
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-2.5'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className={`h-4 w-4 ${activeTab === 'rr' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>담당자별 R&R 지정</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* SHARED DATA: Human Resources Module */}
              <div className="space-y-1.5">
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    인력 풀 및 팀원 DB
                  </span>
                </div>

                <button
                  onClick={() => {
                    onOpenMembers();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>팀원 정보 관리</span>
                  </div>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                    설정
                  </span>
                </button>
              </div>

              {/* FUTURE EXPANSION MODULES */}
              <div className="space-y-1.5">
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    추가 개발 예정 메뉴 (Expansion)
                  </span>
                </div>

                <div className="group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-slate-400 bg-slate-50/50 border border-slate-100 cursor-not-allowed">
                  <div className="flex items-center space-x-2.5">
                    <Coins className="h-4 w-4 text-slate-300" />
                    <span className="line-through">예산 및 정산 관리</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <Lock className="h-3 w-3 text-slate-300 animate-pulse" />
                    <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.2 rounded font-medium">준비중</span>
                  </div>
                </div>

                <div className="group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-slate-400 bg-slate-50/50 border border-slate-100 cursor-not-allowed">
                  <div className="flex items-center space-x-2.5">
                    <FolderClosed className="h-4 w-4 text-slate-300" />
                    <span className="line-through">운영 서식 자료실</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <Lock className="h-3 w-3 text-slate-300 animate-pulse" />
                    <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.2 rounded font-medium">준비중</span>
                  </div>
                </div>

                <div className="group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-slate-400 bg-slate-50/50 border border-slate-100 cursor-not-allowed">
                  <div className="flex items-center space-x-2.5">
                    <BarChart3 className="h-4 w-4 text-slate-300" />
                    <span className="line-through">집계 및 통계 리포트</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <Lock className="h-3 w-3 text-slate-300 animate-pulse" />
                    <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.2 rounded font-medium">준비중</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Bottom Footer Info */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-400 font-medium">계정 연결 정보</p>
              <p className="text-[11px] text-slate-700 font-mono font-bold truncate mt-1">{userEmail}</p>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
                <span>버전 v1.2.0 (Stable)</span>
                <span className="font-semibold text-blue-600">HRI Smart Cloud</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
