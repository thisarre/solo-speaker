import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/modules/auth/actions";
import { getUser } from "@/modules/auth/queries";
import { Alert } from "@/components/ui/Alert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getUser();

  if (user) {
    redirect(params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-[360px]">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">Retour au studio</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] text-mute">Connectez-vous pour reprendre vos prises de parole.</p>
        {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}
        {params.message ? <p className="mb-4 rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] leading-5 text-mute">{params.message}</p> : null}
        <form action={login} className="grid gap-3.5">
          <input name="next" type="hidden" value={params.next ?? "/dashboard"} />
          <Input id="email" label="Email" name="email" placeholder="you@example.com" required type="email" />
          <Input id="password" label="Mot de passe" minLength={6} name="password" placeholder="••••••••" required type="password" />
          <AuthSubmitButton idleLabel="Se connecter" pendingLabel="Connexion..." />
        </form>
        <p className="mt-5 text-center text-[12.5px] text-faint">
          Pas encore de compte ? <Link className="font-medium text-mute hover:text-ink" href="/signup">Créer un compte</Link>
        </p>
      </div>
      <p className="absolute bottom-7 font-mono text-[10.5px] uppercase tracking-[.1em] text-faint">Solo Speaker</p>
    </main>
  );
}
