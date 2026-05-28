import { useState, useEffect } from "react";
import { API_BASE } from "../api";

function SkeletonBlock({ width = "100%", height = "20px", style = {} }) {
  return (
    <div style={{
      width, height, background: "linear-gradient(90deg, #1a1a1a 25%, #252520 50%, #1a1a1a 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", borderRadius: "2px", ...style,
    }} />
  );
}

export default function UserProfile({ navigate, onLogout }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const token = sessionStorage.getItem("userToken");
    if (!token) { navigate("userlogin"); return; }

    const loadUser = async () => {
      setLoading(true);
      try {
        const cached = sessionStorage.getItem("userData");
        if (cached) {
          const parsed = JSON.parse(cached);
          setUser(parsed);
        }
        const res = await fetch(`${API_BASE}/user/profile/`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const me = await res.json();
          sessionStorage.setItem("userData", JSON.stringify(me));
          setUser(me);
        }
        const bRes = await fetch(`${API_BASE}/bookings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bRes.ok) {
          const allBookings = await bRes.json();
          const cached = sessionStorage.getItem("userData");
          if (cached) {
            const u = JSON.parse(cached);
            const userEmail = (u.email || "").toLowerCase();
            const userName = `${u.first_name || ""} ${u.last_name || ""}`.trim().toLowerCase();
            const myBookings = allBookings.filter(b =>
              (b.client_name || "").toLowerCase() === userName ||
              (b.client_email || "").toLowerCase() === userEmail
            );
            setBookings(myBookings);
          } else {
            setBookings(Array.isArray(allBookings) ? allBookings : []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("userUsername");
    if (onLogout) onLogout();
    navigate("landing");
  };

  const initials = user
    ? ((user.first_name?.[0] || "") + (user.last_name?.[0] || "") || user.username?.[0] || "G").toUpperCase()
    : "G";

  const fullName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
    : "Guest";

  if (loading) return (
    <div style={S.page}>
      <style>{`
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
      <nav style={S.nav}>
        <div style={{ width: "100px" }} />
        <div style={S.logo}>GRAND<span style={S.logoGold}>VELOUR</span></div>
        <div style={{ width: "100px" }} />
      </nav>
      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
        <aside style={{ ...S.sidebar, gap: "20px" }}>
          <SkeletonBlock width="96px" height="96px" style={{ borderRadius: "50%", alignSelf: "center" }} />
          <SkeletonBlock width="140px" height="22px" style={{ alignSelf: "center" }} />
          <SkeletonBlock width="100px" height="14px" style={{ alignSelf: "center" }} />
          <SkeletonBlock width="100%" height="1px" />
          <SkeletonBlock width="100%" height="40px" />
          <SkeletonBlock width="100%" height="40px" />
        </aside>
        <main style={{ flex: 1, padding: "48px 56px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <SkeletonBlock width="200px" height="32px" />
          <SkeletonBlock width="100%" height="100px" />
          <SkeletonBlock width="100%" height="100px" />
        </main>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes goldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,169,110,0)} 50%{box-shadow:0 0 18px 2px rgba(201,169,110,0.13)} }
        .profile-fade { animation: fadeIn 0.5s ease forwards; }
        .tab-btn:hover { color: #c9a96e !important; background: rgba(201,169,110,0.05) !important; }
        .booking-row:hover { background: rgba(201,169,110,0.05) !important; }
        .reserve-btn-hover:hover { background: #b8965c !important; }
        .back-btn-hover:hover { color: #c9a96e !important; border-color: rgba(201,169,110,0.4) !important; }
        .logout-btn-hover:hover { color: #c97b6e !important; border-color: rgba(201,123,110,0.4) !important; }
      `}</style>

      {/* NAV */}
      <nav style={S.nav}>
        <button className="back-btn-hover" style={S.backBtn} onClick={() => navigate("landing")}>← Back to Home</button>
        <div style={S.logo}>GRAND<span style={S.logoGold}>VELOUR</span></div>
        <button className="logout-btn-hover" style={S.logoutBtn} onClick={handleLogout}>Sign Out</button>
      </nav>

      <div className="profile-fade" style={S.content}>

        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          {/* Avatar */}
          <div style={S.avatarWrap}>
            <div style={S.avatarOuter}>
              <div style={S.avatar}>{initials}</div>
            </div>
            <div style={S.onlineDot} />
          </div>

          <h2 style={S.sidebarName}>{fullName}</h2>
          <p style={S.sidebarEmail}>{user?.email}</p>

          {/* Guest ID badge */}
          <div style={S.guestBadge}>
            <span style={S.guestBadgeLabel}>GUEST</span>
            <span style={S.guestBadgeId}>GV-{String(user?.id || "0000").padStart(6, "0")}</span>
          </div>

          <div style={S.divider} />

          {/* Member since */}
          <div style={S.memberBlock}>
            <span style={S.memberLabel}>MEMBER SINCE</span>
            <span style={S.memberDate}>
              {user?.date_joined
                ? new Date(user.date_joined).toLocaleDateString("en-PH", { year: "numeric", month: "long" })
                : "2024"}
            </span>
          </div>

          <div style={S.divider} />

          {/* Nav tabs */}
          <nav style={S.sideNav}>
            {[
              { id: "profile", icon: "◈", label: "Profile Details" },
              { id: "bookings", icon: "◉", label: "My Bookings" },
            ].map(t => (
              <button key={t.id} className="tab-btn"
                style={{ ...S.sideNavBtn, ...(activeTab === t.id ? S.sideNavActive : {}) }}
                onClick={() => setActiveTab(t.id)}>
                <span style={{ marginRight: "12px", fontSize: "14px", opacity: 0.7 }}>{t.icon}</span>
                {t.label}
                {activeTab === t.id && <span style={S.activeArrow}>›</span>}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Reserve button */}
          <button className="reserve-btn-hover" style={S.reserveBtn} onClick={() => navigate("book")}>
            Reserve a Room →
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main style={S.main}>

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div>
              {/* Header */}
              <div style={S.panelHeader}>
                <div>
                  <div style={S.panelEyebrow}>ACCOUNT</div>
                  <h3 style={S.panelTitle}>Profile Details</h3>
                  <p style={S.panelSub}>Your personal information on file</p>
                </div>
                <div style={S.statusPill}>
                  <span style={S.statusDot} />
                  Active Guest
                </div>
              </div>

              {/* Info cards */}
              <div style={S.infoGrid}>
                {[
                  { label: "EMAIL ADDRESS", value: user?.email, icon: "✉" },
                  { label: "FIRST NAME", value: user?.first_name, icon: "◈" },
                  { label: "LAST NAME", value: user?.last_name, icon: "◈" },
                  { label: "GUEST ID", value: `GV-${String(user?.id || "0000").padStart(6, "0")}`, icon: "◉", gold: true },
                ].map((item, i) => (
                  <div key={i} style={S.infoCard}>
                    <div style={S.infoCardTop}>
                      <span style={S.infoCardIcon}>{item.icon}</span>
                      <span style={S.infoCardLabel}>{item.label}</span>
                    </div>
                    <span style={{ ...S.infoCardValue, ...(item.gold ? { color: "#c9a96e", fontSize: "15px", letterSpacing: "2px", fontFamily: "'Jost', sans-serif" } : {}) }}>
                      {item.value || <span style={{ color: "#2a2520" }}>—</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Security section */}
              <div style={{ marginTop: "36px" }}>
                <div style={S.sectionHeader}>
                  <div style={S.sectionLine} />
                  <span style={S.sectionTitle}>SECURITY</span>
                  <div style={S.sectionLine} />
                </div>
                <div style={S.securityCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={S.securityIcon}>🔑</div>
                    <div>
                      <p style={S.securityLabel}>Password</p>
                      <p style={S.securitySub}>Last updated: unknown</p>
                    </div>
                  </div>
                  <button style={S.securityBtn} onClick={() => navigate("landing")}>Change Password</button>
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS TAB ── */}
          {activeTab === "bookings" && (
            <div>
              <div style={S.panelHeader}>
                <div>
                  <div style={S.panelEyebrow}>HISTORY</div>
                  <h3 style={S.panelTitle}>My Bookings</h3>
                  <p style={S.panelSub}>{bookings.length} reservation{bookings.length !== 1 ? "s" : ""} on record</p>
                </div>
                <div style={S.bookingCount}>
                  <span style={{ fontSize: "28px", fontWeight: 300, color: "#c9a96e", fontFamily: "'Cormorant Garamond', serif" }}>{bookings.length}</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#4a3f32" }}>TOTAL</span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={S.emptyIcon}>🏨</div>
                  <p style={S.emptyTitle}>No reservations yet</p>
                  <p style={S.emptySub}>Your booking history will appear here once you make a reservation.</p>
                  <button className="reserve-btn-hover" style={{ ...S.reserveBtn, width: "auto", padding: "12px 32px" }} onClick={() => navigate("book")}>
                    Reserve a Room →
                  </button>
                </div>
              ) : (
                <div style={S.tableWrap}>
                  {/* Table header */}
                  <div style={S.tableHeader}>
                    {["BOOKING REF", "ROOM", "CHECK-IN", "CHECK-OUT", "STATUS"].map(h => (
                      <span key={h} style={S.tableHead}>{h}</span>
                    ))}
                  </div>
                  {/* Table rows */}
                  {bookings.map((b, i) => (
                    <div key={b.id} className="booking-row"
                      style={{ ...S.tableRow, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.2s" }}>
                      <span style={S.bookingRef}>GV-{String(b.id).padStart(6, "0")}</span>
                      <span style={S.tableCell}>Room {b.room}</span>
                      <span style={S.tableCell}>{b.check_in}</span>
                      <span style={S.tableCell}>{b.check_out}</span>
                      <span style={{
                        ...S.statusTag,
                        color: b.status === "confirmed" ? "#7eb87e" : b.status === "cancelled" ? "#c97b6e" : "#c9a96e",
                        borderColor: b.status === "confirmed" ? "rgba(126,184,126,0.3)" : b.status === "cancelled" ? "rgba(201,123,110,0.3)" : "rgba(201,169,110,0.3)",
                        background: b.status === "confirmed" ? "rgba(126,184,126,0.07)" : b.status === "cancelled" ? "rgba(201,123,110,0.07)" : "rgba(201,169,110,0.07)",
                      }}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const S = {
  page: { background: "#0a0908", minHeight: "100vh", color: "#e8dcc8", fontFamily: "'Cormorant Garamond', serif" },

  // Nav
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 56px", borderBottom: "1px solid rgba(201,169,110,0.1)", background: "rgba(10,9,8,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  backBtn: { background: "transparent", border: "1px solid rgba(201,169,110,0.15)", color: "#7a6f62", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "1.5px", padding: "8px 18px", transition: "all 0.2s", textTransform: "uppercase" },
  logo: { fontSize: "18px", fontWeight: 600, letterSpacing: "7px", color: "#e8dcc8" },
  logoGold: { color: "#c9a96e" },
  logoutBtn: { background: "transparent", border: "1px solid #1e1a16", color: "#4a3f32", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2px", padding: "8px 18px", textTransform: "uppercase", transition: "all 0.2s" },

  // Layout
  content: { display: "flex", minHeight: "calc(100vh - 65px)" },

  // Sidebar
  sidebar: { width: "290px", flexShrink: 0, borderRight: "1px solid rgba(201,169,110,0.08)", padding: "44px 32px", display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(180deg, #0d0c0a 0%, #0a0908 100%)" },
  avatarWrap: { position: "relative", marginBottom: "20px" },
  avatarOuter: { width: "96px", height: "96px", borderRadius: "50%", padding: "3px", background: "linear-gradient(135deg, #c9a96e, #5a4020)", animation: "goldPulse 3s ease-in-out infinite" },
  avatar: { width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #1e1a14, #2a2218)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: 500, color: "#c9a96e", letterSpacing: "1px", fontFamily: "'Cormorant Garamond', serif" },
  onlineDot: { position: "absolute", bottom: "4px", right: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "#7eb87e", border: "2px solid #0a0908" },
  sidebarName: { fontSize: "22px", fontWeight: 400, color: "#e8dcc8", margin: "0 0 4px", textAlign: "center", letterSpacing: "0.5px" },
  sidebarEmail: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#3a3530", letterSpacing: "0.5px", margin: "0 0 16px", textAlign: "center" },

  // Guest badge
  guestBadge: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.15)", padding: "6px 14px", marginBottom: "20px" },
  guestBadgeLabel: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "3px", color: "#6a5f52", textTransform: "uppercase" },
  guestBadgeId: { fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#c9a96e", letterSpacing: "2px" },

  divider: { width: "100%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.15), transparent)", margin: "4px 0 16px" },

  // Member since
  memberBlock: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", marginBottom: "8px" },
  memberLabel: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "3px", color: "#3a3530", textTransform: "uppercase" },
  memberDate: { fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "#c9a96e", fontWeight: 300, letterSpacing: "1px" },

  // Side nav
  sideNav: { width: "100%", display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" },
  sideNavBtn: { width: "100%", background: "none", border: "none", color: "#4a3f32", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "1.5px", padding: "11px 14px", textAlign: "left", transition: "all 0.2s", textTransform: "uppercase", display: "flex", alignItems: "center", borderRadius: "1px" },
  sideNavActive: { background: "rgba(201,169,110,0.07)", color: "#c9a96e", borderLeft: "2px solid #c9a96e", paddingLeft: "12px" },
  activeArrow: { marginLeft: "auto", fontSize: "18px", color: "#c9a96e", lineHeight: 1 },

  reserveBtn: { background: "#c9a96e", border: "none", color: "#0a0908", padding: "12px 20px", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2.5px", textTransform: "uppercase", cursor: "pointer", fontWeight: 600, width: "100%", transition: "background 0.2s", marginTop: "8px" },

  // Main
  main: { flex: 1, padding: "48px 56px", background: "#0a0908" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px", paddingBottom: "28px", borderBottom: "1px solid rgba(201,169,110,0.08)" },
  panelEyebrow: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "4px", color: "#3a3530", textTransform: "uppercase", marginBottom: "6px" },
  panelTitle: { fontSize: "32px", fontWeight: 300, color: "#e8dcc8", margin: "0 0 6px", letterSpacing: "0.5px" },
  panelSub: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#3a3530", margin: 0, letterSpacing: "0.5px" },

  // Status pill
  statusPill: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(126,184,126,0.07)", border: "1px solid rgba(126,184,126,0.2)", padding: "8px 16px", fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#7eb87e", letterSpacing: "1.5px", textTransform: "uppercase", alignSelf: "flex-start" },
  statusDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#7eb87e" },

  // Info grid
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  infoCard: { background: "linear-gradient(135deg, #111009, #0d0c0a)", border: "1px solid rgba(201,169,110,0.08)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", transition: "border-color 0.2s" },
  infoCardTop: { display: "flex", alignItems: "center", gap: "8px" },
  infoCardIcon: { fontSize: "12px", color: "#3a3530" },
  infoCardLabel: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "3px", color: "#3a3530", textTransform: "uppercase" },
  infoCardValue: { fontSize: "20px", fontWeight: 300, color: "#e8dcc8", letterSpacing: "0.3px" },

  // Section header with lines
  sectionHeader: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  sectionLine: { flex: 1, height: "1px", background: "rgba(201,169,110,0.08)" },
  sectionTitle: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "4px", color: "#3a3530", textTransform: "uppercase", whiteSpace: "nowrap" },

  // Security
  securityCard: { background: "linear-gradient(135deg, #111009, #0d0c0a)", border: "1px solid rgba(201,169,110,0.08)", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  securityIcon: { fontSize: "24px", width: "44px", height: "44px", background: "rgba(201,169,110,0.06)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px" },
  securityLabel: { fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#c8bca8", margin: "0 0 3px", letterSpacing: "0.5px" },
  securitySub: { fontFamily: "'Jost', sans-serif", fontSize: "10px", color: "#3a3530", margin: 0, letterSpacing: "0.5px" },
  securityBtn: { background: "transparent", border: "1px solid rgba(201,169,110,0.2)", color: "#c9a96e", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", padding: "9px 20px", textTransform: "uppercase", transition: "all 0.2s" },

  // Bookings
  bookingCount: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
  tableWrap: { border: "1px solid rgba(201,169,110,0.08)", overflow: "hidden" },
  tableHeader: { display: "grid", gridTemplateColumns: "1.3fr 0.7fr 1fr 1fr 0.8fr", gap: "16px", padding: "12px 24px", background: "rgba(201,169,110,0.04)", borderBottom: "1px solid rgba(201,169,110,0.08)" },
  tableHead: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "2.5px", color: "#3a3530", textTransform: "uppercase" },
  tableRow: { display: "grid", gridTemplateColumns: "1.3fr 0.7fr 1fr 1fr 0.8fr", gap: "16px", padding: "16px 24px", alignItems: "center", borderBottom: "1px solid rgba(201,169,110,0.04)" },
  bookingRef: { fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#c9a96e", letterSpacing: "1.5px" },
  tableCell: { fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#6a5f52", letterSpacing: "0.3px" },
  statusTag: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", border: "1px solid", padding: "4px 10px", display: "inline-block", textAlign: "center" },

  // Empty state
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 40px", border: "1px solid rgba(201,169,110,0.08)", background: "linear-gradient(135deg, #111009, #0d0c0a)" },
  emptyIcon: { fontSize: "48px", marginBottom: "20px", opacity: 0.5 },
  emptyTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "#e8dcc8", margin: "0 0 10px", letterSpacing: "0.5px" },
  emptySub: { fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#3a3530", margin: "0 0 32px", textAlign: "center", lineHeight: 1.8, maxWidth: "340px" },
};