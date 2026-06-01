import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, GripVertical, CheckCircle } from 'lucide-react';
import { Round, RoundChecklistItem } from '../services/roundService';
import { Course } from '../services/courseService';
import { Member } from '../services/memberService';
import { ROUND_STATUSES, DEFAULT_ROUND_CHECKLIST, REGIONS_19 } from '../utils/constants';

interface RoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (roundId: string) => void;
  round?: Round | null; // null if creating
  courses: Course[];
  members: Member[];
}

/**
 * Isolated Input Component to fully resolve the Korean IME text composition bug.
 * Keeping the state local prevents random React re-renders from breaking keyboard composition.
 */
interface ChecklistItemInputProps {
  item: RoundChecklistItem;
  onBlur: (id: string, newTitle: string) => void;
  onRemove: (id: string) => void;
}

const ChecklistItemInput: React.FC<ChecklistItemInputProps> = ({ item, onBlur, onRemove }) => {
  const [val, setVal] = useState(item.title);

  useEffect(() => {
    setVal(item.title);
  }, [item.title]);

  return (
    <div className="flex items-center space-x-2 py-1 flex-1">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onBlur(item.id, val)}
        placeholder="체크리스트 작업 명칭 입력..."
        className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
      />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const RoundModal: React.FC<RoundModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  round,
  courses,
  members
}) => {
  const [courseId, setCourseId] = useState('');
  const [courseNameInput, setCourseNameInput] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Round['status']>('준비중');
  const [region, setRegion] = useState('서울');
  const [locationDetail, setLocationDetail] = useState('');
  const [operatorSupportIds, setOperatorSupportIds] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Checklist State
  const [checklist, setChecklist] = useState<RoundChecklistItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  // Performance metrics (if editing)
  const [participantsCount, setParticipantsCount] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [completedAt, setCompletedAt] = useState('');

  useEffect(() => {
    if (round) {
      setCourseId(round.course_id);
      const parentCourse = courses.find(c => c.id === round.course_id);
      setCourseNameInput(parentCourse ? parentCourse.name : '');
      setName(round.name);
      setStatus(round.status);
      
      // Parse location into region + locationDetail
      let detectedRegion = '서울';
      let detail = '';
      if (round.location) {
        const found = REGIONS_19.find(r => round.location?.startsWith(r));
        if (found) {
          detectedRegion = found;
          detail = round.location.substring(found.length).replace(/^[-\s/]+/, '').trim();
        } else {
          detectedRegion = '전국';
          detail = round.location;
        }
      }
      setRegion(detectedRegion);
      setLocationDetail(detail);

      let initialAssistantIds: string[] = [];
      if (round.operator_support_ids && Array.isArray(round.operator_support_ids)) {
        initialAssistantIds = [...round.operator_support_ids];
      } else {
        if (round.operator_support_id) initialAssistantIds.push(round.operator_support_id);
        if (round.operator_field_id && !initialAssistantIds.includes(round.operator_field_id)) {
          initialAssistantIds.push(round.operator_field_id);
        }
      }
      setOperatorSupportIds(initialAssistantIds);
      setMemo(round.memo || '');
      setStartDate(round.start_date || '');
      setEndDate(round.end_date || '');
      setChecklist(round.checklist || []);
      setParticipantsCount(round.participants_count || 0);
      setSatisfaction(round.satisfaction || 0);
      setCompletedAt(round.completed_at || '');
    } else {
      const defaultCourse = courses.find(c => c.is_active);
      setCourseId(defaultCourse ? defaultCourse.id : (courses.length > 0 ? courses[0].id : ''));
      setCourseNameInput(defaultCourse ? defaultCourse.name : (courses.length > 0 ? courses[0].name : ''));
      setName('');
      setStatus('준비중');
      setRegion('서울');
      setLocationDetail('');
      setOperatorSupportIds([]);
      setMemo('');
      setStartDate('');
      setEndDate('');
      setChecklist(DEFAULT_ROUND_CHECKLIST.map(it => ({ ...it, id: 'chk_' + Math.random().toString(36).substr(2, 9) })));
      setParticipantsCount(0);
      setSatisfaction(0);
      setCompletedAt('');
    }
    setNewTodoText('');
  }, [round, isOpen, courses]);

  if (!isOpen) return null;

  const handleBlurTitle = (id: string, newTitle: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, title: newTitle };
      }
      return item;
    }));
  };

  const handleRemoveCheckItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleAddCheckListItem = () => {
    if (!newTodoText.trim()) return;
    const newItem: RoundChecklistItem = {
      id: 'chk_' + Math.random().toString(36).substr(2, 9),
      title: newTodoText.trim(),
      completed: false
    };
    setChecklist(prev => [...prev, newItem]);
    setNewTodoText('');
  };

  const handleToggleCompleted = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !courseNameInput.trim()) return;

    let targetCourseId = courseId;
    const matched = courses.find(c => c.name.trim().toLowerCase() === courseNameInput.trim().toLowerCase());
    if (matched) {
      targetCourseId = matched.id;
    } else {
      targetCourseId = 'NEW_COURSE';
    }

    const combinedLocation = locationDetail.trim() ? `${region} - ${locationDetail.trim()}` : region;

    onSave({
      course_id: targetCourseId,
      course_name_new: targetCourseId === 'NEW_COURSE' ? courseNameInput.trim() : undefined,
      name: name.trim(),
      status,
      location: combinedLocation,
      operator_support_id: operatorSupportIds[0] || null,
      operator_field_id: operatorSupportIds[1] || null,
      operator_support_ids: operatorSupportIds,
      memo: memo.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      checklist,
      participants_count: participantsCount,
      satisfaction,
      completed_at: completedAt || null
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="round-configuration-modal">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              {round ? '세부 운영 차수 정보 수정' : '신규 세부 과정 (차수) 추가'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Project Selection / Course list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="round-project-input" className="block text-[11px] font-bold text-slate-500">
                  메인 과정명 (직접 입력 및 자동완성) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="round-project-input"
                  list="course-list-datalist"
                  required
                  disabled={!!round}
                  value={courseNameInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourseNameInput(val);
                    const matched = courses.find(c => c.name.trim().toLowerCase() === val.trim().toLowerCase());
                    if (matched) {
                      setCourseId(matched.id);
                    } else {
                      setCourseId('NEW_COURSE');
                    }
                  }}
                  placeholder="과정명을 입력하거나 선택하세요..."
                  className="w-full px-2.5 py-1.8 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <datalist id="course-list-datalist">
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>
                      [{c.type}] {c.name}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label htmlFor="round-title-input" className="block text-[11px] font-bold text-slate-500">
                  세부 과정명 (예: 1차수 - 리더십 워크숍) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="round-title-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 2차수 - 성과지향 실무 피드백 교육"
                  className="w-full px-3 py-1.8 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Basic Operation Info */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label htmlFor="round-status-select" className="block text-[10px] font-bold text-slate-500">차수 단계(상태)</label>
                <select
                  id="round-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Round['status'])}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                >
                  {ROUND_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="round-region-select" className="block text-[10px] font-bold text-slate-500">지역 대분류 (19종)</label>
                <select
                  id="round-region-select"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                >
                  {REGIONS_19.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="round-loc-input" className="block text-[10px] font-bold text-slate-500">상세 장소 / 교육장 정보</label>
                <input
                  id="round-loc-input"
                  type="text"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="예: 마북 캠퍼스 미래홀, 원효로 연수원"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Staffing Allocation (Multi-Select Support operators) */}
            <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/85 text-xs">
              <label className="block text-[11px] font-bold text-slate-500">운영보조 팀원 배치 (다중 선택)</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {members.filter(m => m.role === 'support' || m.role === 'field' || m.role === 'pm' || m.role === 'pl' || m.role === 'sales').map(m => {
                  const isSelected = operatorSupportIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setOperatorSupportIds(prev => prev.filter(id => id !== m.id));
                        } else {
                          setOperatorSupportIds(prev => [...prev, m.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 border-rose-700 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.name}</span>
                      <span className={`text-[9px] font-medium ${isSelected ? 'text-rose-100' : 'text-slate-500'}`}>
                        ({getRoleLabel(m.role)})
                      </span>
                      {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
              {operatorSupportIds.length === 0 && (
                <p className="text-[10px] text-slate-400 italic">배정된 운영보조원이 없습니다. 클릭하여 다중 설정해 주세요.</p>
              )}
            </div>

            {/* Schedule Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="round-start-date" className="block text-[10px] font-bold text-slate-500">강의 시작일</label>
                <input
                  id="round-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="round-end-date" className="block text-[10px] font-bold text-slate-500">강의 종료일</label>
                <input
                  id="round-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono"
                />
              </div>
            </div>

            {/* Memo Box */}
            <div className="space-y-1">
              <label htmlFor="round-memo-input" className="block text-[11px] font-bold text-slate-500">차수 특이사항 및 중요 메모</label>
              <textarea
                id="round-memo-input"
                rows={2}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="장비 지참 리스트나 식사 조율 등 전달할 특이사항 기재"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Checklist Operations (Stable layout with isolating input list) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>차수별 운영 체크리스트 작업 지정 ({checklist.length}개 항목)</span>
                <span className="text-[9px] font-semibold text-slate-400">한글 입력이 완벽히 보호됩니다.</span>
              </h4>

              {/* Input for adding checklist items */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="새로운 운영 할 일을 입력하고 추가를 누르세요..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCheckListItem();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddCheckListItem}
                  className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition"
                >
                  <Plus className="h-3 w-3" />
                  <span>추가</span>
                </button>
              </div>

              {/* Interactive checklist array mapping */}
              <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 pt-1">
                    {/* Checkbox state */}
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(item.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer"
                    >
                      {item.completed ? (
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-slate-300" />
                      )}
                    </button>

                    {/* Highly safe sub-component targeting specific item to stop input breakdown */}
                    <ChecklistItemInput
                      item={item}
                      onBlur={handleBlurTitle}
                      onRemove={handleRemoveCheckItem}
                    />
                  </div>
                ))}

                {checklist.length === 0 && (
                  <div className="py-6 text-center text-[10px] text-slate-400 italic bg-white/50 border border-dashed rounded-lg">
                    추가된 체크 항목이 존재하지 않습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Performance metrics display (If complete) */}
            {round && status === '완료' && (
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-150 space-y-2">
                <h4 className="font-bold text-emerald-900">완료 운영 성과 지표</h4>
                <div className="grid grid-cols-2 gap-3 text-emerald-800">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500">교육 참여 인원 (명)</label>
                    <input
                      type="number"
                      value={participantsCount}
                      onChange={(e) => setParticipantsCount(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1 bg-white border border-emerald-200 rounded-lg mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500">최종 만족도 점수 (5.0 기준)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={satisfaction}
                      onChange={(e) => setSatisfaction(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1 bg-white border border-emerald-200 rounded-lg mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 font-medium">
              <div>
                {round && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(round.id);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 rounded-lg font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    <span>차수 삭제(숨김)</span>
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
