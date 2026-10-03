import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchAnnouncements, type Announcement } from "@/lib/campus";

const DISMISS_KEY = "lc-countdown-dismissed";

function nextEvent(list: Announcement[]): Announcement | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = list
    .filter((a) => a.event_date && new Date(`${a.event_date}T00:00:00`) >= today)
    .sort(
      (a, b) =>
        new Date(`${a.event_date}T00:00:00`).getTime() -
        new Date(`${b.event_date}T00:00:00`).getTime(),
    );
  return upcoming[0] ?? null;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!target) return null;
    const diff = Math.max(0, target.getTime() - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds };
  }, [target, now]);
}

export function EventCountdown() {
  const list = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const event = useMemo(() => nextEvent(list.data ?? []), [list.data]);
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const target = useMemo(
    () => (event?.event_date ? new Date(`${event.event_date}T09:00:00`) : null),
    [event],
  );
  const cd = useCountdown(target);

  const dismissKey = `${event?.id}:${event?.event_date}:${event?.title}`;

  if (!event || !cd || dismissed === dismissKey) return null;

  const units = [
    { label: "days", value: cd.days },
    { label: "hrs", value: cd.hours },
    { label: "min", value: cd.minutes },
    { label: "sec", value: cd.seconds },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-xs animate-enter">
      <div className="rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-white/60 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-duskdeep/50">
              {event.category || "Upcoming"}
            </p>
            <h2 className="mt-0.5 text-base font-bold leading-tight text-duskdeep">
              {event.title}
            </h2>
            <p className="mt-0.5 text-xs text-duskdeep/60">
              {new Date(`${event.event_date}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {event.venue ? ` · ${event.venue}` : ""}
            </p>
          </div>
          <button
            aria-label="Dismiss countdown"
            onClick={() => {
              setDismissed(dismissKey);
              try {
                localStorage.setItem(DISMISS_KEY, dismissKey);
              } catch {
                /* ignore */
              }
            }}
            className="rounded-full px-2 py-1 text-sm font-bold text-duskdeep/40 hover:text-duskdeep"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {units.map((u) => (
            <div
              key={u.label}
              className="rounded-xl bg-duskdeep/5 py-2 text-center ring-1 ring-duskdeep/10"
            >
              <div className="font-mono text-base font-bold tabular-nums text-duskdeep">
                {String(u.value).padStart(2, "0")}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-duskdeep/50">
                {u.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
