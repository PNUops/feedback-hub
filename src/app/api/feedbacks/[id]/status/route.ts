import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isClosed, STATUS_LABEL } from "@/lib/status";
import { sendMail, feedbackUrl } from "@/lib/mailer";

const schema = z.object({
  status: z.enum(["RECEIVED", "REVIEWING", "PLANNED", "IN_PROGRESS", "DONE", "DEPLOYED", "REJECTED"]),
  plannedDate: z.string().datetime().nullable().optional(),
  resolutionNote: z.string().max(5000).nullable().optional(),
  actorName: z.string().max(50).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  const actor = d.actorName?.trim() || "개발자";

  const current = await prisma.feedback.findUnique({
    where: { id: Number(id) },
    select: { status: true, authorEmail: true, number: true, title: true },
  });
  if (!current) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });

  const wasClosed = isClosed(current.status);
  const nowClosed = isClosed(d.status);

  await prisma.$transaction(async (tx) => {
    await tx.feedback.update({
      where: { id: Number(id) },
      data: {
        status: d.status,
        plannedDate: d.plannedDate ? new Date(d.plannedDate) : d.plannedDate === null ? null : undefined,
        resolutionNote: d.resolutionNote === undefined ? undefined : d.resolutionNote,
      },
    });
    if (current.status !== d.status) {
      await tx.timelineEvent.create({
        data: {
          feedbackId: Number(id),
          type: "STATUS_CHANGED",
          actorName: actor,
          fromValue: current.status,
          toValue: d.status,
          note: d.resolutionNote ?? undefined,
        },
      });
      if (!wasClosed && nowClosed) {
        await tx.timelineEvent.create({
          data: { feedbackId: Number(id), type: "CLOSED", actorName: actor, toValue: d.status },
        });
      } else if (wasClosed && !nowClosed) {
        await tx.timelineEvent.create({
          data: { feedbackId: Number(id), type: "REOPENED", actorName: actor, toValue: d.status },
        });
      }
    }
  });

  if (current.authorEmail && current.status !== d.status) {
    void sendMail(
      current.authorEmail,
      `[feedback-hub] #${current.number} 상태가 '${STATUS_LABEL[d.status]}'로 변경되었습니다`,
      `피드백 "${current.title}"의 상태가 ${STATUS_LABEL[d.status]}로 변경되었습니다.\n${
        d.resolutionNote ? `사유: ${d.resolutionNote}\n` : ""
      }${feedbackUrl(Number(id))}`,
    );
  }

  return Response.json({ ok: true });
}
