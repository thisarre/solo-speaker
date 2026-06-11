import Link from "next/link";
import { signUp } from "@/modules/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-[360px]">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <h1 className="m-0 text-center text-[21px] font-semibold tracking-[0]">Créer ton studio</h1>
        <p className="mb-6 mt-1 text-center text-[13.5px] text-mute">Une base statique pour préparer les prochains écrans produit.</p>
        {params.error ? <p className="mb-4 rounded-lg border border-line bg-surface p-3 text-[12.5px] text-[var(--danger)]">{params.error}</p> : null}
        <form action={signUp} className="grid gap-3.5">
          <Input id="name" label="Nom" name="name" placeholder="Thierno" />
          <Input id="email" label="Email" name="email" placeholder="you@example.com" required type="email" />
          <Input id="password" label="Mot de passe" minLength={6} name="password" placeholder="••••••••" required type="password" />
          <Button className="w-full" type="submit" variant="primary">Signup</Button>
        </form>
        <p className="mt-5 text-center text-[12.5px] text-faint">
          Déjà inscrit ? <Link className="font-medium text-mute hover:text-ink" href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
