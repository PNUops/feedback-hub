"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LabelChip } from "@/components/badges";
import { projectDisplay } from "@/lib/project";

type Project = { id: number; name: string; key: string; domain: string | null };
type LabelT = { id: number; name: string; color: string };

export function FilterBar({ projects, labels }: { projects: Project[]; labels: LabelT[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const selectedProjects = sp.get("projects")?.split(",").filter(Boolean) ?? [];
  const selectedLabels = sp.get("labels")?.split(",").filter(Boolean) ?? [];

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      const qs = next.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [router, sp],
  );

  const toggleFrom = (list: string[], value: string, key: string) => {
    const set = new Set(list);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setParam(key, [...set].join(",") || null);
  };

  return (
    <Card className="p-4">
      <div className="divide-y divide-slate-100">
        <div className="pb-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">프로젝트</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {projects.map((p) => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={selectedProjects.includes(String(p.id))}
                  onCheckedChange={() => toggleFrom(selectedProjects, String(p.id), "projects")}
                />
                <span>{projectDisplay(p)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">분류</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {labels.map((l) => (
              <label key={l.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedLabels.includes(l.name)}
                  onCheckedChange={() => toggleFrom(selectedLabels, l.name, "labels")}
                />
                <LabelChip name={l.name} color={l.color} />
              </label>
            ))}
            {labels.length === 0 && <span className="text-sm text-slate-400">분류가 없습니다.</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
