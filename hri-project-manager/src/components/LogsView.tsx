import React from 'react';
import { History, User, CheckCircle, PlusCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { AuditLog } from '../services/logService';
import { formatDateTime } from '../utils/dateUtils';

interface LogsViewProps {
  logs: AuditLog[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  const getActionStyles = (action: AuditLog['action_type']) => {
    switch (action) {
      case 'create':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: PlusCircle
        };
      case 'update':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: CheckCircle
        };
      case 'delete':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: AlertCircle
        };
      case 'restore':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500',
          icon: RefreshCw
        };
      case 'copy':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          icon: Layers
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          icon: CheckCircle
        };
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500" id="logs-empty-state">
        <History className="h-8 w-8 mx-auto text-slate-300 mb-2 animate-spin" />
        <p className="text-xs font-semibold">저장된 최근 활동 이력이 발견되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden" id="hri-logs-panel">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-rose-600" />
          <h2 className="text-xs font-bold text-slate-800">최근 시스템/운영 변경 이력 (Audit Logs)</h2>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
          실시간 기록 보관소
        </span>
      </div>

      {/* Timeline body */}
      <div className="p-4 overflow-y-auto max-h-[600px] relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100 z-0" />
        
        <div className="space-y-4 relative z-10">
          {logs.map((log) => {
            const styles = getActionStyles(log.action_type);
            const IconComponent = styles.icon;

            return (
              <div key={log.id} className="flex gap-4 group" id={`log-item-${log.id}`}>
                {/* Visual marker dot */}
                <div className={`mt-1.5 h-4 w-4 rounded-full border bg-white flex items-center justify-center shrink-0 shadow-2xs z-20`}>
                  <div className={`h-2 w-2 rounded-full ${styles.dot}`} />
                </div>

                {/* Log Content card */}
                <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-slate-100/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    {/* Event Subject Target */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${styles.bg}`}>
                        {log.action_type === 'create' ? '신규등록' :
                         log.action_type === 'update' ? '정보수정' :
                         log.action_type === 'delete' ? '숨김처리' :
                         log.action_type === 'restore' ? '숨김복원' : '차수복사'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        [{log.target_type === 'project' ? '프로젝트' :
                          log.target_type === 'round' ? '세부과정' :
                          log.target_type === 'checklist' ? '체크리스트' : '팀원'}]
                      </span>
                      <h4 className="text-xs font-bold text-slate-700 truncate max-w-sm" title={log.target_name}>
                        {log.target_name}
                      </h4>
                    </div>

                    {/* Actors and Date marker */}
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono shrink-0">
                      <div className="flex items-center space-x-0.5">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{log.actor_name}</span>
                      </div>
                      <span>|</span>
                      <span>{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>

                  {/* Summary of what occurred */}
                  <div className="text-[11px] text-slate-600 font-semibold bg-white p-2 rounded border border-slate-150">
                    {log.summary}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
