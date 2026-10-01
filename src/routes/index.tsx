import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageShell, Panel } from "@/components/PageShell";
import { NowStrip } from "@/components/NowStrip";
import { StudentFinder } from "@/components/StudentFinder";
import { useStudent } from "@/hooks/useStudent";
import { fetchFaculty, formatTime, minutesOfDay, statusDotClass, STATUS_LABELS } from "@/lib/campus";
import { DAYS, lecturesForBatch } from "@/lib/timetable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Timetable — LectureCloud GEC Palanpur" },
      { name: "description", content: "Enter your batch and roll number to see your lectures, faculty and rooms." },
      { property: "og:title", content: "My Timetable — LectureCloud" },
      { property: "og:description", content: "GEC Palanpur first-year timetable finder by batch and roll number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { student, setStudent, ready } = useStudent();
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: fetchFaculty });
  const [now, setNow] = useState<Date | null>(null);
  const [day, setDay] = useState(1);

  useEffect(() => {
    const d = new Date();
    setNow(d);
    const wd = d.getDay();
    setDay(wd >= 1 && wd <= 5 ? wd : 1);
  }, []);

  const lectures = student ? lecturesForBatch(student.batch) : [];
  const dayLectures = lectures.filter((l) => l.day === day);
  const isToday = now ? now.getDay() === day : false;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const statusMap = new Map((faculty.data ?? []).map((f) => [f.name, f]));

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10 pt-6">
        <h1 className="text-5xl font-bold leading-[0.95] tracking-tight text-white md:text-6xl">
          Your <span className="text-white">timetable</span>, by roll number.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-white/75">
          Pick your batch (like CP2), type your roll number (like 34), and see every lecture with the
          teacher and room.
        </p>
        <div className="mt-8 max-w-2xl">
          {ready && student ? (
            <div className="chrome flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ring-1 ring-white/50">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-duskdeep/60">
                  {student.dept} · Batch {student.batch} · Roll {student.roll}
                </p>
                <p className="text-xl font-bold text-duskdeep">Hi, {student.name}</p>
              </div>
              <button
                onClick={() => setStudent(null)}
                className="rounded-full bg-duskdeep px-4 py-2 text-xs font-semibold text-white"
              >
                Not you? Change
              </button>
            </div>
          ) : (
            <StudentFinder onFound={setStudent} />
          )}
        </div>
      </section>

      {student ? (
        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
          <div className="mb-6">
            <NowStrip batch={student.batch} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel
                title={`${DAYS[day - 1]}${isToday ? " · Today" : ""}`}
                subtitle={`Batch ${student.batch} · ${dayLectures.length} lectures`}
              >
                <div className="flex gap-1 overflow-x-auto border-b border-duskdeep/10 px-4 py-3">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setDay(i + 1)}
                      className={
                        day === i + 1
                          ? "chrome rounded-full px-3 py-1 text-xs font-semibold text-duskdeep"
                          : "rounded-full px-3 py-1 text-xs text-duskdeep/60"
                      }
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <div className="divide-y divide-duskdeep/10">
                  {dayLectures.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-duskdeep/60">No lectures on this day.</p>
                  ) : (
                    dayLectures.map((l, i) => {
                      const live = isToday && minutesOfDay(l.start) <= nowMin && nowMin < minutesOfDay(l.end);
                      const done = isToday && minutesOfDay(l.end) <= nowMin;
                      const f = l.faculty ? statusMap.get(l.faculty) : undefined;
                      return (
                        <div key={i} className={`flex items-center gap-4 px-6 py-4 ${live ? "bg-brand/10" : ""}`}>
                          <span className="w-24 font-mono text-xs text-duskdeep/50">
                            {formatTime(l.start)}
                          </span>
                          <div className="flex-1">
                            <p className={`font-semibold text-duskdeep ${done ? "opacity-50" : ""}`}>{l.subject}</p>
                            <p className="flex items-center gap-1.5 text-xs text-duskdeep/60">
                              {l.faculty ? (
                                <>
                                  {f ? <span className={`size-2 rounded-full ${statusDotClass(f.status)}`} /> : null}
                                  Prof. {l.faculty}
                                  {f ? ` · ${STATUS_LABELS[f.status] ?? f.status}` : ""}
                                </>
                              ) : (
                                "Self study"
                              )}
                            </p>
                          </div>
                          <span className="font-mono text-xs text-duskdeep/70">Room {l.room}</span>
                          {live ? (
                            <span className="chrome rounded-full px-2 py-1 font-mono text-[11px] text-duskdeep">Now</span>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </Panel>
            </div>
            <div className="chrome rounded-3xl p-6 shadow-xl shadow-black/30 ring-1 ring-white/60">
              <h3 className="text-lg font-bold text-duskdeep">75% Readiness</h3>
              <p className="mt-3 text-sm text-duskdeep/80">
                Mark classes you attended and see if you clear the 75% rule in each subject.
              </p>
              <Link
                to="/attendance"
                className="mt-5 inline-flex rounded-2xl bg-duskdeep px-4 py-2 text-sm font-semibold text-white"
              >
                Open attendance tracker
              </Link>
              <Link to="/announcements" className="mt-3 block text-sm text-duskdeep/70 underline">
                See announcements
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
