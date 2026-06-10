import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[20px] bg-card p-6 shadow-card border border-border/40",
        className
      )}
    >
      <div className="space-y-1.5 flex-1 min-w-[280px]">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 transition-colors hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <Fragment key={idx}>
                <ChevronRight className="h-3 w-3 shrink-0" />
                {crumb.to ? (
                  <Link to={crumb.to} className="transition-colors hover:text-primary">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground/80 font-bold">{crumb.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm font-medium text-muted-foreground/80">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </section>
  );
}
