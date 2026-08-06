import { prisma } from "@/lib/prisma";
import { canViewFeedback } from "@/lib/auth";
import { saveUpload, MAX_UPLOAD } from "@/lib/files";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fb = await prisma.feedback.findUnique({
    where: { id: Number(id) },
    select: { isPrivate: true, accessPasswordHash: true },
  });
  if (!fb) return Response.json({ error: "없는 피드백입니다." }, { status: 404 });
  if (!(await canViewFeedback(req, fb))) return Response.json({ error: "열람 권한이 없습니다." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "파일이 없습니다." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return Response.json({ error: "파일이 너무 큽니다." }, { status: 413 });

  const saved = await saveUpload(file);
  const attachment = await prisma.attachment.create({
    data: { feedbackId: Number(id), ...saved },
    select: { id: true, originalName: true, contentType: true, size: true },
  });
  return Response.json(attachment, { status: 201 });
}
