import { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import {
  Sidebar
} from './components/Sidebar';
import { 
  DashboardStats 
} from './components/DashboardStats';
import { 
  FilterPanel, 
  FilterState 
} from './components/FilterPanel';
import { 
  TimelineView 
} from './components/TimelineView';
import { 
  KanbanView 
} from './components/KanbanView';
import { 
  RRView 
} from './components/RRView';
import { 
  LogsView 
} from './components/LogsView';

// Modals
import { CourseModal } from './components/CourseModal';
import { RoundModal } from './components/RoundModal';
import { CompleteRoundModal } from './components/CompleteRoundModal';
import { MemberModal } from './components/MemberModal';
import { MainHub } from './components/MainHub';

// Services
import { Course, courseService } from './services/courseService';
import { Round, roundService } from './services/roundService';
import { Member, memberService } from './services/memberService';
import { AuditLog, logService } from './services/logService';
import { checklistService } from './services/checklistService';
import { DEFAULT_ROUND_CHECKLIST } from './utils/constants';

// Icons for Tabs switcher
import { LayoutGrid, Calendar, UserCheck, History, EyeOff, Sparkles, FolderSync, BookOpen, Home } from 'lucide-react';

export default function App() {
  // Roster lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Navigation & View controllers
  const [activeTab, setActiveTab] = useState<'hub' | 'kanban' | 'timeline' | 'rr'>('hub');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projectType: '전체',
    managerId: '전체',
    status: '전체',
    showHidden: false
  });

  // Modal display controllers
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [roundToComplete, setRoundToComplete] = useState<Round | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Initial loader
  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedMembers = await memberService.getMembers();
      const fetchedCourses = await courseService.getAllCoursesIncludingHidden();
      const fetchedRounds = await roundService.getAllRoundsIncludingHidden();
      const fetchedLogs = await logService.getLogs();

      setMembers(fetchedMembers);
      setCourses(fetchedCourses);
      setRounds(fetchedRounds);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Data hydration failure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter lists computed on criteria
  const activeCourses = courses.filter(c => filters.showHidden ? true : c.is_active);
  const activeRoundsList = rounds.filter(r => filters.showHidden ? true : r.is_active);

  // Get course IDs that match general project filters (search and type)
  const matchingCourseIds = courses
    .filter(c => {
      // 1. Type check
      if (filters.projectType !== '전체' && c.type !== filters.projectType) return false;
      // 2. Manager check
      if (filters.managerId !== '전체') {
        const matchesSales = c.manager_sales_id === filters.managerId;
        const matchesPm = c.manager_pm_id === filters.managerId;
        const matchesPl = c.manager_pl_id === filters.managerId;
        if (!matchesSales && !matchesPm && !matchesPl) return false;
      }
      // 3. Search text
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        if (!matchesName) return false;
      }
      // 4. Hidden filter
      if (!filters.showHidden && !c.is_active) return false;

      return true;
    })
    .map(c => c.id);

  // Final filtered rounds matching selection
  const filteredRounds = activeRoundsList.filter(r => {
    // Round must belong to a matching course OR the round name itself must match search query
    const belongsToMatchingCourse = matchingCourseIds.includes(r.course_id);
    
    let matchesSearch = belongsToMatchingCourse;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const roundNameMatches = r.name.toLowerCase().includes(query);
      const locMatches = (r.location || '').toLowerCase().includes(query);
      matchesSearch = belongsToMatchingCourse || roundNameMatches || locMatches;
    }

    if (!matchesSearch) return false;

    // Filter by staff if manager filter is active at round level as well
    if (filters.managerId !== '전체') {
      const belongsToCourseWithManager = courses
        .filter(c => c.manager_sales_id === filters.managerId || c.manager_pm_id === filters.managerId || c.manager_pl_id === filters.managerId)
        .map(c => c.id)
        .includes(r.course_id);
      
      const isRoundStaff = r.operator_support_id === filters.managerId ||
                           r.operator_field_id === filters.managerId;
      if (!belongsToCourseWithManager && !isRoundStaff) return false;
    }

    // Filter by status selection
    if (filters.status !== '전체' && r.status !== filters.status) return false;

    return true;
  });

  // Unique listed courses that have active filtered rounds inside
  const displayedCourseIds = new Set(filteredRounds.map(r => r.course_id));
  const filteredCourses = activeCourses.filter(c => matchingCourseIds.includes(c.id) || displayedCourseIds.has(c.id));

  // --- HANDLERS ---

  // Project/Course managers edits
  const handleOpenEditProject = (course: Course) => {
    setSelectedCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleOpenCreateProject = () => {
    setSelectedCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (data: any) => {
    setIsCourseModalOpen(false);
    try {
      if (selectedCourse) {
        await courseService.updateCourse(selectedCourse.id, data);
      } else {
        const newCourse = await courseService.createCourse(data);
        // Auto-create a default 1차수 round so it immediately reflects in the Kanban step board
        await roundService.createRound({
          course_id: newCourse.id,
          name: '1차수 - 운영 기획 및 준비',
          status: '기획중',
          location: '',
          operator_support_id: newCourse.manager_pm_id || '',
          operator_field_id: newCourse.manager_pl_id || '',
          memo: '신규 프로젝트 등록 시 자동 개설된 기본 운영 차수입니다. 일정을 가입하여 타임라인에도 연동하세요.',
          participants_count: 0,
          satisfaction: 0,
          checklist: DEFAULT_ROUND_CHECKLIST.map(it => ({
            ...it,
            id: 'chk_' + Math.random().toString(36).substr(2, 9)
          }))
        });
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('이 프로젝트와 산하의 모든 세부 과정 차수를 함께 숨기시겠습니까? (삭제 되지 않고 보관됩니다)')) {
      try {
        await courseService.deleteCourse(id);
        // Also soft-delete rounds under it to keep data consistent
        const roundsUnder = rounds.filter(r => r.course_id === id && r.is_active);
        for (const r of roundsUnder) {
          await roundService.deleteRound(r.id);
        }
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRestoreCourse = async (id: string) => {
    try {
      await courseService.restoreCourse(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDeleteCourse = async (id: string) => {
    if (confirm('이 프로젝트를 완전히 영구 삭제하시겠습니까?\n경고: 이 프로젝트와 관련된 모든 세부 차수도 Supabase 및 로컬 저장소에서 함께 영구 삭제됩니다.')) {
      try {
        await courseService.permanentDeleteCourse(id);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Round edits
  const handleOpenEditRound = (round: Round) => {
    setSelectedRound(round);
    setIsRoundModalOpen(true);
  };

  const handleOpenCreateRound = () => {
    setSelectedRound(null);
    setIsRoundModalOpen(true);
  };

  const handleSaveRound = async (data: any) => {
    setIsRoundModalOpen(false);
    try {
      let finalCourseId = data.course_id;

      // Check if course needs to be created or matched dynamically by course_name_new
      if (data.course_id === 'NEW_COURSE' || !data.course_id) {
        if (data.course_name_new && data.course_name_new.trim()) {
          const typedName = data.course_name_new.trim();
          // Case-insensitive exact match check
          const existingCourse = courses.find(c => c.name.trim().toLowerCase() === typedName.toLowerCase());
          if (existingCourse) {
            finalCourseId = existingCourse.id;
          } else {
            // Register a brand new project/course dynamically
            const newCourse = await courseService.createCourse({
              name: typedName,
              type: '위탁', // default type
              manager_sales_id: '',
              manager_pm_id: '',
              manager_pl_id: ''
            });
            finalCourseId = newCourse.id;
          }
        } else {
          // Fallback if somehow course name is missing
          if (courses.length > 0) {
            finalCourseId = courses[0].id;
          } else {
            alert('과정명을 올바르게 입력해주세요.');
            return;
          }
        }
      }

      // Prepare data for save
      const roundDetails = {
        ...data,
        course_id: finalCourseId
      };
      
      // Remove temporary key
      delete roundDetails.course_name_new;

      if (selectedRound) {
        await roundService.updateRound(selectedRound.id, roundDetails);
      } else {
        await roundService.createRound(roundDetails);
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRound = async (id: string) => {
    try {
      await roundService.copyRound(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRound = async (id: string) => {
    if (confirm('이 세부 운영 차수를 숨김(비활성) 처리하시겠습니까?')) {
      try {
        await roundService.deleteRound(id);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRestoreRound = async (id: string) => {
    try {
      await roundService.restoreRound(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Checklist Item direct toggles
  const handleToggleChecklistItem = async (roundId: string, itemId: string) => {
    try {
      await checklistService.toggleChecklistItem(roundId, itemId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Complete round popup trigger
  const handleOpenCompleteRound = (round: Round) => {
    setRoundToComplete(round);
    setIsCompleteModalOpen(true);
  };

  const handleConfirmCompleteRound = async (roundId: string, metrics: { participantsCount: number; satisfaction: number; completedAt: string }) => {
    setIsCompleteModalOpen(false);
    try {
      const activeRound = rounds.find(r => r.id === roundId);
      if (!activeRound) return;

      await roundService.updateRound(roundId, {
        status: '완료',
        participants_count: metrics.participantsCount,
        satisfaction: metrics.satisfaction,
        completed_at: metrics.completedAt
      });
      
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation Hamburger Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMembers={() => setIsMemberModalOpen(true)}
        userEmail="hri.hrdteam@gmail.com"
      />

      {/* Central Header */}
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenMembers={() => setIsMemberModalOpen(true)}
        onRefreshData={loadData}
        userEmail="hri.hrdteam@gmail.com"
      />

      {/* Main dashboard content body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs font-semibold space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            <span>HRI 프로젝트 데이터를 동기화하는 중입니다...</span>
          </div>
        ) : activeTab === 'hub' ? (
          <MainHub 
            courses={courses}
            rounds={rounds}
            members={members}
            onNavigateToTab={setActiveTab}
            onOpenCreateProject={handleOpenCreateProject}
            onOpenCreateRound={handleOpenCreateRound}
            onEditCourse={handleOpenEditProject}
            onDeleteCourse={handleDeleteCourse}
            onRestoreCourse={handleRestoreCourse}
            onEditRound={handleOpenEditRound}
          />
        ) : (
          <>
            {(() => {
              const activeCourseIdsSet = new Set(courses.filter(c => c.is_active).map(c => c.id));
              return (
                <DashboardStats 
                  courses={courses.filter(c => c.is_active)}
                  rounds={rounds.filter(r => r.is_active && activeCourseIdsSet.has(r.course_id))}
                  members={members}
                />
              );
            })()}

            {/* Dynamic filter panel interface */}
            <FilterPanel 
              filters={filters}
              onChange={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
              members={members}
              onOpenCreateProject={handleOpenCreateProject}
              onOpenCreateRound={handleOpenCreateRound}
            />

            {/* View Selection Tab List */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/50 rounded-xl">
                {/* Home/Hub switch button */}
                <button
                  id="tab-hub"
                  onClick={() => setActiveTab('hub')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeTab === 'hub' 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Home className="h-3.5 w-3.5 text-slate-500" />
                  <span>스마트 홈 포털</span>
                </button>

                {/* Kanban view tab button */}
                <button
                  id="tab-kanban"
                  onClick={() => setActiveTab('kanban')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeTab === 'kanban' 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
                  <span>단계별 보드 (Kanban)</span>
                </button>

                {/* Timeline view tab button */}
                <button
                  id="tab-timeline"
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeTab === 'timeline'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>일정 타임라인</span>
                </button>

                {/* R&R matrix view tab button */}
                <button
                  id="tab-rr"
                  onClick={() => setActiveTab('rr')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeTab === 'rr'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>담당자별 R&R</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                {activeTab === 'kanban' && '* 세부 과정은 최대 2개씩 압축 정돈됩니다.'}
                {activeTab === 'timeline' && '* 일정이 등록된 세부 차수의 흐름입니다.'}
                {activeTab === 'rr' && '* 부서 내 모든 배치 담당과 차수를 집계합니다.'}
              </div>
            </div>

            {/* Master Active Views Wrapper */}
            <section id="hri-main-viewport" className="min-h-[400px]">
              {activeTab === 'kanban' && (() => {
                const displayedCourses = isCoursesExpanded ? filteredCourses : filteredCourses.slice(0, 6);
                const roundsToPass = selectedCourseId 
                  ? filteredRounds.filter(r => r.course_id === selectedCourseId)
                  : filteredRounds;

                return (
                  <div className="space-y-6">
                    {/* Master Projects management controller list */}
                    <div className="bg-white border border-slate-200 rounded-[20px] shadow-2xs p-5" id="project-directories">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold text-slate-800 flex flex-wrap items-center gap-1.5 leading-relaxed">
                          <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>개설 프로젝트 마스터 레벨 목록 ({filteredCourses.length}개 과정)</span>
                          {selectedCourseId && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                              필터링 활성화됨 (차수 보드가 필터링됩니다)
                            </span>
                          )}
                        </h3>
                        {selectedCourseId && (
                          <button
                            onClick={() => setSelectedCourseId(null)}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-350 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                          >
                            <span>✕ 전체 과정 차수 보기</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {displayedCourses.map((c) => {
                          const courseRounds = rounds.filter(r => r.course_id === c.id && r.is_active);
                          const completedRounds = courseRounds.filter(r => r.status === '완료').length;
                          const progressPercent = courseRounds.length > 0 
                            ? Math.round((completedRounds / courseRounds.length) * 100) 
                            : 0;
                          const isSelected = selectedCourseId === c.id;

                          return (
                            <div 
                              key={c.id} 
                              onClick={() => setSelectedCourseId(isSelected ? null : c.id)}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between hover:border-slate-350 transition cursor-pointer select-none relative ${
                                isSelected
                                  ? 'bg-blue-50/15 border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                                  : !c.is_active 
                                    ? 'bg-blue-50/10 border-blue-200 border-dashed opacity-60' 
                                    : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded shrink-0">
                                      {c.type}
                                    </span>
                                    {isSelected && (
                                      <span className="text-[9px] font-extrabold text-white bg-blue-600 px-1.5 py-0.2 rounded shrink-0 animate-pulse">
                                        선택됨
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2 leading-snug tracking-tight" title={c.name}>
                                    {c.name}
                                  </h4>
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2.5 border-t border-slate-200/65 flex items-center justify-between gap-1.5">
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  차수 진척률: <strong className="text-slate-600 font-semibold">{completedRounds}/{courseRounds.length} ({progressPercent}%)</strong>
                                </div>
                                
                                <div className="flex items-center space-x-1 shrink-0">
                                  {!c.is_active ? (
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRestoreCourse(c.id); }}
                                        className="px-2 py-0.5 bg-slate-700 text-white rounded text-[9px] font-semibold hover:bg-slate-800 transition cursor-pointer"
                                      >
                                        숨김 해제 복원
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handlePermanentDeleteCourse(c.id); }}
                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-semibold transition cursor-pointer"
                                      >
                                        영구 삭제
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenEditProject(c); }}
                                        className="px-2 py-0.5 border border-slate-250 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded text-[9px] font-bold transition cursor-pointer"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c.id); }}
                                        className="px-2 py-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded text-[9px] transition cursor-pointer"
                                        title="프로젝트를 숨깁니다"
                                      >
                                        숨김
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredCourses.length === 0 && (
                          <div className="col-span-full py-8 text-center text-[11px] text-slate-400 italic border border-dashed rounded-lg bg-slate-50/20">
                            필터 기준에 부합하는 활성 메인 과정이 존재하지 않습니다.
                          </div>
                        )}
                      </div>

                      {filteredCourses.length > 6 && (
                        <div className="flex justify-center mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => setIsCoursesExpanded(!isCoursesExpanded)}
                            className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 hover:border-slate-350 rounded-xl text-[10px] font-extrabold text-slate-600 hover:text-slate-800 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {isCoursesExpanded ? (
                              <span>▲ 목록 접기</span>
                            ) : (
                              <span>▼ 마스터 과정 전체 목록 보기 (+{filteredCourses.length - 6}개 더보기)</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Kanban interactive lists */}
                    <KanbanView 
                      rounds={roundsToPass}
                      courses={courses}
                      members={members}
                      showHidden={filters.showHidden}
                      onEditRound={handleOpenEditRound}
                      onCopyRound={handleCopyRound}
                      onDeleteRound={handleDeleteRound}
                      onRestoreRound={handleRestoreRound}
                      onToggleChecklistItem={handleToggleChecklistItem}
                      onCompleteRoundFlow={handleOpenCompleteRound}
                    />
                  </div>
                );
              })()}

              {activeTab === 'timeline' && (
                <TimelineView 
                  rounds={filteredRounds}
                  courses={courses}
                  members={members}
                  onEditRound={handleOpenEditRound}
                />
              )}

              {activeTab === 'rr' && (() => {
                const activeCourseIdsSet = new Set(courses.filter(c => c.is_active).map(c => c.id));
                return (
                  <RRView 
                    members={members}
                    courses={courses.filter(c => c.is_active)}
                    rounds={rounds.filter(r => r.is_active && activeCourseIdsSet.has(r.course_id))}
                  />
                );
              })()}
            </section>
          </>
        )}
      </main>

      {/* --- POPUP MODALS INSTRUCTIONS --- */}

      {/* 1. Project Management course registry Modal */}
      <CourseModal 
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
        course={selectedCourse}
        members={members}
      />

      {/* 2. Round Operations detailed items modal */}
      <RoundModal 
        isOpen={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        onSave={handleSaveRound}
        onDelete={handleDeleteRound}
        round={selectedRound}
        courses={courses.filter(c => c.is_active)}
        members={members}
      />

      {/* 3. Quick complete evaluations modal */}
      <CompleteRoundModal 
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={handleConfirmCompleteRound}
        round={roundToComplete}
      />

      {/* 4. Staff Registry control list Modal */}
      <MemberModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={members}
        onRefreshMembers={loadData}
      />

      {/* Footnote */}
      <footer className="py-6 border-t border-slate-200 mt-12 bg-white text-center text-[10px] text-slate-400 font-mono">
        HRI Project & detailed course scheduling portal © 현대경제연구원 스마트 디렉터 인터페이스 v4.5
      </footer>
    </div>
  );
}
