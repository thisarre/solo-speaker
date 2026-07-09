"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { PasswordToggleInput } from "@/components/auth/PasswordToggleInput";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { getPasswordPolicyError, PASSWORD_MIN_LENGTH, scorePassword, type PasswordStrength } from "@/modules/auth/password-strength";

const STRENGTH_UI: Record<PasswordStrength, { bars: number; bar: string; text: string }> = {
  weak: { bars: 1, bar: "bg-red-500", text: "text-red-500" },
  medium: { bars: 2, bar: "bg-amber-500", text: "text-amber-500" },
  strong: { bars: 3, bar: "bg-green-500", text: "text-green-500" }
};

function SubmitButton({ disabled, idleLabel, pendingLabel }: { disabled: boolean; idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending || disabled} leftIcon={pending ? <Loader2 className="animate-spin" /> : undefined} type="submit" variant="primary">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

type PasswordFieldsProps = {
  locale: Locale;
  submitIdleLabel: string;
  submitPendingLabel: string;
  passwordLabel?: string;
  withConfirm?: boolean;
};

export function PasswordFields({ locale, submitIdleLabel, submitPendingLabel, passwordLabel, withConfirm = false }: PasswordFieldsProps) {
  const auth = getMessages(locale).auth;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const { strength } = scorePassword(password);
  const ui = STRENGTH_UI[strength];
  const strengthLabel = strength === "weak" ? auth.passwordStrengthWeak : strength === "medium" ? auth.passwordStrengthMedium : auth.passwordStrengthStrong;

  const confirmTouched = withConfirm && confirm.length > 0;
  const confirmMismatch = confirmTouched && confirm !== password;
  const invalid = getPasswordPolicyError(password) !== null || (withConfirm && password !== confirm);

  return (
    <>
      <div className="grid gap-1.5">
        <PasswordToggleInput
          autoComplete="new-password"
          id="password"
          label={passwordLabel ?? auth.password}
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          value={password}
        />
        {password.length > 0 ? (
          <div aria-live="polite" className="flex items-center gap-2">
            <div aria-hidden="true" className="flex flex-1 gap-1">
              {[0, 1, 2].map((index) => (
                <span className={`h-1 flex-1 rounded-full transition-colors ${index < ui.bars ? ui.bar : "bg-line"}`} key={index} />
              ))}
            </div>
            <span className={`text-[11px] font-semibold ${ui.text}`}>{strengthLabel}</span>
          </div>
        ) : null}
        <p className="m-0 text-[11px] leading-4 text-faint">{auth.passwordHint}</p>
      </div>

      {withConfirm ? (
        <div className="grid gap-1.5">
          <PasswordToggleInput
            autoComplete="new-password"
            id="confirmPassword"
            label={auth.confirmPassword}
            minLength={PASSWORD_MIN_LENGTH}
            name="confirmPassword"
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="••••••••"
            required
            value={confirm}
          />
          {confirmTouched ? (
            <p aria-live="polite" className={`m-0 text-[11px] font-medium ${confirmMismatch ? "text-red-500" : "text-green-500"}`}>
              {confirmMismatch ? auth.passwordsDontMatch : auth.passwordsMatch}
            </p>
          ) : null}
        </div>
      ) : null}

      <SubmitButton disabled={invalid} idleLabel={submitIdleLabel} pendingLabel={submitPendingLabel} />
    </>
  );
}
