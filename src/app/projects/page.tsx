"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiGet, apiSend } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Project = {
  id: number;
  key: string;
  name: string;
  domain: string | null;
  description: string | null;
  isActive: boolean;
};

export default function ProjectsPage() {
  const { isAdmin } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [desc, setDesc] = useState("");

  const load = () => apiGet("/api/projects").then(setProjects).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  if (!isAdmin) return <p className="text-slate-500">개발자 모드에서만 접근할 수 있습니다.</p>;

  async function add() {
    if (!key.trim() || !name.trim()) return toast.error("약칭과 정식명을 입력하세요.");
    try {
      await apiSend("POST", "/api/projects", { key, name, domain: domain || undefined, description: desc || undefined });
      setKey("");
      setName("");
      setDomain("");
      setDesc("");
      load();
      toast.success("프로젝트를 추가했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold">프로젝트 관리</h1>

      <Card className="p-4 space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">약칭 (영문)</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="예) opus" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-500">정식명</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) SW프로젝트관리시스템" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">도메인 (선택)</label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="예) opus.pusan.ac.kr" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">설명 (선택)</label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <Button onClick={add}>추가</Button>
        </div>
      </Card>

      <Card className="divide-y">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <span className="font-medium">{p.name}</span>
            <span className="text-xs text-slate-400 rounded bg-slate-100 px-1.5 py-0.5">{p.key}</span>
            {p.domain && <span className="text-sm text-slate-500">{p.domain}</span>}
          </div>
        ))}
      </Card>
    </div>
  );
}
