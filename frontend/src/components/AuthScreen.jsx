import { useEffect, useRef, useState } from "react";
import { Leaf, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { apiFetch } from "../lib/api";

function AuthScreen({ onGuest, onAuthenticated }) {
  const [mode, setMode] = useState("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined;

    let active = true;
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setError("");
          setIsSubmitting(true);
          try {
            const response = await apiFetch("/auth/google", {
              method: "POST",
              body: JSON.stringify({ credential }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Google sign-in failed.");
            onAuthenticated(data.user);
          } catch (googleError) {
            setError(googleError.message || "Google sign-in failed.");
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.min(360, Math.max(220, googleButtonRef.current.clientWidth || 320)),
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => { active = false; };
    }

    let script = document.querySelector('script[data-google-identity="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderGoogleButton);
    return () => {
      active = false;
      script.removeEventListener("load", renderGoogleButton);
    };
  }, [googleClientId, mode, onAuthenticated]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const endpoint = mode === "signup" ? "/auth/register" : "/auth/login";
      const body = mode === "signup" ? { name, email, password } : { email, password };
      const response = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      onAuthenticated(data.user);
    } catch (authError) {
      setError(authError.message || "Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-10 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-xl shadow-emerald-950/5 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1.05fr_.95fr]">
          <section className="relative hidden min-h-[610px] flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 p-10 text-white md:flex">
            <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full bg-lime-200/10 blur-2xl" />
            <div className="relative flex items-center gap-3 text-xl font-semibold">
              <span className="rounded-xl bg-white/10 p-2"><Leaf className="h-6 w-6" /></span>
              Yogaflow
            </div>
            <div className="relative max-w-md">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-emerald-100">Your yoga companion</p>
              <h1 className="text-4xl font-semibold leading-tight">A thoughtful space for your yoga questions.</h1>
              <p className="mt-5 leading-7 text-emerald-50/80">Ask a question, follow up naturally, and keep your conversations together when you have an account.</p>
            </div>
            <div className="relative grid grid-cols-2 gap-3 text-sm text-emerald-50/90">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><MessageCircle className="mb-3 h-5 w-5" />Continue a conversation</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="mb-3 h-5 w-5" />Choose guest or account</div>
            </div>
          </section>

          <section className="flex min-h-[610px] flex-col justify-center p-7 sm:p-10">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <span className="rounded-xl bg-emerald-700 p-2 text-white"><Leaf className="h-5 w-5" /></span>
              <span className="text-lg font-semibold">Yogaflow</span>
            </div>

            {mode === "welcome" ? (
              <>
                <div className="mb-7">
                  <div className="mb-4 inline-flex rounded-full bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"><Sparkles className="h-5 w-5" /></div>
                  <h2 className="text-3xl font-semibold tracking-tight">How would you like to continue?</h2>
                  <p className="mt-2 text-slate-500 dark:text-zinc-400">Sign in to keep your chat history, or try Yogaflow as a guest.</p>
                </div>
                {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
                <button onClick={() => setMode("login")} className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-900">Sign in or create account</button>
                {googleClientId ? (
                  <div className="mt-3 flex min-h-11 justify-center" ref={googleButtonRef} />
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">Google sign-in will be available after setup.</p>
                )}
                <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />or<span className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" /></div>
                <button onClick={onGuest} className="w-full rounded-xl border border-slate-300 px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Continue as guest</button>
                <p className="mt-5 text-center text-xs leading-5 text-slate-400">Guest chats stay in this browser session. Sign in to save and revisit them.</p>
              </>
            ) : (
              <>
                <button onClick={() => { setMode("welcome"); setError(""); }} className="mb-6 w-fit text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-300">← Back</button>
                <h2 className="text-3xl font-semibold tracking-tight">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
                <p className="mb-7 mt-2 text-slate-500 dark:text-zinc-400">{mode === "signup" ? "Your conversations will be saved to your account." : "Sign in to pick up where you left off."}</p>
                <form onSubmit={submit} className="space-y-4">
                  {mode === "signup" && <label className="block text-sm font-medium">Name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-zinc-700 dark:bg-zinc-800" /></label>}
                  <label className="block text-sm font-medium">Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-zinc-700 dark:bg-zinc-800" /></label>
                  <label className="block text-sm font-medium">Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "signup" ? 8 : undefined} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-zinc-700 dark:bg-zinc-800" /></label>
                  {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
                  <button disabled={isSubmitting} className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60">{isSubmitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
                </form>
                {googleClientId && <div className="mt-3 flex min-h-11 justify-center" ref={googleButtonRef} />}
                <p className="mt-5 text-center text-sm text-slate-500 dark:text-zinc-400">
                  {mode === "signup" ? "Already have an account? " : "New to Yogaflow? "}
                  <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">{mode === "signup" ? "Sign in" : "Create an account"}</button>
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default AuthScreen;
