import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  note: z.string().max(2000).nullable(),
});

/** 타임라인 이벤트의 사유/안내 노트 수정(개발자 전용). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });

  const note = parsed.data.note?.trim() || null;
  const event = await prisma.timelineEvent.update({
    where: { id: Number(id) },
    data: { note },
  });
  return Response.json(event);
}
