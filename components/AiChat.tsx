"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User, Loader2, RotateCcw, ChevronDown, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

interface AiPublicSettings {
  assistantName: string;
  greeting: string;
  provider: string;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

const SUGGESTED = [
  "What projects have you built?",
  "What's your tech stack?",
  "Tell me about your career.",
  "How can I contact you?",
];

// Teal palette — matches the main site's ocean/teal theme
const T = {
  bg:      "#020b14",
  bgCard:  "#040f1c",
  bgInput: "#020810",
  border:  "rgba(0,210,200,0.12)",
  borderH: "hsl(185,100%,48% / 0.35)",
  grad:    "linear-gradient(135deg, hsl(185,80%,22%), hsl(210,80%,18%))",
  bright:  "hsl(185,100%,60%)",
  mid:     "hsl(185,100%,48%)",
  glow:    "rgba(0,210,200,0.18)",
  text:    "hsl(185,60%,92%)",
  muted:   "rgba(180,240,240,0.45)",
  faint:   "rgba(180,240,240,0.18)",
};

export default function AiChat() {
  // ── ALL hooks must come before any early return ──
  const pathname = usePathname();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pulse, setPulse]       = useState(true);
  const [settings, setSettings] = useState<AiPublicSettings>({
    assistantName: "Portfolio Assistant",
    greeting: "Hi! I'm here to answer any questions about this portfolio. Ask me anything!",
    provider: "",
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/ai-settings")
      .then(r => r.json())
      .then((d: AiPublicSettings) => setSettings(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: uid(), role: "assistant",
        content: settings.greeting || "Hi! Ask me anything about this portfolio.", ts: new Date() }]);
      setPulse(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Early return AFTER all hooks ──
  if (pathname.startsWith("/admin")) return null;

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { id: uid(), role: "user", content: trimmed, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const history = [...messages.slice(1), userMsg].map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { id: uid(), role: "assistant", content: data.reply, ts: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: uid(), role: "assistant",
        content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`, ts: new Date() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
  }

  function reset() {
    setMessages([{ id: uid(), role: "assistant", content: settings.greeting, ts: new Date() }]);
  }

  function fmt(d: Date) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      {/* ── Floating button ── */}
      <div className="fixed bottom-[5.5rem] right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-center gap-1">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle AI assistant"
          className="relative w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: open
              ? "linear-gradient(135deg,hsl(215,70%,22%),hsl(215,70%,16%))"
              : T.grad,
            boxShadow: open
              ? "0 4px 20px rgba(0,60,120,0.5)"
              : `0 4px 24px rgba(0,200,190,0.4), 0 0 0 1px ${T.border}`,
          }}
        >
          {pulse && !open && (
            <span className="absolute inset-0 rounded-full"
              style={{ animation: "aiPulse 2.2s ease-out infinite", background: T.mid + "28" }} />
          )}
          <span style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform .3s" }}>
            {open
              ? <X size={20} color="white" strokeWidth={2.5} />
              : <Sparkles size={19} color="white" strokeWidth={2} />
            }
          </span>
        </button>

        {!open && (
          <span className="text-[10px] font-bold tracking-widest select-none"
            style={{ color: T.mid, textShadow: `0 0 8px ${T.glow}` }}>
            ASK AI
          </span>
        )}
      </div>

      {/* ── Chat window ── */}
      {open && (
        <div
          className="fixed bottom-[11rem] right-4 md:bottom-28 md:right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "min(390px, calc(100vw - 2rem))",
            height: "min(520px, calc(100vh - 14rem))",
            background: T.bgCard,
            border: `1px solid ${T.borderH}`,
            boxShadow: `0 32px 80px rgba(0,0,0,0.75), 0 0 60px ${T.glow}`,
            animation: "chatIn .28s cubic-bezier(.34,1.4,.64,1) both",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: T.grad, boxShadow: `0 0 16px rgba(0,200,190,0.35)` }}>
              <Bot size={16} color="white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ background: T.bright, border: `2.5px solid ${T.bgCard}` }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold font-syne truncate" style={{ color: T.text }}>
                {settings.assistantName}
              </p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: T.muted }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.bright }} />
                Online · Portfolio expert
              </p>
            </div>
            <button onClick={reset} title="New chat"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: T.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = T.bright)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
              <RotateCcw size={13} />
            </button>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: T.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = T.bright)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
              <ChevronDown size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: `${T.border} transparent` }}>

            {messages.map((msg, i) => (
              <div key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                style={{ animation: i === messages.length - 1 ? "msgIn .2s ease both" : "none" }}>

                <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5"
                  style={msg.role === "assistant"
                    ? { background: T.grad }
                    : { background: "hsl(262,60%,42%)" }}>
                  {msg.role === "assistant"
                    ? <Bot size={11} color="white" />
                    : <User size={11} color="white" />}
                </div>

                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <div className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                    style={msg.role === "assistant"
                      ? { background: T.bg, border: `1px solid ${T.border}`,
                          color: T.text, borderRadius: "4px 16px 16px 16px" }
                      : { background: T.grad, color: "#e0f8f8", fontWeight: 500,
                          borderRadius: "16px 4px 16px 16px",
                          boxShadow: `0 2px 14px rgba(0,200,190,0.3)` }
                    }>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] px-1 ${msg.role === "user" ? "text-right" : ""}`}
                    style={{ color: T.faint }}>
                    {fmt(msg.ts)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: T.grad }}>
                  <Bot size={11} color="white" />
                </div>
                <div className="px-4 py-3.5 flex items-center gap-1.5"
                  style={{ background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: "4px 16px 16px 16px" }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: T.mid, animation: `dot 1.2s ease ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-col gap-1.5 mt-2">
                <p className="text-[11px] font-semibold px-0.5 uppercase tracking-wider"
                  style={{ color: T.faint }}>
                  Try asking
                </p>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => ask(q)}
                    className="text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.015] active:scale-[0.98]"
                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.bright }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderH; e.currentTarget.style.boxShadow = `0 0 10px ${T.glow}`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}>
                    ↗ {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 shrink-0"
            style={{ borderTop: `1px solid ${T.border}`, background: T.bg }}>
            <div className="flex items-end gap-2 px-3 py-2 rounded-xl"
              style={{ background: T.bgInput, border: `1px solid ${T.border}` }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none resize-none"
                style={{ maxHeight: "80px", lineHeight: "1.5",
                  color: T.text, caretColor: T.mid }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 80) + "px";
                }}
              />
              <button onClick={() => ask(input)} disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-25 hover:scale-110 active:scale-95"
                style={{
                  background: input.trim() && !loading ? T.grad : "transparent",
                  boxShadow: input.trim() && !loading ? `0 0 14px rgba(0,200,190,0.35)` : "none",
                }}>
                {loading
                  ? <Loader2 size={14} color={T.mid} className="animate-spin" />
                  : <Send size={14} color={input.trim() ? "white" : T.faint} />}
              </button>
            </div>
            <p className="text-center text-[10px] mt-1.5" style={{ color: T.faint }}>
              Answers based on portfolio data · Enter to send
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatIn {
          from { opacity:0; transform:translateY(14px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dot {
          0%,60%,100% { transform:translateY(0); opacity:.35; }
          30%          { transform:translateY(-4px); opacity:1; }
        }
        @keyframes aiPulse {
          0%   { transform:scale(1);   opacity:.6; }
          70%  { transform:scale(1.9); opacity:0; }
          100% { transform:scale(1.9); opacity:0; }
        }
      `}</style>
    </>
  );
}
