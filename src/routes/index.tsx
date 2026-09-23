import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PageShell, Panel } from "@/components/PageShell";
import {
  fetchAnnouncements,
  fetchBatches,
  fetchFaculty,
  fetchLectures,
  formatTime,
  minutesOfDay,
  statusDotClass,
  STATUS_LABELS,
  todayIndex,
  type Lecture,
} from "@/lib/campus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Lectures — LectureCloud" },
      {
        name: "description",
        content:
          "Enter your batch, like Civil Batch 3, to see today's lectures with the faculty and room.",
      },
      { property: "og:title", content: "Today's Lectures — LectureCloud" },
      {
        property: "og:description",
        content: "Live campus timetable, faculty availability and attendance in one place.",
      },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "lecturecloud.batch";

function Index() {
  const [batchLabel, setBatchLabel] = useState<string>("");
  const [input, setInput] = useState("");

  const batches = useQuery({ queryKey: ["batches"], queryFn: fetchBatches });
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: fetchFaculty });
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setBatchLabel(saved);
      setInput(saved);
    }
  }, []);

  const batch = useMemo(() => {
    const list = batches.data ?? [];
    return (
      list.find((b) => b.label.toLowerCase() === batchLabel.trim().toLowerCase()) ?? list[0] ?? null
    );
  }, [batches.data, batchLabel]);

  const lectures = useQuery({
    queryKey: ["lectures", batch?.id],
    queryFn: () => fetchLectures(batch!.id),
    enabled: Boolean(batch?.id),
  });

  const today = todayIndex();
  const todays = (lectures.data ?? []).filter((l) => l.day_of_week === today);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  function statusOf(l: Lecture) {
    if (minutesOfDay(l.end_time) < nowMinutes) return "done" as const;
    if (minutesOfDay(l.start_time) <= nowMinutes) return "now" as const;
    return "pending" as const;
  }

  const nextLecture = todays.find((l) => minutesOfDay(l.end_time) >= nowMinutes) ?? null;

  function applyBatch(value: string) {
    const trimmed = value.trim();
    setBatchLabel(trimmed);
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  }

  const dayName = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10 pt-6">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70 ring-1 ring-white/25">
              <span className="size-1.5 rounded-full bg-brand" /> {dayName} · Live
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[0.95] tracking-tight text-white md:text-6xl">
              Know every <span className="chrome-text">lecture</span> before the bell.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/75">
              Drop your batch, and the timetable, faculty status, and campus events resolve
              instantly. No more chasing corridors.
            </p>

            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                applyBatch(input);
              }}
            >
              <div className="flex-1 rounded-2xl bg-white/95 p-1.5 shadow-xl shadow-black/20 ring-1 ring-white/50">
                <div className="flex gap-1.5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Batch — e.g. Civil Batch 3"
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-duskdeep outline-none placeholder:text-duskdeep/40"
                  />
                  <button
                    type="submit"
                    className="chrome rounded-xl px-5 text-sm font-semibold text-duskdeep"
                  >
                    Track
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px]">
              {(batches.data ?? []).map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setInput(b.label);
                    applyBatch(b.label);
                  }}
                  className={
                    b.id === batch?.id
                      ? "chrome rounded-full px-2.5 py-1 font-semibold text-duskdeep"
                      : "rounded-full bg-white/10 px-2.5 py-1 text-white/80 ring-1 ring-white/15"
                  }
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="chrome rounded-3xl p-6 shadow-2xl shadow-black/30 ring-1 ring-white/50">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-duskdeep/60">
                  Up next
                </p>
                <span className="font-mono text-xs text-duskdeep/70">
                  {nextLecture ? formatTime(nextLecture.start_time) : "—"}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-duskdeep">
                {nextLecture ? nextLecture.subject : "No more classes today"}
              </h2>
              <p className="mt-1 text-sm text-duskdeep/70">
                {nextLecture
                  ? `${nextLecture.faculty?.name ?? "Faculty TBA"} · Room ${nextLecture.room}`
                  : `${batch?.label ?? "Pick a batch"} · enjoy the break`}
              </p>

              <div className="mt-5 rounded-2xl bg-white/70 p-4 ring-1 ring-duskdeep/10">
                <div className="flex items-center justify-between font-mono text-xs text-duskdeep/70">
                  <span>{batch?.label ?? "No batch"}</span>
                  <span>Classes today</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-duskdeep">{todays.length}</span>
                  <Link to="/attendance" className="text-[11px] font-medium text-duskdeep/60 underline">
                    Check your 75% status
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/60 py-2 ring-1 ring-duskdeep/10">
                  <p className="font-mono text-[10px] uppercase text-duskdeep/50">Room</p>
                  <p className="text-sm font-bold text-duskdeep">{nextLecture?.room ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-white/60 py-2 ring-1 ring-duskdeep/10">
                  <p className="font-mono text-[10px] uppercase text-duskdeep/50">Ends</p>
                  <p className="text-sm font-bold text-duskdeep">
                    {nextLecture ? formatTime(nextLecture.end_time) : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 py-2 ring-1 ring-duskdeep/10">
                  <p className="font-mono text-[10px] uppercase text-duskdeep/50">Dept</p>
                  <p className="text-sm font-bold text-duskdeep">{batch?.department ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel
              title="Today's Schedule"
              subtitle={`${batch?.label ?? "No batch"} · ${todays.length} classes`}
              action={
                <span className="chrome rounded-full px-3 py-1 font-mono text-[11px] text-duskdeep">
                  {dayName}
                </span>
              }
            >
              <div className="divide-y divide-duskdeep/10">
                {todays.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-duskdeep/60">
                    {lectures.isLoading ? "Loading timetable…" : "No lectures scheduled for today."}
                  </p>
                ) : (
                  todays.map((l) => {
                    const state = statusOf(l);
                    return (
                      <div
                        key={l.id}
                        className={`flex items-center gap-4 px-6 py-4 ${state === "now" ? "bg-brand/10" : ""}`}
                      >
                        <span className="w-16 font-mono text-xs text-duskdeep/50">
                          {l.start_time.slice(0, 5)}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-duskdeep">{l.subject}</p>
                          <p className="text-xs text-duskdeep/60">{l.faculty?.name ?? "Faculty TBA"}</p>
                        </div>
                        <span className="font-mono text-xs text-duskdeep/60">{l.room}</span>
                        {state === "done" ? (
                          <span className="rounded-full bg-success/15 px-2 py-1 font-mono text-[11px] text-success">
                            Done
                          </span>
                        ) : state === "now" ? (
                          <span className="chrome rounded-full px-2 py-1 font-mono text-[11px] text-duskdeep">
                            Now
                          </span>
                        ) : (
                          <span className="rounded-full bg-duskdeep/5 px-2 py-1 font-mono text-[11px] text-duskdeep/50">
                            Pending
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </div>

          <Panel title="Faculty Status" subtitle="Live availability" tone="dark">
            <div className="space-y-3 p-4">
              {(faculty.data ?? []).slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"
                >
                  <div className="chrome grid size-10 place-items-center rounded-full text-sm font-bold text-duskdeep">
                    {f.name.replace(/[^A-Za-z ]/g, "").trim().split(" ").slice(-2).map((p) => p[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{f.name}</p>
                    <p className="font-mono text-[11px] text-white/50">
                      {f.room} · {STATUS_LABELS[f.status] ?? f.status}
                    </p>
                  </div>
                  <span className={`size-2.5 rounded-full ${statusDotClass(f.status)}`} />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white/95 p-6 shadow-xl shadow-black/20 ring-1 ring-white/60">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-duskdeep">Announcements &amp; Events</h3>
                <p className="font-mono text-[11px] uppercase tracking-widest text-duskdeep/50">
                  {(announcements.data ?? []).length} posted
                </p>
              </div>
              <Link
                to="/announcements"
                className="chrome rounded-full px-4 py-1.5 text-xs font-semibold text-duskdeep"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {(announcements.data ?? []).slice(0, 2).map((a) => {
                const d = a.event_date ? new Date(a.event_date) : null;
                return (
                  <div key={a.id} className="flex gap-4">
                    <div className="chrome grid size-12 shrink-0 place-items-center rounded-2xl text-center font-mono text-xs font-bold leading-tight text-duskdeep">
                      {d ? (
                        <span>
                          {d.getDate()}
                          <br />
                          {d.toLocaleDateString(undefined, { month: "short" })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className="border-l border-duskdeep/10 pl-4">
                      <p className="font-semibold text-duskdeep">{a.title}</p>
                      <p className="mt-0.5 text-sm text-duskdeep/60">
                        {a.body}
                        {a.faculty ? (
                          <>
                            {" "}
                            Meet <span className="font-semibold text-duskdeep">{a.faculty.name}</span>
                            {a.venue ? ` at ${a.venue}` : ""}.
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chrome rounded-3xl p-6 shadow-xl shadow-black/30 ring-1 ring-white/60">
            <h3 className="text-lg font-bold text-duskdeep">75% Readiness</h3>
            <p className="font-mono text-[11px] uppercase tracking-widest text-duskdeep/50">
              Attendance criterion
            </p>
            <p className="mt-5 text-sm text-duskdeep/80">
              Mark yourself present after each class and LectureCloud tracks whether you clear the
              75% rule, subject by subject.
            </p>
            <Link
              to="/attendance"
              className="mt-5 inline-flex rounded-2xl bg-duskdeep px-4 py-2 text-sm font-semibold text-white"
            >
              Open attendance tracker
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
