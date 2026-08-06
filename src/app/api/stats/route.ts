import { getStats } from "@/lib/queries";

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  const stats = await getStats(projectId ? Number(projectId) : undefined);
  return Response.json(stats);
}
