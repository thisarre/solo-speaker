import { cn } from "@/lib/utils";

type AssistantCharacterProps = {
  className?: string;
  state?: "idle" | "thinking";
};

// Friendly animated mascot for the help assistant. Idle: gentle bob + blink. Thinking: looks up and
// tilts side to side. Motion lives in globals.css (`.assistant-char*`) so it respects the global
// reduced-motion guard. Features use currentColor, so the parent sets the tint.
export function AssistantCharacter({ className, state = "idle" }: AssistantCharacterProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("assistant-char", state === "thinking" && "is-thinking", className)}
      fill="none"
      viewBox="0 0 32 32"
    >
      <g className="assistant-char-eyes">
        <rect className="assistant-char-eye" fill="currentColor" height="6.4" rx="1.7" width="3.4" x="9.8" y="11.6" />
        <rect className="assistant-char-eye" fill="currentColor" height="6.4" rx="1.7" width="3.4" x="18.8" y="11.6" />
      </g>
      <path className="assistant-char-mouth" d="M11 21.4q5 4 10 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" />
    </svg>
  );
}
