import { useState, useRef, useEffect } from "react";

// ─── Rule-based response engine ───────────────────────────────────────────────
const RULES = [
  // Greetings
  {
    patterns: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"],
    response: "Welcome to Grand Velour! I'm Velour, your personal concierge. How may I assist you today — rooms, bookings, or hotel services?",
  },
  // Rooms — general
  {
    patterns: ["room", "rooms", "accommodation", "stay", "available room"],
    response: "Grand Velour offers four room types:\n• Single — ₱1,500/night (1 guest)\n• Double — ₱2,500/night (2 guests)\n• Deluxe — ₱8,000/night (up to 3 guests)\n• Suite — ₱5,000/night (up to 4 guests)\n\nWould you like to know more about a specific room type?",
  },
  // Single room
  {
    patterns: ["single", "single room"],
    response: "Our Single Room is ₱1,500 per night, ideal for solo travelers. It includes a comfortable bed, private bathroom, and all essential amenities. Shall I help you reserve one?",
  },
  // Double room
  {
    patterns: ["double", "double room"],
    response: "Our Double Room is ₱2,500 per night, perfect for couples or two guests. It features a spacious layout and premium furnishings. Would you like to book one?",
  },
  // Suite
  {
    patterns: ["suite", "suite room"],
    response: "Our Suite is ₱5,000 per night, offering a luxurious stay for up to 4 guests with a separate living area and premium amenities. Shall I assist you with a reservation?",
  },
  // Deluxe
  {
    patterns: ["deluxe", "deluxe room"],
    response: "Our Deluxe Room is ₱8,000 per night — our finest offering, with elevated interiors, premium bedding, and exclusive services for up to 3 guests. Would you like to reserve this room?",
  },
  // Price / rates
  {
    patterns: ["price", "cost", "rate", "how much", "rates", "pricing"],
    response: "Our nightly rates are:\n• Single — ₱1,500\n• Double — ₱2,500\n• Suite — ₱5,000\n• Deluxe — ₱8,000\n\nAll rates are per night. Is there a room type you're interested in?",
  },
  // Booking — how to
  {
    patterns: ["book", "booking", "reserve", "reservation", "make a booking", "how to book"],
    response: "To make a reservation, click '+ New Booking' in the navigation bar or visit the Book page. You'll select your hotel, room type, and dates — then confirm your details. May I help with anything else?",
  },
  // Check booking
  {
    patterns: ["check booking", "my booking", "find booking", "look up", "booking reference", "booking status"],
    response: "You can look up your booking using the 'Booking Lookup' page — just enter your booking reference (e.g. GV-000001) and the email used during booking. Would you like help with anything else?",
  },
  // Cancel booking
  {
    patterns: ["cancel", "cancellation", "cancel booking"],
    response: "To cancel a booking, go to 'My Bookings', click on the reservation, and select 'Cancel'. Please note that confirmed bookings can be cancelled, but the action cannot be undone. Need more help?",
  },
  // Reschedule
  {
    patterns: ["reschedule", "change date", "change dates", "move booking", "new dates"],
    response: "To reschedule, visit 'My Bookings', open your booking, and select 'Reschedule'. You can pick new check-in and check-out dates. Is there anything else I can help with?",
  },
  // Check-in
  {
    patterns: ["check in", "check-in", "checkin", "arrival"],
    response: "Standard check-in time is 2:00 PM. Early check-in may be available upon request — please let our front desk know in advance. Present your booking receipt or QR code upon arrival.",
  },
  // Check-out
  {
    patterns: ["check out", "check-out", "checkout", "departure"],
    response: "Standard check-out time is 12:00 PM (noon). Late check-out may be arranged depending on availability. We hope your stay was wonderful!",
  },
  // Amenities
  {
    patterns: ["amenities", "facilities", "services", "what is included", "what's included", "inclusions"],
    response: "Grand Velour amenities include:\n• Free Wi-Fi in all rooms\n• 24-hour room service\n• Daily housekeeping\n• In-house restaurant & bar\n• Concierge assistance\n• Secure parking\n• Laundry service\n\nIs there a specific service you'd like to know more about?",
  },
  // WiFi
  {
    patterns: ["wifi", "wi-fi", "internet", "connection"],
    response: "Complimentary high-speed Wi-Fi is available throughout all rooms and public areas of Grand Velour. No password is needed — just connect to the 'GrandVelour_Guest' network.",
  },
  // Parking
  {
    patterns: ["parking", "park", "car", "vehicle"],
    response: "Grand Velour offers secure on-site parking for all registered guests. Please inform the front desk upon check-in if you'll be bringing a vehicle.",
  },
  // Restaurant / food
  {
    patterns: ["restaurant", "food", "dining", "eat", "breakfast", "lunch", "dinner", "meal", "room service"],
    response: "Our in-house restaurant serves Filipino and international cuisine. Room service is available 24 hours. Breakfast is served from 6:00 AM to 10:00 AM. Would you like to know more?",
  },
  // Floor map / navigation
  {
    patterns: ["floor map", "floor plan", "map", "navigate", "where is", "location", "directions"],
    response: "You can view the hotel floor map on our Floor Map page, accessible from the main navigation. It shows room locations, elevators, dining areas, and amenities by floor. Anything else I can help with?",
  },
  // Contact / front desk
  {
    patterns: ["contact", "front desk", "reception", "call", "phone", "email", "reach"],
    response: "You can reach our front desk through the hotel contact details shown on the Hotel Detail page. Our staff is available 24/7 to assist you with any request.",
  },
  // Admin
  {
    patterns: ["admin", "admin panel", "admin dashboard", "administrator"],
    response: "The Admin Panel is accessible to authorized administrators only. Admins can manage hotels, rooms, clients, bookings, and user accounts. Please sign in with your admin credentials to access it.",
  },
  // Staff
  {
    patterns: ["staff", "staff panel", "staff dashboard"],
    response: "The Staff Dashboard is available to hotel staff accounts. Staff can view and manage rooms and bookings, and cancel or reschedule reservations. Sign in with your staff credentials to access it.",
  },
  // Login / sign in
  {
    patterns: ["login", "sign in", "log in", "signin", "account"],
    response: "You can sign in via the 'Sign In' button on the navigation bar. If you don't have an account yet, you can create one on the same page. Remember to activate your account via email after registration.",
  },
  // Register / sign up
  {
    patterns: ["register", "sign up", "create account", "new account"],
    response: "To create an account, click 'Sign In' on the navigation bar and switch to the 'Create Account' tab. Fill in your details and you'll receive an activation email to verify your address.",
  },
  // Activation / verify email
  {
    patterns: ["activate", "activation", "verify email", "verification", "email verification", "not activated"],
    response: "After registering, check your email for an activation link from Grand Velour. Click the link to activate your account. If you didn't receive it, use the 'Resend Activation Email' option on the Sign In page.",
  },
  // Profile
  {
    patterns: ["profile", "my profile", "account details", "my account", "personal info"],
    response: "Your profile page displays your personal information, guest ID, member since date, and booking history. You can access it after signing in via the navigation menu.",
  },
  // Thank you
  {
    patterns: ["thank you", "thanks", "thank", "salamat"],
    response: "You're most welcome! It's our pleasure to assist. Is there anything else I may help you with at Grand Velour?",
  },
  // Goodbye
  {
    patterns: ["bye", "goodbye", "see you", "take care", "that's all", "thats all", "nothing else"],
    response: "Thank you for reaching out to Grand Velour. We look forward to welcoming you. Have a wonderful day!",
  },
  // Compliment
  {
    patterns: ["great", "awesome", "excellent", "wonderful", "amazing", "good job", "nice"],
    response: "Thank you for your kind words! Grand Velour strives to deliver excellence in every detail. Is there anything else I may assist you with?",
  },
];

const DEFAULT_RESPONSE = "I'm not quite sure I understand. You may ask me about our rooms, rates, bookings, check-in/check-out, amenities, or hotel services. How may I assist you?";

function getRuleBasedReply(input) {
  const lower = input.toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.patterns.some(p => lower.includes(p))) {
      return rule.response;
    }
  }
  return DEFAULT_RESPONSE;
}

// ─── Component ────────────────────────────────────────────────────────────────
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

  const send = () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate a brief typing delay for a natural feel
    setTimeout(() => {
      const reply = getRuleBasedReply(text);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Quick suggestion chips
  const SUGGESTIONS = ["Room rates", "How to book", "Check-in time", "Amenities", "Cancel booking"];

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

          <div className="gv-divider" />

          {/* Messages */}
          <div className="gv-messages">
            {messages.map((m, i) => (
              <div key={i} className={`gv-msg-wrap ${m.role === "user" ? "gv-user-wrap" : "gv-ai-wrap"}`}>
                {m.role === "assistant" && <div className="gv-msg-avatar">V</div>}
                <div className={`gv-msg ${m.role === "user" ? "gv-user-msg" : "gv-ai-msg"}`}>
                  {m.content.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.content.split("\n").length - 1 && <br />}</span>
                  ))}
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

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="gv-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="gv-chip" onClick={() => {
                  setMessages(prev => [...prev, { role: "user", content: s }]);
                  setLoading(true);
                  setTimeout(() => {
                    setMessages(prev => [...prev, { role: "assistant", content: getRuleBasedReply(s) }]);
                    setLoading(false);
                  }, 600);
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

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

          <div className="gv-chat-footer">Grand Velour Concierge · Rule-based Assistant</div>
        </div>
      )}
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@300;400;500&display=swap');

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
  .gv-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(201,169,110,0.5); }
  .gv-pulse { animation: gvPulseRing 2s infinite; }
  @keyframes gvPulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); }
    70%  { box-shadow: 0 0 0 12px rgba(201,169,110,0); }
    100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
  }
  .gv-badge {
    position: absolute; top: 8px; right: 8px;
    width: 10px; height: 10px;
    background: #7eb87e; border-radius: 50%; border: 2px solid #0d0d0d;
  }

  .gv-chat-window {
    position: fixed; bottom: 100px; right: 32px; z-index: 9999;
    width: 360px; max-height: 560px;
    background: #111; border: 1px solid #2a2520;
    display: flex; flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    animation: gvSlideUp 0.25s ease forwards;
  }
  @keyframes gvSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .gv-chat-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; background: #0d0d0d;
  }
  .gv-header-left { display: flex; align-items: center; gap: 12px; }
  .gv-avatar {
    width: 36px; height: 36px; background: #c9a96e; color: #0d0d0d;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; flex-shrink: 0;
  }
  .gv-header-name { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 3px; color: #c9a96e; }
  .gv-header-sub  { font-family: 'Jost', sans-serif; font-size: 10px; color: #4a3f32; letter-spacing: 0.5px; margin-top: 2px; }
  .gv-close-btn   { background: none; border: none; color: #4a3f32; cursor: pointer; font-size: 12px; padding: 4px; transition: color 0.2s; }
  .gv-close-btn:hover { color: #c9a96e; }

  .gv-divider { height: 1px; background: linear-gradient(90deg, transparent, #c9a96e, transparent); opacity: 0.3; }

  .gv-messages {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
    max-height: 300px;
    scrollbar-width: thin; scrollbar-color: #2a2520 transparent;
  }
  .gv-messages::-webkit-scrollbar { width: 4px; }
  .gv-messages::-webkit-scrollbar-track { background: transparent; }
  .gv-messages::-webkit-scrollbar-thumb { background: #2a2520; }

  .gv-msg-wrap { display: flex; gap: 8px; align-items: flex-end; }
  .gv-ai-wrap   { flex-direction: row; }
  .gv-user-wrap { flex-direction: row-reverse; }

  .gv-msg-avatar {
    width: 26px; height: 26px; background: #c9a96e; color: #0d0d0d;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600; flex-shrink: 0;
  }
  .gv-msg {
    max-width: 80%; font-family: 'Jost', sans-serif; font-size: 13px;
    line-height: 1.65; padding: 10px 14px;
  }
  .gv-ai-msg   { background: #1a1814; border: 1px solid #2a2520; color: #c8bfb0; border-bottom-left-radius: 0; }
  .gv-user-msg { background: rgba(201,169,110,0.12); border: 1px solid rgba(201,169,110,0.25); color: #e8dcc8; border-bottom-right-radius: 0; }

  .gv-typing { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
  .gv-typing span { width: 6px; height: 6px; background: #c9a96e; border-radius: 50%; animation: gvDot 1.2s infinite; opacity: 0.4; }
  .gv-typing span:nth-child(2) { animation-delay: 0.2s; }
  .gv-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes gvDot {
    0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
    40%            { opacity: 1;   transform: scale(1.3); }
  }

  /* ── Quick suggestion chips ── */
  .gv-suggestions {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 10px 14px; background: #0d0d0d;
    border-top: 1px solid #1a1612;
  }
  .gv-chip {
    background: rgba(201,169,110,0.08);
    border: 1px solid rgba(201,169,110,0.25);
    color: #c9a96e;
    font-family: 'Jost', sans-serif; font-size: 10px;
    letter-spacing: 1px; padding: 5px 10px; cursor: pointer;
    transition: all 0.2s; text-transform: uppercase;
  }
  .gv-chip:hover { background: rgba(201,169,110,0.18); border-color: #c9a96e; }

  .gv-input-area { display: flex; align-items: flex-end; gap: 8px; padding: 12px 16px; background: #0d0d0d; }
  .gv-input {
    flex: 1; background: #1a1814; border: 1px solid #2a2520; color: #e8dcc8;
    font-family: 'Jost', sans-serif; font-size: 13px; padding: 10px 14px;
    resize: none; outline: none; line-height: 1.5; max-height: 80px;
    transition: border-color 0.2s; scrollbar-width: none;
  }
  .gv-input::-webkit-scrollbar { display: none; }
  .gv-input:focus { border-color: rgba(201,169,110,0.4); }
  .gv-input::placeholder { color: #4a3f32; }
  .gv-input:disabled { opacity: 0.5; }

  .gv-send-btn {
    width: 38px; height: 38px; background: #c9a96e; border: none; color: #0d0d0d;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.2s, transform 0.1s;
  }
  .gv-send-btn:hover:not(.gv-send-disabled) { background: #e8c87a; transform: scale(1.05); }
  .gv-send-disabled { background: #2a2520; color: #4a3f32; cursor: not-allowed; }

  .gv-chat-footer {
    text-align: center; font-family: 'Jost', sans-serif; font-size: 9px;
    letter-spacing: 1.5px; color: #2a2520; padding: 8px;
    text-transform: uppercase; background: #0d0d0d;
  }
`;