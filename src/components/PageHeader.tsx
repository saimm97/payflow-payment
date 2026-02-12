"use client";

import Link from "next/link";
import type { BreadcrumbItem } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-surface-400 mb-3">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span aria-hidden className="text-surface-600">/</span>
              {item.href ? (
                <Link href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
              ) : (
                <span className="text-white font-medium" aria-current="page">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-surface-400 text-sm max-w-xl">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
