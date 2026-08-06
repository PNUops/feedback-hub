"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiGet, apiSend } from "@/lib/api";
import { LabelChip } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type LabelT = { id: number; name: string; color: string; description: string | null };

export default function LabelsPage() {
  const { isAdmin } = useApp();
  const [labels, setLabels] = useState<LabelT[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1d76db");
  const [desc, setDesc] = useState("");

  const load = () => apiGet("/api/labels").then(setLabels).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  if (!isAdmin) return <p className="text-slate-500">개발자 모드에서만 접근할 수 있습니다.</p>;

  async function add() {
    if (!name.trim()) return toast.error("이름을 입력하세요.");
    try {
      await apiSend("POST", "/api/labels", { name, color, description: desc || undefined });
      setName("");
      setDesc("");
      load();
      toast.success("분류를 추가했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  }
  async function remove(id: number) {
    if (!confirm("삭제할까요? 이 분류가 피드백에서 제거됩니다.")) return;
    await apiSend("DELETE", `/api/labels/${id}`);
    load();
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold">분류 관리</h1>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 성능" className="w-40" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">색상</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 rounded border p-0.5"
            />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs text-slate-500">설명 (선택)</label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <Button onClick={add}>추가</Button>
        </div>
        <div className="pt-1">
          <LabelChip name={name || "미리보기"} color={color} />
        </div>
      </Card>

      <Card className="divide-y">
        {labels.map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-3">
            <LabelChip name={l.name} color={l.color} />
            <span className="text-sm text-slate-500">{l.description}</span>
            <button onClick={() => remove(l.id)} className="ml-auto text-slate-400 hover:text-rose-600">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}
