"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Lock } from "lucide-react";
import type { Status, Priority } from "@prisma/client";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import { STATUS_LABEL, PRIORITY_LABEL } from "@/lib/status";
import { StatusBadge, StateBadge, LabelChip } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { AttachmentList, type AttachmentItem } from "@/components/detail/attachments";
import { ReactionBar, type ReactionItem } from "@/components/detail/reaction-bar";
import { Timeline, type CommentItem, type EventItem } from "@/components/detail/timeline";
import { CommentBox } from "@/components/detail/comment-box";
import { AdminSidebar } from "@/components/detail/admin-sidebar";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label as FieldLabel } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectDisplay } from "@/lib/project";
import { toast } from "sonner";

type ProjectOpt = { id: number; name: string; key: string; domain: string | null };

type Detail = {
  id: number;
  number: number;
  title: string;
  content: string;
  authorName: string;
  assignee: string | null;
  priority: Priority;
  status: Status;
  isPrivate: boolean;
  closed: boolean;
  plannedDate: string | null;
  resolutionNote: string | null;
  createdAt: string;
  project: { id: number; key: string; name: string; domain: string | null };
  labels: { id: number; name: string; color: string }[];
  attachments: AttachmentItem[];
  reactions: ReactionItem[];
};
type Locked = { locked: true; id: number; status: Status; closed: boolean; project: { name: string } };

const pwKey = (id: number) => `fb_pw_${id}`;

export function FeedbackDetail({ id }: { id: number }) {
  const { isAdmin, name, ensureName } = useApp();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [locked, setLocked] = useState<Locked | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allLabels, setAllLabels] = useState<{ id: number; name: string; color: string }[]>([]);
  const [fbPw, setFbPw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editLabelIds, setEditLabelIds] = useState<number[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectOpt[]>([]);

  const load = useCallback(async () => {
    const pw = typeof window !== "undefined" ? sessionStorage.getItem(pwKey(id)) : null;
    setFbPw(pw);
    try {
      const d = (await apiGet(`/api/feedbacks/${id}`, { feedbackPassword: pw })) as Detail;
      setDetail(d);
      setLocked(null);
      const [cs, es] = await Promise.all([
        apiGet(`/api/feedbacks/${id}/comments`, { feedbackPassword: pw }) as Promise<CommentItem[]>,
        apiGet(`/api/feedbacks/${id}/timeline`, { feedbackPassword: pw }) as Promise<EventItem[]>,
      ]);
      setComments(cs);
      setEvents(es);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && e.body && (e.body as Locked).locked) {
        setLocked(e.body as Locked);
        setDetail(null);
      } else {
        toast.error(e instanceof Error ? e.message : "불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // 관리자 모드 토글 시 다시 로드(잠금 우회).
  useEffect(() => {
    if (isAdmin && locked) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    apiGet("/api/labels").then(setAllLabels).catch(() => {});
    apiGet("/api/projects").then(setAllProjects).catch(() => {});
  }, []);

  if (loading) return <p className="text-slate-400">불러오는 중...</p>;

  if (locked) return <PrivateGate id={id} locked={locked} onUnlock={load} />;
  if (!detail) return <p className="text-slate-400">피드백을 찾을 수 없습니다.</p>;

  const d = detail;
  const canManage = isAdmin || (!!name && name === d.authorName);

  const isWithdrawn = d.status === "WITHDRAWN";
  const toggleClose = async () => {
    const willClose = !isWithdrawn;
    try {
      await apiSend("POST", `/api/feedbacks/${id}/close`, {
        closed: willClose,
        actorName: ensureName(),
      });
      load();
      toast.success(willClose ? "피드백을 철회했습니다." : "피드백을 다시 열었습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  };
  const startEdit = () => {
    setEditTitle(d.title);
    setEditContent(d.content);
    setEditProjectId(String(d.project.id));
    setEditLabelIds(d.labels.map((l) => l.id));
    setEditing(true);
  };
  const toggleEditLabel = (lid: number) =>
    setEditLabelIds((p) => (p.includes(lid) ? p.filter((x) => x !== lid) : [...p, lid]));
  const saveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return toast.error("제목과 내용을 입력하세요.");
    const actor = ensureName();
    try {
      await apiSend("PATCH", `/api/feedbacks/${id}`, {
        title: editTitle,
        content: editContent,
        projectId: Number(editProjectId),
        authorName: actor,
      });
      await apiSend("PUT", `/api/feedbacks/${id}/labels`, { labelIds: editLabelIds, actorName: actor });
      setEditing(false);
      load();
      toast.success("수정되었습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StateBadge closed={detail.closed} />
            <span className="text-xl font-normal text-slate-400">#{detail.id}</span>
            {detail.isPrivate && <Lock className="size-4 text-slate-400" />}
            <h1 className="text-2xl font-bold">{detail.title}</h1>
            {detail.labels.map((l) => (
              <LabelChip key={l.id} name={l.name} color={l.color} />
            ))}
          </div>
          {canManage && !editing && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="outline" size="sm" onClick={startEdit}>
                수정
              </Button>
              <Button variant="outline" size="sm" onClick={toggleClose}>
                {isWithdrawn ? "다시 열기" : "철회"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div className="space-y-5 min-w-0">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="px-4 py-2.5 border-b bg-slate-50/50 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{detail.authorName}</span> 님이{" "}
              {formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true, locale: ko })} 작성
            </div>
            <div className="p-4">
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <FieldLabel className="text-xs text-slate-500">프로젝트</FieldLabel>
                    <Select value={editProjectId} onValueChange={(v) => v && setEditProjectId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string) => {
                            const p = allProjects.find((x) => String(x.id) === v);
                            return p ? projectDisplay(p) : "선택";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {allProjects.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {projectDisplay(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel className="text-xs text-slate-500">분류</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {allLabels.map((l) => {
                        const on = editLabelIds.includes(l.id);
                        return (
                          <button key={l.id} type="button" onClick={() => toggleEditLabel(l.id)} className="transition">
                            {on ? (
                              <LabelChip name={l.name} color={l.color} withDot />
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500 hover:border-slate-300">
                                <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
                                {l.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel className="text-xs text-slate-500">제목</FieldLabel>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="제목" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel className="text-xs text-slate-500">내용</FieldLabel>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="내용 (마크다운 지원)"
                      className="min-h-40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>
                      저장
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Markdown>{detail.content}</Markdown>
                  <AttachmentList items={detail.attachments} feedbackPassword={fbPw} />
                  <div className="mt-4">
                    <ReactionBar
                      targetType="FEEDBACK"
                      targetId={detail.id}
                      reactions={detail.reactions}
                      feedbackPassword={fbPw}
                      onChange={load}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-slate-600">활동</h2>
            <Timeline comments={comments} events={events} feedbackPassword={fbPw} onChange={load} />
            <CommentBox feedbackId={id} feedbackPassword={fbPw} onPosted={load} />
          </div>
        </div>

        <div>
          {isAdmin ? (
            <AdminSidebar
              feedback={{
                id: detail.id,
                status: detail.status,
                priority: detail.priority,
                assignee: detail.assignee,
                plannedDate: detail.plannedDate,
                resolutionNote: detail.resolutionNote,
                labels: detail.labels,
              }}
              projectLabel={projectDisplay(detail.project)}
              allLabels={allLabels}
              onChange={load}
            />
          ) : (
            <aside className="rounded-2xl border bg-white p-4 space-y-3.5 text-sm shadow-sm">
              <div>
                <div className="text-slate-400 text-xs mb-0.5">프로젝트</div>
                {projectDisplay(detail.project)}
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-0.5">상태</div>
                {STATUS_LABEL[detail.status]}
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-0.5">우선순위</div>
                {PRIORITY_LABEL[detail.priority]}
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-0.5">담당자</div>
                {detail.assignee ?? "미지정"}
              </div>
              {detail.plannedDate && (
                <div>
                  <div className="text-slate-400 text-xs mb-0.5">개발 예정일</div>
                  {format(new Date(detail.plannedDate), "yyyy-MM-dd")}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function PrivateGate({ id, locked, onUnlock }: { id: number; locked: Locked; onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    try {
      await apiSend("POST", `/api/feedbacks/${id}/unlock`, { password: pw });
      sessionStorage.setItem(pwKey(id), pw);
      onUnlock();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "비밀번호가 올바르지 않습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 rounded-2xl border bg-white p-6 text-center space-y-4 shadow-sm">
      <Lock className="size-8 mx-auto text-slate-400" />
      <div>
        <h1 className="text-lg font-bold">비공개 피드백 #{locked.id}</h1>
        <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-2">
          <span>{locked.project.name}</span>
          <StatusBadge status={locked.status} />
        </p>
        <p className="text-sm text-slate-500 mt-2">열람하려면 비밀번호를 입력하세요.</p>
      </div>
      <div className="flex gap-2">
        <Input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          placeholder="열람 비밀번호"
        />
        <Button disabled={busy} onClick={unlock}>
          확인
        </Button>
      </div>
    </div>
  );
}
