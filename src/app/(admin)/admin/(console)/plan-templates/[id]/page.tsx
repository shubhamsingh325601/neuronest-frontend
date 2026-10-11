import { TemplateDetailPage } from "@/modules/admin/features/plan-templates/template-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateDetailPage id={id} />;
}
