// proto-core.jsx — Login, Shell, Dashboard, Talks, dialogs, toast
/* global Ic, TALK_TYPES, DURATIONS, fmt, talkDuration, talkProgress, uid */

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast"><i></i>{msg}</div>;
}

/* ---------- Login ---------- */
function Login({ onLogin }) {
  const [email, setEmail] = React.useState("");
  return (
    <div className="login fade-in" data-screen-label="Login">
      <div className="login-card">
        <div className="wm"><span className="wm-dot"></span>Solo Speaker</div>
        <h1>Bon retour</h1>
        <p className="l-sub">Préparez, répétez, prononcez.</p>
        <div className="field">
          <input className="inp" placeholder="adresse@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onLogin(); }} />
        </div>
        <div className="field">
          <input className="inp" type="password" placeholder="Mot de passe"
            onKeyDown={(e) => { if (e.key === "Enter") onLogin(); }} />
        </div>
        <button className="btn btn-primary" style={{ justifyContent: "center", padding: "11px" }} onClick={onLogin}>Continuer</button>
        <div className="l-alt">ou recevoir un <b onClick={onLogin}>lien magique</b> · <b onClick={onLogin}>créer un compte</b></div>
      </div>
      <div className="l-foot">Supabase Auth · Demo</div>
    </div>
  );
}

/* ---------- Sidebar ---------- */
function ProtoSidebar({ route, onNav, onLogout, count }) {
  return (
    <aside className="sb">
      <div className="wm"><span className="wm-dot"></span>Solo Speaker</div>
      <div className="sb-search"><Ic n="search" s={13} />Rechercher<span className="kbd">⌘K</span></div>
      <div className="sb-label">Espace</div>
      <nav className="nav">
        <div className={"nav-it" + (route === "dashboard" ? " on" : "")} onClick={() => onNav("dashboard")}><Ic n="home" />Accueil</div>
        <div className={"nav-it" + (route === "talks" ? " on" : "")} onClick={() => onNav("talks")}><Ic n="stack" />Talks<span className="n-count">{count}</span></div>
        <div className={"nav-it" + (route === "account" ? " on" : "")} onClick={() => onNav("account")}><Ic n="gear" />Compte</div>
      </nav>
      <div className="sb-foot">
        <div className="avatar">SK</div>
        <div style={{ flex: 1 }}><div className="u-name">Samuel K.</div><div className="u-role">Conférencier</div></div>
        <span className="icon-btn" title="Se déconnecter" onClick={onLogout} style={{ border: "none", background: "transparent" }}><Ic n="exit" s={14} /></span>
      </div>
    </aside>
  );
}

/* ---------- Talk card ---------- */
function ProtoTalkCard({ talk, onOpen, onDelete }) {
  const p = talkProgress(talk);
  const ready = talk.status === "ready";
  return (
    <div className="tcard" onClick={onOpen}>
      <span className="t-x" title="Supprimer" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5 5 14h6l.5-9.5M6.8 7v4.5M9.2 7v4.5" /></svg>
      </span>
      <div><span className="badge">{talk.type} · {talk.duration} min</span></div>
      <div className="t-title">{talk.title}</div>
      <div className="t-meta"><span>{talk.sections.length} sections</span><span>{talk.lang}</span></div>
      <div className="t-foot">
        <span className={"status " + (ready ? "ready" : "draft")}><i></i>{ready ? "Prêt" : `Brouillon · ${p.done}/${p.total}`}</span>
        <span className="t-date">{talk.updated}</span>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function ProtoDashboard({ talks, onOpen, onSpeak, onNew, onNav, onDelete }) {
  const resume = talks[0];
  const p = resume ? talkProgress(resume) : { done: 0, total: 1 };
  return (
    <div className="main fade-in" data-screen-label="Dashboard">
      <div className="db-scroll">
        <div className="db-body">
          <div className="db-head">
            <div>
              <h1>Bonjour, Samuel</h1>
              <div className="sub">Mercredi 10 juin — votre prochain talk est dans 4 jours.</div>
            </div>
            <button className="btn btn-primary" onClick={onNew}><Ic n="plus" s={13} />Nouveau Talk</button>
          </div>

          {resume && (
            <div className="resume">
              <div className="r-info">
                <span className="badge acc">{resume.type} · {resume.duration} min</span>
                <div className="r-title">{resume.title}</div>
                <div className="r-meta"><span>{resume.sections.length} sections</span><span>{resume.lang}</span><span>éd. {resume.updated}</span></div>
              </div>
              <div className="r-prog">
                <div className="p-row"><span>Préparation</span><span>{p.done}/{p.total} sections</span></div>
                <div className="p-bar"><i style={{ width: (p.done / p.total) * 100 + "%" }}></i></div>
              </div>
              <div className="r-actions">
                <button className="btn btn-ghost" onClick={() => onOpen(resume.id)}>Continuer</button>
                <button className="btn btn-primary" onClick={() => onSpeak(resume.id)}><Ic n="play" s={12} />Présenter</button>
              </div>
            </div>
          )}

          <div>
            <div className="sec-row" style={{ marginBottom: "12px" }}>
              <h2>Récents</h2><span className="more" onClick={() => onNav("talks")}>Tout voir →</span>
            </div>
            <div className="tgrid">
              {talks.slice(1, 4).map((t) => (
                <ProtoTalkCard key={t.id} talk={t} onOpen={() => onOpen(t.id)} onDelete={() => onDelete(t.id)} />
              ))}
            </div>
          </div>

          <div>
            <div className="sec-row" style={{ marginBottom: "12px" }}><h2>Commencer</h2></div>
            <div className="tgrid">
              <div className="newcard" onClick={onNew}><Ic n="plus" />Talk vierge</div>
              <div className="newcard" onClick={onNew}><Ic n="spark" />Générer depuis un brief</div>
              <div className="newcard" onClick={onNew}><Ic n="doc" />Importer des notes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Talks list ---------- */
function ProtoTalks({ talks, onOpen, onNew, onDelete }) {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("Tous");
  const list = talks.filter((t) =>
    (type === "Tous" || t.type === type) &&
    t.title.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="main fade-in" data-screen-label="Talks">
      <div className="db-scroll">
        <div className="db-body">
          <div className="db-head">
            <div>
              <h1>Talks</h1>
              <div className="sub">{talks.length} talks — brouillons et prêts à présenter.</div>
            </div>
            <button className="btn btn-primary" onClick={onNew}><Ic n="plus" s={13} />Nouveau Talk</button>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ width: "260px" }}>
              <input className="inp" placeholder="Rechercher un talk…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {["Tous", ...TALK_TYPES].map((t) => (
                <span key={t} className={"badge-f" + (type === t ? " on" : "")} onClick={() => setType(t)}>{t}</span>
              ))}
            </div>
          </div>
          {list.length ? (
            <div className="tgrid">
              {list.map((t) => (
                <ProtoTalkCard key={t.id} talk={t} onOpen={() => onOpen(t.id)} onDelete={() => onDelete(t.id)} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Ic n="stack" />
              <b>Aucun talk ne correspond</b>
              <span>Essayez un autre filtre, ou créez un nouveau talk — l'assistant peut générer le plan.</span>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: "6px" }} onClick={() => { setQ(""); setType("Tous"); }}>Réinitialiser les filtres</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Account (minimal) ---------- */
function ProtoAccount({ onLogout }) {
  return (
    <div className="main fade-in" data-screen-label="Compte">
      <div className="db-scroll">
        <div className="db-body" style={{ maxWidth: "560px" }}>
          <div className="db-head"><div><h1>Compte</h1><div className="sub">Profil et préférences.</div></div></div>
          <div className="field"><label>Nom affiché</label><input className="inp" defaultValue="Samuel K." /></div>
          <div className="field"><label>Rôle</label><input className="inp" defaultValue="Conférencier" /></div>
          <div className="field"><label>Langue par défaut</label><input className="inp" defaultValue="Français" /></div>
          <div><button className="btn btn-ghost" onClick={onLogout}><Ic n="exit" s={13} />Se déconnecter</button></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- New talk dialog ---------- */
function NewTalkDialog({ onClose, onCreate }) {
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState("Conférence");
  const [dur, setDur] = React.useState(18);
  const [audience, setAudience] = React.useState("");
  return (
    <div className="ovl" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <h2>Nouveau Talk</h2>
        <p className="d-sub">Le brief guide l'assistant — plus il est précis, meilleur sera le plan.</p>
        <div className="d-grid">
          <div className="field">
            <label>Titre</label>
            <input className="inp" autoFocus placeholder="Ex. Convaincre sans diapositives" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Type</label>
            <div className="chip-row">
              {TALK_TYPES.map((t) => (
                <span key={t} className={"chip-s" + (type === t ? " on" : "")} onClick={() => setType(t)}>{t}</span>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Durée cible</label>
            <div className="chip-row">
              {DURATIONS.map((d) => (
                <span key={d} className={"chip-s" + (dur === d ? " on" : "")} onClick={() => setDur(d)}>{d} min</span>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Public <span style={{ color: "var(--faint)", fontWeight: 400 }}>· optionnel</span></label>
            <input className="inp" placeholder="Ex. Managers, ~80 personnes" value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
        </div>
        <div className="d-foot">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" style={{ opacity: title.trim() ? 1 : 0.4, pointerEvents: title.trim() ? "auto" : "none" }}
            onClick={() => onCreate({ title: title.trim(), type, duration: dur, audience })}>Créer le talk</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Confirm delete ---------- */
function ConfirmDialog({ title, onClose, onConfirm }) {
  return (
    <div className="ovl" onClick={onClose}>
      <div className="dlg danger" onClick={(e) => e.stopPropagation()} style={{ width: "400px" }}>
        <h2>Supprimer ce talk ?</h2>
        <p className="d-sub">« {title} » sera définitivement supprimé. Cette action est irréversible.</p>
        <div className="d-foot">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" style={{ background: "#C03B32" }} onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Toast, Login, ProtoSidebar, ProtoTalkCard, ProtoDashboard, ProtoTalks, ProtoAccount, NewTalkDialog, ConfirmDialog });
