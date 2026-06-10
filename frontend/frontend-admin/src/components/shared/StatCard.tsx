import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: { value: number; label: string; positive?: boolean };
  color?: "primary" | "success" | "warning" | "destructive";
  to?: string; // Clickable card → navigate
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
  to,
  onClick,
}: StatCardProps) {
  // Setup color maps
  const colorMap = {
    primary: {
      bg: "bg-[#eee9f7] text-[#7655aa]",
      border: "border-[#7655aa]/10 hover:border-[#7655aa]/30",
      accent: "text-[#7655aa]",
    },
    success: {
      bg: "bg-emerald-500/10 text-emerald-600",
      border: "border-emerald-500/10 hover:border-emerald-500/30",
      accent: "text-emerald-600",
    },
    warning: {
      bg: "bg-amber-500/10 text-amber-600",
      border: "border-amber-500/10 hover:border-amber-500/30",
      accent: "text-amber-600",
    },
    destructive: {
      bg: "bg-rose-500/10 text-rose-600",
      border: "border-rose-500/10 hover:border-rose-500/30",
      accent: "text-rose-600",
    },
  };

  const currentStyles = colorMap[color];

  const CardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-105 origin-left">
            {value}
          </h3>
        </div>
        <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110", currentStyles.bg)}>
          <Icon className="h-5 w-5 shrink-0" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3 w-3 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3 w-3 shrink-0" />
            )}
            {trend.value}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </>
  );

  const containerClassName = cn(
    "group relative block p-6 rounded-[20px] border border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] overflow-hidden",
    currentStyles.border,
    (to || onClick) && "cursor-pointer"
  );

  if (to) {
    return (
      <Link to={to} className={containerClassName}>
        {CardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(containerClassName, "w-full text-left font-normal")}
      >
        {CardContent}
      </button>
    );
  }

  return <div className={containerClassName}>{CardContent}</div>;
}
