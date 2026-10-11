import { UserDetailPage } from "@/modules/admin/features/users/user-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserDetailPage id={id} />;
}
