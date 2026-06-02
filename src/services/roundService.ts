import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { logService } from './logService';
import { DEFAULT_ROUND_CHECKLIST } from '../utils/constants';
import { memberService, DEFAULT_MEMBERS } from './memberService';
import { courseService, DEFAULT_COURSES } from './courseService';

export interface RoundChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Round {
  id: string;
  course_id: string;
  round_no: number; // Internal DB number (unique per course)
  name: string;
  status: '기획중' | '준비중' | '운영중' | '완료' | '보류' | '취소';
  location?: string;
  operator_support_id?: string; // (하위 호환성용)
  operator_field_id?: string;   // (하위 호환성용)
  operator_support_ids?: string[]; // 다중 운영보조 member ids
  memo?: string;
  
  // Operating Metrics (reset or nullified on copy/add)
  participants_count: number;
  satisfaction: number;
  completed_at?: string;
  start_date?: string;
  end_date?: string;
  
  checklist: RoundChecklistItem[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_ROUNDS: Round[] = [
  {
    id: 'r1',
    course_id: 'c1',
    round_no: 1,
    name: '1차수 - 소통 및 성과 관리 워크숍',
    status: '운영중',
    location: '현대차 원효로 연수원 401호',
    operator_support_id: 'm4',
    operator_field_id: 'm5',
    operator_support_ids: ['m4', 'm5'],
    memo: '참석자 리더십 사전 진단 결과 지참 필요.',
    participants_count: 0,
    satisfaction: 0.0,
    start_date: '2026-06-01',
    end_date: '2026-06-03',
    checklist: DEFAULT_ROUND_CHECKLIST.map((item, i) => 
      i < 2 ? { ...item, completed: true } : item
    ),
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'r2',
    course_id: 'c1',
    round_no: 2,
    name: '2차수 - 의사결정 시뮬레이션 및 퍼실리테이션',
    status: '준비중',
    location: '현대차 마북 캠퍼스 미래홀',
    operator_support_id: 'm4',
    operator_field_id: 'm5',
    operator_support_ids: ['m4'],
    memo: '퍼실리테이션 외부 전문 강사 교재 조율중.',
    participants_count: 0,
    satisfaction: 0.0,
    start_date: '2026-06-15',
    end_date: '2026-06-17',
    checklist: DEFAULT_ROUND_CHECKLIST,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'r3',
    course_id: 'c1',
    round_no: 3,
    name: '3차수 - 테크 리더의 코칭 및 피드백 실천',
    status: '기획중',
    location: '현대차 아산 교육장',
    operator_support_id: 'm4',
    operator_field_id: 'm5',
    operator_support_ids: ['m4', 'm5'],
    participants_count: 0,
    satisfaction: 0.0,
    checklist: DEFAULT_ROUND_CHECKLIST,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'r4',
    course_id: 'c2',
    round_no: 1,
    name: '1차수 - 데이터 및 AI 비즈니스 인사이트',
    status: '완료',
    location: 'SK 서린동 사옥 미래에너지 센터',
    operator_support_id: 'm4',
    operator_field_id: 'm5',
    operator_support_ids: ['m4', 'm5'],
    memo: '만족도 조사 결과 주관식 응답 호평 많음.',
    participants_count: 24,
    satisfaction: 4.88,
    completed_at: '2026-05-25',
    start_date: '2026-05-23',
    end_date: '2026-05-25',
    checklist: DEFAULT_ROUND_CHECKLIST.map(item => ({ ...item, completed: true })),
    is_active: true,
    created_at: new Date(Date.now() - 3600 * 24 * 10 * 1000).toISOString()
  },
  {
    id: 'r5',
    course_id: 'c2',
    round_no: 2,
    name: '2차수 - 분석 모델 설계 및 머신러닝 기초',
    status: '운영중',
    location: 'SK u-타워 메타버스 세미나실',
    operator_support_id: 'm4',
    operator_field_id: 'm5',
    operator_support_ids: ['m4'],
    memo: '노트북 및 클라우드 실습 환경 사전 세팅 확인.',
    participants_count: 0,
    satisfaction: 0,
    start_date: '2026-06-10',
    end_date: '2026-06-12',
    checklist: DEFAULT_ROUND_CHECKLIST.map((item, i) => 
      i < 4 ? { ...item, completed: true } : item
    ),
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'r6',
    course_id: 'c3',
    round_no: 1,
    name: '1차수 - 글로벌 가치 체인과 HR 트렌드',
    status: '준비중',
    location: '삼성인력개발원 창조관',
    operator_support_id: 'm4',
    operator_field_id: 'm3',
    operator_support_ids: ['m4', 'm3'],
    memo: '영문 레퍼런스 가독성 사전 검수 요청 접수.',
    participants_count: 0,
    satisfaction: 0.0,
    checklist: DEFAULT_ROUND_CHECKLIST,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

function getLocalRounds(): Round[] {
  const data = localStorage.getItem('hri_rounds');
  if (!data) {
    localStorage.setItem('hri_rounds', JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
}

function saveLocalRounds(rounds: Round[]) {
  localStorage.setItem('hri_rounds', JSON.stringify(rounds));
}

export const roundService = {
  async getRounds(): Promise<Round[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .select('*')
          .eq('is_active', true)
          .order('round_no', { ascending: true });
        
        if (error) throw error;
        if (!data || data.length === 0) {
          return [];
        }
        return (data as any[]).map(r => ({
          ...r,
          operator_support_ids: [r.operator_support_id, r.operator_field_id].filter(Boolean)
        })) as Round[];
      } catch (err) {
        console.error('Supabase getRounds error, fallback:', err);
        return getLocalRounds().filter(r => r.is_active);
      }
    } else {
      return getLocalRounds().filter(r => r.is_active);
    }
  },

  async getAllRoundsIncludingHidden(): Promise<Round[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .select('*')
          .order('round_no', { ascending: true });
        if (error) throw error;
        return (data as any[]).map(r => ({
          ...r,
          operator_support_ids: [r.operator_support_id, r.operator_field_id].filter(Boolean)
        })) as Round[];
      } catch (err) {
        return getLocalRounds();
      }
    } else {
      return getLocalRounds();
    }
  },

  async getRoundsByCourseId(courseId: string): Promise<Round[]> {
    const list = await this.getRounds();
    return list.filter(r => r.course_id === courseId);
  },

  async getRoundById(id: string): Promise<Round | null> {
    const list = await this.getAllRoundsIncludingHidden();
    return list.find(r => r.id === id) || null;
  },

  async generateNextRoundNo(courseId: string): Promise<number> {
    const list = await this.getAllRoundsIncludingHidden();
    const roundsForCourse = list.filter(r => r.course_id === courseId);
    if (roundsForCourse.length === 0) return 1;
    const maxNo = Math.max(...roundsForCourse.map(r => r.round_no));
    return maxNo + 1;
  },

  async createRound(round: Omit<Round, 'id' | 'round_no' | 'is_active'>): Promise<Round> {
    const nextRoundNo = await this.generateNextRoundNo(round.course_id);
    
    const newRound: Round = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'round_' + Math.random().toString(36).substr(2, 9),
      ...round,
      round_no: nextRoundNo,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const roundPayload = { ...round };
    delete (roundPayload as any).operator_support_ids;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .insert([{
            course_id: roundPayload.course_id,
            round_no: nextRoundNo,
            name: roundPayload.name,
            status: roundPayload.status,
            location: roundPayload.location || null,
            operator_support_id: roundPayload.operator_support_id || null,
            operator_field_id: roundPayload.operator_field_id || null,
            memo: roundPayload.memo || null,
            participants_count: roundPayload.participants_count || 0,
            satisfaction: roundPayload.satisfaction || 0,
            completed_at: roundPayload.completed_at || null,
            start_date: roundPayload.start_date || null,
            end_date: roundPayload.end_date || null,
            checklist: roundPayload.checklist,
            is_active: true
          }])
          .select()
          .single();
        if (error) throw error;
        
        const returnedRound = {
          ...data,
          operator_support_ids: [data.operator_support_id, data.operator_field_id].filter(Boolean)
        } as Round;
        await logService.logAction('round', returnedRound.id, returnedRound.name, 'create', `세부 과정 "${returnedRound.name}" 신규 추가 (라운드 번호: ${nextRoundNo})`);
        return returnedRound;
      } catch (err) {
        console.error('Supabase createRound error, local mode:', err);
      }
    }

    const current = getLocalRounds();
    current.push(newRound);
    saveLocalRounds(current);

    await logService.logAction('round', newRound.id, newRound.name, 'create', `세부 과정 "${newRound.name}" 신규 추가 (라운드 번호: ${nextRoundNo})`);
    return newRound;
  },

  async updateRound(id: string, updates: Partial<Omit<Round, 'id'>>): Promise<Round> {
    const original = await this.getRoundById(id);
    const origName = original?.name || '세부 과정';

    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.operator_support_id === '') sanitizedUpdates.operator_support_id = null;
    if (sanitizedUpdates.operator_field_id === '') sanitizedUpdates.operator_field_id = null;
    delete (sanitizedUpdates as any).operator_support_ids; // Ensure we never send this to DB!

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        
        let summaryParts = [];
        if (updates.name && updates.name !== original?.name) summaryParts.push(`명칭 변경`);
        if (updates.status && updates.status !== original?.status) summaryParts.push(`단계 변경(${original?.status} ➔ ${updates.status})`);
        if (updates.checklist) summaryParts.push(`체크리스트 상태 변경`);
        if (updates.satisfaction !== undefined || updates.participants_count !== undefined) summaryParts.push(`운영 실적/피드백 정보 갱신`);
        
        const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '정보 보완';
        const returnedRound = {
          ...data,
          operator_support_ids: [data.operator_support_id, data.operator_field_id].filter(Boolean)
        } as Round;
        await logService.logAction('round', id, returnedRound.name, 'update', `세부 과정 수정: ${summary}`);
        return returnedRound;
      } catch (err) {
        console.error('Supabase updateRound error, local mode:', err);
      }
    }

    const current = getLocalRounds();
    const idx = current.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Round not found');

    current[idx] = {
      ...current[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalRounds(current);

    let summaryParts = [];
    if (updates.name && updates.name !== original?.name) summaryParts.push(`명칭 변경`);
    if (updates.status && updates.status !== original?.status) summaryParts.push(`단계 변경(${original?.status} ➔ ${updates.status})`);
    if (updates.checklist) summaryParts.push(`체크리스트 상태 변경`);
    if (updates.satisfaction !== undefined || updates.participants_count !== undefined) summaryParts.push(`운영 실적/피드백 정보 갱신`);
    
    const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '정보 보완';
    await logService.logAction('round', id, current[idx].name, 'update', `세부 과정 수정: ${summary}`);

    return current[idx];
  },

  async copyRound(id: string): Promise<Round> {
    const original = await this.getRoundById(id);
    if (!original) throw new Error('Original round not found');

    // Copy rules as per PRD:
    // - 복사 시 운영 실적(참여 인원, 만족도, 완료일), 일정(시작일/종료일)은 복사하지 않음 (set defaults).
    // - 복사 시 장소, 운영지원/현장운영자, 메모, 체크리스트 구성은 복사 (completed state is reset to false!).
    const nextRoundNo = await this.generateNextRoundNo(original.course_id);
    
    const copiedChecklist = original.checklist.map(item => ({
      ...item,
      completed: false // Reset checklist status on copy
    }));

    const roundDataToInsert: Omit<Round, 'id' | 'round_no' | 'is_active'> = {
      course_id: original.course_id,
      name: `${original.name} (복사본)`,
      status: '준비중', // Default start status
      location: original.location,
      operator_support_id: original.operator_support_id,
      operator_field_id: original.operator_field_id,
      operator_support_ids: original.operator_support_ids || [],
      memo: original.memo,
      participants_count: 0,
      satisfaction: 0,
      checklist: copiedChecklist
    };

    const result = await this.createRound(roundDataToInsert);
    await logService.logAction('round', result.id, result.name, 'copy', `"${original.name}" 과정 복사하여 신규 과정 생성`);
    return result;
  },

  async deleteRound(id: string): Promise<void> {
    const r = await this.getRoundById(id);
    const name = r ? r.name : '세부 과정';
    
    await this.updateRound(id, { is_active: false });
    await logService.logAction('round', id, name, 'delete', `세부 과정을 비활성화(숨김) 처리하였습니다.`);
  },

  async restoreRound(id: string): Promise<void> {
    const r = await this.getRoundById(id);
    const name = r ? r.name : '숨겨진 세부 과정';
    
    await this.updateRound(id, { is_active: true });
    await logService.logAction('round', id, name, 'restore', `숨겨졌던 세부 과정을 복원하여 다시 노출하였습니다.`);
  }
};
