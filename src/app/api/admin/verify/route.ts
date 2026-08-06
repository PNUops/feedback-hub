import { isAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  if (isAdmin(req)) return Response.json({ ok: true });
  return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
}
