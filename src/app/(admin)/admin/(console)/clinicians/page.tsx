import { PLACEHOLDERS } from "@/modules/admin/features/placeholder/content";
import { PlaceholderPage } from "@/modules/admin/features/placeholder/placeholder-page";

export default function Page() {
  return <PlaceholderPage {...PLACEHOLDERS.clinicians} />;
}
