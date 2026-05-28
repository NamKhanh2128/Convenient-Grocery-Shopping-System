import type { ReactNode } from "react";

export function ScreenHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <section className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[8px] bg-white p-6 shadow-[0_18px_45px_rgba(64,38,99,0.18)]">
      <div>
        {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#7e65b0]">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-extrabold text-[#252033]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#746d82]">{subtitle}</p>}
      </div>
      {actions}
    </section>
  );
}
