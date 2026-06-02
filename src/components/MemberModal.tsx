import React, { useState } from 'react';
import { X, UserPlus, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Member, memberService } from '../services/memberService';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onRefreshMembers: () => void | Promise<void>;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  members,
  onRefreshMembers
}) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const canSubmit = name.trim().length > 0 && !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || isSaving) return;

    try {
      setIsSaving(true);

      if (editingId) {
        await memberService.updateMember(editingId, {
          name: trimmedName
        });
        setEditingId(null);
      } else {
        await memberService.createMember({
          name: trimmedName
        });
      }

      setName('');
      await onRefreshMembers();
    } catch (err) {
      console.error('Failed to save member:', err);
      alert('팀원 저장 중 오류가 발생했습니다. Supabase 테이블 설정 또는 콘솔 오류를 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (m: Member) => {
    setEditingId(m.id);
    setName(m.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('이 팀원을 목록에서 숨김(비활성화) 처리하시겠습니까? 더 이상 드롭다운에서 선택할 수 없게 됩니다.')) {
      try {
        await memberService.deleteMember(id);
        await onRefreshMembers();
      } catch (err) {
        console.error('Failed to delete member:', err);
        alert('팀원 숨김 처리 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="staff-members-registry-modal">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100 flex flex-col max-h-[85vh]">

          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              HRI 사업단 팀원 등록 및 관리
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
                <UserPlus className="h-4 w-4 text-rose-500" />
                <span>{editingId ? '팀원 정보 수정' : '새로운 팀원 추가'}</span>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label htmlFor="mem-name-input" className="block text-[10px] font-medium text-slate-500">
                    성명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="mem-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300"
                  >
                    편집 취소
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`px-4 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition ${
                    canSubmit
                      ? 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{isSaving ? '저장 중...' : editingId ? '저장하기' : '팀원 추가'}</span>
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                소속 팀원 명단 ({members.length}명)
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-slate-100 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">성명</th>
                      <th className="p-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold">{m.name}</td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(m)}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition"
                            title="정보수정"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                            title="목록 숨김/비활성화"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {members.length === 0 && (
                      <tr>
                        <td colSpan={2} className="p-8 text-center text-slate-400 italic">
                          현재 등록된 팀원이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 border border-slate-200 text-white rounded-lg font-bold"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
