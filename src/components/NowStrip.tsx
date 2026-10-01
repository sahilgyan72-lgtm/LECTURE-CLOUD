import { useEffect, useState } from "react";
import { formatTime, minutesOfDay } from "@/lib/campus";
import { DAYS, lecturesForBatch, type Lecture } from "@/lib/timetable";

function fmtMins(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${r}m` : `${r} min`;
}

export function NowStrip({ batch }: { batch: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;

  const wd = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const all = lecturesForBatch(batch).filter((l) => l.subject);
  const today = all.filter((l) => l.day === wd);
  const current = today.find((l) => minutesOfDay(l.start) <= nowMin && nowMin < minutesOfDay(l.end));
  let next: Lecture | undefined = today.find((l) => minutesOfDay(l.start) > nowMin);
  let nextLabel = "";
  if (!next) {
    for (let i = 1; i <= 7; i++) {
      const d = ((wd + i - 1) % 7) + 1;
      const found = all.find((l) => l.day === d);
      if (found) {
        next = found;
        nextLabel = i === 1 ? "Tomorrow" : DAYS[d - 1];
        break;
      }
    }
  }

  const Cell = ({ label, l, note }: { label: string; l?: Lecture; note: string }) => (
    <div className="flex-1 px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-duskdeep/60">{label}</p>
      {l ? (
        <>
          <p className="mt-1 font-bold text-duskdeep">{l.subject}</p>
          <p className="text-xs text-duskdeep/70">
            {l.faculty ? `Prof. ${l.faculty} · ` : ""}Room {l.room} · {formatTime(l.start)}
          </p>
          <p className="mt-1 font-mono text-[11px] text-duskdeep">{note}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-duskdeep/70">{note}</p>
      )}
    </div>
  );

  return (
    <div className="chrome flex flex-col divide-y divide-duskdeep/10 rounded-2xl shadow-xl shadow-black/20 ring-1 ring-white/50 sm:flex-row sm:divide-x sm:divide-y-0">
      <div className="flex items-center gap-2 px-5 py-4">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
        </span>
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-duskdeep">Right now</span>
      </div>
      <Cell
        label="Running"
        l={current}
        note={current ? `Ends in ${fmtMins(minutesOfDay(current.end) - nowMin)}` : "No lecture running"}
      />
      <Cell
        label={nextLabel ? `Next · ${nextLabel}` : "Up next"}
        l={next}
        note={
          next
            ? nextLabel
              ? `${nextLabel} at ${formatTime(next.start)}`
              : `Starts in ${fmtMins(minutesOfDay(next.start) - nowMin)}`
            : "Nothing scheduled"
        }
      />
    </div>
  );
}
