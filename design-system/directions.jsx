// directions.jsx — shared icons + 6 direction tiles
const I = {
  home: <path d="M2.5 6.5 8 2l5.5 4.5V13a1 1 0 0 1-1 1H9.5v-4h-3v4H3.5a1 1 0 0 1-1-1V6.5Z"/>,
  stack: <path d="M8 2 14 5 8 8 2 5 8 2Zm-6 6 6 3 6-3M2 11l6 3 6-3"/>,
  mic: <path d="M8 1.5a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0V4A2.5 2.5 0 0 1 8 1.5Zm-5 6a5 5 0 0 0 10 0M8 13v2"/>,
  gear: <path d="M8 5.5A2.5 2.5 0 1 1 8 10.5 2.5 2.5 0 0 1 8 5.5Zm-5.5 2.5h-1m13 0h-1M8 2.5v-1m0 13v-1M3.8 3.8l-.7-.7m9.8 9.8-.7-.7m0-8.4.7-.7M3.8 12.2l-.7.7"/>,
  search: <path d="M7 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm3.5-1 3 3"/>,
  plus: <path d="M8 3v10M3 8h10"/>,
  play: <path d="M5 3.5 12.5 8 5 12.5v-9Z"/>,
  pause: <path d="M5 3.5v9M11 3.5v9"/>,
  prev: <path d="M11.5 3.5 5.5 8l6 4.5v-9ZM4 3.5v9"/>,
  next: <path d="M4.5 3.5 10.5 8l-6 4.5v-9ZM12 3.5v9"/>,
  back: <path d="M9.5 3.5 5 8l4.5 4.5"/>,
  spark: <path d="M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8 6.4 6.4 8 1.5Z"/>,
  grip: <path d="M6 3.5h.01M10 3.5h.01M6 8h.01M10 8h.01M6 12.5h.01M10 12.5h.01"/>,
  expand: <path d="M2.5 6v-3.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>,
  text: <path d="M3 4h10M5.5 4v8.5M10.5 4v8.5"/>,
  doc: <path d="M4 1.5h5.5L13 5v9.5H4V1.5ZM9 1.5V5h4M6 8h4M6 11h4"/>,
  wand: <path d="M3 13 10.5 5.5M9 2.5l.5 1.5L11 4.5 9.5 5 9 6.5 8.5 5 7 4.5 8.5 4 9 2.5ZM13 8l.4 1.1L14.5 9.5l-1.1.4L13 11l-.4-1.1-1.1-.4 1.1-.4L13 8Z"/>,
  shrink: <path d="M3 5h10M5 8h6M6.5 11h3"/>,
  clock: <path d="M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13ZM8 4.5V8l2.5 1.5"/>,
  exit: <path d="M10 5.5 13 8.5l-3 3M13 8.5H6M6 2.5H3.5v12H6"/>,
};
function Ic({ n, s = 16 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{I[n]}</svg>
  );
}

/* ---------- Direction tile ---------- */
function DirTile({ vars, font, dark, accentLabel, btnClass = "btn-primary" }) {
  const style = Object.assign({ "--font": font || "'Geist'" }, vars);
  return (
    <div className={"dir " + (dark ? "th-dark" : "th-light")} style={style}>
      <div className="d-nav">
        <div className="wm" style={{ fontSize: "12.5px" }}><span className="wm-dot" style={{ width: "15px", height: "15px", borderRadius: "5px" }}></span>Solo Speaker</div>
        <div className="links"><span style={{ color: "var(--ink)", fontWeight: 550 }}>Accueil</span><span>Talks</span><span>Compte</span></div>
      </div>
      <div className="d-h">Mes Talks</div>
      <div className="d-card">
        <span className="badge">Sermon · 18 min</span>
        <div className="t-title">La force des commencements discrets</div>
        <div className="t-meta"><span>6 sections</span><span>éd. il y a 2 j</span></div>
      </div>
      <div className="d-btns">
        <span className={"btn " + btnClass}><Ic n="plus" s={13} />Nouveau Talk</span>
        <span className="btn btn-ghost"><Ic n="play" s={12} />Présenter</span>
      </div>
      <div className="d-spec">
        <span className="chip" style={{ background: "var(--bg)" }}></span>
        <span className="chip" style={{ background: "var(--surface)" }}></span>
        <span className="chip" style={{ background: "var(--ink)" }}></span>
        <span className="chip" style={{ background: "var(--accent)" }}></span>
        <span className="f">{(font || "Geist").replace(/'/g, "")} · {accentLabel}</span>
      </div>
    </div>
  );
}

/* ---------- The 6 directions ---------- */
function DirA() { return <DirTile accentLabel="#6E6CF7" vars={{}} />; }
function DirB() { return <DirTile dark accentLabel="#7B79FF" vars={{}} />; }
function DirC() {
  return <DirTile accentLabel="#0D9488" font="'Manrope'" btnClass="btn-accent" vars={{
    "--bg": "#F6F7F8", "--panel": "#EFF1F2", "--surface": "#FFFFFF",
    "--line": "#FFFFFF", "--line2": "#E9ECED",
    "--ink": "#101314", "--mute": "#677077", "--faint": "#9AA3A9",
    "--accent": "#0D9488", "--accent-ink": "#0B7E74", "--accent-bg": "#E2F3F1",
    "--btn": "#101314", "--btn-ink": "#fff", "--r": "16px",
    "--cardshadow": "0 2px 6px rgba(16,19,20,.06), 0 10px 28px rgba(16,19,20,.07)",
  }} />;
}
function DirD() {
  return <DirTile accentLabel="mono" vars={{
    "--bg": "#FFFFFF", "--panel": "#F5F5F5", "--surface": "#FFFFFF",
    "--line": "#E4E4E4", "--line2": "#EEEEEE",
    "--ink": "#0A0A0A", "--mute": "#666666", "--faint": "#A3A3A3",
    "--accent": "#0A0A0A", "--accent-ink": "#0A0A0A", "--accent-bg": "#F0F0F0",
    "--btn": "#0A0A0A", "--btn-ink": "#fff", "--r": "8px",
  }} />;
}
function DirE() {
  return <DirTile accentLabel="#2563EB" font="'Geist'" vars={{
    "--bg": "#F8FAFC", "--panel": "#F1F5F9", "--surface": "#FFFFFF",
    "--line": "#E2E8F0", "--line2": "#EDF2F7",
    "--ink": "#0F172A", "--mute": "#64748B", "--faint": "#94A3B8",
    "--accent": "#2563EB", "--accent-ink": "#1D4ED8", "--accent-bg": "#DBEAFE",
    "--btn": "#0F172A", "--btn-ink": "#fff", "--r": "6px",
  }} />;
}
function DirF() {
  return <DirTile accentLabel="#D97706" font="'Space Grotesk'" vars={{
    "--bg": "#FBFAF8", "--panel": "#F4F2EE", "--surface": "#FFFFFF",
    "--line": "#E9E6DF", "--line2": "#F0EDE7",
    "--ink": "#1C1B18", "--mute": "#73706A", "--faint": "#A8A49C",
    "--accent": "#D97706", "--accent-ink": "#B45309", "--accent-bg": "#FCEED7",
    "--btn": "#1C1B18", "--btn-ink": "#fff", "--r": "12px",
  }} />;
}

Object.assign(window, { Ic, DirTile, DirA, DirB, DirC, DirD, DirE, DirF });
