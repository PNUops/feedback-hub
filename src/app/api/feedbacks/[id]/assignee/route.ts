import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  assignee: z.string().max(50).nullable(),
  actorName: z.string().max(50).optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const feedbackId = Number(id);
  const actor = parsed.data.actorName?.trim() || "개발자";
  const assignee = parsed.data.assignee?.trim() || null;

  const current = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { assignee: true },
  });
  if (!current) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.feedback.update({ where: { id: feedbackId }, data: { assignee } });
    if (current.assignee !== assignee) {
      await tx.timelineEvent.create({
        data: {
          feedbackId,
          type: assignee ? "ASSIGNED" : "UNASSIGNED",
          actorName: actor,
          fromValue: current.assignee ?? undefined,
          toValue: assignee ?? undefined,
        },
      });
    }
  });

  return Response.json({ ok: true });
}
