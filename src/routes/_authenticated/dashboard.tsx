import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, Panel } from "@/components/PageShell";
import { fetchFaculty, STATUS_LABELS, statusDotClass } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Desk — LectureCloud" },
      {
        name: "description",
        content: "Update your availability and post campus announcements.",
      },
      { property: "og:title", content: "My Desk — LectureCloud" },
      { property: "og:description", content: "Faculty controls for availability and notices." },
    ],
  }),
  component: Dashboard,
});

const STATUSES = ["available", "in_class", "busy", "on_leave"] as const;

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const roles = useQuery({
    queryKey: ["roles", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });
  const isStaff = (roles.data ?? []).some((r) => r === "faculty" || r === "admin");

  const faculty = useQuery({ queryKey: ["faculty"], queryFn: fetchFaculty });
  const myCard = (faculty.data ?? []).find((f) => f.user_id === user.id) ?? null;

  const [linkId, setLinkId] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Event");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [contactId, setContactId] = useState("");

  const claim = useMutation({
    mutationFn: async (facultyId: string) => {
      const { error } = await supabase
        .from("faculty")
        .update({ user_id: user.id })
        .eq("id", facultyId)
        .is("user_id", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Profile linked to your account");
    },
    onError: () => toast.error("That profile is already linked."),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("faculty")
        .update({ status, status_note: note, updated_at: new Date().toISOString() })
        .eq("id", myCard!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Availability updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const post = useMutation({
    mutationFn: async () => {
      if (title.trim().length < 3) throw new Error("Give the announcement a title.");
      const { error } = await supabase.from("announcements").insert({
        title: title.trim().slice(0, 140),
        body: body.trim().slice(0, 1000),
        category,
        event_date: eventDate || null,
        venue: venue.trim().slice(0, 120),
        contact_faculty_id: contactId || myCard?.id || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setTitle("");
      setBody("");
      setVenue("");
      setEventDate("");
      toast.success("Announcement posted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not post"),
  });

  const inputClass =
    "w-full rounded-xl bg-duskdeep/5 px-4 py-3 text-sm text-duskdeep outline-none ring-1 ring-duskdeep/10";

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          My <span className="chrome-text">desk</span>.
        </h1>
        <p className="mt-3 max-w-lg text-white/75">
          Signed in as {user.email}.{" "}
          {isStaff ? "You can update availability and post notices." : "Students track attendance here."}
        </p>

        {!isStaff ? (
          <div className="mt-8 rounded-3xl bg-white/95 p-6 shadow-xl shadow-black/20 ring-1 ring-white/60">
            <h2 className="text-lg font-bold text-duskdeep">Student tools</h2>
            <p className="mt-2 text-sm text-duskdeep/70">
              Head to the attendance tracker to mark classes and check your 75% status.
            </p>
            <Link
              to="/attendance"
              className="chrome mt-4 inline-flex rounded-2xl px-4 py-2 text-sm font-semibold text-duskdeep"
            >
              Open attendance tracker
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Panel title="My availability" subtitle="Shown to every student">
              <div className="space-y-4 p-6">
                {myCard ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-duskdeep">
                      <span className={`size-2.5 rounded-full ${statusDotClass(myCard.status)}`} />
                      {myCard.name} · {STATUS_LABELS[myCard.status] ?? myCard.status}
                    </div>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={120}
                      placeholder={myCard.status_note || "Short note, e.g. Free until 2 PM"}
                      className={inputClass}
                    />
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus.mutate(s)}
                          className="chrome rounded-full px-4 py-2 text-xs font-semibold text-duskdeep"
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-duskdeep/70">
                      Link your account to a faculty profile to control its availability.
                    </p>
                    <select
                      value={linkId}
                      onChange={(e) => setLinkId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choose your profile…</option>
                      {(faculty.data ?? [])
                        .filter((f) => !f.user_id)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} · {f.department}
                          </option>
                        ))}
                    </select>
                    <button
                      disabled={!linkId}
                      onClick={() => claim.mutate(linkId)}
                      className="chrome rounded-xl px-4 py-2 text-sm font-semibold text-duskdeep disabled:opacity-50"
                    >
                      Link profile
                    </button>
                  </>
                )}
              </div>
            </Panel>

            <Panel title="Post an announcement" subtitle="Events, seminars, deadlines">
              <div className="space-y-3 p-6">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={140}
                  placeholder="Title"
                  className={inputClass}
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Details students should know"
                  className={inputClass}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {["Event", "Seminar", "Academic", "Sports", "General"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  maxLength={120}
                  placeholder="Venue, e.g. Auditorium B"
                  className={inputClass}
                />
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Professor to meet — {myCard?.name ?? "choose"}</option>
                  {(faculty.data ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => post.mutate()}
                  disabled={post.isPending}
                  className="chrome w-full rounded-xl py-3 text-sm font-semibold text-duskdeep disabled:opacity-60"
                >
                  Post announcement
                </button>
              </div>
            </Panel>
          </div>
        )}
      </section>
    </PageShell>
  );
}
