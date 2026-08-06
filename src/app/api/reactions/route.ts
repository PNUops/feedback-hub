import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewFeedback } from "@/lib/auth";

const schema = z.object({
  targetType: z.enum(["FEEDBACK", "COMMENT"]),
  targetId: z.number().int(),
  emoji: z.string().min(1).max(8),
  actorName: z.string().min(1).max(50),
});

async function feedbackOf(targetType: "FEEDBACK" | "COMMENT", targetId: number) {
  if (targetType === "FEEDBACK") {
    return prisma.feedback.findUnique({
      where: { id: targetId },
      select: { isPrivate: true, accessPasswordHash: true },
    });
  }
  const c = await prisma.comment.findUnique({
    where: { id: targetId },
    select: { feedback: { select: { isPrivate: true, accessPasswordHash: true } } },
  });
  return c?.feedback ?? null;
}

/** 이름+이모지 토글. 있으면 제거(off), 없으면 추가(on). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const { targetType, targetId, emoji, actorName } = parsed.data;

  const fb = await feedbackOf(targetType, targetId);
  if (!fb) return Response.json({ error: "대상이 없습니다." }, { status: 404 });
  if (!(await canViewFeedback(req, fb))) return Response.json({ error: "열람 권한이 없습니다." }, { status: 401 });

  const existing = await prisma.reaction.findUnique({
    where: { targetType_targetId_emoji_actorName: { targetType, targetId, emoji, actorName } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return Response.json({ toggled: "off" });
  }
  await prisma.reaction.create({ data: { targetType, targetId, emoji, actorName } });
  return Response.json({ toggled: "on" });
}
