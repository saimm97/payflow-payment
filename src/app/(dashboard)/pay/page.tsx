import { PageHeader } from "@/components/PageHeader";
import { PaymentForm } from "@/components/PaymentForm";

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ recipient?: string }>;
}) {
  const params = await searchParams;
  const recipient = params?.recipient ?? undefined;
  return (
    <>
      <PageHeader
        title="Send payment"
        description="Enter payment details below. Card information is validated locally and not stored."
      />
      <div className="max-w-2xl">
        <PaymentForm prefilled={recipient ? { recipient } : undefined} />
      </div>
    </>
  );
}
