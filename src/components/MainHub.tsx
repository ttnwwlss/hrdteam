import React, { useState } from 'react';
import { 
  ArrowRight, Plus, Search, LayoutGrid, Calendar, UserCheck, 
  History, Users, Sparkles, TrendingUp, Compass, BookOpen, 
  CheckCircle2, BookmarkCheck, CalendarClock, MapPin, FileText, 
  PlusCircle, Link, Trash2, ExternalLink, HelpCircle, Briefcase, FileSignature,
  Activity
} from 'lucide-react';
import { Course } from '../services/courseService';
import { Round } from '../services/roundService';
import { Member } from '../services/memberService';
import { formatCount, formatSatisfaction } from '../utils/formatUtils';

interface PortalResource {
  id: string;
  title: string;
  description: string;
  category: 'manual' | 'site' | 'other';
  url: string;
  iconName: 'BookOpen' | 'Link' | 'FileText' | 'TrendingUp';
}

const DEFAULT_RESOURCES: PortalResource[] = [
  {
    id: 'res-1',
    title: 'HRI 현장 대응 매뉴얼 (v2.5)',
    description: '빔 프로젝터 연동 사전 체크, 다과 배치 가이드라인, 돌발 장애 복구 요령',
    category: 'manual',
    url: '#',
    iconName: 'BookOpen'
  },
  {
    id: 'res-2',
    title: '동반 강사 사전 소통 매뉴얼',
    description: '현대차 마북 캠퍼스 연수 수칙 준수, 위탁 교안 양식 검수 및 고객 요청 교정본 통합 요령',
    category: 'manual',
    url: '#',
    iconName: 'FileText'
  },
  {
    id: 'res-3',
    title: '현대차 교육포털 (가동 현황 연동)',
    description: '고객사 측 수강생 명부 다운로드 및 일자별 출석 전송용 기업 연동 포털',
    category: 'site',
    url: 'https://edu.hyundai.com',
    iconName: 'Link'
  },
  {
    id: 'res-4',
    title: 'HRI 실시간 만족도 설문 대시보드',
    description: '수료식 15분 전 배포하는 QR코드 기반 통계 조회 페이지',
    category: 'site',
    url: 'https://poll.hri.co.kr',
    iconName: 'TrendingUp'
  }
];

interface MainHubProps {
  courses: Course[];
  rounds: Round[];
  members: Member[];
  onNavigateToTab: (tab: 'kanban' | 'timeline' | 'rr' | 'logs') => void;
  onOpenCreateProject: () => void;
  onOpenCreateRound: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onRestoreCourse: (courseId: string) => void;
  onEditRound: (round: Round) => void;
}

export const MainHub: React.FC<MainHubProps> = ({
  courses,
  rounds,
  members,
  onNavigateToTab,
  onOpenCreateProject,
  onOpenCreateRound,
  onEditCourse,
  onDeleteCourse,
  onRestoreCourse,
  onEditRound,
}) => {
  const [courseSearch, setCourseSearch] = useState('');
  
  // Dynamic resource bookmarker state stored in LocalStorage for extensibility
  const [resources, setResources] = useState<PortalResource[]>(() => {
    const saved = localStorage.getItem('hri_portal_resources');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_RESOURCES; }
    }
    return DEFAULT_RESOURCES;
  });

  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResDesc, setNewResDesc] = useState('');
  const [newResCategory, setNewResCategory] = useState<'manual' | 'site' | 'other'>('manual');
  const [newResUrl, setNewResUrl] = useState('');

  // Selected manual item to view in-page
  const [selectedViewingManual, setSelectedViewingManual] = useState<string | null>(null);

  const activeCourses = courses.filter(c => c.is_active);
  const activeCourseIdsSet = new Set(activeCourses.map(c => c.id));
  const activeRounds = rounds.filter(r => r.is_active && activeCourseIdsSet.has(r.course_id));
  
  const currentRunningRounds = activeRounds.filter(r => ['준비중', '운영중'].includes(r.status));
  const completedRounds = activeRounds.filter(r => r.status === '완료');
  const totalTrainees = activeRounds.reduce((sum, r) => sum + (r.participants_count || 0), 0);
  
  const completedWithRating = completedRounds.filter(r => r.satisfaction > 0);
  const avgSatisfaction = completedWithRating.length > 0
    ? completedWithRating.reduce((sum, r) => sum + r.satisfaction, 0) / completedWithRating.length
    : 0;

  // Search filtered courses
  const filteredCoursesInHub = activeCourses.filter(c => 
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.type.toLowerCase().includes(courseSearch.toLowerCase())
  );

  // Filter rounds for "This Week's Projects" (주간 파견 및 현장 운영 일정)
  // Mock current time is centered around 2026-06-01 (Monday)
  const getRoundsThisWeek = () => {
    const weekStart = '2026-06-01';
    const weekEnd = '2026-06-07';
    return activeRounds.filter(r => {
      const s = r.start_date || '';
      const e = r.end_date || s;
      if (!s) return false;
      // Overlaps target week 
      return s <= weekEnd && e >= weekStart;
    });
  };

  const roundsThisWeek = getRoundsThisWeek();

  // Auxiliary Active Backlog (준비중 / 운영중, but not running in this week) for broader view
  const overflowActiveRounds = currentRunningRounds.filter(
    r => !roundsThisWeek.map(w => w.id).includes(r.id)
  );

  const getMemberName = (id?: string | null) => {
    if (!id) return '';
    const match = members.find(m => m.id === id);
    return match ? match.name : '';
  };

  const getMultiSupportNames = (round: any) => {
    const names = [];
    if (round.operator_support_id) names.push(getMemberName(round.operator_support_id));
    if (round.operator_field_id) names.push(getMemberName(round.operator_field_id));
    return names.filter(Boolean).join(', ') || '미지정';
  };

  const getMemberRoleTranslated = (id?: string | null) => {
    if (!id) return '';
    const match = members.find(m => m.id === id);
    if (!match) return '';
    switch (match.role) {
      case 'sales': return '사업PM';
      case 'pm': return '운영PM';
      case 'pl': return '운영PL';
      case 'support': return '운영보조';
      case 'field': return '운영보조';
      default: return match.role.toUpperCase();
    }
  };

  const getCourseName = (courseId: string) => {
    const found = courses.find(c => c.id === courseId);
    return found ? found.name : '개설 프로젝트';
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim()) return;
    
    const newItem: PortalResource = {
      id: 'res_' + Math.random().toString(36).substr(2, 9),
      title: newResTitle.trim(),
      description: newResDesc.trim() || '추가된 실무 참고 가이드',
      category: newResCategory,
      url: newResUrl.trim().startsWith('http') ? newResUrl.trim() : '#' + newResUrl.trim(),
      iconName: newResCategory === 'manual' ? 'BookOpen' : 'Link'
    };

    const updated = [...resources, newItem];
    setResources(updated);
    localStorage.setItem('hri_portal_resources', JSON.stringify(updated));
    setNewResTitle('');
    setNewResDesc('');
    setNewResUrl('');
    setIsAddResourceOpen(false);
  };

  const handleDeleteResource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = resources.filter(r => r.id !== id);
    setResources(updated);
    localStorage.setItem('hri_portal_resources', JSON.stringify(updated));
    if (selectedViewingManual === id) {
      setSelectedViewingManual(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="hri-main-hub-portal">
      
      {/* 1. Welcome Greeting / Hero Section */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>HRI 스마트 스케쥴러 & 파견 종합 허브</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#191f28] leading-tight tracking-tight">
            현대경제연구원 HRD사업팀
          </h1>
          <p className="text-xs sm:text-sm text-[#4e5968] font-medium leading-relaxed">
            오늘도 화이팅✨
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2.5 shrink-0 w-full md:w-auto">
          <button
            id="hub-btn-new-course"
            onClick={onOpenCreateProject}
            className="flex-1 md:flex-initial px-5 py-3 bg-[#f2f4f6] text-[#4e5968] hover:bg-slate-200 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>새 마스터 프로젝트(과정) 등록</span>
          </button>
          <button
            id="hub-btn-new-round"
            onClick={onOpenCreateRound}
            className="flex-1 md:flex-initial px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>+ 세부 차수 정보 등록</span>
          </button>
        </div>
      </div>

      {/* 2. 이번 주 프로젝트 운영 및 현장 파견 현황 (REQUESTED WORK) */}
      <div className="space-y-4" id="weekly-dispatch-board-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-1.5 bg-rose-600 rounded-full" />
            <h2 className="text-base font-black text-[#191f28]">이번 주 프로젝트 운영 및 현지 파견 현황</h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full font-mono">
              6월 첫째 주 : 2026-06-01 ~ 2026-06-07
            </span>
          </div>
          <button
            onClick={() => onNavigateToTab('timeline')}
            className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
          >
            월간 일정 캘린더 보기
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {roundsThisWeek.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roundsThisWeek.map(round => {
              const totalChks = round.checklist?.length || 0;
              const complChks = round.checklist?.filter(c => c.completed).length || 0;
              const progress = totalChks > 0 ? Math.round((complChks / totalChks) * 100) : 0;
              const supportNames = getMultiSupportNames(round);

              return (
                <div 
                  key={round.id}
                  className="bg-white rounded-2xl p-5 border border-slate-150 flex flex-col justify-between hover:shadow-md hover:border-rose-300 transition-all group"
                >
                  <div className="space-y-3.5">
                    {/* Header tags */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black tracking-tight px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                        {round.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 font-semibold">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-300" />
                        {round.start_date} ~ {round.end_date || round.start_date}
                      </span>
                    </div>

                    {/* Titles */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold tracking-tight truncate">
                        {getCourseName(round.course_id)}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                        {round.name}
                      </h3>
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-1 text-[11px] text-[#4e5968] font-medium bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{round.location || '미정 (본사 운영)'}</span>
                    </div>

                    {/* Dispatched Operator Cards */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-400 font-bold">• 배치된 운영보조</span>
                        <span className={`font-bold ${supportNames !== '미지정' ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {supportNames}
                        </span>
                      </div>
                    </div>

                    {/* Progress representation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>체크리스트 완비율</span>
                        <span>{complChks}/{totalChks} ({progress}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">파견 운영 권한 프로젝트 설정</span>
                    <button
                      onClick={() => onEditRound(round)}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                    >
                      상세&파견 조율
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
            <Briefcase className="h-8 w-8 text-slate-350 mx-auto" />
            <p className="font-bold">이번 주 (6월 첫째 주) 예정된 공식 실무 파견 및 운영 실수가 비어 있습니다.</p>
            <p className="text-[10px] text-slate-350">신규 세부 차수를 등록하거나 아래의 임시 운영 백로그에서 일정을 수정해 보세요!</p>
          </div>
        )}
      </div>

      {/* 3. 오픈형 실무 자료실 & 퀵 가이드 (Living Expandable Knowledge Hub - REQUESTED WORK) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="living-knowledge-launchpad">
        
        {/* Left Column: Knowledge Space Directory (Extensible & Living UI) */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-150 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 bg-[#fef2f2] text-rose-600 rounded-xl">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-black text-[#191f28] text-sm">오픈형 HRD 실무 자료실 및 유관 리포지토리</h3>
                  <p className="text-[11px] text-[#4e5968] font-medium">자유롭게 새로운 운영 매뉴얼 안내 페이지나 유관 기관 사이트 북마크를 편하게 추가하며 개발해나가는 공간입니다.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddResourceOpen(!isAddResourceOpen)}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-[10px] font-extrabold flex items-center space-x-1 cursor-pointer transition shrink-0"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{isAddResourceOpen ? '닫기' : '자료/링크 추가'}</span>
              </button>
            </div>

            {/* Inline dynamic adder form */}
            {isAddResourceOpen && (
              <form onSubmit={handleAddResource} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 animate-fade-in">
                <div className="font-bold text-slate-700 text-[11px]">📝 새 교육 참고 자료 / 매뉴얼 등록</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">대분류 분류</label>
                    <select
                      value={newResCategory}
                      onChange={(e) => setNewResCategory(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="manual">📚 운영 매뉴얼 & 절차 가이드</option>
                      <option value="site">🔗 유관 공식 연동 시스템 (사이트)</option>
                      <option value="other">📋 기타 서약서 및 교육 양식</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">참고 제목 / 사이트 명칭</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 현대차 역량 평가 피드백 양식 가이드"
                      value={newResTitle}
                      onChange={(e) => setNewResTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">비고 설명 (상세 가이드 요약)</label>
                  <input
                    type="text"
                    placeholder="참여자 배포 시 가동해야 하는 세부 사항 설명이나 용도를 적어주세요."
                    value={newResDesc}
                    onChange={(e) => setNewResDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">이동할 공식 URL 링크 주소 (선택)</label>
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={newResUrl}
                      onChange={(e) => setNewResUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-850"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.8 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold cursor-pointer transition w-full text-center"
                  >
                    등록 저장하기
                  </button>
                </div>
              </form>
            )}

            {/* List with segmented resources */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category A: 매뉴얼 가이드 */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-rose-900 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md w-max border border-rose-100">
                  <span>📚 실무 운영 가이드북 & 매뉴얼</span>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {resources.filter(r => r.category === 'manual').map(r => (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedViewingManual(selectedViewingManual === r.id ? null : r.id)}
                      className={`p-3 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                        selectedViewingManual === r.id 
                          ? 'bg-rose-50/50 border-rose-350 shadow-2xs' 
                          : 'bg-slate-50 hover:bg-slate-100/75 border-slate-150'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs text-slate-950 pr-4">{r.title}</h4>
                          <button
                            onClick={(e) => handleDeleteResource(r.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#4e5968] font-medium leading-relaxed">{r.description}</p>
                      </div>

                      {/* Manual mock interactive expansion content */}
                      {selectedViewingManual === r.id && (
                        <div className="mt-3 pt-3 border-t border-rose-200/50 text-[10px] text-slate-600 bg-white/70 p-2.5 rounded-lg space-y-1.5 leading-relaxed font-medium">
                          <div className="font-bold text-rose-800">📋 현장 가동 핵심 필수 점검 과업:</div>
                          <div>1. 연수 희망 교안은 전 영업일 18시 전까지 메인 강사에 전달 완료할 것</div>
                          <div>2. 현대차 사내 유선망 연동 및 원격 마우스 어시스턴트 프로그램 작동 확인</div>
                          <div>3. 다과 소요 가이드라인: 참여 인원 기준 1.5배의 가온/상온 보온 장치 세팅</div>
                          <div className="text-[9px] text-rose-600 italic">★ HRI 클라우드에서 배정한 파견 현장운영자에게 해당 지침이 기본 연동됩니다.</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category B: 유관 공식 제후 포털 */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-blue-900 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md w-max border border-blue-100">
                  <span>🔗 유관 외부 시스템 & 설문 사이트</span>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {resources.filter(r => r.category !== 'manual').map(r => (
                    <a 
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-150 block transition-all group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs text-slate-950 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                            <span>{r.title}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-blue-500 shrink-0" />
                          </h4>
                          <button
                            onClick={(e) => handleDeleteResource(r.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#4e5968] font-medium leading-relaxed">{r.description}</p>
                      </div>
                    </a>
                  ))}
                  {resources.filter(r => r.category !== 'manual').length === 0 && (
                    <div className="text-center py-8 text-[11px] italic text-slate-400 border border-dashed rounded-xl bg-slate-50/40">
                      등록된 공식 사이트 북마크가 없습니다.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#8b95a1] font-semibold">
            <span>💡 팁: 등록된 매뉴얼이나 사이트를 클릭하면 상세 가이드를 현장 실무자와 실시간 교환할 수 있습니다.</span>
            <span className="text-rose-600 font-bold">오픈 리포지토리 활성화 중</span>
          </div>
        </div>

        {/* Right Column: Mini Interactive Help & Schedule Health */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[24px] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background graphic */}
          <div className="absolute right-0 top-0 h-40 w-40 bg-rose-600 rounded-full blur-[100px] opacity-10 pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20 uppercase tracking-widest font-mono">
                System Guide
              </span>
              <HelpCircle className="h-4.5 w-4.5 text-slate-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                현장실무자 파견 & R&R 스케쥴링 수칙
              </h3>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                HRI 스케쥴러는 고정된 부서 역할에 얽매이지 않고, **모든 팀원을 유기적으로 현장 PM 및 운영지원에 배치**할 수 있습니다.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-[10px] text-slate-300 font-medium leading-relaxed">
              <div className="flex items-start space-x-1.5">
                <span className="text-rose-500 font-bold">①</span>
                <span>세부 차수 편집 창에서 **현장운영자**와 **운영지원** 배정 목록을 누르면 수습 및 R&R 매핑 상태를 한 눈에 교정 가능합니다.</span>
              </div>
              <div className="flex items-start space-x-1.5">
                <span className="text-rose-500 font-bold">②</span>
                <span>상단 탭의 **팀원 관리(R&R)**에서 구성원의 총 누적 가동률과 체크리스트 잔여 현황을 직관적으로 조망하세요.</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-center">
            <button 
              onClick={() => onNavigateToTab('rr')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <span>팀원 및 배정인력 R&R 상황부 가기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. Toss-style Stats summary widgets */}
      <h3 className="text-sm font-black text-[#191f28] flex items-center space-x-2 pt-2">
        <Activity className="h-4 w-4 text-rose-500" />
        <span>실시간 총합 운영 현황 요약</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="toss-metrics-grid">
        
        <div className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400">가동 진행 중인 교육 차수</div>
            <div className="text-2xl font-black text-slate-950 mt-1">
              {currentRunningRounds.length}<span className="text-xs font-bold text-slate-400 ml-1">/{activeRounds.length}개</span>
            </div>
            <p className="text-[10px] text-[#4e5968] font-medium pt-1">
              준비중 및 기획 운영 단계
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] text-[#8b95a1] font-mono">가용 스케쥴링 실시간</span>
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400">누적 수료 훈련생 수</div>
            <div className="text-2xl font-black text-slate-950 mt-1">
              {formatCount(totalTrainees)}<span className="text-xs font-bold text-slate-400 ml-1">명</span>
            </div>
            <p className="text-[10px] text-[#4e5968] font-medium pt-1">
              위탁 및 초빙 세미나 누적
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">수료 수치 안정</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400">종합 만족도 결산</div>
            <div className="text-2xl font-black text-slate-950 mt-1">
              {formatSatisfaction(avgSatisfaction)}<span className="text-xs font-bold text-slate-400 ml-1">/ 5.0</span>
            </div>
            <p className="text-[10.5px] text-rose-600 font-extrabold pt-1">
              HRI 프리미엄 기준치 4.5 상선
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-mono">수료 설문 {completedRounds.length}건 수렴</span>
            <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400">등록 실무 협력원 수</div>
            <div className="text-2xl font-black text-slate-950 mt-1">
              {members.length}<span className="text-xs font-bold text-slate-400 ml-1">인</span>
            </div>
            <p className="text-[10px] text-[#4e5968] font-medium pt-1">
              파견 후보 매니저 풀 완비
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">R&R 매트릭스 결선</span>
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          </div>
        </div>

      </div>

      {/* 5. Bento Grid Quick link panels */}
      <h3 className="text-sm font-black text-[#191f28] flex items-center space-x-2 pt-2">
        <LayoutGrid className="h-4 w-4 text-rose-500" />
        <span>HRI 스마트 주요 업무 바로가기</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="hub-bento-grid">
        
        {/* Module Area A: Kanban Workspace Board */}
        <div 
          onClick={() => onNavigateToTab('kanban')}
          className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-150 flex flex-col justify-between hover:border-rose-400 cursor-pointer transition-all group overflow-hidden relative"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest font-mono">KANBAN WORKSPACE</span>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#191f28] group-hover:text-rose-600 transition-colors">
                단계별 보드 (스마트 모니터링)
              </h3>
              <p className="text-xs text-[#4e5968] leading-relaxed font-medium">
                기획중 ➔ 준비중 ➔ 운영중 ➔ 완료로 순환되는 핵심 추진 과정을 칸반 형태로 조율하고 체크리스트 현황을 확인합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
            <span>워크스페이스 바로 진입하기</span>
            <div className="h-7 w-7 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Module Area B: Timeline view */}
        <div 
          onClick={() => onNavigateToTab('timeline')}
          className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-150 flex flex-col justify-between hover:border-blue-400 cursor-pointer transition-all group overflow-hidden relative"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">TIMELINE CALENDAR</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#191f28] group-hover:text-blue-600 transition-colors">
                월별 타임라인 & 캘린더
              </h3>
              <p className="text-xs text-[#4e5968] leading-relaxed font-medium">
                캘린더 느낌의 인터랙티브 달력 그리드와 일자 디테일 분석을 통해 누수와 겹침 없이 파견자들의 일정을 계획합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>캘린더형 스케쥴러 보기</span>
            <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Module Area C: Members Staff R&R Matrix */}
        <div 
          onClick={() => onNavigateToTab('rr')}
          className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-150 flex flex-col justify-between hover:border-emerald-400 cursor-pointer transition-all group overflow-hidden relative"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-mono">R&R MATRICES</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#191f28] group-hover:text-emerald-600 transition-colors">
                팀원 업무 로드 & 역할 배정 상황
              </h3>
              <p className="text-xs text-[#4e5968] leading-relaxed font-medium">
                소속 매니저의 활성 가중 업무 분배량, 누적 파견 이력, 일 평균 운영 등록 수량을 점검하여 과부하를 예방합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>인력 가용 스탯상황부 보기</span>
            <div className="h-7 w-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

      </div>

      {/* 6. Master Projects General Catalog (Searchable lookup repository) */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-150">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-slate-700">
                <FileSignature className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#191f28]">
                  설계 마스터 프로젝트 등록 전체 목록
                </h3>
                <p className="text-[11px] text-[#4e5968] font-medium leading-relaxed">
                  개설된 전방 종합 프로젝트명을 조회하고, 세부 담당 매니저(PM, PL, 영업)를 조율 및 연동합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="마스터 과정 프로젝트명 직접 통합 검색... (예: 현대자동차, 신입사원)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-450 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {/* Live list mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1" id="hub-courses-list">
            {filteredCoursesInHub.map(c => {
              const subRoundsCount = rounds.filter(r => r.course_id === c.id && r.is_active).length;
              return (
                <div key={c.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl flex items-center justify-between transition gap-2">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0 uppercase font-mono">
                      {c.type}
                    </span>
                    <span className="text-xs font-bold text-[#191f28] truncate" title={c.name}>
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-extrabold">{subRoundsCount}개 차수 연동됨</span>
                    <button
                      onClick={() => onEditCourse(c)}
                      className="px-2.5 py-1 text-[10px] font-extrabold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer shadow-2xs"
                    >
                      기획 수정
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredCoursesInHub.length === 0 && (
              <div className="text-center py-8 text-[11px] text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed col-span-2">
                조사 기준에 부합하는 등록 마스터 과정이 발견되지 않았습니다.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
