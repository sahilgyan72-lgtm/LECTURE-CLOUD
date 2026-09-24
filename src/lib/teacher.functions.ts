import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

type TeacherSession = { unlocked?: boolean };

function config() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "teacher-desk",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function requireTeacher() {
  const s = await useSession<TeacherSession>(config());
  if (!s.data.unlocked) throw new Error("Locked");
}

export const teacherStatus = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<TeacherSession>(config());
  return { unlocked: Boolean(s.data.unlocked) };
});

export const unlockTeacher = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const expected = process.env["TEACHER_PASSWORD"];
    if (!expected || !matches(data.password, expected)) return { ok: false };
    const s = await useSession<TeacherSession>(config());
    await s.update({ unlocked: true });
    return { ok: true };
  });

export const lockTeacher = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<TeacherSession>(config());
  await s.clear();
  return { ok: true };
});

export const updateFacultyStatus = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["available", "in_class", "busy", "on_leave"]),
        note: z.string().max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireTeacher();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("faculty")
      .update({ status: data.status, status_note: data.note, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const postAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        title: z.string().trim().min(3).max(140),
        body: z.string().max(1000),
        category: z.string().max(30),
        event_date: z.string().max(10).nullable(),
        venue: z.string().max(120),
        contact_faculty_id: z.string().uuid().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireTeacher();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireTeacher();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
