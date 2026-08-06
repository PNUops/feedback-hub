import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAdmin, canViewFeedback, hashAccessPassword } from "@/lib/auth";
import { isClosed } from "@/lib/status";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feedback = await prisma.feedback.findUnique({
    where: { id: Number(id) },
    include: {
      project: { select: { id: true, key: true, name: true, domain: true } },
      labels: { select: { id: true, name: true, color: true } },
      attachments: {
        where: { commentId: null },
        select: { id: true, originalName: true, contentType: true, size: true },
      },
    },
  });
  if (!feedback) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });

  const allowed = await canViewFeedback(req, feedback);
  if (!allowed) {
    // 잠금 상태: 상태·번호·프로젝트만 노출, 내용은 감춘다.
    return Response.json(
      {
        locked: true,
        id: feedback.id,
        number: feedback.number,
        status: feedback.status,
        closed: isClosed(feedback.status),
        isPrivate: true,
        project: feedback.project,
      },
      { status: 401 },
    );
  }

  const reactions = await prisma.reaction.findMany({
    where: { targetType: "FEEDBACK", targetId: feedback.id },
    select: { emoji: true, actorName: true },
  });

  const { accessPasswordHash: _pw, authorEmail: _email, ...rest } = feedback;
  void _pw;
  void _email;
  return Response.json({ ...rest, closed: isClosed(feedback.status), reactions });
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(20000).optional(),
  projectId: z.number().int().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  isPrivate: z.boolean().optional(),
  accessPassword: z.string().min(1).max(100).optional(),
  // 작성자 본인 수정용(이름 일치 확인). 개발자는 불필요.
  authorName: z.string().max(50).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const d = parsed.data;

  const fb = await prisma.feedback.findUnique({
    where: { id: Number(id) },
    select: { authorName: true },
  });
  if (!fb) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });

  const admin = isAdmin(req);
  const authorMatch = !!d.authorName && d.authorName === fb.authorName;
  if (!admin && !authorMatch) {
    return Response.json({ error: "본인 또는 개발자만 수정할 수 있습니다." }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (d.title !== undefined) data.title = d.title;
  if (d.content !== undefined) data.content = d.content;
  if (d.projectId !== undefined) data.projectId = d.projectId;
  // 우선순위·비공개 전환은 개발자만.
  if (admin) {
    if (d.priority !== undefined) data.priority = d.priority;
    if (d.isPrivate !== undefined) {
      data.isPrivate = d.isPrivate;
      if (d.isPrivate && d.accessPassword) data.accessPasswordHash = await hashAccessPassword(d.accessPassword);
      if (!d.isPrivate) data.accessPasswordHash = null;
    }
  }
  const updated = await prisma.feedback.update({ where: { id: Number(id) }, data });
  return Response.json({ id: updated.id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  await prisma.feedback.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}
