import { Badge } from "@/components/ui/Badge";

const sections = ["Ouverture", "Idée", "Preuve", "Conclusion"];

export function ProductPreview() {
  return (
    <div className="rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.04)]">
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[color-mix(in_oklab,var(--danger)_70%,var(--line))]" />
          <span className="size-2 rounded-full bg-[color-mix(in_oklab,var(--accent)_48%,var(--line))]" />
          <span className="size-2 rounded-full bg-ok" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">Studio preview</span>
      </div>

      <div className="grid min-h-[430px] grid-cols-[96px_minmax(0,1fr)] md:grid-cols-[132px_minmax(0,1fr)_150px]">
        <aside className="border-r border-line bg-panel px-2 py-3">
          <p className="m-0 px-1.5 pb-2 font-mono text-[9px] uppercase tracking-[.12em] text-faint">Plan</p>
          <div className="grid gap-1">
            {sections.map((section, index) => (
              <div
                className={`rounded-[7px] px-1.5 py-2 text-[11.5px] ${
                  index === 1 ? "bg-surface font-[550] text-foreground shadow-[0_1px_2px_rgba(20,20,25,.04)]" : "text-muted"
                }`}
                key={section}
              >
                <span className="mr-1.5 font-mono text-[9px] text-faint">{index + 1}</span>
                <span className="hidden md:inline">{section}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="px-4 py-4 md:px-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="accent">Conférence</Badge>
            <Badge>12 min</Badge>
            <Badge>Équipe produit</Badge>
          </div>
          <h3 className="m-0 text-[22px] font-semibold leading-tight tracking-[0] text-foreground md:text-[28px]">
            Transformer une idée complexe en message clair
          </h3>

          <div className="mt-5 grid gap-3">
            <section className="rounded-[10px] border border-accent bg-[color-mix(in_oklab,var(--accent)_3%,var(--surface))] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="m-0 text-[13px] font-semibold text-foreground">Idée directrice</p>
                <span className="font-mono text-[10px] text-faint">02:10</span>
              </div>
              <p className="m-0 text-[12.5px] leading-6 text-muted">
                L&apos;IA aide à clarifier le fil, mais la voix reste humaine. Chaque section devient plus nette, plus orale et plus facile à tenir devant une salle.
              </p>
            </section>

            <section className="rounded-[10px] border border-line bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="m-0 text-[13px] font-semibold text-foreground">Speaking Mode</p>
                <span className="font-mono text-[10px] text-faint">Live</span>
              </div>
              <div className="rounded-[8px] bg-[color-mix(in_oklab,var(--ink)_92%,var(--bg))] p-3 text-background">
                <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-[color-mix(in_oklab,var(--bg)_70%,transparent)]">
                  <span>0:42 / 12:00</span>
                  <span>SECTION 2 · 4</span>
                </div>
                <p className="m-0 text-[13px] leading-6">
                  “Respirez. Marquez l&apos;idée. Puis donnez à l&apos;audience une phrase qu&apos;elle peut retenir.”
                </p>
              </div>
            </section>
          </div>
        </div>

        <aside className="hidden border-l border-line bg-panel px-3 py-4 md:block">
          <p className="m-0 font-mono text-[9px] uppercase tracking-[.12em] text-faint">Assistant IA</p>
          <div className="mt-3 grid gap-2">
            {["Générer un plan", "Rendre plus oral", "Raccourcir"].map((item) => (
              <div className="rounded-[8px] border border-line bg-surface px-2.5 py-2 text-[11.5px] font-[550] text-muted" key={item}>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[8px] border border-line2 bg-background px-2.5 py-2">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[.12em] text-faint">Export</p>
            <p className="m-0 mt-1 text-[11.5px] text-muted">PDF propre et prêt à relire.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
