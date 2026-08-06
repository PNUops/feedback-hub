import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewFeedback } from "@/lib/auth";
import { sendMail, feedbackUrl } from "@/lib/mailer";
import { randomNick } from "@/lib/nickname";

async function loadGuarded(req: Request, id: number) {
  const fb = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, isPrivate: true, accessPasswordHash: true, authorEmail: true, authorName: true, number: true },
  });
  if (!fb) return { error: Response.json({ error: "없는 피드백입니다." }, { status: 404 }) };
  if (!(await canViewFeedback(req, fb))) return { error: Response.json({ error: "열람 권한이 없습니다." }, { status: 401 }) };
  return { fb };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadGuarded(req, Number(id));
  if (g.error) return g.error;
  const comments = await prisma.comment.findMany({
    where: { feedbackId: Number(id) },
    orderBy: { createdAt: "asc" },
    include: { attachments: { select: { id: true, originalName: true, contentType: true, size: true } } },
  });

  // 의견별 리액션(폴리모픽 대상이라 관계로 못 가져와 별도 조회 후 부착).
  const reactions = comments.length
    ? await prisma.reaction.findMany({
        where: { targetType: "COMMENT", targetId: { in: comments.map((c) => c.id) } },
        select: { targetId: true, emoji: true, actorName: true },
      })
    : [];
  const byComment = new Map<number, { emoji: string; actorName: string }[]>();
  for (const r of reactions) {
    byComment.set(r.targetId, [...(byComment.get(r.targetId) ?? []), { emoji: r.emoji, actorName: r.actorName }]);
  }

  return Response.json(comments.map((c) => ({ ...c, reactions: byComment.get(c.id) ?? [] })));
}

const schema = z.object({
  authorName: z.string().max(50).optional(),
  authorEmail: z.string().trim().email().max(120).optional().or(z.literal("")),
  content: z.string().min(1).max(10000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feedbackId = Number(id);
  const g = await loadGuarded(req, feedbackId);
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });

  const authorName = parsed.data.authorName?.trim() || randomNick();
  const authorEmail = parsed.data.authorEmail?.trim() || null;
  const comment = await prisma.comment.create({
    data: { feedbackId, authorName, authorEmail, content: parsed.data.content },
  });

  // 스레드 참여자(피드백 작성자 + 다른 댓글 작성자) 이메일로 알림. 본인 제외.
  const fb = g.fb!;
  const others = await prisma.comment.findMany({
    where: { feedbackId, authorEmail: { not: null } },
    select: { authorEmail: true },
    distinct: ["authorEmail"],
  });
  const targets = new Set<string>();
  if (fb.authorEmail) targets.add(fb.authorEmail);
  for (const o of others) if (o.authorEmail) targets.add(o.authorEmail);
  if (authorEmail) targets.delete(authorEmail);
  for (const to of targets) {
    void sendMail(
      to,
      `[Feedback Hub] #${fb.number}에 새 의견이 달렸습니다`,
      `${authorName} 님이 의견을 남겼습니다.\n${feedbackUrl(feedbackId)}`,
    );
  }

  return Response.json(comment, { status: 201 });
}
