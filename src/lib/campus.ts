import { supabase } from "@/integrations/supabase/client";

export type Batch = {
  id: string;
  department: string;
  number: number;
  label: string;
};

export type Faculty = {
  id: string;
  user_id: string | null;
  name: string;
  department: string;
  subject: string;
  room: string;
  status: string;
  status_note: string;
};

export type Lecture = {
  id: string;
  batch_id: string;
  faculty_id: string | null;
  subject: string;
  room: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  faculty: { name: string; status: string } | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: string;
  event_date: string | null;
  venue: string;
  contact_faculty_id: string | null;
  faculty: { name: string; room: string } | null;
};

export const ATTENDANCE_THRESHOLD = 75;

export const STATUS_LABELS: Record<string, string> = {
  available: "Free",
  in_class: "In class",
  busy: "Busy",
  on_leave: "On leave",
};

export function statusDotClass(status: string) {
  if (status === "available") return "bg-success";
  if (status === "in_class") return "bg-brand";
  if (status === "busy") return "bg-warning";
  return "bg-danger";
}

export function formatTime(value: string) {
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export function todayIndex() {
  return new Date().getDay();
}

export function minutesOfDay(value: string) {
  const [h, m] = value.split(":");
  return Number(h) * 60 + Number(m);
}

export async function fetchBatches() {
  const { data, error } = await supabase
    .from("batches")
    .select("id, department, number, label")
    .order("department")
    .order("number");
  if (error) throw error;
  return (data ?? []) as Batch[];
}

export async function fetchFaculty() {
  const { data, error } = await supabase
    .from("faculty")
    .select("id, user_id, name, department, subject, room, status, status_note")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Faculty[];
}

export async function fetchLectures(batchId: string) {
  const { data, error } = await supabase
    .from("lectures")
    .select(
      "id, batch_id, faculty_id, subject, room, day_of_week, start_time, end_time, faculty:faculty_id (name, status)",
    )
    .eq("batch_id", batchId)
    .order("day_of_week")
    .order("start_time");
  if (error) throw error;
  return (data ?? []) as unknown as Lecture[];
}

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select(
      "id, title, body, category, event_date, venue, contact_faculty_id, faculty:contact_faculty_id (name, room)",
    )
    .order("event_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as Announcement[];
}

export type AttendanceRow = {
  id: string;
  subject: string;
  class_date: string;
  present: boolean;
};

export async function fetchMyAttendance(userId: string) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, subject, class_date, present")
    .eq("student_id", userId)
    .order("class_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export type SubjectSummary = {
  subject: string;
  attended: number;
  total: number;
  percent: number;
  needed: number;
};

export function summarise(rows: AttendanceRow[]): SubjectSummary[] {
  const map = new Map<string, { attended: number; total: number }>();
  for (const row of rows) {
    const entry = map.get(row.subject) ?? { attended: 0, total: 0 };
    entry.total += 1;
    if (row.present) entry.attended += 1;
    map.set(row.subject, entry);
  }
  return [...map.entries()]
    .map(([subject, { attended, total }]) => {
      const percent = total === 0 ? 0 : Math.round((attended / total) * 100);
      // classes to attend in a row before crossing the 75% line
      let needed = 0;
      let a = attended;
      let t = total;
      while (t > 0 && a / t < ATTENDANCE_THRESHOLD / 100 && needed < 200) {
        a += 1;
        t += 1;
        needed += 1;
      }
      return { subject, attended, total, percent, needed };
    })
    .sort((x, y) => x.percent - y.percent);
}
