import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, Panel } from "@/components/PageShell";
import { fetchFaculty, statusDotClass, STATUS_LABELS } from "@/lib/campus";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty Availability — LectureCloud" },
      {
        name: "description",
        content: "See which professors are free, in class, busy or on leave right now.",
      },
      { property: "og:title", content: "Faculty Availability — LectureCloud" },
      {
        property: "og:description",
        content: "Live availability for every professor, with their room and subject.",
      },
    ],
  }),
  component: FacultyPage,
});

function FacultyPage() {
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: fetchFaculty });
  const list = faculty.data ?? [];
  const free = list.filter((f) => f.status === "available").length;

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Who's <span className="chrome-text">free</span> right now.
        </h1>
        <p className="mt-3 max-w-md text-white/75">
          {free} of {list.length} faculty members are available for a walk-in.
        </p>

        <div className="mt-8">
          <Panel title="Faculty" subtitle="Live availability" tone="dark">
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {list.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
                >
                  <div className="chrome grid size-11 place-items-center rounded-full text-sm font-bold text-duskdeep">
                    {f.name.replace(/[^A-Za-z ]/g, "").trim().split(" ").slice(-2).map((p) => p[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{f.name}</p>
                    <p className="font-mono text-[11px] text-white/50">
                      {f.subject} · {f.department} · {f.room}
                    </p>
                    {f.status_note ? (
                      <p className="mt-1 text-xs text-white/60">{f.status_note}</p>
                    ) : null}
                  </div>
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase text-white/70">
                    <span className={`size-2.5 rounded-full ${statusDotClass(f.status)}`} />
                    {STATUS_LABELS[f.status] ?? f.status}
                  </span>
                </div>
              ))}
              {list.length === 0 ? (
                <p className="p-4 text-sm text-white/60">
                  {faculty.isLoading ? "Loading faculty…" : "No faculty added yet."}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </section>
    </PageShell>
  );
}
