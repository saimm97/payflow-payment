import { PageHeader } from "@/components/PageHeader";
import { ScheduledPage } from "@/components/ScheduledPage";

export default function ScheduledRoute() {
  return (
    <>
      <PageHeader
        title="Scheduled payments"
        description="View and manage payments scheduled for a future date."
        breadcrumbs={[{ label: "Scheduled" }]}
      />
      <ScheduledPage />
    </>
  );
}
