import { useState } from "react";
import { API_BASE } from "../api";

function TextField({ fieldKey, label, type, placeholder, value, onChange, onEnter }) {
  return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{label}</label>
      <input
        type={type || "text"}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={e => e.key === "Enter" && onEnter && onEnter()}
        style={S.input}
        className="gv-input"
        autoComplete={fieldKey}
      />
    </div>
  );
}

function PasswordField({ label, value, placeholder, show, onToggle, onChange, onEnter }) {
  return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{label}</label>
      <div style={S.passwordWrap}>
        <input
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={e => e.key === "Enter" && onEnter && onEnter()}
          style={{ ...S.input, paddingRight: "44px" }}
          className="gv-input"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          style={S.eyeBtn}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div className="gv-toast" style={{
      ...S.toast,
      background: toast.type === "success" ? "rgba(126,184,126,0.15)" : "rgba(201,123,110,0.15)",
      border:     `1px solid ${toast.type === "success" ? "rgba(126,184,126,0.4)" : "rgba(201,123,110,0.4)"}`,
      color:      toast.type === "success" ? "#7eb87e" : "#c97b6e",
    }}>
      <span style={{ marginRight: "8px" }}>{toast.type === "success" ? "✓" : "⚠"}</span>
      {toast.message}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UserLogin({ navigate, onLoginSuccess }) {
  const [mode, setMode] = useState("login");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "", password: "", confirmPassword: "", first_name: "", last_name: "",
  });

  const [showLoginPassword,    setShowLoginPassword]    = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword,  setShowConfirmPassword]  = useState(false);

  const loginReady    = loginForm.email.trim() !== "" && loginForm.password !== "";
  const registerReady = registerForm.first_name.trim() !== "" && registerForm.last_name.trim() !== ""
    && registerForm.email.trim() !== "" && registerForm.password !== "" && registerForm.confirmPassword !== "";

  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [shake, setShake]               = useState(false);
  const [toast, setToast]               = useState(null);
  const [registered, setRegistered]     = useState(false);
  const [notActivated, setNotActivated] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
    setNotActivated(false);
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  const switchToRegister = () => {
    setMode("register");
    setError("");
    setNotActivated(false);
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setError("Please enter both email and password."); triggerShake(); return;
    }
    setLoading(true); setError(""); setNotActivated(false);
    try {
      const res  = await fetch(`${API_BASE}/user/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();

      if (res.ok && data.access) {
        sessionStorage.setItem("userToken", data.access);
        sessionStorage.setItem("userData", JSON.stringify(data.user));
        sessionStorage.setItem("userRole", data.role);

        onLoginSuccess();

        if (data.role === "admin") {
          showToast("Welcome, Admin! Redirecting to dashboard...");
          setTimeout(() => navigate("admindashboard"), 800);
        } else if (data.role === "staff") {
          showToast("Welcome, Staff! Redirecting to dashboard...");
          setTimeout(() => navigate("staffdashboard"), 800);
        } else {
          showToast("Welcome back! Signing you in...");
          setTimeout(() => navigate("userprofile"), 800);
        }

      } else if (res.status === 403 && data.not_activated) {
        setNotActivated(true);
        setError("Account not activated. Please check your email or request a new link.");
        triggerShake();
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
        triggerShake();
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!registerForm.email || !registerForm.password) {
      setError("Email and password are required."); triggerShake(); return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match."); triggerShake(); return;
    }
    if (registerForm.password.length < 8) {
      setError("Password must be at least 8 characters."); triggerShake(); return;
    }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/user/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:      registerForm.email,
          password:   registerForm.password,
          password2:  registerForm.confirmPassword,
          first_name: registerForm.first_name,
          last_name:  registerForm.last_name,
        }),
      });
      const data = await res.json();

      if (res.status === 201) {
        setRegistered(true);
      } else {
        const msgs = Object.values(data).flat();
        setError(msgs[0] || "Registration failed.");
        triggerShake();
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend activation email ────────────────────────────────────────────────
  const handleResend = async () => {
    if (!loginForm.email) {
      setError("Enter your email address above first."); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/user/resend-activation/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email }),
      });
      const data = await res.json();
      showToast(data.message || "Activation email resent!");
      setNotActivated(false);
      setError("");
    } catch {
      showToast("Failed to resend. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── "Check your email" screen ──────────────────────────────────────────────
  if (registered) {
    return (
      <div style={S.page}>
        <style>{cssBase}</style>
        <div style={S.glow} />
        <div className="user-card" style={S.card}>
          <div style={S.logoWrap}>
            <div style={S.logoLine} />
            <div style={S.logo}>GRAND<span style={S.logoGold}>VELOUR</span></div>
            <div style={S.logoLine} />
          </div>

          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div style={S.emailIcon}>✉</div>
            <h2 style={S.checkTitle}>Check your inbox</h2>
            <p style={S.checkSub}>
              We sent an activation link to<br />
              <span style={{ color: "#c9a96e" }}>{registerForm.email}</span>
            </p>
            <p style={S.checkNote}>
              Click the link in the email to activate your account.
              The link expires in <strong style={{ color: "#a89880" }}>24 hours</strong>.
            </p>
          </div>

          <div style={S.divider} />

          <p style={{ ...S.hint, marginBottom: "12px" }}>Didn't receive it?</p>
          <button
            style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1 }}
            onClick={async () => {
              setLoading(true);
              try {
                await fetch(`${API_BASE}/user/resend-activation/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: registerForm.email }),
                });
                showToast("New activation link sent!");
              } catch {
                showToast("Failed to resend. Please try again.", "error");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Resend Activation Email"}
          </button>
          <p style={S.hint}>
            <span style={S.switchLink} onClick={() => { setRegistered(false); switchToLogin(); }}>
              ← Back to Sign In
            </span>
          </p>
        </div>
        {toast && <Toast toast={toast} />}
        <p style={S.footer}>© 2024 Grand Velour Hotels & Resorts</p>
      </div>
    );
  }

  // ── Main login / register form ─────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{cssBase}</style>

      {toast && <Toast toast={toast} />}
      <div style={S.glow} />
      <button style={S.backBtn} onClick={() => navigate("landing")}>← Back to Home</button>

      <div className={`user-card ${shake ? "shake" : ""}`} style={S.card}>
        <div style={S.logoWrap}>
          <div style={S.logoLine} />
          <div style={S.logo}>GRAND<span style={S.logoGold}>VELOUR</span></div>
          <p style={S.logoSub}>Guest Portal</p>
          <div style={S.logoLine} />
        </div>

        <div style={S.tabs}>
          <button className="mode-tab"
            style={{ ...S.tab, ...(mode === "login" ? S.tabActive : S.tabInactive) }}
            onClick={switchToLogin}>
            Sign In
          </button>
          <button className="mode-tab"
            style={{ ...S.tab, ...(mode === "register" ? S.tabActive : S.tabInactive) }}
            onClick={switchToRegister}>
            Create Account
          </button>
        </div>

        {error && (
          <div style={S.errorBox}>
            <span style={{ marginRight: "8px" }}>⚠</span>{error}
          </div>
        )}

        {mode === "login" ? (
          <>
            <TextField
              fieldKey="email"
              label="EMAIL ADDRESS"
              type="email"
              value={loginForm.email}
              placeholder="juan@email.com"
              onChange={e => { setLoginForm(f => ({ ...f, email: e.target.value })); setError(""); }}
              onEnter={handleLogin}
            />
            <PasswordField
              label="PASSWORD"
              value={loginForm.password}
              placeholder="••••••••"
              show={showLoginPassword}
              onToggle={() => setShowLoginPassword(v => !v)}
              onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setError(""); }}
              onEnter={handleLogin}
            />
            <button
              style={{ ...S.primaryBtn, ...(loginReady && !loading ? S.primaryBtnActive : S.primaryBtnDim) }}
              onClick={handleLogin} disabled={!loginReady || loading}>
              {loading ? "Signing In..." : "Sign In →"}
            </button>

            {notActivated && (
              <button style={S.resendBtn} onClick={handleResend} disabled={loading}>
                {loading ? "Sending..." : "Resend Activation Email"}
              </button>
            )}

            <p style={S.hint}>Don't have an account?{" "}
              <span style={S.switchLink} onClick={switchToRegister}>Create one</span>
            </p>
          </>
        ) : (
          <>
            <div style={S.twoCol}>
              <div>
                <label style={S.label}>FIRST NAME</label>
                <input type="text" value={registerForm.first_name} placeholder="Juan"
                  onChange={e => { setRegisterForm(f => ({ ...f, first_name: e.target.value })); setError(""); }}
                  style={S.input} className="gv-input" />
              </div>
              <div>
                <label style={S.label}>LAST NAME</label>
                <input type="text" value={registerForm.last_name} placeholder="dela Cruz"
                  onChange={e => { setRegisterForm(f => ({ ...f, last_name: e.target.value })); setError(""); }}
                  style={S.input} className="gv-input" />
              </div>
            </div>

            <TextField
              fieldKey="email"
              label="EMAIL ADDRESS *"
              type="email"
              value={registerForm.email}
              placeholder="juan@email.com"
              onChange={e => { setRegisterForm(f => ({ ...f, email: e.target.value })); setError(""); }}
              onEnter={handleRegister}
            />
            <PasswordField
              label="PASSWORD *"
              value={registerForm.password}
              placeholder="Min. 8 characters"
              show={showRegisterPassword}
              onToggle={() => setShowRegisterPassword(v => !v)}
              onChange={e => { setRegisterForm(f => ({ ...f, password: e.target.value })); setError(""); }}
              onEnter={handleRegister}
            />
            <PasswordField
              label="CONFIRM PASSWORD *"
              value={registerForm.confirmPassword}
              placeholder="Repeat password"
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(v => !v)}
              onChange={e => { setRegisterForm(f => ({ ...f, confirmPassword: e.target.value })); setError(""); }}
              onEnter={handleRegister}
            />

            <button
              style={{ ...S.primaryBtn, ...(registerReady && !loading ? S.primaryBtnActive : S.primaryBtnDim) }}
              onClick={handleRegister} disabled={!registerReady || loading}>
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
            <p style={S.hint}>Already have an account?{" "}
              <span style={S.switchLink} onClick={switchToLogin}>Sign in</span>
            </p>
          </>
        )}
      </div>

      <p style={S.footer}>© 2024 Grand Velour Hotels & Resorts</p>
    </div>
  );
}

const cssBase = `
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shake {
    0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)}
    45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)}
  }
  @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  .user-card  { animation: fadeSlideIn 0.5s ease forwards; }
  .shake      { animation: shake 0.55s ease; }
  .gv-toast   { animation: toastIn 0.3s ease forwards; }
  input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #111 inset !important; -webkit-text-fill-color:#e8dcc8 !important; }
  .gv-input:focus { border-color:#c9a96e !important; outline:none; }
  .mode-tab:hover { color:#e8dcc8 !important; }
`;

const S = {
  page:        { background:"#0d0d0d", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond', serif", position:"relative", overflow:"hidden", padding:"40px 20px" },
  glow:        { position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:"600px", height:"400px", background:"radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)", pointerEvents:"none" },
  toast:       { position:"fixed", top:"24px", right:"24px", zIndex:9999, padding:"12px 20px", fontFamily:"'Jost', sans-serif", fontSize:"13px", letterSpacing:"0.5px", display:"flex", alignItems:"center", backdropFilter:"blur(10px)", minWidth:"260px" },
  backBtn:     { position:"absolute", top:"24px", left:"32px", background:"rgba(201,169,110,0.07)", border:"1px solid rgba(201,169,110,0.2)", color:"#a09080", cursor:"pointer", fontFamily:"'Jost', sans-serif", fontSize:"12px", letterSpacing:"1px", padding:"8px 16px" },
  card:        { background:"#111", border:"1px solid #2a2520", width:"100%", maxWidth:"460px", padding:"44px 44px 36px", position:"relative", zIndex:1 },
  logoWrap:    { textAlign:"center", marginBottom:"28px" },
  logoLine:    { height:"1px", background:"linear-gradient(90deg, transparent, #c9a96e, transparent)", margin:"10px 0" },
  logo:        { fontSize:"22px", fontWeight:600, letterSpacing:"6px", color:"#e8dcc8", marginBottom:"4px" },
  logoGold:    { color:"#c9a96e" },
  logoSub:     { fontFamily:"'Jost', sans-serif", fontSize:"10px", letterSpacing:"4px", color:"#4a3f32", textTransform:"uppercase", margin:"4px 0" },
  tabs:        { display:"flex", marginBottom:"24px", borderBottom:"1px solid #2a2520" },
  tab:         { flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 0", fontFamily:"'Jost', sans-serif", fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase" },
  tabActive:   { color:"#c9a96e", borderBottom:"2px solid #c9a96e", marginBottom:"-1px" },
  tabInactive: { color:"#4a3f32" },
  errorBox:    { background:"rgba(201,123,110,0.1)", border:"1px solid rgba(201,123,110,0.3)", color:"#c97b6e", fontFamily:"'Jost', sans-serif", fontSize:"12px", padding:"10px 14px", marginBottom:"20px", display:"flex", alignItems:"center" },
  fieldWrap:   { marginBottom:"18px" },
  label:       { display:"block", fontFamily:"'Jost', sans-serif", fontSize:"10px", letterSpacing:"2px", color:"#6a5f52", textTransform:"uppercase", marginBottom:"8px" },
  input:       { width:"100%", background:"#151412", border:"1px solid #2a2520", color:"#e8dcc8", padding:"12px 16px", fontFamily:"'Jost', sans-serif", fontSize:"14px", boxSizing:"border-box", outline:"none", transition:"border-color 0.2s" },
  passwordWrap:{ position:"relative", display:"flex", alignItems:"center" },
  eyeBtn:      { position:"absolute", right:"12px", background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"#6a5f52", padding:"0", lineHeight:1, display:"flex", alignItems:"center" },
  twoCol:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"18px" },
  primaryBtn:  { width:"100%", border:"none", padding:"14px", fontFamily:"'Jost', sans-serif", fontSize:"12px", letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", fontWeight:500, marginTop:"8px", marginBottom:"16px", transition:"background 0.2s, color 0.2s, opacity 0.2s" },
  primaryBtnActive: { background:"#c9a96e", color:"#0d0d0d", cursor:"pointer", opacity:1 },
  primaryBtnDim:    { background:"#2a2520", color:"#4a3f32", cursor:"not-allowed", opacity:1 },
  resendBtn:   { width:"100%", background:"transparent", border:"1px solid rgba(201,169,110,0.3)", color:"#c9a96e", padding:"12px", fontFamily:"'Jost', sans-serif", fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", marginBottom:"16px" },
  hint:        { fontFamily:"'Jost', sans-serif", fontSize:"12px", color:"#4a3f32", textAlign:"center", letterSpacing:"0.5px" },
  switchLink:  { color:"#c9a96e", cursor:"pointer", textDecoration:"underline" },
  divider:     { height:"1px", background:"linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)", margin:"24px 0" },
  emailIcon:   { fontSize:"40px", marginBottom:"16px" },
  checkTitle:  { fontFamily:"'Cormorant Garamond', serif", fontSize:"26px", fontWeight:300, color:"#e8dcc8", margin:"0 0 12px", letterSpacing:"0.5px" },
  checkSub:    { fontFamily:"'Jost', sans-serif", fontSize:"13px", color:"#6a5f52", lineHeight:1.8, margin:"0 0 16px" },
  checkNote:   { fontFamily:"'Jost', sans-serif", fontSize:"12px", color:"#4a3f32", lineHeight:1.8, margin:"0 0 8px" },
  footer:      { position:"absolute", bottom:"24px", fontFamily:"'Jost', sans-serif", fontSize:"11px", color:"#2a2520", letterSpacing:"2px" },
};