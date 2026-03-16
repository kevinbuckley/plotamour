"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
  const router = useRouter();
  const next = searchParams.get("next") ?? "/projects";
  const code = searchParams.get("code");
  const [exchangingCode, setExchangingCode] = useState(!!code);

  // Handle auth code that Supabase redirects to the Site URL (PKCE flow)
  useEffect(() => {
    if (!code) return;
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!error) {
        router.replace(next);
      } else {
        console.error("Code exchange failed:", error.message);
        setExchangingCode(false);
        // Clear the code from URL
        router.replace("/");
      }
    });
  }, [code, next, router]);

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

  if (exchangingCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-3 text-2xl animate-pulse">✨</div>
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">
            plot<span className="text-primary">amour</span>
          </span>
        </div>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md hover:text-primary"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-10">
        {/* Gradient atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 700,
            height: 500,
            background:
              "radial-gradient(ellipse at center, oklch(0.488 0.183 274.376 / 0.10) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[60%] top-[30%] -translate-y-1/2"
          style={{
            width: 400,
            height: 300,
            background:
              "radial-gradient(ellipse at center, oklch(0.55 0.2 310 / 0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative w-full max-w-lg text-center">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
            For hobby novelists
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl leading-tight">
            Plan your novel.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.488 0.183 274.376), oklch(0.55 0.2 310))" }}
            >
              Love every word.
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A visual story planner that maps your plotlines, characters, and
            scenes — then sends you straight into Google Docs to write.
          </p>

          {/* Sign-in button */}
          <button
            onClick={handleLogin}
            className="mt-10 inline-flex w-full max-w-xs items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_oklch(0.488_0.183_274.376/0.12)] active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google — it&apos;s free
          </button>

          <p className="mt-3 text-xs text-muted-foreground">
            No password needed. Just your Google account.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative mt-20 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            emoji="📐"
            title="Visual Timeline"
            description="Color-coded grid of your plotlines, chapters, and scenes. Drag to rearrange."
            accentColor="240"
          />
          <FeatureCard
            emoji="📝"
            title="Write in Google Docs"
            description="One click opens a Doc pre-loaded with your scene context and outline notes."
            accentColor="274"
          />
          <FeatureCard
            emoji="👤"
            title="Story Bible"
            description="Characters, places, and notes — all linked to the scenes where they appear."
            accentColor="165"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 px-8 py-5 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/kevinbuckley/plotamour"
            className="transition-colors hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="text-border">·</span>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <span className="text-border">·</span>
          <Link href="/termsofservice" className="transition-colors hover:text-foreground">
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
  accentColor = "274",
}: {
  emoji: string;
  title: string;
  description: string;
  accentColor?: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card px-5 py-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-border/70">
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-sm"
        style={{
          background: `linear-gradient(135deg, oklch(0.92 0.06 ${accentColor}), oklch(0.88 0.09 ${accentColor}))`,
        }}
      >
        {emoji}
      </div>
      <h3 className="text-sm font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
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
