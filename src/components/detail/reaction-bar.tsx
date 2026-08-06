"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { apiSend } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ReactionItem = { emoji: string; actorName: string };
const PALETTE = ["👍", "❤️", "🎉", "😄", "🚀", "👀"];

export function ReactionBar({
  targetType,
  targetId,
  reactions,
  feedbackPassword,
  onChange,
}: {
  targetType: "FEEDBACK" | "COMMENT";
  targetId: number;
  reactions: ReactionItem[];
  feedbackPassword?: string | null;
  onChange: () => void;
}) {
  const { name } = useApp();
  const [busy, setBusy] = useState(false);

  const grouped = new Map<string, string[]>();
  for (const r of reactions) {
    grouped.set(r.emoji, [...(grouped.get(r.emoji) ?? []), r.actorName]);
  }

  async function toggle(emoji: string) {
    if (!name) return toast.error("먼저 이름을 설정하세요.");
    setBusy(true);
    try {
      await apiSend(
        "POST",
        "/api/reactions",
        { targetType, targetId, emoji, actorName: name },
        { feedbackPassword },
      );
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {[...grouped.entries()].map(([emoji, actors]) => {
        const mine = name ? actors.includes(name) : false;
        return (
          <button
            key={emoji}
            disabled={busy}
            onClick={() => toggle(emoji)}
            title={actors.join(", ")}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition",
              mine ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50",
            )}
          >
            <span>{emoji}</span>
            <span className="text-xs text-slate-600">{actors.length}</span>
          </button>
        );
      })}
      <Popover>
        <PopoverTrigger
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-500 hover:bg-slate-50"
          title="반응 추가"
        >
          <SmilePlus className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5">
          <div className="flex gap-1">
            {PALETTE.map((e) => (
              <button
                key={e}
                onClick={() => toggle(e)}
                className="text-lg rounded p-1 hover:bg-slate-100"
              >
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
