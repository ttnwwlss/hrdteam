import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface Member {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export const DEFAULT_MEMBERS: Member[] = [];

function getLocalMembers(): Member[] {
  const data = localStorage.getItem('hri_members');
  if (!data) {
    localStorage.setItem('hri_members', JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
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
        return getLocalMembers().filter(m => m.is_active);
      }
    } else {
      return getLocalMembers().filter(m => m.is_active);
    }
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
        return getLocalMembers();
      }
    } else {
      return getLocalMembers();
    }
  },

  async createMember(member: Omit<Member, 'id' | 'is_active'>): Promise<Member> {
    const newMember: Member = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mem_' + Math.random().toString(36).substr(2, 9),
      ...member,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert([{
            name: member.name,
            role: 'support', // placeholder to satisfy database constraint
            is_active: true
          }])
          .select()
          .single();
        if (error) throw error;
        return data as Member;
      } catch (err) {
        console.error('Supabase createMember error, using local:', err);
      }
    }

    const current = getLocalMembers();
    current.push(newMember);
    saveLocalMembers(current);
    return newMember;
  },

  async updateMember(id: string, updates: Partial<Omit<Member, 'id'>>): Promise<Member> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .update({
            name: updates.name,
            is_active: updates.is_active
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Member;
      } catch (err) {
        console.error('Supabase updateMember error, using local:', err);
      }
    }

    const current = getLocalMembers();
    const idx = current.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Member not found');
    current[idx] = { ...current[idx], ...updates };
    saveLocalMembers(current);
    return current[idx];
  },

  async deleteMember(id: string): Promise<void> {
    // Soft delete: sets is_active to false
    await this.updateMember(id, { is_active: false });
  }
};
