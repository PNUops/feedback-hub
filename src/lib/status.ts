import type { Status, Priority } from "@prisma/client";

export const STATUS_LABEL: Record<Status, string> = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  PLANNED: "개발 예정",
  IN_PROGRESS: "개발 중",
  DONE: "개발 완료",
  DEPLOYED: "배포 완료",
  REJECTED: "보류",
  WITHDRAWN: "철회",
};

export const STATUS_STYLE: Record<Status, string> = {
  RECEIVED: "bg-slate-100 text-slate-700 border-slate-200",
  REVIEWING: "bg-amber-100 text-amber-800 border-amber-200",
  PLANNED: "bg-violet-100 text-violet-800 border-violet-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  DONE: "bg-teal-100 text-teal-800 border-teal-200",
  DEPLOYED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  WITHDRAWN: "bg-slate-100 text-slate-500 border-slate-200",
};

// 개발자가 지정하는 상태(철회는 작성자만).
export const STATUS_ORDER: Status[] = [
  "RECEIVED",
  "REVIEWING",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "DEPLOYED",
  "REJECTED",
];

// 요약 타일용(철회 포함).
export const ALL_STATUS_ORDER: Status[] = [...STATUS_ORDER, "WITHDRAWN"];

const CLOSED: Status[] = ["DEPLOYED", "REJECTED", "WITHDRAWN"];

export function isClosed(status: Status): boolean {
  return CLOSED.includes(status);
}

export function stateLabel(status: Status): "열림" | "닫힘" {
  return isClosed(status) ? "닫힘" : "열림";
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

export const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-slate-100 text-slate-700 border-slate-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
};
