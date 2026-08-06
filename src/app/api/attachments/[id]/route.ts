import { prisma } from "@/lib/prisma";
import { canViewFeedback } from "@/lib/auth";
import { readStored } from "@/lib/files";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const att = await prisma.attachment.findUnique({
    where: { id: Number(id) },
    include: {
      feedback: { select: { isPrivate: true, accessPasswordHash: true } },
      comment: { select: { feedback: { select: { isPrivate: true, accessPasswordHash: true } } } },
    },
  });
  if (!att) return Response.json({ error: "없는 첨부입니다." }, { status: 404 });

  const fb = att.feedback ?? att.comment?.feedback;
  if (fb && !(await canViewFeedback(req, fb)))
    return Response.json({ error: "열람 권한이 없습니다." }, { status: 401 });

  const buf = await readStored(att.storedName);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": att.contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(att.originalName)}`,
      "Content-Length": String(att.size),
    },
  });
}
