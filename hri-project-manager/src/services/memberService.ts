import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface Member {
  id: string;
  name: string;
  role: 'sales' | 'pm' | 'pl' | 'support' | 'field';
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export const DEFAULT_MEMBERS: Member[] = [
  { id: 'm1', name: '송유진 팀장', role: 'sales', email: 'sales1@hri.co.kr', phone: '010-1234-5678', is_active: true },
  { id: 'm2', name: '박형준 팀장', role: 'pm', email: 'pm1@hri.co.kr', phone: '010-2345-6789', is_active: true },
  { id: 'm3', name: '김지영 팀원', role: 'pl', email: 'pl1@hri.co.kr', phone: '010-3456-7890', is_active: true },
  { id: 'm4', name: '이서연 팀원', role: 'support', email: 'support1@hri.co.kr', phone: '010-4567-8901', is_active: true },
  { id: 'm5', name: '최동현 팀원', role: 'field', email: 'field1@hri.co.kr', phone: '010-5678-9012', is_active: true }
];

function getLocalMembers(): Member[] {
  const data = localStorage.getItem('hri_members');
  if (!data) {
    localStorage.setItem('hri_members', JSON.stringify(DEFAULT_MEMBERS));
    return DEFAULT_MEMBERS;
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
        // If empty, let's load default members to avoid sterile system
        if (!data || data.length === 0) {
          // Attempt insert default seed
          const { data: inserted, error: insErr } = await supabase
            .from('members')
            .insert(DEFAULT_MEMBERS.map(({ id, ...rest }) => rest))
            .select();
          if (!insErr && inserted) return inserted as Member[];
          return DEFAULT_MEMBERS;
        }
        return data as Member[];
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
        return data as Member[];
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
            role: member.role,
            email: member.email,
            phone: member.phone,
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
          .update(updates)
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
