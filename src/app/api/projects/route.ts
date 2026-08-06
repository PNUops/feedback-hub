import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return Response.json(projects);
}

const createSchema = z.object({
  key: z.string().min(1).max(32).regex(/^[a-z0-9-]+$/, "소문자, 숫자, 하이픈만"),
  name: z.string().min(1).max(100),
  domain: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const exists = await prisma.project.findUnique({ where: { key: parsed.data.key } });
  if (exists) return Response.json({ error: "이미 존재하는 약칭입니다." }, { status: 409 });
  const project = await prisma.project.create({ data: parsed.data });
  return Response.json(project, { status: 201 });
}
