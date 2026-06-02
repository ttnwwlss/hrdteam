-- Schema for HRI Project Manager
-- Supports Supabase Firestore-like relational storage with uuid support.

-- Clean slate to prevent conflict with default Supabase tables
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.rounds CASCADE;
-- Also try dropping is_active related structures
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Members (Managers, PMs, PLs, Field Operators)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'sales', 'pm', 'pl', 'support', 'field'
    email TEXT UNIQUE,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Projects (Courses - 프로젝트)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT '위탁', -- '출강' (Visiting) or '위탁' (Consigned)
    manager_sales_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    manager_pm_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    manager_pl_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    
    -- Project Fixed Checklists (교육 제안/기획, 제안서 확정, 매출 인식)
    chk_proposal_plan BOOLEAN DEFAULT FALSE,
    chk_proposal_confirm BOOLEAN DEFAULT FALSE,
    chk_revenue_recognize BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Detailed Rounds (세부 과정)
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    round_no INTEGER NOT NULL, -- Autoincremented logic: max(round_no) + 1 per course
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '준비중', -- '기획중', '준비중', '운영중', '완료', '보류', '취소'
    
    -- Details
    location TEXT,
    operator_support_id UUID REFERENCES public.members(id) ON DELETE SET NULL, -- (하위 호환성용)
    operator_field_id UUID REFERENCES public.members(id) ON DELETE SET NULL,   -- (하위 호환성용)
    operator_support_ids JSONB DEFAULT '[]'::jsonb, -- 운영보조 다중 임직원 UUID ID 목록 (예: ["uuid-1", "uuid-2"])
    memo TEXT,
    
    -- Operating Metrics (Reset / Not copied on Round Duplicate)
    participants_count INTEGER DEFAULT 0,
    satisfaction NUMERIC(3,2) DEFAULT 0.00,
    completed_at TIMESTAMPTZ,
    start_date DATE,
    end_date DATE,
    
    -- Checklists: Array of jsonb representing Checklist Tasks
    checklist JSONB DEFAULT '[]'::jsonb,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for sound data modeling
    CONSTRAINT rounds_course_id_round_no_key UNIQUE (course_id, round_no)
);

-- 4. Modifying Logs (최근 이력)
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type TEXT NOT NULL, -- 'project', 'round', 'checklist', 'member'
    target_id UUID NOT NULL,
    target_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'restore', 'copy'
    summary TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT 'hri.hrdteam@gmail.com',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial seed data
INSERT INTO public.members (name, role, email) VALUES
('송유진 팀장', 'sales', 'sales1@hri.co.kr'),
('박형준 팀장', 'pm', 'pm1@hri.co.kr'),
('김지영 팀원', 'pl', 'pl1@hri.co.kr'),
('이서연 팀원', 'support', 'support1@hri.co.kr'),
('최동현 팀원', 'field', 'field1@hri.co.kr')
ON CONFLICT (email) DO NOTHING;
