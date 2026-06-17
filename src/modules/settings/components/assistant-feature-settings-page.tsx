"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  FileText,
  Mic2,
  Monitor,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  assistantFeatureDefinitions,
  defaultAssistantFeaturesByTalkType,
  getAssistantOptionalFeatures
} from "@/modules/assistant/feature-registry";
import { useAssistantFeatureSettings } from "@/modules/assistant/feature-settings";
import {
  aiEnabledStorageKey,
  defaultPrompterFontSize,
  defaultPrompterSpeed,
  defaultPrompterTheme,
  defaultVoiceProvider,
  predictiveWritingStorageKey,
  prompterFontSizeOptions,
  prompterFontSizeStorageKey,
  prompterSpeedOptions,
  prompterSpeedStorageKey,
  prompterThemeStorageKey,
  voiceProviderOptions,
  voiceProviderStorageKey,
  writeStudioPreference
} from "@/modules/settings/studio-preferences";
import { talkTypeLabels, type TalkType } from "@/types/talk";

const talkTypes = Object.keys(talkTypeLabels) as TalkType[];

function readPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function useStoredPreference(key: string, fallback: string) {
  const value = useSyncExternalStore(
    (onStoreChange) => {
      const eventName = `solo-speaker-storage:${key}`;
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key) onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(eventName, onStoreChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(eventName, onStoreChange);
      };
    },
    () => readPreference(key, fallback),
    () => fallback
  );

  const setValue = useCallback((nextValue: string) => writeStudioPreference(key, nextValue), [key]);

  return [value, setValue] as const;
}

function useStoredBooleanPreference(key: string, fallback: boolean) {
  const [value, setValue] = useStoredPreference(key, String(fallback));
  return [value === "true", (nextValue: boolean) => setValue(String(nextValue))] as const;
}

export function AssistantFeatureSettingsPage() {
  const { settings, setFeatureEnabled } = useAssistantFeatureSettings();
  const optionalFeatures = getAssistantOptionalFeatures();
  const [aiEnabled, setAiEnabled] = useStoredBooleanPreference(aiEnabledStorageKey, true);
  const [predictiveWritingEnabled, setPredictiveWritingEnabled] = useStoredBooleanPreference(predictiveWritingStorageKey, false);
  const [prompterTheme, setPrompterTheme] = useStoredPreference(prompterThemeStorageKey, defaultPrompterTheme);
  const [prompterSpeed, setPrompterSpeed] = useStoredPreference(prompterSpeedStorageKey, String(defaultPrompterSpeed));
  const [prompterFontSize, setPrompterFontSize] = useStoredPreference(prompterFontSizeStorageKey, String(defaultPrompterFontSize));
  const [voiceProvider, setVoiceProvider] = useStoredPreference(voiceProviderStorageKey, defaultVoiceProvider);
  const extraFeatureCount = settings.extraEnabledFeatures.length;

  function resetStudioPreferences() {
    setAiEnabled(true);
    setPredictiveWritingEnabled(false);
    setPrompterTheme(defaultPrompterTheme);
    setPrompterSpeed(String(defaultPrompterSpeed));
    setPrompterFontSize(String(defaultPrompterFontSize));
    setVoiceProvider(defaultVoiceProvider);
    optionalFeatures.forEach((feature) => setFeatureEnabled(feature.id, false));
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={<Bot />} label="Assistant" value={aiEnabled ? "Actif" : "Manuel"} detail={predictiveWritingEnabled ? "Prédiction activée" : "Prédiction coupée"} />
        <SummaryCard icon={<Monitor />} label="Prompteur" value={prompterTheme === "light" ? "Mode clair" : "Mode sombre"} detail={`${prompterSpeed}x · ${prompterFontSize}px`} />
        <SummaryCard icon={<Sparkles />} label="Modules" value={extraFeatureCount ? `${extraFeatureCount} extra` : "Par défaut"} detail="Adaptés à chaque format" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <SettingsPanel
            icon={<SlidersHorizontal />}
            title="Studio d'écriture"
            description="Ces réglages pilotent ce qui apparaît dans l'éditeur quand vous préparez un talk."
          >
            <div className="grid gap-3">
              <ToggleRow
                checked={aiEnabled}
                description="Affiche les actions de plan, reformulation, oralisation et raccourci dans l'éditeur."
                icon={<Bot />}
                label="Assistant IA dans l'éditeur"
                onChange={setAiEnabled}
              />
              <ToggleRow
                checked={predictiveWritingEnabled}
                description="Propose une suite pendant la rédaction quand une section contient assez de contexte."
                disabled={!aiEnabled}
                icon={<BrainCircuit />}
                label="Prédiction pendant l'écriture"
                onChange={setPredictiveWritingEnabled}
              />
            </div>
          </SettingsPanel>

          <SettingsPanel
            icon={<Monitor />}
            title="Prompteur"
            description="Définissez les valeurs de départ utilisées quand un talk n'a pas encore ses propres préférences."
          >
            <div className="grid gap-4">
              <ChoiceGroup
                icon={<Palette />}
                label="Thème par défaut"
                onChange={setPrompterTheme}
                options={[
                  { label: "Sombre", value: "dark" },
                  { label: "Clair", value: "light" }
                ]}
                value={prompterTheme}
              />
              <ChoiceGroup
                label="Vitesse de départ"
                onChange={setPrompterSpeed}
                options={prompterSpeedOptions.map((speed) => ({ label: `${formatSpeed(speed)}x`, value: String(speed) }))}
                value={prompterSpeed}
              />
              <ChoiceGroup
                label="Taille du texte"
                onChange={setPrompterFontSize}
                options={prompterFontSizeOptions.map((size) => ({ label: `${size}px`, value: String(size) }))}
                value={prompterFontSize}
              />
              <ChoiceGroup
                icon={<Mic2 />}
                label="Suivi vocal"
                onChange={setVoiceProvider}
                options={voiceProviderOptions.map((provider) => ({ label: formatVoiceProvider(provider), value: provider }))}
                value={voiceProvider}
              />
            </div>
          </SettingsPanel>
        </div>

        <aside className="grid content-start gap-5">
          <SettingsPanel
            icon={<Sparkles />}
            title="Modules spécialisés"
            description="Activez un outil spécialisé partout uniquement si vous en avez vraiment besoin."
          >
            <div className="grid gap-3">
              {optionalFeatures.map((feature) => {
                const enabled = settings.extraEnabledFeatures.includes(feature.id);
                return (
                  <div className="rounded-[10px] border border-border bg-background p-3" key={feature.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 text-[14px] font-semibold text-foreground">{feature.optionalLabel ?? feature.label}</p>
                        <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">{feature.description}</p>
                      </div>
                      <SwitchButton checked={enabled} label={enabled ? "Activé" : "Activer"} onClick={() => setFeatureEnabled(feature.id, !enabled)} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone="accent">par défaut: {feature.defaultTalkTypes.map((type) => talkTypeLabels[type]).join(", ")}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </SettingsPanel>

          <div className="rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
            <div className="mb-3 flex items-center gap-2">
              <RotateCcw className="size-4 text-faint" />
              <p className="m-0 text-[14px] font-semibold text-foreground">Revenir à une base saine</p>
            </div>
            <p className="mb-4 mt-0 text-[12.5px] leading-5 text-muted">Réinitialise les préférences locales sans toucher à vos talks.</p>
            <Button leftIcon={<RotateCcw />} onClick={resetStudioPreferences} size="sm" type="button" variant="ghost">
              Réinitialiser les réglages
            </Button>
          </div>
        </aside>
      </section>

      <SettingsPanel
        icon={<FileText />}
        title="Modules par format"
        description="Vue d'ensemble des outils visibles par défaut selon le type de prise de parole."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {talkTypes.map((type) => (
            <article className="rounded-[10px] border border-border bg-background p-3" key={type}>
              <p className="m-0 text-[14px] font-semibold text-foreground">{talkTypeLabels[type]}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {defaultAssistantFeaturesByTalkType[type].map((featureId) => {
                  const feature = assistantFeatureDefinitions.find((item) => item.id === featureId);
                  return feature ? <Badge key={feature.id}>{feature.optionalLabel ?? feature.label}</Badge> : null;
                })}
                {settings.extraEnabledFeatures.map((featureId) => {
                  if (defaultAssistantFeaturesByTalkType[type].includes(featureId)) return null;
                  const feature = assistantFeatureDefinitions.find((item) => item.id === featureId);
                  return feature ? <Badge key={feature.id} tone="success">+ {feature.optionalLabel ?? feature.label}</Badge> : null;
                })}
              </div>
            </article>
          ))}
        </div>
      </SettingsPanel>
    </div>
  );
}

function SettingsPanel({ children, description, icon, title }: { children: ReactNode; description: string; icon: ReactNode; title: string }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent-muted text-accent-ink [&_svg]:size-4">{icon}</div>
        <div className="min-w-0">
          <h2 className="m-0 text-[18px] font-semibold tracking-[0] text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-6 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ detail, icon, label, value }: { detail: string; icon: ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-[12px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-[8px] bg-panel text-faint [&_svg]:size-4">{icon}</div>
      </div>
      <p className="m-0 text-[22px] font-semibold tracking-[0] text-foreground">{value}</p>
      <p className="m-0 mt-1 text-[12px] text-muted">{detail}</p>
    </article>
  );
}

function ToggleRow({
  checked,
  description,
  disabled = false,
  icon,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-background p-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-panel text-faint [&_svg]:size-4">{icon}</div>
        <div className="min-w-0">
          <p className="m-0 text-[14px] font-semibold text-foreground">{label}</p>
          <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">{description}</p>
        </div>
      </div>
      <SwitchButton checked={checked} disabled={disabled} label={checked ? "Activé" : "Désactivé"} onClick={() => onChange(!checked)} />
    </div>
  );
}

function ChoiceGroup({
  icon,
  label,
  onChange,
  options,
  value
}: {
  icon?: ReactNode;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        {icon ? <span className="text-faint [&_svg]:size-4">{icon}</span> : null}
        <p className="m-0 text-[13px] font-semibold text-foreground">{label}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              aria-pressed={active}
              className={`rounded-[8px] border px-2.5 py-1.5 text-[12px] font-[550] transition ${
                active ? "border-accent bg-accent-muted text-accent-ink" : "border-border bg-surface text-muted hover:text-foreground"
              }`}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SwitchButton({ checked, disabled = false, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      aria-pressed={checked}
      className={`inline-flex h-9 items-center gap-2 rounded-[9px] border px-3 text-[12.5px] font-[550] transition ${
        checked ? "border-accent bg-accent-muted text-accent-ink" : "border-border bg-surface text-muted hover:text-foreground"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {checked ? <Check className="size-4" /> : null}
      {label}
    </button>
  );
}

function formatVoiceProvider(provider: string) {
  if (provider === "browser") return "Navigateur";
  if (provider === "realtime") return "Temps réel";
  return "Auto";
}

function formatSpeed(speed: number) {
  return speed.toFixed(2).replace(/\.?0+$/, "");
}
