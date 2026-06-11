// proto-speaking.jsx — speaking mode plein écran, auto-scroll réel
/* global Ic, fmt, talkDuration, renderCues */

const SP_SPEEDS = [0.75, 1, 1.25, 1.5];
const SP_FONTS = [32, 40, 48];

function ProtoSpeaking({ talk, onExit }) {
  const items = React.useMemo(() => {
    const out = [];
    talk.sections.forEach((s, si) => {
      out.push({ k: "h" + s.id, h: true, text: (si + 1) + " · " + s.heading, si });
      const sentences = (s.body || "").match(/[^.!?…]+[.!?…]+["’»]?/g) || (s.body ? [s.body] : []);
      for (let i = 0; i < sentences.length; i += 2) {
        out.push({ k: s.id + "-" + i, h: false, text: sentences.slice(i, i + 2).join(" ").trim(), si });
      }
    });
    return out;
  }, [talk]);

  const storeKey = "ss_proto_speak_" + talk.id;
  const [playing, setPlaying] = React.useState(false);
  const [speedIx, setSpeedIx] = React.useState(1);
  const [fontIx, setFontIx] = React.useState(1);
  const [nowIx, setNowIx] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [prog, setProg] = React.useState(0);
  const scrollRef = React.useRef(null);
  const parRefs = React.useRef({});
  const elapsedRef = React.useRef(0);
  const playRef = React.useRef(false); playRef.current = playing;
  const speedRef = React.useRef(1); speedRef.current = SP_SPEEDS[speedIx];
  const fontRef = React.useRef(SP_FONTS[fontIx]); fontRef.current = SP_FONTS[fontIx];

  /* restore position */
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved && scrollRef.current) {
        scrollRef.current.scrollTop = saved.top || 0;
        elapsedRef.current = saved.elapsed || 0;
        setElapsed(saved.elapsed || 0);
      }
    } catch (e) {}
    recompute();
  }, []);

  const recompute = () => {
    const c = scrollRef.current;
    if (!c) return;
    const marker = c.getBoundingClientRect().top + c.clientHeight * 0.42;
    let best = 0, bestD = Infinity;
    items.forEach((it, i) => {
      const el = parRefs.current[it.k];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - marker);
      if (d < bestD) { bestD = d; best = i; }
    });
    setNowIx((p) => (p === best ? p : best));
    const max = c.scrollHeight - c.clientHeight;
    setProg(max > 0 ? c.scrollTop / max : 0);
  };

  /* rAF auto-scroll */
  React.useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = (now - last) / 1000; last = now;
      const c = scrollRef.current;
      if (c && playRef.current) {
        c.scrollTop += fontRef.current * 0.62 * speedRef.current * dt;
        elapsedRef.current += dt;
        if (c.scrollTop >= c.scrollHeight - c.clientHeight - 1) setPlaying(false);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(() => {
      setElapsed(Math.floor(elapsedRef.current));
      const c = scrollRef.current;
      if (c) try { localStorage.setItem(storeKey, JSON.stringify({ top: c.scrollTop, elapsed: elapsedRef.current })); } catch (e) {}
    }, 500);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);

  /* keyboard */
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === "Escape") onExit();
      else if (e.key === "ArrowDown") jumpSection(1);
      else if (e.key === "ArrowUp") jumpSection(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nowIx, items]);

  const jumpSection = (d) => {
    const cur = items[nowIx] ? items[nowIx].si : 0;
    const target = Math.max(0, Math.min(talk.sections.length - 1, cur + d));
    const it = items.find((x) => x.h && x.si === target);
    const el = it && parRefs.current[it.k], c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - c.clientHeight * 0.38, behavior: "smooth" });
  };

  const font = SP_FONTS[fontIx];
  const total = talkDuration(talk);
  const curSec = items[nowIx] ? items[nowIx].si : 0;

  return (
    <div className="sp-full fade-in" data-screen-label="Speaking Mode">
      <div className="sp-top">
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "30%" }}>{talk.title}</span>
        <span className="sp-timer">{fmt(elapsed)}<span className="tot">/ {fmt(total)}</span></span>
        <span className="sp-sec">Section {curSec + 1} · {talk.sections.length}</span>
      </div>

      <div className="sp-scroll" ref={scrollRef} onScroll={recompute}>
        <div className="sp-marker" style={{ position: "fixed", top: "42%", left: "28px" }}></div>
        <div className="sp-inner" style={{ fontSize: font + "px" }}>
          {items.map((it, i) => it.h ? (
            <div key={it.k} ref={(el) => (parRefs.current[it.k] = el)} className={"sp-h" + (i === nowIx ? " now" : "")}>{it.text}</div>
          ) : (
            <p key={it.k} ref={(el) => (parRefs.current[it.k] = el)}
              className={"sp-par" + (i === nowIx ? " now" : Math.abs(i - nowIx) === 1 ? " near" : "")}>
              {renderCues(it.text)}
            </p>
          ))}
          <p className="sp-par" style={{ textAlign: "center", fontSize: ".5em", color: "#3C3D46" }}>— Fin du talk —</p>
        </div>
        <div className="sp-fade-t" style={{ position: "fixed", top: "54px" }}></div>
        <div className="sp-fade-b" style={{ position: "fixed", bottom: "70px" }}></div>
      </div>

      <div className="sp-ctrl">
        <div className="sp-pill">
          <button className="sp-btn" title="Section précédente" onClick={() => jumpSection(-1)}><Ic n="prev" /></button>
          <button className="sp-btn main" title="Lecture / pause (espace)" onClick={() => setPlaying((p) => !p)}>
            <Ic n={playing ? "pause" : "play"} />
          </button>
          <button className="sp-btn" title="Section suivante" onClick={() => jumpSection(1)}><Ic n="next" /></button>
          <span className="div"></span>
          <button className="sp-btn" title="Vitesse" onClick={() => setSpeedIx((i) => (i + 1) % SP_SPEEDS.length)}>{SP_SPEEDS[speedIx].toFixed(2).replace(/0+$/, "").replace(/\.$/, ".0")}×</button>
          <button className="sp-btn" title="Taille du texte" style={{ fontFamily: "'Geist'", fontWeight: 550 }}
            onClick={() => setFontIx((i) => (i + 1) % SP_FONTS.length)}>Aa</button>
          <span className="div"></span>
          <button className="sp-btn" title="Quitter (échap)" onClick={onExit}><Ic n="exit" /></button>
        </div>
        <span className="sp-hint">espace · lecture &nbsp; ↑↓ · sections &nbsp; échap · quitter</span>
      </div>
      <div className="sp-prog"><i style={{ width: prog * 100 + "%" }}></i></div>
    </div>
  );
}

Object.assign(window, { ProtoSpeaking });
