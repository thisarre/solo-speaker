"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string };

export function PasswordToggleInput(props: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      rightElement={
        <button
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-mute"
          onClick={() => setVisible((v) => !v)}
          type="button"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      type={visible ? "text" : "password"}
    />
  );
}
