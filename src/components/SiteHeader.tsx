import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Timetable" },
  { to: "/faculty", label: "Faculty" },
  { to: "/announcements", label: "Announcements" },
  { to: "/attendance", label: "Attendance" },
] as const;

export function SiteHeader() {
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
              GEC Palanpur
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

        <Link
          to="/teachers"
          className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-white/80 ring-1 ring-white/25 hover:bg-white/10"
          activeProps={{ className: "chrome text-duskdeep" }}
        >
          Teachers
        </Link>
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
