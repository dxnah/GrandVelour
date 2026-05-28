    import { useState, useEffect, useRef } from "react";
    import { API_BASE } from "../api";

    function loadjsPDF() {
      return new Promise((resolve) => {
        if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = () => resolve(window.jspdf.jsPDF);
        document.head.appendChild(script);
      });
    }

    const ROOM_IMAGES = {
      single: [
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
        "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600&q=80",
      ],
      double: [
        "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
      ],
      deluxe: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
      ],
      suite: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80",
      ],
    };

    function PhotoCarousel({ images, height = 160 }) {
      const [idx, setIdx] = useState(0);
      const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
      const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); };
      return (
        <div style={{ position: "relative", height, overflow: "hidden", background: "#0a0a0a", flexShrink: 0 }}>
          <img src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {images.length > 1 && (
            <>
              <button onClick={prev} style={carouselBtn("left")}>‹</button>
              <button onClick={next} style={carouselBtn("right")}>›</button>
              <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
                {images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                    style={{ width: i === idx ? "18px" : "6px", height: "6px", borderRadius: "3px", border: "none", cursor: "pointer", background: i === idx ? "#c9a96e" : "rgba(255,255,255,0.45)", padding: 0, transition: "all 0.2s" }} />
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    const carouselBtn = (side) => ({
      position: "absolute", [side]: "8px", top: "50%", transform: "translateY(-50%)",
      background: "rgba(0,0,0,0.55)", border: "none", color: "#e8dcc8",
      width: "28px", height: "28px", cursor: "pointer", fontSize: "16px",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
    });

    function QRCode({ value, size = 140 }) {
      return (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=111111&color=c9a96e&margin=10`}
          alt="Booking QR" width={size} height={size} style={{ display: "block" }}
        />
      );
    }

    function SkeletonCard({ height = "200px" }) {
      return (
        <div style={{
          height,
          border: "1px solid #1e1a16",
          background: "linear-gradient(90deg, #111 25%, #1a1a18 50%, #111 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
        }} />
      );
    }

    // Sticky booking summary sidebar for step 3
    function BookingSummary({ selectedHotel, selectedRoom, form, nights, totalPrice }) {
      if (!selectedRoom) return null;
      return (
        <div style={SB.wrap}>
          <p style={SB.heading}>BOOKING SUMMARY</p>
          <div style={SB.body}>
            {selectedRoom && (
              <img
                src={(ROOM_IMAGES[selectedRoom.room_type] || ROOM_IMAGES.single)[0]}
                alt=""
                style={SB.photo}
              />
            )}
            <div style={SB.section}>
              <p style={SB.label}>HOTEL</p>
              <p style={SB.value}>{selectedHotel?.name}</p>
              <p style={SB.sub}>{selectedHotel?.address}</p>
            </div>
            <div style={SB.divider} />
            <div style={SB.section}>
              <p style={SB.label}>ROOM</p>
              <p style={SB.value}>Room {selectedRoom.room_number}</p>
              <p style={SB.sub}>{selectedRoom.room_type?.charAt(0).toUpperCase() + selectedRoom.room_type?.slice(1)} · Up to {selectedRoom.capacity} guests</p>
            </div>
            <div style={SB.divider} />
            <div style={SB.section}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={SB.label}>CHECK-IN</p>
                <p style={{ ...SB.sub, color: "#8a7a68" }}>{form.check_in || "—"}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <p style={SB.label}>CHECK-OUT</p>
                <p style={{ ...SB.sub, color: "#8a7a68" }}>{form.check_out || "—"}</p>
              </div>
              {nights > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                  <p style={SB.label}>DURATION</p>
                  <p style={{ ...SB.sub, color: "#8a7a68" }}>{nights} night{nights !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
            <div style={SB.divider} />
            <div style={{ ...SB.section, background: "rgba(201,169,110,0.05)", padding: "14px 18px", border: "1px solid rgba(201,169,110,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={SB.label}>RATE / NIGHT</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#c9a96e" }}>
                  ₱{parseFloat(selectedRoom.price_per_night).toLocaleString()}
                </p>
              </div>
              {nights > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <p style={{ ...SB.label, color: "#c9a96e" }}>TOTAL ({nights}n)</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 400, color: "#c9a96e" }}>
                    ₱{totalPrice.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const SB = {
      wrap: { position: "sticky", top: "80px", background: "#111", border: "1px solid #2a2520", width: "280px", flexShrink: 0, alignSelf: "start" },
      heading: { fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "#c9a96e", textTransform: "uppercase", margin: 0, padding: "16px 18px", borderBottom: "1px solid #1e1a16" },
      body: {},
      photo: { width: "100%", height: "140px", objectFit: "cover", display: "block" },
      section: { padding: "14px 18px" },
      divider: { height: "1px", background: "#1e1a16" },
      label: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "2px", color: "#4a3f32", textTransform: "uppercase", margin: "0 0 4px" },
      value: { fontSize: "16px", fontWeight: 400, color: "#e8dcc8", margin: "0 0 4px" },
      sub: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#6a5f52", margin: 0 },
    };

    export default function BookAppointment({ navigate, goBack, previousPage }) {
      const [step, setStep] = useState(1);
      const [animDir, setAnimDir] = useState("forward");
      const [hotels, setHotels] = useState([]);
      const [rooms, setRooms] = useState([]);
      const [loadingData, setLoadingData] = useState(true);
      const [dataError, setDataError] = useState(null);
      const [selectedHotel, setSelectedHotel] = useState(null);
      const [selectedRoomType, setSelectedRoomType] = useState(null);
      const [selectedRoom, setSelectedRoom] = useState(null);

      const isLoggedIn = !!sessionStorage.getItem("userToken");
      const [form, setForm] = useState(() => {
      const userData = sessionStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        return {
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          email: user.email || "",
          phone: "",
          guests: "",
          check_in: "",
          check_out: "",
          notes: "",
        };
      }
      return { name: "", email: "", phone: "", guests: "", check_in: "", check_out: "", notes: "" };
    });

      const [formErrors, setFormErrors] = useState({});
      const [submitted, setSubmitted] = useState(false);
      const [submitting, setSubmitting] = useState(false);
      const [submitError, setSubmitError] = useState(null);
      const [createdBooking, setCreatedBooking] = useState(null);
      const [bookingRefState] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
      const stepContentRef = useRef(null);

      useEffect(() => {
        const fetchData = async () => {
          setLoadingData(true);
          try {
            const [h, r] = await Promise.all([
              fetch(`${API_BASE}/hotels/`).then(res => res.json()),
              fetch(`${API_BASE}/rooms/`).then(res => res.json()),
            ]);
            setHotels(Array.isArray(h) ? h : []);
            setRooms(Array.isArray(r) ? r : []);
          } catch {
            setDataError("Could not load hotel data. Please try again.");
          } finally {
            setLoadingData(false);
          }
        };
        fetchData();
      }, []);

      const goToStep = (nextStep) => {
        setAnimDir(nextStep > step ? "forward" : "back");
        if (stepContentRef.current) {
          stepContentRef.current.style.opacity = "0";
          stepContentRef.current.style.transform = nextStep > step ? "translateX(30px)" : "translateX(-30px)";
        }
        setTimeout(() => {
          setStep(nextStep);
          if (stepContentRef.current) {
            stepContentRef.current.style.transition = "none";
            stepContentRef.current.style.opacity = "0";
            stepContentRef.current.style.transform = nextStep > step ? "translateX(-20px)" : "translateX(20px)";
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (stepContentRef.current) {
                  stepContentRef.current.style.transition = "opacity 0.35s ease, transform 0.35s ease";
                  stepContentRef.current.style.opacity = "1";
                  stepContentRef.current.style.transform = "translateX(0)";
                }
              });
            });
          }
        }, 180);
      };

      const roomsForHotel = selectedHotel ? rooms.filter(r => r.hotel === selectedHotel.id) : [];
      const roomTypes = [...new Set(roomsForHotel.map(r => r.room_type))];
      const roomsOfType = selectedRoomType ? roomsForHotel.filter(r => r.room_type === selectedRoomType) : [];

      const nights = form.check_in && form.check_out
        ? Math.max(0, (new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24))
        : 0;

      const totalPrice = selectedRoom ? parseFloat(selectedRoom.price_per_night) * nights : 0;
      const bookingRef = createdBooking
    ? `GV-${String(createdBooking.id).padStart(6, "0")}`
    : `GV-${bookingRefState}`;

      const qrData = createdBooking
    ? `Grand Velour Booking | Ref: GV-${String(createdBooking.id).padStart(6, "0")} | Guest: ${form.name} ...`
    : "";

      const validateForm = () => {
        const errors = {};
        if (!form.phone) {
          errors.phone = "Phone number is required.";
        } else if (!/^[0-9+\-\s]+$/.test(form.phone)) {
          errors.phone = "Phone number must contain numbers only.";
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          errors.email = "Please enter a valid email address.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
      };

      const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        const token = sessionStorage.getItem("userToken");
        try {
          let clientId = null;
          const clientRes = await fetch(`${API_BASE}/clients/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              email: form.email || `guest_${bookingRefState}@grandvelour.com`,
              phone: form.phone,
            }),
          });
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            clientId = clientData.id;
          } else {
            const allClients = await fetch(`${API_BASE}/clients/`).then(r => r.json());
            const existing = allClients.find(c => c.email === form.email);
            if (existing) {
              clientId = existing.id;
            } else {
              setSubmitError("Could not create guest profile. Please try again.");
              setSubmitting(false);
              return;
            }
          }
            const bookingRes = await fetch(`${API_BASE}/bookings/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({
                client: clientId,
                room: selectedRoom.id,
                check_in: form.check_in,
                check_out: form.check_out,
                status: "confirmed",
                notes: form.notes,
              }),
            });

            if (!bookingRes.ok) {
              const errData = await bookingRes.json();
              // Handle expired token specifically
              if (bookingRes.status === 401) {
                sessionStorage.removeItem("userToken");
                sessionStorage.removeItem("userData");
                setSubmitError("Your session has expired. Please sign in again.");
                setSubmitting(false);
                return;
              }
              const msg = typeof errData === "object" ? Object.values(errData).flat().join(" ") : "Booking failed.";
              setSubmitError(msg);
              setSubmitting(false);
              return;
            }
          const bookingData = await bookingRes.json();
          setCreatedBooking(bookingData);
          setSubmitted(true);
        } catch {
          setSubmitError("Network error. Is the server running?");
        } finally {
          setSubmitting(false);
        }
      };

      const handleDownloadReceipt = async () => {
        const jsPDF = await loadjsPDF();
        const issueDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "legal" });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        let y = 0;

        doc.setFillColor(201, 169, 110);
        doc.rect(0, 0, W, 4, "F");
        y = 10;

        doc.setFont("times", "bold");
        doc.setFontSize(22);
        const grandW = doc.getTextWidth("GRAND");
        const velourW = doc.getTextWidth("VELOUR");
        const hx = (W - grandW - velourW) / 2;
        doc.setTextColor(26, 21, 16);
        doc.text("GRAND", hx, y + 8);
        doc.setTextColor(201, 169, 110);
        doc.text("VELOUR", hx + grandW, y + 8);
        y += 12;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(154, 138, 120);
        doc.text("HOTELS & RESORTS  ·  PHILIPPINES", W / 2, y, { align: "center" });
        y += 5;
        doc.setDrawColor(224, 216, 204);
        doc.line(14, y, W - 14, y);
        y += 5;
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(201, 169, 110);
        doc.text("Official Booking Receipt", W / 2, y, { align: "center" });
        y += 8;

        doc.setFillColor(250, 247, 242);
        doc.rect(0, y, W, 16, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(154, 138, 120);
        doc.text("BOOKING REFERENCE", 16, y + 5);
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.setTextColor(201, 169, 110);
        doc.text(bookingRef, 16, y + 13);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(154, 138, 120);
        doc.text("DATE ISSUED", W - 16, y + 5, { align: "right" });
        doc.setFontSize(9);
        doc.setTextColor(106, 95, 82);
        doc.text(issueDate, W - 16, y + 13, { align: "right" });
        y += 22;

        const drawSection = (title, rows) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(201, 169, 110);
          doc.text(title, 16, y);
          doc.setDrawColor(240, 235, 227);
          doc.line(16, y + 2, W - 16, y + 2);
          y += 8;
          rows.forEach(([key, val]) => {
            if (!val && val !== 0) return;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(154, 138, 120);
            doc.text(String(key), 16, y);
            doc.setFont("times", "normal");
            doc.setFontSize(10);
            doc.setTextColor(42, 32, 24);
            doc.text(String(val), W - 16, y, { align: "right" });
            y += 7;
          });
          doc.setDrawColor(224, 216, 204);
          doc.line(0, y + 2, W, y + 2);
          y += 8;
        };

        drawSection("GUEST INFORMATION", [
          ["Name", form.name],
          ...(form.email ? [["Email", form.email]] : []),
          ["Phone", form.phone],
          ["Number of Guests", `${form.guests} person${Number(form.guests) > 1 ? "s" : ""}`],
        ]);
        drawSection("RESERVATION DETAILS", [
          ["Hotel", selectedHotel?.name],
          ["Address", selectedHotel?.address],
          ["Room Number", `Room ${selectedRoom?.room_number}`],
          ["Room Type", selectedRoom?.room_type],
        ]);
        drawSection("STAY DETAILS", [
          ["Check-in", form.check_in],
          ["Check-out", form.check_out],
          ["Duration", `${nights} night${nights > 1 ? "s" : ""}`],
          ...(form.notes ? [["Special Requests", form.notes]] : []),
        ]);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(201, 169, 110);
        doc.text("BILLING SUMMARY", 16, y);
        doc.setDrawColor(240, 235, 227);
        doc.line(16, y + 2, W - 16, y + 2);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(154, 138, 120);
        doc.text("Rate per Night", 16, y);
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(42, 32, 24);
        doc.text(`PHP ${parseFloat(selectedRoom?.price_per_night).toLocaleString()}`, W - 16, y, { align: "right" });
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(154, 138, 120);
        doc.text("Number of Nights", 16, y);
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(42, 32, 24);
        doc.text(String(nights), W - 16, y, { align: "right" });
        y += 5;
        doc.setDrawColor(200, 190, 178);
        doc.setLineDashPattern([1, 2], 0);
        doc.line(16, y, W - 16, y);
        doc.setLineDashPattern([], 0);
        y += 8;

        doc.setFillColor(250, 247, 242);
        doc.rect(0, y, W, 20, "F");
        doc.setDrawColor(201, 169, 110);
        doc.setLineWidth(0.8);
        doc.line(0, y, W, y);
        doc.setLineWidth(0.2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(106, 95, 82);
        doc.text("TOTAL AMOUNT DUE", 16, y + 7);
        doc.setFont("times", "normal");
        doc.setFontSize(26);
        doc.setTextColor(201, 169, 110);
        doc.text(`PHP ${totalPrice.toLocaleString()}`, W - 16, y + 14, { align: "right" });
        y += 26;

        doc.setFont("times", "italic");
        doc.setFontSize(12);
        doc.setTextColor(106, 95, 82);
        doc.text("Thank you for choosing Grand Velour.", W / 2, y, { align: "center" });
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(176, 160, 144);
        doc.text(`${selectedHotel?.email}  ·  ${selectedHotel?.phone}`, W / 2, y, { align: "center" });
        y += 5;
        doc.text(selectedHotel?.address, W / 2, y, { align: "center" });
        y += 10;
        const stampText = "PRESENT THIS RECEIPT UPON CHECK-IN";
        const stampW = doc.getTextWidth(stampText) + 16;
        doc.setDrawColor(201, 169, 110);
        doc.rect((W - stampW) / 2, y - 4, stampW, 10, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(201, 169, 110);
        doc.text(stampText, W / 2, y + 2.5, { align: "center" });
        doc.setFillColor(201, 169, 110);
        doc.rect(0, H - 4, W, 4, "F");
        doc.save(`GrandVelour_Receipt_${bookingRef}.pdf`);
      };

      if (loadingData) return (
        <div style={S.page}>
          <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
          <nav style={S.nav}>
            <div style={{ width: "80px" }} />
            <div style={S.logo}>GRAND<span style={S.logoAccent}>VELOUR</span></div>
            <div style={{ width: "80px" }} />
          </nav>
          <div style={{ ...S.content, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", paddingTop: "60px" }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} height="220px" />)}
          </div>
        </div>
      );

      if (dataError) return (
        <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#c97b6e", fontFamily: "'Jost', sans-serif", fontSize: "14px", letterSpacing: "2px", textAlign: "center", padding: "40px" }}>
          {dataError}
        </div>
      );

      if (submitted) {
        return (
          <div style={S.page}>
            <nav style={S.nav}>
              <button style={S.backBtn} onClick={() => navigate("landing")}>← Back to Home</button>
              <div style={S.logo}>GRAND<span style={S.logoAccent}>VELOUR</span></div>
            </nav>
            <div style={S.successWrap}>
              <div style={S.successCard}>
                <div style={S.successHeader}>
                  <div style={S.successIconWrap}><span style={S.successIcon}>✓</span></div>
                  <h2 style={S.successTitle}>Booking Confirmed!</h2>
                  <p style={S.successRef}>Reference: <span style={{ color: "#c9a96e" }}>{bookingRef}</span></p>
                  <p style={S.successDesc}>
                    Thank you, <strong>{form.name}</strong>! Your reservation at <strong>{selectedHotel?.name}</strong> is confirmed.
                  </p>
                </div>
                <div style={S.successBody}>
                  <div style={S.qrSection}>
                    <p style={S.qrLabel}>SCAN TO VERIFY</p>
                    <div style={S.qrWrap}><QRCode value={qrData} size={140} /></div>
                    <p style={S.qrSub}>Present at check-in</p>
                  </div>
                  <div style={S.detailsSection}>
                    {[
                      ["HOTEL", selectedHotel?.name],
                      ["ROOM NO.", `Room ${selectedRoom?.room_number}`],
                      ["ROOM TYPE", selectedRoom?.room_type],
                      ["GUESTS", `${form.guests} person${Number(form.guests) > 1 ? "s" : ""}`],
                      ["CHECK-IN", form.check_in],
                      ["CHECK-OUT", form.check_out],
                      ["NIGHTS", `${nights}`],
                      ["TOTAL", `₱${totalPrice.toLocaleString()}`, true],
                    ].map(([label, value, gold], i, arr) => (
                      <div key={i}>
                        <div style={S.detailRow}>
                          <span style={S.detailLabel}>{label}</span>
                          <span style={{ ...S.detailValue, ...(gold ? { color: "#c9a96e", fontSize: "18px" } : {}) }}>{value}</span>
                        </div>
                        {i < arr.length - 1 && <div style={S.detailDivider} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.successActions}>
                  <button style={S.primaryBtn} onClick={handleDownloadReceipt}>🧾 Download Receipt</button>
                  <button style={S.outlineBtn} onClick={() => navigate("bookings")}>View My Bookings</button>
                  <button style={S.ghostBtn} onClick={() => navigate("landing")}>Back to Home</button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      const showSidebar = step === 3 && selectedRoom;

      return (
        <div style={S.page}>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
          <style>{`
            @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
            .gv-input::placeholder { color: #4a4540; opacity: 1; }
            .gv-input:focus { border-color: #c9a96e !important; border-left-color: #c9a96e !important; background: #1a1814 !important; outline: none; box-shadow: 0 0 0 1px rgba(201,169,110,0.15); }
            .gv-input:hover { border-color: #5a5048 !important; }
            input[type="date"] { color-scheme: dark; color: #e8dcc8; }
            input[type="date"]::-webkit-datetime-edit { color: #4a4540; font-family: 'Jost', sans-serif; font-size: 15px; padding: 0; }
            input[type="date"]::-webkit-datetime-edit-fields-wrapper { color: #4a4540; }
            input[type="date"]::-webkit-datetime-edit-text { color: #4a4540; }
            input[type="date"]::-webkit-datetime-edit-month-field,
            input[type="date"]::-webkit-datetime-edit-day-field,
            input[type="date"]::-webkit-datetime-edit-year-field { color: #4a4540; }
            input[type="date"].has-value::-webkit-datetime-edit-month-field,
            input[type="date"].has-value::-webkit-datetime-edit-day-field,
            input[type="date"].has-value::-webkit-datetime-edit-year-field,
            input[type="date"].has-value::-webkit-datetime-edit-text { color: #e8dcc8; }
            input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(2) hue-rotate(5deg); cursor: pointer; opacity: 0.7; }
            input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { filter: invert(0.7) sepia(1) saturate(2) hue-rotate(5deg); }
            .gv-error { color: #c97b6e; font-family: 'Jost', sans-serif; font-size: 11px; margin: 5px 0 0; letter-spacing: 0.5px; }
            .gv-hotel-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, border-color 0.22s ease !important; }
            .gv-hotel-card:hover { transform: translateY(-5px) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,169,110,0.15) !important; border-color: rgba(201,169,110,0.3) !important; }
            .gv-hotel-card:active { transform: translateY(-2px) !important; }
            .gv-type-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease !important; }
            .gv-type-card:hover { transform: translateY(-5px) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.5) !important; }
            .gv-type-card:hover img { transform: scale(1.04); }
            .gv-type-card img { transition: transform 0.3s ease !important; }
            .gv-type-card:active { transform: translateY(-2px) !important; }
            .gv-room-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease !important; }
            .gv-room-card:hover { transform: translateY(-4px) !important; box-shadow: 0 10px 28px rgba(0,0,0,0.45) !important; }
            @keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
          `}</style>

          <nav style={S.nav}>
            <button style={S.backBtn} onClick={goBack}>
              ← {previousPage === "landing" || !previousPage ? "Back to Home" : "Back"}
            </button>
            <div style={S.logo}>GRAND<span style={S.logoAccent}>VELOUR</span></div>
          </nav>

          <div style={S.stepper}>
            {["Select Hotel", "Choose Room", "Your Details", "Confirm"].map((label, i) => (
              <div key={i} style={S.stepItem}>
                <div style={{ ...S.stepCircle, ...(step > i + 1 ? S.stepDone : step === i + 1 ? S.stepActive : {}) }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ ...S.stepLabel, ...(step === i + 1 ? { color: "#c9a96e" } : {}) }}>{label}</span>
                {i < 3 && <div style={S.stepLine} />}
              </div>
            ))}
          </div>

          <div style={{ ...S.content, display: showSidebar ? "flex" : "block", gap: showSidebar ? "32px" : "0", alignItems: "start" }}>
            <div
              ref={stepContentRef}
              style={{ flex: 1, transition: "opacity 0.35s ease, transform 0.35s ease", opacity: 1, transform: "translateX(0)" }}
            >

              {/* STEP 1 */}
              {step === 1 && (
                <div style={S.stepContent}>
                  <h2 style={S.stepTitle}>Select a Hotel</h2>
                  {hotels.length === 0 ? (
                    <p style={{ fontFamily: "'Jost',sans-serif", color: "#6a5f52", fontSize: "14px" }}>No hotels available.</p>
                  ) : (
                    <div style={S.hotelGrid}>
                      {hotels.map(hotel => (
                        <div key={hotel.id}
                          className="gv-hotel-card"
                          style={{ ...S.hotelCard, ...(selectedHotel?.id === hotel.id ? S.hotelSelected : {}) }}
                          onClick={() => setSelectedHotel(hotel)}>
                          <div style={S.hotelIcon}>🏨</div>
                          <h3 style={S.hotelName}>{hotel.name}</h3>
                          <p style={S.hotelAddr}>📍 {hotel.address}</p>
                          <p style={S.hotelContact}>📞 {hotel.phone}</p>
                          <p style={S.hotelContact}>✉️ {hotel.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button style={{ ...S.primaryBtn, opacity: selectedHotel ? 1 : 0.4 }} disabled={!selectedHotel} onClick={() => goToStep(2)}>
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 2a: Room Type */}
              {step === 2 && !selectedRoomType && (
                <div style={S.stepContent}>
                  <h2 style={S.stepTitle}>Choose a Room Type</h2>
                  <p style={S.stepSubtitle}>at {selectedHotel?.name}</p>
                  {roomTypes.length === 0 ? (
                    <p style={{ fontFamily: "'Jost',sans-serif", color: "#6a5f52", fontSize: "14px" }}>No rooms available.</p>
                  ) : (
                    <div style={S.typeGrid}>
                      {roomTypes.map(type => {
                        const roomsOfThisType = roomsForHotel.filter(r => r.room_type === type);
                        const availCount = roomsOfThisType.filter(r => r.is_available).length;
                        const sampleRoom = roomsOfThisType[0];
                        const images = ROOM_IMAGES[type] || ROOM_IMAGES.single;
                        return (
                          <div key={type} className="gv-type-card" style={S.typeCard} onClick={() => setSelectedRoomType(type)}>
                            <div style={S.typeCoverWrap}>
                              <img src={images[0]} alt={type} style={S.typeCover} />
                              <div style={S.typeCoverOverlay} />
                              <span style={{ ...S.typeBadge, color: "#c9a96e", borderLeft: "3px solid #c9a96e", background: "rgba(13,13,13,0.88)" }}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                              <div style={S.typeAvailBubble}>
                                <span style={{ color: availCount > 0 ? "#7eb87e" : "#c97b6e" }}>●</span>{" "}
                                {availCount} available
                              </div>
                            </div>
                            <div style={S.typeBody}>
                              <div style={S.typeMetaRow}>
                                <span style={S.typeMeta}>👥 Up to {sampleRoom?.capacity} guests</span>
                              </div>
                              <p style={S.typeDesc}>{sampleRoom?.description || "Comfortable room with premium amenities."}</p>
                              <div style={S.typeFooter}>
                                <span style={S.typePrice}>₱{parseFloat(sampleRoom?.price_per_night || 0).toLocaleString()}<span style={S.perNight}>/night</span></span>
                                <span style={S.typeViewBtn}>View rooms →</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button style={S.outlineBtn} onClick={() => { goToStep(1); setSelectedHotel(null); }}>← Back to Select Hotel</button>
                </div>
              )}

              {/* STEP 2b: Individual Rooms */}
              {step === 2 && selectedRoomType && (
                <div style={S.stepContent}>
                  <button style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.35)", color: "#c9a96e", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: "1px", padding: "8px 16px", marginBottom: "12px", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                    onClick={() => { setSelectedRoomType(null); setSelectedRoom(null); }}>
                    ← Back to Room Types
                  </button>
                  <h2 style={S.stepTitle}>{selectedRoomType.charAt(0).toUpperCase() + selectedRoomType.slice(1)} Rooms</h2>
                  <p style={S.stepSubtitle}>
                    {selectedHotel?.name} · {roomsOfType.filter(r => r.is_available).length} of {roomsOfType.length} available
                  </p>
                  <div style={S.roomsGrid}>
                    {roomsOfType.map(room => {
                      const isAvail = room.is_available;
                      const isSelected = selectedRoom?.id === room.id;
                      const images = ROOM_IMAGES[room.room_type] || ROOM_IMAGES.single;
                      return (
                        <div key={room.id}
                          className="gv-room-card"
                          style={{ ...S.roomCard, ...(isSelected ? S.roomSelected : {}), ...(isAvail ? {} : S.roomUnavailable), cursor: isAvail ? "pointer" : "not-allowed" }}
                          onClick={() => isAvail && setSelectedRoom(room)}>
                          <div style={{ position: "relative" }}>
                            <PhotoCarousel images={images} height={160} />
                            {!isAvail && (
                              <div style={S.unavailOverlay}>
                                <span style={{ fontSize: "22px" }}>🚫</span>
                                <span style={S.unavailText}>Unavailable</span>
                              </div>
                            )}
                            {isAvail && <div style={S.vacantBadge}>● Vacant</div>}
                          </div>
                          <div style={S.roomCardBody}>
                            <div style={S.roomCardTop}>
                              <span style={S.roomNumber}>Room {room.room_number}</span>
                              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: isAvail ? "#7eb87e" : "#c97b6e" }}>
                                {isAvail ? "Available" : "Unavailable"}
                              </span>
                            </div>
                            <div style={S.roomCardMeta}>
                              <span>👥 Max {room.capacity}</span>
                              <span style={{ color: "#c9a96e" }}>₱{parseFloat(room.price_per_night).toLocaleString()}/night</span>
                            </div>
                            {isAvail && (
                              <div style={{ ...S.selectRoomBtn, ...(isSelected ? S.selectRoomBtnActive : {}) }}>
                                {isSelected ? "✓ Selected" : "Select this room"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={S.outlineBtn} onClick={() => { setSelectedRoomType(null); setSelectedRoom(null); }}>← Back</button>
                    <button style={{ ...S.primaryBtn, opacity: selectedRoom ? 1 : 0.4 }} disabled={!selectedRoom} onClick={() => goToStep(3)}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Your Details */}
              {step === 3 && (
                <div style={S.stepContent}>
                  <h2 style={S.stepTitle}>Your Details</h2>
                  <div style={S.formCard}>
                    <div style={S.formGrid}>
                      <div>
                        <label style={S.label}>Full Name</label>
                        <input type="text" placeholder="Juan dela Cruz" value={form.name}
                        onChange={e => !isLoggedIn && setForm({ ...form, name: e.target.value })}
                        style={{ ...S.input, ...(isLoggedIn ? { opacity: 0.7, cursor: "not-allowed" } : {}) }}
                        className="gv-input"
                        readOnly={isLoggedIn} />
                      </div>
                      <div>
                        <label style={S.label}>Email Address <span style={S.optionalBadge}>Optional</span></label>
                      <input type="text" placeholder="juan@email.com" value={form.email}
                        onChange={e => {
                          if (isLoggedIn) return;
                          const val = e.target.value;
                          setForm({ ...form, email: val });
                          if (val && !/^[^\s@]+@[^\s@]+/.test(val)) {
                            setFormErrors(prev => ({ ...prev, email: "Email must contain @" }));
                          } else {
                            setFormErrors(prev => ({ ...prev, email: "" }));
                          }
                        }}
                        style={{ ...S.input, ...(formErrors.email ? { borderColor: "#c97b6e" } : {}), ...(isLoggedIn ? { opacity: 0.7, cursor: "not-allowed" } : {}) }}
                        className="gv-input"
                        readOnly={isLoggedIn} />
                        {formErrors.email && <p className="gv-error">⚠ {formErrors.email}</p>}
                      </div>
                      <div>
                        <label style={S.label}>Phone Number</label>
                        <input
                          type="tel"
                          placeholder="09XX-XXX-XXXX"
                          value={form.phone}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9+\-\s]/g, "");
                            setForm({ ...form, phone: val });
                            if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: "" }));
                          }}
                          onKeyDown={e => {
                            const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "+", "-", " "];
                            if (!/[0-9]/.test(e.key) && !allowed.includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          style={{ ...S.input, ...(formErrors.phone ? { borderColor: "#c97b6e" } : {}) }}
                          className="gv-input"
                        />
                        {formErrors.phone && <p className="gv-error">⚠ {formErrors.phone}</p>}
                      </div>
                      <div>
                        <label style={S.label}>Number of Guests</label>
                        <input type="number" placeholder={`1–${selectedRoom?.capacity}`} min="1" max={selectedRoom?.capacity}
                          value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}
                          style={S.input} className="gv-input" />
                        <p style={S.inputHint}>For safety compliance · Room capacity: {selectedRoom?.capacity} person{selectedRoom?.capacity > 1 ? "s" : ""}</p>
                      </div>
                      <div>
                        <label style={S.label}>Check-in Date</label>
                        <input type="date" value={form.check_in}
                          onChange={e => { setForm({ ...form, check_in: e.target.value }); e.target.classList.toggle("has-value", !!e.target.value); }}
                          style={S.input} className={`gv-input${form.check_in ? " has-value" : ""}`} min={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div>
                        <label style={S.label}>Check-out Date</label>
                        <input type="date" value={form.check_out}
                          onChange={e => { setForm({ ...form, check_out: e.target.value }); e.target.classList.toggle("has-value", !!e.target.value); }}
                          style={S.input} className={`gv-input${form.check_out ? " has-value" : ""}`} min={form.check_in || new Date().toISOString().split("T")[0]} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={S.label}>Notes <span style={S.optionalBadge}>Optional</span></label>
                        <textarea placeholder="Any special requests..." value={form.notes}
                          onChange={e => setForm({ ...form, notes: e.target.value })}
                          style={{ ...S.input, height: "80px", resize: "vertical" }} className="gv-input" />
                      </div>
                    </div>
                  </div>
                  {nights > 0 && (
                    <div style={S.priceSummary}>
                      <span>₱{parseFloat(selectedRoom?.price_per_night).toLocaleString()} × {nights} night{nights > 1 ? "s" : ""}</span>
                      <span style={{ color: "#c9a96e", fontSize: "20px" }}>₱{totalPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={S.outlineBtn} onClick={() => goToStep(2)}>← Back</button>
                    <button
                      style={{ ...S.primaryBtn, opacity: (form.name && form.phone && form.guests && form.check_in && form.check_out && nights > 0 && !formErrors.email && !formErrors.phone) ? 1 : 0.4 }}
                      disabled={!(form.name && form.phone && form.guests && form.check_in && form.check_out && nights > 0 && !formErrors.email && !formErrors.phone)}
                      onClick={() => {
                        if (validateForm()) goToStep(4);
                      }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirm */}
              {step === 4 && (
                <div style={S.stepContent}>
                  <h2 style={S.stepTitle}>Confirm Booking</h2>
                  <div style={S.confirmCard}>
                    {[
                      { label: "HOTEL", value: selectedHotel?.name, sub: selectedHotel?.address },
                      { label: "ROOM TYPE", value: selectedRoomType?.charAt(0).toUpperCase() + selectedRoomType?.slice(1) },
                      { label: "ROOM NUMBER", value: `Room ${selectedRoom?.room_number}` },
                      { label: "GUEST", value: form.name, sub: `${form.email ? form.email + " · " : ""}${form.phone}` },
                      { label: "NUMBER OF GUESTS", value: `${form.guests} person${Number(form.guests) > 1 ? "s" : ""}` },
                      { label: "DATES", value: `${form.check_in} → ${form.check_out}`, sub: `${nights} night${nights > 1 ? "s" : ""}` },
                      { label: "TOTAL PRICE", value: `₱${totalPrice.toLocaleString()}`, gold: true },
                      ...(form.notes ? [{ label: "NOTES", sub: form.notes }] : []),
                    ].map((row, i, arr) => (
                      <div key={i}>
                        <div style={S.confirmSection}>
                          <p style={S.confirmLabel}>{row.label}</p>
                          {row.value && <p style={{ ...S.confirmValue, ...(row.gold ? { color: "#c9a96e", fontSize: "28px", fontWeight: 300 } : {}) }}>{row.value}</p>}
                          {row.sub && <p style={S.confirmSub}>{row.sub}</p>}
                        </div>
                        {i < arr.length - 1 && <div style={S.confirmDivider} />}
                      </div>
                    ))}
                  </div>
                  {submitError && (
                    <div style={{ background: "rgba(201,123,110,0.1)", border: "1px solid rgba(201,123,110,0.3)", color: "#c97b6e", fontFamily: "'Jost',sans-serif", fontSize: "13px", padding: "12px 16px" }}>
                      ⚠ {submitError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={S.outlineBtn} onClick={() => goToStep(3)} disabled={submitting}>← Back</button>
                    <button style={{ ...S.primaryBtn, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Confirming..." : "Confirm Booking ✓"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Booking Summary Sidebar (Step 3 only) */}
            {showSidebar && (
              <BookingSummary
                selectedHotel={selectedHotel}
                selectedRoom={selectedRoom}
                form={form}
                nights={nights}
                totalPrice={totalPrice}
              />
            )}
          </div>

          {/* unused animDir state used here to avoid lint warning */}
          <span style={{ display: "none" }}>{animDir}</span>
        </div>
      );
    }

    const S = {
      page: { background: "#0d0d0d", minHeight: "100vh", color: "#e8dcc8", fontFamily: "'Cormorant Garamond', serif" },
      nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", borderBottom: "1px solid #2a2520" },
      backBtn: { background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)", color: "#a09080", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "1px", padding: "8px 16px" },
      logo: { fontSize: "20px", fontWeight: 600, letterSpacing: "6px", color: "#e8dcc8" },
      logoAccent: { color: "#c9a96e" },
      stepper: { display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 60px 0" },
      stepItem: { display: "flex", alignItems: "center", gap: "10px" },
      stepCircle: { width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #2a2520", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#4a3f32" },
      stepActive: { border: "1px solid #c9a96e", color: "#c9a96e", background: "rgba(201,169,110,0.1)" },
      stepDone: { background: "#c9a96e", color: "#0d0d0d", border: "1px solid #c9a96e" },
      stepLabel: { fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2px", color: "#4a3f32", textTransform: "uppercase" },
      stepLine: { width: "60px", height: "1px", background: "#2a2520", margin: "0 10px" },
      content: { maxWidth: "1100px", margin: "0 auto", padding: "40px 60px 80px" },
      stepContent: { display: "flex", flexDirection: "column", gap: "32px" },
      stepTitle: { fontSize: "36px", fontWeight: 300, color: "#e8dcc8", margin: "0 0 4px" },
      stepSubtitle: { fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#6a5f52", margin: 0 },
      hotelGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
      hotelCard: { padding: "28px", border: "1px solid #1e1a16", cursor: "pointer", background: "#111" },
      hotelSelected: { border: "1px solid #c9a96e", background: "rgba(201,169,110,0.05)" },
      hotelIcon: { fontSize: "28px", marginBottom: "12px" },
      hotelName: { fontSize: "18px", fontWeight: 400, color: "#e8dcc8", margin: "0 0 10px" },
      hotelAddr: { fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#6a5f52", margin: "0 0 5px" },
      hotelContact: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#4a3f32", margin: "0 0 3px" },
      typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
      typeCard: { border: "1px solid #1e1a16", background: "#111", cursor: "pointer", overflow: "hidden" },
      typeCoverWrap: { position: "relative", height: "180px", overflow: "hidden" },
      typeCover: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
      typeCoverOverlay: { position: "absolute", inset: 0, background: "rgba(13,13,13,0.28)" },
      typeBadge: { position: "absolute", top: "12px", left: "0px", fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", padding: "5px 12px", fontWeight: 500 },
      typeAvailBubble: { position: "absolute", bottom: "10px", right: "10px", background: "rgba(13,13,13,0.78)", fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#e8dcc8", padding: "4px 10px" },
      typeBody: { padding: "18px 22px" },
      typeMetaRow: { display: "flex", gap: "16px", marginBottom: "10px" },
      typeMeta: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#4a3f32" },
      typeDesc: { fontFamily: "'Jost', sans-serif", fontSize: "12px", color: "#6a5f52", lineHeight: 1.65, margin: "0 0 12px" },
      typeFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
      typePrice: { fontSize: "20px", fontWeight: 300, color: "#c9a96e" },
      perNight: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#6a5f52" },
      typeViewBtn: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#c9a96e", letterSpacing: "1px" },
      roomsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
      roomCard: { border: "1px solid #1e1a16", background: "#111", overflow: "hidden" },
      roomSelected: { border: "1px solid #c9a96e", background: "rgba(201,169,110,0.04)" },
      roomUnavailable: { opacity: 0.52, filter: "grayscale(55%)" },
      unavailOverlay: { position: "absolute", inset: 0, background: "rgba(13,13,13,0.78)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" },
      unavailText: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#c97b6e", letterSpacing: "1px", textTransform: "uppercase" },
      vacantBadge: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(13,13,13,0.8)", color: "#7eb87e", fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", padding: "3px 10px", textTransform: "uppercase" },
      roomCardBody: { padding: "14px 18px" },
      roomCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
      roomNumber: { fontSize: "18px", fontWeight: 400, color: "#e8dcc8" },
      roomCardMeta: { display: "flex", gap: "10px", flexWrap: "wrap", fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#6a5f52", marginBottom: "12px" },
      selectRoomBtn: { fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "#6a5f52", border: "1px solid #2a2520", padding: "8px", textAlign: "center" },
      selectRoomBtnActive: { background: "rgba(201,169,110,0.12)", color: "#c9a96e", border: "1px solid #c9a96e" },
      formCard: { background: "#111", border: "1px solid #2a2520", padding: "32px" },
      formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 24px" },
      label: { display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "2px", color: "#c9a96e", textTransform: "uppercase", marginBottom: "10px", fontWeight: 500 },
      optionalBadge: { fontSize: "9px", letterSpacing: "1px", color: "#8a7a68", border: "1px solid #4a3f32", padding: "2px 7px", textTransform: "uppercase", fontFamily: "'Jost', sans-serif" },
      input: { width: "100%", background: "#151412", border: "1px solid #3a3530", borderLeft: "3px solid #c9a96e", color: "#e8dcc8", padding: "13px 16px", fontFamily: "'Jost', sans-serif", fontSize: "15px", boxSizing: "border-box", outline: "none" },
      inputHint: { fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "#6a5f52", margin: "6px 0 0" },
      priceSummary: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", border: "1px solid #3a3530", borderLeft: "3px solid #c9a96e", background: "#151412", fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#a09080" },
      confirmCard: { border: "1px solid #1e1a16", background: "#111", overflow: "hidden" },
      confirmSection: { padding: "20px 32px" },
      confirmDivider: { height: "1px", background: "#1e1a16" },
      confirmLabel: { fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "#c9a96e", margin: "0 0 6px", textTransform: "uppercase" },
      confirmValue: { fontSize: "20px", fontWeight: 400, color: "#e8dcc8", margin: "0 0 4px" },
      confirmSub: { fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#6a5f52", margin: 0 },
      primaryBtn: { background: "#c9a96e", border: "none", color: "#0d0d0d", padding: "14px 32px", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", fontWeight: 500 },
      outlineBtn: { background: "transparent", border: "1px solid #2a2520", color: "#8a7a68", padding: "14px 32px", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" },
      ghostBtn: { background: "transparent", border: "none", color: "#4a3f32", padding: "14px 20px", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" },
      successWrap: { display: "flex", justifyContent: "center", padding: "60px 20px 80px" },
      successCard: { background: "#111", border: "1px solid #2a2520", width: "100%", maxWidth: "680px", overflow: "hidden" },
      successHeader: { padding: "48px 48px 32px", textAlign: "center", borderBottom: "1px solid #1e1a16" },
      successIconWrap: { width: "56px", height: "56px", borderRadius: "50%", border: "1px solid #c9a96e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
      successIcon: { color: "#c9a96e", fontSize: "24px" },
      successTitle: { fontSize: "36px", fontWeight: 300, color: "#e8dcc8", margin: "0 0 8px" },
      successRef: { fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "2px", color: "#4a3f32", margin: "0 0 16px", textTransform: "uppercase" },
      successDesc: { fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#8a7a68", lineHeight: 1.7, margin: 0 },
      successBody: { display: "flex", borderBottom: "1px solid #1e1a16" },
      qrSection: { width: "200px", flexShrink: 0, padding: "32px 24px", borderRight: "1px solid #1e1a16", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
      qrLabel: { fontFamily: "'Jost', sans-serif", fontSize: "9px", letterSpacing: "2px", color: "#c9a96e", textTransform: "uppercase", margin: 0, textAlign: "center" },
      qrWrap: { border: "1px solid #2a2520", padding: "8px" },
      qrSub: { fontFamily: "'Jost', sans-serif", fontSize: "10px", color: "#4a3f32", textAlign: "center", margin: 0 },
      detailsSection: { flex: 1, padding: "16px 0" },
      detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 28px" },
      detailLabel: { fontFamily: "'Jost', sans-serif", fontSize: "10px", letterSpacing: "2px", color: "#4a3f32", textTransform: "uppercase" },
      detailValue: { fontFamily: "'Jost', sans-serif", fontSize: "13px", color: "#e8dcc8" },
      detailDivider: { height: "1px", background: "#1a1612", margin: "0 28px" },
      successActions: { display: "flex", gap: "12px", padding: "28px 48px", justifyContent: "center", flexWrap: "wrap" },
    };