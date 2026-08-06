"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowRightLeft,
  CheckCircle2,
  CircleDot,
  Tag,
  UserPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiSend } from "@/lib/api";
import { STATUS_LABEL } from "@/lib/status";
import { Markdown } from "@/components/markdown";
import { AttachmentList, type AttachmentItem } from "@/components/detail/attachments";
import { ReactionBar, type ReactionItem } from "@/components/detail/reaction-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type CommentItem = {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  attachments: AttachmentItem[];
  reactions: ReactionItem[];
};
export type EventItem = {
  id: number;
  type: string;
  actorName: string;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  createdAt: string;
};

function rel(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
}

function statusLabel(v: string | null) {
  return v && v in STATUS_LABEL ? STATUS_LABEL[v as keyof typeof STATUS_LABEL] : v;
}

function EventLine({ e, onChange }: { e: EventItem; onChange: () => void }) {
  const { isAdmin } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(e.note ?? "");

  async function saveNote() {
    try {
      await apiSend("PATCH", `/api/timeline/${e.id}`, { note: draft || null });
      setEditing(false);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "실패했습니다.");
    }
  }

  let icon = <ArrowRightLeft className="size-3.5" />;
  let text = "";
  switch (e.type) {
    case "STATUS_CHANGED":
      text = `상태를 ${statusLabel(e.fromValue)}에서 ${statusLabel(e.toValue)}(으)로 변경`;
      break;
    case "LABELED":
      icon = <Tag className="size-3.5" />;
      text = `'${e.toValue}' 분류 추가`;
      break;
    case "UNLABELED":
      icon = <Tag className="size-3.5" />;
      text = `'${e.fromValue}' 분류 제거`;
      break;
    case "ASSIGNED":
      icon = <UserPlus className="size-3.5" />;
      text = `담당자를 ${e.toValue}(으)로 지정`;
      break;
    case "UNASSIGNED":
      icon = <UserPlus className="size-3.5" />;
      text = "담당자 해제";
      break;
    case "CLOSED":
      icon = <CheckCircle2 className="size-3.5 text-violet-500" />;
      text = "닫음";
      break;
    case "REOPENED":
      icon = <CircleDot className="size-3.5 text-green-600" />;
      text = "다시 열음";
      break;
    default:
      text = e.type;
  }
  return (
    <div className="py-1.5 pl-1">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span>
          <span className="font-medium text-slate-700">{e.actorName}</span>님이 {text}
        </span>
        <span className="text-xs text-slate-400">· {rel(e.createdAt)}</span>
        {isAdmin && !editing && (
          <button
            onClick={() => {
              setDraft(e.note ?? "");
              setEditing(true);
            }}
            className="text-slate-300 hover:text-slate-600"
            title={e.note ? "노트 수정" : "노트 추가"}
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1.5 ml-6 space-y-2">
          <Textarea
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            placeholder="사유나 안내 (선택)"
            className="min-h-16 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveNote}>
              저장
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        e.note && (
          <div className="mt-1 ml-6 border-l-2 border-slate-200 pl-3 text-sm text-slate-600 whitespace-pre-wrap">
            {e.note}
          </div>
        )
      )}
    </div>
  );
}

function CommentCard({
  c,
  feedbackPassword,
  onChange,
}: {
  c: CommentItem;
  feedbackPassword?: string | null;
  onChange: () => void;
}) {
  const { name, isAdmin } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.content);
  const canEdit = isAdmin || name === c.authorName;

  async function save() {
    try {
      await apiSend("PATCH", `/api/comments/${c.id}`, { content: draft, authorName: name ?? c.authorName });
      setEditing(false);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  }
  async function remove() {
    if (!confirm("의견을 삭제할까요?")) return;
    try {
      await apiSend("DELETE", `/api/comments/${c.id}?authorName=${encodeURIComponent(name ?? "")}`);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-slate-50/50 text-sm">
        <span className="font-medium">{c.authorName}</span>
        <span className="text-xs text-slate-400">{rel(c.createdAt)}</span>
        {canEdit && !editing && (
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-slate-700">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={remove} className="text-slate-400 hover:text-rose-600">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-24" />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>
                저장
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Markdown>{c.content}</Markdown>
            <AttachmentList items={c.attachments} feedbackPassword={feedbackPassword} />
            <div className="mt-3">
              <ReactionBar
                targetType="COMMENT"
                targetId={c.id}
                reactions={c.reactions}
                feedbackPassword={feedbackPassword}
                onChange={onChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type Entry = { at: string } & ({ kind: "comment"; c: CommentItem } | { kind: "event"; e: EventItem });

export function Timeline({
  comments,
  events,
  feedbackPassword,
  onChange,
}: {
  comments: CommentItem[];
  events: EventItem[];
  feedbackPassword?: string | null;
  onChange: () => void;
}) {
  const entries: Entry[] = [
    ...comments.map((c) => ({ at: c.createdAt, kind: "comment" as const, c })),
    ...events.map((e) => ({ at: e.createdAt, kind: "event" as const, e })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="space-y-3">
      {entries.map((en) =>
        en.kind === "comment" ? (
          <CommentCard
            key={`c${en.c.id}`}
            c={en.c}
            feedbackPassword={feedbackPassword}
            onChange={onChange}
          />
        ) : (
          <EventLine key={`e${en.e.id}`} e={en.e} onChange={onChange} />
        ),
      )}
      {entries.length === 0 && <p className="text-sm text-slate-400">아직 활동이 없습니다.</p>}
    </div>
  );
}
