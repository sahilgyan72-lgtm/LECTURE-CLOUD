import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { fetchAnnouncements } from "@/lib/campus";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements & Events — LectureCloud" },
      {
        name: "description",
        content: "Campus events, deadlines and which professor to meet for each activity.",
      },
      { property: "og:title", content: "Announcements & Events — LectureCloud" },
      {
        property: "og:description",
        content: "Every campus notice with its date, venue and contact professor.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const list = announcements.data ?? [];

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          What's <span className="text-white">happening</span> on campus.
        </h1>
        <p className="mt-3 max-w-md text-white/75">
          Each notice names the professor to meet for that activity.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {list.map((a) => {
            const d = a.event_date ? new Date(a.event_date) : null;
            return (
              <article
                key={a.id}
                className="rounded-3xl bg-white/95 p-6 shadow-xl shadow-black/20 ring-1 ring-white/60"
              >
                <div className="flex items-center gap-3">
                  <span className="chrome rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-duskdeep">
                    {a.category}
                  </span>
                  <span className="font-mono text-[11px] text-duskdeep/50">
                    {d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "No date"}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-duskdeep">{a.title}</h2>
                <p className="mt-2 text-sm text-duskdeep/70">{a.body}</p>
                <div className="mt-4 rounded-2xl bg-duskdeep/5 p-3 text-sm text-duskdeep">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-duskdeep/50">
                    Who to meet
                  </p>
                  <p className="mt-1 font-semibold">{a.faculty?.name ?? "Department office"}</p>
                  <p className="text-duskdeep/60">{a.venue || a.faculty?.room || "Campus"}</p>
                </div>
              </article>
            );
          })}
          {list.length === 0 ? (
            <p className="text-white/70">
              {announcements.isLoading ? "Loading announcements…" : "No announcements yet."}
            </p>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
