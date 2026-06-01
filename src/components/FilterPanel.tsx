import React from 'react';
import { Search, Filter, Trash2, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { PROJECT_TYPES, ROUND_STATUSES, RoundStatus } from '../utils/constants';
import { Member } from '../services/memberService';

export interface FilterState {
  search: string;
  projectType: '전체' | '출강' | '위탁';
  managerId: '전체' | string;
  status: '전체' | RoundStatus;
  showHidden: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
  members: Member[];
  onOpenCreateProject: () => void;
  onOpenCreateRound: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  members,
  onOpenCreateProject,
  onOpenCreateRound
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] mb-6 animate-fade-in" id="hri-filter-panel">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Search controls */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="프로젝트 또는 세부과정명 검색..."
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="w-full pl-10 pr-3 py-3 text-xs bg-[#f2f4f6] focus:bg-white border-2 border-transparent focus:border-blue-500 rounded-xl text-[#191f28] placeholder-slate-400 focus:outline-hidden transition-all font-semibold"
            />
          </div>

          {/* Project Type dropdown */}
          <div className="flex items-center space-x-2 bg-[#f2f4f6]/60 hover:bg-[#f2f4f6] px-3 py-1 rounded-xl transition duration-150">
            <span className="text-[10px] font-extrabold text-[#4e5968] shrink-0">유형</span>
            <select
              id="filter-project-type"
              value={filters.projectType}
              onChange={(e) => onChange({ projectType: e.target.value as FilterState['projectType'] })}
              className="w-full bg-transparent py-2 text-xs font-bold text-[#191f28] focus:outline-hidden cursor-pointer"
            >
              <option value="전체">전체 유형</option>
              {PROJECT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Managers dropdown */}
          <div className="flex items-center space-x-2 bg-[#f2f4f6]/60 hover:bg-[#f2f4f6] px-3 py-1 rounded-xl transition duration-150">
            <span className="text-[10px] font-extrabold text-[#4e5968] shrink-0">담당</span>
            <select
              id="filter-manager"
              value={filters.managerId}
              onChange={(e) => onChange({ managerId: e.target.value })}
              className="w-full bg-transparent py-2 text-xs font-bold text-[#191f28] focus:outline-hidden cursor-pointer"
            >
              <option value="전체">전체 담당자</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="flex items-center space-x-2 bg-[#f2f4f6]/60 hover:bg-[#f2f4f6] px-3 py-1 rounded-xl transition duration-150">
            <span className="text-[10px] font-extrabold text-[#4e5968] shrink-0">단계</span>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => onChange({ status: e.target.value as FilterState['status'] })}
              className="w-full bg-transparent py-2 text-xs font-bold text-[#191f28] focus:outline-hidden cursor-pointer"
            >
              <option value="전체">전체 단계</option>
              {ROUND_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action button triggers & ShowHidden toggle */}
        <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
          {/* Show hidden toggle item */}
          <label 
            id="lbl-show-hidden"
            className={`flex items-center space-x-1.5 px-4 py-3.5 cursor-pointer rounded-xl border text-xs transition-all select-none font-bold ${
              filters.showHidden 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-[#f2f4f6] text-[#4e5968] border-transparent hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="숨김(비활성화) 처리된 세부 과정 항목들을 노출하여 복원할 수 있습니다."
          >
            {filters.showHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <input
              type="checkbox"
              checked={filters.showHidden}
              onChange={(e) => onChange({ showHidden: e.target.checked })}
              className="sr-only"
            />
            <span>숨김 복원 모드 {filters.showHidden ? 'ON' : 'OFF'}</span>
          </label>

          {/* Register main course / Project */}
          <button
            id="btn-register-project"
            onClick={onOpenCreateProject}
            className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#4e5968] hover:text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            + 새 프로젝트 등록
          </button>

          {/* Register detailed round */}
          <button
            id="btn-register-round"
            onClick={onOpenCreateRound}
            className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer transition shadow-xs hover:shadow-md"
          >
            + 세부 차수 추가
          </button>
        </div>
      </div>
    </div>
  );
};
