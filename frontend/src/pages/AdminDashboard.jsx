import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../api";
import { styles } from "../styles/AdminDashboard.js";

const TABS = ["Overview", "Hotels", "Rooms", "Clients", "Bookings", "Users"];
const statusColor = { confirmed: "#7eb87e", cancelled: "#c97b6e", rescheduled: "#c9a96e" };
const roomTypeColor = { single: "#6a9fb5", double: "#7eb87e", suite: "#c9a96e", deluxe: "#c97b6e" };

export default function AdminDashboard({ navigate, onLogout }) {
  const [tab, setTab] = useState("");
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);
  const [selectedHotelForClients, setSelectedHotelForClients] = useState(null);
  const [previewBooking, setPreviewBooking] = useState(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);

  const token = sessionStorage.getItem("userToken") || localStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, r, c, b, u] = await Promise.all([
        fetch(`${API_BASE}/hotels/`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/rooms/`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/clients/`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/bookings/`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/admin/users/`, { headers }).then(res => res.json()),
      ]);
      setHotels(Array.isArray(h) ? h : []);
      setRooms(Array.isArray(r) ? r : []);
      setClients(Array.isArray(c) ? c : []);
      setBookings(Array.isArray(b) ? b : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (err) {
      setError("Failed to load data. Is the Django server running?");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = (type) => { setModal({ type, mode: "add" }); setForm({}); };
  const openEdit = (type, data) => { setModal({ type, mode: "edit" }); setForm({ ...data }); };
  const closeModal = () => { setModal(null); setForm({}); };

  const save = async () => {
    const { type, mode } = modal;
    const isEdit = mode === "edit";
    const endpoints = {
      hotel: `${API_BASE}/hotels/`,
      room: `${API_BASE}/rooms/`,
      client: `${API_BASE}/clients/`,
      booking: `${API_BASE}/bookings/`,
      user: `${API_BASE}/admin/users/`,
    };
    const url = isEdit ? `${endpoints[type]}${form.id}/` : endpoints[type];
    const method = isEdit ? "PUT" : "POST";
    const payload = { ...form };
    delete payload.hotel_name;
    delete payload.client_name;

    if (type === "client" && !payload.name) { alert("Full name is required."); return; }
    if (type === "client" && !payload.phone) { alert("Phone number is required."); return; }
    if (payload.email !== undefined) payload.email = payload.email.trim();
    if (type === "client" && !payload.email) {
      const slug = (payload.name || "guest").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 12);
      const rand = Math.random().toString(36).slice(2, 7);
      payload.email = `${slug}_${rand}@grandvelour.com`;
    }
    if (type === "room") {
      payload.hotel = parseInt(payload.hotel);
      payload.price_per_night = parseFloat(payload.price_per_night);
      payload.capacity = parseInt(payload.capacity);
      payload.is_available = payload.is_available === undefined ? true : (payload.is_available === "true" || payload.is_available === true);
    }
    if (type === "booking") {
      payload.room = parseInt(payload.room);
      payload.client = parseInt(payload.client);
      delete payload.room_number;
      delete payload.total_price;
      delete payload.created_at;
      delete payload.updated_at;
    }

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) { const errData = await res.json(); alert("Error: " + JSON.stringify(errData)); return; }
      await fetchAll();
      closeModal();
    } catch (err) {
      alert("Network error. Is Django running?");
    }
  };

  const del = async (type, id) => {
    if (!window.confirm("Delete this record?")) return;
    const endpoints = {
      hotel: `${API_BASE}/hotels/`,
      room: `${API_BASE}/rooms/`,
      client: `${API_BASE}/clients/`,
      booking: `${API_BASE}/bookings/`,
      user: `${API_BASE}/admin/users/`,
    };
    try {
      const res = await fetch(`${endpoints[type]}${id}/`, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204) { alert("Delete failed."); return; }
      await fetchAll();
    } catch (err) { alert("Network error."); }
  };

  const bulkDel = async (type, ids, clearFn) => {
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected record${ids.length > 1 ? "s" : ""}?`)) return;
    const endpoints = { client: `${API_BASE}/clients/`, booking: `${API_BASE}/bookings/` };
    try {
      await Promise.all(ids.map(id => fetch(`${endpoints[type]}${id}/`, { method: "DELETE", headers })));
      clearFn([]);
      await fetchAll();
    } catch (err) { alert("Network error during bulk delete."); }
  };

  const getClient = (id) => clients.find(c => c.id === id);
  const getRoom = (id) => rooms.find(r => r.id === id);
  const getHotel = (id) => hotels.find(h => h.id === id);

  if (loading) return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a96e", fontFamily: "'Jost', sans-serif", fontSize: "14px", letterSpacing: "3px" }}>
      LOADING...
    </div>
  );
  if (error) return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#c97b6e", fontFamily: "'Jost', sans-serif", fontSize: "14px", letterSpacing: "2px", textAlign: "center", padding: "40px" }}>
      {error}
    </div>
  );

  return (
    <div style={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarLogo}>GRAND<span style={{ color: "#c9a96e" }}>VELOUR</span></div>
          <p style={styles.sidebarSub}>Admin Panel</p>
          <nav style={styles.sidebarNav}>
            {TABS.map(t => (
              <button key={t}
                style={{ ...styles.sidebarBtn, ...(tab === t ? styles.sidebarActive : {}) }}
                onClick={() => {
                  setTab(t);
                  if (t !== "Rooms") setSelectedHotelForRooms(null);
                  if (t !== "Clients") { setSelectedHotelForClients(null); setSelectedClientIds([]); }
                  if (t !== "Bookings") setSelectedBookingIds([]);
                }}>
                {t === "Overview" ? "≡" : t === "Hotels" ? "🏨" : t === "Rooms" ? "🛏️" : t === "Clients" ? "👤" : t === "Bookings" ? "📋" : "👥"} {t}
              </button>
            ))}
          </nav>
        </div>
        <div style={styles.sidebarFooter}>
          <button style={styles.backBtn} onClick={() => navigate("landing")}>← Back to Site</button>
          <button style={styles.logoutBtn} onClick={onLogout || (() => navigate("landing"))}>⏻ Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>

        {/* Overview */}
        {(tab === "Overview" || tab === "") && (
          <div>
            <h1 style={styles.pageTitle}>Overview</h1>
            <div style={styles.statsGrid}>
              {[
                { label: "Hotels",          value: hotels.length,                                             icon: "🏨", color: "#c9a96e" },
                { label: "Rooms",           value: rooms.length,                                              icon: "🛏️", color: "#7eb87e" },
                { label: "Clients",         value: clients.length,                                            icon: "👤", color: "#6a9fb5" },
                { label: "Bookings",        value: bookings.length,                                           icon: "📋", color: "#c97b6e" },
                { label: "Confirmed",       value: bookings.filter(b => b.status === "confirmed").length,     icon: "✓",  color: "#7eb87e" },
                { label: "Cancelled",       value: bookings.filter(b => b.status === "cancelled").length,     icon: "✕",  color: "#c97b6e" },
                { label: "Rescheduled",     value: bookings.filter(b => b.status === "rescheduled").length,   icon: "↻",  color: "#c9a96e" },
                { label: "Available Rooms", value: rooms.filter(r => r.is_available).length,                  icon: "🟢", color: "#7eb87e" },
                { label: "Registered Users",value: users.length,                                              icon: "👥", color: "#6a9fb5" },
                { label: "Total Revenue",
                  value: "₱" + bookings.filter(b => b.status === "confirmed" || b.status === "rescheduled")
                    .reduce((a, b) => a + parseFloat(b.total_price || 0), 0).toLocaleString(),
                  icon: "₱", color: "#c9a96e" },
              ].map((s, i) => (
                <div key={i} style={styles.statCard}>
                  <span style={styles.statIcon}>{s.icon}</span>
                  <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
                  <span style={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
            <h2 style={styles.sectionTitle}>Recent Bookings</h2>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{["Guest","Room","Check-in","Check-out","Status","Total"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {bookings.slice(0, 5).map(b => (
                    <tr key={b.id} style={styles.tr}>
                      <td style={styles.td}>{b.client_name || getClient(b.client)?.name || "—"}</td>
                      <td style={styles.td}>{b.room_number ? `Room ${b.room_number}` : getRoom(b.room) ? `Room ${getRoom(b.room).room_number}` : "—"}</td>
                      <td style={styles.td}>{b.check_in}</td>
                      <td style={styles.td}>{b.check_out}</td>
                      <td style={styles.td}><span style={{ color: statusColor[b.status], fontFamily: "'Jost',sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>{b.status}</span></td>
                      <td style={{ ...styles.td, color: "#c9a96e" }}>₱{parseFloat(b.total_price || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hotels */}
        {tab === "Hotels" && (
          <div>
            <div style={styles.tabHeader}>
              <h1 style={styles.pageTitle}>Hotels</h1>
              <button style={styles.addBtn} onClick={() => openAdd("hotel")}>+ Add Hotel</button>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{["Name","Address","Phone","Email","Rooms","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {hotels.map(h => (
                    <tr key={h.id} style={styles.tr}>
                      <td style={{ ...styles.td, color: "#e8dcc8", fontFamily: "'Cormorant Garamond',serif", fontSize: "17px" }}>{h.name}</td>
                      <td style={styles.td}>{h.address}</td>
                      <td style={styles.td}>{h.phone}</td>
                      <td style={styles.td}>{h.email}</td>
                      <td style={styles.td}>{rooms.filter(r => r.hotel === h.id).length}</td>
                      <td style={styles.td}>
                        <button style={styles.editBtn} onClick={() => openEdit("hotel", h)}>Edit</button>
                        <button style={styles.delBtn} onClick={() => del("hotel", h.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rooms */}
        {tab === "Rooms" && (
          <div>
            {!selectedHotelForRooms && (
              <>
                <div style={styles.tabHeader}><h1 style={styles.pageTitle}>Rooms</h1></div>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#4a3f32", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "24px" }}>Select a branch to manage its rooms</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {hotels.map(h => {
                    const hotelRooms = rooms.filter(r => r.hotel === h.id);
                    const availCount = hotelRooms.filter(r => r.is_available).length;
                    return (
                      <div key={h.id} onClick={() => setSelectedHotelForRooms(h)}
                        style={{ border: "1px solid #1e1a16", background: "#111", padding: "28px", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a96e"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1a16"}>
                        <div style={{ fontSize: "24px", marginBottom: "12px" }}>🏨</div>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "18px", color: "#e8dcc8", margin: "0 0 8px", fontWeight: 400 }}>{h.name}</h3>
                        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#6a5f52", margin: "0 0 16px" }}>📍 {h.address}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#4a3f32" }}>{hotelRooms.length} room{hotelRooms.length !== 1 ? "s" : ""}</span>
                          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: availCount > 0 ? "#7eb87e" : "#c97b6e" }}>● {availCount} available</span>
                        </div>
                        <div style={{ marginTop: "16px", fontFamily: "'Jost',sans-serif", fontSize: "10px", color: "#c9a96e", letterSpacing: "2px", textTransform: "uppercase" }}>Manage rooms →</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {selectedHotelForRooms && (
              <>
                <div style={styles.tabHeader}>
                  <div>
                    <button onClick={() => setSelectedHotelForRooms(null)} style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)", color: "#a09080", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: "1px", padding: "8px 16px", marginBottom: "12px", display: "block" }}>← All Branches</button>
                    <h1 style={styles.pageTitle}>{selectedHotelForRooms.name}</h1>
                    <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#4a3f32", margin: "4px 0 0" }}>📍 {selectedHotelForRooms.address}</p>
                  </div>
                  <button style={styles.addBtn} onClick={() => { setModal({ type: "room", mode: "add" }); setForm({ hotel: selectedHotelForRooms.id }); }}>+ Add Room</button>
                </div>
                {(() => {
                  const hotelRooms = rooms.filter(r => r.hotel === selectedHotelForRooms.id);
                  const avail = hotelRooms.filter(r => r.is_available).length;
                  return (
                    <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                      {[{ label: "Total Rooms", value: hotelRooms.length, color: "#c9a96e" }, { label: "Available", value: avail, color: "#7eb87e" }, { label: "Unavailable", value: hotelRooms.length - avail, color: "#c97b6e" }].map((s, i) => (
                        <div key={i} style={{ border: "1px solid #1e1a16", background: "#111", padding: "16px 24px", display: "flex", gap: "12px", alignItems: "center" }}>
                          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "28px", fontWeight: 300, color: s.color }}>{s.value}</span>
                          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#4a3f32", textTransform: "uppercase" }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead><tr>{["Room #","Type","Price/Night","Capacity","Available","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {rooms.filter(r => r.hotel === selectedHotelForRooms.id).length === 0 ? (
                        <tr><td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#4a3f32", padding: "48px" }}>No rooms yet.</td></tr>
                      ) : rooms.filter(r => r.hotel === selectedHotelForRooms.id).map(r => (
                        <tr key={r.id} style={styles.tr}>
                          <td style={{ ...styles.td, color: "#e8dcc8" }}>Room {r.room_number}</td>
                          <td style={styles.td}><span style={{ color: roomTypeColor[r.room_type], fontFamily: "'Jost',sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>{r.room_type}</span></td>
                          <td style={{ ...styles.td, color: "#c9a96e" }}>₱{parseFloat(r.price_per_night).toLocaleString()}</td>
                          <td style={styles.td}>{r.capacity}</td>
                          <td style={styles.td}><span style={{ color: r.is_available ? "#7eb87e" : "#c97b6e", fontSize: "11px", fontFamily: "'Jost',sans-serif", textTransform: "uppercase", letterSpacing: "1px" }}>{r.is_available ? "Yes" : "No"}</span></td>
                          <td style={styles.td}>
                            <button style={styles.editBtn} onClick={() => openEdit("room", r)}>Edit</button>
                            <button style={styles.delBtn} onClick={() => del("room", r.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Clients */}
        {tab === "Clients" && (
          <div>
            {!selectedHotelForClients && (
              <>
                <div style={styles.tabHeader}><h1 style={styles.pageTitle}>Clients</h1></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {hotels.map(h => {
                    const hotelRoomIds = rooms.filter(r => r.hotel === h.id).map(r => r.id);
                    const branchBookings = bookings.filter(b => hotelRoomIds.includes(b.room));
                    const confirmedCount = branchBookings.filter(b => b.status === "confirmed").length;
                    return (
                      <div key={h.id} onClick={() => setSelectedHotelForClients(h)}
                        style={{ border: "1px solid #1e1a16", background: "#111", padding: "28px", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a96e"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1a16"}>
                        <div style={{ fontSize: "24px", marginBottom: "12px" }}>🏨</div>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "18px", color: "#e8dcc8", margin: "0 0 8px", fontWeight: 400 }}>{h.name}</h3>
                        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#6a5f52", margin: "0 0 16px" }}>📍 {h.address}</p>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#4a3f32" }}>👤 {clients.length} clients</span>
                          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#7eb87e" }}>✓ {confirmedCount} confirmed</span>
                        </div>
                        <div style={{ marginTop: "16px", fontFamily: "'Jost',sans-serif", fontSize: "10px", color: "#c9a96e", letterSpacing: "2px", textTransform: "uppercase" }}>View guests →</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {selectedHotelForClients && (() => {
              const hotelRoomIds = rooms.filter(r => r.hotel === selectedHotelForClients.id).map(r => r.id);
              const branchBookings = bookings.filter(b => hotelRoomIds.includes(b.room));
              const branchClients = clients;
              return (
                <>
                  <div style={styles.tabHeader}>
                    <div>
                      <button onClick={() => setSelectedHotelForClients(null)} style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)", color: "#a09080", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: "1px", padding: "8px 16px", marginBottom: "12px", display: "block" }}>← All Branches</button>
                      <h1 style={styles.pageTitle}>{selectedHotelForClients.name}</h1>
                    </div>
                  </div>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead><tr>{["Name","Email","Phone","Joined","Bookings","Status","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {branchClients.map(c => {
                          const clientBookings = branchBookings.filter(b => b.client === c.id);
                          const latestStatus = clientBookings[clientBookings.length - 1]?.status || "—";
                          return (
                            <tr key={c.id} style={styles.tr}>
                              <td style={{ ...styles.td, color: "#e8dcc8", fontFamily: "'Cormorant Garamond',serif", fontSize: "17px" }}>{c.name}</td>
                              <td style={styles.td}>{c.email && !c.email.includes("@grandvelour.com") ? c.email : <span style={{ color: "#4a3f32", fontStyle: "italic" }}>N/A</span>}</td>
                              <td style={styles.td}>{c.phone}</td>
                              <td style={styles.td}>{c.created_at ? c.created_at.split("T")[0] : "—"}</td>
                              <td style={styles.td}>{clientBookings.length}</td>
                              <td style={styles.td}><span style={{ color: latestStatus === "confirmed" ? "#7eb87e" : latestStatus === "cancelled" ? "#c97b6e" : "#c9a96e", fontFamily: "'Jost',sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>{latestStatus}</span></td>
                              <td style={styles.td}>
                                <button style={styles.editBtn} onClick={() => openEdit("client", c)}>Edit</button>
                                <button style={styles.delBtn} onClick={() => del("client", c.id)}>Delete</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Bookings */}
        {tab === "Bookings" && (
          <div>
            <div style={styles.tabHeader}>
              <h1 style={styles.pageTitle}>Bookings</h1>
              <button style={styles.addBtn} onClick={() => openAdd("booking")}>+ Add Booking</button>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: "40px" }}>
                      <input type="checkbox"
                        checked={bookings.length > 0 && selectedBookingIds.length === bookings.length}
                        onChange={e => setSelectedBookingIds(e.target.checked ? bookings.map(b => b.id) : [])}
                        style={{ cursor: "pointer", accentColor: "#c9a96e" }} />
                    </th>
                    {["#","Guest","Room","Check-in","Check-out","Status","Total","Notes","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const clientName = b.client_name || getClient(b.client)?.name || "—";
                    const roomInfo = b.room_number ? `Room ${b.room_number}` : getRoom(b.room) ? `Room ${getRoom(b.room).room_number}` : "—";
                    const roomObj = getRoom(b.room);
                    const hotelObj = roomObj ? getHotel(roomObj.hotel) : null;
                    const nights = b.check_in && b.check_out ? Math.max(0, (new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)) : 0;
                    const isChecked = selectedBookingIds.includes(b.id);
                    return (
                      <tr key={b.id} style={{ ...styles.tr, ...(isChecked ? { background: "rgba(201,169,110,0.05)", borderLeft: "2px solid #c9a96e" } : {}) }}>
                        <td style={styles.td}><input type="checkbox" checked={isChecked} onChange={e => setSelectedBookingIds(prev => e.target.checked ? [...prev, b.id] : prev.filter(id => id !== b.id))} style={{ cursor: "pointer", accentColor: "#c9a96e" }} /></td>
                        <td style={styles.td}>#{b.id}</td>
                        <td style={{ ...styles.td, color: "#c9a96e", fontFamily: "'Cormorant Garamond',serif", fontSize: "16px", cursor: "pointer", textDecoration: "underline" }} onClick={() => { setPreviewBooking({ b, clientName, roomInfo, roomObj, hotelObj, nights }); setReceiptZoom(1); }}>{clientName}</td>
                        <td style={styles.td}>{roomInfo}</td>
                        <td style={styles.td}>{b.check_in}</td>
                        <td style={styles.td}>{b.check_out}</td>
                        <td style={styles.td}><span style={{ color: statusColor[b.status], fontFamily: "'Jost',sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>{b.status}</span></td>
                        <td style={{ ...styles.td, color: "#c9a96e" }}>₱{parseFloat(b.total_price || 0).toLocaleString()}</td>
                        <td style={{ ...styles.td, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.notes || "—"}</td>
                        <td style={styles.td}>
                          <button style={styles.editBtn} onClick={() => openEdit("booking", b)}>Edit</button>
                          <button style={styles.delBtn} onClick={() => del("booking", b.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users — Admin only */}
        {tab === "Users" && (
          <div>
            <div style={styles.tabHeader}>
              <h1 style={styles.pageTitle}>Registered Users</h1>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{["Name","Email","Role","Status","Joined","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={{ ...styles.td, color: "#e8dcc8", fontFamily: "'Cormorant Garamond',serif", fontSize: "17px" }}>{u.first_name} {u.last_name}</td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          color: u.role === "admin" ? "#c9a96e" : u.role === "staff" ? "#6a9fb5" : "#7eb87e",
                          fontFamily: "'Jost',sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px"
                        }}>{u.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: u.is_active ? "#7eb87e" : "#c97b6e", fontFamily: "'Jost',sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={styles.td}>{u.date_joined ? u.date_joined.split("T")[0] : "—"}</td>
                      <td style={styles.td}>
                        <button style={styles.editBtn} onClick={() => openEdit("user", u)}>Edit Role</button>
                        <button style={styles.delBtn} onClick={() => del("user", u.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipt Preview Modal */}
        {previewBooking && (() => {
          const { b, clientName, roomInfo, roomObj, hotelObj, nights } = previewBooking;
          const total = parseFloat(b.total_price || 0);
          const issueDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
          const bookingRef = `GV-#${b.id}`;
          return (
            <div onClick={() => setPreviewBooking(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "20px", overflowY: "auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", background: "#1a1814", border: "1px solid #2a2520", padding: "10px 20px" }}>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#6a5f52", letterSpacing: "2px" }}>RECEIPT PREVIEW</span>
                <span style={{ color: "#2a2520" }}>|</span>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#c9a96e" }}>{bookingRef}</span>
                <span style={{ color: "#2a2520" }}>|</span>
                <button onClick={() => setReceiptZoom(z => Math.max(0.5, z - 0.1))} style={{ background: "#111", border: "1px solid #2a2520", color: "#a09080", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "13px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: "#8a7a68", minWidth: "36px", textAlign: "center" }}>{Math.round(receiptZoom * 100)}%</span>
                <button onClick={() => setReceiptZoom(z => Math.min(2, z + 0.1))} style={{ background: "#111", border: "1px solid #2a2520", color: "#a09080", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "13px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <button onClick={() => setReceiptZoom(1)} style={{ background: "none", border: "none", color: "#4a3f32", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: "1px" }}>RESET</button>
                <span style={{ color: "#2a2520" }}>|</span>
                <button onClick={() => setPreviewBooking(null)} style={{ background: "none", border: "none", color: "#c97b6e", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: "1px" }}>✕ CLOSE</button>
              </div>
              <div onClick={e => e.stopPropagation()} style={{ transformOrigin: "top center", transform: `scale(${receiptZoom})`, transition: "transform 0.15s", marginBottom: `${(1 - receiptZoom) * 800}px` }}>
                <div style={{ width: "520px", background: "#fff", fontFamily: "'Jost', sans-serif", boxShadow: "0 8px 60px rgba(0,0,0,0.6)" }}>
                  <div style={{ height: "6px", background: "linear-gradient(90deg, #c9a96e, #e8c87a, #c9a96e)" }}/>
                  <div style={{ padding: "32px 44px 20px", textAlign: "center", borderBottom: "1px solid #ede8df" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "26px", fontWeight: 600, letterSpacing: "6px", color: "#1a1510" }}>GRAND<span style={{ color: "#c9a96e" }}>VELOUR</span></div>
                    <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#9a8a78", textTransform: "uppercase", marginTop: "4px" }}>Hotels & Resorts · Philippines</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "13px", letterSpacing: "4px", color: "#c9a96e", textTransform: "uppercase", marginTop: "14px", borderTop: "1px solid #ede8df", paddingTop: "12px" }}>Official Booking Receipt</div>
                  </div>
                  <div style={{ background: "#faf7f2", borderTop: "1px solid #ede8df", borderBottom: "1px solid #ede8df", padding: "12px 44px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#9a8a78", textTransform: "uppercase", marginBottom: "4px" }}>Booking Reference</div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", color: "#c9a96e", letterSpacing: "2px", fontWeight: 600 }}>{bookingRef}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#9a8a78", textTransform: "uppercase", marginBottom: "4px" }}>Date Issued</div>
                      <div style={{ fontSize: "12px", color: "#6a5f52" }}>{issueDate}</div>
                    </div>
                  </div>
                  {[
                    { title: "GUEST INFORMATION", rows: [["Name", clientName], ["Phone", getClient(b.client)?.phone || "—"]] },
                    { title: "RESERVATION DETAILS", rows: [["Hotel", hotelObj?.name || "—"], ["Room", roomInfo], ["Room Type", roomObj?.room_type || "—"]] },
                    { title: "STAY DETAILS", rows: [["Check-in", b.check_in], ["Check-out", b.check_out], ["Duration", `${nights} night${nights !== 1 ? "s" : ""}`], ["Status", b.status?.toUpperCase()]] },
                  ].map((sec, si) => (
                    <div key={si} style={{ padding: "16px 44px", borderBottom: "1px solid #ede8df" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#c9a96e", textTransform: "uppercase", marginBottom: "12px", fontWeight: 500, paddingBottom: "8px", borderBottom: "1px solid #f0ebe3" }}>{sec.title}</div>
                      {sec.rows.map(([k, v], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#9a8a78" }}>{k}</span>
                          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "15px", color: "#2a2018" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ padding: "18px 44px", background: "#faf7f2", borderTop: "2px solid #c9a96e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#6a5f52", textTransform: "uppercase" }}>Total Amount Due</div>
                        <div style={{ fontSize: "11px", color: "#b0a090", marginTop: "4px" }}>PHP {parseFloat(roomObj?.price_per_night || 0).toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "32px", color: "#c9a96e", fontWeight: 300 }}>PHP {total.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "linear-gradient(90deg, #c9a96e, #e8c87a, #c9a96e)" }}/>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal */}
      {modal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <h3 style={styles.modalTitle}>{modal.mode === "add" ? "Add" : "Edit"} {modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}</h3>
              <button style={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {modal.type === "hotel" && (
                <>{[["name","Hotel Name","text"],["address","Address","text"],["phone","Phone","text"],["email","Email","email"]].map(([k,l,t]) => (
                  <div key={k} style={styles.field}><label style={styles.fieldLabel}>{l}</label><input style={styles.input} type={t} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
                ))}</>
              )}
              {modal.type === "room" && (
                <>
                  <div style={styles.field}><label style={styles.fieldLabel}>Hotel</label><select style={styles.input} value={form.hotel || ""} onChange={e => setForm({ ...form, hotel: e.target.value })}><option value="">Select hotel</option>{hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Room Number</label><input style={styles.input} type="text" value={form.room_number || ""} onChange={e => setForm({ ...form, room_number: e.target.value })} /></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Room Type</label><select style={styles.input} value={form.room_type || ""} onChange={e => setForm({ ...form, room_type: e.target.value })}><option value="">Select type</option>{["single","double","suite","deluxe"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Price / Night</label><input style={styles.input} type="number" value={form.price_per_night || ""} onChange={e => setForm({ ...form, price_per_night: e.target.value })} /></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Capacity</label><input style={styles.input} type="number" value={form.capacity || ""} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Available</label><select style={styles.input} value={form.is_available === undefined ? "true" : String(form.is_available)} onChange={e => setForm({ ...form, is_available: e.target.value })}><option value="true">Yes</option><option value="false">No</option></select></div>
                </>
              )}
              {modal.type === "client" && (
                <>
                  <div style={styles.field}><label style={styles.fieldLabel}>Full Name</label><input style={styles.input} type="text" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Email</label><input style={styles.input} type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Phone</label><input style={styles.input} type="text" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </>
              )}
              {modal.type === "booking" && (
                <>
                  <div style={styles.field}><label style={styles.fieldLabel}>Client</label><select style={styles.input} value={form.client || ""} onChange={e => setForm({ ...form, client: e.target.value })}><option value="">Select client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Room</label><select style={styles.input} value={form.room || ""} onChange={e => setForm({ ...form, room: e.target.value })}><option value="">Select room</option>{rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} — {r.hotel_name || getHotel(r.hotel)?.name}</option>)}</select></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Status</label><select style={styles.input} value={form.status || "confirmed"} onChange={e => setForm({ ...form, status: e.target.value })}>{["confirmed","cancelled","rescheduled"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  {[["check_in","Check-in","date"],["check_out","Check-out","date"]].map(([k,l,t]) => (
                    <div key={k} style={styles.field}><label style={styles.fieldLabel}>{l}</label><input style={styles.input} type={t} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
                  ))}
                  <div style={styles.field}><label style={styles.fieldLabel}>Notes</label><textarea style={{ ...styles.input, height: "70px", resize: "vertical" }} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                </>
              )}
              {modal.type === "user" && (
                <>
                  <div style={styles.field}><label style={styles.fieldLabel}>Name</label><input style={{ ...styles.input, background: "#0d0d0d", color: "#4a3f32" }} type="text" value={`${form.first_name || ""} ${form.last_name || ""}`} disabled /></div>
                  <div style={styles.field}><label style={styles.fieldLabel}>Email</label><input style={{ ...styles.input, background: "#0d0d0d", color: "#4a3f32" }} type="email" value={form.email || ""} disabled /></div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Role</label>
                    <select style={styles.input} value={form.role || "user"} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="user">User</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Status</label>
                    <select style={styles.input} value={form.is_active ? "true" : "false"} onChange={e => setForm({ ...form, is_active: e.target.value === "true" })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </>
              )}
              <button style={styles.saveBtn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}