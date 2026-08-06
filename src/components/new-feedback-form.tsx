"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Paperclip, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiSend, apiUpload } from "@/lib/api";
import { cn } from "@/lib/utils";
import { randomNick } from "@/lib/nickname";
import { projectDisplay } from "@/lib/project";
import { LabelChip } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Project = { id: number; name: string; key: string; domain: string | null };
type LabelT = { id: number; name: string; color: string };

export function NewFeedbackForm({ projects, labels }: { projects: Project[]; labels: LabelT[] }) {
  const router = useRouter();
  const { name, setName, email, setEmail } = useApp();

  const [authorName, setAuthorName] = useState(name ?? "");
  const [authorEmail, setAuthorEmail] = useState(email ?? "");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 상단바에서 이름/이메일을 바꾸면 즉시 반영.
  useEffect(() => setAuthorName(name ?? ""), [name]);
  useEffect(() => setAuthorEmail(email ?? ""), [email]);

  const toggleLabel = (id: number) =>
    setLabelIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function submit() {
    if (!projectId) return toast.error("프로젝트를 선택하세요.");
    if (!title.trim()) return toast.error("제목을 입력하세요.");
    if (!content.trim()) return toast.error("내용을 입력하세요.");
    if (isPrivate && !accessPassword.trim()) return toast.error("비공개 열람 비밀번호를 입력하세요.");
    const em = authorEmail.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast.error("이메일 형식이 올바르지 않습니다.");

    const finalName = authorName.trim() || randomNick();
    setSubmitting(true);
    try {
      setName(finalName);
      if (em) setEmail(em);
      const created = (await apiSend("POST", "/api/feedbacks", {
        projectId: Number(projectId),
        title,
        content,
        authorName: finalName,
        authorEmail: em || undefined,
        labelIds,
        isPrivate,
        accessPassword: isPrivate ? accessPassword : undefined,
      })) as { id: number };

      for (const f of files) {
        await apiUpload(`/api/feedbacks/${created.id}/attachments`, f, {
          feedbackPassword: isPrivate ? accessPassword : undefined,
        });
      }
      toast.success("피드백이 등록되었습니다.");
      router.push(`/issues/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "등록에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">작성자 정보</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              이름 <span className="text-slate-400 font-normal">(선택)</span>
            </Label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="신예준 조교 (비우면 임의의 닉네임)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              이메일 <span className="text-slate-400 font-normal">(선택)</span>
            </Label>
            <Input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="입력 시 진행 상황을 메일로 안내 드립니다"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <Label>
            프로젝트 <span className="text-rose-500">*</span>
          </Label>
          <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="선택">
                {(v: string) => {
                  const p = projects.find((x) => String(x.id) === v);
                  return p ? projectDisplay(p) : "선택";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {projectDisplay(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>분류</Label>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => {
              const on = labelIds.includes(l.id);
              return (
                <button key={l.id} type="button" onClick={() => toggleLabel(l.id)} className="transition">
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
            {labels.length === 0 && <span className="text-sm text-slate-400">분류가 없습니다.</span>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <Label>
            제목 <span className="text-rose-500">*</span>
          </Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="무엇에 대한 피드백인가요?" />
        </div>

        <div className="space-y-1.5">
          <Label>
            내용 <span className="text-rose-500">*</span>
          </Label>
          <Tabs defaultValue="write">
            <TabsList>
              <TabsTrigger value="write">작성</TabsTrigger>
              <TabsTrigger value="preview">미리보기</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  "마크다운을 쓸 수 있어요:\n**굵게**, *기울임*, `코드`\n- 목록 항목\n1. 번호 목록\n# 제목\n[링크 이름](https://...)\n> 인용\n줄바꿈은 <br>"
                }
                className="min-h-44"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="rounded-lg border p-4 min-h-44 bg-white">
                {content ? (
                  <Markdown>{content}</Markdown>
                ) : (
                  <p className="text-slate-400 text-sm">미리볼 내용이 없습니다.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label>첨부</Label>
          <div className="flex items-center gap-2 flex-wrap">
            <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
              <Paperclip className="size-4" />
              파일 추가
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files ?? [])])}
              />
            </label>
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-sm bg-slate-100 rounded-md px-2 py-1">
                {f.name}
                <button type="button" onClick={() => setFiles((p) => p.filter((_, x) => x !== i))}>
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-dashed p-4 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isPrivate} onCheckedChange={(v) => setIsPrivate(!!v)} />
            <Lock className="size-4 text-slate-400" />
            <span className="text-sm font-medium">비공개로 등록</span>
          </label>
          {isPrivate && (
            <div className="space-y-1.5 pl-6">
              <Input
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                placeholder="열람 비밀번호"
                className="max-w-xs"
              />
              <p className="text-xs text-slate-500">
                비밀번호를 공유한 사람과 개발자만 내용을 볼 수 있습니다. 목록에는 상태만 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()} disabled={submitting} size="lg">
          취소
        </Button>
        <Button onClick={submit} disabled={submitting} size="lg">
          {submitting ? "등록 중..." : "등록하기"}
        </Button>
      </div>
    </div>
  );
}
