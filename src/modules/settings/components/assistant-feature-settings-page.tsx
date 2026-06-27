"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  CircleHelp,
  FileText,
  Gauge,
  LifeBuoy,
  Mic2,
  Monitor,
  Moon,
  Palette,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Type,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import {
  defaultAssistantFeaturesByTalkType,
  getAssistantFeatureDefinitions,
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
  resolvePredictiveWritingPreference,
  voiceProviderOptions,
  voiceProviderStorageKey,
  writeStudioPreference
} from "@/modules/settings/studio-preferences";
import {
  getGuidedTalkSuggestion,
  getOnboardingAssistantFeatureSettings,
  type OnboardingProfile
} from "@/modules/onboarding/personalization";
import { talkTypeLabels, type TalkType } from "@/types/talk";

const talkTypes = Object.keys(talkTypeLabels) as TalkType[];
const coreFeatureIds = ["outline", "expand-section", "oralize-section", "shorten-section", "predict-next", "suggest-bible"] as const;

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

export function AssistantFeatureSettingsPage({ profile }: { profile?: OnboardingProfile | null }) {
  const { locale, messages } = useI18n();
  const copy = messages.settings;
  const { settings, setFeatureEnabled } = useAssistantFeatureSettings();
  const assistantFeatureDefinitions = getAssistantFeatureDefinitions(locale);
  const optionalFeatures = getAssistantOptionalFeatures(locale);
  const [aiEnabled, setAiEnabled] = useStoredBooleanPreference(aiEnabledStorageKey, true);
  const [predictiveWritingEnabled, setPredictiveWritingEnabled] = useStoredBooleanPreference(predictiveWritingStorageKey, false);
  const [prompterTheme, setPrompterTheme] = useStoredPreference(prompterThemeStorageKey, defaultPrompterTheme);
  const [prompterSpeed, setPrompterSpeed] = useStoredPreference(prompterSpeedStorageKey, String(defaultPrompterSpeed));
  const [prompterFontSize, setPrompterFontSize] = useStoredPreference(prompterFontSizeStorageKey, String(defaultPrompterFontSize));
  const [voiceProvider, setVoiceProvider] = useStoredPreference(voiceProviderStorageKey, defaultVoiceProvider);
  const extraFeatureCount = settings.extraEnabledFeatures.length;
  const guidedTalk = getGuidedTalkSuggestion(profile, locale);
  const onboardingFeatureSettings = getOnboardingAssistantFeatureSettings(profile);

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
    <div className="grid min-w-0 max-w-full gap-6">
      <section className="w-full overflow-hidden rounded-[14px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)]">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_380px] md:p-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[8px] border border-line bg-panel px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">
              <SlidersHorizontal className="size-3.5" />
              {copy.console}
            </div>
            <h2 className="mb-0 mt-4 max-w-2xl text-[28px] font-semibold leading-[1.06] tracking-[0] text-foreground md:text-[36px]">
              {copy.heroTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
              {copy.heroBody}
            </p>
          </div>

          <div className="rounded-[12px] border border-line bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="m-0 font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">{copy.currentState}</p>
              <span className="rounded-[6px] bg-accent-muted px-2 py-1 text-[11px] font-semibold text-accent-ink">{copy.local}</span>
            </div>
            <div className="grid gap-2">
              <StatusLine icon={<Bot />} label={copy.assistant} value={aiEnabled ? copy.assistantActive : copy.assistantHidden} />
              <StatusLine icon={<BrainCircuit />} label={copy.prediction} value={predictiveWritingEnabled ? copy.predictionActive : copy.predictionOff} />
              <StatusLine icon={<Monitor />} label={copy.teleprompter} value={`${prompterTheme === "light" ? messages.ui.themeLight : messages.ui.themeDark} · ${prompterSpeed}x · ${prompterFontSize}px`} />
              <StatusLine icon={<Sparkles />} label={copy.extraModules} value={extraFeatureCount ? String(extraFeatureCount) : copy.none} />
            </div>
          </div>
        </div>
      </section>

      {profile ? (
        <section className="grid w-full gap-3 rounded-[14px] border border-[color-mix(in_oklab,var(--accent)_20%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="m-0 font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">{copy.onboardingProfile}</p>
            <h2 className="m-0 mt-1 text-[18px] font-semibold tracking-[0] text-foreground">
              {copy.recommendedBase.replace("{type}", talkTypeLabels[guidedTalk.type])}
            </h2>
            <p className="m-0 mt-1 text-[13px] leading-6 text-muted">
              {copy.profileBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {onboardingFeatureSettings.extraEnabledFeatures.length ? onboardingFeatureSettings.extraEnabledFeatures.map((featureId) => {
              const feature = assistantFeatureDefinitions.find((item) => item.id === featureId);
              return feature ? (
                <span className="rounded-[7px] border border-accent bg-accent-muted px-2 py-1 text-[11.5px] font-[550] text-accent-ink" key={featureId}>
                  {feature.optionalLabel ?? feature.label}
                </span>
              ) : null;
            }) : (
              <span className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[11.5px] font-[550] text-muted">
                {copy.standardModules}
              </span>
            )}
          </div>
        </section>
      ) : null}

      <section className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid min-w-0 gap-6">
          <SettingsPanel
            eyebrow={copy.writingEyebrow}
            icon={<Wand2 />}
            title={copy.assistantEditorTitle}
            description={copy.assistantEditorBody}
          >
            <div className="grid gap-3">
              <ToggleRow
                checked={aiEnabled}
                description={copy.showAiBody}
                icon={<Bot />}
                label={copy.showAi}
                onChange={setAiEnabled}
              />
              <ToggleRow
                checked={predictiveWritingEnabled}
                description={copy.predictiveWritingBody}
                icon={<BrainCircuit />}
                label={copy.predictiveWriting}
                onChange={(nextValue) => {
                  const nextPreferences = resolvePredictiveWritingPreference(
                    { aiEnabled, predictiveWritingEnabled },
                    nextValue
                  );
                  setAiEnabled(nextPreferences.aiEnabled);
                  setPredictiveWritingEnabled(nextPreferences.predictiveWritingEnabled);
                }}
              />
            </div>
          </SettingsPanel>

          <SettingsPanel
            eyebrow={copy.prompterEyebrow}
            icon={<Monitor />}
            title={copy.readingBaseTitle}
            description={copy.readingBaseBody}
          >
            <div className="grid gap-4">
              <PreferenceBlock icon={<Palette />} label={copy.defaultAppearance} note={copy.defaultAppearanceNote}>
                <SegmentedChoice
                  onChange={setPrompterTheme}
                  options={[
                    { icon: <Moon />, label: messages.ui.themeDark, value: "dark" },
                    { icon: <Sun />, label: messages.ui.themeLight, value: "light" }
                  ]}
                  value={prompterTheme}
                />
              </PreferenceBlock>

              <PreferenceBlock icon={<Gauge />} label={copy.autoSpeed} note={copy.autoSpeedNote}>
                <SegmentedChoice
                  compact
                  onChange={setPrompterSpeed}
                  options={prompterSpeedOptions.map((speed) => ({ label: `${formatSpeed(speed)}x`, value: String(speed) }))}
                  value={prompterSpeed}
                />
              </PreferenceBlock>

              <PreferenceBlock icon={<Type />} label={copy.textSize} note={copy.textSizeNote}>
                <SegmentedChoice
                  onChange={setPrompterFontSize}
                  options={prompterFontSizeOptions.map((size) => ({ label: `${size}px`, value: String(size) }))}
                  value={prompterFontSize}
                />
              </PreferenceBlock>

              <PreferenceBlock icon={<Mic2 />} label={copy.voiceFollow} note={copy.voiceFollowNote}>
                <SegmentedChoice
                  onChange={setVoiceProvider}
                  options={voiceProviderOptions.map((provider) => ({ icon: provider === "deepgram" ? <Radio /> : undefined, label: formatVoiceProvider(provider), value: provider }))}
                  value={voiceProvider}
                />
              </PreferenceBlock>
            </div>
          </SettingsPanel>
        </div>

        <aside className="grid min-w-0 content-start gap-6">
          <SettingsPanel
            eyebrow={copy.advanced}
            icon={<Sparkles />}
            title={copy.specialModules}
            description={copy.specialModulesBody}
            compact
          >
            <div className="grid gap-3">
              {optionalFeatures.map((feature) => {
                const enabled = settings.extraEnabledFeatures.includes(feature.id);
                return (
                  <FeatureOption
                    checked={enabled}
                    defaultText={copy.defaultFor.replace("{types}", feature.defaultTalkTypes.map((type) => talkTypeLabels[type]).join(", "))}
                    description={feature.description}
                    key={feature.id}
                    label={feature.optionalLabel ?? feature.label}
                    onToggle={() => setFeatureEnabled(feature.id, !enabled)}
                    switchLabels={{ checked: copy.enabled, unchecked: copy.enable }}
                  />
                );
              })}
            </div>
          </SettingsPanel>

          <section className="rounded-[14px] border border-[color-mix(in_oklab,var(--accent)_22%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))] p-4 text-foreground shadow-[0_1px_2px_rgba(20,20,25,.03)] sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent-muted text-accent-ink">
                <LifeBuoy className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-[17px] font-semibold tracking-[0]">{copy.helpTitle}</h2>
                <p className="mb-4 mt-2 max-w-[28rem] text-[13px] leading-6 text-muted">
                  {copy.helpBody}
                </p>
                <a className="inline-flex min-h-9 items-center justify-center rounded-[8px] border border-transparent bg-accent px-3 py-2 text-[12.5px] font-semibold leading-none text-white shadow-[0_1px_2px_rgba(20,20,25,.08)] transition hover:opacity-90 focus:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_24%,transparent)]" href="mailto:support@solo-speaker.app?subject=Besoin%20d'aide%20Solo%20Speaker">
                  {copy.contactHelp}
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,25,.03)]">
            <div className="mb-3 flex items-center gap-2">
              <RotateCcw className="size-4 text-faint" />
              <h2 className="m-0 text-[15px] font-semibold text-foreground">{copy.resetTitle}</h2>
            </div>
            <p className="mb-4 mt-0 text-[12.5px] leading-5 text-muted">{copy.resetBody}</p>
            <Button leftIcon={<RotateCcw />} onClick={resetStudioPreferences} size="sm" type="button" variant="ghost">
              {copy.reset}
            </Button>
          </section>
        </aside>
      </section>

      <SettingsPanel
        eyebrow={copy.formatsEyebrow}
        icon={<FileText />}
        title={copy.visibleModulesTitle}
        description={copy.visibleModulesBody}
      >
        <div className="overflow-x-auto rounded-[12px] border border-border">
          <table className="w-full min-w-[760px] border-collapse bg-background text-left">
            <thead>
              <tr className="border-b border-border bg-panel">
                <th className="w-[150px] px-4 py-3 text-[12px] font-semibold text-foreground">{copy.format}</th>
                {coreFeatureIds.map((featureId) => {
                  return (
                    <th className="px-3 py-3 text-center text-[11px] font-semibold text-muted" key={featureId}>
                      {copy.featureShortLabels[featureId]}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {talkTypes.map((type) => (
                <tr className="border-b border-border last:border-b-0" key={type}>
                  <th className="px-4 py-3 text-[13px] font-semibold text-foreground">{talkTypeLabels[type]}</th>
                  {coreFeatureIds.map((featureId) => {
                    const isDefault = defaultAssistantFeaturesByTalkType[type].includes(featureId);
                    const isExtra = settings.extraEnabledFeatures.includes(featureId) && !isDefault;
                    return (
                      <td className="px-3 py-3 text-center" key={featureId}>
                        <FeatureMark active={isDefault || isExtra} extra={isExtra} labels={{ availableDefault: copy.availableDefault, enabledExtra: copy.enabledExtra, unavailable: copy.unavailable }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsPanel>
    </div>
  );
}

function SettingsPanel({
  children,
  compact = false,
  description,
  eyebrow,
  icon,
  title
}: {
  children: ReactNode;
  compact?: boolean;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className={`min-w-0 rounded-[14px] border border-border bg-surface shadow-[0_1px_2px_rgba(20,20,25,.03)] ${compact ? "p-4" : "p-5 md:p-6"}`}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-muted text-accent-ink [&_svg]:size-4">{icon}</div>
        <div className="min-w-0">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{eyebrow}</p>
          <h2 className="m-0 mt-1 text-[20px] font-semibold leading-tight tracking-[0] text-foreground">{title}</h2>
          <p className="m-0 mt-1 max-w-2xl text-[13px] leading-6 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[9px] border border-border bg-surface px-3 py-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-panel text-faint [&_svg]:size-3.5">{icon}</span>
      <span className="min-w-0 flex-1 text-[12px] text-muted">{label}</span>
      <span className="truncate text-right text-[12px] font-semibold text-foreground">{value}</span>
    </div>
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
  const { messages } = useI18n();

  return (
    <div className="grid gap-3 rounded-[12px] border border-border bg-background p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-panel text-faint [&_svg]:size-4">{icon}</div>
        <div className="min-w-0">
          <p className="m-0 text-[14px] font-semibold text-foreground">{label}</p>
          <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">{description}</p>
        </div>
      </div>
      <SwitchButton checked={checked} disabled={disabled} label={checked ? messages.settings.enabled : messages.settings.disabled} onClick={() => onChange(!checked)} />
    </div>
  );
}

function PreferenceBlock({ children, icon, label, note }: { children: ReactNode; icon: ReactNode; label: string; note: string }) {
  return (
    <div className="grid gap-3 rounded-[12px] border border-border bg-background p-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-panel text-faint [&_svg]:size-4">{icon}</span>
        <div className="min-w-0">
          <p className="m-0 text-[13.5px] font-semibold text-foreground">{label}</p>
          <p className="m-0 mt-1 text-[12px] leading-5 text-muted">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SegmentedChoice({
  compact = false,
  onChange,
  options,
  value
}: {
  compact?: boolean;
  onChange: (value: string) => void;
  options: Array<{ icon?: ReactNode; label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-pressed={active}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border px-3 text-[12.5px] font-[550] leading-none transition focus:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_20%,transparent)] ${
              compact ? "min-w-12 px-2.5" : "min-w-20"
            } ${active ? "border-accent bg-accent-muted text-accent-ink" : "border-border bg-surface text-muted hover:text-foreground"}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon ? <span className="flex [&_svg]:size-3.5">{option.icon}</span> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function FeatureOption({
  checked,
  defaultText,
  description,
  label,
  onToggle,
  switchLabels
}: {
  checked: boolean;
  defaultText: string;
  description: string;
  label: string;
  onToggle: () => void;
  switchLabels: { checked: string; unchecked: string };
}) {
  return (
    <div className="rounded-[12px] border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[14px] font-semibold text-foreground">{label}</p>
          <p className="m-0 mt-1 text-[12.5px] leading-5 text-muted">{description}</p>
        </div>
        <SwitchButton checked={checked} label={checked ? switchLabels.checked : switchLabels.unchecked} onClick={onToggle} />
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-[7px] bg-panel px-2 py-1 font-mono text-[10px] uppercase tracking-[.1em] text-faint">
        <CircleHelp className="size-3" />
        {defaultText}
      </div>
    </div>
  );
}

function SwitchButton({ checked, disabled = false, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      aria-pressed={checked}
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[999px] border py-1 pl-1.5 pr-3 text-[12.5px] font-[550] transition focus:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-45 ${
        checked ? "border-accent bg-accent-muted text-accent-ink" : "border-border bg-surface text-muted hover:text-foreground"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className={`flex size-5 items-center justify-center rounded-full ${checked ? "bg-accent text-white" : "bg-panel text-faint"}`}>{checked ? <Check className="size-3.5" /> : null}</span>
      {label}
    </button>
  );
}

function FeatureMark({ active, extra, labels }: { active: boolean; extra: boolean; labels: { availableDefault: string; enabledExtra: string; unavailable: string } }) {
  if (!active) return <span className="mx-auto block h-px w-5 bg-line" aria-label={labels.unavailable} />;

  return (
    <span
      className={`mx-auto flex size-6 items-center justify-center rounded-full ${
        extra ? "bg-[color-mix(in_oklab,var(--ok)_14%,transparent)] text-ok" : "bg-accent-muted text-accent-ink"
      }`}
      aria-label={extra ? labels.enabledExtra : labels.availableDefault}
      title={extra ? labels.enabledExtra : labels.availableDefault}
    >
      <Check className="size-3.5" />
    </span>
  );
}

function formatVoiceProvider(provider: string) {
  if (provider === "browser") return "Navigateur";
  if (provider === "deepgram") return "Deepgram";
  return "Auto";
}

function formatSpeed(speed: number) {
  return speed.toFixed(2).replace(/\.?0+$/, "");
}
