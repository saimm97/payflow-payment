import { PageHeader } from "@/components/PageHeader";
import { PaymentLinksPage } from "@/components/PaymentLinksPage";

export default function PaymentLinksRoute() {
  return (
    <>
      <PageHeader
        title="Payment links"
        description="Create and share payment links so others can pay you."
        breadcrumbs={[{ label: "Payment links" }]}
      />
      <PaymentLinksPage />
    </>
  );
}
