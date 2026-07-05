"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { AssistantCharacter } from "./assistant-character";
import { askHelpAssistant } from "../help-assistant-client";
import type { HelpAction, HelpChatMessage } from "../help-assistant";
import { getHelpAssistantWidgetState } from "../help-assistant-widget-state";

type RenderedMessage = HelpChatMessage & {
  id: string;
};

export function HelpAssistantWidget() {
  const pathname = usePathname();
  const { locale, messages } = useI18n();
  const copy = messages.helpAssistant;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [actions, setActions] = useState<HelpAction[]>([]);
  const [error, setError] = useState("");
  const messageIdRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [conversation, setConversation] = useState<RenderedMessage[]>([
    {
      content: copy.initialMessage,
      id: "initial",
      role: "assistant"
    }
  ]);
  const history = useMemo<HelpChatMessage[]>(() => conversation.map(({ content, role }) => ({ content, role })), [conversation]);
  const hasUserMessage = conversation.some((message) => message.role === "user");
  const widgetState = getHelpAssistantWidgetState({ hasUserMessage, isOpen: open, isPending });

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, isPending, open]);

  function nextMessageId(prefix: string) {
    messageIdRef.current += 1;
    return `${prefix}-${messageIdRef.current}`;
  }

  function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;

    const userMessage: RenderedMessage = {
      content: trimmed,
      id: nextMessageId("user"),
      role: "user"
    };

    setInput("");
    setError("");
    setConversation((current) => [...current, userMessage]);

    startTransition(async () => {
      try {
        const result = await askHelpAssistant({
          currentPath: pathname,
          history,
          locale,
          question: trimmed
        });
        const assistantContent = [result.answer, result.followUp].filter(Boolean).join("\n\n");
        setActions(result.actions);
        setConversation((current) => [
          ...current,
          {
            content: assistantContent,
            id: nextMessageId("assistant"),
            role: "assistant"
          }
        ]);
      } catch {
        setError(copy.error);
        setConversation((current) => [
          ...current,
          {
            content: copy.error,
            id: nextMessageId("assistant-error"),
            role: "assistant"
          }
        ]);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(input);
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 md:bottom-5 md:left-auto md:right-5">
      {open ? (
        <section className="solo-help-panel mb-3 grid max-h-[min(720px,calc(100vh-120px))] w-[min(440px,calc(100vw-28px))] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[22px] border border-[color-mix(in_oklab,var(--accent)_22%,var(--line))] bg-[color-mix(in_oklab,var(--surface)_92%,var(--panel))] shadow-[0_26px_90px_rgba(10,10,16,.28)] backdrop-blur-xl">
          <header className="relative overflow-hidden border-b border-[color-mix(in_oklab,var(--accent)_14%,var(--line))] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--surface)_92%,var(--accent-bg)),var(--panel))] p-4">
            <div className="solo-help-scan" />
            <div className="relative flex items-start gap-3">
              <span className="solo-help-avatar flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface))] text-accent-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_24%,transparent)]">
                <AssistantCharacter className="size-7" state={widgetState.activity === "thinking" ? "thinking" : "idle"} />
              </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-[15px] font-semibold text-foreground">{copy.title}</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--accent)_18%,var(--line))] bg-surface/70 px-2 py-1 text-[11px] font-[550] text-accent-ink">
                    <span className="solo-help-status-dot" />
                    {copy.status[widgetState.activity]}
                  </span>
                </div>
                <p className="m-0 mt-1.5 text-[12.5px] leading-5 text-muted">{copy.subtitle}</p>
            </div>
            <button
              aria-label={copy.close}
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-muted transition hover:bg-surface hover:text-foreground"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
            </div>
          </header>

          <div className="studio-scroll grid min-h-0 content-start gap-3 overflow-y-auto bg-[linear-gradient(180deg,color-mix(in_oklab,var(--panel)_74%,transparent),color-mix(in_oklab,var(--surface)_78%,transparent))] p-4">
            {conversation.map((message) => (
              <div
                className={cn(
                  "solo-help-message max-w-[88%] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-5",
                  message.role === "user"
                    ? "ml-auto rounded-br-[7px] bg-[linear-gradient(135deg,var(--accent),color-mix(in_oklab,var(--accent)_72%,var(--ok)))] text-white shadow-[0_10px_30px_rgba(103,92,255,.24)]"
                    : "mr-auto rounded-bl-[7px] border border-[color-mix(in_oklab,var(--accent)_12%,var(--line))] bg-background text-foreground shadow-[0_8px_24px_rgba(20,20,25,.06)]"
                )}
                key={message.id}
              >
                {message.content.split("\n").map((line, index) => (
                  <p className="m-0 empty:hidden" key={`${message.id}-${index}`}>
                    {line}
                  </p>
                ))}
              </div>
            ))}

            {widgetState.shouldShowTyping ? (
              <div className="solo-help-message mr-auto flex max-w-[80%] items-center gap-2 rounded-[18px] rounded-bl-[7px] border border-[color-mix(in_oklab,var(--accent)_12%,var(--line))] bg-background px-3.5 py-3 text-[12px] text-muted shadow-[0_8px_24px_rgba(20,20,25,.06)]">
                <span className="sr-only">{copy.typing}</span>
                <span aria-hidden className="solo-help-typing">
                  <span />
                  <span />
                  <span />
                </span>
                <span>{copy.sending}</span>
              </div>
            ) : null}

            {actions.length ? (
              <div className="solo-help-message mr-auto grid max-w-full gap-2 rounded-[18px] border border-[color-mix(in_oklab,var(--accent)_14%,var(--line))] bg-background p-3 shadow-[0_8px_24px_rgba(20,20,25,.06)]">
                <p className="m-0 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-faint">
                  <Sparkles className="size-3.5 text-accent-ink" />
                  {copy.suggestedActions}
                </p>
                <div className="grid gap-1.5">
                  {actions.map((action) => (
                    <Link className="group flex items-center justify-between gap-3 rounded-[12px] border border-line bg-surface px-3 py-2 text-[12.5px] font-[550] text-foreground transition hover:border-accent hover:bg-accent-muted hover:text-accent-ink" href={action.href} key={`${action.href}-${action.label}`}>
                      <span>{action.label}</span>
                      <ArrowRight className="size-3.5 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {widgetState.shouldShowQuickQuestions ? (
              <div className="solo-help-message grid gap-2">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[.08em] text-faint">{copy.quickQuestionsTitle}</p>
                {copy.quickQuestions.map((question) => (
                  <button
                    className="group flex items-center justify-between gap-3 rounded-[14px] border border-line bg-background px-3 py-2.5 text-left text-[12.5px] font-[550] text-muted shadow-[0_1px_2px_rgba(20,20,25,.03)] transition hover:-translate-y-0.5 hover:border-accent hover:text-foreground hover:shadow-[0_10px_26px_rgba(20,20,25,.08)]"
                    key={question}
                    onClick={() => submitQuestion(question)}
                    type="button"
                  >
                    <span>{question}</span>
                    <ArrowRight className="size-3.5 shrink-0 opacity-45 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="flex items-end gap-2 border-t border-[color-mix(in_oklab,var(--accent)_14%,var(--line))] bg-background/96 p-3.5" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="help-assistant-question">{copy.composerLabel}</label>
            <input
              className="min-h-11 min-w-0 flex-1 rounded-[14px] border border-border bg-surface px-3.5 text-[13px] text-foreground outline-none placeholder:text-faint transition focus:border-accent focus:bg-background focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_12%,transparent)]"
              disabled={isPending}
              id="help-assistant-question"
              onChange={(event) => setInput(event.target.value)}
              placeholder={copy.placeholder}
              value={input}
            />
            <button
              aria-label={isPending ? copy.sending : copy.send}
              className={cn(buttonClassName({ size: "icon", variant: "primary" }), "h-11 w-11 rounded-[14px] shadow-[0_10px_28px_rgba(20,20,25,.16)]")}
              disabled={isPending}
              type="submit"
            >
              <Send className="size-4" />
            </button>
          </form>
          {error ? <span className="sr-only">{error}</span> : null}
        </section>
      ) : null}

      <button
        aria-expanded={open}
        aria-label={copy.open}
        className="solo-help-launcher ml-auto flex h-[52px] items-center gap-2 rounded-[999px] border border-[color-mix(in_oklab,var(--accent)_24%,var(--line))] bg-[linear-gradient(135deg,var(--accent),color-mix(in_oklab,var(--accent)_68%,var(--ok)))] px-4 text-[13px] font-semibold text-white shadow-[0_14px_42px_rgba(20,20,25,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_54px_rgba(20,20,25,.30)]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="relative flex size-6 items-center justify-center rounded-full bg-white/16">
          {open ? <MessageCircle className="size-4" /> : <AssistantCharacter className="size-5" state="idle" />}
        </span>
        <span className="hidden sm:inline">{copy.title}</span>
      </button>
    </div>
  );
}
