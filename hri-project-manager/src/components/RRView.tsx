import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, ChevronDown, ChevronUp, UserCheck, AlertCircle, BookmarkCheck, CalendarRange } from 'lucide-react';
import { Member } from '../services/memberService';
import { Course } from '../services/courseService';
import { Round } from '../services/roundService';
import { formatDateRange } from '../utils/dateUtils';

interface RRViewProps {
  members: Member[];
  courses: Course[];
  rounds: Round[];
}

export const RRView: React.FC<RRViewProps> = ({ members, courses, rounds }) => {
  // Track expanded state for each member's completed history list
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const toggleHistory = (memberId: string) => {
    setExpandedHistory(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  return (
    <div className="space-y-6" id="hri-rr-view">
      {/* Intro label */}
      <div className="bg-[#f2f4f6]/60 border border-[#f2f4f6] p-5 rounded-[24px] text-slate-800 text-xs flex items-start gap-3">
        <BookmarkCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-extrabold text-[#191f28] text-sm">HRI 가용 실무진 R&R 매트릭스</p>
          <p className="text-xs text-[#4e5968] font-medium mt-1 leading-relaxed">
            각 마스터 프로젝트(사업/PM/PL) 배정 항목과 세부 운영 차수(운영지원/현장운영) 지정 현황을 실시간으로 산출합니다. 완료된 실적 이력은 Foldable 아코디언 컴포넌트로 정리하여 공간 소모를 방지합니다.
          </p>
        </div>
      </div>

      {/* Grid listing the staff members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          // 1. Projects (Courses) managed by this user
          const managedCourses = courses.filter(c => 
            c.manager_sales_id === member.id ||
            c.manager_pm_id === member.id ||
            c.manager_pl_id === member.id
          );
 
          // Get role definition labels on each course for this user
          const getCourseRoleLabel = (c: Course) => {
            const roles: string[] = [];
            if (c.manager_sales_id === member.id) roles.push('사업PM');
            if (c.manager_pm_id === member.id) roles.push('운영PM');
            if (c.manager_pl_id === member.id) roles.push('운영PL');
            return roles.join(' + ');
          };
 
          // 2. Detailed Rounds assigned to this user
          const assignedRounds = rounds.filter(r =>
            (r.operator_support_ids && Array.isArray(r.operator_support_ids) && r.operator_support_ids.includes(member.id)) ||
            r.operator_support_id === member.id ||
            r.operator_field_id === member.id
          );
 
          // Get role definition labels on each round for this user
          const getRoundRoleLabel = (r: Round) => {
            const roles: string[] = [];
            const isSupport = (r.operator_support_ids && Array.isArray(r.operator_support_ids) && r.operator_support_ids.includes(member.id)) ||
                              r.operator_support_id === member.id ||
                              r.operator_field_id === member.id;
            if (isSupport) roles.push('운영보조');
            return roles.join(' + ') || '운영보조';
          };
 
          // Split rounds into active (ongoing) vs completed (history)
          const activeRounds = assignedRounds.filter(r => r.status !== '완료');
          const completedRounds = assignedRounds.filter(r => r.status === '완료');
          const isHistExpanded = expandedHistory[member.id] || false;
 
          return (
            <div 
              key={member.id}
              id={`rr-card-${member.id}`}
              className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.025)] transition-all flex flex-col justify-between"
            >
              {/* Member profile tag */}
              <div className="p-5 bg-[#f9fafb] border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100/30 flex items-center justify-center font-bold text-sm shadow-3xs uppercase">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#191f28]">{member.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tight font-semibold mt-0.5">{member.email || '이메일 없음'}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-150 rounded-xl shadow-4xs">
                  {member.role === 'sales' ? '사업PM' :
                   member.role === 'pm' ? '운영PM' :
                   member.role === 'pl' ? '운영PL' :
                   member.role === 'support' ? '운영보조' : '운영보조'}
                </span>
              </div>

              {/* R&R Tasks list */}
              <div className="p-5 flex-1 space-y-5">
                {/* A. Course Management Assignments */}
                <div>
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <span>마스터 프로젝트 기정 ({managedCourses.length})</span>
                  </h5>
                  {managedCourses.length === 0 ? (
                    <div className="text-[10px] text-slate-400 bg-[#f2f4f6]/30 p-3 rounded-xl border border-dashed border-slate-200/50 italic font-semibold">
                      배치 관리 중인 총괄 계약이 존재하지 않습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {managedCourses.map(c => (
                        <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-bold text-[#191f28]">
                          <span className="truncate max-w-[70%]" title={c.name}>
                            {c.name}
                          </span>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                            {getCourseRoleLabel(c)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* B. Active Field Training Workload */}
                <div>
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
                    가동중 세부 운영 차수 ({activeRounds.length})
                  </h5>
                  {activeRounds.length === 0 ? (
                    <div className="text-[10px] text-slate-400 bg-[#f2f4f6]/30 p-3 rounded-xl border border-dashed border-slate-200/50 italic font-semibold">
                      현장 가동 중인 세부 차수가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeRounds.map(r => (
                        <div key={r.id} className="p-3 rounded-xl bg-blue-50/20 border border-blue-100/40 flex flex-col gap-1.5 text-xs font-bold text-[#191f28]">
                          <div className="flex items-center justify-between">
                            <span className="truncate max-w-[70%] text-slate-800" title={r.name}>
                              {r.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">
                              {getRoundRoleLabel(r)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono font-bold">
                            {formatDateRange(r.start_date, r.end_date)} | {r.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* C. Completed Rounds Foldable Segment */}
                <div>
                  <button
                    id={`btn-rr-history-${member.id}`}
                    onClick={() => toggleHistory(member.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#f2f4f6] hover:bg-slate-200 text-[#4e5968] hover:text-slate-900 text-xs transition duration-150 font-bold"
                  >
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>완료 운영 실적 ({completedRounds.length}개)</span>
                    </span>
                    {isHistExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {/* Collapsible area */}
                  {isHistExpanded && (
                    <div className="mt-3.5 pl-2.5 border-l-2 border-slate-200 space-y-2 max-h-40 overflow-y-auto" id={`rr-history-${member.id}`}>
                      {completedRounds.length === 0 ? (
                        <div className="text-[10px] text-slate-400 p-3 italic bg-slate-50 rounded-xl font-semibold">
                          인증 및 완료된 교육 이력이 아직 없습니다.
                        </div>
                      ) : (
                        completedRounds.map(r => (
                          <div key={r.id} className="p-2.5 rounded-xl bg-emerald-50/20 border border-emerald-100/30 text-[11px] font-bold text-slate-850 flex flex-col">
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[70%]" title={r.name}>{r.name}</span>
                              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">만족도: {r.satisfaction ? `${r.satisfaction}점` : '미입력'}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5">{r.participants_count}명 수료</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

