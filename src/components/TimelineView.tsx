import React, { useState, useEffect } from 'react';
import { Calendar, User, MapPin, CheckCircle2, ChevronRight, Clock, Lightbulb, ChevronLeft, CalendarRange, Filter } from 'lucide-react';
import { Round } from '../services/roundService';
import { Course } from '../services/courseService';
import { Member } from '../services/memberService';
import { formatDateRange, formatDate } from '../utils/dateUtils';

interface TimelineViewProps {
  rounds: Round[];
  courses: Course[];
  members: Member[];
  onEditRound: (round: Round) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  rounds,
  courses,
  members,
  onEditRound
}) => {
  // Filter for rounds that actually have dates set
  const datedRounds = rounds
    .filter(r => r.start_date || r.end_date)
    .sort((a, b) => {
      const aStart = a.start_date || '';
      const bStart = b.start_date || '';
      return aStart.localeCompare(bStart);
    });

  // Unique months list (formatted YYYY-MM)
  const uniqueMonths: string[] = Array.from(new Set<string>(
    datedRounds.map(r => {
      const dateStr = r.start_date || r.end_date || '';
      return dateStr ? dateStr.substring(0, 7) : '';
    }).filter(m => m !== '')
  )).sort();

  // Current date for default setting
  const todayStr = formatDate(new Date());
  const currentMonthStr = todayStr.substring(0, 7);

  // Selected Month State: default to current month if in uniqueMonths, otherwise first available month or 'ALL'
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (uniqueMonths.includes(currentMonthStr)) {
      return currentMonthStr;
    }
    return uniqueMonths.length > 0 ? uniqueMonths[0] : 'ALL';
  });

  // Selected Specific Day inside the selected month
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

  // Clear selected day when switching months
  useEffect(() => {
    setSelectedDayDetail(null);
  }, [selectedMonth]);

  const getCourseName = (courseId: string) => {
    const c = courses.find(item => item.id === courseId);
    return c ? c.name : '알 수 없는 프로젝트';
  };

  const getCourseType = (courseId: string) => {
    const c = courses.find(item => item.id === courseId);
    return c ? c.type : '';
  };

  const getMemberName = (id?: string) => {
    if (!id) return '미배정';
    const m = members.find(item => item.id === id);
    return m ? m.name : '미배정';
  };

  const getMultiSupportNames = (round: any) => {
    const names = [];
    if (round.operator_support_id) names.push(getMemberName(round.operator_support_id));
    if (round.operator_field_id) names.push(getMemberName(round.operator_field_id));
    const joined = names.filter(n => n && n !== '미배정').join(', ');
    return joined || '미배정';
  };

  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr || monthStr === 'ALL') return '전체 기간';
    const [year, month] = monthStr.split('-');
    return `${year}년 ${parseInt(month, 10)}월`;
  };

  if (datedRounds.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500" id="timeline-empty-state">
        <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-xs font-semibold">현재 필터 조건에 진행 일정이 기입된 세부 과정이 존재하지 않습니다.</p>
        <p className="text-[10px] text-slate-450 mt-1">세부 과정 수정에서 강의 시작일과 종료일을 입력해주세요.</p>
      </div>
    );
  }

  // Get rounds that fall on a specific date String (YYYY-MM-DD)
  const getRoundsForDate = (dateStr: string) => {
    return datedRounds.filter(r => {
      const s = r.start_date || '';
      const e = r.end_date || s;
      return dateStr >= s && dateStr <= e;
    });
  };

  // Helper properties to render calendar grid
  let calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
  let daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  if (selectedMonth !== 'ALL') {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay();
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    // Past month padding
    const prevMonthDate = new Date(yearNum, monthNum - 1, 0);
    const daysInPrevMonth = prevMonthDate.getDate();
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonthMonth = prevMonthDate.getMonth() + 1;

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const formattedMonth = String(prevMonthMonth).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      calendarCells.push({
        dateStr: `${prevMonthYear}-${formattedMonth}-${formattedDay}`,
        dayNum: day,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedMonth = String(monthNum).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      calendarCells.push({
        dateStr: `${yearNum}-${formattedMonth}-${formattedDay}`,
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    // Future month padding
    const totalCells = calendarCells.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const nextMonthDate = new Date(yearNum, monthNum, 1);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonthMonth = nextMonthDate.getMonth() + 1;

    for (let day = 1; day <= remainingCells; day++) {
      const formattedMonth = String(nextMonthMonth).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      calendarCells.push({
        dateStr: `${nextMonthYear}-${formattedMonth}-${formattedDay}`,
        dayNum: day,
        isCurrentMonth: false,
      });
    }
  }

  // Determine rounds to show in the list view at the bottom
  const filteredTimelineRounds = selectedMonth === 'ALL'
    ? datedRounds
    : selectedDayDetail
      ? getRoundsForDate(selectedDayDetail)
      : datedRounds.filter(r => {
          const d = r.start_date || r.end_date || '';
          return d.startsWith(selectedMonth);
        });

  // Calculate stats for selected month or selected day
  const getStats = () => {
    const total = filteredTimelineRounds.length;
    const completed = filteredTimelineRounds.filter(r => r.status === '완료').length;
    const active = filteredTimelineRounds.filter(r => r.status === '운영중').length;
    
    let totalChecklist = 0;
    let completedChecklist = 0;
    filteredTimelineRounds.forEach(r => {
      totalChecklist += r.checklist.length;
      completedChecklist += r.checklist.filter(c => c.completed).length;
    });
    const checklistPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

    return { total, completed, active, checklistPct };
  };

  const currentStats = getStats();

  return (
    <div className="space-y-6" id="hri-timeline-view-container">
      {/* Monthly Interactive Selection Deck */}
      <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.012)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
          <div className="flex items-center space-x-2">
            <CalendarRange className="h-5 w-5 text-blue-600 shrink-0" />
            <h3 className="text-xs font-extrabold text-[#191f28]">현대 연수 교육 및 일정 마스터</h3>
          </div>
          <p className="text-[10px] text-[#4e5968] font-bold">
            원하시는 월을 선택하시면 캘린더 형태의 교육 스케줄 화면이 제공됩니다.
          </p>
        </div>

        {/* Horizontal decks for month targets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* ALL Tab */}
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`cursor-pointer text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
              selectedMonth === 'ALL'
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100/70 border-slate-150 text-slate-700'
            }`}
          >
            <div>
              <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                selectedMonth === 'ALL' ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                마스터 피드
              </span>
              <h4 className="text-xs font-extrabold mt-2 leading-none whitespace-nowrap">전체 기간 일정</h4>
            </div>
            <div className="mt-4 pt-2 border-t border-current/20 flex items-center justify-between w-full">
              <span className="text-[10.5px] font-mono font-extrabold">
                {datedRounds.length}개 차수
              </span>
            </div>
          </button>

          {/* Dynamic Month Tabs */}
          {uniqueMonths.map(mKey => {
            const isSelected = selectedMonth === mKey;
            const [year, month] = mKey.split('-');
            const monthRounds = datedRounds.filter(r => {
              const d = r.start_date || r.end_date || '';
              return d.startsWith(mKey);
            });

            return (
              <button
                key={mKey}
                onClick={() => setSelectedMonth(mKey)}
                className={`cursor-pointer text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100/70 border-slate-150 text-slate-700'
                }`}
              >
                <div>
                  <span className={`text-[8.5px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                    isSelected ? 'bg-blue-700/50 text-white border-blue-500' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    {year}
                  </span>
                  <h4 className="text-xs font-extrabold mt-2 leading-none">{parseInt(month, 10)}월 교육 스케줄</h4>
                </div>
                <div className="mt-4 pt-2 border-t border-current/20 flex items-center justify-between w-full">
                  <span className="text-[10.5px] font-mono font-bold">
                    {monthRounds.length}개 과정
                  </span>
                  <span className="text-[9px] opacity-75 font-mono font-bold">
                    ({monthRounds.filter(r => r.status === '완료').length}완료)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER CALENDAR GRID: Shown only when selectedMonth is not 'ALL' */}
      {selectedMonth !== 'ALL' && (
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden" id="timeline-calendar-grid">
          {/* Calendar Controller Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#191f28]">
                  {formatMonthLabel(selectedMonth)} 캘린더 일정표
                </h4>
                <p className="text-[10.5px] text-[#4e5968] font-bold mt-0.5">
                  달력 칸을 클릭하면 해당 일자의 상세 일정이 하단 모듈에 자동 노출됩니다.
                </p>
              </div>
            </div>

            {/* Calendar Legend indicators */}
            <div className="flex flex-wrap items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-3xs text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" /> 기획/준비
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" /> 운영중
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> 교육완료
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" /> 보류/취소
              </span>
            </div>
          </div>

          {/* Calendar week header rows */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-[#f9fafb]">
            {daysOfWeek.map((day, idx) => {
              const isSunday = idx === 0;
              const isSaturday = idx === 6;
              return (
                <div 
                  key={day} 
                  className={`text-center py-2.5 text-[10px] font-extrabold tracking-wider ${
                    isSunday ? 'text-rose-600 bg-rose-50/20' : 
                    isSaturday ? 'text-blue-600 bg-blue-50/10' : 'text-slate-600'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-150 border-r border-b border-slate-150">
            {calendarCells.map((cell, idx) => {
              const dayRounds = getRoundsForDate(cell.dateStr);
              const isSelected = selectedDayDetail === cell.dateStr;
              const isToday = cell.dateStr === todayStr;
              const isSunday = idx % 7 === 0;
              const isSaturday = idx % 7 === 6;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDayDetail(isSelected ? null : cell.dateStr)}
                  className={`min-h-[85px] md:min-h-[110px] p-2 flex flex-col justify-between transition-all duration-150 relative cursor-pointer select-none ${
                    !cell.isCurrentMonth ? 'bg-slate-50/50 opacity-40 hover:bg-slate-50' : 'bg-white hover:bg-slate-50/80'
                  } ${
                    isSelected ? 'ring-2 ring-blue-600 bg-blue-50/25 z-10' : ''
                  }`}
                >
                  {/* Day cell top display row */}
                  <div className="flex items-center justify-between">
                    {/* Selected Indicator dot */}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                    )}
                    {isToday && !isSelected && (
                      <span className="text-[8.5px] bg-slate-900 text-white px-1.5 py-0.2 rounded-full font-bold">TODAY</span>
                    )}
                    <span 
                      className={`text-[10px] font-extrabold ml-auto font-mono ${
                        isSunday ? 'text-rose-600' :
                        isSaturday ? 'text-blue-600' :
                        cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                  </div>

                  {/* Day Cell scheduled courses blocks */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                    {dayRounds.slice(0, 3).map(r => {
                      // Color schemes depending on project stats
                      const isComplete = r.status === '완료';
                      const isOperating = r.status === '운영중';
                      const isPostponed = r.status === '보류' || r.status === '취소';
                      
                      let badgeStyle = 'bg-blue-50 border-blue-100 text-blue-700';
                      if (isComplete) badgeStyle = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                      else if (isOperating) badgeStyle = 'bg-rose-50 border-rose-150 text-rose-700 animate-pulse';
                      else if (isPostponed) badgeStyle = 'bg-zinc-100 border-zinc-200 text-zinc-600';

                      const courseType = getCourseType(r.course_id);
                      const prefixStr = courseType ? `[${courseType}] ` : '';

                      return (
                        <div 
                          key={r.id}
                          className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm truncate border leading-snug tracking-tight ${badgeStyle}`}
                          title={`${getCourseName(r.course_id)} - ${r.name}`}
                        >
                          {prefixStr}{r.name}
                        </div>
                      );
                    })}

                    {dayRounds.length > 3 && (
                      <div className="text-[8.5px] text-[#4e5968] font-bold text-center bg-slate-100 py-0.5 rounded-sm">
                        외 {dayRounds.length - 3}개 더보기 +
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Month / Selected Day Stats Banner */}
      <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded border border-blue-200">
            {selectedMonth === 'ALL' ? 'ALL SCHEDULE OVERVIEW' : `MONTHLY FOCUS: ${selectedMonth}`}
          </span>
          <h3 className="text-xs font-extrabold text-[#191f28] mt-1.5 flex flex-wrap items-center gap-1.5">
            {selectedMonth === 'ALL' ? '전체 기한 일정 마스터 Feed' : `${formatMonthLabel(selectedMonth)} 일정 현황`}
            {selectedDayDetail && (
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
                선택 일자: {selectedDayDetail}
              </span>
            )}
          </h3>
          <p className="text-[11px] text-[#4e5968] font-semibold mt-0.5">
            총 {currentStats.total}개 과정 차수 중 운영 {currentStats.active}개, 완료 {currentStats.completed}개
          </p>
        </div>

        {/* Selected date control filter tag removal */}
        {selectedDayDetail && (
          <button 
            onClick={() => setSelectedDayDetail(null)}
            className="text-[10px] h-fit bg-white hover:bg-slate-100 text-[#191f28] border border-slate-200 font-bold px-3 py-1.5 rounded-xl cursor-not-allowed cursor-pointer transition flex items-center space-x-1"
          >
            <span>✕ 날짜 필터 해제 (월 전체보기)</span>
          </button>
        )}

        {/* Checklist overall status */}
        <div className="bg-white border border-slate-200 p-2.5 px-4 rounded-xl flex items-center gap-3.5">
          <div className="text-right">
            <span className="block text-[8.5px] font-bold text-slate-400">체크리스트 종합 완료율</span>
            <span className="text-xs font-extrabold text-[#191f28]">{currentStats.checklistPct}%</span>
          </div>
          <div className="h-8 w-1 bg-blue-600/25 rounded-full overflow-hidden">
            <div className="bg-blue-600 w-full rounded-full transition-all duration-300" style={{ height: `${currentStats.checklistPct}%` }} />
          </div>
        </div>
      </div>

      {/* Main List view showing filtered rounds */}
      <div className="bg-white border border-slate-250 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden" id="timeline-card-wrapper">
        <div className="p-4.5 border-b border-slate-100 bg-[#f9fafb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Filter className="h-4.5 w-4.5 text-blue-600 shrink-0" />
            <h2 className="text-xs font-extrabold text-[#191f28]">
              {selectedMonth === 'ALL' 
                ? '전체 세부 운영 일정 타임라인' 
                : selectedDayDetail 
                  ? `${selectedDayDetail} 상세 운영 일정` 
                  : `${formatMonthLabel(selectedMonth)} 세부 운영 일정`}
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full font-mono shadow-3xs w-fit">
            일정순 정렬 ({filteredTimelineRounds.length}개 차수)
          </span>
        </div>

        <div className="p-5 divide-y divide-slate-100/70">
          {filteredTimelineRounds.map((round) => {
            const completedCount = round.checklist.filter(item => item.completed).length;
            const totalCount = round.checklist.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div 
                key={round.id}
                onClick={() => onEditRound(round)}
                className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 px-3 rounded-2xl transition duration-150 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  {/* Parent Course Title */}
                  <div className="text-[10px] font-bold text-blue-650 truncate mb-1">
                    {getCourseType(round.course_id) ? `[${getCourseType(round.course_id)}] ` : ''}{getCourseName(round.course_id)}
                  </div>
                  {/* Round Title */}
                  <div className="text-xs font-extrabold text-[#191f28] flex items-center gap-2 flex-wrap">
                    <span className="text-[12px]">{round.name}</span>
                    <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                      round.status === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 
                      round.status === '운영중' ? 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse' :
                      round.status === '준비중' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      round.status === '기획중' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {round.status}
                    </span>
                  </div>

                  {/* Sub Metadata (Location, Staff) */}
                  <div className="flex flex-wrap items-center gap-3.5 mt-2.5 text-[11px] text-[#4e5968] font-semibold">
                    <div className="flex items-center space-x-1 shrink-0 whitespace-nowrap">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[#191f28] font-bold">{round.location || '장소 미지정'}</span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>운영보조: <strong className="text-[#191f28] font-bold">{getMultiSupportNames(round)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Date Ranges & Progress bar */}
                <div className="md:text-right shrink-0 flex flex-col md:items-end justify-center">
                  <div className="text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl font-mono tracking-tight whitespace-nowrap border border-slate-200">
                    {formatDateRange(round.start_date, round.end_date)}
                  </div>
                  <div className="w-full md:w-36 mt-3">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1 font-mono font-bold">
                      <span>체크리스트 완료율</span>
                      <span>{completedCount}/{totalCount} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTimelineRounds.length === 0 && (
            <div className="py-12 text-center text-[11px] text-slate-400 italic">
              선택한 {selectedDayDetail ? `${selectedDayDetail} 일자에` : '필터 범위 내에'} 예정된 교육 기수 및 차수가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
