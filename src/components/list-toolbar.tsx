"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ListToolbar({ total }: { total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

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

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">총 {total}건</span>
      <Select value={sp.get("sort") ?? "created"} onValueChange={(v) => setParam("sort", v === "created" ? null : v)}>
        <SelectTrigger className="w-32" size="sm">
          <SelectValue>
            {(v: string) => ({ created: "최신순", updated: "업데이트순", comments: "의견순" }[v] ?? "최신순")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created">최신순</SelectItem>
          <SelectItem value="updated">업데이트순</SelectItem>
          <SelectItem value="comments">의견순</SelectItem>
        </SelectContent>
      </Select>

      <form
        className="ml-auto"
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q || null);
        }}
      >
        <div className="relative">
          <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="pl-8 h-9 w-56" />
        </div>
      </form>
    </div>
  );
}
