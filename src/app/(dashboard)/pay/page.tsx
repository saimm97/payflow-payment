import { PageHeader } from "@/components/PageHeader";
import { PaymentForm } from "@/components/PaymentForm";

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ recipient?: string; amount?: string; currency?: string; description?: string; schedule?: string }>;
}) {
  const params = await searchParams;
  const recipient = params?.recipient ?? undefined;
  const amount = params?.amount != null ? parseFloat(params.amount) : undefined;
  const currency = params?.currency ?? undefined;
  const description = params?.description ?? undefined;
  const schedule = params?.schedule === "1";
  return (
    <>
      <PageHeader
        title="Send payment"
        description="Enter payment details below. Card information is validated locally and not stored."
      />
      <div className="max-w-2xl">
        <PaymentForm
          prefilled={
            recipient || amount != null || currency || description || schedule
              ? { recipient, amount, currency, description, schedule }
              : undefined
          }
        />
      </div>
    </>
  );
}
