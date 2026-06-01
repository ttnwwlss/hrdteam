import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface AuditLog {
  id: string;
  target_type: 'project' | 'round' | 'checklist' | 'member';
  target_id: string;
  target_name: string;
  action_type: 'create' | 'update' | 'delete' | 'restore' | 'copy';
  summary: string;
  actor_name: string;
  created_at: string;
}

const DEFAULT_LOGS: AuditLog[] = [
  {
    id: 'l1',
    target_type: 'project',
    target_id: 'p1',
    target_name: '현대자동차 테크리더 리더십 역량 강화 과정',
    action_type: 'create',
    summary: '신규 위탁 과정 개설 및 송유진(사업), 박형준(PM) 담당자 지정',
    actor_name: 'hri.hrdteam@gmail.com',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString() // 36 hours ago
  },
  {
    id: 'l2',
    target_type: 'round',
    target_id: 'r1',
    target_name: '1차수 - 소통 및 성과 관리 워크숍',
    action_type: 'update',
    summary: '상태 "기획중" ➔ "준비중" 변경 및 최동현 현장운영자 지정',
    actor_name: 'hri.hrdteam@gmail.com',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() // 24 hours ago
  },
  {
    id: 'l3',
    target_type: 'checklist',
    target_id: 'r1',
    target_name: '1차수 - 소통 및 성과 관리 워크숍',
    action_type: 'update',
    summary: '세부 과정 체크리스트 [강사 섭외 및 계약 완료] 체크 완료',
    actor_name: 'hri.hrdteam@gmail.com',
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString() // 8 hours ago
  },
  {
    id: 'l4',
    target_type: 'project',
    target_id: 'p2',
    target_name: 'SK이노베이션 DX 융합 전문 아카데미',
    action_type: 'create',
    summary: '출강 과정 신규 등록 및 매출 인식 체크리스트 작성 진행',
    actor_name: 'hri.hrdteam@gmail.com',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // 4 hours ago
  }
];

function getLocalLogs(): AuditLog[] {
  const data = localStorage.getItem('hri_logs');
  if (!data) {
    localStorage.setItem('hri_logs', JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }
  return JSON.parse(data);
}

function saveLocalLogs(logs: AuditLog[]) {
  localStorage.setItem('hri_logs', JSON.stringify(logs));
}

export const logService = {
  async getLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        if (!data || data.length === 0) {
          return DEFAULT_LOGS;
        }
        return data as AuditLog[];
      } catch (err) {
        console.error('Supabase getLogs error, using local:', err);
        return getLocalLogs();
      }
    } else {
      return getLocalLogs();
    }
  },

  async logAction(
    targetType: AuditLog['target_type'],
    targetId: string,
    targetName: string,
    actionType: AuditLog['action_type'],
    summary: string,
    actorName: string = 'hri.hrdteam@gmail.com'
  ): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'log_' + Math.random().toString(36).substr(2, 9),
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      action_type: actionType,
      summary,
      actor_name: actorName,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('logs')
          .insert([{
            target_type: targetType,
            target_id: targetId,
            target_name: targetName,
            action_type: actionType,
            summary,
            actor_name: actorName
          }])
          .select()
          .single();
        if (!error && data) {
          return data as AuditLog;
        }
      } catch (err) {
        console.error('Supabase logAction error, using local:', err);
      }
    }

    const current = getLocalLogs();
    current.unshift(newLog); // Put latest on top
    saveLocalLogs(current);
    return newLog;
  }
};
