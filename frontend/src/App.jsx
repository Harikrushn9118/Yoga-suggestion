import { useCallback, useEffect, useRef, useState } from "react";
import { Leaf, LogIn, LogOut, MessageCircle, MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import AuthScreen from "./components/AuthScreen";
import ThemeToggle from "./components/ThemeToggle";
import SearchInput from "./components/SearchInput";
import LoadingState from "./components/LoadingState";
import SourcesList from "./components/SourcesList";
import ActionButtons from "./components/ActionButtons";
import { apiFetch } from "./lib/api";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function App() {
  const [screen, setScreen] = useState("checking");
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const endOfMessagesRef = useRef(null);
  const abortRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await apiFetch("/conversations");
      if (!response.ok) return;
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (loadError) {
      console.error("Could not load saved chats:", loadError);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    apiFetch("/auth/me")
      .then(async (response) => {
        if (!mounted) return;
        if (!response.ok) {
          setScreen("welcome");
          return;
        }
        const data = await response.json();
        if (!mounted) return;
        setUser(data.user);
        setScreen("signed-in");
        loadConversations();
      })
      .catch(() => {
        if (mounted) setScreen("welcome");
      });
    return () => { mounted = false; };
  }, [loadConversations]);

  const handleAuthenticated = useCallback((signedInUser) => {
    setUser(signedInUser);
    setScreen("signed-in");
    setConversationId(null);
    setMessages([]);
    loadConversations();
  }, [loadConversations]);

  const startNewChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setConversationId(null);
    setMessages([]);
    setQuery("");
    setError("");
    setIsLoading(false);
  };

  const openConversation = async (id) => {
    setError("");
    try {
      const response = await apiFetch(`/conversations/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not open this chat.");
      setConversationId(data.conversation.id);
      setMessages(data.conversation.messages || []);
    } catch (openError) {
      setError(openError.message || "Could not open this chat.");
    }
  };

  const handleAsk = async () => {
    const question = query.trim();
    if (!question || isLoading) return;
    const earlierMessages = messages;
    setQuery("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: question, createdAt: new Date().toISOString() }]);
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await apiFetch("/ask", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          question,
          conversationId,
          history: earlierMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not get an answer. Please try again.");
      setConversationId(data.conversationId || conversationId);
      setMessages((current) => [...current, {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        isUnsafe: Boolean(data.isUnsafe),
        safeAlternative: data.safeAlternative || "",
        interactionId: data.interactionId || "",
        createdAt: new Date().toISOString(),
      }]);
      if (screen === "signed-in") loadConversations();
    } catch (askError) {
      if (askError.name !== "AbortError") {
        setMessages((current) => [...current, {
          role: "assistant",
          content: askError.message || "Sorry, something went wrong. Please try again.",
          sources: [],
          createdAt: new Date().toISOString(),
        }]);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const handleFeedback = async (interactionId, type) => {
    try {
      const response = await apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({ questionId: interactionId, feedback: type }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not save feedback.");
      }
    } catch (feedbackError) {
      setError(feedbackError.message || "Could not save feedback.");
    }
  };

  const handleLogout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); }
    finally {
      setUser(null);
      setConversations([]);
      setConversationId(null);
      setMessages([]);
      setScreen("welcome");
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  if (screen === "checking") {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] text-emerald-800 dark:bg-zinc-950 dark:text-emerald-300"><div className="flex items-center gap-3"><Leaf className="h-6 w-6 animate-pulse" />Loading Yogaflow…</div></div>;
  }

  if (screen === "welcome") {
    return <AuthScreen onGuest={() => setScreen("guest")} onAuthenticated={handleAuthenticated} />;
  }

  const isSignedIn = screen === "signed-in";

  return (
    <div className="flex min-h-screen bg-[#f7f8f5] text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      {isSignedIn && sidebarOpen && (
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200/80 bg-[#f1f3ef] p-4 dark:border-white/10 dark:bg-zinc-900 md:flex">
          <div className="mb-8 flex items-center gap-3 px-2 pt-2">
            <span className="rounded-xl bg-emerald-800 p-2 text-white"><Leaf className="h-5 w-5" /></span>
            <span className="text-lg font-semibold">Yogaflow</span>
          </div>
          <button onClick={startNewChat} className="mb-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"><MessageSquarePlus className="h-4 w-4" />New chat</button>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Your chats</div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 ? <p className="px-2 py-3 text-sm text-slate-500 dark:text-zinc-500">Your saved chats will appear here.</p> : conversations.map((chat) => (
              <button key={chat.id} onClick={() => openConversation(chat.id)} className={`w-full rounded-xl px-3 py-2.5 text-left transition ${conversationId === chat.id ? "bg-white text-emerald-900 shadow-sm dark:bg-zinc-800 dark:text-emerald-200" : "text-slate-600 hover:bg-white/70 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>
                <span className="block truncate text-sm font-medium">{chat.title}</span>
                <span className="mt-1 block text-xs text-slate-400">{formatDate(chat.updatedAt)}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <div className="truncate px-2 text-sm font-medium">{user?.name || user?.email}</div>
            <div className="truncate px-2 pt-1 text-xs text-slate-500 dark:text-zinc-400">{user?.email}</div>
            <button onClick={handleLogout} className="mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        </aside>
      )}

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 sm:px-7 dark:border-white/10">
          <div className="flex items-center gap-3">
            {isSignedIn && <button aria-label={sidebarOpen ? "Hide chat history" : "Show chat history"} onClick={() => setSidebarOpen((open) => !open)} className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:inline-flex">{sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}</button>}
            <span className="rounded-lg bg-emerald-800 p-1.5 text-white md:hidden"><Leaf className="h-4 w-4" /></span>
            <div><div className="font-semibold">Yogaflow</div><div className="hidden text-xs text-slate-500 dark:text-zinc-400 sm:block">Yoga assistant</div></div>
          </div>
          <div className="flex items-center gap-2">
            {!isSignedIn ? <><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">Guest</span>{messages.length > 0 && <button onClick={startNewChat} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label="Start a new chat"><MessageSquarePlus className="h-5 w-5" /></button>}<button onClick={() => setScreen("welcome")} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-zinc-800"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Sign in</span></button></> : <button onClick={startNewChat} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden" aria-label="Start a new chat"><MessageSquarePlus className="h-5 w-5" /></button>}
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-7">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
              <div className="mb-5 rounded-2xl bg-emerald-100 p-4 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"><Sparkles className="h-7 w-7" /></div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What would you like to know?</h1>
              <p className="mt-3 max-w-lg text-slate-500 dark:text-zinc-400">Ask about yoga, poses, or building a routine. You can ask follow-up questions in the same chat.</p>
              {!isSignedIn && <p className="mt-2 text-sm text-slate-400">Guest chats are temporary. Sign in to save your history.</p>}
            </div>
          ) : (
            <div className="flex-1 space-y-7 py-8">
              {messages.map((message, index) => message.role === "user" ? (
                <div key={`${index}-${message.createdAt}`} className="flex justify-end">
                  <div className="max-w-[88%] rounded-3xl rounded-br-md bg-emerald-800 px-5 py-3.5 text-[15px] leading-7 text-white shadow-sm">{message.content}</div>
                </div>
              ) : (
                <div key={`${index}-${message.createdAt}`} className="flex gap-3 sm:gap-4">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200"><MessageCircle className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1 pt-1">
                    {message.isUnsafe && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">{message.safeAlternative || "Please consult a qualified healthcare professional for medical guidance."}</div>}
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-zinc-200">{message.content}</p>
                    <SourcesList sources={message.sources || []} />
                    {isSignedIn && message.interactionId && <ActionButtons onFeedback={(type) => handleFeedback(message.interactionId, type)} />}
                  </div>
                </div>
              ))}
              {isLoading && <LoadingState />}
              <div ref={endOfMessagesRef} />
            </div>
          )}

          {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          <div className="sticky bottom-0 bg-gradient-to-t from-[#f7f8f5] via-[#f7f8f5] to-transparent pb-5 pt-3 dark:from-zinc-950 dark:via-zinc-950">
            <SearchInput query={query} setQuery={setQuery} handleAsk={handleAsk} handleStop={handleStop} isLoading={isLoading} />
            <p className="mt-3 text-center text-xs text-slate-400">Yogaflow can make mistakes. It does not provide medical advice.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
