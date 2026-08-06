"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Status, Priority } from "@prisma/client";
import { useApp } from "@/components/app-provider";
import { apiSend } from "@/lib/api";
import { STATUS_LABEL, STATUS_ORDER, PRIORITY_LABEL } from "@/lib/status";
import { LabelChip } from "@/components/badges";
import { Button } from "@/components/ui/button";
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

type LabelT = { id: number; name: string; color: string };

export function AdminSidebar({
  feedback,
  projectLabel,
  allLabels,
  onChange,
}: {
  feedback: {
    id: number;
    status: Status;
    priority: Priority;
    assignee: string | null;
    plannedDate: string | null;
    resolutionNote: string | null;
    labels: { id: number; name: string; color: string }[];
  };
  projectLabel: string;
  allLabels: LabelT[];
  onChange: () => void;
}) {
  const { ensureName } = useApp();

  const [status, setStatus] = useState<Status>(feedback.status);
  const [plannedDate, setPlannedDate] = useState(feedback.plannedDate ? feedback.plannedDate.slice(0, 10) : "");
  const [note, setNote] = useState(feedback.resolutionNote ?? "");
  const [assignee, setAssignee] = useState(feedback.assignee ?? "");
  const [labelIds, setLabelIds] = useState<number[]>(feedback.labels.map((l) => l.id));
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const saveStatus = () =>
    run(
      () =>
        apiSend("PATCH", `/api/feedbacks/${feedback.id}/status`, {
          status,
          plannedDate: status === "PLANNED" && plannedDate ? new Date(plannedDate).toISOString() : null,
          resolutionNote: note || null,
          actorName: ensureName(),
        }),
      "상태를 변경했습니다.",
    );

  const saveAssignee = () =>
    run(
      () => apiSend("PUT", `/api/feedbacks/${feedback.id}/assignee`, { assignee: assignee || null, actorName: ensureName() }),
      "담당자를 저장했습니다.",
    );

  const savePriority = (p: Priority) =>
    run(() => apiSend("PATCH", `/api/feedbacks/${feedback.id}`, { priority: p }), "우선순위를 변경했습니다.");

  const saveLabels = (ids: number[]) =>
    run(() => apiSend("PUT", `/api/feedbacks/${feedback.id}/labels`, { labelIds: ids, actorName: ensureName() }), "분류를 저장했습니다.");

  const toggleLabel = (id: number) => {
    const next = labelIds.includes(id) ? labelIds.filter((x) => x !== id) : [...labelIds, id];
    setLabelIds(next);
    saveLabels(next);
  };

  return (
    <aside className="space-y-5 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-primary uppercase tracking-wide">개발자 도구</div>

      <div className="text-sm">
        <div className="text-slate-400 text-xs mb-0.5">프로젝트</div>
        {projectLabel}
      </div>

      <div className="space-y-2">
        <Label>상태</Label>
        <Select value={status} onValueChange={(v) => v && setStatus(v as Status)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => STATUS_LABEL[v as Status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {status === "PLANNED" && (
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">예정일</Label>
            <Input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          </div>
        )}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="사유나 안내 (선택)"
          className="min-h-16 text-sm"
        />
        <Button size="sm" className="w-full" disabled={busy} onClick={saveStatus}>
          상태 저장
        </Button>
      </div>

      <div className="space-y-2">
        <Label>담당자</Label>
        <div className="flex gap-1">
          <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="미지정" />
          <Button size="sm" variant="outline" disabled={busy} onClick={saveAssignee}>
            저장
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>우선순위</Label>
        <Select value={feedback.priority} onValueChange={(v) => v && savePriority(v as Priority)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => PRIORITY_LABEL[v as Priority]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>분류</Label>
        <div className="space-y-1.5">
          {allLabels.map((l) => (
            <label key={l.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={labelIds.includes(l.id)} onCheckedChange={() => toggleLabel(l.id)} disabled={busy} />
              <LabelChip name={l.name} color={l.color} />
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
