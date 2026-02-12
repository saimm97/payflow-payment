interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-800/60 ${className}`}
      aria-hidden
    />
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-surface-800/80">
      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
    </tr>
  );
}
