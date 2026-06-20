import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/modules/auth/actions";
import { getProfile, getUser } from "@/modules/auth/queries";
import { Alert } from "@/components/ui/Alert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const user = await getUser();

  if (user) {
    const profile = await getProfile();
    if (profile && !profile.onboarding_completed_at) {
      redirect("/onboarding");
    }
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-[360px]">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">Créer votre studio</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] text-mute">Structurez vos idées, améliorez votre texte, puis répétez avec un prompteur vocal.</p>
        {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}
        <form action={signUp} className="grid gap-3.5">
          <Input id="name" label="Nom" name="name" placeholder="Thierno" />
          <Input id="email" label="Email" name="email" placeholder="you@example.com" required type="email" />
          <Input id="password" label="Mot de passe" minLength={6} name="password" placeholder="••••••••" required type="password" />
          <AuthSubmitButton idleLabel="Créer mon compte" pendingLabel="Création..." />
        </form>
        <p className="mt-5 text-center text-[12.5px] text-faint">
          Déjà inscrit ? <Link className="font-medium text-mute hover:text-ink" href="/login">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
