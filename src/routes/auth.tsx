import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LectureCloud" },
      {
        name: "description",
        content: "Sign in to track your attendance or update faculty availability.",
      },
      { property: "og:title", content: "Sign in — LectureCloud" },
      { property: "og:description", content: "Student and faculty access to LectureCloud." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim(), role },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <PageShell>
      <section className="relative z-10 mx-auto max-w-md px-6 pb-20 pt-6">
        <div className="rounded-3xl bg-white/95 p-6 shadow-2xl shadow-black/30 ring-1 ring-white/60">
          <h1 className="text-2xl font-bold text-duskdeep">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-duskdeep/50">
            Students &amp; faculty
          </p>

          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  maxLength={80}
                  className="w-full rounded-xl bg-duskdeep/5 px-4 py-3 text-sm text-duskdeep outline-none ring-1 ring-duskdeep/10"
                />
                <div className="flex gap-2">
                  {(["student", "faculty"] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={
                        role === r
                          ? "chrome flex-1 rounded-xl py-2 text-sm font-semibold text-duskdeep"
                          : "flex-1 rounded-xl bg-duskdeep/5 py-2 text-sm text-duskdeep/70 ring-1 ring-duskdeep/10"
                      }
                    >
                      {r === "student" ? "Student" : "Faculty"}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="College email"
              maxLength={255}
              className="w-full rounded-xl bg-duskdeep/5 px-4 py-3 text-sm text-duskdeep outline-none ring-1 ring-duskdeep/10"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              maxLength={72}
              className="w-full rounded-xl bg-duskdeep/5 px-4 py-3 text-sm text-duskdeep outline-none ring-1 ring-duskdeep/10"
            />
            <button
              type="submit"
              disabled={busy}
              className="chrome w-full rounded-xl py-3 text-sm font-semibold text-duskdeep disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={onGoogle}
            className="mt-3 w-full rounded-xl bg-duskdeep py-3 text-sm font-semibold text-white"
          >
            Continue with Google
          </button>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-duskdeep/60 underline"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </PageShell>
  );
}
