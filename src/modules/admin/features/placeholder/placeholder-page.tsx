import { Construction } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { PageHeader } from "../../app-shell/page-header";
import type { PlaceholderContent } from "./content";

// An honestly labelled stand-in for a page that is not built yet.
export function PlaceholderPage({ title, description, milestone, planned }: PlaceholderContent) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        eyebrow={
          <Badge tone="warning">
            <Construction aria-hidden="true" /> Placeholder
          </Badge>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Not built yet</CardTitle>
          <CardDescription>
            This page is a frontend placeholder. The real page arrives in {milestone}, and no data is shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm font-medium">What will be here</p>
          <ul className="grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground">
            {planned.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
