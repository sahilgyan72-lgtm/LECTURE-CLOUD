import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const links = [
  { to: "/", label: "Timetable" },
  { to: "/faculty", label: "Faculty" },
  { to: "/announcements", label: "Announcements" },
  { to: "/attendance", label: "Attendance" },
] as const;

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="chrome grid size-10 place-items-center rounded-xl shadow-lg shadow-black/20">
            <span className="font-mono text-sm font-bold text-duskdeep">LC</span>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight text-white">
              Lecture<span className="chrome-text">Cloud</span>
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
              Campus Tracker
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/15 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="rounded-full px-4 py-1.5 text-sm text-white/80 hover:text-white"
              activeProps={{ className: "chrome font-semibold text-duskdeep hover:text-duskdeep" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="chrome grid size-9 place-items-center rounded-full text-sm font-bold text-duskdeep ring-1 ring-white/40"
                title={user.email ?? "Account"}
              >
                {initials}
              </Link>
              <button
                onClick={signOut}
                className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-white/70 ring-1 ring-white/25 hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="chrome rounded-full px-4 py-2 text-sm font-semibold text-duskdeep"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeOptions={{ exact: link.to === "/" }}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-white/80"
            activeProps={{ className: "chrome font-semibold text-duskdeep" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
