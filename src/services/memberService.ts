import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface Member {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
}

export const DEFAULT_MEMBERS: Member[] = [];

function createLocalId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'mem_' + Math.random().toString(36).slice(2, 11);
}

function getLocalMembers(): Member[] {
  const data = localStorage.getItem('hri_members');

  if (!data) {
    localStorage.setItem('hri_members', JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(data) as Member[];
  } catch (err) {
    console.error('Failed to parse local members:', err);
    localStorage.setItem('hri_members', JSON.stringify([]));
    return [];
  }
}

function saveLocalMembers(members: Member[]) {
  localStorage.setItem('hri_members', JSON.stringify(members));
}

export const memberService = {
  async getMembers(): Promise<Member[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        return (data || []) as Member[];
      } catch (err) {
        console.error('Supabase getMembers error, falling back to local:', err);
        return getLocalMembers().filter((m) => m.is_active);
      }
    }

    return getLocalMembers().filter((m) => m.is_active);
  },

  async getAllMembersIncludingHidden(): Promise<Member[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        return (data || []) as Member[];
      } catch (err) {
        console.error('Supabase getAllMembersIncludingHidden error, falling back to local:', err);
        return getLocalMembers();
      }
    }

    return getLocalMembers();
  },

  async createMember(member: { name: string }): Promise<Member> {
    const trimmedName = member.name.trim();

    if (!trimmedName) {
      throw new Error('Member name is required');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert([
            {
              name: trimmedName,
              role: 'support', // ⚠️ DB 스키마의 NOT NULL 제약조건을 만족하기 위한 필수 자리표시자
              is_active: true
            }
          ])
          .select()
          .single();

        if (error) throw error;

        return data as Member;
      } catch (err) {
        console.error('Supabase createMember error:', err);
        throw err; // ⚠️ 에러를 던져야 UI가 명확히 감지하고 동기화 에러를 예방합니다.
      }
    }

    const newMember: Member = {
      id: createLocalId(),
      name: trimmedName,
      role: null,
      email: null,
      phone: null,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const current = getLocalMembers();
    current.push(newMember);
    saveLocalMembers(current);

    return newMember;
  },

  async updateMember(id: string, updates: { name?: string; is_active?: boolean }): Promise<Member> {
    const sanitizedUpdates: Partial<Member> = {};

    if (typeof updates.name === 'string') {
      const trimmedName = updates.name.trim();

      if (!trimmedName) {
        throw new Error('Member name is required');
      }

      sanitizedUpdates.name = trimmedName;
    }

    if (typeof updates.is_active === 'boolean') {
      sanitizedUpdates.is_active = updates.is_active;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .update(sanitizedUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return data as Member;
      } catch (err) {
        console.error('Supabase updateMember error:', err);
        throw err; // ⚠️ 에러를 던져서 데이터 불일치(desync)를 차단합니다.
      }
    }

    const current = getLocalMembers();
    const idx = current.findIndex((m) => m.id === id);

    if (idx === -1) {
      throw new Error('Member not found');
    }

    current[idx] = {
      ...current[idx],
      ...sanitizedUpdates
    };

    saveLocalMembers(current);

    return current[idx];
  },

  async deleteMember(id: string): Promise<void> {
    await this.updateMember(id, { is_active: false });
  }
};
