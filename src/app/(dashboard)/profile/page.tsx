import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { SignInActivity } from "@/components/SignInActivity";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your account details and security."
      />
      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-surface-400">Name</dt>
              <dd className="mt-1 text-white font-medium">{session?.user?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-surface-400">Email</dt>
              <dd className="mt-1 text-white font-medium">{session?.user?.email ?? "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
          <p className="text-surface-400 text-sm mb-4">
            Change your password or enable two-factor authentication from a secure device.
          </p>
          <button
            type="button"
            disabled
            className="rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-2.5 text-sm font-medium text-surface-400 cursor-not-allowed"
          >
            Change password (coming soon)
          </button>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent sign-ins</h2>
          <p className="text-surface-400 text-sm mb-4">
            Devices and locations where your account was used. Contact support if you see unfamiliar activity.
          </p>
          <SignInActivity />
        </Card>
      </div>
    </>
  );
}
