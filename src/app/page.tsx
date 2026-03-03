import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="text-xl font-semibold tracking-tight">plotamour</div>
        <Button asChild>
          <Link href="/auth/login">Sign in with Google</Link>
        </Button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Plan your novel.
            <br />
            Write in Google Docs.
            <br />
            <span className="text-primary">Love every word.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            A visual story planner built for hobby novelists. Outline your
            chapters, track your characters, and jump into Google Docs to write
            — all in one seamless flow.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/auth/login">Get started — it&apos;s free</Link>
            </Button>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-20 grid max-w-4xl gap-8 sm:grid-cols-3">
          <FeatureCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
              />
            }
            title="Visual Timeline"
            description="See your plotlines, chapters, and scenes on a colorful grid. Drag and drop to restructure your story."
          />
          <FeatureCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            }
            title="Google Docs Integration"
            description='Click "Write" on any scene to jump straight into a Google Doc with your outline context.'
          />
          <FeatureCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            }
            title="Story Bible"
            description="Track characters, places, and world-building details. Link them to scenes so nothing gets lost."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        plotamour is free and open source.{" "}
        <a
          href="https://github.com/kevinbuckley/plotamour"
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <svg
          className="h-6 w-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {icon}
        </svg>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
