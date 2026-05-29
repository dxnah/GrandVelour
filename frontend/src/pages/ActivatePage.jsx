import { useEffect, useState } from "react";
import { API_BASE } from "../api";

export default function ActivatePage({ navigate, onLoginSuccess, uid, token }) {
  const [status, setStatus]           = useState("loading"); // loading | success | error | already
  const [message, setMessage]         = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent]   = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setStatus("error");
      setMessage("This activation link is incomplete or broken. Please use the full link from your email, or request a new one below.");
      return;
    }

    const activate = async () => {
      try {
        const res  = await fetch(
          `${API_BASE}/user/activate/${uid}/${token}/`,
          { method: "GET" }
        );
        const data = await res.json();

        if (res.ok) {
          if (data.tokens) {
            sessionStorage.setItem("userToken", data.tokens.access);
            sessionStorage.setItem("userData", JSON.stringify(data.user));
            if (onLoginSuccess) onLoginSuccess();
            setStatus("success");
            setMessage(data.message || "Account activated!");
            setTimeout(() => navigate("userprofile"), 2500);
          } else {
            setStatus("already");
            setMessage(data.message || "Your account is already active.");
          }
        } else {
          setStatus("error");
          setMessage(
            data.error ||
            "This activation link has expired or has already been used. Links are only valid for 24 hours. Please request a new one below."
          );
        }
      } catch {
        setStatus("error");
        setMessage("We couldn't reach the server. Please check your internet connection and try again.");
      }
    };

    activate();
  }, [uid, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/user/resend-activation/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendSent(true);
      setMessage(data.message || "New activation link sent!");
    } catch {
      setMessage("Failed to send. Please check your connection and try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{css}</style>
      <div style={S.glow} />

      <div className="activate-card" style={S.card}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoLine} />
          <div style={S.logo}>GRAND<span style={S.logoGold}>VELOUR</span></div>
          <div style={S.logoLine} />
        </div>

        {/* ── Loading ── */}
        {status === "loading" && (
          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div className="gv-spinner" style={S.spinner} />
            <h2 style={S.title}>Verifying your account…</h2>
            <p style={S.sub}>
              We're confirming your email address. This only takes a moment —
              please don't close this tab.
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div style={{ ...S.iconWrap, borderColor: "rgba(126,184,126,0.3)", background: "rgba(126,184,126,0.06)" }}>
              <span style={S.iconSuccess}>✓</span>
            </div>
            <h2 style={S.title}>You're all set!</h2>
            <p style={S.sub}>
              Your email has been verified and your Grand Velour account is now active.
              You've been signed in automatically.
            </p>
            <div style={S.infoBox}>
              <span style={{ fontSize: "14px", marginRight: "8px" }}>→</span>
              Taking you to your profile in a moment…
            </div>
            <div style={S.progressBar}>
              <div className="gv-progress" style={S.progressFill} />
            </div>
          </div>
        )}

        {/* ── Already active ── */}
        {status === "already" && (
          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div style={{ ...S.iconWrap, borderColor: "rgba(201,169,110,0.3)" }}>
              <span style={{ ...S.iconSuccess, color: "#c9a96e" }}>◈</span>
            </div>
            <h2 style={S.title}>Already Activated</h2>
            <p style={S.sub}>
              This account has already been verified — no action needed.
              You can go ahead and sign in with your email and password.
            </p>
            <button style={S.primaryBtn} onClick={() => navigate("userlogin")}>
              Go to Sign In →
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div style={{ ...S.iconWrap, borderColor: "rgba(201,123,110,0.3)", background: "rgba(201,123,110,0.05)" }}>
              <span style={S.iconError}>✕</span>
            </div>
            <h2 style={S.title}>Link Unavailable</h2>
            <p style={S.sub}>{message}</p>

            {!resendSent ? (
              <>
                <div style={S.divider} />
                <div style={S.resendWrap}>
                  <p style={S.resendHeading}>Request a new activation link</p>
                  <p style={S.resendNote}>
                    Enter the email address you used to register and we'll send
                    you a fresh link valid for 24 hours.
                  </p>
                  <div style={S.resendRow}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={resendEmail}
                      onChange={e => setResendEmail(e.target.value)}
                      style={S.input}
                      className="gv-input"
                      onKeyDown={e => e.key === "Enter" && handleResend()}
                    />
                    <button
                      style={{ ...S.resendBtn, opacity: resendLoading || !resendEmail ? 0.5 : 1 }}
                      onClick={handleResend}
                      disabled={resendLoading || !resendEmail}
                    >
                      {resendLoading ? "Sending…" : "Send"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={S.resendSuccess}>
                <div style={{ fontSize: "18px", marginBottom: "8px" }}>✓</div>
                <strong style={{ display: "block", marginBottom: "6px", color: "#7eb87e" }}>
                  New link sent!
                </strong>
                Check your inbox (and spam folder) for an email from Grand Velour.
                Click the link inside to activate your account, then return here to sign in.
              </div>
            )}

            <button style={S.ghostBtn} onClick={() => navigate("userlogin")}>
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>

      <p style={S.footer}>© 2026 Grand Velour Hotels & Resorts</p>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@300;400;500&display=swap');
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes progress { from{width:0%} to{width:100%} }
  .activate-card { animation: fadeSlideIn 0.5s ease forwards; }
  .gv-spinner    { animation: spin 1s linear infinite; }
  .gv-progress   { animation: progress 2.4s ease forwards; }
  .gv-input:focus { border-color:#c9a96e !important; outline:none; }
  input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #111 inset !important; -webkit-text-fill-color:#e8dcc8 !important; }
`;

const S = {
  page:     { background:"#0d0d0d", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond', serif", position:"relative", padding:"40px 20px" },
  glow:     { position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:"600px", height:"400px", background:"radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)", pointerEvents:"none" },
  card:     { background:"#111", border:"1px solid #2a2520", width:"100%", maxWidth:"440px", padding:"44px 44px 40px", position:"relative", zIndex:1 },

  logoWrap: { textAlign:"center", marginBottom:"32px" },
  logoLine: { height:"1px", background:"linear-gradient(90deg, transparent, #c9a96e, transparent)", margin:"10px 0" },
  logo:     { fontSize:"22px", fontWeight:600, letterSpacing:"6px", color:"#e8dcc8" },
  logoGold: { color:"#c9a96e" },

  spinner:  { width:"36px", height:"36px", border:"2px solid #2a2520", borderTop:"2px solid #c9a96e", borderRadius:"50%", margin:"0 auto 24px" },

  iconWrap:    { width:"64px", height:"64px", borderRadius:"50%", border:"1px solid rgba(201,169,110,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", background:"rgba(201,169,110,0.05)" },
  iconSuccess: { fontSize:"28px", color:"#7eb87e" },
  iconError:   { fontSize:"28px", color:"#c97b6e" },

  title: { fontFamily:"'Cormorant Garamond', serif", fontSize:"28px", fontWeight:300, color:"#e8dcc8", margin:"0 0 12px", letterSpacing:"0.5px" },
  sub:   { fontFamily:"'Jost', sans-serif", fontSize:"13px", color:"#6a5f52", lineHeight:1.9, margin:"0 0 16px" },
  hint:  { fontFamily:"'Jost', sans-serif", fontSize:"11px", color:"#4a3f32", letterSpacing:"0.5px" },

  // success info strip
  infoBox: { background:"rgba(126,184,126,0.07)", border:"1px solid rgba(126,184,126,0.2)", color:"#7eb87e", fontFamily:"'Jost', sans-serif", fontSize:"12px", padding:"10px 14px", display:"flex", alignItems:"center", marginBottom:"16px", letterSpacing:"0.5px" },

  progressBar:  { height:"2px", background:"#1a1a1a", margin:"8px auto 0", overflow:"hidden", maxWidth:"200px" },
  progressFill: { height:"100%", background:"#c9a96e" },

  divider: { height:"1px", background:"linear-gradient(90deg, transparent, rgba(201,169,110,0.15), transparent)", margin:"24px 0" },

  // resend section
  resendWrap:    { textAlign:"left" },
  resendHeading: { fontFamily:"'Jost', sans-serif", fontSize:"11px", letterSpacing:"2px", color:"#c9a96e", textTransform:"uppercase", margin:"0 0 8px" },
  resendNote:    { fontFamily:"'Jost', sans-serif", fontSize:"12px", color:"#4a3f32", lineHeight:1.8, margin:"0 0 14px" },
  resendRow:     { display:"flex", gap:"8px", marginBottom:"16px" },
  input:         { flex:1, background:"#151412", border:"1px solid #2a2520", color:"#e8dcc8", padding:"11px 14px", fontFamily:"'Jost', sans-serif", fontSize:"13px", outline:"none", transition:"border-color 0.2s" },
  resendBtn:     { background:"#c9a96e", border:"none", color:"#0d0d0d", padding:"11px 18px", fontFamily:"'Jost', sans-serif", fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", fontWeight:500, whiteSpace:"nowrap" },

  resendSuccess: { background:"rgba(126,184,126,0.07)", border:"1px solid rgba(126,184,126,0.25)", color:"#8a9a88", fontFamily:"'Jost', sans-serif", fontSize:"12px", padding:"16px 18px", marginBottom:"20px", textAlign:"left", lineHeight:1.8 },

  primaryBtn: { width:"100%", background:"#c9a96e", border:"none", color:"#0d0d0d", padding:"14px", fontFamily:"'Jost', sans-serif", fontSize:"12px", letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", fontWeight:500, marginTop:"20px" },
  ghostBtn:   { width:"100%", background:"transparent", border:"1px solid #2a2520", color:"#4a3f32", padding:"12px", fontFamily:"'Jost', sans-serif", fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", marginTop:"12px" },

  footer: { position:"absolute", bottom:"24px", fontFamily:"'Jost', sans-serif", fontSize:"11px", color:"#2a2520", letterSpacing:"2px" },
};