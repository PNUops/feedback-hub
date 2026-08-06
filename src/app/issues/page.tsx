import { redirect } from "next/navigation";

type SP = Record<string, string | string[] | undefined>;

export default async function IssuesRedirect({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v) && v[0]) sp.set(k, v[0]);
  }
  const qs = sp.toString();
  redirect(qs ? `/?${qs}` : "/");
}
