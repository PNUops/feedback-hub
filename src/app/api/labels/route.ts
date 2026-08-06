import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const labels = await prisma.label.findMany({ orderBy: { id: "asc" } });
  return Response.json(labels);
}

const createSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex 색상"),
  description: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const exists = await prisma.label.findUnique({ where: { name: parsed.data.name } });
  if (exists) return Response.json({ error: "이미 존재하는 라벨입니다." }, { status: 409 });
  const label = await prisma.label.create({ data: parsed.data });
  return Response.json(label, { status: 201 });
}
