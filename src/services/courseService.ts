import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { logService } from './logService';
import { memberService, DEFAULT_MEMBERS } from './memberService';

export interface Course {
  id: string;
  name: string;
  type: '출강' | '위탁';
  manager_sales_id?: string;
  manager_pm_id?: string;
  manager_pl_id?: string;
  
  // High-level fixed checklists
  chk_proposal_plan: boolean;
  chk_proposal_confirm: boolean;
  chk_revenue_recognize: boolean;
  
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_COURSES: Course[] = [
  {
    id: 'c1',
    name: '현대자동차 테크리더 리더십 역량 강화 과정',
    type: '위탁',
    manager_sales_id: 'm1',
    manager_pm_id: 'm2',
    manager_pl_id: 'm3',
    chk_proposal_plan: true,
    chk_proposal_confirm: true,
    chk_revenue_recognize: false,
    is_active: true,
    created_at: new Date(Date.now() - 3600 * 24 * 5 * 1000).toISOString()
  },
  {
    id: 'c2',
    name: 'SK이노베이션 DX 융합 전문 아카데미',
    type: '출강',
    manager_sales_id: 'm1',
    manager_pm_id: 'm3',
    manager_pl_id: 'm2',
    chk_proposal_plan: true,
    chk_proposal_confirm: true,
    chk_revenue_recognize: true,
    is_active: true,
    created_at: new Date(Date.now() - 3600 * 24 * 10 * 1000).toISOString()
  },
  {
    id: 'c3',
    name: '삼성전자 Global HRD 핵심 실무 역량 향상 과정',
    type: '위탁',
    manager_sales_id: 'm2',
    manager_pm_id: 'm1',
    manager_pl_id: 'm3',
    chk_proposal_plan: true,
    chk_proposal_confirm: false,
    chk_revenue_recognize: false,
    is_active: true,
    created_at: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString()
  }
];

function getLocalCourses(): Course[] {
  const data = localStorage.getItem('hri_courses');
  if (!data) {
    localStorage.setItem('hri_courses', JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
}

function saveLocalCourses(courses: Course[]) {
  localStorage.setItem('hri_courses', JSON.stringify(courses));
}

export const courseService = {
  async getCourses(): Promise<Course[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data || data.length === 0) {
          return [];
        }
        return data as Course[];
      } catch (err) {
        console.error('Supabase getCourses error, falling back to local:', err);
        return getLocalCourses().filter(c => c.is_active);
      }
    } else {
      return getLocalCourses().filter(c => c.is_active);
    }
  },

  async getAllCoursesIncludingHidden(): Promise<Course[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Course[];
      } catch (err) {
        return getLocalCourses();
      }
    } else {
      return getLocalCourses();
    }
  },

  async getCourseById(id: string): Promise<Course | null> {
    const list = await this.getAllCoursesIncludingHidden();
    return list.find(c => c.id === id) || null;
  },

  async createCourse(course: Omit<Course, 'id' | 'is_active' | 'chk_proposal_plan' | 'chk_proposal_confirm' | 'chk_revenue_recognize'>): Promise<Course> {
    const newCourse: Course = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'course_' + Math.random().toString(36).substr(2, 9),
      ...course,
      chk_proposal_plan: false,
      chk_proposal_confirm: false,
      chk_revenue_recognize: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .insert([{
            name: course.name,
            type: course.type,
            manager_sales_id: course.manager_sales_id || null,
            manager_pm_id: course.manager_pm_id || null,
            manager_pl_id: course.manager_pl_id || null,
            chk_proposal_plan: false,
            chk_proposal_confirm: false,
            chk_revenue_recognize: false,
            is_active: true
          }])
          .select()
          .single();
        if (error) throw error;
        
        await logService.logAction('project', data.id, data.name, 'create', `신규 프로젝트 "${data.name}"(유형: ${data.type}) 등록 완료`);
        return data as Course;
      } catch (err) {
        console.error('Supabase createCourse error, using local:', err);
      }
    }

    const current = getLocalCourses();
    current.push(newCourse);
    saveLocalCourses(current);
    
    await logService.logAction('project', newCourse.id, newCourse.name, 'create', `신규 프로젝트 "${newCourse.name}"(유형: ${newCourse.type}) 등록 완료`);
    return newCourse;
  },

  async updateCourse(id: string, updates: Partial<Omit<Course, 'id'>>): Promise<Course> {
    const original = await this.getCourseById(id);
    const origName = original?.name || '공통 과정';

    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.manager_sales_id === '') sanitizedUpdates.manager_sales_id = null;
    if (sanitizedUpdates.manager_pm_id === '') sanitizedUpdates.manager_pm_id = null;
    if (sanitizedUpdates.manager_pl_id === '') sanitizedUpdates.manager_pl_id = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        
        let summaryParts = [];
        if (updates.name && updates.name !== original?.name) summaryParts.push(`명칭 변경(${original?.name} ➔ ${updates.name})`);
        if (updates.type) summaryParts.push(`유형 변경(${updates.type})`);
        if (updates.manager_sales_id !== undefined || updates.manager_pm_id !== undefined || updates.manager_pl_id !== undefined) summaryParts.push(`담당자 정보 업데이트`);
        
        const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '기본 정보 수정';
        await logService.logAction('project', id, data.name, 'update', `프로젝트 수정: ${summary}`);
        return data as Course;
      } catch (err) {
        console.error('Supabase updateCourse error, using local:', err);
      }
    }

    const current = getLocalCourses();
    const idx = current.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Course not found');
    
    current[idx] = {
      ...current[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalCourses(current);

    let summaryParts = [];
    if (updates.name && updates.name !== original?.name) summaryParts.push(`명칭 변경(${original?.name} ➔ ${updates.name})`);
    if (updates.type) summaryParts.push(`유형 변경(${updates.type})`);
    if (updates.manager_sales_id !== undefined || updates.manager_pm_id !== undefined || updates.manager_pl_id !== undefined) summaryParts.push(`담당자 정보 업데이트`);
    
    const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '기본 정보 수정';
    await logService.logAction('project', id, current[idx].name, 'update', `프로젝트 수정: ${summary}`);

    return current[idx];
  },

  async deleteCourse(id: string): Promise<void> {
    const c = await this.getCourseById(id);
    const name = c ? c.name : '알 수 없는 프로젝트';
    
    await this.updateCourse(id, { is_active: false });
    await logService.logAction('project', id, name, 'delete', `프로젝트를 숨김(비활성화) 처리하였습니다.`);
  },

  async restoreCourse(id: string): Promise<void> {
    const c = await this.getCourseById(id);
    const name = c ? c.name : '알 수 없는 프로젝트';
    
    await this.updateCourse(id, { is_active: true });
    await logService.logAction('project', id, name, 'restore', `숨김 처리된 프로젝트를 복원하였습니다.`);
  }
};
