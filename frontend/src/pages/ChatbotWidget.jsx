import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are Velour, the elegant AI concierge of Grand Velour Hotels & Resorts — a luxury hotel brand in the Philippines. You assist guests with:

- Room information (Single ₱1,500/night, Double ₱2,500/night, Suite ₱5,000/night, Deluxe ₱8,000/night)
- Booking inquiries, check-in/check-out questions
- Hotel amenities, facilities, and services
- Floor map and navigation within the hotel
- General hospitality assistance

Personality: Warm, refined, elegant — like a world-class hotel concierge. Use graceful language. Keep responses concise (2-4 sentences max). Occasionally use light luxury vocabulary. Never break character. If asked something outside hotel topics, gently redirect to hotel services.

Start responses with a subtle acknowledgment. End with an offer to help further when appropriate.`;

export default function ChatbotWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to Grand Velour. I'm Velour, your personal concierge. How may I assist you today?",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse]     = useState(true);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setPulse(false);
    }
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I apologize, I'm having trouble responding. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "My apologies — I seem to be momentarily unavailable. Please try again shortly.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <style>{css}</style>

      {/* ── Floating Button ── */}
      <button
        className={`gv-chat-btn ${pulse ? "gv-pulse" : ""}`}
        onClick={() => setOpen(o => !o)}
        title="Chat with Velour"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!open && pulse && <span className="gv-badge" />}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="gv-chat-window">

          {/* Header */}
          <div className="gv-chat-header">
            <div className="gv-header-left">
              <div className="gv-avatar">V</div>
              <div>
                <div className="gv-header-name">VELOUR</div>
                <div className="gv-header-sub">Grand Velour Concierge · Online</div>
              </div>
            </div>
            <button className="gv-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Gold divider */}
          <div className="gv-divider" />

          {/* Messages */}
          <div className="gv-messages">
            {messages.map((m, i) => (
              <div key={i} className={`gv-msg-wrap ${m.role === "user" ? "gv-user-wrap" : "gv-ai-wrap"}`}>
                {m.role === "assistant" && (
                  <div className="gv-msg-avatar">V</div>
                )}
                <div className={`gv-msg ${m.role === "user" ? "gv-user-msg" : "gv-ai-msg"}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="gv-msg-wrap gv-ai-wrap">
                <div className="gv-msg-avatar">V</div>
                <div className="gv-ai-msg gv-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Gold divider */}
          <div className="gv-divider" />

          {/* Input */}
          <div className="gv-input-area">
            <textarea
              ref={inputRef}
              className="gv-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about rooms, bookings, amenities..."
              rows={1}
              disabled={loading}
            />
            <button
              className={`gv-send-btn ${(!input.trim() || loading) ? "gv-send-disabled" : ""}`}
              onClick={send}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="gv-chat-footer">Powered by AI · Grand Velour Hotels & Resorts</div>
        </div>
      )}
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@300;400;500&display=swap');

  /* ── Floating Button ── */
  .gv-chat-btn {
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 9998;
    width: 56px;
    height: 56px;
    background: #c9a96e;
    border: none;
    color: #0d0d0d;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px rgba(201,169,110,0.35);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .gv-chat-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 32px rgba(201,169,110,0.5);
  }
  .gv-pulse {
    animation: gvPulseRing 2s infinite;
  }
  @keyframes gvPulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); }
    70%  { box-shadow: 0 0 0 12px rgba(201,169,110,0); }
    100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
  }
  .gv-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 10px;
    height: 10px;
    background: #7eb87e;
    border-radius: 50%;
    border: 2px solid #0d0d0d;
  }

  /* ── Chat Window ── */
  .gv-chat-window {
    position: fixed;
    bottom: 100px;
    right: 32px;
    z-index: 9999;
    width: 360px;
    max-height: 520px;
    background: #111;
    border: 1px solid #2a2520;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    animation: gvSlideUp 0.25s ease forwards;
  }
  @keyframes gvSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .gv-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #0d0d0d;
  }
  .gv-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .gv-avatar {
    width: 36px;
    height: 36px;
    background: #c9a96e;
    color: #0d0d0d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .gv-header-name {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 3px;
    color: #c9a96e;
  }
  .gv-header-sub {
    font-family: 'Jost', sans-serif;
    font-size: 10px;
    color: #4a3f32;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
  .gv-close-btn {
    background: none;
    border: none;
    color: #4a3f32;
    cursor: pointer;
    font-size: 12px;
    padding: 4px;
    transition: color 0.2s;
  }
  .gv-close-btn:hover { color: #c9a96e; }

  /* ── Divider ── */
  .gv-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a96e, transparent);
    opacity: 0.3;
  }

  /* ── Messages ── */
  .gv-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 320px;
    scrollbar-width: thin;
    scrollbar-color: #2a2520 transparent;
  }
  .gv-messages::-webkit-scrollbar { width: 4px; }
  .gv-messages::-webkit-scrollbar-track { background: transparent; }
  .gv-messages::-webkit-scrollbar-thumb { background: #2a2520; }

  .gv-msg-wrap {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .gv-ai-wrap { flex-direction: row; }
  .gv-user-wrap { flex-direction: row-reverse; }

  .gv-msg-avatar {
    width: 26px;
    height: 26px;
    background: #c9a96e;
    color: #0d0d0d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .gv-msg {
    max-width: 78%;
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    padding: 10px 14px;
  }
  .gv-ai-msg {
    background: #1a1814;
    border: 1px solid #2a2520;
    color: #c8bfb0;
    border-bottom-left-radius: 0;
  }
  .gv-user-msg {
    background: rgba(201,169,110,0.12);
    border: 1px solid rgba(201,169,110,0.25);
    color: #e8dcc8;
    border-bottom-right-radius: 0;
  }

  /* ── Typing indicator ── */
  .gv-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 16px;
  }
  .gv-typing span {
    width: 6px;
    height: 6px;
    background: #c9a96e;
    border-radius: 50%;
    animation: gvDot 1.2s infinite;
    opacity: 0.4;
  }
  .gv-typing span:nth-child(2) { animation-delay: 0.2s; }
  .gv-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes gvDot {
    0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
    40%            { opacity: 1;   transform: scale(1.3); }
  }

  /* ── Input Area ── */
  .gv-input-area {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px 16px;
    background: #0d0d0d;
  }
  .gv-input {
    flex: 1;
    background: #1a1814;
    border: 1px solid #2a2520;
    color: #e8dcc8;
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    padding: 10px 14px;
    resize: none;
    outline: none;
    line-height: 1.5;
    max-height: 80px;
    transition: border-color 0.2s;
    scrollbar-width: none;
  }
  .gv-input::-webkit-scrollbar { display: none; }
  .gv-input:focus { border-color: rgba(201,169,110,0.4); }
  .gv-input::placeholder { color: #4a3f32; }
  .gv-input:disabled { opacity: 0.5; }

  .gv-send-btn {
    width: 38px;
    height: 38px;
    background: #c9a96e;
    border: none;
    color: #0d0d0d;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.1s;
  }
  .gv-send-btn:hover:not(.gv-send-disabled) {
    background: #e8c87a;
    transform: scale(1.05);
  }
  .gv-send-disabled {
    background: #2a2520;
    color: #4a3f32;
    cursor: not-allowed;
  }

  /* ── Footer ── */
  .gv-chat-footer {
    text-align: center;
    font-family: 'Jost', sans-serif;
    font-size: 9px;
    letter-spacing: 1.5px;
    color: #2a2520;
    padding: 8px;
    text-transform: uppercase;
    background: #0d0d0d;
  }
`;