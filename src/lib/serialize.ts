import type { Prisma } from "@prisma/client";
import { isClosed } from "./status";

/** 목록 행에 필요한 필드만 조회. */
export const listSelect = {
  id: true,
  number: true,
  title: true,
  authorName: true,
  assignee: true,
  priority: true,
  status: true,
  isPrivate: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, key: true, name: true, domain: true } },
  labels: { select: { id: true, name: true, color: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.FeedbackSelect;

type ListRow = Prisma.FeedbackGetPayload<{ select: typeof listSelect }>;

export type FeedbackListItem = {
  id: number;
  number: number;
  title: string;
  authorName: string | null;
  assignee: string | null;
  priority: ListRow["priority"];
  status: ListRow["status"];
  isPrivate: boolean;
  closed: boolean;
  createdAt: string;
  updatedAt: string;
  project: { id: number; key: string; name: string; domain: string | null };
  labels: { id: number; name: string; color: string }[];
  commentCount: number;
  reactionCount: number;
};

/**
 * 목록 행 직렬화. 비공개 피드백은 목록에서 제목만 마스킹하고(내용은 상세에서 잠금),
 * 작성자·분류·상태 등 메타는 노출한다.
 */
export function toListItem(row: ListRow, reactionCount: number): FeedbackListItem {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    isPrivate: row.isPrivate,
    closed: isClosed(row.status),
    priority: row.priority,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    project: row.project,
    commentCount: row._count.comments,
    reactionCount,
    title: row.isPrivate ? "비공개 피드백" : row.title,
    authorName: row.authorName,
    assignee: row.assignee,
    labels: row.labels,
  };
}
