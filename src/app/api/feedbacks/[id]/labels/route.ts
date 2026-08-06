import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const schema = z.object({
  labelIds: z.array(z.number().int()),
  actorName: z.string().max(50).optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const feedbackId = Number(id);
  const actor = parsed.data.actorName?.trim() || "개발자";
  const next = new Set(parsed.data.labelIds);

  const current = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { authorName: true, labels: { select: { id: true, name: true } } },
  });
  if (!current) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });

  const authorMatch = !!parsed.data.actorName?.trim() && parsed.data.actorName.trim() === current.authorName;
  if (!isAdmin(req) && !authorMatch) {
    return Response.json({ error: "본인 또는 개발자만 분류를 수정할 수 있습니다." }, { status: 403 });
  }

  const currentIds = new Set(current.labels.map((l) => l.id));
  const added = [...next].filter((x) => !currentIds.has(x));
  const removed = current.labels.filter((l) => !next.has(l.id));

  const addedNames = added.length
    ? (await prisma.label.findMany({ where: { id: { in: added } }, select: { name: true } })).map((l) => l.name)
    : [];

  await prisma.$transaction(async (tx) => {
    await tx.feedback.update({
      where: { id: feedbackId },
      data: { labels: { set: parsed.data.labelIds.map((lid) => ({ id: lid })) } },
    });
    for (const name of addedNames) {
      await tx.timelineEvent.create({
        data: { feedbackId, type: "LABELED", actorName: actor, toValue: name },
      });
    }
    for (const l of removed) {
      await tx.timelineEvent.create({
        data: { feedbackId, type: "UNLABELED", actorName: actor, fromValue: l.name },
      });
    }
  });

  return Response.json({ ok: true });
}
