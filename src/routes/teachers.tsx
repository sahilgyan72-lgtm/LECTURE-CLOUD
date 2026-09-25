import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, Panel } from "@/components/PageShell";
import { fetchAnnouncements, fetchFaculty, STATUS_LABELS, statusDotClass } from "@/lib/campus";
import {
  deleteAnnouncement,
  lockTeacher,
  postAnnouncement,
  teacherStatus,
  unlockTeacher,
  updateFacultyStatus,
} from "@/lib/teacher.functions";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers' Desk — LectureCloud" },
      { name: "description", content: "Password-protected desk for teachers to update availability and post announcements." },
      { property: "og:title", content: "Teachers' Desk — LectureCloud" },
      { property: "og:description", content: "Teachers update availability and post announcements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeachersPage,
});

const STATUSES = ["available", "in_class", "busy", "on_leave"] as const;
const input = "w-full rounded-xl bg-duskdeep/5 px-4 py-3 text-sm text-duskdeep outline-none ring-1 ring-duskdeep/10";

function TeachersPage() {
  const qc = useQueryClient();
  const getStatus = useServerFn(teacherStatus);
  const unlock = useServerFn(unlockTeacher);
  const lock = useServerFn(lockTeacher);
  const status = useQuery({ queryKey: ["teacher-status"], queryFn: () => getStatus() });
  const [pw, setPw] = useState("");

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    const r = await unlock({ data: { password: pw } });
    if (r.ok) {
      setPw("");
      qc.invalidateQueries({ queryKey: ["teacher-status"] });
    } else toast.error("Wrong password");
  }

  if (status.isLoading) return <PageShell><p className="relative z-10 px-6 text-white">Loading…</p></PageShell>;

  if (!status.data?.unlocked) {
    return (
      <PageShell>
        <section className="relative z-10 mx-auto max-w-md px-6 pb-20 pt-6">
          <form onSubmit={onUnlock} className="rounded-3xl bg-white/95 p-6 shadow-2xl ring-1 ring-white/60">
            <h1 className="text-2xl font-bold text-duskdeep">Teachers only</h1>
            <p className="mt-1 text-sm text-duskdeep/60">Enter the staff password to continue.</p>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Staff password" className={`${input} mt-5`} />
            <button className="chrome mt-3 w-full rounded-xl py-3 text-sm font-semibold text-duskdeep">Unlock</button>
          </form>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Teachers' <span className="chrome-text">desk</span>
          </h1>
          <button
            onClick={async () => {
              await lock();
              qc.invalidateQueries({ queryKey: ["teacher-status"] });
            }}
            className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white ring-1 ring-white/30"
          >
            Lock
          </button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AvailabilityPanel />
          <AnnouncementPanel />
        </div>
      </section>
    </PageShell>
  );
}

function AvailabilityPanel() {
  const qc = useQueryClient();
  const update = useServerFn(updateFacultyStatus);
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: fetchFaculty });
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const me = (faculty.data ?? []).find((f) => f.id === id);

  const m = useMutation({
    mutationFn: (s: (typeof STATUSES)[number]) => update({ data: { id, status: s, note } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Availability updated");
    },
    onError: () => toast.error("Could not update"),
  });

  return (
    <Panel title="Today's availability" subtitle="Shown to all students">
      <div className="space-y-4 p-6">
        <select value={id} onChange={(e) => setId(e.target.value)} className={input}>
          <option value="">Choose your name…</option>
          {(faculty.data ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} · {f.subject}
            </option>
          ))}
        </select>
        {me ? (
          <>
            <div className="flex items-center gap-2 text-sm text-duskdeep">
              <span className={`size-2.5 rounded-full ${statusDotClass(me.status)}`} />
              Now: {STATUS_LABELS[me.status] ?? me.status}
              {me.status_note ? ` — ${me.status_note}` : ""}
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Note, e.g. In cabin 4010 till 2 PM" className={input} />
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s} disabled={m.isPending} onClick={() => m.mutate(s)} className="chrome rounded-full px-4 py-2 text-xs font-semibold text-duskdeep">
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Panel>
  );
}

function AnnouncementPanel() {
  const qc = useQueryClient();
  const post = useServerFn(postAnnouncement);
  const del = useServerFn(deleteAnnouncement);
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: fetchFaculty });
  const list = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const [f, setF] = useState({ title: "", body: "", category: "Event", event_date: "", venue: "", contact: "" });

  const m = useMutation({
    mutationFn: () =>
      post({
        data: {
          title: f.title,
          body: f.body,
          category: f.category,
          event_date: f.event_date || null,
          venue: f.venue,
          contact_faculty_id: f.contact || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setF({ title: "", body: "", category: "Event", event_date: "", venue: "", contact: "" });
      toast.success("Announcement posted");
    },
    onError: () => toast.error("Add a title of at least 3 letters"),
  });

  return (
    <Panel title="Post an announcement" subtitle="Events, seminars, deadlines">
      <div className="space-y-3 p-6">
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={140} placeholder="Title" className={input} />
        <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={1000} rows={3} placeholder="Details" className={input} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={input}>
            {["Event", "Seminar", "Academic", "Sports", "General"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} className={input} />
        </div>
        <input value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} maxLength={120} placeholder="Venue" className={input} />
        <select value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} className={input}>
          <option value="">Professor to meet (optional)</option>
          {(faculty.data ?? []).map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
        <button onClick={() => m.mutate()} disabled={m.isPending} className="chrome w-full rounded-xl py-3 text-sm font-semibold text-duskdeep disabled:opacity-60">
          Post announcement
        </button>
        <div className="divide-y divide-duskdeep/10 pt-3">
          {(list.data ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm text-duskdeep">
              <span>{a.title}</span>
              <button
                onClick={async () => {
                  await del({ data: { id: a.id } });
                  qc.invalidateQueries({ queryKey: ["announcements"] });
                }}
                className="text-xs text-danger underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
