// Constants for HRI Project Manager

export const PROJECT_TYPES = ['출강', '위탁'] as const;

export type ProjectType = typeof PROJECT_TYPES[number];

export const REGIONS_19 = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남',
  '제주', '전국', '온라인'
] as const;

export type Region19 = typeof REGIONS_19[number];

export const ROUND_STATUSES = [
  '기획중',
  '준비중',
  '운영중',
  '완료',
  '보류',
  '취소'
] as const;

export type RoundStatus = typeof ROUND_STATUSES[number];

export const MEMBER_ROLES = {
  sales: '사업PM',
  pm: '운영PM',
  pl: '운영PL',
  support: '운영보조',
  field: '운영보조'
} as const;

export type MemberRole = keyof typeof MEMBER_ROLES;

export const PROJECT_CHECKLIST_LABELS = {
  chk_proposal_plan: '교육 제안/기획',
  chk_proposal_confirm: '제안서 확정',
  chk_revenue_recognize: '매출 인식'
} as const;

// Default round (detailed) checklist items
export const DEFAULT_ROUND_CHECKLIST = [
  { id: 'item_1', title: '강사 섭외 및 계약 완료', completed: false },
  { id: 'item_2', title: '교재/프린트 및 교구 준비', completed: false },
  { id: 'item_3', title: '교육 안내 배포 (SMS/LMS)', completed: false },
  { id: 'item_4', title: '강의실 예약 및 시청각 세팅', completed: false },
  { id: 'item_5', title: '강의 만족도 설문지 구글폼 생성', completed: false },
  { id: 'item_6', title: '수료증 및 교보재 패킹', completed: false },
  { id: 'item_7', title: '운영 일지 및 정산 서류 확보', completed: false }
];
