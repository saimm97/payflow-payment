import { PageHeader } from "@/components/PageHeader";
import { RequestsPage } from "@/components/RequestsPage";

export default function RequestsRoute() {
  return (
    <>
      <PageHeader
        title="Request payment"
        description="Create and manage payment requests from others."
        breadcrumbs={[{ label: "Request payment" }]}
      />
      <RequestsPage />
    </>
  );
}
