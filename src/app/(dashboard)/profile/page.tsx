import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { SignInActivity } from "@/components/SignInActivity";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

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
        <ChangePasswordForm />
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
