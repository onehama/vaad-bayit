import { useState, useRef, useEffect, useCallback } from "react";

/* ===== SUPABASE CONFIG ===== */
const SUPA_URL = "https://kzgskogjfejscqzfbezp.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Z3Nrb2dqZmVqc2NxemZiZXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDY4ODAsImV4cCI6MjA5MjA4Mjg4MH0._M8gswwdueaMSx9pyZzlruKlqqCHieQeLePC0xHCTko";
const supaHeaders = { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

const supa = {
  async get(table, query = "") {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, { headers: supaHeaders });
    return r.ok ? r.json() : [];
  },
  async upsert(table, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST", headers: { ...supaHeaders, "Prefer": "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(data),
    });
    return r.ok ? r.json() : null;
  },
  async update(table, match, data) {
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&");
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, {
      method: "PATCH", headers: supaHeaders, body: JSON.stringify(data),
    });
    return r.ok;
  },
};

const ENTRANCES = [
  { id: "A", label: "כניסה א׳", color: "#2d4a7a" },
  { id: "B", label: "כניסה ב׳", color: "#6b4c8a" },
  { id: "C", label: "כניסה ג׳", color: "#4a7a5c" },
];

let RESIDENTS = [
  { id: 1, name: "ישראל רנט", apt: 1, floor: 1, entrance: "A", phone: "050-1234567", isCommittee: true, role: "יו״ר ועד" },
  { id: 2, name: "משפחת לוי", apt: 2, floor: 1, entrance: "A", phone: "052-9876543", isCommittee: true, role: "גזבר" },
  { id: 3, name: "משפחת מזרחי", apt: 3, floor: 2, entrance: "A", phone: "054-5551234" },
  { id: 4, name: "משפחת אברהם", apt: 4, floor: 2, entrance: "A", phone: "053-7778899" },
  { id: 5, name: "משפחת פרידמן", apt: 5, floor: 3, entrance: "A", phone: "050-3334455", isCommittee: true, role: "חבר ועד" },
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

/* ===== PAYMENT PERIODS (bi-monthly, 300 NIS) ===== */
const PAYMENT_AMOUNT = 610; // לחודשיים (305 ₪ לחודש)
const PAYMENT_PERIODS = [
  { id: "2026-1", label: "ינואר–פברואר", months: [1, 2], year: 2026 },
  { id: "2026-2", label: "מרץ–אפריל", months: [3, 4], year: 2026 },
  { id: "2026-3", label: "מאי–יוני", months: [5, 6], year: 2026 },
  { id: "2026-4", label: "יולי–אוגוסט", months: [7, 8], year: 2026 },
  { id: "2026-5", label: "ספטמבר–אוקטובר", months: [9, 10], year: 2026 },
  { id: "2026-6", label: "נובמבר–דצמבר", months: [11, 12], year: 2026 },
];

const getCurrentPeriodId = () => {
  const m = new Date().getMonth() + 1;
  const p = PAYMENT_PERIODS.find((p) => p.months[0] <= m && m <= p.months[1]);
  return p ? p.id : PAYMENT_PERIODS[0].id;
};

const isPastPeriod = (periodId) => {
  const p = PAYMENT_PERIODS.find((x) => x.id === periodId);
  if (!p) return false;
  const now = new Date();
  return p.months[1] < (now.getMonth() + 1) || p.year < now.getFullYear();
};

const isFuturePeriod = (periodId) => {
  const p = PAYMENT_PERIODS.find((x) => x.id === periodId);
  if (!p) return false;
  const now = new Date();
  return p.months[0] > (now.getMonth() + 1);
};

/* ===== DECISIONS ===== */
const makeSigs = () => {
  const s = {};
  RESIDENTS.forEach((r) => (s[r.id] = null));
  return s;
};

const INITIAL_DECISIONS = [
  {
    id: 3, title: "הצטרפות לאגודה לתרבות הדיור",
    description: "שלום רב לדיירי הבניין,\n\nמבדיקה שנערכה נמצא כי הבית המשותף שלנו אינו חבר באגודה לתרבות הדיור. שירותי האגודה ניתנים לחברים בלבד.\n\nעלות ההצטרפות:\n• 29 ₪ ליחידת דיור לשנה — בתשלום בהוראת קבע\n• 31 ₪ ליחידת דיור לשנה — בתשלום העברה בנקאית / ביט / כרטיס אשראי / מזומן או המחאה\n\nסה״כ עלות שנתית לבניין (18 דירות): 522–558 ₪\n\nנא לאשר בחתימה את הסכמתכם להצטרפות הבניין לאגודה.",
    date: "2026-04-15", scope: "all", status: "active", signatures: makeSigs(),
  },
];

/* ===== SHARED STYLES ===== */
const btnSm = { padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--f)", fontSize: 12 };
const card = { background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 2px 16px rgba(26,39,68,0.06)" };

/* ===== CSV EXPORT ===== */
const downloadCSV = (filename, headers, rows) => {
  const BOM = "\uFEFF";
  const csv = BOM + [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const exportResidents = () => {
  const headers = ["מספר", "שם", "כניסה", "דירה", "קומה", "טלפון", "חבר ועד", "תפקיד"];
  const rows = RESIDENTS.map(r => [
    r.id, r.name, r.entrance, r.apt, r.floor, r.phone, r.isCommittee ? "כן" : "", r.role || ""
  ]);
  downloadCSV("דיירים.csv", headers, rows);
};

const exportPayments = (payments, periodId) => {
  const period = PAYMENT_PERIODS.find(p => p.id === periodId);
  const headers = ["שם", "כניסה", "דירה", "סטטוס", "תאריך תשלום", "אמצעי תשלום"];
  const rows = RESIDENTS.map(r => {
    const paid = payments[r.id]?.[periodId];
    return [r.name, r.entrance, r.apt, paid ? "שולם" : "לא שולם", paid?.date || "", paid?.method || ""];
  });
  downloadCSV(`תשלומים_${period?.label || periodId}.csv`, headers, rows);
};

/* ===== EXCEL IMPORT ===== */
let _XLSX = null;
const loadSheetJS = () => {
  if (_XLSX) return Promise.resolve(_XLSX);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => { _XLSX = window.XLSX; resolve(_XLSX); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

const parseExcelFile = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const XLSX = await loadSheetJS();
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheets = {};
        wb.SheetNames.forEach((name) => {
          sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
        });
        resolve(sheets);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } catch (err) { reject(err); }
  });
};

/* ===== IMPORT MODAL ===== */
function ImportModal({ onClose, onImportPayments, currentPeriod, showToast }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importType, setImportType] = useState("payments");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    try {
      const sheets = await parseExcelFile(f);
      const firstSheet = Object.values(sheets)[0];
      if (!firstSheet || firstSheet.length < 2) { setError("הקובץ ריק או לא בפורמט תקין"); return; }
      setPreview({ headers: firstSheet[0], rows: firstSheet.slice(1), sheetNames: Object.keys(sheets), allSheets: sheets });
    } catch { setError("שגיאה בקריאת הקובץ. וודא שזה קובץ Excel (.xlsx) או CSV (.csv) תקין."); }
  };

  const handleImport = () => {
    if (!preview) return;
    setImporting(true);
    try {
      const rows = preview.rows;
      const headers = preview.headers.map(h => String(h || "").trim());

      if (importType === "payments") {
        // Find name column and status/amount columns
        const nameCol = headers.findIndex(h => h.includes("שם"));
        const statusCol = headers.findIndex(h => h.includes("סטטוס") || h.includes("שולם"));
        const methodCol = headers.findIndex(h => h.includes("אמצעי") || h.includes("תשלום"));
        const dateCol = headers.findIndex(h => h.includes("תאריך"));

        if (nameCol === -1) { setError("לא נמצאה עמודת 'שם' בקובץ"); setImporting(false); return; }

        const updates = [];
        rows.forEach((row) => {
          const name = String(row[nameCol] || "").trim();
          if (!name) return;
          const resident = RESIDENTS.find(r => r.name === name || r.name.includes(name) || name.includes(r.name.replace("משפחת ", "")));
          if (!resident) return;

          let paid = false;
          if (statusCol !== -1) {
            const status = String(row[statusCol] || "").trim();
            paid = status === "שולם" || status === "כן" || status === "✓" || status === "V";
          }
          // Check if there's an amount > 0 in any numeric column
          if (!paid) {
            for (let i = 0; i < row.length; i++) {
              const val = Number(row[i]);
              if (val > 0 && val <= 1000 && i !== nameCol) { paid = true; break; }
            }
          }

          if (paid) {
            const method = methodCol !== -1 ? String(row[methodCol] || "").trim() || "יבוא" : "יבוא";
            const date = dateCol !== -1 && row[dateCol] ? String(row[dateCol]).trim() : new Date().toISOString().split("T")[0];
            updates.push({ residentId: resident.id, method, date });
          }
        });

        if (updates.length === 0) { setError("לא נמצאו תשלומים לייבא. וודא שיש עמודת 'שם' וסטטוס תשלום."); setImporting(false); return; }
        onImportPayments(updates, currentPeriod);
        showToast(`יובאו ${updates.length} תשלומים בהצלחה! ✓`);
        onClose();
      }
    } catch (err) { setError("שגיאה ביבוא: " + err.message); }
    setImporting(false);
  };

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
  const modal = { background: "#fff", borderRadius: 24, padding: 24, width: "100%", maxWidth: 440, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" };

  return (
    <div style={overlay} onClick={onClose}>
      <div dir="rtl" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744", fontFamily: "var(--f)" }}>📤 יבוא מ-Excel</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>✕</button>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: "2px dashed #c4a882", borderRadius: 16, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: file ? "#f0ebe308" : "#faf8f4", transition: "all 0.2s", marginBottom: 16 }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: "none" }} />
          {file ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2744", fontFamily: "var(--f)" }}>{file.name}</div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 4, fontFamily: "var(--f)" }}>{(file.size / 1024).toFixed(1)} KB · לחץ להחלפה</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2744", fontFamily: "var(--f)" }}>לחץ לבחירת קובץ</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4, fontFamily: "var(--f)" }}>xlsx, xls, csv</div>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", marginBottom: 8, fontFamily: "var(--f)" }}>
              תצוגה מקדימה ({preview.rows.length} שורות)
            </div>
            <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e8e0d4" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "var(--f)" }}>
                <thead>
                  <tr style={{ background: "#f5f0e8" }}>
                    {preview.headers.map((h, i) => (
                      <th key={i} style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#1a2744", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, ri) => (
                    <tr key={ri} style={{ borderTop: "1px solid #f0ebe3" }}>
                      {preview.headers.map((_, ci) => (
                        <td key={ci} style={{ padding: "5px 8px", textAlign: "center", color: "#666", whiteSpace: "nowrap" }}>{row[ci] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                  {preview.rows.length > 5 && (
                    <tr><td colSpan={preview.headers.length} style={{ padding: 6, textAlign: "center", color: "#999", fontSize: 10 }}>... ועוד {preview.rows.length - 5} שורות</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#c62828", fontFamily: "var(--f)" }}>
            ⚠️ {error}
          </div>
        )}

        {preview && !error && (
          <div style={{ background: "#f5f0e8", borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: "#666", lineHeight: 1.6, fontFamily: "var(--f)" }}>
            💡 המערכת תחפש עמודת <strong>שם</strong> ותתאים אוטומטית לדיירים. תשלומים ייובאו לתקופה הנוכחית.
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "var(--f)", fontSize: 13, fontWeight: 600 }}>ביטול</button>
          <button onClick={handleImport} disabled={!preview || importing}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: preview && !importing ? "linear-gradient(135deg,#1a2744,#2d4a7a)" : "#ddd", color: "#fff", cursor: preview ? "pointer" : "default", fontFamily: "var(--f)", fontSize: 13, fontWeight: 600 }}>
            {importing ? "מייבא..." : "יבא תשלומים ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== SIGNATURE PAD ===== */
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

/* ===== PROGRESS RING ===== */
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

/* ===== LOGIN SCREEN ===== */
function LoginScreen({ onLogin, passwords, onChangePassword, residents }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("login"); // login | changePassword
  const [pendingUser, setPendingUser] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 14,
    border: "2px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)",
    color: "#fff", fontSize: 15, fontFamily: "var(--f)", outline: "none",
    boxSizing: "border-box", direction: "ltr", textAlign: "left",
    transition: "border-color 0.2s",
  };

  const handleSubmit = () => {
    setError("");
    const cleanPhone = phone.replace(/[-\s]/g, "");
    const resident = residents.find((r) => r.phone.replace(/[-\s]/g, "") === cleanPhone);
    if (!resident) { setError("מספר טלפון לא נמצא במערכת"); return; }
    const userPass = passwords[resident.id];
    if (password !== userPass.password) { setError("סיסמה שגויה"); return; }
    if (userPass.mustChange) {
      setPendingUser(resident);
      setStep("changePassword");
    } else {
      const role = resident.isCommittee ? "committee" : "resident";
      onLogin(resident.id, role);
    }
  };

  const handleChangePassword = () => {
    setError("");
    if (newPass.length < 4) { setError("סיסמה חייבת להכיל לפחות 4 תווים"); return; }
    if (newPass === pendingUser.phone.replace(/[-\s]/g, "")) { setError("הסיסמה החדשה לא יכולה להיות מספר הטלפון"); return; }
    if (newPass !== confirmPass) { setError("הסיסמאות לא תואמות"); return; }
    onChangePassword(pendingUser.id, newPass);
    const role = pendingUser.isCommittee ? "committee" : "resident";
    onLogin(pendingUser.id, role);
  };

  return (
    <div dir="rtl" style={{ "--f": "'Noto Sans Hebrew', sans-serif", minHeight: "100vh", background: "linear-gradient(160deg,#1a2744 0%,#2d4a7a 50%,#1a2744 100%)", fontFamily: "var(--f)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#fff" }}>ועד הבית</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#c4a882" }}>רחוב הנוטר 30 32 34 · 3 כניסות · 18 דירות</p>
      </div>

      {/* LOGIN FORM */}
      {step === "login" && (
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "32px 24px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#fff", textAlign: "center" }}>כניסה למערכת</h2>
            <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>הזן/י מספר טלפון וסיסמה</p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#c4a882", display: "block", marginBottom: 6 }}>📱 מספר טלפון</label>
              <input
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                type="tel"
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("passInput")?.focus()}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#c4a882", display: "block", marginBottom: 6 }}>🔒 סיסמה</label>
              <div style={{ position: "relative" }}>
                <input
                  id="passInput"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה"
                  type={showPass ? "text" : "password"}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  style={{ ...inputStyle, paddingLeft: 44 }}
                />
                <button onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14 }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 18px", lineHeight: 1.5 }}>
              כניסה ראשונה? הסיסמה ההתחלתית היא מספר הטלפון שלך (ללא מקף)
            </p>

            {error && (
              <div style={{ background: "rgba(244,67,54,0.15)", border: "1px solid rgba(244,67,54,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#ff8a80", textAlign: "center" }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleSubmit}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#c4a882,#d4bc9a)", color: "#1a2744", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)", boxShadow: "0 4px 20px rgba(196,168,130,0.3)" }}>
              כניסה →
            </button>
          </div>
        </div>
      )}

      {/* FORCE CHANGE PASSWORD */}
      {step === "changePassword" && pendingUser && (
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "32px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#fff" }}>החלפת סיסמה</h2>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                שלום {pendingUser.name}! זו הכניסה הראשונה שלך.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#c4a882" }}>
                יש לבחור סיסמה אישית חדשה.
              </p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#c4a882", display: "block", marginBottom: 6 }}>סיסמה חדשה</label>
              <input
                value={newPass} onChange={(e) => setNewPass(e.target.value)}
                placeholder="לפחות 4 תווים"
                type={showPass ? "text" : "password"}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#c4a882", display: "block", marginBottom: 6 }}>אימות סיסמה</label>
              <div style={{ position: "relative" }}>
                <input
                  value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="הזן שוב את הסיסמה"
                  type={showPass ? "text" : "password"}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  style={{ ...inputStyle, paddingLeft: 44 }}
                />
                <button onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14 }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {newPass && confirmPass && newPass === confirmPass && (
              <div style={{ fontSize: 11, color: "#4caf50", margin: "4px 0 14px", textAlign: "center" }}>✓ הסיסמאות תואמות</div>
            )}
            {newPass && confirmPass && newPass !== confirmPass && (
              <div style={{ fontSize: 11, color: "#ff9800", margin: "4px 0 14px", textAlign: "center" }}>✗ הסיסמאות לא תואמות</div>
            )}

            {error && (
              <div style={{ background: "rgba(244,67,54,0.15)", border: "1px solid rgba(244,67,54,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#ff8a80", textAlign: "center" }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleChangePassword}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#c4a882,#d4bc9a)", color: "#1a2744", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)", boxShadow: "0 4px 20px rgba(196,168,130,0.3)" }}>
              שמור סיסמה והיכנס 🔓
            </button>

            <button onClick={() => { setStep("login"); setPendingUser(null); setNewPass(""); setConfirmPass(""); setError(""); }}
              style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "var(--f)" }}>
              ← חזרה למסך כניסה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================== */
/* ========== MAIN APP ===================== */
/* ========================================== */
export default function VaadBayit() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [decisions, setDecisions] = useState(INITIAL_DECISIONS);
  const [payments, setPayments] = useState(() => { const p = {}; RESIDENTS.forEach(r => { p[r.id] = {}; }); return p; });
  const [passwords, setPasswords] = useState({});
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [signingResident, setSigningResident] = useState(null);
  const [newDecision, setNewDecision] = useState({ title: "", description: "", scope: "all" });
  const [toast, setToast] = useState(null);
  const [filterEntrance, setFilterEntrance] = useState(null);
  const [paymentPeriod, setPaymentPeriod] = useState(getCurrentPeriodId());
  const [showImport, setShowImport] = useState(false);
  const [residents, setResidentsList] = useState(RESIDENTS);
  const [dbReady, setDbReady] = useState(false);

  /* ===== LOAD FROM SUPABASE ON MOUNT ===== */
  useEffect(() => {
    const load = async () => {
      try {
        // Load residents
        const resRows = await supa.get("residents", "select=*&order=id");
        if (resRows.length > 0) {
          const mapped = resRows.map((r) => ({
            id: r.id, name: r.name, apt: r.apt, floor: r.floor,
            entrance: r.entrance, phone: r.phone,
            isCommittee: r.is_committee, role: r.role || "",
          }));
          RESIDENTS = mapped;
          setResidentsList(mapped);
        }
        // Load passwords
        const pwRows = await supa.get("passwords", "select=*");
        if (pwRows.length > 0) {
          const pw = {};
          pwRows.forEach((r) => { pw[r.resident_id] = { password: r.password, mustChange: r.must_change }; });
          setPasswords(pw);
        }
        // Load signatures
        const sigRows = await supa.get("signatures", "select=*");
        if (sigRows.length > 0) {
          setDecisions((prev) => prev.map((d) => {
            const updated = { ...d.signatures };
            sigRows.filter((s) => s.decision_id === d.id).forEach((s) => {
              updated[s.resident_id] = { data: s.signature_data, time: s.signed_at };
            });
            return { ...d, signatures: updated };
          }));
        }
        // Load payments
        const payRows = await supa.get("payments", "select=*");
        if (payRows.length > 0) {
          const pay = {};
          RESIDENTS.forEach((r) => { pay[r.id] = {}; });
          payRows.forEach((r) => {
            if (!pay[r.resident_id]) pay[r.resident_id] = {};
            pay[r.resident_id][r.period_id] = { date: r.paid_date, method: r.method };
          });
          setPayments(pay);
        }
      } catch (e) { console.error("Supabase load error:", e); }
      setDbReady(true);
    };
    load();
  }, []);

  const isCommittee = user?.role === "committee";
  const currentResident = user ? RESIDENTS.find((r) => r.id === user.id) : null;
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const handleLogin = (residentId, role) => { setUser({ id: residentId, role }); setPage("dashboard"); };
  const handleLogout = () => { setUser(null); setPage("dashboard"); setSelectedDecision(null); };

  const handleChangePassword = async (residentId, newPass) => {
    await supa.update("passwords", { resident_id: residentId }, { password: newPass, must_change: false });
    setPasswords((prev) => ({ ...prev, [residentId]: { password: newPass, mustChange: false } }));
  };

  const handleSign = (decisionId, residentId, sigData) => {
    const now = new Date().toISOString();
    setDecisions((prev) => prev.map((d) =>
      d.id === decisionId ? { ...d, signatures: { ...d.signatures, [residentId]: { data: sigData, time: now } } } : d
    ));
    setSigningResident(null);
    showToast("החתימה נקלטה בהצלחה! ✓");
    supa.upsert("signatures", { decision_id: decisionId, resident_id: residentId, signature_data: sigData, signed_at: now });
  };

  const createDecision = () => {
    if (!newDecision.title.trim()) return;
    const sigs = {};
    const relevant = newDecision.scope === "all" ? RESIDENTS : RESIDENTS.filter((r) => r.entrance === newDecision.scope);
    relevant.forEach((r) => (sigs[r.id] = null));
    setDecisions((prev) => [{ id: Date.now(), title: newDecision.title, description: newDecision.description, date: new Date().toISOString().split("T")[0], scope: newDecision.scope, status: "active", signatures: sigs }, ...prev]);

    const siteUrl = window.location.href.split("?")[0];
    const msg = `🏢 *ועד הבית · רחוב הנוטר 30 32 34*\n\n📋 *${newDecision.title}*\n\n${newDecision.description}\n\n✍️ נא להיכנס למערכת ולחתום:\n${siteUrl}`;
    navigator.clipboard?.writeText(msg);

    setNewDecision({ title: "", description: "", scope: "all" });
    setPage("decisions");
    showToast("ההודעה נוצרה והועתקה ל-WhatsApp 📋");
  };

  const markPaid = (residentId, periodId, method) => {
    const date = new Date().toISOString().split("T")[0];
    setPayments((prev) => ({
      ...prev,
      [residentId]: { ...prev[residentId], [periodId]: { date, method } },
    }));
    showToast("תשלום סומן כהתקבל ✓");
    supa.upsert("payments", { resident_id: residentId, period_id: periodId, paid_date: date, method });
  };

  const importPayments = (updates, periodId) => {
    setPayments((prev) => {
      const next = { ...prev };
      updates.forEach(({ residentId, method, date }) => {
        next[residentId] = { ...next[residentId], [periodId]: { date, method } };
        supa.upsert("payments", { resident_id: residentId, period_id: periodId, paid_date: date, method });
      });
      return next;
    });
  };

  const getSigned = (d) => Object.values(d.signatures).filter(Boolean).length;
  const getTotal = (d) => Object.keys(d.signatures).length;

  if (!dbReady) return (
    <div dir="rtl" style={{ "--f": "'Noto Sans Hebrew', sans-serif", minHeight: "100vh", background: "linear-gradient(160deg,#1a2744 0%,#2d4a7a 50%,#1a2744 100%)", fontFamily: "var(--f)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
      <div style={{ color: "#c4a882", fontSize: 16, fontWeight: 600 }}>טוען נתונים...</div>
    </div>
  );
  if (!user) return <LoginScreen onLogin={handleLogin} passwords={passwords} onChangePassword={handleChangePassword} residents={residents} />;

  const totalActive = decisions.filter((d) => d.status === "active").length;
  const visibleDecisions = isCommittee ? decisions : decisions.filter((d) => user.id in d.signatures);
  const curPeriod = PAYMENT_PERIODS.find((p) => p.id === paymentPeriod);
  const paidCount = RESIDENTS.filter((r) => payments[r.id]?.[paymentPeriod]).length;
  const unpaidResidents = RESIDENTS.filter((r) => !payments[r.id]?.[paymentPeriod]);

  const navItems = isCommittee
    ? [
        { id: "dashboard", icon: "📊", label: "דשבורד" },
        { id: "payments", icon: "💰", label: "תשלומים" },
        { id: "decisions", icon: "📋", label: "הודעות" },
        { id: "new", icon: "➕", label: "חדש" },
        { id: "residents", icon: "👥", label: "דיירים" },
      ]
    : [
        { id: "dashboard", icon: "🏠", label: "ראשי" },
        { id: "payments", icon: "💰", label: "תשלומים" },
        { id: "decisions", icon: "📋", label: "הודעות" },
      ];

  return (
    <div dir="rtl" style={{ "--f": "'Noto Sans Hebrew', sans-serif", minHeight: "100vh", background: "linear-gradient(160deg,#f5f0e8 0%,#ede6da 40%,#e8dfd0 100%)", fontFamily: "var(--f)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "#1a2744", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontFamily: "var(--f)", boxShadow: "0 8px 32px rgba(26,39,68,0.3)", animation: "slideDown 0.3s ease" }}>{toast}</div>}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImportPayments={importPayments} currentPeriod={paymentPeriod} showToast={showToast} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a2744 0%,#2d4a7a 100%)", padding: "20px 20px 14px", borderRadius: "0 0 28px 28px", boxShadow: "0 8px 32px rgba(26,39,68,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>ועד הבית</h1>
              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: isCommittee ? "rgba(196,168,130,0.3)" : "rgba(255,255,255,0.15)", color: isCommittee ? "#c4a882" : "rgba(255,255,255,0.7)" }}>
                {isCommittee ? "ועד" : "דייר/ת"}
              </span>
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {currentResident?.name} · {ENTRANCES.find(e => e.id === currentResident?.entrance)?.label} · דירה {currentResident?.apt}
            </p>
          </div>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "var(--f)", fontWeight: 600 }}>יציאה ←</button>
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 14, background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 3 }}>
          {navItems.map((n) => (
            <button key={n.id} onClick={() => { setPage(n.id); setSelectedDecision(null); setFilterEntrance(null); }}
              style={{ flex: 1, padding: "8px 1px", borderRadius: 11, border: "none", background: page === n.id ? "rgba(196,168,130,0.3)" : "transparent", color: page === n.id ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "var(--f)", fontSize: 10, fontWeight: 600, transition: "all 0.2s" }}>
              <div style={{ fontSize: 14 }}>{n.icon}</div>{n.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px 100px" }}>

        {/* ===== DASHBOARD ===== */}
        {page === "dashboard" && !selectedDecision && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!isCommittee && (
              <div style={{ ...card, background: "linear-gradient(135deg,#1a2744,#2d4a7a)", color: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(196,168,130,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👋</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>שלום, {currentResident?.name}</div>
                    <div style={{ fontSize: 12, color: "#c4a882", marginTop: 2 }}>
                      {(() => {
                        const pending = visibleDecisions.filter(d => d.status === "active" && !d.signatures[user.id]).length;
                        const unpaid = PAYMENT_PERIODS.filter(p => !isFuturePeriod(p.id) && !payments[user.id]?.[p.id]).length;
                        const parts = [];
                        if (pending > 0) parts.push(`${pending} הודעות לחתימה`);
                        if (unpaid > 0) parts.push(`${unpaid} תקופות לתשלום`);
                        return parts.length > 0 ? parts.join(" · ") : "הכל מעודכן! 🎉";
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isCommittee && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "דיירים", value: 18, icon: "👥" },
                    { label: "הודעות", value: totalActive, icon: "📋" },
                    { label: "שילמו החודש", value: `${paidCount}/18`, icon: "💰" },
                  ].map((s, i) => (
                    <div key={i} style={{ ...card, padding: "14px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 22 }}>{s.icon}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2744", marginTop: 4 }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "#999" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Payment alert */}
                {unpaidResidents.length > 0 && !isFuturePeriod(paymentPeriod) && (
                  <div onClick={() => setPage("payments")} style={{ ...card, background: "linear-gradient(135deg,#fff3e0,#ffe0b2)", border: "2px solid #ffb74d", cursor: "pointer", padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 28 }}>⚠️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e65100" }}>תזכורת תשלום · {curPeriod?.label}</div>
                        <div style={{ fontSize: 12, color: "#bf360c", marginTop: 2 }}>{unpaidResidents.length} דיירים טרם שילמו ₪{PAYMENT_AMOUNT} לתקופה</div>
                      </div>
                      <div style={{ fontSize: 18, color: "#e65100" }}>‹</div>
                    </div>
                  </div>
                )}

                <div style={card}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>סטטוס לפי כניסה</h3>
                  <div style={{ display: "flex", gap: 10 }}>
                    {ENTRANCES.map((ent) => {
                      const er = RESIDENTS.filter((r) => r.entrance === ent.id);
                      const es = decisions.reduce((a, d) => a + er.filter((r) => d.signatures[r.id]).length, 0);
                      const et = decisions.reduce((a, d) => a + er.filter((r) => r.id in d.signatures).length, 0);
                      return (
                        <div key={ent.id} style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 14, background: ent.color + "0a" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: ent.color, marginBottom: 6 }}>{ent.label}</div>
                          <ProgressRing signed={es} total={et} size={56} stroke={5} />
                          <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{er.length} דירות</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>{isCommittee ? "הודעות פעילות" : "ממתין לחתימתך"}</h3>
              {(() => {
                const list = isCommittee ? visibleDecisions.filter(d => d.status === "active") : visibleDecisions.filter(d => d.status === "active" && !d.signatures[user.id]);
                if (list.length === 0) return <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: 20 }}>אין הודעות ממתינות 🎉</p>;
                return list.map((d) => {
                  const signed = getSigned(d), total = getTotal(d);
                  return (
                    <div key={d.id} onClick={() => { setSelectedDecision(d.id); setPage("decisions"); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0ebe3", cursor: "pointer" }}>
                      {isCommittee ? <ProgressRing signed={signed} total={total} size={50} stroke={5} />
                        : <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✍️</div>}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{d.title}</span>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{d.date}</div>
                      </div>
                      <div style={{ fontSize: 18, color: "#ccc" }}>‹</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ===== PAYMENTS ===== */}
        {page === "payments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>
                {isCommittee ? "מעקב תשלומים" : "התשלומים שלי"}
              </h2>
              {isCommittee && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setShowImport(true)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #4a7a5c", background: "#fff", color: "#4a7a5c", cursor: "pointer", fontFamily: "var(--f)", fontSize: 11, fontWeight: 600 }}>📤 יבוא</button>
                  <button onClick={() => exportPayments(payments, paymentPeriod)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #c4a882", background: "#fff", color: "#8a7050", cursor: "pointer", fontFamily: "var(--f)", fontSize: 11, fontWeight: 600 }}>📥 יצוא</button>
                </div>
              )}
            </div>

            {/* Period selector */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {PAYMENT_PERIODS.map((p) => {
                const isCurrent = p.id === getCurrentPeriodId();
                const sel = p.id === paymentPeriod;
                return (
                  <button key={p.id} onClick={() => setPaymentPeriod(p.id)}
                    style={{ padding: "8px 14px", borderRadius: 12, border: sel ? "2px solid #1a2744" : "2px solid transparent", background: sel ? "#1a274415" : isFuturePeriod(p.id) ? "#f5f0e8" : "#fff", color: sel ? "#1a2744" : isFuturePeriod(p.id) ? "#bbb" : "#666", cursor: "pointer", fontFamily: "var(--f)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, position: "relative" }}>
                    {p.label}
                    {isCurrent && <div style={{ position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: 3, background: "#e65100" }} />}
                  </button>
                );
              })}
            </div>

            {/* Summary card */}
            <div style={{ ...card, background: "linear-gradient(135deg,#1a2744,#2d4a7a)", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#c4a882" }}>{curPeriod?.label} {curPeriod?.year}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>₪{PAYMENT_AMOUNT}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>₪305 לחודש · לכל דירה לתקופה</div>
                </div>
                {isCommittee && (
                  <div style={{ textAlign: "center" }}>
                    <ProgressRing signed={RESIDENTS.filter(r => payments[r.id]?.[paymentPeriod]).length} total={18} size={70} stroke={6} />
                    <div style={{ fontSize: 10, color: "#c4a882", marginTop: 4 }}>שילמו</div>
                  </div>
                )}
              </div>
              {isCommittee && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  {[
                    { label: "שילמו", value: `₪${RESIDENTS.filter(r => payments[r.id]?.[paymentPeriod]).length * PAYMENT_AMOUNT}`, color: "#4caf50" },
                    { label: "חסר", value: `₪${RESIDENTS.filter(r => !payments[r.id]?.[paymentPeriod]).length * PAYMENT_AMOUNT}`, color: "#ff9800" },
                    { label: "סה״כ צפוי", value: `₪${18 * PAYMENT_AMOUNT}`, color: "#fff" },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, background: "rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESIDENT: personal payment history */}
            {!isCommittee && (
              <div style={card}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>היסטוריית תשלומים</h3>
                {PAYMENT_PERIODS.filter(p => !isFuturePeriod(p.id)).map((p) => {
                  const paid = payments[user.id]?.[p.id];
                  const isCurrent = p.id === getCurrentPeriodId();
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid #f5f0e8" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: paid ? "#e8f5e9" : isCurrent ? "#fff3e0" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {paid ? "✅" : isCurrent ? "⏰" : "❌"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{p.label} {p.year}</div>
                        {paid ? (
                          <div style={{ fontSize: 11, color: "#4caf50", marginTop: 2 }}>שולם · {paid.date} · {paid.method}</div>
                        ) : (
                          <div style={{ fontSize: 11, color: isCurrent ? "#e65100" : "#d32f2f", marginTop: 2 }}>
                            {isCurrent ? "⚠️ תזכורת: נא להעביר ₪" + PAYMENT_AMOUNT + " לתקופה" : "לא שולם"}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: paid ? "#4caf50" : "#999" }}>₪{PAYMENT_AMOUNT}</div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#f5f0e8", fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                  💡 תשלום ועד בית: ₪305 לחודש (₪{PAYMENT_AMOUNT} לחודשיים). ניתן לבצע העברה ישירות לחשבון ועד הבית — בנק הפועלים, סניף 568, מס׳ חשבון 164423. נא לעדכן באפליקציה על ההעברה שבוצעה.
                </div>
              </div>
            )}

            {/* COMMITTEE: full breakdown by entrance */}
            {isCommittee && ENTRANCES.map((ent) => {
              const entRes = RESIDENTS.filter(r => r.entrance === ent.id);
              const entPaid = entRes.filter(r => payments[r.id]?.[paymentPeriod]).length;
              return (
                <div key={ent.id} style={card}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: ent.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ent.color }}>{ent.id}</div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{ent.label}</h3>
                    </div>
                    <span style={{ fontSize: 12, color: entPaid === entRes.length ? "#4caf50" : "#e65100", fontWeight: 600 }}>{entPaid}/{entRes.length} שילמו</span>
                  </div>
                  {entRes.map((r) => {
                    const paid = payments[r.id]?.[paymentPeriod];
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f5f0e8" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: paid ? "#e8f5e9" : "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{paid ? "✅" : "⏳"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: "#999" }}>
                            דירה {r.apt}
                            {paid && <span style={{ color: "#4caf50" }}> · {paid.method} · {paid.date}</span>}
                          </div>
                        </div>
                        {paid ? (
                          <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 600, background: "#e8f5e9", padding: "3px 10px", borderRadius: 8 }}>₪{PAYMENT_AMOUNT} ✓</span>
                        ) : (
                          <div style={{ display: "flex", gap: 4 }}>
                            <a href={`https://wa.me/972${r.phone.replace(/[-\s]/g, "").slice(1)}?text=${encodeURIComponent(`שלום ${r.name},\n\nתזכורת תשלום ועד בית — רחוב הנוטר 30 32 34\nתקופה: ${curPeriod?.label} ${curPeriod?.year}\nסכום: ₪${PAYMENT_AMOUNT}\n\nניתן לבצע העברה לחשבון ועד הבית:\nבנק הפועלים, סניף 568, מס׳ חשבון 164423\n\nנא לעדכן באפליקציה לאחר ביצוע ההעברה.\nתודה! 🙏`)}`} target="_blank" rel="noopener"
                              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #25D366", background: "#fff", color: "#128C7E", cursor: "pointer", fontFamily: "var(--f)", fontSize: 10, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center" }}>
                              💬 WhatsApp
                            </a>
                            <select
                              onChange={(e) => { if (e.target.value) markPaid(r.id, paymentPeriod, e.target.value); e.target.value = ""; }}
                              style={{ padding: "5px 6px", borderRadius: 6, border: "1px solid #4caf50", background: "#fff", color: "#2e7d32", cursor: "pointer", fontFamily: "var(--f)", fontSize: 10, fontWeight: 600 }}>
                              <option value="">סמן שולם ▾</option>
                              <option value="מזומן">מזומן</option>
                              <option value="bit">bit</option>
                              <option value="העברה">העברה בנקאית</option>
                              <option value="צ׳ק">צ׳ק</option>
                              <option value="אשראי">כרטיס אשראי</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Committee: send reminders to all unpaid */}
            {isCommittee && unpaidResidents.length > 0 && !isFuturePeriod(paymentPeriod) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => {
                  const names = unpaidResidents.map(r => `• ${r.name} (${ENTRANCES.find(e => e.id === r.entrance)?.label}, דירה ${r.apt})`).join("\n");
                  const msg = `🏢 *ועד הבית · רחוב הנוטר 30 32 34*\n\n💰 *תזכורת תשלום ועד בית*\nתקופה: *${curPeriod?.label} ${curPeriod?.year}*\nסכום: *₪${PAYMENT_AMOUNT}*\n\n⚠️ הדיירים הבאים טרם שילמו:\n${names}\n\nנא להסדיר תשלום בהקדם.\nתודה! 🙏`;
                  navigator.clipboard.writeText(msg).then(() => showToast("תזכורת תשלום הועתקה! 📋"));
                }}
                  style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
                  <span style={{ fontSize: 18 }}>📋</span> העתק תזכורת תשלום ל-WhatsApp
                </button>
              </div>
            )}

            {/* Committee: yearly summary */}
            {isCommittee && (
              <div style={card}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>סיכום שנתי 2026</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 500 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e8e0d4" }}>
                        <th style={{ textAlign: "right", padding: "8px 6px", color: "#1a2744", fontWeight: 700 }}>דייר</th>
                        {PAYMENT_PERIODS.map((p) => (
                          <th key={p.id} style={{ textAlign: "center", padding: "8px 2px", color: "#666", fontWeight: 600, fontSize: 9 }}>{p.label.split("–")[0]}</th>
                        ))}
                        <th style={{ textAlign: "center", padding: "8px 4px", color: "#1a2744", fontWeight: 700 }}>סה״כ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RESIDENTS.map((r) => {
                        const paidPeriods = PAYMENT_PERIODS.filter(p => payments[r.id]?.[p.id]).length;
                        return (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f5f0e8" }}>
                            <td style={{ padding: "7px 6px", fontWeight: 600, color: "#1a2744", whiteSpace: "nowrap" }}>{r.name.replace("משפחת ", "")}</td>
                            {PAYMENT_PERIODS.map((p) => {
                              const paid = payments[r.id]?.[p.id];
                              const future = isFuturePeriod(p.id);
                              return (
                                <td key={p.id} style={{ textAlign: "center", padding: "7px 2px" }}>
                                  {paid ? <span style={{ color: "#4caf50" }}>✓</span> : future ? <span style={{ color: "#ddd" }}>—</span> : <span style={{ color: "#ff9800" }}>✗</span>}
                                </td>
                              );
                            })}
                            <td style={{ textAlign: "center", padding: "7px 4px", fontWeight: 700, color: "#1a2744" }}>₪{paidPeriods * PAYMENT_AMOUNT}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== DECISIONS LIST ===== */}
        {page === "decisions" && !selectedDecision && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>{isCommittee ? "כל ההודעות" : "ההודעות שלי"}</h2>
            {visibleDecisions.map((d) => {
              const signed = getSigned(d), total = getTotal(d), complete = signed === total, mySig = d.signatures[user.id];
              return (
                <div key={d.id} onClick={() => setSelectedDecision(d.id)}
                  style={{ ...card, padding: 16, cursor: "pointer", border: (isCommittee && complete) ? "2px solid #4caf50" : (!isCommittee && mySig) ? "2px solid #4caf50" : "2px solid transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{d.title}</span>
                        {d.scope === "all" ? <span style={{ fontSize: 10, background: "#f0ebe3", color: "#888", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>כל הבניין</span> : <EntranceBadge ent={d.scope} small />}
                        {!isCommittee && mySig && <span style={{ fontSize: 10, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>חתום ✓</span>}
                        {isCommittee && complete && <span style={{ fontSize: 10, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>הושלם ✓</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>{d.date}</div>
                    </div>
                    {isCommittee && <div style={{ textAlign: "center", marginRight: 8 }}><div style={{ fontSize: 18, fontWeight: 700, color: "#1a2744" }}>{signed}/{total}</div><div style={{ fontSize: 10, color: "#999" }}>חתימות</div></div>}
                    {!isCommittee && !mySig && <div style={{ padding: "6px 12px", borderRadius: 8, background: "#fff3e0", fontSize: 11, fontWeight: 600, color: "#e65100" }}>ממתין</div>}
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
          const mySig = d.signatures[user.id];
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button onClick={() => setSelectedDecision(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#c4a882", fontSize: 14, cursor: "pointer", fontFamily: "var(--f)", fontWeight: 600, padding: 0 }}>→ חזרה</button>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a2744", flex: 1 }}>{d.title}</h2>
                  {d.scope === "all" ? <span style={{ fontSize: 11, background: "#f0ebe3", color: "#888", padding: "3px 10px", borderRadius: 8, fontWeight: 600 }}>כל הבניין</span> : <EntranceBadge ent={d.scope} />}
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#666", lineHeight: 1.7, whiteSpace: "pre-line" }}>{d.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid #f0ebe3" }}>
                  <ProgressRing signed={signed} total={total} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2744" }}>{signed === total ? "כל הדיירים חתמו! 🎉" : `${signed} מתוך ${total} חתמו`}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{d.date}</div>
                  </div>
                </div>
              </div>

              {/* WhatsApp share - committee only */}
              {isCommittee && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => {
                    const siteUrl = window.location.href.split("?")[0];
                    const msg = `🏢 *ועד הבית · רחוב הנוטר 30 32 34*\n\n📋 *${d.title}*\n\n${d.description}\n\n✍️ נא להיכנס למערכת ולחתום:\n${siteUrl}\n\n📊 סטטוס: ${signed} מתוך ${total} חתמו`;
                    navigator.clipboard.writeText(msg).then(() => showToast("ההודעה הועתקה! הדבק/י בקבוצת WhatsApp 📋"));
                  }}
                    style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
                    <span style={{ fontSize: 18 }}>📋</span> WhatsApp
                  </button>
                  <button onClick={() => {
                    const rows = grouped.flatMap(g => g.residents.map(r => {
                      const sig = d.signatures[r.id];
                      return `<tr>
                        <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;font-weight:600">${r.name}</td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:center">${ENTRANCES.find(e=>e.id===g.id)?.label}</td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:center">דירה ${r.apt}</td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:center;color:${sig ? '#2e7d32' : '#c62828'}">${sig ? '✓ חתם/ה' : '✗ טרם חתם/ה'}</td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:center;color:#666">${sig ? new Date(sig.time).toLocaleDateString('he-IL') : '—'}</td>
                      </tr>`;
                    })).join('');
                    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>${d.title}</title>
                      <style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700&display=swap');
                      body{font-family:'Noto Sans Hebrew',sans-serif;max-width:800px;margin:0 auto;padding:40px 30px;color:#1a2744}
                      @media print{body{padding:20px}button{display:none!important}}</style></head><body>
                      <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1a2744">
                        <h1 style="margin:0;font-size:24px">🏢 ועד הבית · רחוב הנוטר 30 32 34</h1>
                        <p style="color:#666;margin:8px 0 0">מסמך הודעה וחתימות</p>
                      </div>
                      <div style="background:#f8f6f2;border-radius:12px;padding:24px;margin-bottom:24px">
                        <h2 style="margin:0 0 8px;font-size:20px">${d.title}</h2>
                        <p style="color:#666;font-size:13px;margin:0 0 16px">תאריך: ${d.date}</p>
                        <p style="white-space:pre-line;line-height:1.8;font-size:14px;margin:0">${d.description}</p>
                      </div>
                      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
                        <h3 style="margin:0;font-size:16px">סטטוס חתימות</h3>
                        <span style="background:${signed===total?'#e8f5e9':'#fff3e0'};color:${signed===total?'#2e7d32':'#e65100'};padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700">${signed} מתוך ${total} חתמו</span>
                      </div>
                      <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead><tr style="background:#1a2744;color:#fff">
                          <th style="padding:10px 14px;text-align:right">שם</th>
                          <th style="padding:10px 14px;text-align:center">כניסה</th>
                          <th style="padding:10px 14px;text-align:center">דירה</th>
                          <th style="padding:10px 14px;text-align:center">סטטוס</th>
                          <th style="padding:10px 14px;text-align:center">תאריך חתימה</th>
                        </tr></thead>
                        <tbody>${rows}</tbody>
                      </table>
                      <div style="margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;color:#999;font-size:11px">
                        מסמך זה הופק מתוך מערכת ועד הבית · ${new Date().toLocaleDateString('he-IL')}
                      </div>
                      <div style="text-align:center;margin-top:16px">
                        <button onclick="window.print()" style="padding:12px 32px;border-radius:10px;border:none;background:#1a2744;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">🖨️ הדפס / שמור כ-PDF</button>
                      </div>
                    </body></html>`;
                    const w = window.open('', '_blank');
                    w.document.write(html);
                    w.document.close();
                  }}
                    style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#1a2744,#2d4a7a)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(26,39,68,0.3)" }}>
                    <span style={{ fontSize: 18 }}>📄</span> ייצוא מסמך
                  </button>
                </div>
              )}

              {!isCommittee && user.id in d.signatures && (
                <div style={{ ...card, border: mySig ? "2px solid #4caf50" : "2px solid #e65100" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>{mySig ? "החתימה שלי ✅" : "החתימה שלך נדרשת"}</h3>
                  {mySig ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✅</div>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: "#2e7d32" }}>חתמת על הודעה זו</div><div style={{ fontSize: 11, color: "#999" }}>{new Date(mySig.time).toLocaleString("he-IL")}</div></div>
                    </div>
                  ) : signingResident !== user.id ? (
                    <button onClick={() => setSigningResident(user.id)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1a2744,#2d4a7a)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)" }}>חתום עכשיו ✍️</button>
                  ) : (
                    <div style={{ padding: 10, background: "#faf8f4", borderRadius: 12 }}><SignaturePad onSave={(data) => handleSign(d.id, user.id, data)} onCancel={() => setSigningResident(null)} /></div>
                  )}
                </div>
              )}

              {!isCommittee && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1a2744" }}>סטטוס חתימות</h3>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {ENTRANCES.filter(e => relevantResidents.some(r => r.entrance === e.id)).map((ent) => {
                      const er = relevantResidents.filter(r => r.entrance === ent.id);
                      const es = er.filter(r => d.signatures[r.id]).length;
                      return (
                        <div key={ent.id} style={{ flex: "1 1 80px", textAlign: "center", padding: 10, borderRadius: 12, background: ent.color + "08" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: ent.color, marginBottom: 4 }}>{ent.label}</div>
                          <ProgressRing signed={es} total={er.length} size={48} stroke={4} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isCommittee && grouped.map((g) => {
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
                              <div><div style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{r.name}</div><div style={{ fontSize: 10, color: "#999" }}>דירה {r.apt} · קומה {r.floor}</div></div>
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

        {/* ===== NEW DECISION (committee) ===== */}
        {page === "new" && isCommittee && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>הודעה חדשה</h2>
            <div style={card}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", display: "block", marginBottom: 6 }}>כותרת</label>
                <input value={newDecision.title} onChange={(e) => setNewDecision((p) => ({ ...p, title: e.target.value }))} placeholder="לדוגמה: שיפוץ הלובי"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "2px solid #e8e0d4", fontSize: 14, fontFamily: "var(--f)", outline: "none", boxSizing: "border-box", direction: "rtl", background: "#faf8f4" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", display: "block", marginBottom: 6 }}>תיאור</label>
                <textarea value={newDecision.description} onChange={(e) => setNewDecision((p) => ({ ...p, description: e.target.value }))} placeholder="פרט/י את ההודעה..." rows={4}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "2px solid #e8e0d4", fontSize: 14, fontFamily: "var(--f)", outline: "none", resize: "vertical", boxSizing: "border-box", direction: "rtl", background: "#faf8f4", lineHeight: 1.7 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", display: "block", marginBottom: 8 }}>היקף</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setNewDecision((p) => ({ ...p, scope: "all" }))} style={{ padding: "7px 16px", borderRadius: 20, border: newDecision.scope === "all" ? "2px solid #1a2744" : "2px solid transparent", background: newDecision.scope === "all" ? "#1a274418" : "#f5f0e8", color: newDecision.scope === "all" ? "#1a2744" : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>🏢 כל הבניין</button>
                  {ENTRANCES.map((e) => (
                    <button key={e.id} onClick={() => setNewDecision((p) => ({ ...p, scope: e.id }))} style={{ padding: "7px 16px", borderRadius: 20, border: newDecision.scope === e.id ? `2px solid ${e.color}` : "2px solid transparent", background: newDecision.scope === e.id ? e.color + "18" : "#f5f0e8", color: newDecision.scope === e.id ? e.color : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>{e.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={createDecision} disabled={!newDecision.title.trim()} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: newDecision.title.trim() ? "linear-gradient(135deg,#1a2744,#2d4a7a)" : "#ddd", color: "#fff", fontSize: 15, fontWeight: 700, cursor: newDecision.title.trim() ? "pointer" : "default", fontFamily: "var(--f)" }}>צור הודעה ושלח לחתימה 📩</button>
            </div>
          </div>
        )}

        {/* ===== RESIDENTS (committee) ===== */}
        {page === "residents" && isCommittee && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>דיירי הבניין</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={exportResidents} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #c4a882", background: "#fff", color: "#8a7050", cursor: "pointer", fontFamily: "var(--f)", fontSize: 11, fontWeight: 600 }}>📥 Excel</button>
                <span style={{ fontSize: 12, color: "#999" }}>18 דירות</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setFilterEntrance(null)} style={{ padding: "6px 14px", borderRadius: 20, border: !filterEntrance ? "2px solid #1a2744" : "2px solid transparent", background: !filterEntrance ? "#1a274418" : "#f5f0e8", color: !filterEntrance ? "#1a2744" : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>הכל</button>
              {ENTRANCES.map((e) => (
                <button key={e.id} onClick={() => setFilterEntrance(filterEntrance === e.id ? null : e.id)} style={{ padding: "6px 14px", borderRadius: 20, border: filterEntrance === e.id ? `2px solid ${e.color}` : "2px solid transparent", background: filterEntrance === e.id ? e.color + "18" : "#f5f0e8", color: filterEntrance === e.id ? e.color : "#888", cursor: "pointer", fontFamily: "var(--f)", fontSize: 12, fontWeight: 600 }}>{e.label}</button>
              ))}
            </div>
            {ENTRANCES.filter((e) => !filterEntrance || filterEntrance === e.id).map((ent) => (
              <div key={ent.id} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: ent.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ent.color }}>{ent.id}</div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{ent.label}</h3>
                </div>
                {RESIDENTS.filter((r) => r.entrance === ent.id).map((r, i, arr) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: i < arr.length - 1 ? "1px solid #f5f0e8" : "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: ent.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: ent.color }}>{r.name.charAt(r.name.indexOf(" ") + 1)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{r.name}</span>
                        {r.isCommittee && <span style={{ fontSize: 9, background: "#c4a88220", color: "#8a7050", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{r.role}</span>}
                      </div>
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
