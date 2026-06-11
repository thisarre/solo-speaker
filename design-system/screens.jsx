// screens.jsx — Dashboard (light/dark), Éditeur, Speaking Mode
/* global Ic */

/* ================= Shared ================= */
function Sidebar({ active }) {
  return (
    <aside className="sb">
      <div className="wm"><span className="wm-dot"></span>Solo Speaker</div>
      <div className="sb-search"><Ic n="search" s={13} />Rechercher<span className="kbd">⌘K</span></div>
      <div className="sb-label">Espace</div>
      <nav className="nav">
        <div className={"nav-it" + (active === "home" ? " on" : "")}><Ic n="home" />Accueil</div>
        <div className={"nav-it" + (active === "talks" ? " on" : "")}><Ic n="stack" />Talks<span className="n-count">12</span></div>
        <div className={"nav-it" + (active === "account" ? " on" : "")}><Ic n="gear" />Compte</div>
      </nav>
      <div className="sb-foot">
        <div className="avatar">SK</div>
        <div><div className="u-name">Samuel K.</div><div className="u-role">Conférencier</div></div>
      </div>
    </aside>
  );
}

function TalkCard({ type, title, dur, sections, status, statusLabel, date }) {
  return (
    <div className="tcard">
      <div><span className="badge">{type}</span></div>
      <div className="t-title">{title}</div>
      <div className="t-meta"><span>{dur}</span><span>{sections}</span></div>
      <div className="t-foot">
        <span className={"status " + status}><i></i>{statusLabel}</span>
        <span className="t-date">{date}</span>
      </div>
    </div>
  );
}

/* ================= Dashboard ================= */
function Dashboard({ theme = "th-light" }) {
  return (
    <div className={"scr " + theme}>
      <Sidebar active="home" />
      <div className="main">
        <div className="db-body">
          <div className="db-head">
            <div>
              <h1>Bonjour, Samuel</h1>
              <div className="sub">Mercredi 10 juin — votre prochain talk est dans 4 jours.</div>
            </div>
            <span className="btn btn-primary"><Ic n="plus" s={13} />Nouveau Talk</span>
          </div>

          <div className="resume">
            <div className="r-info">
              <span className="badge acc">Conférence · 18 min</span>
              <div className="r-title">L'art de capter une salle en 90 secondes</div>
              <div className="r-meta"><span>6 sections</span><span>FR</span><span>éd. il y a 2 h</span></div>
            </div>
            <div className="r-prog">
              <div className="p-row"><span>Préparation</span><span>4/6 sections</span></div>
              <div className="p-bar"><i style={{ width: "66%" }}></i></div>
            </div>
            <div className="r-actions">
              <span className="btn btn-ghost">Continuer</span>
              <span className="btn btn-primary"><Ic n="play" s={12} />Présenter</span>
            </div>
          </div>

          <div>
            <div className="sec-row" style={{ marginBottom: "12px" }}>
              <h2>Récents</h2><span className="more">Tout voir →</span>
            </div>
            <div className="tgrid">
              <TalkCard type="Sermon" title="La force des commencements discrets" dur="25 min" sections="7 sections" status="ready" statusLabel="Prêt" date="il y a 2 j" />
              <TalkCard type="Pitch" title="Solo Speaker — seed round" dur="5 min" sections="4 sections" status="draft" statusLabel="Brouillon" date="il y a 5 j" />
              <TalkCard type="Training" title="Onboarder sans réunionite" dur="45 min" sections="9 sections" status="ready" statusLabel="Prêt" date="il y a 1 sem" />
            </div>
          </div>

          <div>
            <div className="sec-row" style={{ marginBottom: "12px" }}>
              <h2>Commencer</h2>
            </div>
            <div className="tgrid">
              <div className="newcard"><Ic n="plus" />Talk vierge</div>
              <div className="newcard"><Ic n="spark" />Générer depuis un brief</div>
              <div className="newcard"><Ic n="doc" />Importer des notes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Éditeur ================= */
function Editor() {
  const outline = [
    ["1", "Accroche", "1:30", false],
    ["2", "Le problème", "3:00", false],
    ["3", "L'histoire de Marc", "4:00", true],
    ["4", "La méthode 90 s", "5:00", false],
    ["5", "Objections", "3:00", false],
    ["6", "Appel à l'action", "1:30", false],
  ];
  return (
    <div className="scr th-light" style={{ flexDirection: "column" }}>
      <div className="topbar">
        <span className="icon-btn"><Ic n="back" /></span>
        <div className="crumb">Talks<span className="sep">/</span><b>L'art de capter une salle en 90 secondes</b></div>
        <div className="tb-right">
          <span className="saved"><i></i>Enregistré</span>
          <span className="btn btn-ghost btn-sm"><Ic n="clock" s={12} />17:54 / 18:00</span>
          <span className="btn btn-primary btn-sm"><Ic n="play" s={11} />Présenter</span>
        </div>
      </div>
      <div className="ed-body">
        <div className="rail">
          <div className="sb-label">Plan</div>
          {outline.map(([n, t, d, on]) => (
            <div key={n} className={"o-it" + (on ? " on" : "")}>
              <span className="o-n">{n}</span><span className="o-t">{t}</span><span className="o-d">{d}</span>
            </div>
          ))}
          <div className="rail-total"><span>Total estimé</span><span>17:54</span></div>
        </div>

        <div className="doc-wrap">
          <div className="doc">
            <div className="d-badges">
              <span className="badge acc">Conférence</span>
              <span className="badge">18 min</span>
              <span className="badge">Managers · ~80 pers.</span>
            </div>
            <h1>L'art de capter une salle en 90 secondes</h1>

            <div className="dsec">
              <div className="dsec-head">
                <span className="grip"><Ic n="grip" s={12} /></span>
                <h3>2 · Le problème</h3>
                <span className="d-time">~3:00</span>
              </div>
              <p>Quatre-vingt-dix secondes. C'est le temps dont vous disposez avant que la salle ne décide si elle vous écoute — ou si elle retourne à ses notifications. <b>La plupart des intervenants brûlent ce capital en remerciements et en sommaire.</b></p>
            </div>

            <div className="dsec">
              <div className="dsec-head">
                <span className="grip"><Ic n="grip" s={12} /></span>
                <h3>3 · L'histoire de Marc</h3>
                <span className="d-time">~4:00</span>
              </div>
              <p>Posez la question avant de donner la réponse. Laissez le silence travailler pour vous <span className="cue">[pause 3 s]</span> puis racontez Marc, ce formateur qui ouvrait chaque session par une minute de silence complet.</p>
              <p>Personne ne sortait son téléphone. <b>Le silence était devenu son accroche.</b></p>
            </div>

            <div className="dsec gen">
              <div className="gen-tag"><Ic n="spark" s={13} />L'assistant rédige « La méthode 90 s »…</div>
              <div className="skel" style={{ width: "92%" }}></div>
              <div className="skel" style={{ width: "78%" }}></div>
              <div className="skel" style={{ width: "85%", marginBottom: 0 }}></div>
            </div>
          </div>
        </div>

        <div className="ai">
          <div className="ai-head"><Ic n="spark" s={15} />Assistant</div>
          <div className="ai-act"><Ic n="doc" s={14} />Générer le plan<span className="kbd">⌘G</span></div>
          <div className="ai-act"><Ic n="wand" s={14} />Développer la section</div>
          <div className="ai-act"><Ic n="shrink" s={14} />Raccourcir de 2 min</div>
          <div className="ai-act"><Ic n="text" s={14} />Ajuster le ton</div>
          <div className="ai-sug">
            <div className="s-tag"><Ic n="spark" s={12} />Suggestion</div>
            Votre accroche pose une question, mais la réponse arrive trop vite. Déplacer la statistique en section 4 renforcerait la tension.
            <div className="s-btns">
              <span className="btn btn-primary btn-sm">Appliquer</span>
              <span className="btn btn-quiet btn-sm">Ignorer</span>
            </div>
          </div>
          <div className="ai-note">L'assistant travaille sur la section active. Il propose, vous disposez — rien n'est inséré sans votre accord.</div>
        </div>
      </div>
    </div>
  );
}

/* ================= Speaking Mode ================= */
function Speaking() {
  return (
    <div className="scr sp">
      <div className="sp-top">
        <span>L'art de capter une salle</span>
        <span className="sp-timer">04:12<span className="tot">/ 18:00</span></span>
        <span className="sp-sec">Section 3 · 6</span>
      </div>
      <div className="sp-stage">
        <div className="sp-marker"></div>
        <div className="sp-text">
          <span className="prev">…c'est exactement là que la plupart des intervenants perdent la salle. </span>
          <span className="now">Posez la question avant de donner la réponse. Laissez le silence travailler pour vous <span className="cue">[pause]</span> puis racontez l'histoire de Marc, </span>
          <span className="next">ce formateur qui ouvrait chaque session par une minute de silence complet. Personne ne sortait son téléphone.</span>
        </div>
        <div className="sp-fade-t"></div>
        <div className="sp-fade-b"></div>
      </div>
      <div className="sp-ctrl">
        <div className="sp-pill">
          <span className="sp-btn"><Ic n="prev" /></span>
          <span className="sp-btn main"><Ic n="pause" /></span>
          <span className="sp-btn"><Ic n="next" /></span>
          <span className="div"></span>
          <span className="sp-btn">1.0×</span>
          <span className="sp-btn" style={{ fontFamily: "'Geist'", fontWeight: 550 }}>Aa</span>
          <span className="div"></span>
          <span className="sp-btn"><Ic n="exit" /></span>
        </div>
      </div>
      <div className="sp-prog"><i></i></div>
    </div>
  );
}

Object.assign(window, { Sidebar, TalkCard, Dashboard, Editor, Speaking });
