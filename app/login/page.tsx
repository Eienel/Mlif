import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = searchParams.next ?? "/account";
  if (user) redirect(next);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Sign in to Premise
        </h1>
        <p className="mt-2 text-center text-muted">
          Save a watchlist and go unlimited with Pro.
        </p>
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
