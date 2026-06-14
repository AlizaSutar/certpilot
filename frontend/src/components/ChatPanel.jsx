import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

export default function ChatPanel({ messages, onSend, loading, placeholder, suggestions = [] }) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = (value) => {
    const v = (value ?? text).trim();
    if (!v || loading) return;
    onSend(v);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-glow/15 text-ink border border-amber-glow/30"
                  : "bg-panel-raised text-ink border border-panel-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-panel-border bg-panel-raised px-4 py-2.5 text-sm text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running agent pipeline…
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full border border-panel-border bg-panel-surface px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-amber-glow/40 hover:text-amber-glow"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-panel-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-panel-border bg-panel-surface px-3 py-2 focus-within:border-amber-glow/40">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            onClick={() => submit()}
            disabled={loading || !text.trim()}
            className="flex items-center justify-center rounded-lg bg-amber-glow/15 p-1.5 text-amber-glow transition-colors hover:bg-amber-glow/25 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
