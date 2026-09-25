import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, Panel } from "@/components/PageShell";
import { useStudent } from "@/hooks/useStudent";
import { ATTENDANCE_THRESHOLD, summarise, type AttendanceRow } from "@/lib/campus";
import { subjectsForBatch } from "@/lib/timetable";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance & 75% Check — LectureCloud" },
      { name: "description", content: "Mark attendance per subject and check the 75% criterion." },
      { property: "og:title", content: "Attendance & 75% Check — LectureCloud" },
      { property: "og:description", content: "Subject-wise attendance with a live 75% eligibility check." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const { student, ready } = useStudent();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [date, setDate] = useState("");
  const key = student ? `lecturecloud.attendance.${student.batch}.${student.roll}` : "";

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
  }, []);
  useEffect(() => {
    if (!key) return;
    try {
      setRows(JSON.parse(window.localStorage.getItem(key) ?? "[]"));
    } catch {
      setRows([]);
    }
  }, [key]);

  function mark(subject: string, present: boolean) {
    const next = rows.filter((r) => !(r.subject === subject && r.class_date === date));
    next.push({ id: `${subject}-${date}`, subject, class_date: date, present });
    setRows(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  }

  if (ready && !student) {
    return (
      <PageShell>
        <section className="relative z-10 mx-auto max-w-xl px-6 pb-20 pt-6 text-white">
          <h1 className="text-4xl font-bold">Find yourself first</h1>
          <p className="mt-3 text-white/75">Enter your batch and roll number on the timetable page.</p>
          <Link to="/" className="chrome mt-6 inline-flex rounded-2xl px-4 py-2 text-sm font-semibold text-duskdeep">
            Go to timetable
          </Link>
        </section>
      </PageShell>
    );
  }

  const subjects = student ? subjectsForBatch(student.batch) : [];
  const summary = summarise(rows);
  const overall = rows.length ? Math.round((rows.filter((r) => r.present).length / rows.length) * 100) : 0;

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Are you clearing <span className="chrome-text">75%</span>?
        </h1>
        <p className="mt-3 max-w-md text-white/75">
          {student ? `${student.name} · ${student.batch}. ` : ""}Saved on this phone only.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel
              title="Mark classes"
              subtitle="Pick a date"
              action={
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-full bg-duskdeep/5 px-3 py-1.5 font-mono text-[11px] text-duskdeep ring-1 ring-duskdeep/10"
                />
              }
            >
              <div className="divide-y divide-duskdeep/10">
                {subjects.map((subject) => {
                  const ex = rows.find((r) => r.subject === subject && r.class_date === date);
                  return (
                    <div key={subject} className="flex items-center gap-3 px-6 py-4">
                      <p className="flex-1 font-semibold text-duskdeep">{subject}</p>
                      <button
                        onClick={() => mark(subject, true)}
                        className={ex?.present ? "rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full bg-duskdeep/5 px-3 py-1.5 text-xs font-semibold text-duskdeep/70"}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => mark(subject, false)}
                        className={ex && !ex.present ? "rounded-full bg-danger px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full bg-duskdeep/5 px-3 py-1.5 text-xs font-semibold text-duskdeep/70"}
                      >
                        Absent
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
          <div className="chrome rounded-3xl p-6 shadow-xl shadow-black/30 ring-1 ring-white/60">
            <h3 className="text-lg font-bold text-duskdeep">75% Readiness</h3>
            <p className="font-mono text-[11px] uppercase tracking-widest text-duskdeep/50">Overall {overall}%</p>
            <div className="mt-5 space-y-4">
              {summary.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-duskdeep">{s.subject}</span>
                    <span className="font-mono font-bold text-duskdeep">{s.percent}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-duskdeep/10">
                    <div
                      className={`h-full rounded-full ${s.percent >= ATTENDANCE_THRESHOLD ? "bg-success" : "bg-danger"}`}
                      style={{ width: `${Math.min(100, s.percent)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-duskdeep/60">
                    {s.attended}/{s.total} classes
                    {s.percent < ATTENDANCE_THRESHOLD ? ` · attend ${s.needed} more in a row to clear 75%` : " · eligible"}
                  </p>
                </div>
              ))}
              {summary.length === 0 ? <p className="text-sm text-duskdeep/70">Nothing marked yet.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
