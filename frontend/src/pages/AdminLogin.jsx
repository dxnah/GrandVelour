import { useState } from "react";

// Hardcoded admin credentials (replace with real auth when backend is ready)
export default function AdminLogin({ onLoginSuccess, navigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password.");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (response.ok && data.access) {
        sessionStorage.setItem("userToken", data.access);
        sessionStorage.setItem("userRole", data.role || "admin");
        onLoginSuccess();
      } else {
        setError("Invalid credentials. Please try again.");
        triggerShake();
        setPassword("");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card {
          animation: fadeIn 0.5s ease forwards;
        }
        .shake {
          animation: shake 0.55s ease;
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #111 inset !important;
          -webkit-text-fill-color: #e8dcc8 !important;
        }
      `}</style>

      {/* Background radial glow */}
      <div style={S.glow} />

      {/* Back to site */}
      <button style={S.backBtn} onClick={() => navigate("landing")}>
        ← Back to Site
      </button>

      <div className={`login-card ${shake ? "shake" : ""}`} style={S.card}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoAccentLine} />
          <div style={S.logo}>GRAND<span style={S.logoGold}>VELOUR</span></div>
          <p style={S.logoSub}>Admin Portal</p>
          <div style={S.logoAccentLine} />
        </div>

        {/* Lock icon */}
        <div style={S.lockWrap}>
          <span style={S.lockIcon}>🔐</span>
        </div>

        <h2 style={S.title}>Sign In</h2>
        <p style={S.subtitle}>Enter your credentials to access the admin panel</p>

        {/* Error */}
        {error && (
          <div style={S.errorBox}>
            <span style={{ marginRight: "8px" }}>⚠</span>{error}
          </div>
        )}

        {/* Username */}
        <div style={S.fieldWrap}>
          <label style={S.label}>USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter username"
            style={S.input}
            autoComplete="username"
          />
        </div>

        {/* Password */}
        <div style={S.fieldWrap}>
          <label style={S.label}>PASSWORD</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="Enter password"
              style={{ ...S.input, paddingRight: "44px" }}
              autoComplete="current-password"
            />
            <button
              onClick={() => setShowPass(v => !v)}
              style={S.eyeBtn}
              tabIndex={-1}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* Login button */}
        <button
          style={{ ...S.loginBtn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <span style={S.loadingDots}>
              Verifying<span style={S.dot1}>.</span><span style={S.dot2}>.</span><span style={S.dot3}>.</span>
            </span>
          ) : (
            "Sign In to Admin Panel →"
          )}
        </button>

        {/* Hint */}
        <p style={S.hint}>
          This portal is restricted to authorized personnel only.
        </p>

      </div>

      {/* Footer */}
      <p style={S.footer}>© 2024 Grand Velour Hotels & Resorts</p>
    </div>
  );
}

const S = {
  page: {
    background: "#0d0d0d",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Cormorant Garamond', serif",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "400px",
    background: "radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  backBtn: {
    position: "absolute",
    top: "24px",
    left: "32px",
    background: "rgba(201,169,110,0.07)",
    border: "1px solid rgba(201,169,110,0.2)",
    color: "#a09080",
    cursor: "pointer",
    fontFamily: "'Jost', sans-serif",
    fontSize: "12px",
    letterSpacing: "1px",
    padding: "8px 16px",
  },
  card: {
    background: "#111",
    border: "1px solid #2a2520",
    width: "100%",
    maxWidth: "420px",
    padding: "48px 44px",
    position: "relative",
    zIndex: 1,
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: "28px",
  },
  logoAccentLine: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #c9a96e, transparent)",
    margin: "10px 0",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 600,
    letterSpacing: "6px",
    color: "#e8dcc8",
    marginBottom: "4px",
  },
  logoGold: {
    color: "#c9a96e",
  },
  logoSub: {
    fontFamily: "'Jost', sans-serif",
    fontSize: "10px",
    letterSpacing: "4px",
    color: "#4a3f32",
    textTransform: "uppercase",
    margin: "4px 0",
  },
  lockWrap: {
    textAlign: "center",
    marginBottom: "16px",
  },
  lockIcon: {
    fontSize: "28px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 300,
    color: "#e8dcc8",
    textAlign: "center",
    margin: "0 0 8px",
  },
  subtitle: {
    fontFamily: "'Jost', sans-serif",
    fontSize: "12px",
    color: "#4a3f32",
    textAlign: "center",
    letterSpacing: "1px",
    margin: "0 0 28px",
  },
  errorBox: {
    background: "rgba(201,123,110,0.1)",
    border: "1px solid rgba(201,123,110,0.3)",
    color: "#c97b6e",
    fontFamily: "'Jost', sans-serif",
    fontSize: "12px",
    padding: "10px 14px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
  },
  fieldWrap: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontFamily: "'Jost', sans-serif",
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#6a5f52",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2520",
    color: "#e8dcc8",
    padding: "12px 16px",
    fontFamily: "'Jost', sans-serif",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px",
    lineHeight: 1,
  },
  loginBtn: {
    width: "100%",
    background: "#c9a96e",
    border: "none",
    color: "#0d0d0d",
    padding: "14px",
    fontFamily: "'Jost', sans-serif",
    fontSize: "12px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    cursor: "pointer",
    fontWeight: 500,
    marginTop: "8px",
    marginBottom: "20px",
  },
  loadingDots: {
    fontFamily: "'Jost', sans-serif",
    fontSize: "12px",
    letterSpacing: "2px",
  },
  dot1: { animation: "blink 1.2s 0s infinite", opacity: 0 },
  dot2: { animation: "blink 1.2s 0.2s infinite", opacity: 0 },
  dot3: { animation: "blink 1.2s 0.4s infinite", opacity: 0 },
  hint: {
    fontFamily: "'Jost', sans-serif",
    fontSize: "11px",
    color: "#2a2520",
    textAlign: "center",
    letterSpacing: "1px",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: "24px",
    fontFamily: "'Jost', sans-serif",
    fontSize: "11px",
    color: "#2a2520",
    letterSpacing: "2px",
  },
};