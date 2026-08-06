import { FeedbackDetail } from "@/components/detail/feedback-detail";

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeedbackDetail id={Number(id)} />;
}
