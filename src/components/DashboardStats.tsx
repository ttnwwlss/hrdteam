import React from 'react';
import { Briefcase, Activity, CalendarCheck, Users, Award, UsersRound } from 'lucide-react';
import { Course } from '../services/courseService';
import { Round } from '../services/roundService';
import { Member } from '../services/memberService';
import { formatCount, formatSatisfaction } from '../utils/formatUtils';

interface DashboardStatsProps {
  courses: Course[];
  rounds: Round[];
  members: Member[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ courses, rounds, members }) => {
  // 1. Total projects
  const totalProjects = courses.length;

  // 2. Running projects count
  const runningProjectIds = new Set(
    rounds
      .filter(r => ['기획중', '준비중', '운영중'].includes(r.status))
      .map(r => r.course_id)
  );
  const runningProjects = courses.filter(c => runningProjectIds.has(c.id)).length;

  // 3. Total detailed rounds
  const totalRounds = rounds.length;

  // 4. Total trainees
  const totalParticipants = rounds.reduce((sum, r) => sum + (r.participants_count || 0), 0);

  // 5. Average course satisfaction (completed rounds only)
  const completedRoundsWithRating = rounds.filter(r => r.status === '완료' && r.satisfaction > 0);
  const averageSatisfaction = completedRoundsWithRating.length > 0
    ? completedRoundsWithRating.reduce((sum, r) => sum + r.satisfaction, 0) / completedRoundsWithRating.length
    : 0;

  // 6. Workload score
  const operatingStaff = members.filter(m => m.role !== 'sales');
  const staffCount = operatingStaff.length || 1;
  const loadPercentage = totalRounds / staffCount;

  const statCards = [
    {
      id: "stat-total-projects",
      title: "전체 프로젝트",
      value: `${totalProjects}개`,
      desc: "지정 사업단 위탁 과정",
      icon: Briefcase,
      textColor: "text-blue-600",
      bgLight: "bg-blue-50"
    },
    {
      id: "stat-running-projects",
      title: "가동중 과정",
      value: `${runningProjects}개`,
      desc: "현장 운영 실무 수습 중",
      icon: Activity,
      textColor: "text-red-600",
      bgLight: "bg-rose-50"
    },
    {
      id: "stat-total-rounds",
      title: "총 운영 차수",
      value: `${totalRounds}개`,
      desc: "등록 세부 관리 차수",
      icon: CalendarCheck,
      textColor: "text-purple-600",
      bgLight: "bg-purple-50"
    },
    {
      id: "stat-total-trainees",
      title: "총 수강생",
      value: `${formatCount(totalParticipants)}명`,
      desc: "누적 참가자 총 집계",
      icon: Users,
      textColor: "text-amber-600",
      bgLight: "bg-amber-50"
    },
    {
      id: "stat-satisfaction",
      title: "종합 만족도",
      value: `${formatSatisfaction(averageSatisfaction)}`,
      desc: "5.0 만점 기준 환산",
      icon: Award,
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50"
    },
    {
      id: "stat-workload",
      title: "인당 평균 로드",
      value: `${loadPercentage.toFixed(1)}개`,
      desc: `${staffCount}인 실무진 가용 풀`,
      icon: UsersRound,
      textColor: "text-indigo-600",
      bgLight: "bg-indigo-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-2" id="dashboard-statistics-grid">
      {statCards.map((stat) => (
        <div 
          key={stat.id} 
          id={stat.id} 
          className="bg-white p-4.5 rounded-[22px] shadow-[0_8px_30px_rgb(0,0,0,0.012)] border border-slate-100 flex flex-col justify-between hover:translate-y-[-1px] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#8b95a1] tracking-tight">{stat.title}</span>
            <div className={`p-2 rounded-xl ${stat.bgLight} ${stat.textColor} border border-white/50 shadow-2xs`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#191f28] tracking-tight">{stat.value}</div>
            <p className="text-[10px] text-[#8b95a1] font-semibold mt-0.5 truncate">{stat.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
