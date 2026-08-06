import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const list = await prisma.notifyEmail.findMany({ orderBy: { id: "asc" } });
  return Response.json(list);
}

const schema = z.object({
  email: z.string().email().max(120),
  label: z.string().max(50).optional(),
});

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "올바른 이메일을 입력하세요." }, { status: 400 });
  const exists = await prisma.notifyEmail.findUnique({ where: { email: parsed.data.email } });
  if (exists) return Response.json({ error: "이미 등록된 이메일입니다." }, { status: 409 });
  const created = await prisma.notifyEmail.create({
    data: { email: parsed.data.email, label: parsed.data.label || null },
  });
  return Response.json(created, { status: 201 });
}
