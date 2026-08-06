import { prisma } from "@/lib/prisma";
import { canViewFeedback } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fb = await prisma.feedback.findUnique({
    where: { id: Number(id) },
    select: { isPrivate: true, accessPasswordHash: true },
  });
  if (!fb) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });
  if (!(await canViewFeedback(req, fb))) return Response.json({ error: "열람 권한이 없습니다." }, { status: 401 });

  const events = await prisma.timelineEvent.findMany({
    where: { feedbackId: Number(id) },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(events);
}
