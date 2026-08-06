import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashAccessPassword, isAdmin } from "@/lib/auth";
import { filterFromParams, listFeedbacks } from "@/lib/queries";
import { sendMail, feedbackUrl } from "@/lib/mailer";
import { randomNick } from "@/lib/nickname";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const result = await listFeedbacks(filterFromParams(sp), isAdmin(req));
  return Response.json(result);
}

const createSchema = z.object({
  projectId: z.number().int(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
  authorName: z.string().max(50).optional(),
  authorEmail: z.string().trim().email().max(120).optional().or(z.literal("")),
  labelIds: z.array(z.number().int()).optional(),
  isPrivate: z.boolean().optional(),
  accessPassword: z.string().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const d = parsed.data;

  if (d.isPrivate && !d.accessPassword) {
    return Response.json({ error: "비공개 피드백은 열람 비밀번호가 필요합니다." }, { status: 400 });
  }
  const accessPasswordHash =
    d.isPrivate && d.accessPassword ? await hashAccessPassword(d.accessPassword) : null;
  const authorName = d.authorName?.trim() || randomNick();

  // 프로젝트별 순번 부여 + 유니크 충돌 시 재시도.
  let created;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      created = await prisma.$transaction(async (tx) => {
        const last = await tx.feedback.findFirst({
          where: { projectId: d.projectId },
          orderBy: { number: "desc" },
          select: { number: true },
        });
        const number = (last?.number ?? 0) + 1;
        return tx.feedback.create({
          data: {
            projectId: d.projectId,
            number,
            title: d.title,
            content: d.content,
            authorName,
            authorEmail: d.authorEmail || null,
            isPrivate: d.isPrivate ?? false,
            accessPasswordHash,
            labels: d.labelIds?.length ? { connect: d.labelIds.map((id) => ({ id })) } : undefined,
          },
          select: { id: true, number: true, title: true },
        });
      });
      break;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "P2002") continue; // number 경쟁 → 재시도
      throw e;
    }
  }
  if (!created) return Response.json({ error: "피드백 생성에 실패했습니다." }, { status: 500 });

  // 새 피드백 알림: 등록된 개발자 이메일 전체 + (있으면) ADMIN_NOTIFY_EMAIL.
  const devEmails = (await prisma.notifyEmail.findMany({ select: { email: true } })).map((x) => x.email);
  const envNotify = process.env.ADMIN_NOTIFY_EMAIL;
  const targets = [...new Set([...devEmails, ...(envNotify ? [envNotify] : [])])];
  for (const to of targets) {
    void sendMail(
      to,
      `[Feedback Hub] 새 피드백 #${created.number}: ${created.title}`,
      `${authorName} 님이 새 피드백을 등록했습니다.\n${feedbackUrl(created.id)}`,
    );
  }

  return Response.json(created, { status: 201 });
}
