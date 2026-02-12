import { PageHeader } from "@/components/PageHeader";
import { RecipientsPage } from "@/components/RecipientsPage";

export default function RecipientsRoute() {
  return (
    <>
      <PageHeader
        title="Recipients"
        description="Manage your saved beneficiaries for quick payments."
      />
      <RecipientsPage />
    </>
  );
}
