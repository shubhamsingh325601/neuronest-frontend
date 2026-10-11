"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "../../app-shell/page-header";
import { LoadingState } from "../../app-shell/states";

// The builder is only needed on this page, so it is its own chunk.
const TemplateBuilder = dynamic(() => import("./components/template-builder"), {
  loading: () => <LoadingState label="Loading the template builder" />,
});

export function NewTemplatePage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="New plan template" description="Write the days of a care plan. It is saved as a draft until you publish it." />
      <TemplateBuilder />
    </div>
  );
}
