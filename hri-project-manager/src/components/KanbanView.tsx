import React, { useState } from 'react';
import { 
  ClipboardList, 
  MapPin, 
  User, 
  CheckSquare, 
  Square, 
  Edit, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Round, RoundChecklistItem } from '../services/roundService';
import { Course } from '../services/courseService';
import { Member } from '../services/memberService';
import { ROUND_STATUSES, RoundStatus } from '../utils/constants';
import { formatDateRange } from '../utils/dateUtils';
import { formatSatisfaction } from '../utils/formatUtils';

interface KanbanViewProps {
  rounds: Round[];
  courses: Course[];
  members: Member[];
  showHidden: boolean;
  onEditRound: (round: Round) => void;
  onCopyRound: (id: string) => void;
  onDeleteRound: (id: string) => void;
  onRestoreRound: (id: string) => void;
  onToggleChecklistItem: (roundId: string, itemId: string) => void;
  onCompleteRoundFlow: (round: Round) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  rounds,
  courses,
  members,
  showHidden,
  onEditRound,
  onCopyRound,
  onDeleteRound,
  onRestoreRound,
  onToggleChecklistItem,
  onCompleteRoundFlow
}) => {
  // Track which column titles have their "+N개 더보기" expanded
  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});

  const toggleStatusExpand = (columnTitle: string) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [columnTitle]: !prev[columnTitle]
    }));
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : '미지정 프로젝트';
  };

  const getCourseType = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.type : '위탁';
  };

  const getMemberName = (id?: string) => {
    if (!id) return '';
    const m = members.find(item => item.id === id);
    return m ? m.name : '';
  };

  const getMultiSupportNames = (round: any) => {
    if (round.operator_support_ids && Array.isArray(round.operator_support_ids) && round.operator_support_ids.length > 0) {
      return round.operator_support_ids
        .map((id: string) => getMemberName(id))
        .filter(n => n)
        .join(', ');
    }
    const names = [];
    if (round.operator_support_id) names.push(getMemberName(round.operator_support_id));
    if (round.operator_field_id) names.push(getMemberName(round.operator_field_id));
    const joined = names.filter(n => n).join(', ');
    return joined || '미배정';
  };

  const KANBAN_COLUMNS = [
    {
      title: '기획 / 준비',
      statuses: ['기획중', '준비중'] as RoundStatus[],
      bg: 'bg-indigo-50/10',
      border: 'border-indigo-100',
      indicator: 'bg-indigo-500',
      headText: 'text-indigo-700 bg-indigo-100/65'
    },
    {
      title: '운영',
      statuses: ['운영중'] as RoundStatus[],
      bg: 'bg-rose-50/15',
      border: 'border-rose-100',
      indicator: 'bg-rose-500 animate-pulse',
      headText: 'text-rose-700 bg-rose-100/30'
    },
    {
      title: '완료',
      statuses: ['완료'] as RoundStatus[],
      bg: 'bg-emerald-50/15',
      border: 'border-emerald-100',
      indicator: 'bg-emerald-500',
      headText: 'text-emerald-700 bg-emerald-100/65'
    },
    {
      title: '보류 / 취소',
      statuses: ['보류', '취소'] as RoundStatus[],
      bg: 'bg-slate-50',
      border: 'border-slate-200/80',
      indicator: 'bg-zinc-400',
      headText: 'text-zinc-650 bg-zinc-150'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kanban-board-grid">
      {KANBAN_COLUMNS.map(column => {
        // Filter rounds matching this column's status union and hidden criteria
        const filteredRounds = rounds.filter(r => {
          const matchesStatus = column.statuses.includes(r.status);
          const matchesVisibility = showHidden ? true : r.is_active;
          return matchesStatus && matchesVisibility;
        });

        const isExpanded = expandedStatuses[column.title] || false;
        const visibleRounds = isExpanded ? filteredRounds : filteredRounds.slice(0, 3);
        const hiddenCount = filteredRounds.length - 3;

        return (
          <div 
            key={column.title} 
            id={`kanban-col-${column.title.replace(/\s+/g, '')}`}
            className={`rounded-[24px] border ${column.border} ${column.bg} p-4.5 flex flex-col min-h-[500px] h-full shadow-[0_8px_30px_rgb(0,0,0,0.01)] transition-all`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-200/40">
              <div className="flex items-center space-x-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full ${column.indicator} shrink-0`} />
                <h3 className="text-xs font-extrabold text-[#191f28] tracking-tight truncate">{column.title}</h3>
                <span className="text-[10px] bg-slate-200/50 text-[#4e5968] px-2 py-0.5 rounded-full font-mono font-bold">
                  {filteredRounds.length}
                </span>
              </div>
            </div>

            {/* Cards Container */}
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[1200px] pr-0.5">
              {visibleRounds.map((round) => {
                // Find visible sequential number among course-specific rounds
                const courseRounds = rounds.filter(r => r.course_id === round.course_id && r.is_active);
                const displayIndex = courseRounds.findIndex(r => r.id === round.id) + 1;

                const completedChecklist = round.checklist.filter(item => item.completed).length;
                const totalChecklist = round.checklist.length;
                const progressPercentage = totalChecklist > 0 
                  ? Math.round((completedChecklist / totalChecklist) * 100) 
                  : 0;

                return (
                  <div 
                    key={round.id}
                    id={`kanban-card-${round.id}`}
                    className={`bg-white rounded-[22px] border p-4 shadow-[0_4px_20px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:translate-y-[-1px] transition-all relative group ${
                      !round.is_active ? 'opacity-60 border-dashed border-red-200 bg-red-50/10' : 'border-slate-100'
                    }`}
                  >
                    {/* Course Name Card Header */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2 text-[9px] font-bold">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded shrink-0 border ${
                          round.status === '기획중' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          round.status === '준비중' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          round.status === '운영중' ? 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse' :
                          round.status === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                          round.status === '보류' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {round.status}
                        </span>
                        <span className="truncate max-w-[80%] text-slate-500 block">
                          {getCourseType(round.course_id)} | {getCourseName(round.course_id)}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                        No.DB {round.round_no} (보임 #{displayIndex})
                      </span>
                    </div>

                    {/* Round Title */}
                    <h4 className="text-xs font-extrabold text-[#191f28] leading-snug tracking-tight mb-2.5 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onEditRound(round)}>
                      {round.name}
                    </h4>

                    {/* Operational parameters (Location/Staff lists styled to PREVENT vertical breakdown) */}
                    <div className="space-y-1.5 mb-3 pb-3 border-b border-dashed border-slate-100 text-[11px] text-[#4e5968] font-medium">
                      {/* Place/Location */}
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                        <span className="truncate text-[#191f28] font-bold" title={round.location || '장소 미지정'}>
                          {round.location || '장소 미지정'}
                        </span>
                      </div>
                      
                      {/* Operators Assignments */}
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                        <span className="truncate text-slate-700 font-bold" title={getMultiSupportNames(round)}>
                          운영보조: <strong className="text-rose-600 font-extrabold">{getMultiSupportNames(round)}</strong>
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono font-bold">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDateRange(round.start_date, round.end_date)}</span>
                      </div>
                    </div>

                    {/* Checklist Toggle Box */}
                    {totalChecklist > 0 && (
                      <div className="mb-3.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100/50">
                        <div className="flex items-center justify-between text-[9px] text-[#8b95a1] mb-2 font-mono font-bold">
                          <span>할 일 진척도</span>
                          <span>{completedChecklist}/{totalChecklist} ({progressPercentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-1 mb-2.5">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>

                        {/* Drop list of topmost items for direct action */}
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {round.checklist.slice(0, 4).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => onToggleChecklistItem(round.id, item.id)}
                              className="w-full flex items-start text-left text-[10px] text-slate-700 hover:bg-slate-200/50 p-1 rounded transition cursor-pointer"
                            >
                              <span className="mt-0.5 mr-1.5 shrink-0">
                                {item.completed ? (
                                  <CheckSquare className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Square className="h-3 w-3 text-slate-400" />
                                )}
                              </span>
                              <span className={`truncate ${item.completed ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-800'}`}>
                                {item.title}
                              </span>
                            </button>
                          ))}
                          {totalChecklist > 4 && (
                            <div className="text-[8px] text-slate-400 text-center font-mono font-bold pt-1">
                              외 {totalChecklist - 4}개 체크리스트 존재
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Operational Performance (If round is finished) */}
                    {round.status === '완료' && (round.participants_count > 0 || round.satisfaction > 0) && (
                      <div className="mb-3.5 p-2 rounded-xl bg-emerald-50 text-[10px] text-emerald-800 flex items-center justify-between gap-1 border border-emerald-100/50">
                        <div className="flex items-center gap-1 font-bold">
                          <Award className="h-3.5 w-3.5 text-emerald-600" />
                          <span>만족도: <strong className="font-extrabold font-mono text-emerald-700">{formatSatisfaction(round.satisfaction)}</strong> / 5.0</span>
                        </div>
                        <span className="font-mono font-bold">{round.participants_count}명 수용</span>
                      </div>
                    )}

                    {/* Action buttons on hover */}
                    <div className="flex items-center justify-end space-x-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pt-2 border-t border-slate-100">
                      {/* Restore Button if Hidden */}
                      {!round.is_active ? (
                        <button
                          onClick={() => onRestoreRound(round.id)}
                          title="과정 다시 보이기"
                          className="flex items-center space-x-0.5 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-bold cursor-pointer"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>숨김 복원</span>
                        </button>
                      ) : (
                        <>
                          {/* Complete action if preparing/operating */}
                          {round.status !== '완료' && (
                            <button
                              onClick={() => onCompleteRoundFlow(round)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-xs"
                              title="과정을 완료 상태로 수치 지정하여 마감합니다."
                            >
                              <CheckCircle className="h-2.5 w-2.5" />
                              <span>운영 완료</span>
                            </button>
                          )}
                          
                          {/* Copy Round */}
                          <button
                            onClick={() => onCopyRound(round.id)}
                            title="세부 과정 복사 (운영실적 제외 사항 카피)"
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                          </button>

                          {/* Edit Round */}
                          <button
                            onClick={() => onEditRound(round)}
                            title="정보 수정"
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
                          >
                            <Edit className="h-3 w-3" />
                          </button>

                          {/* Soft Delete */}
                          <button
                            onClick={() => onDeleteRound(round.id)}
                            title="세부 과정 숨기기 (비활성 처리)"
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty state per column */}
              {filteredRounds.length === 0 && (
                <div className="py-12 px-2 text-center text-slate-400 text-[10px] border border-dashed border-slate-200/60 rounded-[20px] bg-white/50 font-bold">
                  배정된 차수가 없습니다.
                </div>
              )}
            </div>

            {/* "+N개 더보기 / 접기" accordion controller */}
            {hiddenCount > 0 && !isExpanded && (
              <button
                id={`btn-expand-${column.title.replace(/\s+/g, '')}`}
                onClick={() => toggleStatusExpand(column.title)}
                className="mt-4 w-full py-2 border border-dashed border-slate-250 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 cursor-pointer transition shadow-2xs"
              >
                <span>+{hiddenCount}개 과정 더보기</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            )}

            {isExpanded && filteredRounds.length > 3 && (
              <button
                id={`btn-collapse-${column.title.replace(/\s+/g, '')}`}
                onClick={() => toggleStatusExpand(column.title)}
                className="mt-4 w-full py-2 border border-dashed border-slate-250 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#191f28] rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 cursor-pointer transition"
              >
                <span>운영 카드 목록 접기</span>
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
