import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [night, setNight] = useState(false);
  useEffect(() => setNight(document.documentElement.classList.contains("night")), []);

  const toggle = () => {
    const next = !night;
    setNight(next);
    document.documentElement.classList.toggle("night", next);
    try {
      localStorage.setItem("lc-theme", next ? "night" : "dusk");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={night ? "Switch to dusk mode" : "Switch to dark mode"}
      title={night ? "Dusk mode" : "Dark mode"}
      className="grid size-9 place-items-center rounded-full text-white/85 ring-1 ring-white/25 hover:bg-white/10"
    >
      {night ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
