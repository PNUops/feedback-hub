import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const patchSchema = z.object({
  content: z.string().min(1).max(10000),
  authorName: z.string().min(1).max(50),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const comment = await prisma.comment.findUnique({ where: { id: Number(id) }, select: { authorName: true } });
  if (!comment) return Response.json({ error: "없는 의견입니다." }, { status: 404 });
  if (!isAdmin(req) && comment.authorName !== parsed.data.authorName)
    return Response.json({ error: "본인 의견만 수정할 수 있습니다." }, { status: 403 });
  const updated = await prisma.comment.update({
    where: { id: Number(id) },
    data: { content: parsed.data.content },
  });
  return Response.json({ id: updated.id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorName = new URL(req.url).searchParams.get("authorName") ?? "";
  const comment = await prisma.comment.findUnique({ where: { id: Number(id) }, select: { authorName: true } });
  if (!comment) return Response.json({ error: "없는 의견입니다." }, { status: 404 });
  if (!isAdmin(req) && comment.authorName !== authorName)
    return Response.json({ error: "본인 의견만 삭제할 수 있습니다." }, { status: 403 });
  await prisma.comment.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}
