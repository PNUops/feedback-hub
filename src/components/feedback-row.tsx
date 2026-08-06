import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Lock, MessageSquare, ThumbsUp } from "lucide-react";
import type { FeedbackListItem } from "@/lib/serialize";
import { StatusBadge, LabelChip } from "@/components/badges";
import { projectDisplay } from "@/lib/project";

function rel(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
}

export function FeedbackRow({ item }: { item: FeedbackListItem }) {
  const who = item.authorName ?? "익명";
  return (
    <Link
      href={`/issues/${item.id}`}
      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-slate-300"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={item.status} />
          <span className="text-slate-400 text-sm">#{item.id}</span>
          {item.isPrivate && <Lock className="size-3.5 text-slate-400" />}
          <span className="font-semibold text-slate-900 truncate">{item.title}</span>
          {item.commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
              <MessageSquare className="size-3.5" />
              {item.commentCount}
            </span>
          )}
          {item.reactionCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
              <ThumbsUp className="size-3.5" />
              {item.reactionCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {projectDisplay(item.project)}
          </span>
          {item.labels.map((l) => (
            <LabelChip key={l.id} name={l.name} color={l.color} />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between self-stretch shrink-0 text-xs">
        <span className="text-slate-400">{rel(item.createdAt)}</span>
        <div className="flex items-center gap-3 text-slate-500">
          {item.assignee && <span className="text-slate-400">담당 {item.assignee}</span>}
          <span className="text-slate-600 font-medium">{who}</span>
        </div>
      </div>
    </Link>
  );
}
