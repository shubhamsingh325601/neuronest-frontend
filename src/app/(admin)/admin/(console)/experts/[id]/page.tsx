import { ExpertDetailPage } from "@/modules/admin/features/experts/expert-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExpertDetailPage id={id} />;
}
