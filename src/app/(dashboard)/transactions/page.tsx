import { PageHeader } from "@/components/PageHeader";
import { TransactionsPage } from "@/components/TransactionsPage";

export default function TransactionsRoute() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="View and filter all your payment history."
        breadcrumbs={[{ label: "Transactions" }]}
      />
      <TransactionsPage />
    </>
  );
}
