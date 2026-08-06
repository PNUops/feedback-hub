import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const schema = z.object({
  closed: z.boolean(),
  actorName: z.string().max(50).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const { closed } = parsed.data;

  const fb = await prisma.feedback.findUnique({
    where: { id: Number(id) },
    select: { authorName: true, status: true, statusBeforeWithdraw: true },
  });
  if (!fb) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });

  const admin = isAdmin(req);
  const actorName = parsed.data.actorName?.trim();
  const authorMatch = !!actorName && actorName === fb.authorName;
  if (!admin && !authorMatch) {
    return Response.json({ error: "본인 또는 개발자만 닫을 수 있습니다." }, { status: 403 });
  }
  const actor = actorName || (admin ? "개발자" : "작성자");

  if (closed) {
    if (fb.status === "WITHDRAWN") return Response.json({ ok: true });
    await prisma.$transaction([
      prisma.feedback.update({
        where: { id: Number(id) },
        data: { status: "WITHDRAWN", statusBeforeWithdraw: fb.status },
      }),
      prisma.timelineEvent.create({
        data: {
          feedbackId: Number(id),
          type: "STATUS_CHANGED",
          actorName: actor,
          fromValue: fb.status,
          toValue: "WITHDRAWN",
          note: "작성자 철회",
        },
      }),
    ]);
  } else {
    if (fb.status !== "WITHDRAWN") return Response.json({ ok: true });
    const restored = fb.statusBeforeWithdraw ?? "RECEIVED";
    await prisma.$transaction([
      prisma.feedback.update({
        where: { id: Number(id) },
        data: { status: restored, statusBeforeWithdraw: null },
      }),
      prisma.timelineEvent.create({
        data: {
          feedbackId: Number(id),
          type: "REOPENED",
          actorName: actor,
          fromValue: "WITHDRAWN",
          toValue: restored,
        },
      }),
    ]);
  }
  return Response.json({ ok: true });
}
