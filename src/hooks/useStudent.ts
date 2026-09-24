import { useCallback, useEffect, useState } from "react";

export type SavedStudent = { roll: string; name: string; batch: string; dept: string };
const KEY = "lecturecloud.student";

export function useStudent() {
  const [student, setStudentState] = useState<SavedStudent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setStudentState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setStudent = useCallback((s: SavedStudent | null) => {
    setStudentState(s);
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  }, []);

  return { student, setStudent, ready };
}
