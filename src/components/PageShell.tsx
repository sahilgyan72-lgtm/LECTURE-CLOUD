import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="horizon dotgrid min-h-screen font-display text-duskdeep">
      <SiteHeader />
      {children}
      <footer className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 pb-10">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
          LectureCloud · Built for students &amp; faculty
        </p>
        <div className="flex gap-4 font-mono text-[11px] text-white/60">
          <span>Sync</span>
          <span>Notices</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  tone = "light",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={
        dark
          ? "overflow-hidden rounded-3xl bg-duskdeep shadow-xl shadow-black/30 ring-1 ring-white/15"
          : "overflow-hidden rounded-3xl bg-white/95 shadow-xl shadow-black/20 ring-1 ring-white/60"
      }
    >
      <div
        className={
          dark
            ? "flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4"
            : "flex items-center justify-between gap-3 border-b border-duskdeep/10 px-6 py-4"
        }
      >
        <div>
          <h3 className={dark ? "text-lg font-bold text-white" : "text-lg font-bold text-duskdeep"}>
            {title}
          </h3>
          {subtitle ? (
            <p
              className={
                dark
                  ? "font-mono text-[11px] uppercase tracking-widest text-white/50"
                  : "font-mono text-[11px] uppercase tracking-widest text-duskdeep/50"
              }
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
