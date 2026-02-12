import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { DashboardOverview } from "@/components/DashboardOverview";

export default function Home() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your account activity and recent payments."
        action={
          <Link
            href="/pay"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-surface-950 shadow-glow-brand hover:from-brand-400 hover:to-brand-500 transition-all focus-ring"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Send payment
          </Link>
        }
      />
      <DashboardOverview />
    </>
  );
}
