import { prisma } from "@/lib/prisma";
import { NewFeedbackForm } from "@/components/new-feedback-form";

export const dynamic = "force-dynamic";

export default async function NewIssuePage() {
  const [projects, labels] = await Promise.all([
    prisma.project.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.label.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">피드백 추가</h1>
      <NewFeedbackForm projects={projects} labels={labels} />
    </div>
  );
}
