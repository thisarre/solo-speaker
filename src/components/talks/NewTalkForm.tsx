"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createTalk } from "@/modules/talks/actions";
import { talkTypeLabels, type TalkType } from "@/types/talk";

const talkTypes = Object.keys(talkTypeLabels) as TalkType[];

type NewTalkFormProps = {
  error?: string;
};

export function NewTalkForm({ error }: NewTalkFormProps) {
  const [title, setTitle] = useState("");
  const [clientError, setClientError] = useState("");

  return (
    <form
      action={createTalk}
      className="grid gap-3.5"
      noValidate
      onSubmit={(event) => {
        if (!title.trim()) {
          event.preventDefault();
          setClientError("Ajoute un titre pour créer le brouillon.");
        }
      }}
    >
      {error || clientError ? (
        <Alert>{clientError || error}</Alert>
      ) : null}

      <Input
        id="title"
        label="Titre"
        name="title"
        onChange={(event) => {
          setTitle(event.target.value);
          if (clientError) setClientError("");
        }}
        placeholder="Ex. L'art de capter une salle en 90 secondes"
        required
        value={title}
      />
      <Input id="audience" label="Audience" name="audience" placeholder="Managers · ~80 pers." />
      <div>
        <p className="mb-2 text-xs font-[550] text-muted">Type</p>
        <div className="flex flex-wrap gap-1.5">
          {talkTypes.map((type, index) => (
            <label className="cursor-pointer" key={type}>
              <input className="peer sr-only" defaultChecked={index === 1} name="type" type="radio" value={type} />
              <span className="studio-chip inline-flex h-8 items-center rounded-[8px] border border-border bg-surface px-3 font-[550] text-muted shadow-[0_1px_2px_rgba(20,20,25,.02)] transition hover:text-foreground peer-checked:border-transparent peer-checked:bg-foreground peer-checked:text-background">
                {talkTypeLabels[type]}
              </span>
            </label>
          ))}
        </div>
      </div>
      <Textarea id="brief" label="Brief" name="brief" placeholder="Décris l'objectif, le contexte, le ton et la durée cible." />
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Link href="/talks">
          <Button variant="ghost">Annuler</Button>
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} leftIcon={pending ? <Loader2 className="animate-spin" /> : undefined} type="submit" variant="primary">
      {pending ? "Création..." : "Créer le brouillon"}
    </Button>
  );
}
