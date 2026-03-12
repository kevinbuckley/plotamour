"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/db/browser";
import Link from "next/link";

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function HomeContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/projects";

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { access_type: "offline" },
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <span className="text-lg font-semibold tracking-tight">plotamour</span>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12">
        <div className="w-full max-w-lg text-center">
          {/* Eyebrow */}
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            For hobby novelists
          </p>

          {/* Headline */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Plan your novel.
            <br />
            <span className="text-primary">Love every word.</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A visual story planner that maps your plotlines, characters, and
            scenes — then sends you straight into Google Docs to write.
          </p>

          {/* Sign-in button */}
          <button
            onClick={handleLogin}
            className="mt-10 inline-flex w-full max-w-xs items-center justify-center gap-3 rounded-lg border border-border bg-background px-6 py-3.5 text-sm font-medium shadow-sm transition-all hover:bg-muted hover:shadow-md active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google — it&apos;s free
          </button>

          <p className="mt-3 text-xs text-muted-foreground">
            No password needed. Just your Google account.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            emoji="📐"
            title="Visual Timeline"
            description="Color-coded grid of your plotlines, chapters, and scenes. Drag to rearrange."
          />
          <FeatureCard
            emoji="📝"
            title="Write in Google Docs"
            description="One click opens a Doc pre-loaded with your scene context and outline notes."
          />
          <FeatureCard
            emoji="👤"
            title="Story Bible"
            description="Characters, places, and notes — all linked to the scenes where they appear."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-5 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/kevinbuckley/plotamour"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span>·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/termsofservice" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-5 py-5 text-left">
      <div className="mb-2 text-2xl">{emoji}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
