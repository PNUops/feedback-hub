"use client";

import { Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { COOKIE_ADMIN, getCookie } from "@/lib/cookies";

export type AttachmentItem = {
  id: number;
  originalName: string;
  contentType: string;
  size: number;
};

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** 헤더(관리자/비공개 비번)를 실어 받아야 하므로 fetch → blob → 새 탭. */
async function open(id: number, name: string, feedbackPassword?: string | null) {
  const headers: Record<string, string> = {};
  const admin = getCookie(COOKIE_ADMIN);
  if (admin) headers["x-admin-password"] = admin;
  if (feedbackPassword) headers["x-feedback-password"] = feedbackPassword;
  try {
    const res = await fetch(`/api/attachments/${id}`, { headers });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("다운로드에 실패했습니다.");
  }
}

export function AttachmentList({
  items,
  feedbackPassword,
}: {
  items: AttachmentItem[];
  feedbackPassword?: string | null;
}) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((a) => (
        <button
          key={a.id}
          onClick={() => open(a.id, a.originalName, feedbackPassword)}
          className="group inline-flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-sm hover:bg-slate-50"
        >
          <Paperclip className="size-3.5 text-slate-400" />
          <span className="max-w-48 truncate">{a.originalName}</span>
          <span className="text-xs text-slate-400">{fmtSize(a.size)}</span>
          <Download className="size-3.5 text-slate-300 group-hover:text-slate-500" />
        </button>
      ))}
    </div>
  );
}
