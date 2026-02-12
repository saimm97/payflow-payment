import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-950 px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-surface-700">404</p>
        <h1 className="text-2xl font-semibold text-white mt-4">Page not found</h1>
        <p className="text-surface-400 mt-2 text-sm">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-8 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
