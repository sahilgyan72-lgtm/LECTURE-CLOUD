import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, Panel } from "@/components/PageShell";
import {
  ATTENDANCE_THRESHOLD,
  fetchBatches,
  fetchLectures,
  fetchMyAttendance,
  summarise,
} from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance & 75% Check — LectureCloud" },
      {
        name: "description",
        content: "Mark attendance per subject and see whether you clear the 75% criterion.",
      },
      { property: "og:title", content: "Attendance & 75% Check — LectureCloud" },
      {
        property: "og:description",
        content: "Subject-wise attendance with a live 75% eligibility check.",
      },
    ],
  }),
  component: AttendancePage,
});

const STORAGE_KEY = "lecturecloud.batch";

function AttendancePage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [batchLabel, setBatchLabel] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setBatchLabel(window.localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  const batches = useQuery({ queryKey: ["batches"], queryFn: fetchBatches });
  const batch = useMemo(() => {
    const list = batches.data ?? [];
    return list.find((b) => b.label === batchLabel) ?? list[0] ?? null;
  }, [batches.data, batchLabel]);

  const lectures = useQuery({
    queryKey: ["lectures", batch?.id],
    queryFn: () => fetchLectures(batch!.id),
    enabled: Boolean(batch?.id),
  });

  const records = useQuery({
    queryKey: ["attendance", user.id],
    queryFn: () => fetchMyAttendance(user.id),
  });

  const subjects = useMemo(
    () => [...new Set((lectures.data ?? []).map((l) => l.subject))],
    [lectures.data],
  );
  const summary = summarise(records.data ?? []);
  const overall = (() => {
    const rows = records.data ?? [];
    if (rows.length === 0) return 0;
    return Math.round((rows.filter((r) => r.present).length / rows.length) * 100);
  })();

  const mark = useMutation({
    mutationFn: async ({ subject, present }: { subject: string; present: boolean }) => {
      const { error } = await supabase
        .from("attendance_records")
        .upsert(
          { student_id: user.id, subject, class_date: date, present },
          { onConflict: "student_id,subject,class_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", user.id] });
      toast.success("Attendance saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save attendance"),
  });

  const atRisk = summary.filter((s) => s.percent < ATTENDANCE_THRESHOLD);

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Are you clearing <span className="chrome-text">75%</span>?
        </h1>
        <p className="mt-3 max-w-md text-white/75">
          Mark each class as attended or missed and LectureCloud does the maths.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel
              title="Mark today's classes"
              subtitle={batch?.label ?? "Pick a batch on the timetable page"}
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
                {subjects.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-duskdeep/60">
                    {lectures.isLoading ? "Loading subjects…" : "No subjects for this batch yet."}
                  </p>
                ) : (
                  subjects.map((subject) => {
                    const existing = (records.data ?? []).find(
                      (r) => r.subject === subject && r.class_date === date,
                    );
                    return (
                      <div key={subject} className="flex items-center gap-3 px-6 py-4">
                        <p className="flex-1 font-semibold text-duskdeep">{subject}</p>
                        <button
                          onClick={() => mark.mutate({ subject, present: true })}
                          className={
                            existing?.present
                              ? "rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-white"
                              : "rounded-full bg-duskdeep/5 px-3 py-1.5 text-xs font-semibold text-duskdeep/70"
                          }
                        >
                          Present
                        </button>
                        <button
                          onClick={() => mark.mutate({ subject, present: false })}
                          className={
                            existing && !existing.present
                              ? "rounded-full bg-danger px-3 py-1.5 text-xs font-semibold text-white"
                              : "rounded-full bg-duskdeep/5 px-3 py-1.5 text-xs font-semibold text-duskdeep/70"
                          }
                        >
                          Absent
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </div>

          <div className="chrome rounded-3xl p-6 shadow-xl shadow-black/30 ring-1 ring-white/60">
            <h3 className="text-lg font-bold text-duskdeep">75% Readiness</h3>
            <p className="font-mono text-[11px] uppercase tracking-widest text-duskdeep/50">
              Overall {overall}%
            </p>
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
                    {s.percent < ATTENDANCE_THRESHOLD
                      ? ` · attend ${s.needed} more in a row to clear 75%`
                      : " · eligible"}
                  </p>
                </div>
              ))}
              {summary.length === 0 ? (
                <p className="text-sm text-duskdeep/70">
                  Nothing marked yet. Start with today's classes.
                </p>
              ) : null}
            </div>
            {summary.length > 0 ? (
              <div className="mt-5 rounded-2xl bg-white/60 p-3 text-sm text-duskdeep ring-1 ring-duskdeep/10">
                <span className="font-semibold">
                  {summary.length - atRisk.length} of {summary.length}
                </span>{" "}
                subjects clear the 75% criterion.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
