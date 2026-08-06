"use client";

import { useEffect, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiSend, apiUpload } from "@/lib/api";
import { cn } from "@/lib/utils";
import { randomNick } from "@/lib/nickname";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CommentBox({
  feedbackId,
  feedbackPassword,
  onPosted,
}: {
  feedbackId: number;
  feedbackPassword?: string | null;
  onPosted: () => void;
}) {
  const { name, setName, email, setEmail } = useApp();
  const [author, setAuthor] = useState(name ?? "");
  const [authorEmail, setAuthorEmail] = useState(email ?? "");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  // 상단바에서 이름/이메일을 바꾸면 즉시 반영.
  useEffect(() => setAuthor(name ?? ""), [name]);
  useEffect(() => setAuthorEmail(email ?? ""), [email]);

  async function submit() {
    if (!content.trim()) return toast.error("내용을 입력하세요.");
    const em = authorEmail.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast.error("이메일 형식이 올바르지 않습니다.");
    const finalName = author.trim() || randomNick();
    setBusy(true);
    try {
      setName(finalName);
      if (em) setEmail(em);
      const c = (await apiSend(
        "POST",
        `/api/feedbacks/${feedbackId}/comments`,
        { authorName: finalName, authorEmail: em || undefined, content },
        { feedbackPassword },
      )) as { id: number };
      for (const f of files) {
        await apiUpload(`/api/comments/${c.id}/attachments`, f, { feedbackPassword });
      }
      setContent("");
      setFiles([]);
      onPosted();
      toast.success("의견을 남겼습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3 space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">이름 (선택)</label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="h-8"
            placeholder="신예준 조교 (비우면 임의의 닉네임)"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">이메일 (선택)</label>
          <Input
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="h-8"
            placeholder="입력 시 새 의견을 메일로 안내 드립니다"
          />
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="의견을 남겨주세요. 마크다운을 쓸 수 있습니다."
        className="min-h-24"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
          <Paperclip className="size-4" />
          첨부
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files ?? [])])}
          />
        </label>
        {files.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded px-2 py-1">
            {f.name}
            <button onClick={() => setFiles((p) => p.filter((_, x) => x !== i))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Button size="sm" className="ml-auto" disabled={busy} onClick={submit}>
          의견 등록
        </Button>
      </div>
    </div>
  );
}
