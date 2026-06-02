import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, CheckSquare, Square, Trash2 } from 'lucide-react';
import { Course } from '../services/courseService';
import { Member } from '../services/memberService';
import { PROJECT_TYPES } from '../utils/constants';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (courseId: string) => void;
  course?: Course | null; // null if creating
  members: Member[];
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  course,
  members
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'출강' | '위탁'>('위탁');
  const [managerSalesId, setManagerSalesId] = useState('');
  const [managerPmId, setManagerPmId] = useState('');
  const [managerPlId, setManagerPlId] = useState('');
  
  // High level fixed checklists
  const [chkProposalPlan, setChkProposalPlan] = useState(false);
  const [chkProposalConfirm, setChkProposalConfirm] = useState(false);
  const [chkRevenueRecognize, setChkRevenueRecognize] = useState(false);

  useEffect(() => {
    if (course) {
      setName(course.name);
      setType(course.type);
      setManagerSalesId(course.manager_sales_id || '');
      setManagerPmId(course.manager_pm_id || '');
      setManagerPlId(course.manager_pl_id || '');
      setChkProposalPlan(course.chk_proposal_plan || false);
      setChkProposalConfirm(course.chk_proposal_confirm || false);
      setChkRevenueRecognize(course.chk_revenue_recognize || false);
    } else {
      setName('');
      setType('위탁');
      setManagerSalesId('');
      setManagerPmId('');
      setManagerPlId('');
      setChkProposalPlan(false);
      setChkProposalConfirm(false);
      setChkRevenueRecognize(false);
    }
  }, [course, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type,
      manager_sales_id: managerSalesId || null,
      manager_pm_id: managerPmId || null,
      manager_pl_id: managerPlId || null,
      chk_proposal_plan: chkProposalPlan,
      chk_proposal_confirm: chkProposalConfirm,
      chk_revenue_recognize: chkRevenueRecognize
    });
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'sales': return '사업PM';
      case 'pm': return '운영PM';
      case 'pl': return '운영PL';
      case 'support': return '운영보조';
      case 'field': return '운영보조';
      default: return r;
    }
  };

  const salesMembers = members;
  const pmMembers = members;
  const plMembers = members;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="course-configuration-modal">
      {/* Background layer */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              {course ? '프로젝트 정보 수정 (위탁/출강)' : '신규 메인 프로젝트 등록'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Project Name inputs */}
            <div className="space-y-1">
              <label htmlFor="course-name-input" className="block text-[11px] font-bold text-slate-500">
                훈련 과정명 (프로젝트명) <span className="text-rose-500">*</span>
              </label>
              <input
                id="course-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 현대자동차 테크리더 리더십 역량 강화 과정"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* Type categorization */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500">프로젝트 유형</label>
              <div className="grid grid-cols-2 gap-3">
                {PROJECT_TYPES.map(t => (
                  <label
                    key={t}
                    className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition capitalize ${
                      type === t 
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs' 
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="course-type"
                      checked={type === t}
                      onChange={() => setType(t)}
                      className="sr-only"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Manager Assignments */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              {/* Sales Manager */}
              <div className="space-y-1">
                <label htmlFor="course-sales-manager" className="block text-[10px] font-bold text-slate-500">사업담당자</label>
                <select
                  id="course-sales-manager"
                  value={managerSalesId}
                  onChange={(e) => setManagerSalesId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="">미정 (선택)</option>
                  {salesMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* PM Manager */}
              <div className="space-y-1">
                <label htmlFor="course-pm-manager" className="block text-[10px] font-bold text-slate-500">운영PM</label>
                <select
                  id="course-pm-manager"
                  value={managerPmId}
                  onChange={(e) => setManagerPmId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="">미정 (선택)</option>
                  {pmMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* PL Manager */}
              <div className="space-y-1">
                <label htmlFor="course-pl-manager" className="block text-[10px] font-bold text-slate-500">운영PL</label>
                <select
                  id="course-pl-manager"
                  value={managerPlId}
                  onChange={(e) => setManagerPlId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="">미정 (선택)</option>
                  {plMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Core Project Checklists (3 fixed checkboxes as requested) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <span>프로젝트 체크리스트 (사업단 기준 3 대분류 고정)</span>
              </h4>
              <div className="divide-y divide-slate-200/60 text-slate-600">
                {/* Checkbox 1: 교육 제안/기획 */}
                <label className="flex items-center space-x-2 py-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={chkProposalPlan}
                    onChange={(e) => setChkProposalPlan(e.target.checked)}
                    className="sr-only"
                  />
                  <span>
                    {chkProposalPlan ? (
                      <CheckSquare className="h-4.5 w-4.5 text-rose-500" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-slate-400" />
                    )}
                  </span>
                  <span className={`font-semibold ${chkProposalPlan ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    1. 교육 제안 및 기획
                  </span>
                </label>

                {/* Checkbox 2: 제안서 확정 */}
                <label className="flex items-center space-x-2 py-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={chkProposalConfirm}
                    onChange={(e) => setChkProposalConfirm(e.target.checked)}
                    className="sr-only"
                  />
                  <span>
                    {chkProposalConfirm ? (
                      <CheckSquare className="h-4.5 w-4.5 text-rose-500" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-slate-400" />
                    )}
                  </span>
                  <span className={`font-semibold ${chkProposalConfirm ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    2. 제안서 최종 확정
                  </span>
                </label>

                {/* Checkbox 3: 매출 인식 */}
                <label className="flex items-center space-x-2 py-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={chkRevenueRecognize}
                    onChange={(e) => setChkRevenueRecognize(e.target.checked)}
                    className="sr-only"
                  />
                  <span>
                    {chkRevenueRecognize ? (
                      <CheckSquare className="h-4.5 w-4.5 text-rose-500" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-slate-400" />
                    )}
                  </span>
                  <span className={`font-semibold ${chkRevenueRecognize ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    3. 회정 보고 및 매출 인식
                  </span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 font-medium">
              <div>
                {course && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(course.id);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 rounded-lg font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>삭제(숨김)</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-150 rounded-lg font-medium transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center space-x-1 transition shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>저장</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
