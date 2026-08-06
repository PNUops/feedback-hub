"use client";

import { useEffect, useState } from "react";
import { Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiGet, apiSend } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type NotifyEmail = { id: number; email: string; label: string | null };

export default function SettingsPage() {
  const { isAdmin } = useApp();
  const [emails, setEmails] = useState<NotifyEmail[]>([]);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");

  const load = () => apiGet("/api/notify-emails").then(setEmails).catch(() => {});
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) return <p className="text-slate-500">개발자 모드에서만 접근할 수 있습니다.</p>;

  async function add() {
    if (!email.trim()) return toast.error("이메일을 입력하세요.");
    try {
      await apiSend("POST", "/api/notify-emails", { email, label: label || undefined });
      setEmail("");
      setLabel("");
      load();
      toast.success("알림 이메일을 추가했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  }
  async function remove(id: number) {
    await apiSend("DELETE", `/api/notify-emails/${id}`);
    load();
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-slate-500 text-sm mt-1">
          새 피드백이 등록되면 아래 이메일로 알림이 발송됩니다.
        </p>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">개발자 알림 이메일</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1 flex-1 min-w-52">
            <label className="text-xs text-slate-500">이메일</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev@pnu.ac.kr"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">이름 (선택)</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예) 신예준" className="w-40" />
          </div>
          <Button onClick={add}>추가</Button>
        </div>
      </Card>

      <div className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-sm text-slate-400 px-1">등록된 알림 이메일이 없습니다.</p>
        ) : (
          emails.map((e) => (
            <Card key={e.id} className="flex items-center gap-3 px-4 py-3">
              <Mail className="size-4 text-slate-400" />
              <span className="font-medium">{e.email}</span>
              {e.label && <span className="text-sm text-slate-500">{e.label}</span>}
              <button onClick={() => remove(e.id)} className="ml-auto text-slate-400 hover:text-rose-600">
                <Trash2 className="size-4" />
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
