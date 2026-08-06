import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { filterFromParams, listFeedbacks, getStatusCounts } from "@/lib/queries";
import { isAdminServer } from "@/lib/auth";
import { STATUS_LABEL, ALL_STATUS_ORDER } from "@/lib/status";
import { FilterBar } from "@/components/filter-bar";
import { ListToolbar } from "@/components/list-toolbar";
import { FeedbackRow } from "@/components/feedback-row";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function HomePage({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v) && v[0]) sp.set(k, v[0]);
  }

  const filter = filterFromParams(sp);
  const admin = await isAdminServer();
  const [{ items, total }, projects, labels, stats] = await Promise.all([
    listFeedbacks(filter, admin),
    prisma.project.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.label.findMany({ orderBy: { id: "asc" } }),
    getStatusCounts(filter, admin),
  ]);

  const activeStatus = sp.get("status");

  // 상태 타일 링크는 현재 필터(프로젝트/분류/검색)를 유지하고 status만 바꾼다.
  const withStatus = (s: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (s) next.set("status", s);
    else next.delete("status");
    next.delete("page");
    const qs = next.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="space-y-5">
      <FilterBar projects={projects} labels={labels} />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        <Link
          href={withStatus(null)}
          className={`rounded-xl border px-2 py-3 text-center transition ${
            !activeStatus ? "border-primary bg-primary/5" : "bg-white hover:bg-slate-50"
          }`}
        >
          <div className="text-xl font-bold tabular-nums">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-0.5">전체</div>
        </Link>
        {ALL_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={withStatus(s)}
            className={`rounded-xl border px-2 py-3 text-center transition ${
              activeStatus === s ? "border-primary bg-primary/5" : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-xl font-bold tabular-nums">{stats.byStatus[s] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{STATUS_LABEL[s]}</div>
          </Link>
        ))}
      </div>

      <ListToolbar total={total} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-20 text-center text-slate-400">
          <p className="text-sm">조건에 맞는 피드백이 없습니다.</p>
          <Link href="/issues/new" className="text-primary text-sm font-medium hover:underline">
            첫 피드백을 남겨보세요
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedbackRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
