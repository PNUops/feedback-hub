import { z } from "zod";
import { verifyFeedbackPassword } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "비밀번호를 입력하세요." }, { status: 400 });
  const ok = await verifyFeedbackPassword(Number(id), parsed.data.password);
  if (!ok) return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  return Response.json({ ok: true });
}
