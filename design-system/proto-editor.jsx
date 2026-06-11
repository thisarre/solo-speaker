// proto-editor.jsx — éditeur interactif avec assistant IA simulé
/* global Ic, AI_OUTLINES, AI_EXPANSIONS, fmt, secDuration, talkDuration, uid, wordCount */

function AutoTA({ value, onChange, onFocus, placeholder }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, [value]);
  return <textarea ref={ref} className="ta" rows={1} value={value} placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)} onFocus={onFocus} />;
}

function ProtoEditor({ talk, onChange, onBack, onSpeak, notify }) {
  const [activeId, setActiveId] = React.useState(talk.sections[0] && talk.sections[0].id);
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState(null); // 'plan' | 'expand' | null
  const [genId, setGenId] = React.useState(null); // section currently being streamed
  const scrollRef = React.useRef(null);
  const secRefs = React.useRef({});
  const timers = React.useRef([]);
  React.useEffect(() => () => timers.current.forEach(clearInterval), []);

  const touch = (t) => {
    setSaving(true);
    onChange({ ...t, updated: "à l'instant" });
    clearTimeout(touch._d); touch._d = setTimeout(() => setSaving(false), 900);
  };
  const setSection = (id, patch) => {
    touch({ ...talk, sections: talk.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };
  const addSection = () => {
    const s = { id: uid(), heading: "Nouvelle section", body: "" };
    touch({ ...talk, sections: [...talk.sections, s] });
    setActiveId(s.id);
  };
  const goTo = (id) => {
    setActiveId(id);
    const el = secRefs.current[id], c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  };

  /* ---- simulated AI ---- */
  const stream = (text, onWord, onDone) => {
    const words = text.split(" ");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      onWord(words.slice(0, i).join(" "));
      if (i >= words.length) { clearInterval(iv); onDone && onDone(); }
    }, 26);
    timers.current.push(iv);
  };

  const generatePlan = () => {
    if (busy) return;
    const outline = (AI_OUTLINES[talk.type] || AI_OUTLINES["Conférence"]);
    setBusy("plan");
    let working = { ...talk, sections: talk.sections.filter((s) => wordCount(s.body) > 0) };
    const kept = working.sections.map((s) => s.heading.toLowerCase().trim());
    const queue = outline.filter(([h]) => !kept.includes(h.toLowerCase().trim()));
    const next = () => {
      if (!queue.length) { setBusy(null); setGenId(null); notify("Plan généré — " + outline.length + " sections"); return; }
      const [heading, body] = queue.shift();
      const s = { id: uid(), heading, body: "" };
      working = { ...working, sections: [...working.sections, s] };
      touch(working);
      setGenId(s.id);
      stream(body, (txt) => {
        working = { ...working, sections: working.sections.map((x) => (x.id === s.id ? { ...x, body: txt } : x)) };
        touch(working);
      }, () => setTimeout(next, 150));
    };
    next();
  };

  const expandSection = () => {
    if (busy || !activeId) return;
    const sec = talk.sections.find((s) => s.id === activeId);
    if (!sec) return;
    setBusy("expand"); setGenId(activeId);
    const add = AI_EXPANSIONS[Math.floor(Math.random() * AI_EXPANSIONS.length)];
    const base = sec.body ? sec.body + " " : "";
    let working = talk;
    stream(add, (txt) => {
      working = { ...working, sections: working.sections.map((x) => (x.id === activeId ? { ...x, body: base + txt } : x)) };
      touch(working);
    }, () => { setBusy(null); setGenId(null); notify("Section développée"); });
  };

  const shortenSection = () => {
    if (busy || !activeId) return;
    const sec = talk.sections.find((s) => s.id === activeId);
    if (!sec || wordCount(sec.body) < 20) { notify("Section déjà concise"); return; }
    const sentences = sec.body.match(/[^.!?]+[.!?]+/g) || [sec.body];
    const kept = sentences.slice(0, Math.max(1, sentences.length - 1)).join("").trim();
    const saved = wordCount(sec.body) - wordCount(kept);
    setSection(activeId, { body: kept });
    notify("Raccourci de " + saved + " mots (−" + fmt(Math.round(saved / 2.33)) + ")");
  };

  const total = talkDuration(talk);
  const target = (talk.duration || 18) * 60;
  const over = total > target;

  return (
    <div className="scr th-x fade-in" style={{ flexDirection: "column", background: "var(--bg)" }} data-screen-label="Éditeur">
      <div className="topbar">
        <span className="icon-btn" onClick={onBack}><Ic n="back" /></span>
        <div className="crumb">Talks<span className="sep">/</span><b>{talk.title}</b></div>
        <div className="tb-right">
          <span className="saved">{saving ? <span style={{ color: "var(--faint)" }}>Enregistrement…</span> : <React.Fragment><i></i>Enregistré</React.Fragment>}</span>
          <span className="btn btn-ghost btn-sm" style={over ? { color: "#C03B32", borderColor: "#E8B6B2" } : {}}>
            <Ic n="clock" s={12} />{fmt(total)} / {fmt(target)}
          </span>
          <button className="btn btn-primary btn-sm" onClick={onSpeak}><Ic n="play" s={11} />Présenter</button>
        </div>
      </div>

      <div className="ed-body">
        <div className="rail">
          <div className="sb-label">Plan</div>
          {talk.sections.map((s, i) => (
            <div key={s.id} className={"o-it" + (s.id === activeId ? " on" : "")} onClick={() => goTo(s.id)}>
              <span className="o-n">{i + 1}</span><span className="o-t">{s.heading || "Sans titre"}</span><span className="o-d">{fmt(secDuration(s))}</span>
            </div>
          ))}
          <div className="rail-total"><span>Total estimé</span><span style={over ? { color: "#C03B32" } : {}}>{fmt(total)}</span></div>
        </div>

        <div className="ed-scroll" ref={scrollRef}>
          <div className="doc">
            <div className="d-badges">
              <span className="badge acc">{talk.type}</span>
              <span className="badge">{talk.duration} min</span>
              {talk.audience ? <span className="badge">{talk.audience}</span> : null}
            </div>
            <h1>{talk.title}</h1>

            {talk.sections.map((s, i) => (
              <div key={s.id} ref={(el) => (secRefs.current[s.id] = el)}
                className={"dsec" + (s.id === activeId ? " active" : "")}
                onClick={() => setActiveId(s.id)}>
                <div className="dsec-head">
                  <span className="grip"><Ic n="grip" s={12} /></span>
                  <h3 style={{ display: "flex", gap: "6px", flex: 1 }}>
                    <span style={{ color: "var(--faint)", fontWeight: 500 }}>{i + 1} ·</span>
                    <input value={s.heading} onChange={(e) => setSection(s.id, { heading: e.target.value })}
                      onFocus={() => setActiveId(s.id)} />
                  </h3>
                  <span className="d-time">~{fmt(secDuration(s))}</span>
                </div>
                {genId === s.id ? (
                  <p style={{ color: "var(--ink)" }}>{s.body}<span className="caret"></span></p>
                ) : (
                  <AutoTA value={s.body} placeholder="Écrivez ce que vous direz — ou demandez à l'assistant de développer."
                    onChange={(v) => setSection(s.id, { body: v })} onFocus={() => setActiveId(s.id)} />
                )}
              </div>
            ))}

            <button className="btn btn-quiet" onClick={addSection} style={{ marginTop: "4px" }}>
              <Ic n="plus" s={13} />Ajouter une section
            </button>
          </div>
        </div>

        <div className="ai">
          <div className="ai-head"><Ic n="spark" s={15} />Assistant</div>
          <div className={"ai-act" + (busy === "plan" ? " busy" : "")} onClick={generatePlan}>
            <Ic n="doc" s={14} />{busy === "plan" ? "Génération du plan…" : "Générer le plan"}<span className="kbd">⌘G</span>
          </div>
          <div className={"ai-act" + (busy === "expand" ? " busy" : "")} onClick={expandSection}>
            <Ic n="wand" s={14} />{busy === "expand" ? "Rédaction…" : "Développer la section"}
          </div>
          <div className="ai-act" onClick={shortenSection}><Ic n="shrink" s={14} />Raccourcir la section</div>
          <div className="ai-sug">
            <div className="s-tag"><Ic n="spark" s={12} />Suggestion</div>
            {over
              ? "Vous dépassez la durée cible. « Raccourcir la section » sur vos deux sections les plus longues vous ferait gagner l'écart."
              : "Votre accroche pose une question — gardez la réponse pour la section suivante afin de maintenir la tension."}
          </div>
          <div className="ai-note">L'assistant travaille sur la section active. Il propose, vous disposez — rien n'est inséré sans votre accord.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProtoEditor, AutoTA });
