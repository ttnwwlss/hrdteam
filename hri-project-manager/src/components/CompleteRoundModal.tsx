import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Award, Users, Calendar } from 'lucide-react';
import { Round } from '../services/roundService';
import { formatDate } from '../utils/dateUtils';

interface CompleteRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roundId: string, data: { participantsCount: number; satisfaction: number; completedAt: string }) => void;
  round?: Round | null;
}

export const CompleteRoundModal: React.FC<CompleteRoundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  round
}) => {
  const [participantsCount, setParticipantsCount] = useState<number>(20);
  const [satisfaction, setSatisfaction] = useState<number>(4.80);
  const [completedAt, setCompletedAt] = useState<string>('');

  useEffect(() => {
    setCompletedAt(formatDate(new Date()));
    if (round) {
      setParticipantsCount(round.participants_count || 20);
      setSatisfaction(round.satisfaction || 4.8);
    } else {
      setParticipantsCount(20);
      setSatisfaction(4.8);
    }
  }, [round, isOpen]);

  if (!isOpen || !round) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(round.id, {
      participantsCount: Number(participantsCount),
      satisfaction: Number(satisfaction),
      completedAt
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="complete-round-quick-modal">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-100 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-rose-100 bg-rose-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
              <CheckCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
              <span>세부 과정 운영 마감 처리 (완료)</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-rose-100 text-rose-400 hover:text-rose-700 rounded-md transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Target description text */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-600">
              <p className="text-[10px] text-slate-400 font-mono">마감 대상 차수</p>
              <h4 className="text-xs font-bold text-slate-800 mt-0.5">{round.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1">이 과정을 완료상태로 전환하고, 교육 참여성과 및 평점 지표를 보완 기입합니다.</p>
            </div>

            {/* 1. Trainees */}
            <div className="space-y-1">
              <label htmlFor="comp-trainees" className="block text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>최종 교육 참여자 수 (명)</span>
              </label>
              <input
                id="comp-trainees"
                type="number"
                required
                min="0"
                value={participantsCount}
                onChange={(e) => setParticipantsCount(Number(e.target.value) || 0)}
                placeholder="예: 25"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* 2. Satisfaction */}
            <div className="space-y-1">
              <label htmlFor="comp-satisfaction" className="block text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-slate-400" />
                <span>만족도 평점 (5.0 만점 기준)</span>
              </label>
              <input
                id="comp-satisfaction"
                type="number"
                step="0.01"
                required
                min="0"
                max="5"
                value={satisfaction}
                onChange={(e) => setSatisfaction(Number(e.target.value) || 0)}
                placeholder="예: 4.85"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* 3. Completed date */}
            <div className="space-y-1">
              <label htmlFor="comp-date" className="block text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>운영 최종 완료일</span>
              </label>
              <input
                id="comp-date"
                type="date"
                required
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:bg-white font-mono"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-150 rounded-lg font-medium transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-sm cursor-pointer"
              >
                마감 완료 승인
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
