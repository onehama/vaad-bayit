import { useState, useRef, useEffect } from "react";

const ENTRANCES = [
  { id: "A", label: "כניסה א׳", color: "#2d4a7a" },
  { id: "B", label: "כניסה ב׳", color: "#6b4c8a" },
  { id: "C", label: "כניסה ג׳", color: "#4a7a5c" },
];

const RESIDENTS = [
  { id: 1, name: "משפחת כהן", apt: 1, floor: 1, entrance: "A", phone: "050-1234567" },
  { id: 2, name: "משפחת לוי", apt: 2, floor: 1, entrance: "A", phone: "052-9876543" },
  { id: 3, name: "משפחת מזרחי", apt: 3, floor: 2, entrance: "A", phone: "054-5551234" },
  { id: 4, name: "משפחת אברהם", apt: 4, floor: 2, entrance: "A", phone: "053-7778899" },
  { id: 5, name: "משפחת פרידמן", apt: 5, floor: 3, entrance: "A", phone: "050-3334455" },
  { id: 6, name: "משפחת ביטון", apt: 6, floor: 3, entrance: "A", phone: "058-6667788" },
  { id: 7, name: "משפחת גולדשטיין", apt: 1, floor: 1, entrance: "B", phone: "052-1112233" },
  { id: 8, name: "משפחת חדד", apt: 2, floor: 1, entrance: "B", phone: "054-4445566" },
  { id: 9, name: "משפחת עמר", apt: 3, floor: 2, entrance: "B", phone: "050-7779988" },
  { id: 10, name: "משפחת רוזנברג", apt: 4, floor: 2, entrance: "B", phone: "053-2223344" },
  { id: 11, name: "משפחת דהן", apt: 5, floor: 3, entrance: "B", phone: "058-8889900" },
  { id: 12, name: "משפחת שפירא", apt: 6, floor: 3, entrance: "B", phone: "052-5556677" },
  { id: 13, name: "משפחת אוחיון", apt: 1, floor: 1, entrance: "C", phone: "054-3331122" },
  { id: 14, name: "משפחת ברקוביץ׳", apt: 2, floor: 1, entrance: "C", phone: "050-6664433" },
  { id: 15, name: "משפחת נחמיאס", apt: 3, floor: 2, entrance: "C", phone: "053-9998877" },
  { id: 16, name: "משפחת טורג׳מן", apt: 4, floor: 2, entrance: "C", phone: "058-1114455" },
  { id: 17, name: "משפחת הלפרין", apt: 5, floor: 3, entrance: "C", phone: "052-7773322" },
  { id: 18, name: "משפחת סויסה", apt: 6, floor: 3, entrance: "C", phone: "054-8886611" },
];

const makeSigs = (val = null) => {
  const s = {};
  RESIDENTS.forEach((r) => (s[r.id] = val));
  return s;
};

const INITIAL_DECISIONS = [
  {
    id: 1, title: "שיפוץ חדרי המדרגות",
    description: "שיפוץ כללי של שלושת חדרי המדרגות כולל צביעה, החלפת תאורה והתקנת מעקות חדשים. עלות משוערת: ₪85,000",
    date: "2026-04-10", scope: "all", status: "active", signatures: makeSigs(),
  },
  {
    id: 2, title: "התקנת מצלמות אבטחה",
    description: "התקנת 8 מצלמות אבטחה: 2 בכל כניסה + 2 בחניון. עלות משוערת: ₪22,000",
    date: "2026-04-01", scope: "all", status: "active",
    signatures: (() => {
      const s = makeSigs();
      [1,2,3,7,8,13,14,15].forEach(id => { s[id] = { data: "signed", time: "2026-04-0" + (id < 7 ? "2" : id < 13 ? "3" : "4") + "T10:00" }; });
      return s;
    })(),
  },
];

const btnSm = { padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--f)", fontSize: 12 };
const card = { background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 2px 16px rgba(26,39,68,0.06)" };

function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); const rect = c.getBoundingClientRect();
    c.width = rect.width * 2; c.height = rect.height * 2;
    ctx.scale(2, 2); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1a2744"; ctx.lineWidth = 2.5;
  }, []);
  const getPos = (e) => { const r = canvasRef.current.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; return { x: cx - r.left, y: cy - r.top }; };
  const startDraw = (e) => { e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); setIsDrawing(true); };
  const draw = (e) => { e.preventDefault(); if (!isDrawing) return; const ctx = canvasRef.current.getContext("2d"); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasContent(true); };
  const endDraw = (e) => { e.preventDefault(); setIsDrawing(false); };
  const clear = () => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setHasContent(false); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ border: "2px dashed #c4a882", borderRadius: 12, overflow: "hidden", background: "#fffdf8", position: "relative" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: 140, cursor: "crosshair", touchAction: "none", display: "block" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {!hasContent && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#c4a882", fontSize: 14, pointerEvents: "none", fontFamily: "var(--f)" }}>✍️ חתום/י כאן</div>}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={clear} style={{ ...btnSm, background: "#fff", color: "#666", border: "1px solid #ddd" }}>נקה</button>
        <button onClick={onCancel} style={{ ...btnSm, background: "#fff", color: "#666", border: "1px solid #ddd" }}>ביטול</button>
        <button onClick={() => hasContent && onSave(canvasRef.current.toDataURL())} disabled={!hasContent}
          style={{ ...btnSm, background: hasContent ? "linear-gradient(135deg,#1a2744,#2d4a7a)" : "#ccc", color: "#fff", border: "none", fontWeight: 600, padding: "8px 20px" }}>
          אשר חתימה ✓
        </button>
      </div>
    </div>
  );
}

function ProgressRing({ signed, total, size = 80, stroke = 7 }) {
  const pct = total > 0 ? (signed / total) * 100 : 0;
  const r = (size - stroke) / 2, cx = size / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e8e0d4" strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={pct === 100 ? "#4caf50" : "#c4a882"} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: "var(--f)" }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 700, color: "#1a2744" }}>{signed}/{total}</div>
      </div>
    </div>
  );
}

function EntranceBadge({ ent, small }) {
  const e = ENTRANCES.find((x) => x.id === ent);
  return <span style={{ display: "inline-block", padding: small ? "1px 6px" : "2px 8px", borderRadius: 6, background: e.color + "18", color: e.color, fontSize: small ? 10 : 11, fontWeight: 600, fontFamily: "var(--f)" }}>{e.label}</span>;
}

export default function VaadBayit() {
  const [page, setPage] = useState("dashboard");
  const [decisions, setDecisions] = useState(INITIAL_DECISIONS);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [signingResident, setSigningResident] = useState(null);
  const [newDecision, setNewDecision] = useState({ title: "", description: "", scope: "all" });
  const [toast, setToast] = useState(null);
  const [filterEntrance, setFilterEntrance] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSign = (decisionId, residentId, sigData) => {
    setDecisions((prev) => prev.map((d) =>
      d.id === decisionId ? { ...d, signatures: { ...d.signatures, [residentId]: { data: sigData, time: new Date().toISOString() } } } : d
    ));
    setSigningResident(null);
    showToast("החתימה נקלטה בהצלחה! ✓");
  };

  const createDecision = () => {
    if (!newDecision.title.trim()) return;
    const sigs = {};
    const relevant = newDecision.scope === "all" ? RESIDENTS : RESIDENTS.filter((r) => r.entrance === newDecision.scope);
    relevant.forEach((r) => (sigs[r.id] = null));
    setDecisions((prev) => [{ id: Date.now(), title: newDecision.title, description: newDecision.description, date: new Date().toISOString().split("T")[0], scope: newDecision.scope, status: "active", signatures: sigs }, ...prev]);
    setNewDecision({ title: "", description: "", scope: "all" });
    setPage("decisions");
    showToast("ההחלטה נוצרה בהצלחה!");
  };

  const getSigned = (d) => Object.values(d.signatures).filter(Boolean).length;
  const getTotal = (d) => Object.keys(d.signatures).length;

  const totalActive = decisions.filter((d) => d.status === "active").length;
  const totalSigned = decisions.reduce((a, d) => a + getSigned(d), 0);
  const totalNeeded = decisions.reduce((a, d) => a + getTotal(d), 0);

  const navItems = [
    { id: "dashboard", icon: "📊", label: "דשבורד" },
    { id: "decisions", icon: "📋", label: "החלטות" },
    { id: "new", icon: "➕", label: "חדש" },
    { id: "residents", icon: "👥", label: "דיירים" },
  ];

  return (
    <div dir="rtl" style={{ "--f": "'Noto Sans Hebrew', sans-serif", minHeight: "100vh", background: "linear-gradient(160deg,#f5f0e8 0%,#ede6da 40%,#e8dfd0 100%)", fontFamily: "var(--f)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "#1a2744", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontFamily: "var(--f)", boxShadow: "0 8px 32px rgba(26,39,68,0.3)", animation: "slideDown 0.3s ease" }}>{toast}</div>}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a2744 0%,#2d4a7a 100%)", padding: "24px 20px 16px", borderRadius: "0 0 28px 28px", boxShadow: "0 8px 32px rgba(26,39,68,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#fff" }}>ועד הבית</h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#c4a882", fontWeight: 500 }}>רחוב הדוגמה 12 · 3 כניסות · 18 דירות</p>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {ENTRANCES.map((e) => (
              <div key={e.id} style={{ width: 32, height: 32, borderRadius: 10, background: e.color + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>{e.id}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 16, background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 4 }}>
          {navItems.map((n) => (
            <button key={n.id} onClick={() => { setPage(n.id); setSelectedDecision(null); setFilterEntrance(null); }}
              style={{ flex: 1, padding: "9px 2px", borderRadius: 11, border: "none", background: page === n.id ? "rgba(196,168,130,0.3)" : "transparent", color: page === n.id ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "var(--f)", fontSize: 11, fontWeight: 600, transition: "all 0.2s" }}>
              <div style={{ fontSize: 15 }}>{n.icon}</div>{n.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px 100px" }}>

        {/* ===== DASHBOARD ===== */}
        {page === "dashboard" && !selectedDecision && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "דיירים", value: RESIDENTS.length, sub: "3 כניסות", icon: "👥" }, { label: "החלטות פעילות", value: totalActive, sub: `${totalSigned}/${totalNeeded} חתימות`, icon: "📋" }].map((s, i) => (
                <div key={i} style={{ ...card, padding: "16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2744" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "#bbb" }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>סטטוס לפי כניסה</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {ENTRANCES.map((ent) => {
                  const er = RESIDENTS.filter((r) => r.entrance === ent.id);
                  const es = decisions.reduce((a, d) => a + er.filter((r) => d.signatures[r.id]).length, 0);
                  const et = decisions.reduce((a, d) => a + er.filter((r) => r.id in d.signatures).length, 0);
                  return (
                    <div key={ent.id} style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 14, background: ent.color + "0a" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ent.color, marginBottom: 8 }}>{ent.label}</div>
                      <ProgressRing signed={es} total={et} size={60} stroke={5} />
                      <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{er.length} דירות</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>החלטות פעילות</h3>
              {decisions.filter((d) => d.status === "active").map((d) => {
                const signed = getSigned(d), total = getTotal(d);
                return (
                  <div key={d.id} onClick={() => { setSelectedDecision(d.id); setPage("decisions"); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid #f0ebe3", cursor: "pointer" }}>
                    <ProgressRing signed={signed} total={total} size={56} stroke={5} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{d.title}</span>
                        {d.scope !== "all" && <EntranceBadge ent={d.scope} small />}
                      </div>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{d.date} · {signed} מתוך {total} חתמו</div>
                      <div style={{ marginTop: 5, height: 4, borderRadius: 2, background: "#f0ebe3", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: signed === total ? "#4caf50" : "linear-gradient(90deg,#c4a882,#1a2744)", width: `${(signed / total) * 100}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: "#ccc" }}>‹</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== DECISIONS ===== */}
        {page === "decisions" && !selectedDecision && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>כל ההחלטות</h2>
            {decisions.map((d) => {
              const signed = getSigned(d), total = getTotal(d), complete = signed === total;
              return (
                <div key={d.id} onClick={() => setSelectedDecision(d.id)}
                  style={{ ...card, padding: 16, cursor: "pointer", border: complete ? "2px solid #4caf50" : "2px solid transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{d.title}</span>
                        {d.scope === "all" ? <span style={{ fontSize: 10, background: "#f0ebe3", color: "#888", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>כל הבניין</span> : <EntranceBadge ent={d.scope} small />}
                        {complete && <span style={{ fontSize: 10, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>הושלם ✓</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>{d.date}</div>
                    </div>
                    <div style={{ textAlign: "center", marginRight: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2744" }}>{signed}/{total}</div>
                      <div style={{ fontSize: 10, color: "#999" }}>חתימות</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== DECISION DETAIL ===== */}
        {selectedDecision && (() => {
          const d = decisions.find((x) => x.id === selectedDecision);
          if (!d) return null;
          const signed = getSigned(d), total = getTotal(d);
          const relevantResidents = RESIDENTS.filter((r) => r.id in d.signatures);
          const grouped = ENTRANCES.filter((e) => relevantResidents.some((r) => r.entrance === e.id))
            .map((e) => ({ ...e, residents: relevantResidents.filter((r) => r.entrance === e.id) }));
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button onClick={() => setSelectedDecision(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#c4a882", fontSize: 14, cursor: "pointer", fontFamily: "var(--f)", fontWeight: 600, padding: 0 }}>→ חזרה לרשימה</button>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a2744", flex: 1 }}>{d.title}</h2>
                  {d.scope === "all" ? <span style={{ fontSize: 11, background: "#f0ebe3", color: "#888", padding: "3px 10px", borderRadius: 8, fontWeight: 600 }}>כל הבניין</span> : <EntranceBadge ent={d.scope} />}
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#666", lineHeight: 1.7 }}>{d.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid #f0ebe3" }}>
                  <ProgressRing signed={signed} total={total} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2744" }}>{signed === total ? "כל הדיירים חתמו! 🎉" : `ממתין ל-${total - signed} חתימות`}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{d.date}</div>
                  </div>
                </div>
              </div>

              {grouped.map((g) => {
                const gs = g.residents.filter((r) => d.signatures[r.id]).length;
                return (
                  <div key={g.id} style={card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: g.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: g.color }}>{g.id}</div>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{g.label}</h3>
                      </div>
                      <span style={{ fontSize: 12, color: gs === g.residents.length ? "#4caf50" : "#999", fontWeight: 600 }}>{gs}/{g.residents.length}</span>
                    </div>
                    {g.residents.map((r) => {
                      const sig = d.signatures[r.id], isSigning = signingResident === r.id;
                      return (
                        <div key={r.id} style={{ padding: "10px 0", borderBottom: "1px solid #f5f0e8" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: sig ? "#e8f5e9" : "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{sig ? "✅" : "⏳"}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{r.name}</div>
                                <div style={{ fontSize: 10, color: "#999" }}>דירה {r.apt} · קומה {r.floor}</div>
                              </div>
                            </div>
                            {sig ? <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 600, background: "#e8f5e9", padding: "3px 10px", borderRadius: 8 }}>חתם/ה ✓</span>
                              : <button onClick={() => setSigningResident(isSigning ? null : r.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: isSigning ? "#f44336" : "linear-gradient(135deg,#1a2744,#2d4a7a)", color: "#fff", cursor: "pointer", fontFamily: "var(--f)", fontSize: 11, fontWeight: 600 }}>{isSigning ? "ביטול" : "חתום"}</button>}
                          </div>
                          {isSigning && <div style={{ marginTop: 10, padding: 10, background: "#faf8f4", borderRadius: 12 }}><SignaturePad onSave={(data) => handleSign(d.id, r.id, data)} onCancel={() => setSigningResident(null)} /></div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ===== NEW DECISION ===== */}
        {page === "new" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>החלטה חדשה</h2>
            <div style={card}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", display: "block", marginBottom: 6 }}>כותרת</label>
                <input value={newDecision.title} onChange={(e) => setNewDecision((p) => ({ ...p, title: e.target.value }))} placeholder="לדוגמה: שיפוץ הלובי"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "2px solid #e8e0d4", fontSize: 14, fontFamily: "var(--f)", outline: "none", boxSizing: "border-box", direction: "rtl", background: "#faf8f4" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", display: "block", marginBottom: 6 }}>תיאור</label>
                <textarea value={newDecision.description} onChange={(e) => setNewDecision((p) => ({ ...p, description: e.target.value }))} placeholder="פרט/י את ההחלטה, עלויות, לוח זמנים..." rows={4}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "2px solid #e8e0d4", fontSize: 14, fontFamily: "var(--f)", outline: "none", resize: "vertical", boxSizing: "border-box", direction: "rtl", background: "#faf8f4", lineHeight: 1.7 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", display: "block", marginBottom: 8 }}>היקף ההחלטה</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setNewDecision((p) => ({ ...p, scope: "all" }))}
                    style={{ padding: "7px 16px", borderRadius: 20, border: newDecision.scope === "all" ? "2px solid #1a2744" : "2px solid transparent", background: newDecision.scope === "all" ? "#1a274418" : "#f5f0e8", color: newDecision.scope === "all" ? "#1a2744" : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>
                    🏢 כל הבניין (18)
                  </button>
                  {ENTRANCES.map((e) => (
                    <button key={e.id} onClick={() => setNewDecision((p) => ({ ...p, scope: e.id }))}
                      style={{ padding: "7px 16px", borderRadius: 20, border: newDecision.scope === e.id ? `2px solid ${e.color}` : "2px solid transparent", background: newDecision.scope === e.id ? e.color + "18" : "#f5f0e8", color: newDecision.scope === e.id ? e.color : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>
                      {e.label} (6)
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: "#f5f0e8", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                💡 ההחלטה תישלח ל-{newDecision.scope === "all" ? 18 : 6} דיירים{newDecision.scope !== "all" ? ` ב${ENTRANCES.find((e) => e.id === newDecision.scope)?.label}` : ""}.
              </div>
              <button onClick={createDecision} disabled={!newDecision.title.trim()}
                style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: newDecision.title.trim() ? "linear-gradient(135deg,#1a2744,#2d4a7a)" : "#ddd", color: "#fff", fontSize: 15, fontWeight: 700, cursor: newDecision.title.trim() ? "pointer" : "default", fontFamily: "var(--f)" }}>
                צור החלטה ושלח לחתימה 📩
              </button>
            </div>
          </div>
        )}

        {/* ===== RESIDENTS ===== */}
        {page === "residents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>דיירי הבניין</h2>
              <span style={{ fontSize: 12, color: "#999" }}>18 דירות</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setFilterEntrance(null)}
                style={{ padding: "6px 14px", borderRadius: 20, border: !filterEntrance ? "2px solid #1a2744" : "2px solid transparent", background: !filterEntrance ? "#1a274418" : "#f5f0e8", color: !filterEntrance ? "#1a2744" : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>הכל</button>
              {ENTRANCES.map((e) => (
                <button key={e.id} onClick={() => setFilterEntrance(filterEntrance === e.id ? null : e.id)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: filterEntrance === e.id ? `2px solid ${e.color}` : "2px solid transparent", background: filterEntrance === e.id ? e.color + "18" : "#f5f0e8", color: filterEntrance === e.id ? e.color : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>{e.label}</button>
              ))}
            </div>
            {ENTRANCES.filter((e) => !filterEntrance || filterEntrance === e.id).map((ent) => (
              <div key={ent.id} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: ent.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ent.color }}>{ent.id}</div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{ent.label}</h3>
                  <span style={{ fontSize: 11, color: "#999" }}>(6 דירות)</span>
                </div>
                {RESIDENTS.filter((r) => r.entrance === ent.id).map((r, i, arr) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: i < arr.length - 1 ? "1px solid #f5f0e8" : "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: ent.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: ent.color }}>{r.name.charAt(r.name.indexOf(" ") + 1)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>דירה {r.apt} · קומה {r.floor} · {r.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
