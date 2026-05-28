import { useState } from "react";
import { API_BASE } from "../api";

export default function BookingLookup({ navigate }) {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const statusStyle = {
    confirmed: { color: "#7eb87e", border: "rgba(126,184,126,0.4)", bg: "rgba(126,184,126,0.1)" },
    cancelled: { color: "#c97b6e", border: "rgba(201,123,110,0.4)", bg: "rgba(201,123,110,0.1)" },
    rescheduled: { color: "#c9a96e", border: "rgba(201,169,110,0.4)", bg: "rgba(201,169,110,0.1)" },
  };

  const handleLookup = async () => {
  if (!ref.trim() || !email.trim()) {
    setError("Please enter both your booking reference and email address.");
    return;
  }
  setLoading(true);
  setError("");
  setResult(null);
  try {
    // Strip "GV-" prefix and leading zeros to get the numeric ID
    const idFromRef = ref.trim().replace(/^GV-/i, "").replace(/^0+/, "") || "0";

    // Fetch with auth token if available
    const token = sessionStorage.getItem("userToken");
    const res = await fetch(`${API_BASE}/bookings/`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) throw new Error("Failed to fetch bookings");
    const data = await res.json();

    const match = data.find(b => {
      const idMatch = String(b.id) === idFromRef;
      const emailMatch = (b.client_email || "").toLowerCase() === email.trim().toLowerCase();
      return idMatch && emailMatch;
    });

    if (match) {
      setResult(match);
    } else {
      setError("No booking found. Please check your reference number and email address.");
    }
  } catch {
    setError("Unable to connect to server. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const nights = result
    ? Math.max(0, (new Date(result.check_out) - new Date(result.check_in)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .lookup-card { animation: fadeUp 0.4s ease forwards; }
        .gv-input:focus { border-color: #c9a96e !important; outline: none; }
        .gv-input::placeholder { color: #3a3530; }
      `}</style>

      <nav style={S.nav}>
        <button style={S.backBtn} onClick={() => navigate("landing")}>← Back to Home</button>
        <div style={S.logo}>GRAND<span style={S.logoAccent}>VELOUR</span></div>
        <button style={S.bookBtn} onClick={() => navigate("book")}>+ New Booking</button>
      </nav>

      <div style={S.content}>
        <div style={S.headerWrap}>
          <p style={S.eyebrow}>RESERVATION LOOKUP</p>
          <h1 style={S.title}>Find Your Booking</h1>
          <p style={S.subtitle}>
            Enter your booking reference and the email address used at the time of booking.
          </p>
        </div>

        <div className="lookup-card" style={S.card}>
          <div style={S.formRow}>
            <div style={S.fieldWrap}>
              <label style={S.label}>BOOKING REFERENCE</label>
              <input
                type="text"
                placeholder="GV-000001"
                value={ref}
                onChange={e => { setRef(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                style={S.input}
                className="gv-input"
              />
              <p style={S.hint}>Format: GV-XXXXXX (found on your receipt)</p>
            </div>
            <div style={S.fieldWrap}>
              <label style={S.label}>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="juan@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                style={S.input}
                className="gv-input"
              />
              <p style={S.hint}>The email used when the booking was made</p>
            </div>
          </div>

          {error && (
            <div style={S.errorBox}>
              <span style={{ marginRight: "8px" }}>⚠</span>{error}
            </div>
          )}

          <button
            style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleLookup}
            disabled={loading}
          >
            {loading ? "Searching..." : "Look Up Booking →"}
          </button>
        </div>

        {result && (
          <div className="lookup-card" style={S.resultCard}>
            <div style={S.resultHeader}>
              <div style={S.checkIcon}>✓</div>
              <div>
                <p style={S.resultRef}>BOOKING REFERENCE: <span style={{ color: "#c9a96e" }}>GV-{String(result.id).padStart(6, "0")}</span></p>
                <p style={S.resultGuest}>{result.client_name}</p>
              </div>
              <span style={{
                ...S.statusBadge,
                color: statusStyle[result.status]?.color || "#8a7a68",
                background: statusStyle[result.status]?.bg || "transparent",
                border: `1px solid ${statusStyle[result.status]?.border || "#2a2520"}`,
              }}>
                {result.status}
              </span>
            </div>

            <div style={S.resultGrid}>
              {[
                ["HOTEL", result.hotel_name || "—"],
                ["ROOM", result.room_number ? `Room ${result.room_number}` : "—"],
                ["ROOM TYPE", result.room_type || "—"],
                ["CHECK-IN", result.check_in],
                ["CHECK-OUT", result.check_out],
                ["DURATION", `${nights} night${nights !== 1 ? "s" : ""}`],
                ["TOTAL AMOUNT", `₱${parseFloat(result.total_price || 0).toLocaleString()}`],
                ...(result.notes ? [["NOTES", result.notes]] : []),
              ].map(([label, value]) => (
                <div key={label} style={S.resultRow}>
                  <span style={S.resultLabel}>{label}</span>
                  <span style={{
                    ...S.resultValue,
                    ...(label === "TOTAL AMOUNT" ? { color: "#c9a96e", fontSize: "20px" } : {}),
                  }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={S.resultActions}>
              <button style={S.outlineBtn} onClick={() => navigate("bookings")}>
                View All Bookings
              </button>
              <button style={S.ghostBtn} onClick={() => { setResult(null); setRef(""); setEmail(""); }}>
                Search Again
              </button>
            </div>
          </div>
        )}

        {!result && (
          <div style={S.helpSection}>
            <div style={S.helpDivider} />
            <p style={S.helpText}>Don't have an account yet?</p>
            <div style={S.helpBtns}>
              <button style={S.helpBtn} onClick={() => navigate("userlogin")}>
                Sign In / Create Account
              </button>
              <button style={S.helpBtn} onClick={() => navigate("book")}>
                Make a New Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { background: "#0d0d0d", minHeight: "100vh", color: "#e8dcc8", fontFamily: "'Cormorant Garamond', serif" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", borderBottom: "1px solid #2a2520" },
  backBtn: { background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)", color: "#a09080", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "1px", padding: "8px 16px" },
  logo: { fontSize: "20px", fontWeight: 600, letterSpacing: "6px", color: "#e8dcc8" },
  logoAccent: { color: "#c9a96e" },
  bookBtn: { background: "#c9a96e", border: "none", color: "#0d0d0d", padding: "10px 24px", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2px", cursor: "pointer", fontWeight: 500, textTransform: "uppercase" },
  content: { maxWidth: "760px", margin: "0 auto", padding: "60px 20px 80px" },
  headerWrap: { textAlign: "center", marginBottom: "48px" },
  eyebrow: { fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "5px", color: "#c9a96e", margin: "0 0 12px" },
  title: { fontSize: "48px", fontWeight: 300, margin: "0 0 16px" },
  subtitle: { fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#6a5f52", lineHeight: 1.7, margin: 0 },
  card: { background: "#111", border: "1px solid #2a2520", padding: "36px 40px", marginBottom: "32px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" },
  fieldWrap: {},
  label: { display: "block", fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#6a5f52", textTransform: "uppercase", marginBottom: "10px" },
  input: { width: "100%", background: "#151412", border: "1px solid #3a3530", borderLeft: "3px solid #c9a96e", color: "#e8dcc8", padding: "13px 16px", fontFamily: "'Jost', sans-serif", fontSize: "15px", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" },
  hint: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#4a3f32", margin: "6px 0 0" },
  errorBox: { background: "rgba(201,123,110,0.08)", border: "1px solid rgba(201,123,110,0.3)", color: "#c97b6e", fontFamily: "'Jost', sans-serif", fontSize: "12px", padding: "10px 14px", marginBottom: "20px", display: "flex", alignItems: "center" },
  primaryBtn: { background: "#c9a96e", border: "none", color: "#0d0d0d", padding: "14px 32px", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", fontWeight: 500, width: "100%" },
  resultCard: { background: "#111", border: "1px solid #2a2520", overflow: "hidden" },
  resultHeader: { display: "flex", alignItems: "center", gap: "20px", padding: "24px 32px", borderBottom: "1px solid #1e1a16", flexWrap: "wrap" },
  checkIcon: { width: "44px", height: "44px", borderRadius: "50%", border: "1px solid #c9a96e", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a96e", fontSize: "20px", flexShrink: 0 },
  resultRef: { fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#6a5f52", margin: "0 0 4px", textTransform: "uppercase" },
  resultGuest: { fontSize: "22px", fontWeight: 400, color: "#e8dcc8", margin: 0 },
  statusBadge: { padding: "5px 14px", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Jost', sans-serif", marginLeft: "auto" },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr" },
  resultRow: { padding: "16px 32px", borderRight: "1px solid #1a1612", borderBottom: "1px solid #1a1612", display: "flex", flexDirection: "column", gap: "6px" },
  resultLabel: { fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#4a3f32", textTransform: "uppercase" },
  resultValue: { fontSize: "16px", fontWeight: 300, color: "#e8dcc8", fontFamily: "'Jost', sans-serif" },
  resultActions: { display: "flex", gap: "12px", padding: "24px 32px" },
  outlineBtn: { background: "transparent", border: "1px solid #2a2520", color: "#8a7a68", padding: "12px 24px", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" },
  ghostBtn: { background: "transparent", border: "none", color: "#4a3f32", padding: "12px 16px", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" },
  helpSection: { textAlign: "center", paddingTop: "24px" },
  helpDivider: { height: "1px", background: "#1e1a16", marginBottom: "32px" },
  helpText: { fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#4a3f32", margin: "0 0 20px" },
  helpBtns: { display: "flex", gap: "12px", justifyContent: "center" },
  helpBtn: { background: "none", border: "1px solid #2a2520", color: "#6a5f52", padding: "12px 24px", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "1px", cursor: "pointer", textTransform: "uppercase" },
};