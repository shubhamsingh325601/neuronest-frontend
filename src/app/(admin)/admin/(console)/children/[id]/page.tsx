import { ChildDetailPage } from "@/modules/admin/features/children/child-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChildDetailPage id={id} />;
}
