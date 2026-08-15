import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <Icon size={18} className={accent ? "text-primary" : "text-muted-foreground"} />}
      </div>
      <div className="font-heading text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-border" data-testid="empty-state">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5"><Icon size={26} className="text-muted-foreground" /></div>}
      <h3 className="font-heading text-lg font-semibold mb-1.5">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {children}
    </div>
  );
}

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400",
  archived: "bg-secondary text-muted-foreground",
};

export function StatusBadge({ status }) {
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.archived}`}>{status}</span>;
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
    </div>
  );
}
