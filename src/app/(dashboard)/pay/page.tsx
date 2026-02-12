import { PageHeader } from "@/components/PageHeader";
import { PaymentForm } from "@/components/PaymentForm";

export default function PayPage() {
  return (
    <>
      <PageHeader
        title="Send payment"
        description="Enter payment details below. Card information is validated locally and not stored."
      />
      <div className="max-w-2xl">
        <PaymentForm />
      </div>
    </>
  );
}
