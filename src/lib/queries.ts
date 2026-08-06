import type { Prisma, Status } from "@prisma/client";
import { prisma } from "./prisma";
import { isClosed } from "./status";
import { listSelect, toListItem, type FeedbackListItem } from "./serialize";

const OPEN: Status[] = ["RECEIVED", "REVIEWING", "PLANNED", "IN_PROGRESS", "DONE"];
const CLOSED: Status[] = ["DEPLOYED", "REJECTED", "WITHDRAWN"];

export type FeedbackFilter = {
  projectIds?: number[];
  state?: string;
  status?: string;
  assignee?: string;
  author?: string;
  labels?: string[];
  q?: string;
  sort?: string;
  page?: number;
  size?: number;
};

/**
 * 키워드 매칭 조건. 비공개 피드백은 목록에서 제목·본문이 모두 가려지므로,
 * 관리자가 아니면 검색 대상에서 제외한다(가려진 내용을 한 글자씩 탐지하는 오라클 방지).
 */
function qMatch(q: string, canSearchPrivate: boolean): Prisma.FeedbackWhereInput {
  const or: Prisma.FeedbackWhereInput = {
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ],
  };
  return canSearchPrivate ? or : { AND: [{ isPrivate: false }, or] };
}

export function filterFromParams(sp: URLSearchParams): FeedbackFilter {
  const projects = sp.get("projects")?.split(",").map(Number).filter((n) => !Number.isNaN(n));
  return {
    projectIds: projects?.length ? projects : undefined,
    state: sp.get("state") ?? "all",
    status: sp.get("status") ?? undefined,
    assignee: sp.get("assignee") ?? undefined,
    author: sp.get("author") ?? undefined,
    labels: sp.get("labels")?.split(",").filter(Boolean),
    q: sp.get("q") ?? undefined,
    sort: sp.get("sort") ?? "created",
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    size: sp.get("size") ? Number(sp.get("size")) : 20,
  };
}

export async function listFeedbacks(
  f: FeedbackFilter,
  canSearchPrivate = false,
): Promise<{ items: FeedbackListItem[]; total: number; page: number; size: number }> {
  const where: Prisma.FeedbackWhereInput = {};
  const and: Prisma.FeedbackWhereInput[] = [];

  if (f.projectIds?.length) where.projectId = { in: f.projectIds };
  if (f.state === "open") where.status = { in: OPEN };
  else if (f.state === "closed") where.status = { in: CLOSED };
  if (f.status) where.status = f.status as Status;
  if (f.assignee) where.assignee = f.assignee;
  if (f.author) where.authorName = f.author;
  for (const name of f.labels ?? []) and.push({ labels: { some: { name } } });
  if (f.q) and.push(qMatch(f.q, canSearchPrivate));
  if (and.length) where.AND = and;

  let orderBy: Prisma.FeedbackOrderByWithRelationInput;
  if (f.sort === "updated") orderBy = { updatedAt: "desc" };
  else if (f.sort === "comments") orderBy = { comments: { _count: "desc" } };
  else orderBy = { createdAt: "desc" };

  const page = Math.max(1, f.page ?? 1);
  const size = Math.min(100, Math.max(1, f.size ?? 20));

  const [total, rows] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      select: listSelect,
      orderBy,
      skip: (page - 1) * size,
      take: size,
    }),
  ]);

  const ids = rows.map((r) => r.id);
  const rc = ids.length
    ? await prisma.reaction.groupBy({
        by: ["targetId"],
        where: { targetType: "FEEDBACK", targetId: { in: ids } },
        _count: true,
      })
    : [];
  const rcMap = new Map(rc.map((x) => [x.targetId, x._count]));

  return { items: rows.map((r) => toListItem(r, rcMap.get(r.id) ?? 0)), total, page, size };
}

/** 상태 타일용 카운트. 상태를 제외한 현재 필터(프로젝트/분류/검색/작성자)를 반영. */
export async function getStatusCounts(
  f: FeedbackFilter,
  canSearchPrivate = false,
): Promise<{ total: number; byStatus: Record<Status, number> }> {
  const where: Prisma.FeedbackWhereInput = {};
  const and: Prisma.FeedbackWhereInput[] = [];
  if (f.projectIds?.length) where.projectId = { in: f.projectIds };
  if (f.author) where.authorName = f.author;
  for (const name of f.labels ?? []) and.push({ labels: { some: { name } } });
  if (f.q) and.push(qMatch(f.q, canSearchPrivate));
  if (and.length) where.AND = and;

  const raw = await prisma.feedback.groupBy({ by: ["status"], where, _count: true });
  const byStatus = Object.fromEntries(raw.map((r) => [r.status, r._count])) as Record<Status, number>;
  const total = raw.reduce((s, r) => s + r._count, 0);
  return { total, byStatus };
}

export async function getStats(projectId?: number) {
  const where: Prisma.FeedbackWhereInput = projectId ? { projectId } : {};

  const byStatusRaw = await prisma.feedback.groupBy({ by: ["status"], where, _count: true });
  const byStatus = Object.fromEntries(byStatusRaw.map((r) => [r.status, r._count])) as Record<Status, number>;

  let open = 0;
  let closed = 0;
  for (const r of byStatusRaw) {
    if (isClosed(r.status)) closed += r._count;
    else open += r._count;
  }

  const projects = await prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const byProjectRaw = await prisma.feedback.groupBy({ by: ["projectId", "status"], _count: true });
  const byProject = projects.map((p) => {
    let o = 0;
    let c = 0;
    for (const r of byProjectRaw.filter((x) => x.projectId === p.id)) {
      if (isClosed(r.status)) c += r._count;
      else o += r._count;
    }
    return { id: p.id, key: p.key, name: p.name, open: o, closed: c, total: o + c };
  });

  const labels = await prisma.label.findMany({
    select: { id: true, name: true, color: true, _count: { select: { feedbacks: true } } },
    orderBy: { id: "asc" },
  });
  const byLabel = labels.map((l) => ({ id: l.id, name: l.name, color: l.color, count: l._count.feedbacks }));

  return { open, closed, total: open + closed, byStatus, byProject, byLabel };
}
