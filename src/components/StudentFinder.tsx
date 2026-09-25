import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { findStudent } from "@/lib/students.functions";
import { DIVISION_BATCHES } from "@/lib/timetable";
import type { SavedStudent } from "@/hooks/useStudent";

export function StudentFinder({ onFound }: { onFound: (s: SavedStudent) => void }) {
  const find = useServerFn(findStudent);
  const [batch, setBatch] = useState("CP2");
  const [roll, setRoll] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roll.trim()) {
      toast.error("Enter your roll number");
      return;
    }
    setBusy(true);
    try {
      const s = await find({ data: { batch, roll } });
      if (!s) toast.error(`No student with roll ${roll} in batch ${batch}.`);
      else onFound(s);
    } catch {
      toast.error("Could not look that up. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/95 p-1.5 shadow-xl shadow-black/20 ring-1 ring-white/50">
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <select
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="rounded-xl bg-duskdeep/5 px-3 py-3 text-sm font-semibold text-duskdeep outline-none"
          aria-label="Batch"
        >
          {Object.entries(DIVISION_BATCHES).map(([div, list]) => (
            <optgroup key={div} label={div}>
              {list.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          placeholder="Roll no — e.g. 34"
          maxLength={10}
          className="flex-1 bg-transparent px-4 py-3 text-sm text-duskdeep outline-none placeholder:text-duskdeep/40"
        />
        <button disabled={busy} className="chrome rounded-xl px-5 py-3 text-sm font-semibold text-duskdeep disabled:opacity-60">
          {busy ? "Finding…" : "Show my timetable"}
        </button>
      </div>
    </form>
  );
}
